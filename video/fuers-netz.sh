#!/usr/bin/env bash
# Macht aus den Sand-Renderings (out/sand) die Videos für die Seite (../public/video/partner-sand-*.mp4).
# 1600 breit (quer) bzw. 900 breit (hoch): der Goldstaub bleibt fein, die Datei um 9 MB; alle 6 Bilder ein Schlüsselbild, damit Vor- und
# Zurückscrollen ohne Ruckeln geht. Die Räder zeichnet die Seite selbst, deshalb nur Sand.
# Aufruf im Ordner video/:  bash fuers-netz.sh
set -euo pipefail
ziel=../public/video
mkdir -p "$ziel"
for voll in out/sand/partner-sand-*.mp4; do
  n=$(basename "$voll" .mp4)
  case "$n" in *-quer) groesse=1600:-2 ;; *) groesse=900:-2 ;; esac
  npx remotion ffmpeg -y -loglevel error -i "$voll" -vf "scale=$groesse" -c:v libx264 -preset slow -crf 27 -g 6 \
    -pix_fmt yuv420p -movflags +faststart -an "$ziel/$n.mp4"
  echo "$n $(du -h "$ziel/$n.mp4" | cut -f1)"
done
