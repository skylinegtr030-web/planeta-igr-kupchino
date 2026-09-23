#!/usr/bin/env bash
# Ночной бэкап: дамп PostgreSQL + файлы (uploads, .env). Хранит 14 дней.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
DEST=/opt/backups/planeta-igr
TS=$(date +%F_%H-%M)
KEEP_DAYS=14
mkdir -p "$DEST"

part="$DEST/.db-$TS.part"
trap 'rm -f "$part"' EXIT
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$part"
docker compose exec -T db pg_restore --list < "$part" > /dev/null
mv "$part" "$DEST/db-$TS.dump"

files=(.env runtime/uploads)
[ -f compose.override.yaml ] && files+=(compose.override.yaml)
tar --exclude=runtime/db -czf "$DEST/files-$TS.tar.gz" "${files[@]}"

find "$DEST" -maxdepth 1 -type f \( -name 'db-2*.dump' -o -name 'files-2*.tar.gz' \
  -o -name 'planeta-2*.tar.gz' -o -name 'runtime-2*.tar.gz' -o -name 'env-2*.backup' \) \
  -mtime +"$KEEP_DAYS" -delete

echo "$(date '+%F %T') OK db=$(du -h "$DEST/db-$TS.dump" | cut -f1) files=$(du -h "$DEST/files-$TS.tar.gz" | cut -f1)"
