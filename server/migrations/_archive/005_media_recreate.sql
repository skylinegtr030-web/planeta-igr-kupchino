-- 005: пересоздаём media с правильной схемой
-- (media раньше существовала без нужных колонок)
drop table if exists media cascade;

create table media (
  id         serial primary key,
  path       text not null unique,
  alt        text not null default '',
  "group"    text not null default '',
  sort_order integer not null default 100,
  is_active  boolean not null default true
);

create index media_group_idx on media ("group", sort_order);

insert into media (path, alt, "group", sort_order) values
  ('assets/images/hero/hero-collage-1.jpg',                    'Праздник в Планете Игр',                     'hero',        10),
  ('assets/images/hero/hero-collage-2.jpg',                    'Аниматоры Планета Игр',                      'hero',        20),
  ('assets/images/hero/hero-collage-3.jpg',                    'Праздничная программа',                      'hero',        30),
  ('assets/images/hero/hero-collage-6.jpg',                    'Игровая зона',                           'hero',        60),
  ('assets/images/rooms/jungle/room-jungle-1.jpg',             'Банкетная комната Джунгли',           'room_jungle', 10),
  ('assets/images/rooms/jungle/room-jungle-2.jpg',             'Банкетная комната Джунгли — вид 2',    'room_jungle', 20),
  ('assets/images/rooms/loft/room-loft-1.jpg',                 'Банкетная комната Лофт',                'room_loft',   10),
  ('assets/images/activities/kuzar/kuzar-real-arena-1.jpg',    'Лазертаг Кузар — неоновый лабиринт',  'kuzar',       10),
  ('assets/images/activities/lava-floor/lava-pol-real-1.jpg',  'Лава-пол — светящийся интерактивный пол', 'lava',        10),
  ('assets/images/extras/extra-bubbles.jpg',                   'Шоу мыльных пузырей',                  'extras',      10),
  ('assets/images/extras/extra-magician.jpg',                  'Шоу фокусника',                         'extras',      20)
on conflict (path) do nothing;
