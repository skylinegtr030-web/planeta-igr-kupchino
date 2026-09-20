-- Начальные данные: контакты, цены, пакеты
-- Запускать после 01_schema.sql
-- on conflict do update — безопасно повторять

\set ON_ERROR_STOP on

-- Контакты
insert into site_settings(key,value) values(
  'contacts',
  '{"addressShort":"Балканская ул., 17","addressFull":"Балканская улица, 17, ТРК «Балкания Nova», 3 этаж","phone":"+7 981 818-01-34","hours":"10:00–22:00","mapQuery":"Санкт-Петербург, Балканская улица, 17","mapLat":59.8252,"mapLon":30.3808}'
) on conflict (key) do update set value=excluded.value;

-- Возрастные ограничения
insert into site_settings(key,value) values(
  'ages','{"kuzar":7,"lavaFloor":4}'
) on conflict (key) do update set value=excluded.value;

-- Безлимит и карточки
insert into site_settings(key,value) values(
  'tiers','{"timeCards30":1290,"timeCards60":2190,"unlimitedWeekday":1500,"unlimitedWeekend":1800}'
) on conflict (key) do update set value=excluded.value;

-- Доплата за зал
insert into site_settings(key,value) values(
  'rooms','{"extendOne":2500,"extendTwo":5000}'
) on conflict (key) do update set value=excluded.value;

-- Дополнительные услуги
insert into site_settings(key,value) values(
  'extras','{"azot":13000,"neon":10000,"bubbles":10000,"challenge":8500,"pinata":4000,"masterclass":10000,"quest":8000,"animator":8000,"magician":15000}'
) on conflict (key) do update set value=excluded.value;

-- Категория пакетов
insert into categories(slug,title,sort_order)
values('packs','Пакеты',1)
on conflict (slug) do nothing;

-- Пакеты
insert into products(category_id,slug,title,price_weekday,price_weekend,sort_order)
select id,'malysh','Малыш',24500,24500,0 from categories where slug='packs'
on conflict (slug) do update set price_weekday=excluded.price_weekday, price_weekend=excluded.price_weekend;

insert into products(category_id,slug,title,price_weekday,price_weekend,sort_order)
select id,'jungle','Джунгли',33000,33000,1 from categories where slug='packs'
on conflict (slug) do update set price_weekday=excluded.price_weekday, price_weekend=excluded.price_weekend;

insert into products(category_id,slug,title,price_weekday,price_weekend,sort_order)
select id,'king','Королевский',50500,50500,2 from categories where slug='packs'
on conflict (slug) do update set price_weekday=excluded.price_weekday, price_weekend=excluded.price_weekend;

insert into products(category_id,slug,title,price_weekday,price_weekend,sort_order)
select id,'cyber','Кибер',36500,36500,3 from categories where slug='packs'
on conflict (slug) do update set price_weekday=excluded.price_weekday, price_weekend=excluded.price_weekend;

-- Галереи
insert into galleries(slug,title) values('collage','Коллаж') on conflict (slug) do nothing;
insert into galleries(slug,title) values('jungle','Джунгли') on conflict (slug) do nothing;
insert into galleries(slug,title) values('loft','Лофт')    on conflict (slug) do nothing;
