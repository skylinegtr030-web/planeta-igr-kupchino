create extension if not exists "pgcrypto";

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  seo jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blocks_page_idx on blocks(page_id, sort_order);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  sort_order int not null default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  slug text unique not null,
  title text not null,
  description text default '',
  price_weekday numeric(12,2),
  price_weekend numeric(12,2),
  attrs jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'public-site-assets',
  storage_path text not null,
  alt text default '',
  folder text default '',
  width int, height int, bytes int,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table if not exists product_media (
  product_id uuid references products(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, media_id)
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default ''
);

create table if not exists gallery_media (
  gallery_id uuid references galleries(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  sort_order int not null default 0,
  primary key (gallery_id, media_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  event_date date,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'Новая'
    check (status in ('Новая','В работе','Подтверждена','Отклонена')),
  admin_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on orders(status, created_at desc);

create table if not exists admin_profiles (
  user_id uuid primary key,
  email text,
  role text not null default 'admin' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger as $fn$
begin new.updated_at = now(); return new; end $fn$ language plpgsql;

do $do$ declare t text;
begin
  foreach t in array array['pages','blocks','products','orders','site_settings'] loop
    execute format('drop trigger if exists trg_%s_upd on public.%I', t, t);
    execute format('create trigger trg_%s_upd before update on public.%I for each row execute function set_updated_at()', t, t);
  end loop;
end $do$;
