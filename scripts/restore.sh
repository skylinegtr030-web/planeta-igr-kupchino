#!/usr/bin/env bash
# Восстановление из бэкапа на этом или новом сервере: bash scripts/restore.sh /opt/backups/planeta-igr/2026-09-24_15-00
set -Eeuo pipefail
cd "$(dirname "$0")/.."
SRC="${1:?путь к папке бэкапа}"
docker exec -i planeta-igr-db-1 sh -c 'pg_restore -U "$POSTGRES_USER" -d planeta_v2 --clean --if-exists --no-owner' < "$SRC/planeta_v2.dump"
mkdir -p runtime && tar xzf "$SRC/uploads.tgz" -C runtime
docker compose restart app 2>/dev/null || docker compose up -d
echo "Восстановлено из $SRC"
