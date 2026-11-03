# Эксплуатация «Планеты Игр»

Сервер: `skylinegtr030@153.51.119.119`, папка `~/planeta-igr`, порт **3003**.
Один процесс Node.js (`apps/api/dist/index.js`) отдаёт витрину, админку `/admin/`, API `/api/*` и фото `/media/*`.
База — отдельная `planeta_igr` в системном PostgreSQL 16. Фото — `runtime/uploads`. Пароли — только в `.env` (в git не попадает).
Docker не нужен. Соседние сайты на сервере (Q-ZAR :8080, риелтор :3002) не затрагиваются.

## Команды
| Задача | Команда |
|---|---|
| Обновить сайт из GitHub (с бэкапом) | `bash scripts/update.sh` |
| Перезапустить сайт | `bash scripts/restart.sh` |
| Резервная копия | `bash scripts/backup.sh` → `~/backups/planeta-igr/<дата>` |
| Восстановить из копии | `bash scripts/restore.sh ~/backups/planeta-igr/<дата>` |
| Создать админа / сбросить пароль | `bash scripts/set-admin.sh email [owner\|manager\|editor]` |
| Логи | `tail -f server.log` |

Автозапуск: `@reboot ~/planeta-igr/run.sh` в crontab. Бэкап каждую ночь в 03:30 (`30 3 * * * ~/planeta-igr/scripts/backup.sh`), хранится 14 дней.
Миграции схемы (`apps/api/migrations`) применяются сами при старте сервера.

## Первичное наполнение (новая пустая база)
```
set -a; . ./.env; set +a
cp -rn scripts/seed-media/. runtime/uploads/
git archive origin/main assets/images | tar -x -C runtime/uploads/assets --strip-components=1
psql "$DATABASE_URL" -f scripts/seed-rooms.sql
psql "$DATABASE_URL" -f scripts/seed-activities.sql
psql "$DATABASE_URL" -f scripts/seed-catalog.sql
psql "$DATABASE_URL" -f scripts/seed-media.sql
bash scripts/set-admin.sh you@example.com
```

## Переезд на другой сервер
1. Поставить Node.js 22+ и PostgreSQL, создать базу и пользователя, склонировать репозиторий (ветка `v2`).
2. Создать `.env` по образцу `.env.example`, `npm install && npm run build`.
3. `bash scripts/restore.sh <папка бэкапа>` — база и фото вернутся целиком.
4. Подключить домен и HTTPS (Caddy/nginx перед портом 3003), в `.env` поставить `COOKIE_SECURE=true`.
