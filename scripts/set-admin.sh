#!/usr/bin/env bash
# Создать администратора или сбросить ему пароль: bash scripts/set-admin.sh email [owner|manager|editor]
# Пароль вводится скрыто и нигде не сохраняется в открытом виде.
set -euo pipefail
EMAIL="${1:?email}"; ROLE="${2:-owner}"
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
read -rsp "Пароль для $EMAIL (от 8 символов): " PASS; echo
[ "${#PASS}" -ge 8 ] || { echo "пароль короче 8 символов"; exit 1; }
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -v email="$EMAIL" -v pass="$PASS" -v role="$ROLE" <<'SQL'
insert into admins (email, pass_hash, role, is_active) values (:'email', crypt(:'pass', gen_salt('bf', 10)), :'role', true)
on conflict (email) do update set pass_hash = excluded.pass_hash, role = excluded.role, is_active = true;
delete from admin_sessions where admin_id = (select id from admins where email = :'email');
select email, role, is_active as "активен" from admins order by created_at;
SQL
echo "Готово. Вход: /admin/  логин $EMAIL"
