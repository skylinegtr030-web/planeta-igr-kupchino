#!/usr/bin/env bash
# Восстановление из копии: bash scripts/restore.sh ~/backups/planeta-igr/<папка>
set -euo pipefail
SRC="${1:?папка бэкапа}"
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c 'drop schema public cascade; create schema public;'
gunzip -c "$SRC/db.sql.gz" | psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1
tar -xzf "$SRC/uploads.tar.gz" -C runtime
bash scripts/restart.sh
