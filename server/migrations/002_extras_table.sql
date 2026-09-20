-- Таблица дополнительных услуг (шоу, квесты, мастер-классы)
create table if not exists extras (
  id           serial primary key,
  slug         text not null unique,          -- идентификатор: azot, neon, bubbles ...
  title        text not null,                 -- название
  description  text,                         -- описание
  price        integer not null default 0,   -- цена в рублях
  price_from   boolean not null default false, -- «от» цены
  duration_min integer not null default 0,   -- длительность, минут
  upto         text,                         -- «до N человек»
  emoji        text,                         -- эмодзи-иконка
  photo_url    text,                         -- путь к фото, напр. assets/images/extras/azot.jpg
  color1       text default '#e2231a',       -- цвет градиента 1
  color2       text default '#ff8a65',       -- цвет градиента 2
  options      jsonb,                        -- варианты [{name, meta}] для квестов и МК
  sort_order   integer not null default 100,
  is_published boolean not null default true
);

-- Начальные данные (совпадают с хардкодом в index.html)
insert into extras (slug, title, description, price, price_from, duration_min, upto, emoji, photo_url, color1, color2, options, sort_order) values
('azot',       'Азот-шоу',          'Эффектное шоу с жидким азотом — облака холодного пара, яркие эффекты и восторг у детей и взрослых.',                                   13000, false, 20, null,          '🧊', null,                                       '#e2231a', '#ff8a65', null, 10),
('neon',       'Неоновое шоу',      'Световое шоу в неоновых красках с интерактивом для гостей — эффектно смотрится в затемнённой комнате.',                                 10000, false, 20, null,          '💡', null,                                       '#1f5fd6', '#63e6ff', null, 20),
('bubbles',    'Мыльные пузыри',    'Шоу гигантских мыльных пузырей — можно забраться внутрь пузыря и сделать эффектные фото.',                                              10000, false, 20, null,          '🫧', 'assets/images/extras/extra-bubbles.jpg',    '#28a745', '#8fe3a6', null, 30),
('challenge',  'Челлендж-пати',     'Командные конкурсы и весёлые челленджи для всей компании — соревновательный формат праздника.',                                           8500, false, 30, null,          '🏆', null,                                       '#ffc72c', '#ffe27a', null, 40),
('pinata',     'Пинята',            'Яркая пинята со сладкими сюрпризами внутри — весёлая традиция для завершения праздника.',                                                4000, true,  15, null,          '🪅', null,                                       '#e2231a', '#ffc72c', null, 50),
('masterclass','Мастер-класс',      'Творческий мастер-класс на выбор — 40 минут, всё оборудование и материалы включены.',                                                    10000, false, 40, 'до 10 человек','🎨', null,                                       '#28a745', '#63e6ff',
  ''[{"name":"Слайм-лаборатория","meta":"5+ лет · 30–40 мин"},{"name":"Пушистый Монстрик","meta":"4+ лет · 30–40 мин"},{"name":"Свеча из вощины","meta":"5+ лет · 25–30 мин"},{"name":"Роспись шопера","meta":"6+ лет · 40–60 мин"},{"name":"Магнитик на память","meta":"4+ лет · 25–30 мин"}]'',
  60),
('quest',      'Квест',             'Квест с ведущим на выбор — 40 минут ярких приключений для команды именинника.',                                                           8000, false, 40, 'до 12 человек','🗝️', null,                                       '#1f5fd6', '#111a3b',
  ''[{"name":"Академия Супергероев","meta":"5–8 лет · 40 мин"},{"name":"Форт Бойард","meta":"6–10 лет · 45 мин"},{"name":"Алиса в Стране Чудес","meta":"5–8 лет · 40 мин"},{"name":"Мультиквест","meta":"5–6 лет · 40 мин"}]'',
  70),
('animator',   'Аниматор',          'Аниматор в костюме любимого персонажа на 1 час — игры, конкурсы и хорошее настроение для всех гостей.',                                   8000, false, 60, null,          '🎭', null,                                       '#ffc72c', '#e2231a', null, 80),
('magician',   'Фокусник',          'Эффектное шоу фокусника с участием гостей — трюки, магия и восторженные лица детей.',                                                   15000, false, 30, null,          '🎩', 'assets/images/extras/extra-magician.jpg',  '#111a3b', '#1f5fd6', null, 90)
on conflict (slug) do nothing;
