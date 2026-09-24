-- Банкетные комнаты «Джунгли» и «Лофт»: фото + галереи + блоки зон.
-- Файлы копируются из scripts/seed-media/rooms в runtime/uploads/rooms (см. scripts/seed-rooms.sh).
begin;
insert into media (storage_path, alt, folder, mime, width, height, bytes, is_active) values
('rooms/jungle/f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg', 'Комната «Джунгли» — стол и неоновая надпись', 'rooms', 'image/jpeg', 1332, 888, 231412, true),
('rooms/jungle/fe0f8752-696e-4f60-9c88-fcea23ef4103.jpeg', 'Комната «Джунгли» — стена с животными', 'rooms', 'image/jpeg', 1102, 735, 156477, true),
('rooms/loft/9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg', 'Комната «Лофт» — звезда и гирлянда', 'rooms', 'image/jpeg', 1448, 1086, 366780, true),
('rooms/loft/a1f34b81-2c83-43d4-beb4-c847afdeb72c.jpeg', 'Комната «Лофт» — стол с золотой сервировкой', 'rooms', 'image/jpeg', 1448, 1086, 353357, true)
on conflict (storage_path) do update set alt = excluded.alt, width = excluded.width, height = excluded.height, bytes = excluded.bytes, is_active = true;
insert into galleries (slug, title) values ('park-jungle', 'Комната «Джунгли»'), ('park-loft', 'Комната «Лофт»')
on conflict (slug) do update set title = excluded.title;
insert into gallery_media (gallery_id, media_id, sort)
select g.id, m.id, v.sort from (values
('park-jungle', 'rooms/jungle/f6fc031b-b47f-457a-b2e5-8226815ad9c0.jpeg', 0),
('park-jungle', 'rooms/jungle/fe0f8752-696e-4f60-9c88-fcea23ef4103.jpeg', 10),
('park-loft', 'rooms/loft/9bf12eb4-5342-47a2-9f0c-df9f864f0405.jpeg', 0),
('park-loft', 'rooms/loft/a1f34b81-2c83-43d4-beb4-c847afdeb72c.jpeg', 10)
) v(g, p, sort) join galleries g on g.slug = v.g join media m on m.storage_path = v.p
on conflict (gallery_id, media_id) do update set sort = excluded.sort;
insert into content_blocks (key, data) values
('park.jungle', jsonb_build_object('title', 'Комната «Джунгли»', 'kind', 'zone', 'gallery', 'park-jungle', 'sort', 90, 'text', 'Зелёная комната с настенными джунглями — жираф, зебра, слон и обезьянки среди листвы, живой декор и неоновая надпись «С Днём Рождения». До 20 гостей.', 'published', true)),
('park.loft', jsonb_build_object('title', 'Комната «Лофт»', 'kind', 'zone', 'gallery', 'park-loft', 'sort', 92, 'text', 'Чёрно-золотая комната в индустриальном стиле — белый кирпич, деревянные панели, светящаяся звезда и гирлянда лампочек. Эффектные фото и взрослая компания.', 'published', true))
on conflict (key) do update set data = content_blocks.data || jsonb_build_object('title', excluded.data->>'title', 'text', excluded.data->>'text');
-- старый общий блок «Банкетная комната» скрываем: его заменяют две комнаты (вернуть можно в админке)
update content_blocks set data = data || '{"published": false}'::jsonb where key = 'park.banquet';
commit;
select b.data->>'title' as "зона", count(gm.*) as "фото" from content_blocks b join galleries g on g.slug = b.data->>'gallery' left join gallery_media gm on gm.gallery_id = g.id where b.key in ('park.jungle','park.loft','park.banquet') group by 1 order by 1;
