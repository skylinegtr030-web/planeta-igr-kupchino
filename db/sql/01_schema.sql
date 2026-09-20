-- Схема базы данных Планета Игр
-- Запускать: psql $DATABASE_URL -f db/sql/01_schema.sql

\set ON_ERROR_STOP on

create extension if not exists "pgcrypto";

-- Настройки сайта (тексты, контакты, цены)
create table if not exists site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Категории пакетов/товаров
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  sort_order  int not null default 0
);

-- Пакеты и услуги (цены, описания)
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

-- Медиафайлы (пути к загруженным фото в runtime/uploads)
create table if not exists media (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique,
  alt           text not null default '',
  folder        text not null default '',
  width         int,
  height        int,
  bytes         int,
  created_at    timestamptz not null default now()
);

-- Галереи
create table if not exists galleries (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null default ''
);

create table if not exists gallery_media (
  gallery_id  uuid references galleries(id) on delete cascade,
  media_id    uuid references media(id) on delete cascade,
  sort_order  int not null default 0,
  primary key (gallery_id, media_id)
);

-- Заявки
create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  event_date  date,
  payload     jsonb not null default '{}',
  status      text not null default 'Новая'
                check (status in ('Новая','В работе','Подтверждена','Отклонена')),
  admin_note  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_status_idx  on orders(status, created_at desc);

-- Администраторы (email + bcrypt-хеш пароля)
create table if not exists admins (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  pass_hash    text not null,
  role         text not null default 'admin' check (role in ('admin','editor')),
  created_at   timestamptz not null default now()
);

-- Сессии администраторов
create table if not exists admin_sessions (
  token       text primary key,
  admin_id    uuid not null references admins(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now()
);
create index if not exists sessions_admin_idx on admin_sessions(admin_id);

-- Автообновление updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $do$
declare t text;
begin
  foreach t in array array['products','orders','site_settings'] loop
    execute format(
      'drop trigger if exists trg_%s_upd on %I;
       create trigger trg_%s_upd
         before update on %I
         for each row execute function set_updated_at()',
      t, t, t, t
    );
  end loop;
end $do$;
