#!/usr/bin/env bash
# Добавляет зоны «Лазертаг Q-ZAR» и «Лава-пол»: копирует фото в runtime/uploads и заливает данные в planeta_v2.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p runtime/uploads/activities/lasertag runtime/uploads/activities/lava
cp -n scripts/seed-media/activities/lasertag/*.jpg runtime/uploads/activities/lasertag/ || true
cp -n scripts/seed-media/activities/lava/*.jpg runtime/uploads/activities/lava/ || true
docker exec -i planeta-igr-db-1 sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d planeta_v2' < scripts/seed-activities.sql
echo "Готово: зоны добавлены. Проверь https://planeta.84.201.143.53.nip.io/#park"
