#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

if ! curl -sf "http://127.0.0.1:${PORT}/api/todos" >/dev/null 2>&1; then
  exec npm start
else
  echo "Todo app already listening on port ${PORT}"
fi
