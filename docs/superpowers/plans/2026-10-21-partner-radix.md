# Partner-Radix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf der Partnerschafts-Seite zerfallen zwei drehende Kosmos-Radixe beim Scrollen zu Sand, der darunter die Doppelradix bildet.

**Architecture:** Reine Rechenmodule unter `src/scripts/partner/` (Paar-Daten, Synastrie, Scroll-Fortschritt, Sand), getestet mit Vitest. Die Darstellung nutzt `baueSzene` aus `src/scripts/kosmos/szene.ts` (neu: Option `nurRadix`) für A und B und eine neue Szene `doppel.ts` für die Doppelradix, die den ausgelagerten Tierkreisring teilt. Eine Komponente `PartnerRadix.astro` steuert alles über eine Bildschleife und eine Canvas-Ebene für den Sand.

**Tech Stack:** Astro, TypeScript, SVG, Canvas 2D, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-partner-radix-design.md`

## Global Constraints

- Kosmos-Radix auf Start- und Geburtshoroskop-Seite bleibt in Verhalten und Aussehen unverändert; alle Tests unter `tests/kosmos` bleiben grün.
- Keine neue Abhängigkeit, kein WebGL.
- Erfundene Konstellationen; Kommentare und Namen auf Deutsch wie im übrigen Code.
- Im Arbeitsbaum liegen fremde, nicht committete Änderungen (u. a. `src/components/KosmosRadix.astro`). Nur eigene Dateien stagen (`git add <pfad>`), nie `git add -A`, `KosmosRadix.astro` nicht anfassen.
- Bewegung reduziert: keine Drehung, kein Sand, keine Maske, alle drei Räder fertig.
- Kornzahl: 2400 ab 640 px Breite, sonst 1200. Gerätepixelverhältnis der Canvas höchstens 2.
- Farbe B: hell `#4f6a86`, dunkel `#9fc3d9` (`--rx-partner`).
- Spuren der Doppelradix: `SPUR_INNEN = 250`, `SPUR_AUSSEN = 306`, `R_TRENN = 278`; Planetenzeichen 26.
- Zeitfenster: Ablösen 0–0,45 (oben früher, Zufall ±0,08), Landen 0,45–0,95 (außen früher), Aspekte 0,9–1.

## Review Focus

- Scrollen sehr schnell oder Sprung per Anker/Reload mitten in den Übergang: Bild muss sofort zum aktuellen `s` passen (keine Zustände über Bilder hinweg) — Test in Task 3 (`kornOrt` ist rein von `s`).
- Fenstergröße ändern oder Handy drehen während des Übergangs: Start- und Zielpunkte müssen den neuen Rädern folgen — Geometrie wird jedes Bild aus den Host-Rechtecken gelesen (Task 5), Test in Task 3 mit zwei Geometrien.
- Seite kürzer als das Fenster (Doppelradix kann die Mitte nie erreichen): `s` muss trotzdem 1 erreichen können — Test in Task 2.
- Theme-Wechsel mitten im Übergang: Sandfarbe folgt `--rx-gold` — Farbe pro Bild aus berechnetem Stil lesen (Task 5).
- Zwei Planeten im selben Ring sehr nah beieinander: Zeichen dürfen sich nicht überdecken — Test in Task 1 (`entzerre`).

---

### Task 1: Paar-Daten und Synastrie

**Files:**
- Create: `src/scripts/partner/paar.ts`
- Test: `tests/partner/paar.test.ts`

**Interfaces:**
- Consumes: `laengen(tau)`, `norm`, `abst`, `RADIX_REIHE`, `RadixId` aus `src/scripts/kosmos/modell.ts`; `ASC0` aus `layout.ts`.
- Produces:
  - `TAU_A: number`, `TAU_B: number`, `ASC_VERSATZ_B = 95`
  - `interface SynAspekt { a: RadixId; b: RadixId; staerke: number; hart: boolean }`
  - `synastrie(la: Record<RadixId, number>, lb: Record<RadixId, number>): SynAspekt[]` — alle 100 Paare A×B, Aspekte Konjunktion (0°, Orb 8, weich), Sextil (60°, 5), Quadrat (90°, 8, hart), Trigon (120°, 8), Opposition (180°, 8, hart); `staerke = 1 − |d − deg| / orb`, nur Paare mit `staerke > 0`.
  - `entzerre(winkel: number[], mindest = 7): number[]` — Anzeigewinkel, die sich paarweise um mindestens `mindest` Grad unterscheiden, jeder höchstens 6° vom Original verschoben, Reihenfolge im Kreis erhalten.

- [ ] **Step 1: Tests schreiben**

```ts
it('erkennt jede Aspektart an konstruierten Längen', () => {
  const basis = Object.fromEntries(RADIX_REIHE.map((r, i) => [r.id, i * 1.3])) as Record<RadixId, number>;
  const b = { ...basis, sonne: 100 } as Record<RadixId, number>;
  // A-Sonne bei 0: 100 ist kein Aspekt; dann gezielt setzen
  for (const [deg, hart] of [[0, false], [60, false], [90, true], [120, false], [180, true]] as const) {
    const lb = { ...b, sonne: norm(deg + 2) };
    const s = synastrie({ ...basis, sonne: 0 }, lb).find((x) => x.a === 'sonne' && x.b === 'sonne');
    expect(s?.hart).toBe(hart);
  }
});
it('liefert nur Paare zwischen A und B mit Stärke in (0,1]', ...);
it('beachtet Orb-Grenzen: Sextil bei 65,5° kein Aspekt, Quadrat bei 97,9° schon', ...);
it('TAU_A und TAU_B ergeben mindestens einen weichen und einen harten Aspekt', () => {
  const s = synastrie(laengen(TAU_A), laengen(TAU_B)).filter((x) => x.staerke > 0.4);
  expect(s.some((x) => x.hart)).toBe(true);
  expect(s.some((x) => !x.hart)).toBe(true);
});
it('entzerre: Abstand ≥ 7°, Verschiebung ≤ 6°, auch über 0°/360° hinweg', () => {
  const w = entzerre([358, 1, 3, 200]);
  // paarweise Kreisabstand prüfen, |w[i]-orig[i]| im Kreis ≤ 6
});
```

- [ ] **Step 2:** `npx vitest run tests/partner/paar.test.ts` → FAIL (Modul fehlt).
- [ ] **Step 3:** `paar.ts` implementieren. `TAU_A`/`TAU_B` durch Ausprobieren wählen (kleines Skript oder Test-Ausgabe), bis der Konstellationstest grün ist; Werte mit Kommentar „erfunden“ festhalten.
- [ ] **Step 4:** `npx vitest run tests/partner` → PASS.
- [ ] **Step 5:** Commit `feat(partner): Paar-Daten und Synastrie-Aspekte`.

### Task 2: Scroll-Fortschritt

**Files:**
- Create: `src/scripts/partner/fortschritt.ts`
- Test: `tests/partner/fortschritt.test.ts`

**Interfaces:**
- Produces: `interface Kasten { top: number; bottom: number; height: number }`; `fortschritt(paar: Kasten, doppel: Kasten, fensterHoehe: number, seitenRest: number): number` — `seitenRest` = noch scrollbare Strecke nach unten (`scrollHeight − scrollY − innerHeight`). Start `s=0`, solange `paar.bottom > 0,85·h` **oder** die Seite ganz oben steht; Ende `s=1`, wenn `doppel.top + doppel.height/2 ≤ h/2` oder `seitenRest ≤ 0`. Linear dazwischen über die Scrollstrecke, geklemmt auf [0,1]. Ungeglättet; Glätten macht der Aufrufer mit `glatt()`.

- [ ] **Step 1: Tests** — 0 vor Beginn; 1 wenn Doppelradix-Mitte über Fenstermitte; monoton bei schrittweisem Verschieben beider Kästen um denselben Betrag; geklemmt; **Review Focus:** kurze Seite (`seitenRest = 0`, Doppelradix-Mitte unterhalb der Fenstermitte) → 1.
- [ ] **Step 2:** Test läuft rot.
- [ ] **Step 3:** Implementieren: `s = (0,85h − paar.bottom) / max(1, (doppelMitte − h/2) − (paar.bottom − 0,85h))`, geklemmt; `seitenRest ≤ 0 → 1`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(partner): Scroll-Fortschritt für den Sandübergang`.

### Task 3: Sand

**Files:**
- Create: `src/scripts/partner/sand.ts`
- Test: `tests/partner/sand.test.ts`

**Interfaces:**
- Consumes: `R`, `SPUR`, `pt` aus `kosmos/layout.ts`; `SPUR_INNEN`, `SPUR_AUSSEN` (in `sand.ts` exportiert, von Task 4 importiert).
- Produces:
  - `SPUR_INNEN = 250`, `SPUR_AUSSEN = 306`, `R_TRENN = 278`
  - `interface Korn { von: 'A' | 'B'; startR: number; startW: number; zielR: number; zielW: number; los: number; an: number; wind: number; groesse: number; deckkraft: number; zitter: number; relativ: boolean }` — Winkel in Tierkreisgrad (ekliptische Länge), bei `relativ` (Häuserlinien, die bildschirmfest stehen) in Grad ab dem Aszendenten, Radien in Radix-Einheiten (Rad = 940 breit).
  - `interface Rad { cx: number; cy: number; massstab: number; asc: number }` (Seitenpixel; `massstab` = Hostbreite/940)
  - `interface Geometrie { a: Rad; b: Rad; doppel: Rad }`
  - `erzeugeKoerner(n: number, saat: number, planetenA: number[], planetenB: number[]): Korn[]`
  - `kornOrt(k: Korn, s: number, g: Geometrie, aus: { x: number; y: number; o: number }): void` — schreibt in `aus` (keine Allokation pro Bild).
  - `maskeRad(s: number): number` — Anteil 0..1, wie weit die Zerfallskante von oben nach unten gewandert ist (für Task 5).
  - `maskeDoppel(s: number): number` — Anteil 0..1 des Aufbaus von außen nach innen.

Verteilung der Startpunkte nach Gewicht (Linienlänge): Außenrand/Ringe (`R.out`, `R.band`, `R.ring`, `R.asp`, `R.hub`), 12 Zeichengrenzen (`R.ring..R.out`), Häuserlinien (`R.hub..R.ring`), Wolken um Planeten (`SPUR`, Streuung 10) und Tierkreiszeichen (`R.band − 25`). Ziele: A-Körner auf innere Teile der Doppelradix (`R.hub`, `R.asp`, Häuser, Wolken auf `SPUR_INNEN`), B-Körner auf äußere (`R.ring..R.out`, Wolken auf `SPUR_AUSSEN`).

Bildposition: Tierkreisgrad `L` → Bildwinkel `180 − asc + L` (wie `scr` in `layout.ts`), relativ: `180 + w`. Weg: quadratische Bezier von Start zu Ziel, Kontrollpunkt = Mitte + (`wind`·120 px seitlich, +80 px nach unten). Lokaler Fortschritt `q = glatt((s − los)/(an − los))`. Deckkraft: 0 vor `los`, steigt in 0,03 auf `deckkraft`, fällt ab `an` in 0,05 auf 0. Zittern: `sin(q·π)·zitter·3 px` quer zur Bahn.

- [ ] **Step 1: Tests**
  - gleiche Saat → gleiche Körner (tief gleich); andere Saat → anders.
  - `n` Körner, etwa hälftig A und B (40–60 %).
  - alle `los ∈ [0, 0,45]`, `an ∈ [0,45, 0,95]`, `los < an`; Körner mit kleinerem Bild-y (oben) haben im Mittel kleineres `los`; Körner mit größerem `zielR` im Mittel kleineres `an`.
  - `s = 0`: jedes Korn an seinem Startpunkt in Rad A/B, `o = 0`. `s = 1`: am Ziel in der Doppelradix, `o = 0`.
  - **Review Focus:** zwei Geometrien (Doppelradix um 300 px verschoben) → Ziel bei `s=1` verschiebt sich um genau 300 px.
  - `maskeRad(0)=0`, `maskeRad(0.45)=1`; `maskeDoppel(0.45)=0`, `maskeDoppel(0.95)=1`; beide monoton.
- [ ] **Step 2:** Rot.
- [ ] **Step 3:** Implementieren; Zufall über einen Park-Miller-Generator wie in `szene.ts` (`saat * 16807 % 2147483647`).
- [ ] **Step 4:** Grün.
- [ ] **Step 5:** Commit `feat(partner): Sandkörner mit Wegen vom Paar zur Doppelradix`.

### Task 4: Tierkreis auslagern, `nurRadix`, Doppelradix-Szene

**Files:**
- Create: `src/scripts/kosmos/tierkreis.ts`
- Modify: `src/scripts/kosmos/szene.ts` (Ringbau ab „Tierkreis-Ring: eigene Ebene …“ bis `ZEICHEN`; Himmel- und Funken-Aufbau)
- Create: `src/scripts/partner/doppel.ts`

**Interfaces:**
- Produces:
  - `baueTierkreis(ringSvg: SVGSVGElement, id: (s: string) => string, tx: ReturnType<typeof texte>): { namen: { top: Element; bot: Element }[] }` — Scheibe, Grenzringe, Gradskala, Zeichengrenzen, Namen auf Pfaden; identische Ausgabe wie bisher.
  - `baueSzene(host, nr, sprache, optionen?: { nurRadix?: boolean })` — bei `nurRadix` keine Himmel-Ebene, keine Funken, kein `scroll`-Listener für Funken; `zeichne()` überspringt Funken.
  - `baueDoppel(host: HTMLElement, nr: number, sprache: Sprache): { zeichne(laengenA, laengenB, asc: number, aspektAnteil: number): void; setzeStrich(f: number): void }` — Ringebene per CSS gedreht wie in `szene.ts`; Häuser (`CUSPS` aus `szene.ts` exportieren), Achsen, Nabe; Trennkreis `R_TRENN`; Zeichen A auf `SPUR_INNEN`, B auf `SPUR_AUSSEN` (Anzeigewinkel über `entzerre`), Klasse `rx-partner` für B; Punkte am Aspektring (A gefüllt, B Kreis ohne Füllung); Aspekte aus `synastrie`, Deckkraft `klemm(staerke·2,5)·aspektAnteil`, gekürzt mit `zerlegeAmKreis` wie in `szene.ts`.

- [ ] **Step 1:** `npx vitest run` → Ausgangslage grün notieren.
- [ ] **Step 2:** `baueTierkreis` auslagern, `szene.ts` ruft es auf. `npx vitest run` grün; Start- und Geburtshoroskop-Seite im Browser unverändert (Screenshot vorher/nachher, hell und dunkel).
- [ ] **Step 3:** Option `nurRadix` einbauen.
- [ ] **Step 4:** `doppel.ts` schreiben.
- [ ] **Step 5:** `npx astro check` (bzw. `npx tsc --noEmit`) ohne neue Fehler; `npx vitest run` grün.
- [ ] **Step 6:** Commit `refactor(kosmos): Tierkreisring auslagern, Szene ohne Himmel` und `feat(partner): Doppelradix-Szene` (zwei Commits).

### Task 5: Komponente, Sand-Canvas, Seite

**Files:**
- Create: `src/components/PartnerRadix.astro`
- Modify: `src/views/Demnaechst.astro`
- Modify: `src/scripts/kosmos/texte.ts` (Beschriftungen, Screenreader-Text)
- Test: `tests/kosmos/texte.test.ts` (neue Texte vorhanden in de und en)

**Interfaces:**
- Consumes: alles aus Task 1–4; `glatt` aus `zeitplan.ts`; `TEMPO_RADIX`, `ASC0`, `ASC_V`.
- Produces: `<PartnerRadix>` mit benannten Slots `paar-nach` (Text zwischen Paar und Doppelradix) und Standard-Slot (nach der Doppelradix).

Texte: `partnerA: 'Partner A'`, `partnerB: 'Partner B'` (de und en gleich), `doppelBeschreibung`: de „Zwei Geburtsbilder, die sich zu einer Doppelradix verbinden“, en „Two birth charts merging into a combined synastry chart“.

Komponente:
- Markup: `.partner` mit `.partner__paar` (zwei Hosts `[data-partner-rad="a"|"b"]` + Beschriftung), Slot `paar-nach`, `.partner__doppel` (Host `[data-partner-doppel]`), Standard-Slot; `<canvas class="partner__sand" aria-hidden="true">` fest über dem Fenster, `pointer-events:none`, hinter dem Inhalt.
- Styles: Radix-Variablen aus `KosmosRadix.astro` übernehmen (gleiche Werte, hell/dunkel), dazu `--rx-partner`; Größen laut Spec (Paar je 40 %, Doppel 70 % und `max-height: 80vh`; unter 640 px Paar je ~48 %, Doppel volle Breite).
- Script: A und B über `baueSzene(host, nr, sprache, { nurRadix: true })` + `layout(tau, 1, asc)`; Doppel über `baueDoppel`. Eine Bildschleife: `tauA += TEMPO_RADIX·dt`, `tauB` ebenso, `ascA = ASC0 + ASC_V·t`, `ascB = ascA + ASC_VERSATZ_B`. `s = glatt(fortschritt(...))`. Masken: Hosts A/B `mask-image: linear-gradient(to bottom, transparent ${m·110 − 10}%, #000 ${m·110}%)` mit `m = maskeRad(s)` (bei `m = 0` Maske entfernen); Doppel `radial-gradient(circle closest-side, transparent ${(1−d)·100 − 8}%, #000 ${(1−d)·100}%)` mit `d = maskeDoppel(s)`, plus äußerer Umriss mit Deckkraft 0,08 bei `d = 0` (eigenes Element). Sand: Geometrie aus `getBoundingClientRect()` der drei Hosts (Fensterkoordinaten), Körner per `kornOrt` zeichnen, nur wenn `0 < s < 1`; Farbe aus `getComputedStyle(host).color`; im Dunkeln zusätzlicher Schein (Radius ×2,5, Deckkraft ×0,25). Canvas-Größe bei `resize` an Fenster × `min(devicePixelRatio, 2)`.
- Schleife läuft nur, wenn einer der Hosts sichtbar und Tab sichtbar (IntersectionObserver + `visibilitychange`, wie `KosmosRadix.astro`); `themechange` → `setzeStrich`.
- Reduzierte Bewegung: einmal zeichnen mit `s = 1` für die Doppelradix, A/B ohne Maske, Canvas leer, keine Schleife.

Seite: In `Demnaechst.astro` für `art === 'partner'` Marke + Überschrift, dann `<PartnerRadix>` mit Einleitung/Hinweis im Slot `paar-nach` und Aktionen im Standard-Slot. `kinder` unverändert.

- [ ] **Step 1:** Texttest ergänzen → rot → Texte ergänzen → grün.
- [ ] **Step 2:** Komponente und Seite bauen.
- [ ] **Step 3:** `npx vitest run` und `npm run build` fehlerfrei.
- [ ] **Step 4:** Browser-Prüfung auf `http://localhost:4321/partnerschaftshoroskop` und `/en/partnership-horoscope`: oben zwei drehende Radixe ohne Himmel; beim Scrollen Zerfall von oben, Sand rieselt, Doppelradix baut sich von außen auf, Aspekte am Ende; zurückscrollen spult zurück; hell und dunkel; Handygröße (`resize_window` mobile); `prefers-reduced-motion`; Konsole ohne Fehler; Start- und Geburtshoroskop-Seite unverändert. Screenshots von Anfang, Mitte, Ende.
- [ ] **Step 5:** Commit `feat(partner): Partner-Radix mit Sandübergang auf der Partnerschafts-Seite`.
