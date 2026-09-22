#!/usr/bin/env bash
# Деплой: дамп базы -> код из origin/main -> пересборка -> проверка здоровья.
set -Eeuo pipefail
cd /opt/projects/planeta-igr

./scripts/backup-server.sh

git fetch --quiet origin main
git reset --hard origin/main
mkdir -p runtime/uploads runtime/data/orders runtime/admin

docker compose config --quiet
docker compose build web
docker compose up -d --no-deps --force-recreate web
docker compose up -d --remove-orphans
[ "$(docker inspect planeta-igr-web --format "{{.Image}}")" = "$(docker image inspect planeta-igr-web --format "{{.Id}}")" ] || { echo "ОШИБКА: контейнер на старом образе"; exit 1; }
docker image prune -f > /dev/null

for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo "[$(date '+%F %T')] health OK ($((i*2)) сек)"; docker compose ps; exit 0
  fi
  sleep 2
done
echo "[$(date '+%F %T')] health FAIL"; docker compose logs --tail 60 web; exit 1
