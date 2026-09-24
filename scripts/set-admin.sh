#!/usr/bin/env bash
# Создаёт или сбрасывает пароль администратора: bash scripts/set-admin.sh email пароль [роль]
set -euo pipefail
EMAIL="${1:?email}"; PASS="${2:?пароль (от 8 символов)}"; ROLE="${3:-owner}"
[ "${#PASS}" -ge 8 ] || { echo "пароль короче 8 символов"; exit 1; }
docker exec -i planeta-igr-db-1 sh -c "psql -q -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d planeta_v2 -v email='$EMAIL' -v pass='$PASS' -v role='$ROLE'" <<'SQL'
create extension if not exists pgcrypto;
insert into admins (email, pass_hash, role, is_active) values (:'email', crypt(:'pass', gen_salt('bf', 10)), :'role', true)
on conflict (email) do update set pass_hash = excluded.pass_hash, role = excluded.role, is_active = true;
delete from admin_sessions where admin_id = (select id from admins where email = :'email');
select email, role, is_active as "активен" from admins order by created_at;
SQL
echo "Готово. Вход: https://planeta.84.201.143.53.nip.io/admin/  логин $EMAIL"
