create extension if not exists pgcrypto;
create extension if not exists citext;
create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table media (
  id uuid primary key default gen_random_uuid(), storage_path text not null unique, alt text not null default '',
  folder text not null default '', mime text, width int, height int, bytes int,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table galleries (id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null default '');
create table gallery_media (
  gallery_id uuid not null references galleries(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  sort int not null default 0, primary key (gallery_id, media_id)
);
create table categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  kind text not null check (kind in ('package','room','service','ticket','activity')),
  description text not null default '', is_published boolean not null default true, sort int not null default 0
);
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  parent_id uuid references products(id) on delete cascade deferrable initially deferred,
  slug text not null unique, title text not null, short_desc text not null default '', description text not null default '', badge text,
  price_weekday numeric(12,2) not null default 0 check (price_weekday >= 0),
  price_weekend numeric(12,2) not null default 0 check (price_weekend >= 0),
  price_from boolean not null default false,
  duration_min int not null default 0 check (duration_min >= 0),
  max_qty int not null default 1 check (max_qty >= 1),
  day_type text not null default 'any' check (day_type in ('any','weekday','weekend')),
  min_age int, guests int, cover_media_id uuid references media(id) on delete set null,
  attrs jsonb not null default '{}', is_published boolean not null default true, sort int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_category_idx on products (category_id, sort);
create index products_parent_idx on products (parent_id);
create trigger trg_products_upd before update on products for each row execute function set_updated_at();

create table promo_codes (
  code citext primary key, kind text not null check (kind in ('percent','fixed')), value numeric(12,2) not null check (value > 0),
  min_total numeric(12,2) not null default 0, valid_from date, valid_to date, max_uses int, used_count int not null default 0,
  active boolean not null default true
);
create table special_days (day date primary key, kind text not null check (kind in ('holiday','closed','short')), open_time time, close_time time, note text not null default '');
create table settings (key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now());
create trigger trg_settings_upd before update on settings for each row execute function set_updated_at();
create table content_blocks (key text primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create trigger trg_blocks_upd before update on content_blocks for each row execute function set_updated_at();
create table reviews (
  id uuid primary key default gen_random_uuid(), author text not null, text text not null,
  rating int not null default 5 check (rating between 1 and 5), source text, is_published boolean not null default true,
  sort int not null default 0, created_at timestamptz not null default now()
);
create table admins (
  id uuid primary key default gen_random_uuid(), email citext not null unique, pass_hash text not null,
  role text not null default 'manager' check (role in ('owner','manager','editor')), is_active boolean not null default true,
  last_login_at timestamptz, created_at timestamptz not null default now()
);
create table admin_sessions (
  token_hash text primary key, admin_id uuid not null references admins(id) on delete cascade, ip inet, user_agent text,
  created_at timestamptz not null default now(), expires_at timestamptz not null
);
create index admin_sessions_admin_idx on admin_sessions (admin_id);
create table orders (
  id uuid primary key default gen_random_uuid(), number serial unique,
  status text not null default 'new' check (status in ('new','in_progress','confirmed','done','cancelled')),
  customer_name text not null, phone text not null, child_name text, child_birthday date, event_date date, event_time time,
  guests int, comment text, promo_code citext references promo_codes(code) on update cascade on delete set null,
  subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  source text not null default 'website', admin_note text not null default '', legacy_payload jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index orders_created_idx on orders (created_at desc);
create index orders_status_idx on orders (status, created_at desc);
create index orders_event_idx on orders (event_date);
create trigger trg_orders_upd before update on orders for each row execute function set_updated_at();
create table order_items (
  id bigserial primary key, order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null, title text not null,
  qty int not null default 1 check (qty >= 1), unit_price numeric(12,2) not null default 0,
  sum numeric(12,2) generated always as (qty * unit_price) stored
);
create index order_items_order_idx on order_items (order_id);
create table order_events (
  id bigserial primary key, order_id uuid not null references orders(id) on delete cascade,
  admin_id uuid references admins(id) on delete set null, type text not null, data jsonb not null default '{}', at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, at);
create table audit_log (
  id bigserial primary key, admin_id uuid references admins(id) on delete set null, entity text not null, entity_id text,
  action text not null, diff jsonb, at timestamptz not null default now()
);
