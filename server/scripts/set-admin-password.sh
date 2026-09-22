#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../.."
printf 'Логин админа: '; read -r LOGIN
stty -echo; printf 'Новый пароль (от 14 символов): '; read -r PW; stty echo; echo
[ "${#PW}" -ge 14 ] || { echo 'Пароль слишком короткий'; exit 1; }
printf '%s\n' \
  "create extension if not exists pgcrypto;" \
  "insert into admins(email, pass_hash, role) values (:'login', crypt(:'pw', gen_salt('bf', 12)), 'admin') on conflict (email) do update set pass_hash = excluded.pass_hash;" \
  "delete from admin_sessions where admin_id = (select id from admins where email = :'login');" \
| docker compose exec -T -e LOGIN="$LOGIN" -e PW="$PW" db sh -c \
  'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v login="$LOGIN" -v pw="$PW"'
unset PW
echo "Готово: пароль для $LOGIN обновлён, все сессии завершены."
