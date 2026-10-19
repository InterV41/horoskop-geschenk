# Kosmos-Radix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Radix oben auf der Startseite durch eine endlose 40-s-Animation ersetzen: Ein Sonnensystem (Stil D) verwandelt sich im „Blick von der Erde“ in die bestehende Radix und wieder zurück, ohne erkennbaren Anfang und ohne erkennbares Ende.

**Architecture:** Drei reine TypeScript-Module ohne DOM (`modell`, `zeitplan`, `layout`) rechnen pro Bild ein vollständiges Layout-Objekt aus. `szene` baut ein SVG einmal auf und überträgt jedes Layout auf die Elemente. `KosmosRadix.astro` ist die Hülle mit Farben, Bildschleife und Pausenlogik.

**Tech Stack:** Astro 7, TypeScript (strict), SVG und `requestAnimationFrame`, Vitest (neu, nur für Entwicklung), Fontsource-Schriften (vorhanden)

**Spec:** `docs/superpowers/specs/2026-10-19-kosmos-radix-design.md`

## Global Constraints

- Winkel überall in Grad, mathematisch positiv (gegen den Uhrzeigersinn). Bildpunkt wie in der bestehenden Radix: `pt(r, a) = [cos(a)·r, −sin(a)·r]`, Zeichenfläche `viewBox="-470 -470 940 940"`.
- Radix-Radien: `out 418`, `band 370`, `ring 332`, `asp 212`, `hub 92`, `SPUR 292`. Aszendent `ASC0 = 160`, `ASC_V = 1` (Grad pro Sekunde), `rot = 180 − asc`, Bildwinkel `scr(λ) = norm(λ + rot)`.
- `T = 40`, `EINSTIEG = 5`. Phasen: 0–10 s `p = 0`, 10–14 s rauf, 14–36 s `p = 1`, 36–40 s runter. Glättung: smootherstep `6x⁵ − 15x⁴ + 10x³`.
- `EXPONENT = 0,6`. Winkelgeschwindigkeit `ω_i = (1 / P_i)^0,6` Umläufe pro Erdumlauf, Rechenabstand `a_i = P_i^(0,6 · 2/3)`. Mond: 5 Umläufe pro Erdumlauf.
- `TEMPO_RADIX = 0.5 / 360`, `TEMPO_SONNENSYSTEM = 6 · TEMPO_RADIX` (Erdumläufe pro Sekunde).
- Farben und Linienstärken der Radix: genau die Werte aus der bisherigen `src/components/RadixAnimation.astro` (`--rx-gold`, `--rx-text`, `--rx-dick`, `--rx-schnitt`, `--rx-disk`).
- Keine Strahlen bzw. Korona an der Sonne, keine Planetenzeichen im Sonnensystem, keine SVG-Filter, keine Google-Fonts-Links, keine neuen Laufzeit-Abhängigkeiten.
- Code, Bezeichner und Kommentare auf Deutsch, im Stil der bestehenden Komponente.
- Git: Auf dem Arbeitsstand liegen fremde, nicht committete Änderungen. Bei jedem Commit **nur die Dateien der Aufgabe** mit Pfad hinzufügen, niemals `git add -A` oder `git add .`.

## Review Focus

1. **Winkel-Übergang über 0°/360°:** Ein Planet bei 350°, der nach 10° wandert, muss den kurzen Weg nehmen und darf nicht einmal ganz herumschwingen. → Test `mixWinkel` in Task 3.
2. **Körper mit Radius 0 an einem Ende** (Sonne bei p = 0, Erde bei p = 1): kein Sprung im Winkel kurz vor dem Ende. → Test „Sonne startet auf ihrem Zielwinkel“ in Task 3.
3. **Tab lange im Hintergrund oder Rechner aus dem Ruhezustand:** Beim Zurückkehren darf die Zeit nicht nachspringen. → Test `schritt` begrenzt dt auf 0,1 s in Task 1.
4. **Umschalten hell/dunkel mitten in der Verwandlung:** Farben wechseln sofort, die Bewegung läuft ohne Ruck weiter. → Browser-Schritt in Task 5.
5. **Handybreite 375 px:** Die Schrift ASC/MC und die Tierkreisnamen bleiben sichtbar und werden nicht abgeschnitten, keine waagerechte Scrollleiste. → Browser-Schritt in Task 5.

---

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `vitest.config.ts` | Testkonfiguration (neu) |
| `src/scripts/kosmos/zeitplan.ts` | Phasenuhr, Glättung, Tempo, Zeitschritt |
| `src/scripts/kosmos/modell.ts` | Körperdaten, Sonnenwinkel, geozentrische Längen, Aspekte |
| `src/scripts/kosmos/layout.ts` | Vollständiges Bild-Layout aus (τ, p, Aszendent) |
| `src/scripts/kosmos/szene.ts` | SVG-Aufbau und Übertragung des Layouts |
| `src/components/KosmosRadix.astro` | Hülle für die Seite |
| `src/pages/index.astro` | bindet `KosmosRadix` statt `RadixAnimation` ein |
| `src/components/RadixAnimation.astro` | wird gelöscht |
| `tests/kosmos/*.test.ts` | Tests für zeitplan, modell, layout |

---

### Task 1: Vitest einrichten und Zeitplan

**Files:**
- Create: `vitest.config.ts`, `src/scripts/kosmos/zeitplan.ts`, `tests/kosmos/zeitplan.test.ts`
- Modify: `package.json` (devDependency `vitest`, Skript `"test": "vitest run"`)

**Interfaces:**
- Produces:
  - `export const T = 40; export const EINSTIEG = 5;`
  - `export const TEMPO_RADIX: number; export const TEMPO_SONNENSYSTEM: number;`
  - `export function glatt(x: number): number`: smootherstep, x vorher auf [0, 1] geklemmt
  - `export function phase(phi: number): number`: p ∈ [0, 1], `phi` beliebig (auch > T oder negativ), intern `mod T`
  - `export function teil(p: number, von: number, bis: number): number`: `glatt((p − von) / (bis − von))`
  - `export function tempo(p: number): number`: `TEMPO_SONNENSYSTEM + (TEMPO_RADIX − TEMPO_SONNENSYSTEM) · p`
  - `export interface Uhr { t: number; tau: number }` (t = gelaufene Sekunden, tau = Modellzeit in Erdumläufen)
  - `export function schritt(u: Uhr, dt: number): Uhr`: `dt` auf [0, 0,1] begrenzen, `t += dt`, `tau += tempo(phase(t + EINSTIEG)) · dt`

- [ ] **Step 1: Vitest installieren und einrichten**

Run: `npm i -D vitest`. In `package.json` das Skript `"test": "vitest run"` ergänzen. `vitest.config.ts` mit `defineConfig({ test: { include: ['tests/**/*.test.ts'] } })` aus `vitest/config` anlegen. Nicht `getViteConfig` von Astro verwenden.

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { T, glatt, phase, teil, tempo, schritt, TEMPO_RADIX, TEMPO_SONNENSYSTEM } from '../../src/scripts/kosmos/zeitplan';

describe('zeitplan', () => {
  it('glatt klemmt und hat feste Randwerte', () => {
    expect(glatt(-1)).toBe(0); expect(glatt(0)).toBe(0);
    expect(glatt(0.5)).toBeCloseTo(0.5); expect(glatt(1)).toBe(1); expect(glatt(2)).toBe(1);
  });
  it('folgt der Ablauftabelle', () => {
    expect(phase(0)).toBe(0); expect(phase(9.99)).toBe(0);
    expect(phase(12)).toBeCloseTo(0.5); expect(phase(14)).toBe(1);
    expect(phase(25)).toBe(1); expect(phase(38)).toBeCloseTo(0.5); expect(phase(40)).toBe(0);
  });
  it('ist periodisch', () => {
    for (const x of [0, 3, 11.3, 20, 37.7]) {
      expect(phase(x + T)).toBeCloseTo(phase(x), 12);
      expect(phase(x - T)).toBeCloseTo(phase(x), 12);
    }
  });
  it('springt nie und hat flache Ränder', () => {
    const h = 0.001; let max = 0;
    for (let x = 0; x < 2 * T; x += h) max = Math.max(max, Math.abs(phase(x + h) - phase(x)));
    expect(max).toBeLessThan((1.875 / 4) * h * 1.01); // höchste Steigung von smootherstep über 4 s
    for (const rand of [10, 14, 36, 40]) {
      expect(Math.abs(phase(rand + 1e-4) - phase(rand - 1e-4))).toBeLessThan(1e-9);
    }
  });
  it('teil glättet ein Teilfenster', () => {
    expect(teil(0.2, 0.3, 0.8)).toBe(0); expect(teil(0.55, 0.3, 0.8)).toBeCloseTo(0.5); expect(teil(0.9, 0.3, 0.8)).toBe(1);
  });
  it('tempo ist immer positiv und mischt linear', () => {
    expect(tempo(0)).toBe(TEMPO_SONNENSYSTEM); expect(tempo(1)).toBeCloseTo(TEMPO_RADIX);
    expect(TEMPO_RADIX).toBeCloseTo(0.5 / 360); expect(TEMPO_SONNENSYSTEM).toBeCloseTo(6 * TEMPO_RADIX);
    for (let p = 0; p <= 1; p += 0.05) expect(tempo(p)).toBeGreaterThan(0);
  });
  it('schritt begrenzt große Sprünge auf 0,1 s', () => {
    const u = schritt({ t: 0, tau: 0 }, 600);
    expect(u.t).toBeCloseTo(0.1);
    expect(schritt({ t: 0, tau: 0 }, -1).t).toBe(0);
  });
  it('tau läuft stetig vorwärts', () => {
    let u = { t: 0, tau: 0 }, vorher = 0;
    for (let i = 0; i < 60 * 90; i++) { u = schritt(u, 1 / 60); expect(u.tau).toBeGreaterThan(vorher); vorher = u.tau; }
  });
});
```

- [ ] **Step 3: Test laufen lassen, er muss fehlschlagen**

Run: `npm test`
Expected: FAIL, weil `src/scripts/kosmos/zeitplan` nicht existiert

- [ ] **Step 4: `zeitplan.ts` mit den Signaturen oben umsetzen**

`phase`: `φ = ((phi % T) + T) % T`, dann stückweise: `< 10 → 0`, `< 14 → glatt((φ−10)/4)`, `< 36 → 1`, sonst `1 − glatt((φ−36)/4)`.

- [ ] **Step 5: Tests laufen lassen, sie müssen grün sein**

Run: `npm test`
Expected: PASS, 8 Tests

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/scripts/kosmos/zeitplan.ts tests/kosmos/zeitplan.test.ts
git commit -m "feat(kosmos): Zeitplan für die Endlosschleife, Vitest eingerichtet"
```

Hinweis: `package.json` und `package-lock.json` haben schon fremde, nicht committete Änderungen. Vor dem Commit mit `git diff package.json` prüfen. Enthält der Diff mehr als `vitest` und das Skript `test`, dann **nicht** committen, sondern den Nutzer fragen.

---

### Task 2: Planetenmodell

**Files:**
- Create: `src/scripts/kosmos/modell.ts`, `tests/kosmos/modell.test.ts`

**Interfaces:**
- Produces:
  - `export const EXPONENT = 0.6;`
  - `export type PlanetId = 'merkur' | 'venus' | 'erde' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptun' | 'pluto';`
  - `export type RadixId = 'sonne' | 'mond' | 'merkur' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptun' | 'pluto';`
  - `export interface Planet { id: PlanetId; P: number; start: number; bildRadius: number; groesse: number; farbe: string; ring?: boolean }`
  - `export const PLANETEN: readonly Planet[]` in dieser Reihenfolge, Werte:

    | id | P (Jahre) | start (°) | bildRadius | groesse | farbe |
    | --- | --- | --- | --- | --- | --- |
    | merkur | 0.2408 | 40 | 70 | 5.4 | `#b9b2a2` |
    | venus | 0.6152 | 150 | 115 | 8 | `#e6cf9a` |
    | erde | 1 | 270 | 160 | 8.5 | `#6f93c4` |
    | mars | 1.8808 | 20 | 205 | 6.7 | `#c27650` |
    | jupiter | 11.862 | 105 | 250 | 16.5 | `#d6b98c` |
    | saturn | 29.457 | 292 | 295 | 14 | `#e0cc98` (ring: true) |
    | uranus | 84.01 | 280 | 340 | 10.3 | `#9cc9cc` |
    | neptun | 164.8 | 283 | 385 | 9.9 | `#5d7ec4` |
    | pluto | 248 | 226 | 430 | 3.6 | `#a89c8a` |

  - `export const MOND = { start: 0, umlaeufe: 5, bildRadius: 18, groesse: 2.5 };`
  - `export const RADIX_REIHE: readonly { id: RadixId; glyph: string; gross?: boolean }[]`: Sonne ☉ (gross), Mond ☽ (gross), ☿, ♀, ♂, ♃, ♄, ♅, ♆, ♇, in der Reihenfolge des Typs `RadixId`
  - `export function sonnenWinkel(id: PlanetId, tau: number): number`: `norm(start + 360 · ω · tau)` mit `ω = (1/P)^EXPONENT`
  - `export function mondWinkel(tau: number): number`: Winkel des Mondes um die Erde
  - `export function rechenAbstand(id: PlanetId): number`: `P^(EXPONENT · 2/3)`
  - `export function laengen(tau: number): Record<RadixId, number>`: geozentrische Längen in [0, 360), Sonne = Erde + 180, Mond = `mondWinkel`
  - `export interface Aspekt { a: RadixId; b: RadixId; staerke: number; hart: boolean }` (staerke = s aus der bestehenden Regel, > 0)
  - `export function aspekte(l: Record<RadixId, number>): Aspekt[]`: alle Paare aus `RADIX_REIHE`, Regeln 60°/Orb 5 weich, 90°/Orb 8 hart, 120°/Orb 8 weich, 180°/Orb 8 hart. Bester Aspekt je Paar mit `s = 1 − |d − deg| / orb`, nur s > 0.
  - `export const norm: (x: number) => number` und `export const abst: (x: number, y: number) => number` (kleinster Winkelabstand 0…180)

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { laengen, sonnenWinkel, rechenAbstand, aspekte, abst, PLANETEN, RADIX_REIHE } from '../../src/scripts/kosmos/modell';

const grad = (x: number) => (x * 180) / Math.PI;
const vorz = (a: number, b: number) => ((a - b + 540) % 360) - 180; // signierte Differenz

describe('modell', () => {
  it('hat neun Planeten und zehn Radix-Körper', () => {
    expect(PLANETEN.map((p) => p.id)).toEqual(['merkur', 'venus', 'erde', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto']);
    expect(RADIX_REIHE.map((r) => r.id)).toEqual(['sonne', 'mond', 'merkur', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto']);
  });
  it('Sonne steht von der Erde aus gegenüber der Erde', () => {
    for (const tau of [0, 0.3, 1.7, 12]) expect(abst(laengen(tau).sonne, sonnenWinkel('erde', tau) + 180)).toBeLessThan(1e-9);
  });
  it('Merkur und Venus bleiben nahe bei der Sonne', () => {
    for (const id of ['merkur', 'venus'] as const) {
      const grenze = grad(Math.asin(rechenAbstand(id))) + 0.5;
      for (let tau = 0; tau < 8; tau += 0.002) { const l = laengen(tau); expect(abst(l[id], l.sonne)).toBeLessThan(grenze); }
    }
  });
  it('Mars wird innerhalb von 4 Erdumläufen rückläufig', () => {
    let rueck = false;
    for (let tau = 0; tau < 4; tau += 0.001) if (vorz(laengen(tau + 0.001).mars, laengen(tau).mars) < 0) rueck = true;
    expect(rueck).toBe(true);
  });
  it('alle Längen liegen in [0, 360)', () => {
    for (const v of Object.values(laengen(3.21))) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(360); }
  });
  it('erkennt Aspekte mit den bestehenden Regeln', () => {
    const l = { sonne: 0, mond: 90, merkur: 200, venus: 330, mars: 45, jupiter: 120, saturn: 181, uranus: 10, neptun: 270, pluto: 300 };
    const a = aspekte(l);
    const sm = a.find((x) => x.a === 'sonne' && x.b === 'mond')!;
    expect(sm.hart).toBe(true); expect(sm.staerke).toBeCloseTo(1);
    const sj = a.find((x) => x.a === 'sonne' && x.b === 'jupiter')!;
    expect(sj.hart).toBe(false); expect(sj.staerke).toBeCloseTo(1);
    const ss = a.find((x) => x.a === 'sonne' && x.b === 'saturn')!;
    expect(ss.hart).toBe(true); expect(ss.staerke).toBeCloseTo(1 - 1 / 8);
    expect(a.find((x) => x.a === 'sonne' && x.b === 'uranus')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npm test -- modell`
Expected: FAIL, Modul fehlt

- [ ] **Step 3: `modell.ts` mit den Signaturen und Werten oben umsetzen**

`laengen`: Sonnenpositionen `[a·cos, a·sin]` mit Rechenabstand und Sonnenwinkel, Erde mit `a = 1`, dann `norm(grad(atan2(y − yE, x − xE)))`.

- [ ] **Step 4: Tests laufen lassen, sie müssen grün sein**

Run: `npm test`
Expected: PASS, alle Tests aus Task 1 und 2

- [ ] **Step 5: Commit**

```bash
git add src/scripts/kosmos/modell.ts tests/kosmos/modell.test.ts
git commit -m "feat(kosmos): Planetenmodell mit geozentrischen Längen und Aspekten"
```

---

### Task 3: Layout

**Files:**
- Create: `src/scripts/kosmos/layout.ts`, `tests/kosmos/layout.test.ts`

**Interfaces:**
- Consumes: alles aus Task 1 und 2
- Produces:
  - `export const R = { out: 418, band: 370, ring: 332, asp: 212, hub: 92 }; export const SPUR = 292; export const ASC0 = 160; export const ASC_V = 1; export const K_SCHRAEG = 0.42;`
  - `export function pt(r: number, a: number): [number, number]`
  - `export function mixWinkel(a: number, b: number, q: number): number`: kürzester Weg, Ergebnis in [0, 360)
  - `export function aszendent(t: number): number`: `ASC0 + ASC_V · (t + EINSTIEG)`
  - `export interface KoerperLayout { x: number; y: number; kugelR: number; kugelDeckkraft: number; zeichenDeckkraft: number; punktX: number; punktY: number; hinten: boolean }`
  - `export interface RingLayout { rx: number; ry: number; breite: number; deckkraft: number }`
  - `export interface AspektLayout { a: RadixId; b: RadixId; x1: number; y1: number; x2: number; y2: number; breite: number; hart: boolean; deckkraft: number }`
  - `export interface Layout { K: number; koerper: Record<RadixId | 'erde', KoerperLayout>; ringe: RingLayout[]; aspekte: AspektLayout[]; radix: number; tierkreisDrehung: number; zeichen: { x: number; y: number }[]; namenOben: number[]; sonnenHof: { r: number; deckkraft: number }; nebel: number }`
  - `export function layout(tau: number, p: number, asc: number): Layout`

**Werte aus der Spec (Teilfenster in p):** Aufrichten 0–0,6 (`K` von 0,42 auf 1); Wandern 0–0,7; Kugel → Zeichen 0,3–0,8; Sonnenhof 0–0,7 (r 160 → 0, Deckkraft 1 → 0); Erde in die Mitte 0–0,6; Bahnen → Ringe 0,4–1; Radix einblenden 0,6–1 (`radix`); Aspekte zusätzlich × `teil(p, 0.85, 1)`; Nebel `1 − 0,75 · p`.

**Ringe** (9 Stück in `PLANETEN`-Reihenfolge): Start `rx = bildRadius`, `ry = bildRadius · K`, Breite 1,4, Deckkraft 0,6. Ziel nach Tabelle: Pluto 418, Neptun 411, Uranus 370, Saturn 332, Jupiter 212, Mars 92, Erde 66 mit den Breiten 1,1 / 0,45 / 0,85 / 0,6 / 0,6 / 0,9 / 0,5 und Deckkraft 1. Merkur und Venus gehen gegen Radius 40 bzw. 50 und Deckkraft 0.

**Positionen:** Start (p = 0) Bildwinkel `scr(sonnenWinkel)` mit Radius `bildRadius` und `y · K`, die Sonne in der Mitte. Der Mond liegt um die Erde mit `MOND.bildRadius`. Ziel (p = 1): `pt(SPUR, scr(λ))`, der Punkt auf `pt(R.asp + 2, scr(λ))`, die Erde in der Mitte. Gemischt wird polar um die Bildmitte. Hat ein Ende Radius 0, gilt der Winkel des anderen Endes. `hinten` = Sonnenwinkel-Bildpunkt liegt oberhalb der Mitte (y < 0) und p < 0,6. Kugelgröße × (0,82…1) nach Tiefe, Tiefeneffekt × (1 − Aufrichten). Radix-Formeln für `zeichen` (Radius `R.band − 25`), `namenOben` (`klemm(0.5 + sin(scr(mid))·14)`) und `tierkreisDrehung = −rot` aus der bisherigen Komponente übernehmen. Aspektpunkte bei `pt(R.asp, scr(λ))`, Breite `0.55 + 0.55·s`, Deckkraft `klemm(2,5·s) · teil(p, 0.85, 1)`. `aspekte` hat immer genau 45 Einträge (jedes Paar aus `RADIX_REIHE` einmal, Reihenfolge wie die Doppelschleife), Paare ohne Aspekt mit Deckkraft 0, damit die Szene feste Linien hat.

**Kugeln:** Sonne `kugelR` 26 → 0 im Fenster Sonnenhof. Erde `kugelR = groesse`, Kugel-Deckkraft `1 − teil(p, 0.3, 0.6)`, `zeichenDeckkraft` immer 0. Mond: Start an Erdposition + `pt(MOND.bildRadius, scr(mondWinkel))`, Kugel und Zeichen wie die Planeten. Alle anderen: Kugel-Deckkraft `1 − teil(p, 0.3, 0.8)`, Zeichen-Deckkraft `teil(p, 0.3, 0.8)`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { layout, mixWinkel, pt, aszendent, SPUR, R } from '../../src/scripts/kosmos/layout';
import { schritt, phase, EINSTIEG } from '../../src/scripts/kosmos/zeitplan';
import { laengen } from '../../src/scripts/kosmos/modell';

const norm = (x: number) => ((x % 360) + 360) % 360;

describe('layout', () => {
  it('mixWinkel nimmt den kurzen Weg über 0°', () => {
    expect(mixWinkel(350, 10, 0.5)).toBeCloseTo(0);
    expect(mixWinkel(10, 350, 0.25)).toBeCloseTo(5);
    expect(mixWinkel(90, 180, 1)).toBeCloseTo(180);
  });
  it('bei p = 1 stimmt alles mit der bestehenden Radix überein', () => {
    const tau = 2.4, asc = 211, rot = 180 - asc, l = laengen(tau), L = layout(tau, 1, asc);
    for (const id of ['sonne', 'mond', 'mars', 'pluto'] as const) {
      const [x, y] = pt(SPUR, norm(l[id] + rot));
      expect(L.koerper[id].x).toBeCloseTo(x, 6); expect(L.koerper[id].y).toBeCloseTo(y, 6);
      expect(L.koerper[id].zeichenDeckkraft).toBe(1); expect(L.koerper[id].kugelDeckkraft).toBe(0);
    }
    expect(L.K).toBeCloseTo(1, 9); expect(L.radix).toBe(1); expect(L.tierkreisDrehung).toBeCloseTo(-rot);
    expect(L.koerper.erde.x).toBeCloseTo(0); expect(L.koerper.erde.y).toBeCloseTo(0);
    expect(L.ringe.map((r) => r.rx).slice(3)).toEqual([R.hub, R.asp, R.ring, R.band, 411, R.out]);
  });
  it('bei p = 0 ist alles Radix-Spezifische unsichtbar', () => {
    const L = layout(1.1, 0, 170);
    expect(L.radix).toBe(0); expect(L.K).toBeCloseTo(0.42);
    expect(L.aspekte.every((a) => a.deckkraft === 0)).toBe(true);
    expect(Object.values(L.koerper).every((k) => k.zeichenDeckkraft === 0)).toBe(true);
    expect(L.koerper.sonne.x).toBeCloseTo(0); expect(L.koerper.sonne.y).toBeCloseTo(0);
  });
  it('die Sonne verlässt die Mitte schon in ihrer Zielrichtung', () => {
    const tau = 0.7, asc = 180, a = layout(tau, 0.02, asc).koerper.sonne, b = layout(tau, 0.04, asc).koerper.sonne;
    const w = (k: { x: number; y: number }) => norm((Math.atan2(-k.y, k.x) * 180) / Math.PI);
    expect(Math.abs(((w(a) - w(b) + 540) % 360) - 180)).toBeLessThan(0.5);
  });
  it('kein Körper springt zwischen zwei Bildern, auch über die Schleifengrenze', () => {
    let u = { t: 0, tau: 0 }, vorher = layout(0, phase(EINSTIEG), aszendent(0)), max = 0;
    for (let i = 0; i < 60 * 80; i++) {
      u = schritt(u, 1 / 60);
      const L = layout(u.tau, phase(u.t + EINSTIEG), aszendent(u.t));
      for (const id of Object.keys(L.koerper) as (keyof typeof L.koerper)[])
        max = Math.max(max, Math.hypot(L.koerper[id].x - vorher.koerper[id].x, L.koerper[id].y - vorher.koerper[id].y));
      vorher = L;
    }
    // schnellste echte Bewegung in der Verwandlung: rund 10 Einheiten pro Bild; ein Sprung wären Hunderte
    expect(max).toBeLessThan(25);
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npm test -- layout`
Expected: FAIL, Modul fehlt

- [ ] **Step 3: `layout.ts` mit den Signaturen und Werten oben umsetzen**

Polares Mischen (der einzige Algorithmus, den die Tests nicht ganz festlegen):

```ts
function mischePolar(r0: number, w0: number, r1: number, w1: number, q: number): [number, number] {
  const a = r0 < 1e-6 ? w1 : w0, b = r1 < 1e-6 ? w0 : w1;
  return [r0 + (r1 - r0) * q, mixWinkel(a, b, q)];
}
```

Der Startpunkt im Sonnensystem wird als Polarkoordinate des *ungekippten* Punktes gemischt. Die Neigung wird danach angewendet: `y · (K + (1 − K) · aufrichten)`, so wird sie bei p = 1 zu 1.

- [ ] **Step 4: Tests laufen lassen, sie müssen grün sein**

Run: `npm test`
Expected: PASS, alle Tests aus Task 1 bis 3. Schlägt der Sprungtest fehl, zuerst die Mischreihenfolge prüfen, nicht die Grenze 25 anheben.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/kosmos/layout.ts tests/kosmos/layout.test.ts
git commit -m "feat(kosmos): Layout für die Verwandlung Sonnensystem ↔ Radix"
```

---

### Task 4: Szene und Komponente, auf der Startseite einbinden

**Files:**
- Create: `src/scripts/kosmos/szene.ts`, `src/components/KosmosRadix.astro`
- Modify: `src/pages/index.astro:3` und `:28` (`RadixAnimation` → `KosmosRadix`)
- Delete: `src/components/RadixAnimation.astro`

**Interfaces:**
- Consumes: `Layout`, `layout`, `aszendent`, `R`, `SPUR`, `ASC0` (Task 3); `RADIX_REIHE`, `PLANETEN`, `MOND` (Task 2); `schritt`, `phase`, `EINSTIEG`, `Uhr` (Task 1)
- Produces:
  - `export interface Szene { zeichne(l: Layout): void; setzeStrich(faktor: number): void }`
  - `export function baueSzene(host: HTMLElement, nr: number): Szene`
  - Komponente `<KosmosRadix class?: string />`

- [ ] **Step 1: `baueSzene` in `szene.ts` umsetzen**

Ebenen von unten nach oben: Scheibe (`--rx-disk`), Sterne (zufällig mit fester Saat, 18 % mit Klasse `kx-funkeln`), Nebel (dunkel: zwei Ellipsen `--kx-nebel1` / `--kx-nebel2`, hell: eine Ellipse `--kx-schleier`, sichtbar über CSS je Modus), 9 Bahn-Ellipsen, hintere Planeten, Sonnenhof plus Sonnenkern (Verläufe aus der Spec), Radix-Gruppe (Grundkreise, Tierkreis mit Gradskala, Grenzen und Namen über `textPath`, Tierkreiszeichen, Häuser, Achsen, Aspektlinien mit Maske um die Nabe, Nabe mit Hausnummern), vordere Planeten, Planetenzeichen und Punkte. Den Radix-Teil aus `RadixAnimation.astro` übernehmen, einschließlich `data-w` für die Strichstärke und eindeutiger IDs pro `nr`. Planetenkugeln: je ein `radialGradient` (`cx 35% cy 35% r 75%`, Lichtpunkt weiß → Grundfarbe zu 35 % Richtung `#e0c27e` gemischt → `var(--kx-schatten)`), Saturn mit Ring. Farben in Verläufen über `style="stop-color: var(...)"`. `zeichne` setzt nur Attribute: Positionen, `rx/ry`, Breiten (× Strichfaktor), Deckkräfte. Ist die Deckkraft 0, kommt `visibility="hidden"` dazu. Planeten wechseln zwischen hinterer und vorderer Gruppe nur, wenn sich `hinten` ändert.

- [ ] **Step 2: `KosmosRadix.astro` umsetzen**

Schriftimporte und `<style>` aus `RadixAnimation.astro` übernehmen (Klasse `.radix`, `--rx-*` für hell, dunkel und Systemeinstellung). Neue Variablen für hell: `--kx-bahn: #86662a`, `--kx-schatten: #5a4a35`, `--kx-schleier: #f3e6c8`, `--kx-stern: #b8914a`. Für dunkel: `--kx-bahn: #e0c27e`, `--kx-schatten: #0a0f22`, `--kx-nebel1: #4a3560`, `--kx-nebel2: #5a4420`, `--kx-stern: #eee7d7`. Funkeln wie in der Vorschau-Datei (`@keyframes`, 5 s), bei `prefers-reduced-motion` aus. `aria-label` genau: „Animation: Das Sonnensystem verwandelt sich in ein Geburtshoroskop-Rad“.

Skript: Für jedes `[data-kosmos]`-Element `baueSzene`, `Uhr = { t: 0, tau: 0 }`, Bildschleife mit `schritt(uhr, dt)` und `zeichne(layout(uhr.tau, phase(uhr.t + EINSTIEG), aszendent(uhr.t)))`. Start und Stopp über IntersectionObserver und `document.visibilityState`. Nach jeder Pause wird `last = null` gesetzt. Bei `themechange`: Strichfaktor neu aus `--rx-dick` lesen und neu zeichnen. Bei `prefers-reduced-motion: reduce`: einmal `zeichne(layout(0, 1, ASC0))`, keine Schleife.

- [ ] **Step 3: Startseite umstellen und alte Komponente löschen**

In `src/pages/index.astro` Import und Verwendung auf `KosmosRadix` ändern. `src/components/RadixAnimation.astro` löschen. Vorher mit `grep -rn RadixAnimation src` prüfen, dass es keine weitere Verwendung gibt.

- [ ] **Step 4: Bauen und Tests**

Run: `npm run build && npm test`
Expected: Build ohne Fehler und ohne TypeScript-Fehler, alle Tests grün

- [ ] **Step 5: Kurz im Browser ansehen**

Run: `npm run dev`, dann `http://localhost:4321` im Browser öffnen
Expected: Oben ist das Sonnensystem zu sehen, nach etwa 5 s beginnt die Verwandlung, danach erscheint die Radix. Die Konsole zeigt keine Fehler.

- [ ] **Step 6: Commit**

`index.astro` hat fremde, nicht committete Änderungen. Vorher `git diff src/pages/index.astro` prüfen. Enthält der Diff mehr als die zwei Zeilen dieser Aufgabe, dann nur die neuen Dateien committen und den Nutzer wegen `index.astro` fragen.

```bash
git add src/scripts/kosmos/szene.ts src/components/KosmosRadix.astro src/pages/index.astro
git rm src/components/RadixAnimation.astro
git commit -m "feat(kosmos): Sonnensystem-Radix-Animation auf der Startseite"
```

---

### Task 5: Prüfen und Feinschliff im Browser

**Files:**
- Modify: nur Konstanten oben in `zeitplan.ts`, `modell.ts` und `layout.ts` (Tempi, Bildradien, Teilfenster), falls nötig

- [ ] **Step 1: Mehrere volle Durchläufe in hell und dunkel ansehen**

Je mindestens drei Durchläufe (rund 2 min). Erwartet: keine erkennbare Naht, kein Ruck, Radix-Phase ruhig. Merkur und Venus bleiben nahe bei ☉.

- [ ] **Step 2: Mitten in der Verwandlung umschalten**

Um 10–14 s bzw. 36–40 s auf den Umschalter klicken. Erwartet: Farben und Strichstärken wechseln sofort, die Bewegung läuft ohne Sprung weiter.

- [ ] **Step 3: Handybreite**

Browserfenster auf 375 × 812 stellen. Erwartet: keine waagerechte Scrollleiste, ASC/IC/DC/MC und Tierkreisnamen vollständig sichtbar, Sonnensystem passt ins Quadrat.

- [ ] **Step 4: Bewegung reduzieren und Hintergrund-Tab**

`prefers-reduced-motion: reduce` nachbilden. Erwartet: Standbild der Radix, keine Bewegung. Danach normal laden, Tab 1 min in den Hintergrund legen und zurückkehren. Erwartet: Es läuft weich weiter, nichts springt.

- [ ] **Step 5: Leistung**

Leistungsprofil über 10 s mit der Verwandlung darin aufnehmen. Erwartet: gleichmäßig etwa 60 Bilder pro Sekunde, keine Aufgabe länger als 50 ms.

- [ ] **Step 6: Feinschliff, Tests, Commit**

Konstanten nach Augenmaß nachstellen, danach `npm test && npm run build`. Erwartet: alles grün.

```bash
git add src/scripts/kosmos/zeitplan.ts src/scripts/kosmos/modell.ts src/scripts/kosmos/layout.ts
git commit -m "style(kosmos): Tempi und Staffelung nach Sichtprüfung"
```
