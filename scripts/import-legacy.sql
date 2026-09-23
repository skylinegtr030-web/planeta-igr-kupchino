\set ON_ERROR_STOP 1
select 'dbname=' || :'src' || ' user=' || current_user as conn \gset
create extension if not exists dblink;
begin;
select dblink_connect('legacy', :'conn');
create temp table l_categories on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.categories t') as x(j jsonb);
create temp table l_products on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.products t') as x(j jsonb);
create temp table l_media on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.media t') as x(j jsonb);
create temp table l_galleries on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.galleries t') as x(j jsonb);
create temp table l_gallery_media on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.gallery_media t') as x(j jsonb);
create temp table l_promo_codes on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.promo_codes t') as x(j jsonb);
create temp table l_special_days on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.special_days t') as x(j jsonb);
create temp table l_site_settings on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.site_settings t') as x(j jsonb);
create temp table l_blocks on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.blocks t') as x(j jsonb);
create temp table l_reviews on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.reviews t') as x(j jsonb);
create temp table l_orders on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.orders t') as x(j jsonb);
create temp table l_admins on commit drop as select j from dblink('legacy', 'select to_jsonb(t) from public.admins t') as x(j jsonb);
select dblink_disconnect('legacy');

truncate audit_log, order_events, order_items, orders, admin_sessions, admins, reviews, content_blocks,
         settings, special_days, promo_codes, products, categories, gallery_media, galleries, media restart identity cascade;

insert into media (storage_path, alt, folder, width, height, bytes, is_active, created_at)
select distinct on (p) p, coalesce(j->>'alt',''), coalesce(j->>'folder', j->>'group', ''),
  (j->>'width')::int, (j->>'height')::int, (j->>'bytes')::int, coalesce((j->>'is_active')::bool, true), coalesce((j->>'created_at')::timestamptz, now())
from (select j, ltrim(coalesce(j->>'storage_path', j->>'path'), '/') p from l_media) s where p is not null;

insert into galleries (id, slug, title) select (j->>'id')::uuid, j->>'slug', coalesce(j->>'title','') from l_galleries;
insert into gallery_media (gallery_id, media_id, sort)
select (gm.j->>'gallery_id')::uuid, m.id, coalesce((gm.j->>'sort_order')::int, 0)
from l_gallery_media gm join l_media lm on lm.j->>'id' = gm.j->>'media_id'
join media m on m.storage_path = ltrim(coalesce(lm.j->>'storage_path', lm.j->>'path'), '/')
on conflict do nothing;

insert into categories (id, slug, title, kind, description, is_published, sort)
select (j->>'id')::uuid, j->>'slug', j->>'title',
  case when j->>'kind' in ('package','room','service','ticket','activity') then j->>'kind'
       when concat(j->>'slug', ' ', j->>'kind') ~* 'pack' then 'package'
       when concat(j->>'slug', ' ', j->>'kind') ~* 'room' then 'room'
       when concat(j->>'slug', ' ', j->>'kind') ~* 'ticket|tier' then 'ticket'
       when concat(j->>'slug', ' ', j->>'kind') ~* 'activit' then 'activity'
       else 'service' end,
  coalesce(j->>'description',''), coalesce((j->>'is_published')::bool, true), coalesce((j->>'sort_order')::int, 0)
from l_categories;
insert into categories (slug, title, kind, sort)
select 'other', 'Прочее', 'service', 999
where exists (select 1 from l_products p where p.j->>'category_id' is null
  and not exists (select 1 from l_products pp where pp.j->>'id' = p.j->>'parent_id' and pp.j->>'category_id' is not null));

insert into products (id, category_id, parent_id, slug, title, short_desc, description, badge, price_weekday, price_weekend, price_from,
  duration_min, max_qty, day_type, min_age, guests, cover_media_id, attrs, is_published, sort, created_at, updated_at)
select (p.j->>'id')::uuid,
  coalesce((p.j->>'category_id')::uuid, (pp.j->>'category_id')::uuid, (select id from categories where slug = 'other')),
  (p.j->>'parent_id')::uuid, p.j->>'slug', p.j->>'title', coalesce(p.j->>'short_desc',''), coalesce(p.j->>'description',''), nullif(p.j->>'badge',''),
  coalesce((p.j->>'price_weekday')::numeric, 0), coalesce((p.j->>'price_weekend')::numeric, (p.j->>'price_weekday')::numeric, 0),
  coalesce((p.j->>'price_from')::bool, false),
  coalesce(nullif((p.j->>'duration_min')::int, 0), (p.j->'attrs'->>'duration')::int, 0),
  case when coalesce(p.j->>'qty_mode', 'single') <> 'single' then greatest(coalesce((p.j->>'max_qty')::int, 30), 2)
       else greatest(coalesce((p.j->>'max_qty')::int, 1), 1) end,
  case when p.j->>'day_type' in ('weekday','weekend') then p.j->>'day_type' else 'any' end,
  (p.j->>'min_age')::int, (p.j->'attrs'->>'guests')::int, m.id,
  coalesce(p.j->'attrs', '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('emoji', p.j->>'emoji', 'color1', p.j->>'color1', 'color2', p.j->>'color2', 'capacity', p.j->>'capacity')),
  coalesce((p.j->>'is_published')::bool, true), coalesce((p.j->>'sort_order')::int, 0),
  coalesce((p.j->>'created_at')::timestamptz, now()), coalesce((p.j->>'updated_at')::timestamptz, now())
from l_products p
left join l_products pp on pp.j->>'id' = p.j->>'parent_id'
left join media m on m.storage_path = ltrim(coalesce(p.j->>'photo_url', p.j->'attrs'->>'photo', p.j->'attrs'->>'photo_url', ''), '/');

insert into promo_codes (code, kind, value, min_total, valid_from, valid_to, max_uses, used_count, active)
select j->>'code', j->>'kind', (j->>'value')::numeric, coalesce((j->>'min_total')::numeric, 0), (j->>'valid_from')::date, (j->>'valid_to')::date,
  (j->>'max_uses')::int, coalesce((j->>'used_count')::int, 0), coalesce((j->>'active')::bool, true) from l_promo_codes;
insert into special_days (day, kind, open_time, close_time, note)
select (j->>'day')::date, j->>'kind', (j->>'open_time')::time, (j->>'close_time')::time, coalesce(j->>'note','') from l_special_days;
insert into settings (key, value) select j->>'key', coalesce(j->'value', '{}'::jsonb) from l_site_settings;
insert into content_blocks (key, data)
select distinct on (k) 'legacy.' || k, j || '{"published": false}'::jsonb from (select coalesce(j->>'key', j->>'slug', j->>'id') k, j from l_blocks) s where k is not null;
insert into reviews (author, text, rating, source, is_published, sort)
select coalesce(j->>'author', j->>'name', 'Гость'), coalesce(j->>'text', j->>'body', ''), least(greatest(coalesce((j->>'rating')::int, 5), 1), 5),
  j->>'source', coalesce((j->>'is_published')::bool, true), coalesce((j->>'sort_order')::int, 0) from l_reviews;
insert into admins (id, email, pass_hash, role, created_at)
select (j->>'id')::uuid, j->>'email', j->>'pass_hash', case when j->>'role' = 'editor' then 'editor' else 'owner' end,
  coalesce((j->>'created_at')::timestamptz, now()) from l_admins;

insert into orders (id, status, customer_name, phone, child_name, child_birthday, event_date, event_time, comment, promo_code,
  subtotal, discount, total, source, admin_note, legacy_payload, created_at, updated_at)
select (j->>'id')::uuid,
  case when j->>'status' in ('new','in_progress','confirmed','done','cancelled') then j->>'status'
       when j->>'status' ~ '^(Н|н)ов' then 'new'
       when j->>'status' ~ '(Р|р)абот|(С|с)вяз' then 'in_progress'
       when j->>'status' ~ '(П|п)одтв' then 'confirmed'
       when j->>'status' ~ '(В|в)ыполн|(З|з)аверш|(П|п)ровед' then 'done'
       when j->>'status' ~ '(О|о)тмен|(О|о)ткл|(О|о)тказ' then 'cancelled'
       else 'new' end,
  coalesce(nullif(j->>'name',''), 'Без имени'), coalesce(j->>'phone', ''), nullif(j->'payload'->>'childName',''),
  case when j->'payload'->>'childBday' ~ '^\d{4}-\d{2}-\d{2}$' then (j->'payload'->>'childBday')::date end,
  (j->>'event_date')::date,
  case when j->'payload'->>'eventTime' ~ '^\d{1,2}:\d{2}' then substring(j->'payload'->>'eventTime' from '^\d{1,2}:\d{2}')::time end,
  nullif(j->'payload'->>'comment',''),
  (select code from promo_codes where code = coalesce(nullif(j->>'promo_code',''), nullif(j->'payload'->>'promo',''))::citext),
  coalesce((j->>'subtotal')::numeric, 0), coalesce((j->>'discount')::numeric, 0), coalesce((j->>'total')::numeric, (j->>'subtotal')::numeric, 0),
  coalesce(j->'payload'->>'source', 'website'), coalesce(j->>'admin_note',''), j,
  (j->>'created_at')::timestamptz, coalesce((j->>'updated_at')::timestamptz, (j->>'created_at')::timestamptz)
from l_orders order by (j->>'created_at')::timestamptz;

insert into order_items (order_id, product_id, title, qty, unit_price)
select (o.j->>'id')::uuid, p.id, coalesce(nullif(i->>'title',''), p.title, i->>'slug', '—'),
  greatest(coalesce((i->>'qty')::int, 1), 1), coalesce((i->>'price')::numeric, 0)
from l_orders o
cross join lateral jsonb_array_elements(case when jsonb_typeof(o.j->'items') = 'array' then o.j->'items' else '[]'::jsonb end) i
left join products p on p.slug = i->>'slug';
insert into order_events (order_id, type, data, at) select id, 'imported', jsonb_build_object('legacy_status', legacy_payload->>'status'), created_at from orders;
commit;

select t as "таблица", old as "было", new as "стало", case when old = new then 'OK' else 'ПРОВЕРИТЬ' end as "итог" from (values
  ('categories', (select n from dblink(:'conn', 'select count(*) from public.categories') x(n bigint)), (select count(*) from categories where slug <> 'other')),
  ('products', (select n from dblink(:'conn', 'select count(*) from public.products') x(n bigint)), (select count(*) from products)),
  ('orders', (select n from dblink(:'conn', 'select count(*) from public.orders') x(n bigint)), (select count(*) from orders)),
  ('promo_codes', (select n from dblink(:'conn', 'select count(*) from public.promo_codes') x(n bigint)), (select count(*) from promo_codes)),
  ('special_days', (select n from dblink(:'conn', 'select count(*) from public.special_days') x(n bigint)), (select count(*) from special_days)),
  ('site_settings', (select n from dblink(:'conn', 'select count(*) from public.site_settings') x(n bigint)), (select count(*) from settings)),
  ('media', (select n from dblink(:'conn', 'select count(*) from public.media') x(n bigint)), (select count(*) from media)),
  ('admins', (select n from dblink(:'conn', 'select count(*) from public.admins') x(n bigint)), (select count(*) from admins))
) v(t, old, new);
select status as "статус", count(*) as "заявок" from orders group by 1 order by 1;
