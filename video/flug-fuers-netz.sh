#!/usr/bin/env bash
# Macht aus den vollen Renderings des Kosmos-Flugs (out/voll) die Videos für die Seite (../public/video).
# Fassungen mit Deckkraft (-alpha), gerendert in 2160 × 4320, oben Bild, unten Deckkraft:
#   <name>.mp4        1600 × 3200 für große Bildschirme
#   <name>-klein.mp4   900 × 1800 für kleine Bildschirme (die Seite wählt bis max-width 900px diese)
# dazu Anfangs- und Endbild als JPEG. Alle 15 Bilder ein Schlüsselbild.
# Zugeschnitten ab EINSTIEG Sekunden (wo die Sterne heranrasen), passend zu FLUG_EINSTIEG_BILD in src/scripts/kosmos/flug.ts.
# Neu kodiert, nicht kopiert, damit der Film genau auf dem Einstiegsbild beginnt.
# Aufruf im Ordner video/:  bash flug-fuers-netz.sh            (alle Fassungen in out/voll)
#                           bash flug-fuers-netz.sh <name> …   (nur diese, z. B. kosmos-flug-hell-de-alpha)
set -euo pipefail
ziel=../public/video
EINSTIEG=8
mkdir -p "$ziel"
namen=("$@")
if [ ${#namen[@]} -eq 0 ]; then
  for voll in out/voll/kosmos-flug-*-alpha.mp4; do namen+=("$(basename "$voll" .mp4)"); done
fi
schneide() { # Quelle, Breite, Ziel
  npx remotion ffmpeg -y -loglevel error -i "$1" -ss "$EINSTIEG" -vf "scale=$2:-2:flags=lanczos" -c:v libx264 -preset slow -crf 25 -g 15 \
    -pix_fmt yuv420p -movflags +faststart -an "$3"
}
for n in "${namen[@]}"; do
  voll=out/voll/$n.mp4
  schneide "$voll" 1600 "$ziel/$n.mp4"
  schneide "$voll" 900 "$ziel/$n-klein.mp4"
  npx remotion ffmpeg -y -loglevel error -i "$voll" -ss "$EINSTIEG" -frames:v 1 -q:v 3 "$ziel/$n-anfang.jpg"
  npx remotion ffmpeg -y -loglevel error -sseof -0.1 -i "$voll" -frames:v 1 -q:v 3 "$ziel/$n-ende.jpg"
  echo "$n $(du -h "$ziel/$n.mp4" | cut -f1), klein $(du -h "$ziel/$n-klein.mp4" | cut -f1)"
done
