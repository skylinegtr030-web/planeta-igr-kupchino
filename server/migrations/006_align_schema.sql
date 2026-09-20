-- 006: приведение БД к полной схеме db/sql/01_schema.sql
-- Безопасно повторять (IF NOT EXISTS / ON CONFLICT DO NOTHING)

\set ON_ERROR_STOP on

create extension if not exists pgcrypto;

-- ── site_settings ────────────────────────────────────────────────────────────────
create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ── categories ─────────────────────────────────────────────────────────────────
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  sort_order int not null default 0
);

-- ── products (цены пакетов) ────────────────────────────────────────────────────
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references categories(id) on delete set null,
  slug           text unique not null,
  title          text not null,
  description    text not null default '',
  price_weekday  numeric(12,2),
  price_weekend  numeric(12,2),
  attrs          jsonb not null default '{}',
  is_published   boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists products_sort_idx on products(sort_order);

-- ── admins ────────────────────────────────────────────────────────────────────
create table if not exists admins (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  pass_hash  text not null,
  role       text not null default 'admin' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

-- ── admin_sessions ───────────────────────────────────────────────────────────────
create table if not exists admin_sessions (
  token      text primary key,
  admin_id   uuid not null references admins(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
create index if not exists sessions_admin_idx on admin_sessions(admin_id);

-- ── orders (заявки) ───────────────────────────────────────────────────────────────
-- Если orders уже есть (в любой версии) — добавляем недостающие колонки:
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='orders' and column_name='admin_note'
  ) then
    alter table orders add column admin_note text not null default '';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='orders' and column_name='updated_at'
  ) then
    alter table orders add column updated_at timestamptz not null default now();
  end if;
end $$;

-- приведем статусы к русским значениям
update orders set status='Новая'    where status='new';
update orders set status='Подтверждена' where status='confirmed';
update orders set status='Отклонена'  where status='cancelled';

-- ── media (медиабиблиотека) ────────────────────────────────────────────────────
-- media сейчас своя (простая: path, alt, group).
-- Переделываем под полную схему: добавляем storage_path, folder;
-- полю группы даём алиас folder.
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='media' and column_name='storage_path'
  ) then
    alter table media
      add column storage_path text,
      add column folder       text not null default '',
      add column width        int,
      add column height       int,
      add column bytes        int,
      add column created_at   timestamptz not null default now();
    -- переносим данные path -> storage_path, group -> folder
    update media set storage_path = path, folder = "group";
    alter table media alter column storage_path set not null;
    alter table media add constraint media_storage_path_uniq unique (storage_path);
  end if;
end $$;

-- galleries / gallery_media
create table if not exists galleries (
  id    uuid primary key default gen_random_uuid(),
  slug  text unique not null,
  title text not null default ''
);

create table if not exists gallery_media (
  gallery_id uuid references galleries(id) on delete cascade,
  media_id   uuid references media(id)     on delete cascade,
  sort_order int not null default 0,
  primary key (gallery_id, media_id)
);

-- ── triggers ──────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $do$
declare t text;
begin
  foreach t in array array['products','orders'] loop
    execute format(
      'drop trigger if exists trg_%s_upd on %I;
       create trigger trg_%s_upd before update on %I
         for each row execute function set_updated_at()',
      t, t, t, t
    );
  end loop;
end $do$;

-- ── seed: контакты, цены, пакеты ─────────────────────────────────────────────
insert into site_settings(key,value) values
  ('contacts', '{"addressShort":"Балканская ул., 17","addressFull":"Балканская ул., 17, ТРК «Балкания Nova», 3 этаж","phone":"+7 981 818-01-34","hours":"10:00\u201322:00","mapQuery":"Санкт-Петербург, Балканская, 17"}'),
  ('ages',     '{"kuzar":7,"lavaFloor":4}'),
  ('tiers',    '{"timeCards30":1290,"timeCards60":2190,"unlimitedWeekday":1500,"unlimitedWeekend":1800}'),
  ('rooms',    '{"roomBase":5000,"extendPerHour":2500,"duoBase":10000}')
on conflict (key) do update set value=excluded.value;

insert into categories(slug,title,sort_order)
values('packs','Пакеты',1)
on conflict (slug) do nothing;

insert into products(category_id,slug,title,description,price_weekday,price_weekend,attrs,sort_order)
select c.id, v.slug, v.title, v.descr, v.pwd, v.pwe, v.attrs::jsonb, v.srt
from categories c,
  (values
    ('malysh',  'Малыш JO',         'До 6 гостей · 3 часа',   24500, 24500, '{"guests":6,"duration":180}', 0),
    ('jungle',  'Гости в джунглях', 'До 8 гостей · 3 часа',   33000, 33000, '{"guests":8,"duration":180}', 1),
    ('king',    'Король саванны',  'До 10 гостей · 4 часа',  50500, 50500, '{"guests":10,"duration":240}',2),
    ('cyber',   'Кибер Пати',     'До 10 гостей · 3 часа',  36500, 36500, '{"guests":10,"duration":180}',3)
  ) as v(slug, title, descr, pwd, pwe, attrs, srt)
where c.slug = 'packs'
on conflict (slug) do update
  set title=excluded.title, description=excluded.description,
      price_weekday=excluded.price_weekday, price_weekend=excluded.price_weekend,
      attrs=excluded.attrs;

-- галереи
insert into galleries(slug,title)
values('collage','Коллаж'),('jungle','Джунгли'),('loft','Лофт')
on conflict (slug) do nothing;
