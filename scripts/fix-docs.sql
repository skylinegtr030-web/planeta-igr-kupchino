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
