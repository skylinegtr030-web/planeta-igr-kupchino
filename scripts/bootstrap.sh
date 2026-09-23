#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
OLD=/opt/projects/planeta-igr; INBOX=/opt/projects/planeta-inbox; DB=planeta-igr-db-1
step(){ printf '\n\033[1m== %s\033[0m\n' "$*"; }

step "1/7 .env"
[ -f .env ] || { grep -E '^POSTGRES_(USER|PASSWORD|DB)=' "$OLD/.env" > .env; echo 'APP_PORT=3002' >> .env; }
set -a; . ./.env; set +a; echo ok

step "2/7 установка, типы, тесты, сборка"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -v "$PWD":/app -w /app node:22-alpine \
  sh -c 'npm install --no-audit --no-fund --loglevel=error && npm run typecheck && npm test && npm run build'

step "3/7 коммит в ветку v2"
git add -A && git commit -qm "v2: схема БД, перенос данных, API сайта и админки, медиатека" && git push -q -u origin v2 && git log -1 --oneline

step "4/7 база planeta_v2"
docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select 1 from pg_database where datname = '"'"'planeta_v2'"'"'" | grep -q 1 || createdb -U "$POSTGRES_USER" planeta_v2'
echo ok

step "5/7 медиа"
mkdir -p runtime/uploads/park runtime/uploads/assets
find "$INBOX" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) ! -name 'sheet*' ! -name '._*' -exec cp --update=none {} runtime/uploads/park/ \;
[ -d "$OLD/assets/images" ] && cp -r --update=none "$OLD/assets/images" runtime/uploads/assets/ || true
echo "park: $(ls runtime/uploads/park | wc -l) фото, старые: $(find runtime/uploads/assets -type f | wc -l)"

step "6/7 запуск контейнера"
docker compose up -d --build
for i in $(seq 1 40); do curl -fs "http://127.0.0.1:${APP_PORT}/health" >/dev/null && break; sleep 2; done
curl -fs "http://127.0.0.1:${APP_PORT}/health"; echo

step "7/7 перенос данных и фото"
docker exec -i "$DB" sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d planeta_v2 -v src="$POSTGRES_DB"' < scripts/import-legacy.sql
docker exec -i "$DB" sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d planeta_v2' < scripts/seed-park-media.sql
echo "catalog: $(curl -fs "http://127.0.0.1:${APP_PORT}/api/catalog" | head -c 200)"
echo "content: $(curl -fs "http://127.0.0.1:${APP_PORT}/api/content" | grep -o '"key"' | wc -l) блоков"
