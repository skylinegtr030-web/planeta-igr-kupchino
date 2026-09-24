#!/usr/bin/env bash
# Делает сервер независимым от GitHub: код хранится в /opt/git/planeta-igr.git (origin), GitHub остаётся вторым remote «github».
set -Eeuo pipefail
cd "$(dirname "$0")/.."
BARE=/opt/git/planeta-igr.git
GH_URL="$(git remote get-url origin)"
case "$GH_URL" in *github.com*) ;; *) echo "origin уже не GitHub ($GH_URL) — ничего не делаю"; exit 0;; esac
sudo mkdir -p /opt/git && sudo chown "$(id -u):$(id -g)" /opt/git
[ -d "$BARE" ] || git init -q --bare "$BARE"
git remote rename origin github
git remote add origin "$BARE"
git push -q origin v2
git branch -q --set-upstream-to=origin/v2 v2
echo "origin  → $BARE (локально, работает без интернета)"
echo "github  → $GH_URL (зеркало и канал для обновлений; отключается scripts/detach-github.sh)"
git remote -v
