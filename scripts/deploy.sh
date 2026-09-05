#!/usr/bin/env bash
# =============================================================================
# GamesLog（gameslog.top）服务器侧一键部署脚本
# =============================================================================
# 定位：服务器上拉取代码后的「更新版本 → 检查配置 → 构建 → 启动/重启 → 健康验证」
# 全流程。环境检查复用 scripts/deploy-check.sh，不重复实现。
#
# 用法：
#   bash scripts/deploy.sh deploy [ref]   # 全流程：update → check → build → start → 健康验证
#   bash scripts/deploy.sh update [ref]   # 切换到指定 ref（默认 deploy/gameslog.top）并 ff-only 拉取
#   bash scripts/deploy.sh check          # 调用 scripts/deploy-check.sh 做部署环境检查
#   bash scripts/deploy.sh build          # pnpm install --frozen-lockfile + pnpm build
#   bash scripts/deploy.sh start          # 未运行：pm2 start ecosystem.web.config.js；运行中：pm2 reload（零停机）
#   bash scripts/deploy.sh stop           # pm2 stop ovoforge-web
#   bash scripts/deploy.sh restart        # pm2 reload ovoforge-web（零停机）
#   bash scripts/deploy.sh status         # PM2 进程摘要 + 端口监听 + 首页 HTTP 状态
#   bash scripts/deploy.sh version        # 当前 commit/分支/构建 BUILD_ID/上次部署时间
#
# 服务器首次部署步骤：
#   1. git clone git@github.com:gamelibs/app-ovokit.git && cd app-ovokit
#   2. cp .env.example .env.local，填写真实值（NEXT_PUBLIC_SITE_URL=https://gameslog.top、
#      MOD_PASSWORD、UPSTASH_REDIS_* 等），并 chmod 600 .env.local
#   3. bash scripts/deploy.sh deploy           # 默认部署 deploy/gameslog.top 分支
#   4. 配置 Nginx 反代 127.0.0.1:13100 并启用 SSL（见 doc/docker-deployment.md / deploy-check.sh 检查项）
#
# 约定：
#   - PM2 应用名固定为 ovoforge-web（ecosystem.web.config.js），端口 PORT（默认 13100）
#   - deploy 成功后写 .deploy-meta（不入 git）：commit、分支、部署时间、耗时
#   - check 失败（exit 1）会中止 deploy，不带病上线
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- 颜色定义（与 scripts/deploy-check.sh 同款） -------------------------------
CLR_RESET="\033[0m"
CLR_OK="\033[32m"
CLR_WARN="\033[33m"
CLR_ERR="\033[31m"
CLR_INFO="\033[36m"
CLR_BOLD="\033[1m"

# --- 日志函数（与 scripts/deploy-check.sh 同款） -------------------------------
log_section() {
  echo
  echo -e "${CLR_BOLD}${CLR_INFO}▶ $1${CLR_RESET}"
}

log_ok() {
  echo -e "${CLR_OK}  ✓${CLR_RESET} $1"
}

log_warn() {
  echo -e "${CLR_WARN}  ⚠${CLR_RESET} $1"
}

log_err() {
  echo -e "${CLR_ERR}  ✗${CLR_RESET} $1" >&2
}

log_info() {
  echo -e "    $1"
}

# --- 常量 ---------------------------------------------------------------------
APP_NAME="ovoforge-web"
DEFAULT_REF="deploy/gameslog.top"
ECOSYSTEM_CONFIG="ecosystem.web.config.js"
DEPLOY_META_FILE=".deploy-meta"

# --- 工具函数 -----------------------------------------------------------------
# 从环境变量或 .env.local 读取配置值
parse_env_value() {
  local key=$1
  local file=${2:-.env.local}
  local line val
  if [[ -f "$file" ]]; then
    while IFS= read -r line; do
      if [[ "$line" =~ ^${key}= ]]; then
        val="${line#*=}"
        val="${val#\"}"; val="${val%\"}"
        val="${val#\'}"; val="${val%\'}"
        printf '%s\n' "$val"
        return
      fi
    done < "$file"
  fi
}

env_value() {
  local key=$1
  local val=${!key:-}
  if [[ -z "$val" ]]; then
    val=$(parse_env_value "$key")
  fi
  echo "$val"
}

web_port() {
  local port
  port=$(env_value "PORT")
  echo "${port:-13100}"
}

require_pm2() {
  if ! command -v pm2 &>/dev/null; then
    log_err "未安装 pm2，请先执行 npm install -g pm2"
    exit 1
  fi
}

pm2_app_exists() {
  pm2 describe "$APP_NAME" &>/dev/null
}

# 启动后健康验证：循环 curl 首页最多 30 秒，200 才算成功
health_check() {
  local port
  port=$(web_port)
  local url="http://127.0.0.1:${port}/"
  log_info "等待服务就绪：${url}（最多 30 秒）"
  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      log_ok "健康检查通过：$url 返回 200"
      return 0
    fi
    sleep 1
  done
  log_err "健康检查失败：30 秒内 $url 未返回 200"
  log_info "最近 50 行 PM2 日志："
  pm2 logs "$APP_NAME" --lines 50 --nostream || true
  return 1
}

write_deploy_meta() {
  local duration=$1
  cat > "$DEPLOY_META_FILE" <<EOF
commit=$(git rev-parse HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
deployed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
duration_seconds=$duration
EOF
  log_ok "已写入 ${DEPLOY_META_FILE}（不入 git）"
}

# --- 子命令 -------------------------------------------------------------------
cmd_update() {
  local ref=${1:-$DEFAULT_REF}
  log_section "更新代码（ref: ${ref}）"

  # 防呆：服务器工作区不该有本地改动，有则先 stash 并提示
  if [[ -n "$(git status --porcelain)" ]]; then
    git stash push -u -m "deploy.sh update $(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null
    log_warn "工作区存在未提交改动，已 stash（服务器不应有本地改动，请人工确认后用 git stash list / pop 处理）"
  fi

  git fetch origin --prune
  local old_commit
  old_commit=$(git rev-parse --short HEAD)

  # 本地分支 → 直接切换；远端分支 → 基于 origin/<ref> 建立/重置本地分支；否则按 tag/commit 分离头检出
  if git show-ref --verify --quiet "refs/heads/$ref"; then
    git checkout "$ref"
  elif git show-ref --verify --quiet "refs/remotes/origin/$ref"; then
    git checkout -B "$ref" "origin/$ref"
  else
    log_warn "$ref 不是本地/远端分支，按 tag/commit 分离头检出（跳过 pull）"
    git checkout --detach "$ref"
  fi

  # 分支模式下 ff-only 拉取；不能 ff 说明历史分叉，报错人工介入
  if git symbolic-ref -q HEAD >/dev/null; then
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD)
    if ! git pull --ff-only origin "$branch"; then
      log_err "git pull --ff-only 失败：本地与远端历史分叉，请人工处理后再部署"
      exit 1
    fi
  fi

  local new_commit
  new_commit=$(git rev-parse --short HEAD)
  if [[ "$old_commit" == "$new_commit" ]]; then
    log_ok "已是最新版本（${new_commit}）"
  else
    log_ok "版本更新：$old_commit → $new_commit"
    git log --oneline "$old_commit..$new_commit" | while read -r line; do
      log_info "$line"
    done
  fi
}

cmd_check() {
  log_section "部署环境检查"
  bash scripts/deploy-check.sh
}

cmd_build() {
  log_section "安装依赖并构建"
  pnpm install --frozen-lockfile
  pnpm build
  log_ok "构建完成（BUILD_ID: $(cat .next/BUILD_ID 2>/dev/null || echo unknown)）"
}

cmd_start() {
  log_section "启动服务（${APP_NAME}）"
  require_pm2
  if pm2_app_exists; then
    log_info "进程已存在，使用 pm2 reload 零停机重启"
    pm2 reload "$APP_NAME"
  else
    pm2 start "$ECOSYSTEM_CONFIG"
  fi
  health_check
}

cmd_stop() {
  log_section "停止服务（${APP_NAME}）"
  require_pm2
  if pm2_app_exists; then
    pm2 stop "$APP_NAME"
    log_ok "已停止 $APP_NAME"
  else
    log_warn "$APP_NAME 未在 PM2 中运行"
  fi
}

cmd_restart() {
  log_section "重启服务（${APP_NAME}，零停机 reload）"
  require_pm2
  if ! pm2_app_exists; then
    log_err "$APP_NAME 未在 PM2 中运行，请先执行：bash scripts/deploy.sh start"
    exit 1
  fi
  pm2 reload "$APP_NAME"
  health_check
}

cmd_status() {
  log_section "服务状态（${APP_NAME}）"
  require_pm2
  if pm2_app_exists; then
    pm2 describe "$APP_NAME" | grep -E "status|uptime|restarts|memory|cpu|script args" | sed 's/^[│ ]*/  /' || true
  else
    log_warn "$APP_NAME 未在 PM2 中运行"
  fi

  local port
  port=$(web_port)
  log_info "期望端口: $port"
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -E ":${port}\b" >/dev/null && log_ok "端口 $port 正在监听" || log_warn "端口 $port 未监听"
  elif command -v lsof &>/dev/null; then
    lsof -Pi :"$port" -sTCP:LISTEN >/dev/null 2>&1 && log_ok "端口 $port 正在监听" || log_warn "端口 $port 未监听"
  fi

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    log_ok "首页 HTTP ${http_code}（http://127.0.0.1:$port/）"
  else
    log_warn "首页 HTTP ${http_code}（http://127.0.0.1:$port/）"
  fi
}

cmd_version() {
  log_section "版本信息"
  log_info "分支: $(git rev-parse --abbrev-ref HEAD)"
  log_info "commit: $(git rev-parse --short HEAD) ($(git log -1 --format=%s))"
  if [[ -f .next/BUILD_ID ]]; then
    log_ok "构建 BUILD_ID: $(cat .next/BUILD_ID)"
  else
    log_warn "尚未构建 .next 产物"
  fi
  if [[ -f "$DEPLOY_META_FILE" ]]; then
    log_ok "上次部署："
    while IFS= read -r line; do
      log_info "$line"
    done < "$DEPLOY_META_FILE"
  else
    log_info "无 ${DEPLOY_META_FILE}（尚未通过 deploy.sh 部署过）"
  fi
}

cmd_deploy() {
  local ref=${1:-$DEFAULT_REF}
  local start_ts
  start_ts=$(date +%s)

  echo -e "${CLR_BOLD}"
  echo "==================================================================="
  echo "  GamesLog 一键部署（ref: ${ref}）"
  echo "  工作目录: $ROOT_DIR"
  echo "==================================================================="
  echo -e "${CLR_RESET}"

  cmd_update "$ref"
  # check 失败（exit 1）会被 set -e 中止，不带病上线
  cmd_check
  cmd_build
  cmd_start

  local duration=$(( $(date +%s) - start_ts ))
  write_deploy_meta "$duration"
  echo
  log_ok "部署完成，总耗时 ${duration}s"
  cmd_version
}

# --- 入口 ---------------------------------------------------------------------
SUBCOMMAND=${1:-}
case "$SUBCOMMAND" in
  deploy)  cmd_deploy "${2:-}"  ;;
  update)  cmd_update "${2:-}"  ;;
  check)   cmd_check            ;;
  build)   cmd_build            ;;
  start)   cmd_start            ;;
  stop)    cmd_stop             ;;
  restart) cmd_restart          ;;
  status)  cmd_status           ;;
  version) cmd_version          ;;
  *)
    echo "用法: bash scripts/deploy.sh {deploy|update|check|build|start|stop|restart|status|version} [ref]"
    echo "详见脚本头部注释。"
    exit 1
    ;;
esac
