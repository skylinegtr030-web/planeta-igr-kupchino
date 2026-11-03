-- Фото: первый экран, игровой парк, обложки услуг. Запускать после seed-catalog.sql. Повторный запуск безопасен.
-- Файлы: assets/images из ветки main → runtime/uploads/assets/images, scripts/seed-media/* → runtime/uploads/
begin;
insert into media (storage_path,alt,folder,mime,width,height) select 'assets/images/hero/hero-collage-'||i||'.jpg','Планета Игр — игровой парк','hero','image/jpeg',1600,1200 from generate_series(1,6) i on conflict (storage_path) do nothing;
insert into galleries (slug,title) values ('park-hero','Первый экран'),('park-slides','Игровой парк') on conflict (slug) do nothing;
insert into gallery_media (gallery_id,media_id,sort) select g.id,m.id,(regexp_match(m.storage_path,'(\d)\.jpg'))[1]::int*10 from galleries g, media m where g.slug in ('park-hero','park-slides') and m.folder='hero' on conflict do nothing;
insert into content_blocks (key,data) values
 ('park.hero','{"title":"Первый экран","kind":"hero","gallery":"park-hero","sort":0,"text":"","published":true}'),
 ('park.slides','{"title":"Игровой парк","kind":"zone","gallery":"park-slides","sort":10,"text":"Целый этаж приключений: горки, лабиринты, батуты и сухой бассейн для детей любого возраста.","published":true}')
 on conflict (key) do nothing;
with c(slug,f) as (values ('animator','animator'),('quest','quest'),('bubbles','bubbles'),('pinata','pinata'),('masterclass','masterclass'),('sciShow','science-show'),('invite','invitation'),('tables','tables'),('balloonFountain','balloon-fountain'),('surpriseBalloon','surprise-balloon'),('serving','serving'),('unlimited','unlimited-ticket'),('time-cards','time-cards'),('qzar','qzar'),('lavaFloor','lava-floor')),
 ins as (insert into media (storage_path,alt,folder,mime) select 'assets/images/services/'||c.f||'.jpg',p.title,'services','image/jpeg' from c join products p on p.slug=c.slug on conflict (storage_path) do nothing returning id)
select count(*) from ins;
update products p set cover_media_id=m.id from media m where p.cover_media_id is null and m.folder='services' and m.alt=p.title;
commit;
