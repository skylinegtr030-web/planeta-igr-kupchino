-- Зоны «Лазертаг Q-ZAR» и «Лава-пол»: фото + галереи + блоки. Файлы: scripts/seed-media/activities → runtime/uploads/activities (scripts/seed-activities.sh)
begin;
insert into media (storage_path, alt, folder, mime, width, height, bytes, is_active) values
('activities/lasertag/kuzar-real-arena-1.jpg', 'Лазертаг Q-ZAR — неоновая арена', 'activities', 'image/jpeg', 1600, 1200, 280462, true),
('activities/lasertag/kuzar-real-arena-2.jpg', 'Лазертаг Q-ZAR — неоновая арена', 'activities', 'image/jpeg', 1600, 1200, 182247, true),
('activities/lasertag/kuzar-real-arena-3.jpg', 'Лазертаг Q-ZAR — неоновая арена', 'activities', 'image/jpeg', 1600, 1200, 144128, true),
('activities/lava/lava-pol-real-1.jpg', 'Лава-пол — интерактивный светящийся пол', 'activities', 'image/jpeg', 1600, 1200, 342688, true),
('activities/lava/lava-pol-real-2.jpg', 'Лава-пол — интерактивный светящийся пол', 'activities', 'image/jpeg', 1200, 1600, 311592, true),
('activities/lava/lava-pol-real-3.jpg', 'Лава-пол — интерактивный светящийся пол', 'activities', 'image/jpeg', 1600, 1200, 339090, true)
on conflict (storage_path) do update set alt = excluded.alt, width = excluded.width, height = excluded.height, bytes = excluded.bytes, is_active = true;
insert into galleries (slug, title) values ('park-lasertag', 'Лазертаг Q-ZAR'), ('park-lava', 'Лава-пол')
on conflict (slug) do update set title = excluded.title;
insert into gallery_media (gallery_id, media_id, sort)
select g.id, m.id, v.sort from (values
('park-lasertag', 'activities/lasertag/kuzar-real-arena-1.jpg', 0),
('park-lasertag', 'activities/lasertag/kuzar-real-arena-2.jpg', 10),
('park-lasertag', 'activities/lasertag/kuzar-real-arena-3.jpg', 20),
('park-lava', 'activities/lava/lava-pol-real-1.jpg', 0),
('park-lava', 'activities/lava/lava-pol-real-2.jpg', 10),
('park-lava', 'activities/lava/lava-pol-real-3.jpg', 20)
) v(g, p, sort) join galleries g on g.slug = v.g join media m on m.storage_path = v.p
on conflict (gallery_id, media_id) do update set sort = excluded.sort;
insert into content_blocks (key, data) values
('park.lasertag', jsonb_build_object('title', 'Лазертаг Q-ZAR', 'kind', 'zone', 'gallery', 'park-lasertag', 'sort', 62, 'text', 'Лазерные бои на неоновой арене с укрытиями и подсветкой. Командная игра на 20 минут — от 600 ₽ с человека.', 'published', true)),
('park.lava', jsonb_build_object('title', 'Лава-пол', 'kind', 'zone', 'gallery', 'park-lava', 'sort', 64, 'text', 'Интерактивный светящийся пол: плитки меняют цвет под ногами, игры на реакцию и танцы. Сеанс 10 минут — от 400 ₽.', 'published', true))
on conflict (key) do update set data = content_blocks.data || jsonb_build_object('title', excluded.data->>'title', 'text', excluded.data->>'text', 'published', true);
commit;
select b.data->>'title' as "зона", count(gm.*) as "фото" from content_blocks b join galleries g on g.slug = b.data->>'gallery' left join gallery_media gm on gm.gallery_id = g.id where b.key in ('park.lasertag','park.lava') group by 1 order by 1;
