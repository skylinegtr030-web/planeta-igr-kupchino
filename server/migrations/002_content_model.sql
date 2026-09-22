set local search_path to public;
-- 002: единая модель контента. Ничего не перезаписывает.

-- ── каталог ────────────────────────────────────────────────
alter table categories
  add column if not exists kind         text not null default 'service',
  add column if not exists description  text not null default '',
  add column if not exists is_published boolean not null default true;

alter table products
  add column if not exists parent_id      uuid references products(id) on delete cascade,
  add column if not exists short_desc     text not null default '',
  add column if not exists badge          text,
  add column if not exists price_from     boolean not null default false,
  add column if not exists duration_min   int not null default 0,
  add column if not exists qty_mode       text not null default 'single',
  add column if not exists max_qty        int not null default 1,
  add column if not exists day_type       text not null default 'any',
  add column if not exists min_age        int,
  add column if not exists capacity       text,
  add column if not exists emoji          text,
  add column if not exists color1         text,
  add column if not exists color2         text,
  add column if not exists cover_media_id int references media(id) on delete set null,
  add column if not exists gallery_id     uuid references galleries(id) on delete set null,
  add column if not exists bookable       boolean not null default true;

alter table products add constraint products_qty_mode_chk check (qty_mode in ('single','quantity'));
alter table products add constraint products_day_type_chk check (day_type in ('any','weekday','weekend'));
create index if not exists products_category_idx on products(category_id, sort_order);
create index if not exists products_parent_idx   on products(parent_id);

-- ── галереи: media.id — integer ────────────────────────────
drop table gallery_media;
create table gallery_media (
  gallery_id uuid not null references galleries(id) on delete cascade,
  media_id   int  not null references media(id)     on delete cascade,
  sort_order int  not null default 0,
  primary key (gallery_id, media_id)
);

insert into galleries(slug, title) values ('kuzar','Кузар'), ('lava','Лава-пол')
on conflict (slug) do nothing;

insert into gallery_media(gallery_id, media_id, sort_order)
select g.id, m.id, m.sort_order
from media m
join galleries g on g.slug = case m."group"
  when 'hero' then 'collage' when 'room_jungle' then 'jungle'
  when 'room_loft' then 'loft' when 'kuzar' then 'kuzar' when 'lava' then 'lava' end
on conflict do nothing;

-- ── заявки ─────────────────────────────────────────────────
alter table orders
  add column if not exists items      jsonb not null default '[]',
  add column if not exists subtotal   numeric(12,2),
  add column if not exists discount   numeric(12,2) not null default 0,
  add column if not exists total      numeric(12,2),
  add column if not exists promo_code text;
drop index if exists orders_created_idx;

-- ── контент ────────────────────────────────────────────────
create table blocks (
  key          text primary key,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  content      jsonb not null default '{}',
  gallery_id   uuid references galleries(id) on delete set null,
  updated_at   timestamptz not null default now()
);

create table nav_items (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  target       text not null,
  sort_order   int not null default 0,
  is_published boolean not null default true
);

create table reviews (
  id           uuid primary key default gen_random_uuid(),
  author       text not null,
  body         text not null,
  rating       smallint not null default 5 check (rating between 1 and 5),
  source       text not null default '',
  source_url   text,
  review_date  date,
  sort_order   int not null default 0,
  is_published boolean not null default true
);

create table promo_codes (
  code       text primary key,
  kind       text not null check (kind in ('percent','fixed')),
  value      numeric(12,2) not null check (value > 0),
  min_total  numeric(12,2) not null default 0,
  valid_from date,
  valid_to   date,
  max_uses   int,
  used_count int not null default 0,
  active     boolean not null default true
);

create table special_days (
  day        date primary key,
  kind       text not null check (kind in ('holiday','closed','short')),
  open_time  time,
  close_time time,
  note       text not null default ''
);

create table pages (
  slug             text primary key,
  title            text not null,
  body_md          text not null default '',
  meta_description text not null default '',
  is_published     boolean not null default true,
  updated_at       timestamptz not null default now()
);

create table content_history (
  id         bigserial primary key,
  entity     text not null,
  entity_id  text not null,
  before     jsonb,
  after      jsonb,
  admin_id   uuid references admins(id) on delete set null,
  created_at timestamptz not null default now()
);
create index content_history_entity_idx on content_history(entity, entity_id, created_at desc);

create trigger trg_blocks_upd before update on blocks for each row execute function set_updated_at();
create trigger trg_pages_upd  before update on pages  for each row execute function set_updated_at();

-- ── перенос данных в единый каталог ───────────────────────
insert into categories(slug, title, sort_order, kind) values
  ('rooms','Комнаты',2,'room'),
  ('services','Услуги',3,'service'),
  ('tickets','Билеты и тайм-карты',4,'ticket'),
  ('activities','Активности',5,'activity')
on conflict (slug) do nothing;
update categories set kind = 'package' where slug = 'packs';

update products p
set duration_min = coalesce((p.attrs->>'duration')::int, 0),
    capacity     = 'до ' || (p.attrs->>'guests') || ' гостей'
from categories c
where c.id = p.category_id and c.slug = 'packs' and p.duration_min = 0;

-- услуги из таблицы extras
insert into products(category_id, slug, title, description, price_weekday, price_weekend,
                     price_from, duration_min, capacity, emoji, color1, color2, sort_order, is_published)
select c.id, e.slug, e.title, coalesce(e.description,''), e.price, e.price,
       e.price_from, e.duration_min, e.upto, e.emoji, e.color1, e.color2, e.sort_order, e.is_published
from extras e cross join categories c
where c.slug = 'services'
on conflict (slug) do nothing;

update products p set cover_media_id = m.id
from extras e join media m on m.path = e.photo_url or m.storage_path = e.photo_url
where p.slug = e.slug and p.cover_media_id is null;

-- программы квестов и мастер-классов; цена null = берётся у родителя
insert into products(category_id, parent_id, slug, title, short_desc, price_weekday, price_weekend, sort_order)
select p.category_id, p.id, e.slug || '-' || o.ord, o.opt->>'name', coalesce(o.opt->>'meta',''), null, null, o.ord
from extras e
join products p on p.slug = e.slug
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(e.options) = 'array' then e.options else '[]'::jsonb end
) with ordinality as o(opt, ord)
on conflict (slug) do nothing;

-- тайм-карты и «Безлимит»: у вариантов прежние id, старые заявки не ломаются
insert into products(category_id, slug, title, description, price_weekday, price_weekend, price_from, qty_mode, max_qty, sort_order)
select c.id, v.slug, v.title, v.descr, v.price, v.price, true, 'quantity', 30, v.srt
from categories c,
     (select value t from site_settings where key = 'tiers') s,
     lateral (values
       ('time-cards','Тайм-карты на автоматы','Между играми нужно выждать 50 секунд.', (s.t->>'timeCards30')::numeric, 10),
       ('unlimited','Входной билет «Безлимит»','Безлимитный вход в игровую зону на весь день. Цена за одного ребёнка.', (s.t->>'unlimitedWeekday')::numeric, 20)
     ) v(slug, title, descr, price, srt)
where c.slug = 'tickets'
on conflict (slug) do nothing;

insert into products(category_id, parent_id, slug, title, price_weekday, price_weekend, duration_min, day_type, qty_mode, max_qty, sort_order)
select p.category_id, p.id, v.slug, v.title, v.price, v.price, v.dur, v.day, 'quantity', 30, v.srt
from (select value t from site_settings where key = 'tiers') s,
     lateral (values
       ('time-cards','timeCards','30 минут',(s.t->>'timeCards30')::numeric,30,'any',1),
       ('time-cards','timeCards60','60 минут',(s.t->>'timeCards60')::numeric,60,'any',2),
       ('unlimited','unlimitedTicket','Будни',(s.t->>'unlimitedWeekday')::numeric,0,'weekday',1),
       ('unlimited','unlimitedTicketWeekend','Выходные',(s.t->>'unlimitedWeekend')::numeric,0,'weekend',2)
     ) v(parent, slug, title, price, dur, day, srt)
join products p on p.slug = v.parent
on conflict (slug) do nothing;

-- комнаты
insert into products(category_id, slug, title, short_desc, price_weekday, price_weekend, duration_min, capacity, gallery_id, sort_order, attrs)
select c.id, v.slug, v.title, v.sd, v.price, v.price, 120, v.cap, g.id, v.srt, jsonb_build_object('extendPerHour', v.ext)
from categories c,
     (select (value->>'roomBase')::numeric rb, (value->>'duoBase')::numeric db,
             (value->>'extendPerHour')::numeric ex
        from site_settings where key = 'rooms') r,
     lateral (values
       ('jungle-room','Комната «Джунгли»','Яркая комната для детей помладше.', r.rb, 'до 12 человек', r.ex, 'jungle', 10),
       ('loft-room','Комната «Лофт»','Стильная комната для детей постарше.', r.rb, 'до 20 человек', r.ex, 'loft', 20),
       ('duo-room','«Джунгли» + «Лофт»','Обе комнаты для большой компании.', r.db, null, r.ex * 2, null, 30)
     ) v(slug, title, sd, price, cap, ext, gal, srt)
left join galleries g on g.slug = v.gal
where c.slug = 'rooms'
on conflict (slug) do nothing;

-- активности: цены подставит seed из packages.js
insert into products(category_id, slug, title, min_age, gallery_id, bookable, is_published, sort_order)
select c.id, v.slug, v.title, v.age, g.id, false, true, v.srt
from categories c,
     (select value a from site_settings where key = 'ages') s,
     lateral (values
       ('qzar','Лазертаг Кузар',(s.a->>'kuzar')::int,'kuzar',10),
       ('lavaFloor','Лава-пол',(s.a->>'lavaFloor')::int,'lava',20)
     ) v(slug, title, age, gal, srt)
left join galleries g on g.slug = v.gal
where c.slug = 'activities'
on conflict (slug) do nothing;

-- ── настройки: только добавляем ────────────────────────────
update site_settings set value = value || '{"mapLat":59.8252,"mapLon":30.3808}'::jsonb
where key = 'contacts' and not value ? 'mapLat';

insert into site_settings(key, value) values
  ('booking_rules','{"startFrom":"10:00","startTo":"21:59","maxMonthsAhead":12,"weekendDays":[0,6],"maxQtyPerItem":30}'),
  ('brand','{"name":"Планета Игр"}'),
  ('theme','{"red":"#e2231a","blue":"#1f5fd6","green":"#28a745","yellow":"#ffc72c","dark":"#111a3b","font":"Nunito","effects":true}'),
  ('seo','{}'), ('order_form','{}'), ('analytics','{}'), ('notifications','{}')
on conflict (key) do nothing;

insert into promo_codes(code, kind, value) values ('PLANETA10','percent',10)
on conflict (code) do nothing;

insert into blocks(key, sort_order) values
  ('hero',10),('area',20),('rooms',30),('packages',40),('activities',50),
  ('services',60),('reviews',70),('contacts',80),('footer',90)
on conflict (key) do nothing;
