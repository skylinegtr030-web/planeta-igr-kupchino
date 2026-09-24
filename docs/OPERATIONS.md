# Эксплуатация «Планеты Игр» (v2)

Сервер: `/opt/projects/planeta-igr-v2`. Всё запускается через Docker Compose: приложение (`planeta-igr-v2`) + PostgreSQL (`planeta-igr-db-1`) + Caddy (HTTPS).

## Ежедневные команды
| Задача | Команда |
|---|---|
| Обновить сайт из кода | `bash scripts/update.sh "что изменили"` |
| Резервная копия (база, фото, код) | `bash scripts/backup.sh` → `/opt/backups/planeta-igr/<дата>` |
| Восстановить из копии | `bash scripts/restore.sh /opt/backups/planeta-igr/<дата>` |
| Создать/сбросить администратора | `bash scripts/set-admin.sh email пароль` |
| Логи приложения | `docker logs planeta-igr-v2 --tail 100` |

## Код без GitHub
`scripts/setup-local-git.sh` переносит «источник правды» в `/opt/git/planeta-igr.git` на самом сервере (remote `origin`), GitHub остаётся зеркалом (remote `github`).
`update.sh` сам забирает свежие коммиты с GitHub, если он доступен, и пушит результат в оба места. Когда GitHub больше не нужен — `bash scripts/detach-github.sh`: ссылки, команды и сайт не меняются.

Автоматический бэкап каждую ночь в 03:30: `crontab -e` → `30 3 * * * cd /opt/projects/planeta-igr-v2 && bash scripts/backup.sh >> /var/log/planeta-backup.log 2>&1`

## Переезд на другой сервер
1. Поставить Docker, склонировать код: `git clone /путь/или/ssh:/opt/git/planeta-igr.git planeta-igr-v2 && cd planeta-igr-v2 && git checkout v2`.
2. Скопировать `.env` и последний бэкап, `docker compose up -d`, затем `bash scripts/restore.sh <папка бэкапа>`.
3. Проверить по IP (nip.io), затем переключить A-запись домена; Caddy выпустит сертификат сам.
