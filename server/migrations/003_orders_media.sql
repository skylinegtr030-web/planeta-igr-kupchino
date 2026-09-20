-- 003: таблица заявок (orders) и медиа-библиотека (media)

-- ── orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id          serial primary key,
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  event_date  date,
  status      text not null default 'new',   -- new | confirmed | cancelled
  payload     jsonb not null default '{}'
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_event_date_idx  on orders (event_date);
create index if not exists orders_status_idx      on orders (status);

-- ── media ────────────────────────────────────────────────────────────────────
-- Хранит пути ко всем фото сайта + мета-данные
-- path  — относительный URL, напр. assets/images/hero/hero-collage-1.jpg
-- group — логическая группа: hero | room_jungle | room_loft | kuzar | lava | extras | branding
create table if not exists media (
  id          serial primary key,
  path        text not null unique,          -- относительный путь / URL
  alt         text not null default '',      -- alt-текст
  "group"     text not null default '',      -- логическая группа
  sort_order  integer not null default 100,
  is_active   boolean not null default true
);

create index if not exists media_group_idx on media ("group", sort_order);
