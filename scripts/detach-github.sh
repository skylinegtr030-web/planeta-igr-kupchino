#!/usr/bin/env bash
# Момент «клиент сказал ок»: отключаем GitHub. Сайт, админка и update.sh продолжают работать из локального /opt/git.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
git remote get-url github >/dev/null 2>&1 && git remote remove github && echo "remote github удалён" || echo "remote github уже отсутствует"
bash scripts/backup.sh
echo "Готово: сервер живёт автономно. Репозиторий на GitHub теперь можно удалить или оставить приватным."
