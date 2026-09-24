-- Статистика посещений сайта (обезличенная: без cookie, посетитель = sha256(день + ip + user-agent + соль))
create table if not exists visits (
  id bigserial primary key,
  at timestamptz not null default now(),
  visitor text not null,
  path text not null default '/',
  referrer_host text,
  utm_source text, utm_medium text, utm_campaign text,
  device text not null default 'desktop' check (device in ('desktop','mobile','tablet')),
  screen_w int
);
create index if not exists visits_at_idx on visits (at desc);
create index if not exists visits_visitor_idx on visits (visitor, at);

create table if not exists site_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  visitor text not null,
  name text not null,
  label text,
  path text
);
create index if not exists site_events_at_idx on site_events (at desc);
create index if not exists site_events_name_idx on site_events (name, at desc);

-- порядок и обложки для галерей/блоков уже есть; добавим служебные поля каталогу
alter table categories add column if not exists description text not null default '';
alter table products add column if not exists updated_by uuid references admins(id) on delete set null;
