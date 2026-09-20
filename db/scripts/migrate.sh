#!/usr/bin/env bash
# Запускать на VPS один раз после первого деплоя с PostgreSQL
# Использование: bash db/scripts/migrate.sh
set -Eeuo pipefail

PROJECT="/opt/projects/planeta-igr"
DB_CONTAINER="planeta-igr-db"

cd "$PROJECT"

echo "=== Ждём готовности базы данных ==="
for i in $(seq 1 30); do
  docker compose exec -T db pg_isready -U "${POSTGRES_USER:-planetaigr}" && break
  echo "  Попытка $i/30..."
  sleep 2
done

echo "=== Применяем схему ==="
docker compose exec -T db psql \
  -U "${POSTGRES_USER:-planetaigr}" \
  -d "${POSTGRES_DB:-planetaigr}" \
  -f /dev/stdin < db/sql/01_schema.sql

echo "=== Применяем начальные данные ==="
docker compose exec -T db psql \
  -U "${POSTGRES_USER:-planetaigr}" \
  -d "${POSTGRES_DB:-planetaigr}" \
  -f /dev/stdin < db/sql/02_seed.sql

echo
echo "Миграции применены успешно."
