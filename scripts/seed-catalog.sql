-- Каталог и настройки «Планеты Игр». Порядок: seed-rooms → seed-activities → seed-catalog → seed-media. Повторный запуск безопасен.
begin;
insert into categories (slug,title,kind,sort)
select slug,title,kind,sort from jsonb_to_recordset('[
{"slug":"packs","title":"Программы","kind":"package","sort":0},
{"slug":"rooms","title":"Комнаты","kind":"room","sort":10},
{"slug":"services","title":"Шоу и программы","kind":"service","sort":20},
{"slug":"addons","title":"Дополнения","kind":"service","sort":30},
{"slug":"tickets","title":"Билеты и тайм-карты","kind":"ticket","sort":40},
{"slug":"activities","title":"Активности","kind":"activity","sort":50}
]') as x(slug text,title text,kind text,sort int)
on conflict (slug) do update set title=excluded.title,kind=excluded.kind,sort=excluded.sort;

insert into products (category_id,slug,title,description,price_weekday,price_weekend,price_from,duration_min,min_age,cover_media_id,attrs,sort)
select c.id,x.slug,x.title,coalesce(x.description,''),x.wd,coalesce(x.we,x.wd),coalesce(x.pf,false),coalesce(x.dur,0),x.age,(select id from media m where m.storage_path=x.cover),coalesce(x.attrs,'{}'),x.sort
from jsonb_to_recordset('[
{"cat":"packs","sort":0,"slug":"malysh","title":"Малыш JO","description":"До 10 человек · 3 часа","wd":24000,"we":27000,"dur":180,"attrs":{"mark":"Для малышей","features":["Банкетная комната — 3 часа","Праздничная сервировка","Анимационная программа — 1 час","Билеты «Безлимит»","Подарок имениннику","Шар-сюрприз в подарок"]}},
{"cat":"packs","sort":10,"slug":"jungle","title":"Гости в джунглях","description":"До 10 человек · 3 часа","wd":37900,"we":41900,"dur":180,"attrs":{"mark":"Популярный","features":["Банкетная комната — 3 часа","Праздничная сервировка","Анимационная программа — 1 час","Билеты «Безлимит»","Аквагрим / блеск-тату / 10 гелиевых шаров — на выбор","Именные электронные приглашения","10 тайм-карт на 30 минут","Подарок имениннику","Пиньята в подарок"]}},
{"cat":"packs","sort":20,"slug":"king","title":"Король саванны","description":"До 10 человек · 3 часа","wd":84100,"we":88100,"dur":180,"attrs":{"mark":"Максимум","features":["Банкетная комната — 3 часа","Праздничная сервировка","10 гелиевых шаров","Анимационная программа — 1 час","Мастер-класс / шоу / квест — на выбор","Билеты «Безлимит»","Лавапол — 30 минут","Аквагрим / блеск-тату — на выбор","Лазертаг Q-ZAR — 1 час","10 тайм-карт на 1 час","Именные электронные приглашения","Серебряное шоу в подарок"]}},
{"cat":"packs","sort":30,"slug":"cyber","title":"Кибер Пати","description":"До 10 человек · 3 часа","wd":45900,"dur":180,"attrs":{"mark":"Технологичный","features":["Банкетная комната — 3 часа","Праздничная сервировка","Лазертаг Q-ZAR — 1 час","Лавапол — 20 минут","10 тайм-карт на 1 час"]}},
{"cat":"rooms","sort":0,"slug":"jungle-room","title":"Комната «Джунгли»","wd":7000,"pf":true,"dur":120,"cover":"rooms/jungle/f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg","attrs":{"capacity":"до 12 человек","extendPerHour":2500}},
{"cat":"rooms","sort":10,"slug":"loft-room","title":"Комната «Лофт»","wd":7000,"pf":true,"dur":120,"cover":"rooms/loft/9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg","attrs":{"capacity":"до 20 человек","extendPerHour":2500}},
{"cat":"services","sort":0,"slug":"animator","title":"Анимационная программа","wd":7500,"dur":60},
{"cat":"services","sort":10,"slug":"quest","title":"Квест","wd":8500,"dur":40},
{"cat":"services","sort":20,"slug":"bubbles","title":"Мыльные пузыри / Крио-шоу","wd":9000,"dur":30},
{"cat":"services","sort":30,"slug":"pinata","title":"Пиньята","wd":4000,"dur":15},
{"cat":"services","sort":40,"slug":"masterclass","title":"Мастер-класс","wd":10000,"dur":40},
{"cat":"services","sort":50,"slug":"sciShow","title":"Научное шоу / Тесла-шоу / Жонглёр-шоу","description":"Эффектная программа на выбор — химические опыты, шоу катушки Тесла или зажигательный жонглёр. 40 минут ярких эмоций.","wd":12000,"dur":40},
{"cat":"addons","sort":0,"slug":"invite","title":"Именное электронное пригласительное","description":"Именная электронная открытка-приглашение для гостей праздника — удобно разослать всем заранее.","wd":500},
{"cat":"addons","sort":10,"slug":"tables","title":"Аренда столиков на площадке","description":"Столик на игровой площадке — 1 000 ₽ за час или 5 000 ₽ за безлимитное пребывание в течение дня.","wd":1000,"dur":60},
{"cat":"addons","sort":20,"slug":"balloonFountain","title":"Фонтан из 10 гелиевых шаров","description":"Яркий фонтан из десяти гелиевых шаров для оформления праздничного стола или фотозоны.","wd":2600},
{"cat":"addons","sort":30,"slug":"surpriseBalloon","title":"Шар-сюрприз","description":"Большой шар с сюрпризом внутри — эффектный момент праздника, когда именинник его лопает.","wd":2500},
{"cat":"addons","sort":40,"slug":"serving","title":"Дополнительная сервировка","description":"Дополнительный комплект праздничной сервировки стола на одного гостя сверх включённого в пакет.","wd":1000},
{"cat":"tickets","sort":0,"slug":"unlimited","title":"Входной билет «Безлимит»","description":"Безлимитный вход в игровую зону на весь день. Цена за одного ребёнка.","wd":1500,"we":1800},
{"cat":"tickets","sort":10,"slug":"time-cards","title":"Тайм-карты на автоматы","description":"Между играми нужно выждать 50 секунд.","wd":1290,"attrs":{"options":[{"label":"30 минут","price":1290},{"label":"60 минут","price":2190}]}},
{"cat":"activities","sort":0,"slug":"qzar","title":"Лазертаг Q-ZAR","wd":600,"pf":true,"dur":20,"age":6},
{"cat":"activities","sort":10,"slug":"lavaFloor","title":"Лавапол","wd":400,"pf":true,"dur":10,"age":4}
]') as x(cat text,slug text,title text,description text,wd numeric,we numeric,pf boolean,dur int,age int,cover text,attrs jsonb,sort int)
join categories c on c.slug=x.cat
on conflict (slug) do update set category_id=excluded.category_id,title=excluded.title,description=excluded.description,price_weekday=excluded.price_weekday,price_weekend=excluded.price_weekend,price_from=excluded.price_from,duration_min=excluded.duration_min,min_age=excluded.min_age,cover_media_id=coalesce(excluded.cover_media_id,products.cover_media_id),attrs=excluded.attrs,sort=excluded.sort;

insert into settings (key,value)
select key,value from jsonb_each('{
"contacts":{"phone":"+7 981 818-01-34","hours":"10:00–22:00","addressFull":"Балканская пл., 5, ТРК «Балкания Nova», 3 этаж","addressShort":"ТРК «Балкания Nova»","mapQuery":"Планета Игр, ТРК Балкания Nova, Санкт-Петербург"},
"ages":{"lavaFloor":4,"kuzar":6},
"tiers":{"timeCards30":1290,"timeCards60":2190,"unlimitedWeekday":1500,"unlimitedWeekend":1800,"kuzar":6},
"booking_rules":{"weekendDays":[0,6]}
}')
on conflict (key) do update set value=settings.value||excluded.value;
commit;
