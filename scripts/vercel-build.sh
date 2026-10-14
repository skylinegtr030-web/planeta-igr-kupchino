#!/usr/bin/env bash
# Сборка превью для Vercel: витрина + админка + фото-заглушки (без базы).
set -euo pipefail
npm run build -w @pi/shared
npm run build -w @pi/web
npm run build -w @pi/admin
D=apps/web/dist
mkdir -p "$D/admin" "$D/ph/hero"
cp -R apps/admin/dist/. "$D/admin/"
cp -R scripts/seed-media/. "$D/ph/"
# фото парка из ветки main кладём на сам сайт: raw.githubusercontent.com из РФ сбоит
RAW=https://raw.githubusercontent.com/skylinegtr030-web/planeta-igr-kupchino/main/assets/images/hero
for i in 1 2 3 4 5 6; do curl -fsSL --retry 3 -o "$D/ph/hero/hero-collage-$i.jpg" "$RAW/hero-collage-$i.jpg"; done
sed -i "s#$RAW/#/ph/hero/#g" "$D/stub/content.json"
