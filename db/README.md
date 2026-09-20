# CMS-Kit — универсальная база + админка

Код больше не переписывается: весь контент, фото и цены живут в базе и меняются через /admin.

## Порядок запуска

1. Supabase > SQL Editor: выполнить `sql/01_schema.sql`, затем `02_policies.sql`, затем `03_storage.sql`.
2. Authentication > Users > Add user — создать свой email и пароль.
3. В `sql/04_seed_admin.sql` подставить email и выполнить — это даёт права админа.
4. `cp site/config.example.js site/config.js` и вставить URL проекта и anon public key.
5. Залить фото: `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ./scripts/upload_media.sh ~/Downloads/planeta-igr-kupchino/assets/images`
6. Перенести контент: `python3 scripts/migrate_content.py ~/Downloads/planeta-igr-kupchino/assets/data/content.json > sql/05_seed_planeta.sql` и выполнить файл в SQL Editor.
7. Положить папки `site/` и `admin/` в репозиторий сайта, открыть `/admin/`.

## Важно по безопасности

- `anon public key` можно держать в коде — его защищает RLS.
- `service_role key` НИКОГДА не попадает в репозиторий, только в терминале при заливке фото.
- После перехода удалить в Vercel переменные GH_TOKEN, ADMIN_LOGIN, ADMIN_PASSWORD и файл admin/auth.json.
