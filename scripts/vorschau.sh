#!/bin/bash
# Vorschau zum Weitergeben auf Cloudflare hochladen (statische Dateien, Konfiguration in wrangler.jsonc).
# Baut mit PUBLIC_VORSCHAU=1 (noindex), sperrt zusätzlich per Header Suchmaschinen aus
# und baut danach wieder die normale Fassung, damit dist/ nicht im Vorschau-Zustand bleibt.
set -e
cd "$(dirname "$0")/.."
PUBLIC_VORSCHAU=1 npm run build
printf '/*\n  X-Robots-Tag: noindex, nofollow\n' > dist/_headers
npx wrangler deploy
npm run build
