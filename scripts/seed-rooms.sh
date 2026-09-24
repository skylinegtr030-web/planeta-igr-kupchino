#!/usr/bin/env bash
# Добавляет комнаты «Джунгли» и «Лофт»: копирует фото в runtime/uploads и заливает данные в planeta_v2.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=planeta-igr-db-1
mkdir -p runtime/uploads/rooms/jungle runtime/uploads/rooms/loft
cp -n scripts/seed-media/rooms/jungle/*.jpeg runtime/uploads/rooms/jungle/ || true
cp -n scripts/seed-media/rooms/loft/*.jpeg runtime/uploads/rooms/loft/ || true
docker exec -i "$DB" sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d planeta_v2' < scripts/seed-rooms.sql
echo "Готово: комнаты добавлены. Проверь https://planeta.84.201.143.53.nip.io/#park"
