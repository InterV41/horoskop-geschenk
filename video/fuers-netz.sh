#!/usr/bin/env bash
# Macht aus den vollen Renderings (out/voll) die Videos für die Seite (../public/video):
# kleiner (quer 1280 breit, hoch 720 breit), alle 6 Bilder ein Schlüsselbild, damit Vor- und Zurückscrollen
# ohne Ruckeln geht, dazu Anfangs- und Endbild als JPEG (Vorschaubild und Standbild bei "Bewegung reduzieren").
# Aufruf im Ordner video/:  bash fuers-netz.sh
set -euo pipefail
ziel=../public/video
mkdir -p "$ziel"
for voll in out/voll/partner-*.mp4; do
  n=$(basename "$voll" .mp4)
  case "$n" in *-quer-*) groesse=1280:-2 ;; *) groesse=720:-2 ;; esac
  npx remotion ffmpeg -y -loglevel error -i "$voll" -vf "scale=$groesse" -c:v libx264 -preset slow -crf 26 -g 6 \
    -pix_fmt yuv420p -movflags +faststart -an "$ziel/$n.mp4"
  npx remotion ffmpeg -y -loglevel error -i "$voll" -vf "scale=$groesse" -frames:v 1 -q:v 3 "$ziel/$n-anfang.jpg"
  npx remotion ffmpeg -y -loglevel error -sseof -0.1 -i "$voll" -vf "scale=$groesse" -frames:v 1 -q:v 3 "$ziel/$n-ende.jpg"
  echo "$n $(du -h "$ziel/$n.mp4" | cut -f1)"
done
