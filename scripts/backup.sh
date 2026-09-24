#!/usr/bin/env bash
# Резервная копия: база, фотографии, код (git bundle). Хранится 14 копий в /opt/backups/planeta-igr.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
DST=/opt/backups/planeta-igr; TS="$(date +%Y-%m-%d_%H-%M)"; D="$DST/$TS"
sudo mkdir -p "$DST" && sudo chown "$(id -u):$(id -g)" "$DST"; mkdir -p "$D"
docker exec planeta-igr-db-1 sh -c 'pg_dump -U "$POSTGRES_USER" -d planeta_v2 -Fc' > "$D/planeta_v2.dump"
tar czf "$D/uploads.tgz" -C runtime uploads
git bundle create "$D/code.bundle" --all -q
cp .env "$D/env.txt"
ls "$DST" | sort | head -n -14 | while read -r old; do rm -rf "$DST/$old"; done
echo "Бэкап: $D"; du -sh "$D" | cut -f1
