#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="/opt/projects/planeta-igr"
LOCK="/tmp/planeta-igr-update.lock"

exec 9>"$LOCK"
flock -n 9 || exit 0

cd "$PROJECT"
git fetch --quiet origin main

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(date)] Найдено обновление: $LOCAL -> $REMOTE"

/opt/projects/planeta-igr/deploy-server.sh

PUBLIC_HEALTH="$(curl -fsS --max-time 20 \
  https://planeta.84.201.143.53.nip.io/health)"

echo "[$(date)] Сайт обновлён: $PUBLIC_HEALTH"
