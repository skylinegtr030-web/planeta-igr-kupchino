#!/usr/bin/env python3
"""Перенос assets/data/content.json из Планеты Игр в SQL-сид для НОВОЙ базы.
Запуск:  python3 migrate_content.py /path/to/content.json > 05_seed_planeta.sql
"""
import json, sys, re

src = sys.argv[1]
c = json.load(open(src, encoding='utf-8'))
q = lambda s: "'" + str(s).replace("'", "''") + "'"
j = lambda o: q(json.dumps(o, ensure_ascii=False))
out = []

for key in ('contacts','ages','tiers','rooms','extras'):
    if key in c:
        out.append(f"insert into site_settings(key,value) values({q(key)},{j(c[key])}) on conflict (key) do update set value=excluded.value;")

names = {'malysh':'Малыш','jungle':'Джунгли','king':'Королевский','cyber':'Кибер'}
out.append("insert into categories(slug,title,sort_order) values('packs','Пакеты',1) on conflict (slug) do nothing;")
for i,(slug,price) in enumerate(c.get('packs',{}).items()):
    title = names.get(slug, slug)
    out.append(
      "insert into products(category_id,slug,title,price_weekday,price_weekend,sort_order) "
      f"select id,{q(slug)},{q(title)},{price},{price},{i} from categories where slug='packs' "
      "on conflict (slug) do update set price_weekday=excluded.price_weekday;")

for gslug, paths in c.get('photos', {}).items():
    out.append(f"insert into galleries(slug,title) values({q(gslug)},{q(gslug)}) on conflict (slug) do nothing;")
    for i, p in enumerate(paths):
        sp = re.sub(r'^assets/images/', '', p)
        folder = sp.rsplit('/', 1)[0] if '/' in sp else ''
        out.append(f"insert into media(storage_path,folder,alt) values({q(sp)},{q(folder)},{q('')}) on conflict (bucket,storage_path) do nothing;")
        out.append(
          "insert into gallery_media(gallery_id,media_id,sort_order) "
          f"select g.id,m.id,{i} from galleries g, media m where g.slug={q(gslug)} and m.storage_path={q(sp)} "
          "on conflict do nothing;")

print('\n'.join(out))
