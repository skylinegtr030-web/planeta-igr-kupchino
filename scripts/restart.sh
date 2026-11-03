#!/usr/bin/env bash
# Перезапуск сервера «Планеты Игр» (только этого сайта)
set -euo pipefail
cd "$(dirname "$0")/.."
pkill -f "$HOME/node/bin/node apps/api/dist/index.js" || true
sleep 1
./run.sh
for i in $(seq 1 30); do curl -fs http://127.0.0.1:${PORT:-3003}/health >/dev/null && { echo "ok: сайт работает"; exit 0; }; sleep 1; done
echo "сервер не ответил, смотри server.log"; exit 1
