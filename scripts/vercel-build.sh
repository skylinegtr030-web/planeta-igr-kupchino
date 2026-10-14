#!/usr/bin/env bash
# Сборка превью для Vercel: витрина + админка + фото-заглушки (без базы).
set -euo pipefail
npm run build -w @pi/shared
npm run build -w @pi/web
npm run build -w @pi/admin
D=apps/web/dist
mkdir -p "$D/admin" "$D/ph/hero" "$D/api"
cp -R apps/admin/dist/. "$D/admin/"
cp -R scripts/seed-media/. "$D/ph/"
# фото парка из ветки main кладём на сам сайт: raw.githubusercontent.com из РФ сбоит
RAW=https://raw.githubusercontent.com/skylinegtr030-web/planeta-igr-kupchino/main/assets/images/hero
for i in 1 2 3 4 5 6; do curl -fsSL --retry 3 -o "$D/ph/hero/hero-collage-$i.jpg" "$RAW/hero-collage-$i.jpg"; done
sed -i "s#$RAW/#/ph/hero/#g" "$D/stub/content.json"
# комнаты: от 7 000 ₽ за 2 часа (как в блоке «Вопросы»)
sed -i 's/"priceWeekday":5000,"priceWeekend":5000/"priceWeekday":7000,"priceWeekend":7000/g' "$D/stub/catalog.json"
# заглушки API — обычными файлами по тем же адресам, без rewrites
for n in content catalog settings reviews; do cp "$D/stub/$n.json" "$D/api/$n"; done
