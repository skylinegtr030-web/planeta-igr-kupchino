-- Цены билетов по данным клиента (24.09.2026):
--  тайм-карты на автоматы: 30 минут 1290, 60 минут 2190
--  входной билет «Безлимит»: будни 1500, выходные и праздники 1800
--  лава-пол: 10 минут — от 400 ₽
begin;
update products set attrs = attrs || '{"options":[{"label":"30 минут","price":1290},{"label":"60 минут","price":2190}]}'::jsonb,
  price_weekday = 1290, price_weekend = 1290
  where (slug ilike '%time%' or title ilike '%тайм%' or title ilike '%автомат%') and parent_id is null
    and category_id in (select id from categories where kind in ('ticket','activity'));
update products set price_weekday = 1500, price_weekend = 1800, attrs = attrs - 'options'
  where (slug ilike '%unlim%' or title ilike '%безлимит%' or title ilike '%входной%') and parent_id is null
    and category_id in (select id from categories where kind in ('ticket','activity'));
update products set price_weekday = 400, price_weekend = 400, price_from = true, duration_min = 10, attrs = attrs - 'options'
  where (slug ilike '%lava%' or title ilike '%лава%') and parent_id is null
    and category_id in (select id from categories where kind in ('ticket','activity'));
update settings set value = value || '{"timeCards30":1290,"timeCards60":2190,"unlimitedWeekday":1500,"unlimitedWeekend":1800}'::jsonb where key = 'tiers';
insert into settings (key, value) select 'tiers', '{"timeCards30":1290,"timeCards60":2190,"unlimitedWeekday":1500,"unlimitedWeekend":1800}'::jsonb where not exists (select 1 from settings where key = 'tiers');
commit;
select p.title, p.price_weekday, p.price_weekend, p.price_from, p.duration_min, p.attrs->'options' as options
from products p join categories c on c.id = p.category_id where c.kind in ('ticket','activity') and p.parent_id is null order by p.sort;

-- Лазертаг Q-ZAR: от 600 ₽ за 20 минут (уточнение клиента 24.09.2026)
update products set price_weekday = 600, price_weekend = 600, price_from = true, duration_min = 20, attrs = attrs - 'options'
  where (slug ilike '%zar%' or title ilike '%лазертаг%' or title ilike '%кузар%') and parent_id is null
    and category_id in (select id from categories where kind in ('ticket','activity'));
select p.title, p.price_weekday, p.price_from, p.duration_min from products p join categories c on c.id = p.category_id where c.kind in ('ticket','activity') and p.parent_id is null order by p.sort;
