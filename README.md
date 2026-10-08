# Horoskop Geschenk

Landingpage für ein persönliches Geburtshoroskop als PDF-Geschenk. Gebaut mit [Astro](https://astro.build), Gestaltung nach dem Moodboard vom 22. September 2026 (Light und Dark).

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # statischer Build nach dist/
```

## Aufbau

- `src/pages/index.astro`: Startseite (Hero, Fassungen, Ablauf, Astrologie, Bestellung, Footer)
- `src/components/ChartWheel.astro`: dekoratives Horoskop-Rad als SVG
- `src/components/Sheet.astro`: stilisierte PDF-Seite (Titelblatt, Kapitelseite)
- `src/styles/global.css`: Farb-Tokens für Light und Dark, Typografie, Buttons

Schriften (Cormorant Garamond, EB Garamond) werden über Fontsource selbst gehostet, es gibt keine Anfragen an Google Fonts.

## Offen

- Bestell-Buttons und Rechtslinks sind Platzhalter (`#`)
- Das Bestellformular sendet nichts ab, ein Checkout ist noch nicht angebunden
- Impressum, Datenschutz, AGB und Widerruf fehlen noch
