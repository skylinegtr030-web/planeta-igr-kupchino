#!/usr/bin/env bash
# Резервная копия: база + загруженные фото + .env. Хранит 14 последних дней.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
DIR="$HOME/backups/planeta-igr/$(date +%F_%H%M)"
mkdir -p "$DIR"
pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip > "$DIR/db.sql.gz"
tar -czf "$DIR/uploads.tar.gz" -C runtime uploads
cp .env "$DIR/env" && chmod 600 "$DIR/env"
find "$HOME/backups/planeta-igr" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
echo "backup: $DIR ($(du -sh "$DIR" | cut -f1))"
