# Kosmos-Film: die Verwandlung zur Radix als vorab gerendertes Video

Stand: 25. Oktober 2026 · Status: Konzept, zur Freigabe

## Ziel

Auf der Startseite (`src/views/Start.astro`, Komponente `KosmosRadix`) soll die Verwandlung vom Sonnensystem zur Radix beim Öffnen der Seite deutlich hochwertiger wirken als heute. Dafür wird sie wie die Partnerradix mit Remotion (Skill `video-mit-code`) Bild für Bild als Video gerendert. Im Video sind Effekte möglich, die live im Browser zu schwer wären. Nach dem Film übernimmt nahtlos die Live-Radix, die gestochen scharf bleibt und sich weiterdreht.

### Was Valentin entschieden hat

| Frage | Entscheidung |
| --- | --- |
| Werkzeug | **Remotion** wie bei der Partnerradix |
| Ablauf | **Film + Live-Radix**: Der Film zeigt Sonnensystem und Verwandlung, danach übernimmt die Live-Radix |
| Nach dem Film | **Die Radix bleibt** und dreht sich weiter. Kein Rückweg ins Sonnensystem, keine Schleife mehr auf der Startseite. |
| Fliegende Sterne | **Bleiben live** über dem Video, damit sie sich nach Bildschirm verteilen und Text meiden |
| Effekte | **Echte Tiefe**, **Leuchten**, **Lichtfäden von der Erde**. Kein Goldstaub. |

### Nicht Teil dieser Arbeit

- Die scrollgesteuerte Radix auf der Seite Geburtshoroskop (`src/views/Produkt.astro`, `<KosmosRadix scroll …>`) bleibt live wie bisher.
- Die Partnerradix (`PartnerFilm`, `video/src/PartnerVideo.tsx`, `video/src/Root.tsx`, `video/radix.css`, `video/fuers-netz.sh`) wird nicht angefasst.
- Keine neue Planetenkonstellation, kein neues Aussehen der Radix selbst.
- Keine Änderung an Versionen von `remotion` oder `react` in `video/package.json` (wird mit der Partnerradix geteilt).

## Der Film

### Inhalt und Zeit

Der Film zeigt genau den Anfang des heutigen Live-Ablaufs: Einstieg im Sonnensystem, Verwandlung, fertige Radix. Er rechnet mit denselben Werten wie die Seite. Er liest `EINSTIEG`, `phase` und die Abschnitte aus `src/scripts/kosmos/zeitplan.ts` und das Gesamttempo der Seite.

- Das Gesamttempo steht heute als `TEMPO = 0.55` in `KosmosRadix.astro`. Es wandert als `export const TEMPO_SEITE = 0.55` nach `zeitplan.ts`, damit Film und Seite denselben Wert nutzen.
- Länge: vom Einstieg bis `p = 1`, danach noch **1 Sekunde Ruhe** in der fertigen Radix, in der das Leuchten abklingt. Mit den heutigen Werten (`EINSTIEG = 3.5`, Verwandlung von 4 bis 8 s Modellzeit, Tempo 0,55) sind das rund 0,9 s Sonnensystem, 7,3 s Verwandlung und 1 s Ruhe, also etwa **9,2 s**. Ändert jemand den Zeitplan, ändert sich der Film beim nächsten Rendern mit.
- 30 Bilder pro Sekunde, wie bei der Partnerradix.

### Gleichtakt zwischen Film und Seite

Damit die Live-Radix im letzten Bild genau dort steht, wo der Film endet, gibt es eine gemeinsame, reine Funktion in `src/scripts/kosmos/film.ts`:

- `export const FILM_FPS = 30;`
- `export function filmUhr(bild: number): Uhr`: Zustand der Animation (Sekunden `t`, Modellzeit `tau`) nach `bild` Bildern. Sie beginnt bei `{ t: 0, tau: 0 }` und geht in festen Schritten von `TEMPO_SEITE / FILM_FPS` mit `schritt()` vorwärts. Das ist genau die Rechnung der Seite, nur mit festem Takt.
- `export function filmLaenge(): number`: Anzahl der Bilder bis `p = 1` plus `FILM_FPS` Bilder Ruhe.
- `export function filmPhase(bild: number): number`: `phase(filmUhr(bild).t + EINSTIEG)`.

Der Film zeichnet Bild `n` aus `layout(filmUhr(n).tau, filmPhase(n), aszendent(filmUhr(n).t))`. Die Seite rechnet während des Films aus der Videozeit dasselbe Bild aus und kennt so in jedem Moment den passenden Live-Zustand.

### Effekte

Alle Effekte hängen nur von der Bildnummer ab (Regel aus dem Skill: keine CSS-Animationen oder Timer im Film).

- **Echte Tiefe:** Jede Planetenkugel bekommt eine Unschärfe aus ihrer Tiefe: hintere Bahnhälfte bis 3 px, vordere 0 px (bei 1440 px Bildbreite). Die Unschärfe wird mit dem Aufrichten (`teil(p, 0, 0.6)`) zu null, die Radix ist also scharf. Sterne und Nebel sind nicht im Film: Sie bleiben die Live-Ebene der Seite (mit CSS-Animationen, die Remotion nicht bildgenau rendern kann) und scheinen durch den durchsichtigen Film.
- **Leuchten:** Sonne, Goldlinien, Tierkreis und Planetenzeichen bekommen einen weichen Lichthof (zweite, weichgezeichnete Kopie in der Goldfarbe, darüber das Original). Stärke: im Sonnensystem 0,6, bei der Verwandlung bis 1,0, in der Sekunde Ruhe am Ende auf 0. Hell als zarter warmer Schimmer mit halber Stärke.
- **Lichtfäden:** Zwischen `p = 0.15` und `p = 0.85` laufen feine Linien von der Erde zu jedem der zehn Körper. Deckkraft `sin(π · q)` über dieses Fenster, dazu ein leichtes Flackern je Faden (feste Saat, aus der Bildnummer). Strich 1 px, Farbe hell `#9a7a33`, dunkel `#fff1c8`.
- Was der Film **nicht** zeigt: die fliegenden Sterne (live darüber), Sterne und Nebel der Animation sowie den Sternenhimmel der Seite (alles live, scheint durch). Gerendert wird mit `baueSzene(…, { nurRadix: true })` wie bei der Partnerradix.

### Fassungen und Formate

- 4 Videos: `kosmos-{hell|dunkel}-{de|en}`, wegen der Tierkreisnamen, die während der Verwandlung erscheinen.
- Quadratisch, gerendert in **1440 × 1440**, für die Seite verkleinert auf **1080 × 1080**, H.264, CRF 24, `+faststart`, ohne Ton. Erwartet: 2–4 MB je Video.
- Dazu je ein **Vorschaubild** (erstes Bild) und ein **Endbild** (letztes Bild) als JPEG.

### Kein Kasten um das Video

Videos haben keine Durchsichtigkeit. Ein CSS-Mischmodus (`mix-blend-mode`) scheidet aus: Der erste Bildschirm ist für die fliegenden Sterne eine eigene Ebenengruppe (`isolation: isolate` auf `.start`). Ein Mischmodus würde dort nur innerhalb der Gruppe wirken, nicht mit dem Sternenhimmel der Seite dahinter. Schwarz bzw. Weiß bliebe als Kasten stehen. Deshalb wird die Durchsichtigkeit beim Abspielen zurückgerechnet:

- **Dunkel** wird auf Schwarz gerendert. Beim Abspielen gilt je Bildpunkt Deckkraft `a = max(r, g, b)` und Farbe `c / a`, das ist genau der Bildpunkt, wie er ohne den schwarzen Grund aussah.
- **Hell** wird auf Weiß gerendert. Deckkraft `a = 1 − min(r, g, b)`, Farbe `(c − (1 − a)) / a`.
- Die Rechnung läuft in einem kleinen WebGL-Shader auf der Grafikkarte: Das Video ist die Textur, ein `<canvas>` zeigt das Ergebnis. Das kostet pro Bild praktisch nichts und funktioniert in allen gängigen Browsern, auch in Safari.
- Kompressionsrauschen im reinen Grund: Deckkraft unter 3 % wird ganz durchsichtig, darüber weich hochgezogen, damit kein grauer Schleier entsteht.
- Ohne WebGL: kein Film, Live-Verwandlung (siehe „Absicherung“).
- Folge: Im Film gibt es keine dunklen Flächen auf dunklem und keine hellen auf hellem Grund. Die Schattenseiten der Planeten werden durchsichtig, die Scheibe der Radix (`--rx-disk`) und die weißen Ringe fehlen im Film. Sie blenden bei der Übergabe mit der Live-Radix ein.

## Auf der Seite

### Dateien

| Datei | Aufgabe |
| --- | --- |
| `src/scripts/kosmos/film.ts` | `FILM_FPS`, `filmUhr`, `filmLaenge`, `filmPhase` (rein, getestet) |
| `src/scripts/kosmos/durchsicht.ts` | WebGL-Shader: Video auf Canvas, Schwarz bzw. Weiß als Durchsichtigkeit zurückgerechnet. Die Umrechnungsformel liegt zusätzlich als reine Funktion vor und ist getestet. |
| `src/scripts/kosmos/zeitplan.ts` | bekommt `TEMPO_SEITE` |
| `src/components/KosmosRadix.astro` | neue Prop `film?: boolean`. Mit `film` spielt sie vorneweg das Video, ohne bleibt alles wie heute. |
| `src/views/Start.astro` | `<KosmosRadix film />` (Absprache mit der Sitzung „Webseite Astro“, deren Datei) |
| `video/src/kosmos/index.ts`, `video/src/kosmos/Root.tsx`, `video/src/kosmos/KosmosVideo.tsx`, `video/src/kosmos/kosmos.css` | eigener Remotion-Einstieg, getrennt von der Partnerradix |
| `video/kosmos-fuers-netz.sh` | Verkleinern und Bilder erzeugen, Ausgabe nach `public/video/kosmos-*` |

`szene.ts` bekommt höchstens neue, optionale Optionen. Ohne sie verhält sich alles wie bisher, `nurRadix` bleibt unverändert.

### Ablauf mit `film`

1. Beim Laden liegt das Vorschaubild (erstes Filmbild, ebenfalls durch den Shader gezeigt) im Rad. Ein unsichtbares `<video>` lädt die passende Fassung (Ansicht und Sprache), ein `<canvas>` zeigt sie durchsichtig gerechnet.
2. Das Video spielt einmal (`muted`, `playsinline`, ohne Schleife). Die SVG-Ebenen der Live-Radix sind in dieser Zeit unsichtbar. Gezeichnet wird trotzdem jedes Bild aus `filmUhr(videoZeit · FILM_FPS)`, damit die fliegenden Sterne im richtigen Moment hinausfliegen.
3. Im letzten Bild übernimmt die Live-Radix den Zustand `filmUhr(filmLaenge())`. Die SVG-Ebenen blenden in 0,5 s ein, das Video in 0,5 s aus und wird danach entfernt.
4. Ab dann: Verwandlungsgrad fest bei 1, Uhr läuft weiter. Der Tierkreis dreht, die Planeten wandern, die Aspekte wechseln.

### Absicherung

- **Video kommt zu spät:** Spielt das Video 2,5 s nach dem Laden noch nicht, oder meldet es einen Fehler, läuft die heutige Live-Verwandlung und bleibt danach ebenfalls in der Radix.
- **Datensparmodus** (`navigator.connection.saveData`): kein Video, Live-Verwandlung.
- **Kein WebGL:** kein Video, Live-Verwandlung.
- **Bewegung reduzieren:** kein Video, Radix steht still wie heute.
- **Hell/dunkel mitten im Film:** Die andere Fassung wird an derselben Stelle weitergespielt, wie bei der Partnerradix.
- **Tab im Hintergrund:** Das Video pausiert mit der Seite. Danach geht es an derselben Stelle weiter.

## Prüfen

- **Test (Vitest):** Die Umrechnung der Durchsichtigkeit gibt für Gold auf Weiß bzw. Licht auf Schwarz wieder die Ausgangsfarbe und Deckkraft zurück, reiner Grund wird ganz durchsichtig. `filmUhr` ist bildgenau gleich der Live-Rechnung mit festem Takt, `filmPhase(filmLaenge() - FILM_FPS) = 1`, `filmPhase(0) = phase(EINSTIEG)`, `filmLaenge()` passt zur Formel aus dem Zeitplan.
- **Bestehende Tests:** alle 69 laufen weiter (`npx vitest run`), die Partnerseite wird kurz geprüft, weil sie `baueSzene` nutzt.
- **Render:** alle 4 Fassungen in Remotion Studio angesehen, Dateigrößen notiert.
- **Browser:** Übergabe Film → Live-Radix in Einzelbildern, hell und dunkel, Desktop und Handy. Kein Sprung, kein Kasten (auch über dem Sternenhimmel und der Papierstruktur), fliegende Sterne im richtigen Moment, kein Stern auf Text. Fallback ohne Video geprüft.

## Offen

- Genaue Stärken von Unschärfe, Leuchten und Lichtfäden werden in Remotion Studio nach Augenmaß eingestellt, als benannte Konstanten oben in `KosmosVideo.tsx`.
- Ob die Seite ein `<link rel="preload">` für das Vorschaubild bekommt, klärt sich beim Messen der Ladezeit.
