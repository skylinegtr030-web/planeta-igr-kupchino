#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="/opt/projects/planeta-igr"
BACKUPS="/opt/backups/planeta-igr"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"

cd "$PROJECT"

mkdir -p \
  "$BACKUPS" \
  runtime/data/orders \
  runtime/uploads \
  runtime/admin

if [ -f .env ]; then
  cp .env "$BACKUPS/env-$DATE.backup"
  chmod 600 "$BACKUPS/env-$DATE.backup"
fi

tar \
  --exclude='*.log' \
  -czf "$BACKUPS/runtime-$DATE.tar.gz" \
  runtime 2>/dev/null || true

git fetch origin main
git reset --hard origin/main

mkdir -p \
  runtime/data/orders \
  runtime/uploads \
  runtime/admin

docker compose config --quiet
docker compose up -d --build --remove-orphans

sleep 10
curl --fail --silent --show-error http://127.0.0.1:3001/health

find "$BACKUPS" -type f -mtime +30 -delete

echo
echo "Деплой завершён: $(date)"
docker compose ps
