# Horoskop Geschenk

Webseite für horoskop-geschenk.de: persönliche Geburtshoroskope als PDF-Geschenk. Gebaut mit [Astro](https://astro.build), Gestaltungssystem Folio (gilt für PDF und Webseite).

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # statischer Build nach dist/
```

## Wo was liegt

| Was | Datei |
| --- | --- |
| Marke, Preis, Seitenzahl, **Lieferzeit** (Phase 1: 48 Stunden, Phase 2: 15 Minuten) | `src/site.ts` |
| Farben, Schriftgrade, Abstände (Folio) | `src/styles/global.css` |
| Aufbau des Horoskops (Kapitel) | `src/data/inhalt.ts` |
| Fragen und Antworten, auch für die FAQPage-Daten | `src/data/fragen.ts` |
| Ausführliche FAQ-Artikel unter /fragen/… (Markdown, `draft: true` bis zur Freigabe, `frage:` ist der Eintrag in der FAQ-Liste) | `src/content/ratgeber/` |
| Leseprobe: alle 35 Seiten des Testhoroskops „Mia“, ab Seite 5 nur Goldelemente und Kapitelziffern scharf | `src/assets/leseprobe/` |
| Seitenrahmen, SEO-Tags, JSON-LD, Umschalter-Logik | `src/layouts/Base.astro` |
| Zweisprachigkeit: welche deutsche Adresse zu welcher englischen gehört | `src/i18n.ts` |
| Seiteninhalte in Deutsch und Englisch (je Seite eine Vorlage) | `src/views/*.astro` |
| Englische FAQ-Artikel unter /en/faq/… (`de:` verweist auf das deutsche Original) | `src/content/ratgeber/en/` |

Die Seite gibt es auf Deutsch (`/`) und Englisch (`/en/`). Der Umschalter „DE / EN“ oben rechts (auf dem Handy im Menü) führt zur selben Seite in der anderen Sprache, Google bekommt die Gegenstücke über `hreflang`. Neue Seiten: Adresse in `src/i18n.ts` eintragen, Vorlage in `src/views/` anlegen, unter `src/pages/` und `src/pages/en/` je eine kurze Hülle.

Hell und dunkel folgen der Systemeinstellung des Geräts. Der Umschalter in der Kopfzeile gilt für den laufenden Besuch.

Schriften (Cormorant Garamond, EB Garamond) liegen über Fontsource auf dem eigenen Server, es gehen keine Anfragen an Google.

Im Entwicklungsmodus markiert Alt+Klick ein Element (`src/components/DevPicker.astro`). Das ist nicht im Build enthalten.

## Offen

- [ ] Stripe Checkout, Webhook, Mailversand (nächste Runde). Das Formular sendet noch nichts.
- [ ] Gutscheine automatisieren (zusammen mit Stripe Checkout):
  - Gutscheine in Stripe anlegen: Rabatt als *Coupon* (z. B. 10 % oder 5 €), dazu den Code als *Promotion Code* (z. B. `WEIHNACHTEN-10`) mit Ablaufdatum und Höchstzahl an Einlösungen
  - Serverfunktion `/api/gutschein`: prüft den Code bei Stripe und gibt Rabatt und neuen Preis zurück, das Formular zeigt ihn dann direkt an (Stelle im Code: `src/pages/bestellen.astro`, Abschnitt „Gutschein“)
  - Beim Erstellen der Checkout-Session den Code mitgeben (`discounts: [{ promotion_code }]`). Stripe zieht den Rabatt ab, Rechnung und Webhook enthalten ihn automatisch
  - Bis dahin nimmt das Formular den Code nur an (Feld `gutschein`), geprüft wird er noch nicht
- [ ] Domain registrieren und bei Cloudflare Pages anbinden (Vorschau: `npm run vorschau`)
- [ ] Kleinunternehmerregelung klären, danach `vatNote` in `src/site.ts` setzen
- [ ] Impressum, Datenschutz, AGB, Widerruf: Texte aus einem Rechtstext-Dienst einsetzen
- [ ] Kundenstimmen nach Freigabe durch die Testleser
- [ ] FAQ-Artikel gegenlesen und `draft: false` setzen, auch die englischen unter `en/`
- [ ] Englisch: Rechtstexte auf Englisch einsetzen; Leseprobe zeigt noch das deutsche Testhoroskop
- [ ] Plausible einbinden, Google Search Console einrichten, Sitemap einreichen
- [ ] PageSpeed-Test auf der echten Domain

## Rechtstexte (Entwurf, vor dem Livegang prüfen lassen)

AGB, Widerrufsbelehrung, Datenschutzerklärung und Impressum liegen unter `src/pages/` (deutsch) und `src/pages/en/`.
Anbieterdaten stehen einmal in `src/site.ts` (`anbieter`); Platzhalter in eckigen Klammern erscheinen auf der Seite markiert.

Offen:
- [ ] Anbieterdaten, Steuerstatus und zuständige Datenschutzbehörde eintragen
- [ ] Datenschutzerklärung nennt Texterstellung, E-Mail-Versand und Hosting nur als Kategorie (Art. 13 DSGVO). Je Dienst den Ort der Verarbeitung eintragen (EU oder USA mit Grundlage), Logdauer ergänzen; mit jedem Dienstleister einen Auftragsverarbeitungsvertrag abschließen und auf Anfrage den Namen nennen können
- [ ] Bestellbestätigung per E-Mail: Bestellinhalt, AGB, Widerrufsbelehrung und die erteilte Zustimmung zum sofortigen Beginn (§ 312f BGB, nötig für das Erlöschen nach § 356 Abs. 5 BGB)
  Wortlaut der Zustimmung wörtlich übernehmen: „Ich stimme ausdrücklich zu, dass ihr vor Ablauf der Widerrufsfrist mit der Erstellung meines Horoskops beginnt. Mir ist bekannt, dass ich dadurch mein Widerrufsrecht verliere.“
- [ ] Absatz zur Schaltfläche „Vertrag widerrufen“ in der Widerrufsbelehrung vor dem Veröffentlichen mit dem aktuellen amtlichen Mustertext abgleichen (der Gesetzgeber gibt dafür eine feste Formulierung vor)
- [ ] Telefonnummer eintragen (`anbieter.telefon` in `src/site.ts`)
- [ ] Widerrufsfunktion (`/widerruf#vertrag-widerrufen`): Serverfunktion, die den Widerruf speichert und sofort per E-Mail bestätigt
- [ ] Neuigkeiten: Double-Opt-in per E-Mail und Abmeldelink, erst dann Newsletter versenden
- [ ] Alle Rechtstexte von einer Anwaltskanzlei oder einem Rechtstext-Dienst (z. B. IT-Recht Kanzlei, Händlerbund, Trusted Shops) prüfen lassen

## Warenkorb

- Bestellformular (`/bestellen`): beliebig viele Personen, jede mit eigener Fassung (hell, dunkel, beide +5 €). „In den Warenkorb“ legt alle ab.
- Warenkorb (`/warenkorb`, `/en/cart`): Liste, Entfernen, Summe, E-Mail, Gutschein, Widerrufsverzicht, Bezahlen (Stripe noch offen).
- Daten liegen bis zur Bestellung im `localStorage` des Browsers (`src/scripts/warenkorb.ts`) und verfallen nach drei Tagen.
- Bei der Stripe-Anbindung: je Posten eine Position, „beide“ mit Aufpreis; Geburtsdaten als Metadaten an die Bestellung.

## Bildquellen Geschichte der Astrologie

Bilder liegen in `src/assets/geschichte/`. Geprüft am 20.10.2026 direkt beim Anbieter (Wellcome-Katalog-API, Commons-Dateiseite).
Vor dem Livegang muss jede Zeile „geprüft“ sein.

| Datei | Quelle | Lizenz | Stand |
| --- | --- | --- | --- |
| `geburt-mit-astrologen-holzschnitt.jpg` | https://wellcomecollection.org/works/nxr32e8r | Public Domain Mark | geprüft |
| `johannes-kepler-portraet-1610.jpg` | https://wellcomecollection.org/works/vnmwvj4p (Linienstich von N. Dietz, Bild V0003204) | Public Domain Mark | geprüft |
| `ephemeriden-tabelle-historisch.jpg` | https://wellcomecollection.org/works/euqbqvvp (Allmanach auff das 1581 jar, Breslau 1580) | Public Domain Mark | geprüft, genaue Seite nicht abgeglichen |
| `horoskop-handschrift-iskandar.jpg` | Wellcome Collection, Kitab-i viladat-i Iskandar (z. B. https://wellcomecollection.org/works/maetm39g) | CC BY 4.0 | Lizenz geprüft, genaue Aufnahme nicht abgeglichen |
| `geburtshoroskop-nero-sibly.jpg` | https://commons.wikimedia.org/wiki/File:Astrological_birth_chart_for_Emperor_Nero_Wellcome_L0040328.jpg, bei Wellcome heute https://wellcomecollection.org/works/hvmxhpsx | Public Domain Mark (Wellcome), auf Commons noch als CC BY 4.0 | geprüft |
| `ptolemaeus-holzschnitt-1564.jpg` | https://commons.wikimedia.org/wiki/File:Ptolemy_Astrology_1564.jpg | gemeinfrei | geprüft |
| `carl-gustav-jung-1935.jpg` | https://commons.wikimedia.org/wiki/File:ETH-BIB-Jung,_Carl_Gustav_(1875-1961)-Portrait-Portr_14163_(cropped).tif (ETH-Bibliothek Zürich) | Public Domain Mark | geprüft |
| `ancient-clock-torre-dellorologio.jpg` | https://pixabay.com/photos/church-clock-st-marks-square-2831549/ (Foto: Ildigo, zugeschnitten) | Pixabay-Inhaltslizenz | geprüft |
| `hathor-tempel-dendera-saeulenhalle.jpg` | https://www.pexels.com/photo/ornamented-egyptian-tomb-15131489/ (Foto: Diego F. Parra) | Pexels-Lizenz | geprüft |
| `tierkreis-von-dendera-louvre.jpg` | unbekannt | unbekannt | **offen** |
| `babylonische-keilschrifttafel-astronomie.jpg` | unbekannt | unbekannt | **offen** |
