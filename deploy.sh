#!/usr/bin/env bash
# =============================================================================
# GamesLog（gameslog.top）服务器侧一键部署脚本（产物模式）
# =============================================================================
# 定位：deploy/gameslog.top 分支 = 纯构建产物（Next.js standalone），服务器
# 不安装依赖、不构建，直接 pm2 + node server.js 运行。
#
# 用法：
#   bash deploy.sh deploy    # 全流程：update → check → start（check 失败中止，不带病上线）
#   bash deploy.sh update    # git pull --ff-only 更新产物，打印版本变化
#   bash deploy.sh check     # 环境/配置检查（node/pm2/.env.local/端口）
#   bash deploy.sh start     # 未运行：pm2 start ecosystem.config.js；运行中：pm2 reload（零停机）
#   bash deploy.sh stop      # pm2 stop ovoforge-web
#   bash deploy.sh restart   # pm2 reload ovoforge-web（零停机）+ 健康验证
#   bash deploy.sh status    # PM2 进程摘要 + 端口监听 + 首页 HTTP 状态
#   bash deploy.sh version   # 当前产物 commit + 上次部署信息（.deploy-meta）
#
# 服务器首次部署步骤：
#   1. git clone -b deploy/gameslog.top git@github.com:gamelibs/app-ovokit.git gameslog
#      cd gameslog
#   2. cp .env.example .env.local，填写真实值（NEXT_PUBLIC_SITE_URL=https://gameslog.top、
#      强 MOD_PASSWORD、UPSTASH_REDIS_*），chmod 600 .env.local
#   3. bash deploy.sh check      # 确认环境与配置全部通过
#   4. bash deploy.sh start      # 启动并自动健康验证
#   5. 配置 Nginx 反代 127.0.0.1:13100 并启用 SSL（443），防火墙不直接暴露 13100
#
# 日常更新：bash deploy.sh deploy
#
# 约定：
#   - PM2 应用名固定 ovoforge-web，端口 PORT（默认 13100）
#   - deploy 成功后写 .deploy-meta（commit/时间/耗时，已被 .gitignore 忽略）
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# --- 颜色定义 -----------------------------------------------------------------
CLR_RESET="\033[0m"
CLR_OK="\033[32m"
CLR_WARN="\033[33m"
CLR_ERR="\033[31m"
CLR_INFO="\033[36m"
CLR_BOLD="\033[1m"

ERRORS=0

# --- 日志函数 -----------------------------------------------------------------
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
  ((ERRORS++)) || true
}

log_info() {
  echo -e "    $1"
}

# --- 常量 ---------------------------------------------------------------------
APP_NAME="ovoforge-web"
ECOSYSTEM_CONFIG="ecosystem.config.js"
DEPLOY_META_FILE=".deploy-meta"

# --- 工具函数 -----------------------------------------------------------------
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

health_check() {
  local port
  port=$(web_port)
  local url="http://127.0.0.1:${port}/"
  log_info "等待服务就绪：${url}（最多 30 秒）"
  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      log_ok "健康检查通过：${url} 返回 200"
      return 0
    fi
    sleep 1
  done
  log_err "健康检查失败：30 秒内 ${url} 未返回 200"
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
  log_ok "已写入 ${DEPLOY_META_FILE}"
}

# --- 子命令 -------------------------------------------------------------------
cmd_update() {
  log_section "更新产物（git pull --ff-only）"

  # 防呆：服务器工作区不该有本地改动，有则先 stash 并提示
  if [[ -n "$(git status --porcelain)" ]]; then
    git stash push -u -m "deploy.sh update $(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null
    log_warn "工作区存在未提交改动，已 stash（服务器不应有本地改动，请人工确认后用 git stash list / pop 处理）"
  fi

  git fetch origin --prune
  local old_commit
  old_commit=$(git rev-parse --short HEAD)

  if ! git pull --ff-only; then
    log_err "git pull --ff-only 失败：本地与远端历史分叉，请人工处理后再部署"
    exit 1
  fi

  local new_commit
  new_commit=$(git rev-parse --short HEAD)
  if [[ "$old_commit" == "$new_commit" ]]; then
    log_ok "已是最新版本（${new_commit}）"
  else
    log_ok "版本更新：${old_commit} → ${new_commit}"
    git log --oneline "${old_commit}..${new_commit}" | while read -r line; do
      log_info "$line"
    done
  fi
}

cmd_check() {
  log_section "环境与配置检查"

  # Node >= 20
  if command -v node &>/dev/null; then
    local node_version
    node_version=$(node --version | sed 's/^v//')
    local node_major=${node_version%%.*}
    if [[ "$node_major" -ge 20 ]]; then
      log_ok "Node ${node_version}（>= 20）"
    else
      log_err "Node ${node_version} 版本过低，需要 >= 20"
    fi
  else
    log_err "未安装 node（需要 >= 20）"
  fi

  # pm2
  if command -v pm2 &>/dev/null; then
    log_ok "已安装 pm2"
  else
    log_err "未安装 pm2，请执行 npm install -g pm2"
  fi

  # .env.local 存在与权限
  if [[ -f .env.local ]]; then
    log_ok "存在 .env.local"
    local perms
    perms=$(stat -c '%a' .env.local 2>/dev/null || stat -f '%Lp' .env.local 2>/dev/null)
    if [[ "$perms" == "600" ]]; then
      log_ok ".env.local 权限 600"
    else
      log_err ".env.local 权限为 ${perms}，请执行 chmod 600 .env.local"
    fi
  else
    log_err "缺少 .env.local，请执行 cp .env.example .env.local 并填写真实值"
  fi

  # 必填项非占位
  local site_url
  site_url=$(env_value "NEXT_PUBLIC_SITE_URL")
  if [[ "$site_url" =~ ^https:// && ! "$site_url" =~ (localhost|127\.0\.0\.1) ]]; then
    log_ok "NEXT_PUBLIC_SITE_URL=${site_url}（https 真实域名）"
  else
    log_err "NEXT_PUBLIC_SITE_URL 未配置为 https 真实域名（当前：${site_url:-空}）"
  fi

  local mod_password
  mod_password=$(env_value "MOD_PASSWORD")
  if [[ -n "$mod_password" && "$mod_password" != "your_"* && ${#mod_password} -ge 16 ]]; then
    log_ok "MOD_PASSWORD 已配置（长度 >= 16）"
  else
    log_err "MOD_PASSWORD 未配置、为占位值或长度不足 16 位"
  fi

  local redis_url redis_token
  redis_url=$(env_value "UPSTASH_REDIS_REST_URL")
  redis_token=$(env_value "UPSTASH_REDIS_REST_TOKEN")
  if [[ "$redis_url" =~ ^https:// && "$redis_url" != *"your"* && -n "$redis_token" && "$redis_token" != "your_"* ]]; then
    log_ok "UPSTASH_REDIS_* 已配置"
  else
    log_err "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 未配置或为占位值（生产统计需要）"
  fi

  # 端口
  local port
  port=$(web_port)
  log_info "期望端口: ${port}"
  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -qE ":${port}\b"; then log_ok "端口 ${port} 正在监听"; else log_warn "端口 ${port} 未监听（服务未启动时正常）"; fi
  elif command -v lsof &>/dev/null; then
    if lsof -Pi :"$port" -sTCP:LISTEN >/dev/null 2>&1; then log_ok "端口 ${port} 正在监听"; else log_warn "端口 ${port} 未监听（服务未启动时正常）"; fi
  fi

  echo
  if [[ "$ERRORS" -eq 0 ]]; then
    log_ok "检查通过"
    return 0
  else
    log_err "检查未通过：${ERRORS} 个错误"
    return 1
  fi
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
    log_ok "已停止 ${APP_NAME}"
  else
    log_warn "${APP_NAME} 未在 PM2 中运行"
  fi
}

cmd_restart() {
  log_section "重启服务（${APP_NAME}，零停机 reload）"
  require_pm2
  if ! pm2_app_exists; then
    log_err "${APP_NAME} 未在 PM2 中运行，请先执行：bash deploy.sh start"
    exit 1
  fi
  pm2 reload "$APP_NAME"
  health_check
}

cmd_status() {
  log_section "服务状态（${APP_NAME}）"
  require_pm2
  if pm2_app_exists; then
    pm2 describe "$APP_NAME" | grep -E "status|uptime|restarts|memory|cpu|script" | sed 's/^[│ ]*/  /' || true
  else
    log_warn "${APP_NAME} 未在 PM2 中运行"
  fi

  local port
  port=$(web_port)
  log_info "期望端口: ${port}"
  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -qE ":${port}\b"; then log_ok "端口 ${port} 正在监听"; else log_warn "端口 ${port} 未监听"; fi
  elif command -v lsof &>/dev/null; then
    if lsof -Pi :"$port" -sTCP:LISTEN >/dev/null 2>&1; then log_ok "端口 ${port} 正在监听"; else log_warn "端口 ${port} 未监听"; fi
  fi

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    log_ok "首页 HTTP ${http_code}（http://127.0.0.1:${port}/）"
  else
    log_warn "首页 HTTP ${http_code}（http://127.0.0.1:${port}/）"
  fi
}

cmd_version() {
  log_section "版本信息"
  log_info "分支: $(git rev-parse --abbrev-ref HEAD)"
  log_info "commit: $(git rev-parse --short HEAD)（$(git log -1 --format=%s)）"
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
  local start_ts
  start_ts=$(date +%s)

  echo -e "${CLR_BOLD}"
  echo "==================================================================="
  echo "  GamesLog 一键部署（产物模式）"
  echo "  工作目录: $ROOT_DIR"
  echo "==================================================================="
  echo -e "${CLR_RESET}"

  cmd_update
  # check 失败（exit 1）会被 set -e 中止，不带病上线
  cmd_check
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
  deploy)  cmd_deploy  ;;
  update)  cmd_update  ;;
  check)   cmd_check   ;;
  start)   cmd_start   ;;
  stop)    cmd_stop    ;;
  restart) cmd_restart ;;
  status)  cmd_status  ;;
  version) cmd_version ;;
  *)
    echo "用法: bash deploy.sh {deploy|update|check|start|stop|restart|status|version}"
    echo "详见脚本头部注释。"
    exit 1
    ;;
esac
