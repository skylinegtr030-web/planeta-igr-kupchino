#!/usr/bin/env bash
# Каждые 5 минут: если в origin/main новый коммит — деплой.
set -Eeuo pipefail
PROJECT=/opt/projects/planeta-igr
exec 9>/tmp/planeta-igr-update.lock
flock -n 9 || exit 0
cd "$PROJECT"

BR=$(git branch --show-current)
[ "$BR" = main ] || { echo "[$(date '+%F %T')] пропуск: рабочая папка на ветке $BR"; exit 0; }

timeout 60 git fetch --quiet origin main
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0

echo "[$(date '+%F %T')] обновление ${LOCAL:0:7} -> ${REMOTE:0:7}"
if "$PROJECT/scripts/deploy-server.sh"; then
  echo "[$(date '+%F %T')] OK: $(curl -fsS --max-time 20 https://planeta.84.201.143.53.nip.io/health)"
else
  echo "[$(date '+%F %T')] ОШИБКА деплоя ${REMOTE:0:7}"; exit 1
fi
