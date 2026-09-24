-- Документы: дети до 4 лет; без телефонов; реквизиты — только то, что требует закон (наименование, адрес, ИНН/КПП, ОГРН)
begin;
update content_blocks set data = jsonb_set(data, '{body}', to_jsonb(
  replace(replace(replace(replace(replace(replace(data->>'body',
    'Дети до 7 лет находятся в парке', 'Дети до 4 лет находятся в парке'),
    E'- Телефон: {{contacts.phone}}\n', ''),
    'по телефону {{contacts.phone}} или письменно по адресу', 'письменно по адресу'),
    ' Телефон: {{contacts.phone}}.', ' '),
    'Вопросы по Соглашению принимаются по телефону {{contacts.phone}}.', 'Вопросы по Соглашению принимаются письменно по адресу {{company.legalAddress}} или через форму на Сайте.'),
    '{{company.phone}}', '')))
where key like 'doc.%' and data ? 'body';
update settings set value = value - 'bank' - 'bik' - 'account' - 'corrAccount' - 'director' - 'phone' where key = 'company';
commit;
select key, data->>'title' as title, position('до 4 лет' in data->>'body') > 0 as "до 4 лет", position('phone' in data->>'body') > 0 as "остался телефон" from content_blocks where key like 'doc.%' order by key;
select value as company from settings where key = 'company';

-- Политика: точный раздел про cookie и статистику (сентябрь 2026)
begin;
update content_blocks set data = jsonb_set(data, '{body}', to_jsonb(
  regexp_replace(data->>'body',
    '## 7\. Cookie и статистика\n[^\n]*\n',
    E'## 7. Cookie и статистика {#cookie}\nСайт не использует сторонние счётчики и рекламные трекеры (Яндекс Метрика, Google Analytics, пиксели соцсетей не установлены). Используются только:\n- **Локальное хранилище браузера (localStorage)** — запись о том, что Пользователь принял уведомление о cookie. Хранится в браузере Пользователя, на сервер не передаётся.\n- **Сессионная cookie `pi_session`** — устанавливается только сотрудникам Компании при входе в панель управления; посетителям Сайта не устанавливается.\n- **Собственная обезличенная статистика посещений** — на сервере сохраняются адрес просмотренной страницы, источник перехода, тип устройства и время. Вместо IP-адреса и идентификатора браузера сохраняется необратимый суточный хэш, который не позволяет установить личность Пользователя. Данные статистики хранятся не более 13 месяцев и используются исключительно для оценки посещаемости и улучшения Сайта.\nПользователь может отключить cookie и localStorage в настройках браузера; при этом уведомление о cookie будет показываться при каждом посещении, остальные функции Сайта сохраняются.\n')))
where key = 'doc.privacy';
update content_blocks set data = jsonb_set(data, '{body}', to_jsonb(replace(data->>'body',
  '- обезличенные технические данные: IP-адрес, тип браузера и устройства, данные cookie, сведения о просмотренных страницах.',
  '- обезличенные технические данные: тип браузера и устройства, источник перехода, сведения о просмотренных страницах (IP-адрес не сохраняется — см. раздел 7).')))
where key = 'doc.privacy';
commit;
select position('{#cookie}' in data->>'body') > 0 as "раздел cookie обновлён" from content_blocks where key = 'doc.privacy';
