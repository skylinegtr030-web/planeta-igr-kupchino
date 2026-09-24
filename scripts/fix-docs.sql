-- Правки документов: дети до 4 лет с сопровождением; в документах телефон юрлица вместо публичного
begin;
update content_blocks set data = jsonb_set(data, '{body}', to_jsonb(replace(replace(data->>'body', 'Дети до 7 лет находятся в парке', 'Дети до 4 лет находятся в парке'), '{{contacts.phone}}', '{{company.phone}}')))
where key like 'doc.%' and data ? 'body';
commit;
select key, data->>'title' as title, position('до 4 лет' in data->>'body') > 0 as "до 4 лет", position('contacts.phone' in data->>'body') > 0 as "остался contacts.phone" from content_blocks where key like 'doc.%' order by key;
