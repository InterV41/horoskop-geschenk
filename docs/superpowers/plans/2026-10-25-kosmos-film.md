# Kosmos-Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf der Startseite spielt beim Öffnen ein mit Remotion gerenderter Film (Sonnensystem → Radix mit Tiefe, Leuchten, Lichtfäden). Danach übernimmt nahtlos die Live-Radix und bleibt.

**Architecture:** Eine reine Zeitfunktion (`film.ts`) legt fest, welcher Animationszustand zu welchem Filmbild gehört. Remotion rendert damit jedes Bild über die vorhandene `baueSzene` (Option `nurRadix`). Die Seite rechnet während des Abspielens denselben Zustand aus der Videozeit aus. Die Durchsichtigkeit des Videos wird beim Abspielen per WebGL aus dem schwarzen bzw. weißen Grund zurückgerechnet.

**Tech Stack:** Astro 7, TypeScript, Vitest, Remotion 4 (vorhandenes Projekt `video/`), WebGL 1, H.264

**Spec:** `docs/superpowers/specs/2026-10-25-kosmos-film-design.md`

## Global Constraints

- Arbeitsordner: `/Users/Valentin/Desktop/Claude Projects/Astro/Horoskop-Geschenk.de/horoskop-geschenk`, Branch `kosmos-radix`.
- Nicht anfassen: `video/src/Root.tsx`, `video/src/PartnerVideo.tsx`, `video/src/radix.css`, `video/src/wirbel.ts`, `video/fuers-netz.sh`, `src/components/PartnerFilm.astro`, alles `partner-*` in `public/video/`.
- `video/package.json`: nur Pakete hinzufügen, keine Versionen von `remotion`, `@remotion/*` oder `react` ändern.
- Eigene Dateien heißen `kosmos-*` bzw. liegen unter `video/src/kosmos/`, `out/kosmos/`.
- `baueSzene` bekommt nur neue, optionale Optionen. Ohne sie und mit `nurRadix` verhält sie sich unverändert.
- Filmfassungen: `kosmos-{hell|dunkel}-{de|en}`, Render 1440 × 1440, 30 fps, Web 1080 × 1080, H.264, CRF 24, `-g 30`, `+faststart`, ohne Ton.
- Gesamttempo der Seite: `TEMPO_SEITE = 0.55`.
- Git: Auf dem Arbeitsstand liegen fremde, nicht committete Änderungen. Immer nur die Dateien der Aufgabe mit Pfad hinzufügen, niemals `git add -A` oder `.`. Hat eine Datei, die eine Aufgabe ändert, schon fremde, nicht committete Änderungen (heute `src/scripts/kosmos/zeitplan.ts`, `src/components/KosmosRadix.astro`, `src/views/Start.astro`), vor dem Ändern die Sitzung „Webseite Astro“ bitten, sie zu committen, und erst danach weitermachen.
- Nach jeder Änderung an `szene.ts` oder `layout.ts`: `npx vitest run` (heute 69 Tests) und kurzer Blick auf `/partnerschaftshoroskop`.
- Code, Bezeichner und Kommentare auf Deutsch, im Stil der vorhandenen Kosmos-Dateien.

## Review Focus

1. **Video lädt langsam oder gar nicht:** Nach 2,5 s ohne Abspielen übernimmt die Live-Verwandlung, und auch sie bleibt danach in der Radix. → Browser-Schritt in Task 5 (Video-URL absichtlich falsch).
2. **Hell/dunkel mitten im Film:** Die andere Fassung spielt an derselben Stelle weiter, die Durchsichtigkeit rechnet mit dem anderen Grund. → Browser-Schritt in Task 5.
3. **Sprung bei der Übergabe:** Das letzte Filmbild und das erste Live-Bild zeigen dieselbe Stellung. → Test „letztes Filmbild ist der Übergabezustand“ in Task 1 und Einzelbild-Vergleich in Task 5.
4. **Grauer Schleier aus Kompressionsrauschen** im reinen Grund. → Test „Rauschen unter 3 % wird durchsichtig“ in Task 2 und Sichtprüfung in Task 5.
5. **Safari/iPhone:** `<video>` darf nicht ins Vollbild springen und muss ohne Ton automatisch starten (`muted`, `playsinline`). Ohne WebGL gilt die Live-Verwandlung. → Browser-Schritt in Task 5 mit Handy-Größe, dazu ein Hinweis an Valentin, es einmal auf dem iPhone anzusehen.

---

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `src/scripts/kosmos/zeitplan.ts` | bekommt `TEMPO_SEITE` |
| `src/scripts/kosmos/film.ts` | Filmzeit ↔ Animationszustand, Lichtfäden (rein) |
| `src/scripts/kosmos/durchsicht.ts` | Umrechnung Grund → Durchsichtigkeit (rein) und WebGL-Abspieler |
| `src/scripts/kosmos/layout.ts` | `KoerperLayout` bekommt `tiefe` |
| `src/scripts/kosmos/szene.ts` | optionale Option `tiefenschaerfe` |
| `src/components/KosmosRadix.astro` | Prop `film`, Ablauf Film → Live |
| `src/views/Start.astro` | `<KosmosRadix film />` |
| `video/src/kosmos/{index.ts, Root.tsx, KosmosVideo.tsx, kosmos.css}` | Remotion-Einstieg für den Kosmos-Film |
| `video/kosmos-rendern.sh`, `video/kosmos-fuers-netz.sh` | Rendern und für das Netz verkleinern |
| `tests/kosmos/film.test.ts`, `tests/kosmos/durchsicht.test.ts` | Tests |

---

### Task 1: Filmzeit und Lichtfäden

**Files:**
- Modify: `src/scripts/kosmos/zeitplan.ts`, `src/components/KosmosRadix.astro` (nur `const TEMPO = 0.55` → Import von `TEMPO_SEITE`)
- Create: `src/scripts/kosmos/film.ts`, `tests/kosmos/film.test.ts`

**Interfaces:**
- Consumes: `schritt`, `phase`, `EINSTIEG`, `Uhr` aus `zeitplan.ts`; `layout`, `Layout`, `aszendent` aus `layout.ts`
- Produces:
  - `zeitplan.ts`: `export const TEMPO_SEITE = 0.55;`
  - `film.ts`:
    - `export const FILM_FPS = 30;`
    - `export const FILM_RUHE = FILM_FPS;` (eine Sekunde Ruhe am Ende)
    - `export function filmUhren(): readonly Uhr[]`: Zustand für jedes Bild `0 … filmLaenge() − 1`, einmal berechnet und zwischengespeichert. Bild 0 = `{ t: 0, tau: 0 }`, jedes weitere = `schritt(vorher, TEMPO_SEITE / FILM_FPS)`.
    - `export function filmLaenge(): number`: erstes Bild mit `phase(t + EINSTIEG) === 1`, plus `FILM_RUHE`
    - `export function filmPhase(bild: number): number`: `phase(filmUhren()[klemm(bild)].t + EINSTIEG)`, `bild` auf `0 … filmLaenge() − 1` geklemmt
    - `export function filmLayout(bild: number): Layout`: `layout(u.tau, filmPhase(bild), aszendent(u.t))` mit `u = filmUhren()[bild]`
    - `export interface Faden { x1: number; y1: number; x2: number; y2: number; deckkraft: number }`
    - `export function lichtfaeden(l: Layout, bild: number): Faden[]`: zehn Fäden von `l.koerper.erde` zu jedem Körper aus `RADIX_REIHE`. Deckkraft `sin(π · q)` mit `q = (l.p − 0.15) / 0.7`, außerhalb `[0.15, 0.85]` null. Dazu Flackern `0.75 + 0.25 · sin(bild · 0.9 + i · 2.1)` je Faden `i`.

- [ ] **Step 1: Fremde Änderungen klären**

`git diff --stat src/scripts/kosmos/zeitplan.ts src/components/KosmosRadix.astro`. Zeigt das Änderungen, die Sitzung „Webseite Astro“ (`local_4f1aa833-614c-4786-a887-7d5c43a7326d`) bitten, beide Dateien zu committen. Erst nach ihrem Commit weitermachen.

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { FILM_FPS, FILM_RUHE, filmUhren, filmLaenge, filmPhase, filmLayout, lichtfaeden } from '../../src/scripts/kosmos/film';
import { schritt, phase, EINSTIEG, TEMPO_SEITE } from '../../src/scripts/kosmos/zeitplan';

describe('film', () => {
  it('rechnet Bild für Bild genau wie die Seite mit festem Takt', () => {
    let u = { t: 0, tau: 0 };
    filmUhren().forEach((f, i) => {
      if (i > 0) u = schritt(u, TEMPO_SEITE / FILM_FPS);
      expect(f.t).toBe(u.t); expect(f.tau).toBe(u.tau);
    });
  });
  it('beginnt am Einstieg und endet mit einer Sekunde fertiger Radix', () => {
    expect(filmPhase(0)).toBe(phase(EINSTIEG));
    expect(filmPhase(filmLaenge() - FILM_RUHE - 1)).toBeLessThan(1);
    for (let b = filmLaenge() - FILM_RUHE; b < filmLaenge(); b++) expect(filmPhase(b)).toBe(1);
  });
  it('das letzte Filmbild ist der Übergabezustand', () => {
    const l = filmLayout(filmLaenge() - 1);
    expect(l.p).toBe(1);
    expect(filmUhren()).toHaveLength(filmLaenge());
  });
  it('klemmt Bildnummern außerhalb des Films', () => {
    expect(filmPhase(-5)).toBe(filmPhase(0));
    expect(filmPhase(filmLaenge() + 50)).toBe(1);
  });
  it('Lichtfäden: zehn von der Erde aus, nur mitten in der Verwandlung sichtbar', () => {
    let b = 0; // Bild mit Verwandlungsgrad am nächsten an 0,5
    for (let i = 0; i < filmLaenge(); i++) if (Math.abs(filmPhase(i) - 0.5) < Math.abs(filmPhase(b) - 0.5)) b = i;
    const mitte = filmLayout(b);
    const f = lichtfaeden(mitte, b);
    expect(f).toHaveLength(10);
    expect(Math.max(...f.map((x) => x.deckkraft))).toBeGreaterThan(0.5);
    for (const x of f) { expect(x.x1).toBeCloseTo(mitte.koerper.erde.x); expect(x.y1).toBeCloseTo(mitte.koerper.erde.y); }
    expect(Math.max(...lichtfaeden(filmLayout(0), 0).map((x) => x.deckkraft))).toBe(0);
    expect(Math.max(...lichtfaeden(filmLayout(filmLaenge() - 1), 0).map((x) => x.deckkraft))).toBe(0);
  });
});
```

- [ ] **Step 3: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run tests/kosmos/film.test.ts`
Expected: FAIL, Modul `film` fehlt

- [ ] **Step 4: `TEMPO_SEITE` in `zeitplan.ts`, `film.ts` mit den Signaturen oben umsetzen, `KosmosRadix.astro` auf `TEMPO_SEITE` umstellen**

- [ ] **Step 5: Alle Tests**

Run: `npx vitest run`
Expected: PASS, 69 + 5 Tests

- [ ] **Step 6: Commit**

```bash
git add src/scripts/kosmos/zeitplan.ts src/scripts/kosmos/film.ts src/components/KosmosRadix.astro tests/kosmos/film.test.ts
git commit -m "feat(kosmos): Filmzeit und Lichtfäden für den Kosmos-Film"
```

---

### Task 2: Durchsichtigkeit aus dem Grund zurückrechnen

**Files:**
- Create: `src/scripts/kosmos/durchsicht.ts`, `tests/kosmos/durchsicht.test.ts`

**Interfaces:**
- Produces:
  - `export type Grund = 'schwarz' | 'weiss';`
  - `export const SCHWELLE = 0.03;`
  - `export function entmische(r: number, g: number, b: number, grund: Grund): [number, number, number, number]`: Werte 0…1. Schwarz: `a = max(r, g, b)`, Farbe `c / a`. Weiß: `a = 1 − min(r, g, b)`, Farbe `(c − (1 − a)) / a`. Danach weiche Schwelle `a = a · smoothstep(SCHWELLE, 0.12, a)` mit `smoothstep(e0, e1, x) = t²(3 − 2t)`, `t = klemm((x − e0) / (e1 − e0))`: unter 3 % null, ab 12 % unverändert. Bei `a = 0` Farbe `[0, 0, 0]`.
  - `export interface Durchsicht { zeichne(quelle: HTMLVideoElement | HTMLImageElement): void; setzeGrund(g: Grund): void; frei(): void }`
  - `export function erzeugeDurchsicht(canvas: HTMLCanvasElement, grund: Grund): Durchsicht | null`: `null`, wenn kein WebGL-Kontext entsteht. Ein Vollbild-Rechteck, Fragment-Shader mit derselben Formel wie `entmische`, `premultipliedAlpha: true` (Farbe im Shader mit `a` multipliziert ausgeben), Textur mit `CLAMP_TO_EDGE` und `LINEAR`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { entmische } from '../../src/scripts/kosmos/durchsicht';

const ueber = (c: number[], a: number, grund: number) => c.map((x) => x * a + grund * (1 - a));

describe('durchsicht', () => {
  it('Gold auf Weiß ergibt wieder Gold mit seiner Deckkraft', () => {
    const gold = [154 / 255, 122 / 255, 51 / 255];
    const [r, g, b, a] = entmische(...(ueber(gold, 0.6, 1) as [number, number, number]), 'weiss');
    expect(a).toBeCloseTo(0.6 * (1 - 51 / 255), 5); // Deckkraft aus dem dunkelsten Kanal (Blau)
    expect(r * a + (1 - a)).toBeCloseTo(ueber(gold, 0.6, 1)[0], 5); // zurück auf Weiß gelegt = Ausgangsbild
  });
  it('Licht auf Schwarz ergibt wieder Licht', () => {
    const licht = [1, 0.95, 0.8];
    const [r, , , a] = entmische(...(ueber(licht, 0.5, 0) as [number, number, number]), 'schwarz');
    expect(a).toBeCloseTo(0.5, 5);
    expect(r).toBeCloseTo(1, 5);
  });
  it('reiner Grund ist ganz durchsichtig', () => {
    expect(entmische(0, 0, 0, 'schwarz')[3]).toBe(0);
    expect(entmische(1, 1, 1, 'weiss')[3]).toBe(0);
  });
  it('Rauschen unter 3 % wird durchsichtig, kein grauer Schleier', () => {
    expect(entmische(0.02, 0.025, 0.01, 'schwarz')[3]).toBe(0);
    expect(entmische(0.98, 0.975, 0.99, 'weiss')[3]).toBe(0);
    expect(entmische(0.2, 0.2, 0.2, 'schwarz')[3]).toBeCloseTo(0.2, 5);
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run tests/kosmos/durchsicht.test.ts`
Expected: FAIL, Modul fehlt

- [ ] **Step 3: `entmische` und `erzeugeDurchsicht` umsetzen**

Fragment-Shader (die eine Stelle, die die Tests nicht festlegen):

```glsl
precision mediump float;
uniform sampler2D bild; uniform float weiss; varying vec2 uv;
void main() {
  vec3 c = texture2D(bild, uv).rgb;
  float a = weiss > 0.5 ? 1.0 - min(c.r, min(c.g, c.b)) : max(c.r, max(c.g, c.b));
  vec3 f = weiss > 0.5 ? (c - (1.0 - a)) / max(a, 1e-4) : c / max(a, 1e-4);
  a *= smoothstep(0.03, 0.12, a) ; // weiche Schwelle wie entmische
  gl_FragColor = vec4(clamp(f, 0.0, 1.0) * a, a);
}
```

Die Schwelle in `entmische` muss genau dieser `smoothstep`-Formel entsprechen (`a · smoothstep(0.03, 0.12, a)` ist ab 0,12 gleich `a`). Die Erwartung `0.2` im Test erfüllt das.

- [ ] **Step 4: Tests**

Run: `npx vitest run`
Expected: PASS, alle

- [ ] **Step 5: Commit**

```bash
git add src/scripts/kosmos/durchsicht.ts tests/kosmos/durchsicht.test.ts
git commit -m "feat(kosmos): Durchsichtigkeit des Films per WebGL aus dem Grund zurückrechnen"
```

---

### Task 3: Tiefe im Layout und Tiefenschärfe in der Szene

**Files:**
- Modify: `src/scripts/kosmos/layout.ts` (`KoerperLayout`, `setze`), `src/scripts/kosmos/szene.ts` (Optionen, `zeichne`), `tests/kosmos/layout.test.ts`

**Interfaces:**
- Produces:
  - `KoerperLayout.tiefe: number`: 0 vorne … 1 hinten, aus dem Startwinkel `(sin(w0) + 1) / 2`, multipliziert mit `1 − aufrichten`. Sonne und Körper mit Startradius 0: 0.
  - `baueSzene(host, nr, sprache, optionen: { nurRadix?: boolean; tiefenschaerfe?: number })`: mit `tiefenschaerfe = s` setzt `zeichne` auf jede Planetengruppe `style.filter = blur(${s · tiefe}px)` bzw. entfernt ihn bei `tiefe · s < 0.05`. Ohne Option wird `style.filter` nie gesetzt.

- [ ] **Step 1: Den fehlschlagenden Test schreiben** (in `tests/kosmos/layout.test.ts`)

```ts
it('Tiefe: hinten 1, vorne 0, in der Radix überall 0', () => {
  const L0 = layout(0.3, 0, 180);
  const tiefen = Object.values(L0.koerper).map((k) => k.tiefe);
  expect(Math.min(...tiefen)).toBeGreaterThanOrEqual(0);
  expect(Math.max(...tiefen)).toBeLessThanOrEqual(1);
  expect(L0.koerper.sonne.tiefe).toBe(0);
  for (const k of Object.values(layout(0.3, 1, 180).koerper)) expect(k.tiefe).toBe(0);
  const hinten = Object.values(L0.koerper).filter((k) => k.hinten);
  for (const k of hinten) expect(k.tiefe).toBeGreaterThan(0.5);
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run tests/kosmos/layout.test.ts`
Expected: FAIL, `tiefe` ist `undefined`

- [ ] **Step 3: `tiefe` in `layout.ts` und `tiefenschaerfe` in `szene.ts` umsetzen**

- [ ] **Step 4: Alle Tests und Partnerseite**

Run: `npx vitest run` → PASS, alle. Dann `npm run build` → ohne Fehler. `/partnerschaftshoroskop` und `/` im Dev-Server kurz ansehen: unverändert, keine Konsolenfehler.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/kosmos/layout.ts src/scripts/kosmos/szene.ts tests/kosmos/layout.test.ts
git commit -m "feat(kosmos): Tiefe je Körper, optionale Tiefenschärfe in der Szene"
```

---

### Task 4: Remotion-Film rendern

**Files:**
- Create: `video/src/kosmos/index.ts`, `video/src/kosmos/Root.tsx`, `video/src/kosmos/KosmosVideo.tsx`, `video/src/kosmos/kosmos.css`, `video/kosmos-rendern.sh`, `video/kosmos-fuers-netz.sh`
- Modify: `video/tsconfig.json` nur falls `src/kosmos` nicht schon von `"include": ["src", …]` erfasst wird (wird es, also voraussichtlich nicht)

**Interfaces:**
- Consumes: `FILM_FPS`, `filmLaenge`, `filmLayout`, `lichtfaeden` (Task 1); `baueSzene` mit `{ nurRadix: true, tiefenschaerfe }` (Task 3); `Sprache` aus `texte.ts`
- Produces: Kompositionen `kosmos-{hell|dunkel}-{de|en}` (1440 × 1440, `FILM_FPS`, Länge `filmLaenge()`), Props `{ fassung: 'hell' | 'dunkel'; sprache: Sprache }`. Dateien `public/video/kosmos-{fassung}-{sprache}.mp4`, `…-anfang.jpg`, `…-ende.jpg`.

Feste Werte (benannte Konstanten oben in `KosmosVideo.tsx`):
- `GRUND = { dunkel: '#000000', hell: '#ffffff' }`
- `TIEFENSCHAERFE = 3` (Pixel bei 1440 Bildbreite, umgerechnet in Zeichenflächen-Einheiten: `3 / (1440 / 940)`)
- Leuchten: `filter: drop-shadow(0 0 ${6·k}px rgba(gold, ${0.55·k})) drop-shadow(0 0 ${18·k}px rgba(gold, ${0.35·k}))` auf dem Rad-Container, Gold `224,194,126` (dunkel) bzw. `154,122,51` (hell). `k = stärke · (hell ? 0.5 : 1)`, Stärke im Sonnensystem 0,6, während der Verwandlung `0.6 + 0.4 · sin(π · p)`, in der Ruhe am Ende linear auf 0.
- Lichtfäden: SVG über dem Rad, `viewBox="-470 -470 940 940"`, Strich 1 Zeichenflächen-Einheit, Farbe dunkel `#fff1c8`, hell `#9a7a33`.

- [ ] **Step 1: `kosmos.css`**

Farben und Ebenen der Kosmos-Radix je Fassung als globale Regeln `.video-hell .radix` / `.video-dunkel .radix`: alle `--rx-*`- und `--kx-*`-Werte aus `KosmosRadix.astro` (hell bzw. dunkel). Dazu die Regeln für `.radix svg`, `.kx-ebene-ring` (`transform-origin: 50% 50%`), `.kx-ebene-zeichen`, `.kx-zeichen` (Schriftgrößen über `--kx-einheit`) und `text` (Schriftarten, Gewicht). Keine `animation`-Regeln.

- [ ] **Step 2: `KosmosVideo.tsx`, `Root.tsx`, `index.ts`**

Aufbau wie `PartnerVideo.tsx`: `delayRender` bis `document.fonts.ready`, `baueSzene(host, 301, sprache, { nurRadix: true, tiefenschaerfe })` in `useLayoutEffect`, `setzeStrich(1.6 | 1)` je Fassung, pro Bild `zeichne(filmLayout(frame))`. Hintergrund `GRUND[fassung]`. Rad-Container quadratisch, volle Bildgröße, `--kx-einheit` gesetzt auf `1440 / 940` px. Darüber das Lichtfäden-SVG. Fonts wie in `PartnerVideo.tsx` importieren.

- [ ] **Step 3: In Remotion Studio ansehen**

Run (im Ordner `video/`): `npx remotion studio src/kosmos/index.ts`
Expected: 4 Kompositionen, Länge `filmLaenge()` Bilder. Bild 0 zeigt das Sonnensystem auf reinem Schwarz bzw. Weiß, das letzte die Radix ohne Leuchten. Hinten liegende Planeten unscharf, Lichtfäden mitten in der Verwandlung. Stärken nach Augenmaß nachstellen.

- [ ] **Step 4: `kosmos-rendern.sh` und `kosmos-fuers-netz.sh` schreiben und ausführen**

`kosmos-rendern.sh`: für alle 4 IDs `npx remotion render src/kosmos/index.ts <id> out/kosmos/voll/<id>.mp4`.
`kosmos-fuers-netz.sh`: wie `fuers-netz.sh`, aber Eingabe `out/kosmos/voll/kosmos-*.mp4`, `scale=1080:1080`, `-crf 24 -g 30`, Ausgabe `../public/video/`.

Run: `bash kosmos-rendern.sh && bash kosmos-fuers-netz.sh` (im Hintergrund, kann mehrere Minuten dauern)
Expected: 4 MP4 und 8 JPEG in `public/video/` mit Präfix `kosmos-`, Größen ausgegeben, jede MP4 unter 5 MB. Liegt eine darüber: CRF auf 26.

- [ ] **Step 5: Commit**

`public/video/` ist nicht im Git (Absprache mit der Partnerradix-Sitzung). Nur die Quellen committen:

```bash
git add video/src/kosmos video/kosmos-rendern.sh video/kosmos-fuers-netz.sh
git commit -m "feat(kosmos): Remotion-Film Sonnensystem → Radix mit Tiefe, Leuchten und Lichtfäden"
```

---

### Task 5: Film auf der Startseite

**Files:**
- Modify: `src/components/KosmosRadix.astro`, `src/views/Start.astro` (eine Zeile, nach Absprache mit „Webseite Astro“)

**Interfaces:**
- Consumes: `FILM_FPS`, `filmLaenge`, `filmUhren`, `filmLayout` (Task 1); `erzeugeDurchsicht`, `Grund` (Task 2)
- Produces: Prop `film?: boolean` an `KosmosRadix`

Ablauf mit `film` (ohne `film` bleibt alles wie heute):
1. Abbruch zur heutigen Live-Verwandlung, wenn `prefers-reduced-motion`, `navigator.connection?.saveData` oder `erzeugeDurchsicht` gibt `null`.
2. `<canvas class="kx-film">` (quadratisch, über den SVG-Ebenen, unter `.kx-ebene-zeichen`) und ein unsichtbares `<video muted playsinline preload="auto">` mit `src = /video/kosmos-${fassung}-${sprache}.mp4`. Vorschaubild `…-anfang.jpg` sofort über `durchsicht.zeichne(bild)`.
3. Host bekommt Klasse `kx-im-film`: `.kx-ebene-ring`, `.kx-ebene-haupt`, `.kx-ebene-zeichen` mit `opacity: 0`, Himmel und Funken sichtbar.
4. Pro Bild: `b = Math.min(filmLaenge() − 1, Math.round(video.currentTime · FILM_FPS))`, `szene.zeichne(filmLayout(b))`, `durchsicht.zeichne(video)`.
5. Bei `ended`: `uhr = filmUhren()[filmLaenge() − 1]`, Klasse `kx-im-film` entfernen (SVG-Ebenen blenden per `transition: opacity 0.5s` ein), Canvas per `transition: opacity 0.5s` aus und danach entfernen, `durchsicht.frei()`. Ab dann Phase fest 1, Uhr läuft mit `schritt` weiter.
6. Fallback: Kein `playing` 2,5 s nach Start oder `error` → Canvas und Video entfernen, Live-Verwandlung ab `{ t: 0, tau: 0 }`. Sobald die Live-Phase 1 erreicht, bleibt sie bei 1.
7. `themechange`: Fassung neu bestimmen. Ist der Film noch nicht zu Ende: `src` wechseln, `currentTime` übernehmen, `durchsicht.setzeGrund(dunkel ? 'schwarz' : 'weiss')`.

- [ ] **Step 1: Absprache und `Start.astro`**

„Webseite Astro“ (`local_4f1aa833-614c-4786-a887-7d5c43a7326d`) bitten, in `src/views/Start.astro` `<KosmosRadix />` durch `<KosmosRadix film />` zu ersetzen, oder ihre Freigabe einholen, es selbst zu tun.

- [ ] **Step 2: Film-Ablauf in `KosmosRadix.astro` umsetzen** (Punkte 1–7 oben, CSS für `.kx-film` und `.kx-im-film` im `<style>` der Komponente)

- [ ] **Step 3: Bauen und Tests**

Run: `npx vitest run && npm run build`
Expected: alle Tests grün, Build ohne Fehler

- [ ] **Step 4: Im Browser prüfen**

Dev-Server, `/` und `/en`, dunkel und hell, 1280 × 800 und 375 × 812:
- Film startet sofort, kein Kasten über Sternenhimmel und Papierstruktur.
- Übergabe in Einzelbildern (Video kurz vor Ende pausieren, letztes Bild und Live-Radix übereinander vergleichen): kein Sprung.
- Fliegende Sterne starten im Takt des Films, keiner auf Text.
- Hell/dunkel mitten im Film umschalten: läuft an derselben Stelle weiter.
- Fallback: Video-URL absichtlich falsch (z. B. im Dev-Server-Netzwerk sperren oder Dateinamen vorübergehend ändern) → Live-Verwandlung, danach Radix bleibt.
- `/geburtshoroskop` und `/partnerschaftshoroskop`: unverändert.

- [ ] **Step 5: Commit**

```bash
git add src/components/KosmosRadix.astro
git commit -m "feat(kosmos): Kosmos-Film auf der Startseite, danach Live-Radix"
```

`Start.astro` committet die Sitzung, der die Datei gehört, oder es wird nach ihrer Freigabe mit committet.
