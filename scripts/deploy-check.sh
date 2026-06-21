#!/usr/bin/env bash
# =============================================================================
# OVOFROGE 部署环境检查脚本
# =============================================================================
# 用法：在服务器拉取代码后运行
#   bash scripts/deploy-check.sh
#
# 功能：
#   - 检查 Node / pnpm / git / pm2 / Nginx / firewall 等基础环境
#   - 检查 .env.local 中必须的环境变量与安全性
#   - 检查 PM2 配置文件、构建产物、端口监听状态
#   - 检查防火墙是否暴露了不应公开的应用端口
#   - 尝试连接 Upstash Redis
#
# 退出码：
#   0  - 通过（可能有 warning，但无 error）
#   1  - 存在 error，不满足部署条件
# =============================================================================

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- 颜色定义 ----------------------------------------------------------------
CLR_RESET="\033[0m"
CLR_OK="\033[32m"
CLR_WARN="\033[33m"
CLR_ERR="\033[31m"
CLR_INFO="\033[36m"
CLR_BOLD="\033[1m"

# --- 计数器 ------------------------------------------------------------------
ERRORS=0
WARNINGS=0

# --- 日志函数 ----------------------------------------------------------------
log_section() {
  echo
  echo -e "${CLR_BOLD}${CLR_INFO}▶ $1${CLR_RESET}"
}

log_ok() {
  echo -e "${CLR_OK}  ✓${CLR_RESET} $1"
}

log_warn() {
  echo -e "${CLR_WARN}  ⚠${CLR_RESET} $1"
  ((WARNINGS++)) || true
}

log_warnf() {
  local msg
  printf -v msg "$@"
  log_warn "$msg"
}

log_err() {
  echo -e "${CLR_ERR}  ✗${CLR_RESET} $1"
  ((ERRORS++)) || true
}

log_errf() {
  local msg
  printf -v msg "$@"
  log_err "$msg"
}

log_info() {
  echo -e "    $1"
}

# --- 工具函数 ----------------------------------------------------------------
require_command() {
  local cmd=$1
  local level=${2:-error}
  if command -v "$cmd" &>/dev/null; then
    log_ok "已安装 $cmd ($(command -v "$cmd"))"
    return 0
  else
    if [[ "$level" == "warn" ]]; then
      log_warn "未安装 $cmd"
    else
      log_err "未安装 $cmd"
    fi
    return 1
  fi
}

version_gte() {
  local v1=$1
  local v2=$2
  # shellcheck disable=SC2046
  if printf '%s\n%s\n' "$v1" "$v2" | sort -V -C; then
    [[ "$v1" != "$v2" ]] || return 0
  fi
  [[ "$(printf '%s\n%s\n' "$v1" "$v2" | sort -V | head -n1)" == "$v2" ]]
}

parse_env_value() {
  local key=$1
  local file=${2:-.env.local}
  local line val
  if [[ -f "$file" ]]; then
    while IFS= read -r line; do
      if [[ "$line" =~ ^${key}= ]]; then
        val="${line#*=}"
        # 去除首尾单/双引号
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

# --- 开始检查 ----------------------------------------------------------------
echo -e "${CLR_BOLD}"
echo "==================================================================="
echo "  OVOFROGE 部署环境检查"
echo "  工作目录: $ROOT_DIR"
echo "==================================================================="
echo -e "${CLR_RESET}"

# 1. 基础环境
log_section "基础环境"

CURRENT_USER=$(whoami)
if [[ "$CURRENT_USER" == "root" ]]; then
  log_warn "当前用户是 root，建议用普通用户运行 Node 应用"
else
  log_ok "当前用户: $CURRENT_USER"
fi

if [[ -f /etc/os-release ]]; then
  OS_NAME=$(grep '^NAME=' /etc/os-release | cut -d'=' -f2- | tr -d '"')
  OS_VERSION=$(grep '^VERSION_ID=' /etc/os-release | cut -d'=' -f2- | tr -d '"')
  log_info "操作系统: $OS_NAME $OS_VERSION"
  if [[ "$OS_NAME" =~ (CentOS|Rocky|Red Hat|RHEL) ]]; then
    log_ok "检测到 CentOS/RHEL/Rocky 系列"
  else
    log_warn "未检测到 CentOS/RHEL/Rocky，部分防火墙/包管理命令可能需要手动调整"
  fi
else
  log_warn "无法识别操作系统"
fi

# 2. 必要命令
log_section "必要命令"

require_command node
require_command pnpm
require_command git
require_command pm2
require_command curl
require_command nginx warn

# 3. Node 版本
log_section "Node 版本"

NODE_VERSION=$(node --version 2>/dev/null | sed 's/^v//')
if [[ -n "$NODE_VERSION" ]]; then
  log_info "Node 版本: $NODE_VERSION"
  if version_gte "$NODE_VERSION" "20.0.0"; then
    log_ok "Node 版本 >= 20.0.0"
  else
    log_err "Node 版本过低，需要 >= 20.0.0"
  fi
else
  log_err "无法获取 Node 版本"
fi

# 4. Git 状态
log_section "Git 状态"

if [[ -d .git ]]; then
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  log_info "当前分支: $GIT_BRANCH"
  log_info "当前 commit: $GIT_COMMIT"

  GIT_STATUS=$(git status --short 2>/dev/null)
  if [[ -z "$GIT_STATUS" ]]; then
    log_ok "工作区干净"
  else
    log_warn "工作区存在未提交/未跟踪文件："
    echo "$GIT_STATUS" | while read -r line; do
      echo -e "      ${CLR_WARN}$line${CLR_RESET}"
    done
  fi
else
  log_err "当前目录不是 Git 仓库"
fi

# 5. 依赖与配置
log_section "项目依赖与配置"

if [[ -f package.json ]]; then
  log_ok "存在 package.json"
else
  log_err "缺少 package.json"
fi

if [[ -f pnpm-lock.yaml ]]; then
  log_ok "存在 pnpm-lock.yaml"
else
  log_warn "缺少 pnpm-lock.yaml，建议生成并提交"
fi

if [[ -d node_modules ]]; then
  log_ok "已安装 node_modules"
  if [[ -x node_modules/.bin/next ]]; then
    log_ok "Next.js CLI 可用"
  else
    log_err "node_modules 不完整，缺少 Next.js CLI"
  fi
else
  log_err "未找到 node_modules，请先运行 pnpm install"
fi

for cfg in ecosystem.web.config.js ecosystem.algo.config.js next.config.ts; do
  if [[ -f "$cfg" ]]; then
    log_ok "存在 $cfg"
  else
    log_errf "缺少 %s" "$cfg"
  fi
done

# 6. 环境变量
log_section "环境变量"

if [[ -f .env.local ]]; then
  log_ok "存在 .env.local"

  ENV_PERMS=$(stat -c '%a' .env.local 2>/dev/null || stat -f '%Lp' .env.local 2>/dev/null)
  if [[ -n "$ENV_PERMS" ]]; then
    log_info ".env.local 权限: $ENV_PERMS"
    if [[ "$ENV_PERMS" == "600" ]]; then
      log_ok ".env.local 权限正确（仅所有者可读写）"
    elif [[ "$ENV_PERMS" =~ ^60 ]]; then
      log_warnf ".env.local 权限为 %s，建议 chmod 600 .env.local" "$ENV_PERMS"
    else
      log_errf ".env.local 权限过大（%s），存在泄露风险，请执行 chmod 600 .env.local" "$ENV_PERMS"
    fi
  fi
else
  log_err "缺少 .env.local，请从 .env.example 复制并填写"
fi

REQUIRED_VARS=(
  "NEXT_PUBLIC_SITE_URL"
  "MOD_PASSWORD"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
)

for var in "${REQUIRED_VARS[@]}"; do
  val=$(env_value "$var")
  if [[ -n "$val" && "$val" != "your_"* && "$val" != "http://localhost"* ]]; then
    log_ok "$var 已配置"
  else
    log_errf "%s 未配置或为占位值" "$var"
  fi
done

SITE_URL=$(env_value "NEXT_PUBLIC_SITE_URL")
if [[ -n "$SITE_URL" ]]; then
  if [[ "$SITE_URL" =~ ^https:// ]]; then
    log_ok "NEXT_PUBLIC_SITE_URL 使用 HTTPS"
    if [[ "$SITE_URL" =~ (localhost|127\.0\.0\.1) ]]; then
      log_warn "NEXT_PUBLIC_SITE_URL 包含 localhost/127.0.0.1，生产环境请使用真实域名"
    fi
  else
    log_warn "NEXT_PUBLIC_SITE_URL 未使用 HTTPS，生产环境建议启用 SSL"
  fi
fi

MOD_PASSWORD=$(env_value "MOD_PASSWORD")
if [[ -n "$MOD_PASSWORD" ]]; then
  if [[ "${#MOD_PASSWORD}" -ge 16 ]]; then
    log_ok "MOD_PASSWORD 长度符合要求（>=16 位）"
  else
    log_err "MOD_PASSWORD 长度不足 16 位，存在被暴力破解风险"
  fi

  if [[ "$MOD_PASSWORD" == "your_mod_password" || "$MOD_PASSWORD" == "admin" || "$MOD_PASSWORD" == "123456" ]]; then
    log_err "MOD_PASSWORD 使用了弱口令或示例值，请更换"
  fi
fi

# 7. Redis 连通性
log_section "Redis 连通性"

REDIS_URL=$(env_value "UPSTASH_REDIS_REST_URL")
REDIS_TOKEN=$(env_value "UPSTASH_REDIS_REST_TOKEN")

if [[ -n "$REDIS_URL" && -n "$REDIS_TOKEN" && "$REDIS_URL" =~ ^https?:// ]]; then
  # Upstash Redis REST API 的 PING 路径
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $REDIS_TOKEN" \
    -H "Content-Type: application/json" \
    "${REDIS_URL%/}/ping" 2>/dev/null || echo "000")

  if [[ "$HTTP_CODE" == "200" ]]; then
    log_ok "Upstash Redis 可连通（HTTP 200）"
  else
    log_warnf "Upstash Redis 连通性测试返回 HTTP %s，请检查 URL 与 Token" "$HTTP_CODE"
  fi
else
  log_warn "Redis 未配置，生产环境统计将回退到文件系统（重启/多实例会丢数据）"
fi

# 8. 构建产物
log_section "构建产物"

if [[ -d .next && -f .next/BUILD_ID ]]; then
  BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null)
  log_ok "存在 .next 构建产物 (BUILD_ID: ${BUILD_ID:-unknown})"
else
  log_warn "尚未构建 .next 产物，请运行 pnpm build"
fi

if [[ -d public ]]; then
  log_ok "存在 public 静态资源目录"
else
  log_warn "缺少 public 目录"
fi

# 9. 端口监听与安全
log_section "端口监听"

WEB_PORT=$(env_value "PORT")
WEB_PORT=${WEB_PORT:-13100}
ALGO_PORT=$(env_value "ALGO_PORT")
ALGO_PORT=${ALGO_PORT:-14100}

log_info "期望前端端口: $WEB_PORT"
log_info "期望算法后端端口: $ALGO_PORT"

# 优先使用 ss，回退 lsof
PORT_CMD=""
if command -v ss &>/dev/null; then
  PORT_CMD="ss"
elif command -v lsof &>/dev/null; then
  PORT_CMD="lsof"
fi

for port in "$WEB_PORT" "$ALGO_PORT"; do
  if [[ "$PORT_CMD" == "ss" ]]; then
    LISTEN=$(ss -tlnp 2>/dev/null | grep -E ":${port}\b")
  elif [[ "$PORT_CMD" == "lsof" ]]; then
    LISTEN=$(lsof -Pi :"$port" -sTCP:LISTEN 2>/dev/null)
  else
    LISTEN=""
  fi

  if [[ -n "$LISTEN" ]]; then
    log_ok "端口 $port 正在监听"
    if [[ "$LISTEN" =~ 0\.0\.0\.0 || "$LISTEN" =~ \*:\* ]]; then
      if [[ "$port" == "$ALGO_PORT" ]]; then
        log_warnf "算法后端端口 %s 监听在 0.0.0.0，建议仅监听 127.0.0.1（通过 Nginx 或 Next.js 内部访问）" "$port"
      fi
    fi
  else
    log_warnf "端口 %s 未监听，服务可能尚未启动" "$port"
  fi
done

# 10. Nginx 与 SSL
log_section "Nginx 与 SSL"

if command -v nginx &>/dev/null; then
  if sudo nginx -t &>/dev/null 2>&1; then
    log_ok "Nginx 配置语法正确"
  else
    log_err "Nginx 配置测试失败，请执行 sudo nginx -t 查看详情"
  fi

  if systemctl is-active --quiet nginx 2>/dev/null; then
    log_ok "Nginx 正在运行"
  else
    log_warn "Nginx 未运行，请执行 sudo systemctl start nginx"
  fi

  # 检查是否禁止 .git 访问
  NGINX_CONF_DIR="/etc/nginx"
  if grep -Rq "location ~ /\\.git" "$NGINX_CONF_DIR" 2>/dev/null; then
    log_ok "Nginx 已配置禁止 .git 访问"
  else
    log_warn "Nginx 未明确禁止 .git 访问，建议添加 location ~ /\\.git { deny all; }"
  fi
else
  log_warn "未安装 Nginx，生产环境建议使用 Nginx 做反向代理与 SSL 终结"
fi

# 11. 防火墙
log_section "防火墙"

if command -v firewall-cmd &>/dev/null; then
  if sudo firewall-cmd --state &>/dev/null 2>&1; then
    log_ok "firewalld 正在运行"

    PUBLIC_PORTS=$(sudo firewall-cmd --list-ports 2>/dev/null)
    if [[ "$PUBLIC_PORTS" =~ (^|[[:space:]])13100/tcp || "$PUBLIC_PORTS" =~ (^|[[:space:]])14100/tcp ]]; then
      log_err "防火墙开放了 13100/tcp 或 14100/tcp，应用端口不应直接暴露到公网"
    else
      log_ok "未在 firewalld 中暴露应用端口"
    fi

    if [[ "$PUBLIC_PORTS" =~ (^|[[:space:]])80/tcp && "$PUBLIC_PORTS" =~ (^|[[:space:]])443/tcp ]]; then
      log_ok "HTTP/HTTPS 端口已开放"
    else
      log_warn "firewalld 未开放 80/tcp 或 443/tcp，请确保 Nginx 可被公网访问"
    fi
  else
    log_warn "firewalld 未运行"
  fi
elif command -v ufw &>/dev/null; then
  if sudo ufw status | grep -q "Status: active"; then
    log_ok "ufw 正在运行"
    if sudo ufw status | grep -qE "13100|14100"; then
      log_err "ufw 开放了 13100 或 14100，应用端口不应直接暴露到公网"
    else
      log_ok "未在 ufw 中暴露应用端口"
    fi
  else
    log_warn "ufw 未启用"
  fi
else
  log_warn "未检测到 firewalld 或 ufw，请确认防火墙已配置"
fi

# 12. 健康检查
log_section "健康检查"

if curl -sf "http://127.0.0.1:${WEB_PORT}/" >/dev/null 2>&1; then
  log_ok "前端首页可访问（http://127.0.0.1:$WEB_PORT/）"
else
  log_warn "前端首页无法访问，服务可能未启动或正在启动"
fi

if curl -sf "http://127.0.0.1:${ALGO_PORT}/health" >/dev/null 2>&1; then
  log_ok "算法后端健康检查通过（http://127.0.0.1:$ALGO_PORT/health）"
else
  log_warn "算法后端健康检查失败"
fi

# --- 总结 --------------------------------------------------------------------
echo
if [[ "$ERRORS" -eq 0 && "$WARNINGS" -eq 0 ]]; then
  echo -e "${CLR_OK}${CLR_BOLD}✅ 全部通过，符合部署条件${CLR_RESET}"
  exit 0
elif [[ "$ERRORS" -eq 0 ]]; then
  echo -e "${CLR_WARN}${CLR_BOLD}⚠ 通过，但存在 $WARNINGS 个警告，建议修复后再部署${CLR_RESET}"
  exit 0
else
  echo -e "${CLR_ERR}${CLR_BOLD}✗ 不符合部署条件：$ERRORS 个错误，$WARNINGS 个警告${CLR_RESET}"
  exit 1
fi
