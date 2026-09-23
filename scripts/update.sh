#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
U="http://127.0.0.1:${APP_PORT}"
step(){ printf '\n\033[1m== %s\033[0m\n' "$*"; }

step "1/4 установка, типы, тесты, сборка"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -v "$PWD":/app -w /app node:22-alpine \
  sh -c 'npm install --no-audit --no-fund --loglevel=error && npm run typecheck && npm test && npm run build'

step "2/4 коммит в v2"
git add -A && git commit -qm "${1:-v2: обновление}" && git push -q && git log -1 --oneline

step "3/4 перезапуск контейнера"
docker compose up -d --build 2>&1 | tail -3
for i in $(seq 1 40); do curl -fs "$U/health" >/dev/null && break; sleep 2; done

step "4/4 проверка"
code(){ curl -s -o /dev/null -w '%{http_code}' "$@"; }
echo "health:              $(code "$U/health")  (ждём 200)"
echo "админка /admin/:     $(code "$U/admin/")  (ждём 200)"
echo "заявки без входа:    $(code "$U/api/admin/orders")  (ждём 401)"
echo "фото /media/park:    $(code "$U/media/park/$(ls runtime/uploads/park | head -1)")  (ждём 200)"
