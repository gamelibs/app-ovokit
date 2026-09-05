#!/usr/bin/env bash
# =============================================================================
# GamesLog 产物发布脚本（Mac 开发机侧，main 分支运行）
# =============================================================================
# 功能：构建 Next.js standalone 产物，并通过 git worktree 发布为
# deploy/gameslog.top 分支上的一次纯产物提交（分支不含源码，服务器免构建）。
#
# 用法：
#   bash scripts/release.sh        # 或 pnpm release
#
# 流程：
#   1. 校验：当前在 main、工作区干净、.env.local 存在且 NEXT_PUBLIC_SITE_URL 为 https 真实域名
#   2. pnpm install --frozen-lockfile + pnpm build（next.config.ts 已开启 output: 'standalone'）
#   3. 组装产物：.next/standalone 全量 + 手动补 .next/static 与 public/（standalone 不自带）
#      额外放入服务器侧文件：deploy.sh / ecosystem.config.js / .env.example / .gitignore
#   4. git worktree 发布到 deploy/gameslog.top（首次为 orphan 根提交，之后快进追加）
#
# 发布后在服务器上执行 bash deploy.sh deploy 即可完成更新（详见 deploy/deploy.sh 头注释）。
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- 颜色定义（与 deploy/deploy.sh 同款） ---------------------------------------
CLR_RESET="\033[0m"
CLR_OK="\033[32m"
CLR_WARN="\033[33m"
CLR_ERR="\033[31m"
CLR_INFO="\033[36m"
CLR_BOLD="\033[1m"

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

# --- 常量 -----------------------------------------------------------------------
DEPLOY_BRANCH="deploy/gameslog.top"

# --- 工具函数 ---------------------------------------------------------------------
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

cleanup() {
  # 失败时也要清理临时 worktree 与产物目录
  if [[ -n "${WT_DIR:-}" && -d "${WT_DIR:-}" ]]; then
    git worktree remove --force "$WT_DIR" 2>/dev/null || true
  fi
  if [[ -n "${ARTIFACT_DIR:-}" && -d "${ARTIFACT_DIR:-}" ]]; then
    rm -rf "$ARTIFACT_DIR"
  fi
}
trap cleanup EXIT

START_TS=$(date +%s)

# --- 1. 校验 ----------------------------------------------------------------------
log_section "发布前校验"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  log_ok "当前分支为 main"
else
  log_err "当前分支为 ${CURRENT_BRANCH}，发布必须在 main 分支进行"
  exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
  log_ok "工作区干净"
else
  log_err "工作区存在未提交改动，请先提交或 stash 再发布"
  git status --short
  exit 1
fi

if [[ -f .env.local ]]; then
  log_ok "存在 .env.local（构建时读取，NEXT_PUBLIC_* 与 HSTS 据此烘焙）"
else
  log_err "缺少 .env.local，构建会缺失生产配置（NEXT_PUBLIC_SITE_URL 等）"
  exit 1
fi

SITE_URL=$(parse_env_value "NEXT_PUBLIC_SITE_URL")
if [[ "$SITE_URL" =~ ^https:// && ! "$SITE_URL" =~ (localhost|127\.0\.0\.1) ]]; then
  log_ok "NEXT_PUBLIC_SITE_URL=${SITE_URL}（https 真实域名）"
else
  log_err "NEXT_PUBLIC_SITE_URL 必须是 https 真实域名（当前：${SITE_URL:-空}），不允许用本地地址发布"
  exit 1
fi

for f in deploy/deploy.sh deploy/ecosystem.config.js deploy/.env.example; do
  if [[ -f "$f" ]]; then
    log_ok "存在 ${f}"
  else
    log_err "缺少 ${f}（产物需要携带的服务器侧文件）"
    exit 1
  fi
done

# --- 2. 构建 ----------------------------------------------------------------------
log_section "安装依赖并构建（standalone）"
pnpm install --frozen-lockfile
pnpm build

if [[ ! -f .next/standalone/server.js ]]; then
  log_err "未生成 .next/standalone/server.js，请确认 next.config.ts 已配置 output: 'standalone'"
  exit 1
fi
BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo "unknown")
MAIN_COMMIT=$(git rev-parse --short HEAD)
log_ok "构建完成（BUILD_ID: ${BUILD_ID}，main commit: ${MAIN_COMMIT}）"

# --- 3. 组装产物 --------------------------------------------------------------------
log_section "组装产物"

ARTIFACT_DIR=$(mktemp -d /tmp/gameslog-release.XXXXXX)

# standalone 全量（含 server.js / package.json / traced 最小 node_modules / .next/server）
cp -R .next/standalone/. "$ARTIFACT_DIR/"
# standalone 不自带 static 与 public，必须手动补
cp -R .next/static "$ARTIFACT_DIR/.next/static"
cp -R public "$ARTIFACT_DIR/public"
# 服务器侧文件（产物根）
cp deploy/deploy.sh "$ARTIFACT_DIR/deploy.sh"
chmod +x "$ARTIFACT_DIR/deploy.sh"
cp deploy/ecosystem.config.js "$ARTIFACT_DIR/ecosystem.config.js"
cp deploy/.env.example "$ARTIFACT_DIR/.env.example"
# 服务器本地文件（.env.local / .deploy-meta）不入库
printf '.env.local\n.deploy-meta\n' > "$ARTIFACT_DIR/.gitignore"

ARTIFACT_SIZE=$(du -sh "$ARTIFACT_DIR" | cut -f1)
log_ok "产物组装完成（${ARTIFACT_SIZE}）：standalone + .next/static + public + deploy.sh/ecosystem.config.js/.env.example"

# --- 4. 发布到 deploy 分支（git worktree） -------------------------------------------
log_section "发布到 ${DEPLOY_BRANCH}"

WT_DIR=$(mktemp -d /tmp/gameslog-deploy-wt.XXXXXX)
rmdir "$WT_DIR"   # git worktree add 要求路径不存在

if git show-ref --verify --quiet "refs/heads/$DEPLOY_BRANCH"; then
  # 分支已存在：基于它追加一次产物提交
  git worktree add "$WT_DIR" "$DEPLOY_BRANCH"
  # 清空旧产物（保留 .git 指针文件）
  find "$WT_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
  log_info "在既有产物分支上快进追加"
else
  # 首次：创建 orphan 分支（干净历史，不含源码）
  git worktree add "$WT_DIR" --detach HEAD
  git -C "$WT_DIR" checkout --orphan "$DEPLOY_BRANCH"
  git -C "$WT_DIR" rm -rf . >/dev/null 2>&1 || true
  log_info "创建 orphan 产物分支（不含源码历史）"
fi

cp -R "$ARTIFACT_DIR/." "$WT_DIR/"
git -C "$WT_DIR" add -A

DEPLOY_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if git -C "$WT_DIR" diff --cached --quiet; then
  log_warn "产物内容与上一次发布完全一致，跳过提交"
else
  git -C "$WT_DIR" commit -m "产物：main ${MAIN_COMMIT}（${DEPLOY_TIME}）" >/dev/null
  log_ok "产物已提交：$(git -C "$WT_DIR" log -1 --format='%h %s')"
fi

git worktree remove --force "$WT_DIR"
WT_DIR=""
rm -rf "$ARTIFACT_DIR"
ARTIFACT_DIR=""
trap - EXIT

DURATION=$(( $(date +%s) - START_TS ))
echo
log_ok "发布完成，总耗时 ${DURATION}s"
log_info "产物分支: ${DEPLOY_BRANCH}（$(git rev-parse --short "$DEPLOY_BRANCH")）"
log_info "服务器更新：在服务器仓库执行 bash deploy.sh deploy"
log_warn "本脚本不执行 git push，推送请人工确认后执行：git push origin ${DEPLOY_BRANCH}"
