#!/usr/bin/env bash
# Macht aus den vollen Renderings (out/kosmos/voll) die Videos für die Seite (../public/video):
# 1080 × 1080, ein Schlüsselbild je Sekunde (der Film läuft nur vorwärts), dazu Anfangs- und Endbild als JPEG.
# Aufruf im Ordner video/:  bash kosmos-fuers-netz.sh
set -euo pipefail
ziel=../public/video
mkdir -p "$ziel"
for voll in out/kosmos/voll/kosmos-*.mp4; do
  n=$(basename "$voll" .mp4)
  npx remotion ffmpeg -y -loglevel error -i "$voll" -vf "scale=1080:1080" -c:v libx264 -preset slow -crf 24 -g 30 \
    -pix_fmt yuv420p -movflags +faststart -an "$ziel/$n.mp4"
  npx remotion ffmpeg -y -loglevel error -i "$voll" -vf "scale=1080:1080" -frames:v 1 -q:v 3 "$ziel/$n-anfang.jpg"
  npx remotion ffmpeg -y -loglevel error -sseof -0.1 -i "$voll" -vf "scale=1080:1080" -frames:v 1 -q:v 3 "$ziel/$n-ende.jpg"
  echo "$n $(du -h "$ziel/$n.mp4" | cut -f1)"
done
