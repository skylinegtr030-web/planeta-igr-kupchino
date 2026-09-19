#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="/opt/projects/planeta-igr"
BACKUPS="/opt/backups/planeta-igr"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"

mkdir -p "$BACKUPS"

tar \
  --exclude='*.log' \
  -czf "$BACKUPS/planeta-$DATE.tar.gz" \
  -C "$PROJECT" \
  runtime .env compose.override.yaml

chmod 600 "$BACKUPS/planeta-$DATE.tar.gz"
find "$BACKUPS" -type f -mtime +30 -delete

echo "Резервная копия: $BACKUPS/planeta-$DATE.tar.gz"
