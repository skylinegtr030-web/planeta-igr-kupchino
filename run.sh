#!/usr/bin/env bash
# Запуск сервера «Планеты Игр» в фоне (вызывается из cron @reboot и scripts/restart.sh)
cd "$(dirname "$0")"
set -a; . ./.env; set +a
nohup "$HOME/node/bin/node" apps/api/dist/index.js >> server.log 2>&1 &
