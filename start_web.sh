#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# OVO - 一键启动前后端开发服务
# =============================================================================
# 用法: ./start_web.sh
# 环境变量:
#   WEB_PORT   - 前端端口 (默认: 13100)
#   ALGO_PORT  - 后端端口 (默认: 14100)
#   ALGO_HOST  - 后端监听地址 (默认: 0.0.0.0)
# =============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# --- 颜色定义 ----------------------------------------------------------------
CLR_RESET="\033[0m"
CLR_WEB="\033[36m"   # 青色 - 前端
CLR_API="\033[33m"   # 黄色 - 后端
CLR_ERR="\033[31m"   # 红色 - 错误
CLR_OK="\033[32m"    # 绿色 - 成功
CLR_INFO="\033[35m"  # 紫色 - 信息

# --- 配置 --------------------------------------------------------------------
WEB_PORT="${WEB_PORT:-13100}"
ALGO_PORT="${ALGO_PORT:-14100}"
ALGO_HOST="${ALGO_HOST:-0.0.0.0}"

export ALGO_PORT
export ALGO_HOST

# --- 工具函数 ----------------------------------------------------------------
log_info() {
  echo -e "${CLR_INFO}[OVO]${CLR_RESET} $1"
}

log_web() {
  echo -e "${CLR_WEB}[WEB ]${CLR_RESET} $1"
}

log_api() {
  echo -e "${CLR_API}[API ]${CLR_RESET} $1"
}

log_err() {
  echo -e "${CLR_ERR}[ERR ]${CLR_RESET} $1" >&2
}

# 检查端口是否被占用
check_port() {
  local port=$1
  if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# --- 前置检查 ----------------------------------------------------------------

# 检查 pnpm
if ! command -v pnpm &>/dev/null; then
  log_err "未找到 pnpm，请先安装: npm install -g pnpm"
  exit 1
fi

log_info "工作目录: $ROOT_DIR"
log_info "前端端口: $WEB_PORT"
log_info "后端端口: $ALGO_PORT (host: $ALGO_HOST)"

# 端口冲突检测
if check_port "$WEB_PORT"; then
  log_err "端口 $WEB_PORT 已被占用，请先释放该端口或设置 WEB_PORT 环境变量"
  exit 1
fi

if check_port "$ALGO_PORT"; then
  log_err "端口 $ALGO_PORT 已被占用，请先释放该端口或设置 ALGO_PORT 环境变量"
  exit 1
fi

# --- 启动服务 ----------------------------------------------------------------

WEB_PID=""
API_PID=""

cleanup() {
  echo
  log_info "收到退出信号，正在关闭服务..."

  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    log_info "停止前端服务 (PID: $WEB_PID)..."
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi

  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    log_info "停止后端服务 (PID: $API_PID)..."
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi

  log_info "所有服务已停止。"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 启动前端
log_info "正在启动前端服务 (Next.js)..."
(
  cd "$ROOT_DIR"
  PORT=$WEB_PORT pnpm dev 2>&1 | while IFS= read -r line; do
    log_web "$line"
  done
) &
WEB_PID=$!

# 启动后端
log_info "正在启动后端服务 (Fastify API)..."
(
  cd "$ROOT_DIR"
  pnpm algo:dev 2>&1 | while IFS= read -r line; do
    log_api "$line"
  done
) &
API_PID=$!

# --- 等待服务就绪 ------------------------------------------------------------

log_info "等待服务启动..."

WEB_READY=false
API_READY=false
TIMEOUT=30
ELAPSED=0

while [[ "$ELAPSED" -lt "$TIMEOUT" ]]; do
  if ! $WEB_READY && check_port "$WEB_PORT"; then
    log_info "前端服务已就绪 → ${CLR_OK}http://localhost:$WEB_PORT${CLR_RESET}"
    WEB_READY=true
  fi

  if ! $API_READY && check_port "$ALGO_PORT"; then
    log_info "后端服务已就绪 → ${CLR_OK}http://localhost:$ALGO_PORT${CLR_RESET}"
    API_READY=true
  fi

  if $WEB_READY && $API_READY; then
    break
  fi

  sleep 1
  ((ELAPSED++)) || true

  # 检查进程是否意外退出
  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    log_err "前端服务异常退出"
    cleanup
    exit 1
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    log_err "后端服务异常退出"
    cleanup
    exit 1
  fi
done

if ! $WEB_READY || ! $API_READY; then
  log_err "服务启动超时 (${TIMEOUT}s)"
  cleanup
  exit 1
fi

echo
log_info "${CLR_OK}✓ 所有服务已启动${CLR_RESET}"
log_info "  前端: http://localhost:$WEB_PORT"
log_info "  后端: http://localhost:$ALGO_PORT"
log_info "  API Docs: http://localhost:$ALGO_PORT/docs"
log_info "按 Ctrl+C 停止所有服务"
echo

# --- 保持运行 ----------------------------------------------------------------
wait
