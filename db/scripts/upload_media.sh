#!/usr/bin/env bash
# Заливка папки с фото в Supabase Storage с сохранением структуры папок.
# Требуется: SUPABASE_URL и SUPABASE_SERVICE_KEY в окружении.
# Использование: ./upload_media.sh /path/to/assets/images
set -euo pipefail
SRC="${1:?укажите папку}"
BUCKET="${BUCKET:-public-site-assets}"
: "${SUPABASE_URL:?}"; : "${SUPABASE_SERVICE_KEY:?}"
cd "$SRC"
find . -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) | sed 's|^\./||' | while read -r f; do
  ct="image/jpeg"; case "$f" in *.png) ct=image/png;; *.webp) ct=image/webp;; esac
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    "$SUPABASE_URL/storage/v1/object/$BUCKET/$f" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: $ct" -H "x-upsert: true" \
    --data-binary "@$f")
  echo "$code  $f"
done
