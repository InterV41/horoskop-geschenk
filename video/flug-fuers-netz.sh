#!/usr/bin/env bash
# Macht aus den vollen Renderings des Kosmos-Flugs (out/voll) die Videos für die Seite (../public/video):
# 900 × 900, alle 15 Bilder ein Schlüsselbild, dazu Anfangs- und Endbild als JPEG.
# Zugeschnitten ab EINSTIEG Sekunden (wo die Sterne heranrasen), passend zu FLUG_EINSTIEG_BILD in src/scripts/kosmos/flug.ts.
# Neu kodiert, nicht kopiert, damit der Film genau auf dem Einstiegsbild beginnt.
# Aufruf im Ordner video/:  bash flug-fuers-netz.sh
set -euo pipefail
ziel=../public/video
EINSTIEG=8
mkdir -p "$ziel"
for voll in out/voll/kosmos-flug-*.mp4; do
  n=$(basename "$voll" .mp4)
  npx remotion ffmpeg -y -loglevel error -i "$voll" -ss "$EINSTIEG" -vf scale=900:-2 -c:v libx264 -preset slow -crf 27 -g 15 \
    -pix_fmt yuv420p -movflags +faststart -an "$ziel/$n.mp4"
  npx remotion ffmpeg -y -loglevel error -i "$voll" -ss "$EINSTIEG" -frames:v 1 -q:v 3 "$ziel/$n-anfang.jpg"
  npx remotion ffmpeg -y -loglevel error -sseof -0.1 -i "$voll" -frames:v 1 -q:v 3 "$ziel/$n-ende.jpg"
  echo "$n $(du -h "$ziel/$n.mp4" | cut -f1)"
done
