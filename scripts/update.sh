#!/usr/bin/env bash
# Обновление из GitHub: бэкап → git pull → сборка → перезапуск
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/node/bin:$PATH"
bash scripts/backup.sh
git pull --ff-only
npm install --no-audit --no-fund
NODE_OPTIONS=--max-old-space-size=512 nice -n 15 npm run build
bash scripts/restart.sh
