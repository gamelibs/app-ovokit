#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export ALGO_PORT="${ALGO_PORT:-4000}"
export ALGO_HOST="${ALGO_HOST:-0.0.0.0}"

echo "Starting Algo API on ${ALGO_HOST}:${ALGO_PORT}..."
pnpm algo:dev
