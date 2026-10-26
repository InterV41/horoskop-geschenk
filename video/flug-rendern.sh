#!/usr/bin/env bash
# Rendert die vier Fassungen des Kosmos-Flugs (Milchstraße → Erde → Radix) nach out/voll.
# Aufruf im Ordner video/:  bash flug-rendern.sh  [ids …]
set -euo pipefail
mkdir -p out/voll
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=(kosmos-flug-dunkel-de-alpha kosmos-flug-hell-de-alpha kosmos-flug-dunkel-en-alpha kosmos-flug-hell-en-alpha)
for id in "${ids[@]}"; do
  npx remotion render src/index.ts "$id" "out/voll/$id.mp4" --log=error --gl=angle
  echo "gerendert: $id"
done
