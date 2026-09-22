-- 003: единый каталог в products. Ничего не удаляет: extras и дубли в site_settings уберёт 004.
update media set folder = "group" where folder = '' and "group" <> '';

insert into media(path, storage_path, alt, "group", folder, sort_order)
select e.photo_url, e.photo_url, e.title, 'extras', 'extras', e.sort_order
  from extras e
 where coalesce(e.photo_url, '') <> ''
   and not exists (select 1 from media m where m.path = e.photo_url or m.storage_path = e.photo_url);

update products p set cover_media_id = m.id
  from extras e join media m on m.path = e.photo_url
 where p.slug = e.slug and p.cover_media_id is null;

update products p set
       emoji      = coalesce(p.emoji, e.emoji),
       color1     = coalesce(p.color1, e.color1),
       color2     = coalesce(p.color2, e.color2),
       capacity   = coalesce(p.capacity, nullif(e.upto, '')),
       sort_order = e.sort_order
  from extras e where p.slug = e.slug;

update products set
       min_age      = coalesce(min_age, substring(short_desc from '^(\d+)')::int),
       duration_min = case when duration_min = 0
                           then coalesce(substring(short_desc from '(\d+) мин')::int, 0)
                           else duration_min end
 where parent_id is not null and short_desc ~ '^\d+';

insert into galleries(slug, title) values ('duo', '«Джунгли» + «Лофт»') on conflict (slug) do nothing;
insert into gallery_media(gallery_id, media_id, sort_order)
select d.id, gm.media_id, (row_number() over (order by g.slug, gm.sort_order))::int * 10
  from galleries d
 cross join galleries g
  join gallery_media gm on gm.gallery_id = g.id
 where d.slug = 'duo' and g.slug in ('jungle', 'loft')
on conflict do nothing;

update products p set gallery_id = g.id
  from galleries g,
       (values ('jungle-room','jungle'), ('loft-room','loft'), ('duo-room','duo'),
               ('qzar','kuzar'), ('lavaFloor','lava')) as map(product, gallery)
 where p.slug = map.product and g.slug = map.gallery and p.gallery_id is null;
