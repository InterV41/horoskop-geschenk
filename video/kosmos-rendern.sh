#!/usr/bin/env bash
# Rendert die vier Fassungen des Kosmos-Films in voller Größe nach out/kosmos/voll.
# Aufruf im Ordner video/:  bash kosmos-rendern.sh
set -euo pipefail
mkdir -p out/kosmos/voll
for id in kosmos-dunkel-de kosmos-hell-de kosmos-dunkel-en kosmos-hell-en; do
  npx remotion render src/kosmos/index.ts "$id" "out/kosmos/voll/$id.mp4" --log=error
  echo "gerendert: $id"
done
