// Kosmos-Flug für die Startseite: von der Milchstraße hinein ins Sonnensystem bis zur Erde.
// Dort setzt die bisherige Verwandlung ein: Die Erde wird zur Mitte, die Planeten wandern in den Tierkreis,
// die Radix zeichnet sich ein. Das letzte Bild gleicht genau dem Zustand, mit dem die laufende Radix
// der Seite weitermacht. Jedes Bild hängt nur von der Bildnummer ab.
// Ebenen von hinten nach vorn: Weltraum (3D) · Sonne und Planeten (echte Oberflächen) · Radix (SVG).
import '../../node_modules/@fontsource/stix-two-text/400.css';
import '../../node_modules/@fontsource/stix-two-text/500.css';
import '../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './radix.css';
import './flug/flug.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { baueSzene, type Szene } from '../../src/scripts/kosmos/szene';
import { layout, type Richtungen, type Layout } from '../../src/scripts/kosmos/layout';
import type { Sprache } from '../../src/scripts/kosmos/texte';
import { BREITE, MITTE, PX, FPS, FLUG_TEMPO, ablaufBild, VERWANDLUNG_AB, SCHWENK_AB, SCHWENK_BIS, lnMassstab, verwandlung, modellzeit, aszendentImFilm, rampe } from './flug/drehbuch';
import { kamera, SONNE, type Fassung, type Kamera } from './flug/galaxie';
import { baueWeltraum, type Weltraum } from './flug/weltraum';
import { ladeTexturen, zeichneKugel, zeichneSonnenlicht, type Texturen, type Licht, type KoerperId } from './flug/planeten';
import { zeichneWarp } from './flug/warp';
import { vorsprung, zusatzTempo, drehe, zeichneSpur } from './flug/umlauf';
import { posterGrad, posterOrt, posterMitte, posterRand, zeichneBahn, POSTER_LN, POSTER_SONNE_R, POSTER_SONNE_X, POSTER_ABSTAND, POSTER_HELL, RAHMEN_HELL } from './flug/poster';
import { PLANETEN } from '../../src/scripts/kosmos/modell';

export interface KosmosFlugProps {
  fassung: Fassung;
  sprache: Sprache;
  /* Auflösung: 1 = 1080 Bildpunkte, 2 = 2160; alles wird in dieser Auflösung gezeichnet, nicht hochskaliert */
  dichte?: number;
  /* doppelt hoch: oben die Szene vormultipliziert auf Schwarz, unten ihre Deckkraft (Weiß = undurchsichtig) */
  alpha?: boolean;
}

/* Hell: die Nachtszene liegt auf einer runden, dunkelblauen Fläche (Seitenblau), die mit der Verwandlung
   ausblendet; die Radix wechselt dabei von den dunklen auf die hellen Live-Farben */
const NACHTBLAU = '#07102a';
const hellAnteil = (t: number) => rampe(verwandlung(t), 0.55, 0.95);

/* Reines Schwarz und Weiß: Die Seite rechnet den Grund wieder heraus, dann liegt nur das Licht über ihr */
const GRUND: Record<Fassung, string> = { dunkel: '#000000', hell: '#ffffff' };

/* Je Körper: Drehung in Grad pro Sekunde, Startlänge, Neigung der Achse zum Betrachter */
const DREHUNG: Partial<Record<KoerperId, [number, number, number]>> = {
  erde: [10, 20, 18], mond: [0, 0, 6], merkur: [8, 0, 0], venus: [3, 0, 0], mars: [9, 40, 15],
  jupiter: [16, 0, 5], saturn: [14, 0, 10], uranus: [6, 0, 50], neptun: [7, 0, 20], pluto: [4, 0, 0], sonne: [2, 0, 6],
};

/* Zustand der Szene in einem Bild. Die Drehwege der Verwandlung werden ab ihrem Beginn nachgerechnet,
   so ist jedes Bild unabhängig von der Reihenfolge, in der gerendert wird. */
function szenenStand(bild: number): { l: Layout; l0: Layout } {
  const t = bild / FPS;
  const tau = modellzeit(bild), asc = aszendentImFilm(t);
  const l0 = layout(tau, 0, asc);
  const p = verwandlung(t);
  if (p <= 0 || p >= 1) return { l: p <= 0 ? l0 : layout(tau, 1, asc), l0 };
  const wege: Richtungen = new Map();
  const ab = Math.floor(VERWANDLUNG_AB * FPS);
  for (let b = ab; b < bild; b++) layout(modellzeit(b), verwandlung(b / FPS), aszendentImFilm(b / FPS), wege);
  return { l: layout(tau, p, asc, wege), l0 };
}

/* Sonne aufs Bild der 3D-Kamera, für die Zeit, bevor das Sonnensystem steht */
function sonneImBild(k: Kamera): [number, number] | null {
  const vx = SONNE[0] - k.ox, vy = SONNE[1] - k.oy, vz = SONNE[2] - k.oz;
  const tz = vx * k.fx + vy * k.fy + vz * k.fz;
  if (tz <= 0) return null;
  const f = BREITE * 1.2;
  return [MITTE + (f * (vx * k.rx + vy * k.ry + vz * k.rz)) / tz, MITTE - (f * (vx * k.ux + vy * k.uy + vz * k.uz)) / tz];
}

export const KosmosFlug: React.FC<KosmosFlugProps> = ({ fassung, sprache, alpha = false, dichte = 1 }) => {
  const frame = useCurrentFrame();
  const hostD = useRef<HTMLDivElement>(null), hostH = useRef<HTMLDivElement>(null);
  const hostDA = useRef<HTMLDivElement>(null), hostHA = useRef<HTMLDivElement>(null);
  const raum = useRef<HTMLCanvasElement>(null);
  const koerper = useRef<HTMLCanvasElement>(null);
  const raumA = useRef<HTMLCanvasElement>(null), koerperA = useRef<HTMLCanvasElement>(null);
  const nacht = useRef<HTMLDivElement>(null), nachtA = useRef<HTMLDivElement>(null);
  type Rad = { host: HTMLDivElement; szene: Szene; bahnen: SVGElement[]; dick: number };
  const welt = useRef<{ raeder: Rad[]; weltraum: Weltraum; tex: Texturen } | null>(null);
  const [warten] = useState(() => delayRender('Weltraum, Texturen und Schriften', { timeoutInMilliseconds: 120000 }));
  const [bereit, setBereit] = useState(false);
  const hell = fassung === 'hell';

  useLayoutEffect(() => {
    /* Radix-Szenen: dunkel immer, hell nur in der hellen Fassung; jede auch als Silhouette für die Deckkraft */
    const baue = (host: HTMLDivElement | null, nr: number, dick: number): Rad | null => {
      if (!host) return null;
      const szene = baueSzene(host, nr, sprache, { nurRadix: true });
      szene.setzeStrich(dick);
      // Die gezeichneten Kugeln und die Sonne der Szene ersetzen wir durch echte Oberflächen
      host.querySelectorAll<SVGElement>(`circle[fill^="url(#kx${nr}-p-"]`).forEach((c) => ((c.parentElement as unknown as SVGElement).style.display = 'none'));
      host.querySelectorAll<SVGElement>(`circle[fill="url(#kx${nr}-hof)"], circle[fill="url(#kx${nr}-kern)"]`).forEach((c) => (c.style.display = 'none'));
      const bahnen = Array.from(host.querySelectorAll<SVGElement>(`ellipse[stroke="url(#kx${nr}-bahn)"]`));
      return { host, szene, bahnen, dick };
    };
    const raeder = [baue(hostD.current, 301, 1), baue(hostH.current, 302, 1.6), baue(hostDA.current, 303, 1), baue(hostHA.current, 304, 1.6)].filter(Boolean) as Rad[];
    Promise.all([
      baueWeltraum(raum.current!, staticFile, dichte),
      ladeTexturen(staticFile),
      document.fonts.load('29px "Noto Sans Symbols"', '☉☽☿♀♂♃♄♅♆♇'),
      document.fonts.load('29px "Noto Sans Symbols 2"', '♈♉♊♋♌♍♎♏♐♑♒♓'),
      document.fonts.load('16px "STIX Two Text"', 'WIDDER'),
      document.fonts.load('500 16px "STIX Two Text"', 'WIDDER'),
    ])
      .then(([weltraum, tex]) => {
        welt.current = { raeder, weltraum, tex };
        return document.fonts.ready;
      })
      .then(() => setBereit(true))
      .catch((e) => cancelRender(e));
  }, []);

  useLayoutEffect(() => {
    const w = welt.current;
    if (!w || !bereit) return;
    // Filmbild → Ablaufbild: ab dem Sonnensystem läuft der Ablauf in Zeitlupe
    const bild = ablaufBild(frame);
    const t = bild / FPS;
    // Poster-Ansicht im Sonnensystem: eigener Maßstab, Sonne links, flache Schrägsicht
    const P = posterGrad(t);
    const lnKurve = lnMassstab(t);
    // hell und dunkel: dieselbe Komposition
    const posterLn = POSTER_LN, posterSonneX = POSTER_SONNE_X;
    const ln = lnKurve + (posterLn - lnKurve) * P, S = Math.exp(ln);
    const { l, l0 } = szenenStand(bild);

    /* Kameramitte in Einheiten der Szene: erst die Sonne, dann gleitet die Erde in die Bildmitte und bleibt dort */
    // die Erde dort, wo sie gezeichnet ist (sie holt beim Anflug ihren Vorsprung auf das Modell auf)
    const [e0x, e0y] = drehe(l0.koerper.erde.x, l0.koerper.erde.y, l0.K, vorsprung('erde', t));
    const E0 = { x: e0x, y: e0y };
    let cx = 0, cy = 0;
    if (t >= VERWANDLUNG_AB) { cx = l.koerper.erde.x; cy = l.koerper.erde.y; }
    else if (t >= SCHWENK_AB) {
      const g = rampe(t, SCHWENK_AB, SCHWENK_BIS), S0 = Math.exp(lnMassstab(SCHWENK_AB));
      cx = E0.x - (E0.x * S0 * (1 - g)) / S;
      cy = E0.y - (E0.y * S0 * (1 - g)) / S;
    }
    if (P > 0) { const [px, py] = posterMitte(S, posterSonneX); cx += (px - cx) * P; cy += (py - cy) * P; }

    /* Weltraum: verblasst etwas, wenn die Radix steht, damit sie ruhig liest */
    // Kamera und Himmel rechnen in der Zeit des ersten Schnitts, der Film ist um FLUG_TEMPO gedehnt
    const k = kamera(ln, t / FLUG_TEMPO);
    w.weltraum.zeichne(k, t / FLUG_TEMPO);
    const raumDeck = 1 - 0.55 * rampe(t, VERWANDLUNG_AB + 1, VERWANDLUNG_AB + 6);
    raum.current!.style.opacity = raumDeck.toFixed(3);
    // Hell: dunkelblaue Fläche unter der Nachtszene, blendet mit der Verwandlung aus
    const blau = 0; // keine dunkle Fläche mehr: hell liegt der Film direkt auf Weiß
    if (nacht.current) nacht.current.style.opacity = blau.toFixed(3);
    if (nachtA.current) nachtA.current.style.opacity = blau.toFixed(3);

    /* Radix-Szene: Bahnen sind im Sonnensystem nur ein Hauch und werden erst mit der Verwandlung zu Ringen */
    const szeneDa = rampe(ln, -5.2, -2.6);
    // Umlaufbahnen nur beim Übergang in die Radix, dann deutlich
    const bahn = rampe(t, VERWANDLUNG_AB - 1.4, VERWANDLUNG_AB + 0.2);
    // hell: von Anfang an die helle Radix (Live-Farben), dunkel die dunkle
    const hA = hell ? 1 : 0;
    w.raeder.forEach((rad) => {
      const st = rad.host.style;
      // dunkle Räder (301, 303) weichen in der hellen Fassung den hellen (302, 304)
      const anteil = rad.dick === 1 ? 1 - hA : hA;
      st.visibility = szeneDa <= 0.001 || anteil <= 0.001 ? 'hidden' : '';
      st.opacity = anteil.toFixed(3);
      st.transform = `scale(${S}) translate(${(-cx * PX).toFixed(3)}px, ${(-cy * PX).toFixed(3)}px)`;
      // Linien wie live (--rx-dick), beim Zoomen auf dem Bild gleich fein
      rad.szene.setzeStrich(rad.dick / Math.max(1, S));
      rad.szene.zeichne(l);
      rad.bahnen.forEach((b) => (b.style.opacity = bahn.toFixed(3)));
    });

    /* Sonne und Planeten mit echten Oberflächen */
    const c = koerper.current!.getContext('2d')!;
    c.setTransform(dichte, 0, 0, dichte, 0, 0);
    c.clearRect(0, 0, BREITE, BREITE);
    // Hell: Licht der Sonne als Goldtinte, wie der Weltraum dahinter
    const licht = (f: () => void) => f();
    const bildpunktRoh = (x: number, y: number): [number, number] => [MITTE + (x - cx) * S * PX, MITTE + (y - cy) * S * PX];
    // Orte der Szene erst in die Poster-Geometrie, dann aufs Bild
    const abstand = POSTER_ABSTAND;
    const bildpunkt = (x: number, y: number): [number, number] => bildpunktRoh(...posterOrt(x, y, l.K, P, abstand));

    // Raumschiff: Sterne rasen an der Kamera vorbei, bis wir vor dem Sonnensystem abbremsen
    zeichneWarp(c, bild, hell); // hell: Streifen in gedecktem Gold

    // Umlaufbahnen: dauerhaft sichtbar, feine helle Ellipsen; beim Übergang in die Radix übernehmen deren Ringe
    const bahnDa = szeneDa * (1 - rampe(t, VERWANDLUNG_AB - 1.4, VERWANDLUNG_AB + 0.2));
    const bahnen = (von: number, bis: number) => {
      if (bahnDa > 0.003) PLANETEN.forEach((pl, i) => zeichneBahn(c, bildpunktRoh, l.ringe[i].rx, l.K, P, (hell ? 0.4 : 0.28) * bahnDa, 0.8, von, bis, hell ? '#6f7684' : '#8f96a6', abstand));
    };

    // Sonne: aus der Ferne ein Stern mit Reflex, nah eine leuchtende Kugel
    const so = l.koerper.sonne;
    const [sx, sy] = bildpunkt(so.x, so.y);
    // im Sonnensystem kleiner, damit sie die Planeten nicht erdrückt; nah an der Erde wieder in voller Größe
    const sonnenNormal = so.kugelR * S * PX * (0.5 + 0.5 * rampe(ln, 0.6, 2.4));
    // im Poster groß und am linken Rand angeschnitten
    const sonnenR = sonnenNormal + (POSTER_SONNE_R - sonnenNormal) * P;
    const fern = sonneImBild(k);
    const stern = rampe(ln, -15, -9);
    if (fern && szeneDa < 1) licht(() => zeichneSonnenlicht(c, fern[0], fern[1], 0.1 + 0.25 * rampe(ln, -10, -5) * (1 - rampe(ln, -5, -2.6)), stern * (1 - szeneDa), MITTE));
    const zeichneSonne = () => {
    if (szeneDa > 0 && so.kugelDeckkraft > 0.003) {
      zeichneKugel(c, w.tex, { id: 'sonne', x: sx, y: sy, r: sonnenR, drehung: t * DREHUNG.sonne![0], neigung: DREHUNG.sonne![2], deckkraft: szeneDa * so.kugelDeckkraft }, { x: 0, y: 0, z: 1 });
      // je größer die Erde im Bild, desto mehr tritt das Sonnenlicht zurück
      const blend = (1 - 0.65 * rampe(ln, 0.5, 2.6)) * (1 - verwandlung(t));
      // Sonne ruhiger, damit die Planeten daneben nicht untergehen
      licht(() => zeichneSonnenlicht(c, sx, sy, Math.min(1, 0.08 + 0.12 * Math.max(0, ln)), 0.45 * szeneDa * blend * so.kugelDeckkraft, MITTE));
    }
    };

    // Planeten, Erde und Mond, hinten (oben im Bild) zuerst
    const ids = (['merkur', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto', 'erde', 'mond'] as const)
      .map((id) => ({ id, kl: l.koerper[id] }))
      .sort((a, b) => posterOrt(a.kl.x, a.kl.y, l.K, P, abstand)[1] - posterOrt(b.kl.x, b.kl.y, l.K, P, abstand)[1]);
    // Leuchtspuren auf der Bahn, bis kurz vor der Verwandlung die echten Bahnlinien übernehmen
    // aus, bevor die Kamera auf die Erde zufliegt: sonst wüchse die Spur der Erde zum breiten Balken
    const spurDa = szeneDa * (1 - rampe(t, SCHWENK_AB - 1.2, SCHWENK_AB));
    const erdVorsprung = vorsprung('erde', t);
    // hinten (oberer Bahnbogen, weiter weg als die Sonne) und vorn getrennt sammeln
    const hinten: (() => void)[] = [], vorn: (() => void)[] = [];
    const erdeHinten = drehe(l.koerper.erde.x, l.koerper.erde.y, l.K, erdVorsprung)[1] < 0;
    for (const { id, kl } of ids) {
      if (kl.kugelDeckkraft <= 0.003) continue;
      // im Sonnensystem kreisen die Planeten sichtbar schneller; vor dem Schwenk zur Erde holen sie das Modell ein
      const [ox, oy] = id === 'mond' ? drehe(kl.x, kl.y, l.K, erdVorsprung) : drehe(kl.x, kl.y, l.K, vorsprung(id, t));
      const [x, y] = bildpunkt(ox, oy);
      if (x < -400 || x > BREITE + 400 || y < -400 || y > BREITE + 400) continue;
      // Licht kommt von der Sonne, im Bild von deren Ort aus
      const lx = sx - x, ly = sy - y, lh = Math.hypot(lx, ly) || 1;
      const licht: Licht = { x: lx / lh, y: ly / lh, z: 0.35 };
      const [v, start, nei] = DREHUNG[id]!;
      // Im Sonnensystem sind die Planeten maßstäblich nur wenige Bildpunkte groß: dort deutlich größer zeigen,
      // beim Heranfliegen an die Erde gleitet das auf die wahre Größe zurück
      const wahr = kl.kugelR * S * PX * (id === 'erde' || id === 'mond' ? 1.02 : 1);
      // Mindestgröße in Bildpunkten, damit man die Planeten erkennt, sobald das Sonnensystem in Sicht ist.
      // Nach oben begrenzt durch den Abstand der Bahnen (45 Einheiten, in der Schrägsicht gestaucht):
      // so bleibt jeder Planet auf seiner Bahn, nichts schiebt sich ineinander.
      // beim Anflug auf die Erde zurück auf die echte Größe, sonst stünden die übrigen Planeten riesig im Bild
      const mindest = (1.6 + 12 * rampe(ln, -4.2, -0.6)) * (0.7 + 0.3 * Math.min(1.6, kl.kugelR / 8)) * (1 - rampe(ln, 0.6, 2.4)) * (1 - rampe(t, SCHWENK_AB - 0.4, SCHWENK_AB + 1.6));
      // Bahnabstand in Richtung des Planeten: quer zur Blickrichtung voll, in die Tiefe um K gestaucht
      const richtung = Math.atan2(kl.y / Math.max(l.K, 1e-3), kl.x);
      const deckel = Math.max(0.9, 0.45 * 45 * S * PX * Math.hypot(Math.cos(richtung), l.K * Math.sin(richtung)));
      // im Poster: Größenverhältnisse grob wie in echt, gut erkennbar
      const r = Math.max(wahr, Math.min(mindest, deckel)) * (1 - P) + kl.kugelR * 1.6 * P;
      const zeichne = () => {
        if (id !== 'mond' && spurDa > 0.003) {
          const farbe = PLANETEN.find((p) => p.id === id)!.farbe;
          const laenge = 16 + 1.1 * zusatzTempo(id, t);
          zeichneSpur(c, bildpunkt, ox, oy, l.K, laenge, Math.min(3, Math.max(1.2, r * 0.6)), farbe, 0.85 * spurDa * kl.kugelDeckkraft, false);
        }
        zeichneKugel(c, w.tex, { id, x, y, r, drehung: start + t * v, neigung: nei, deckkraft: kl.kugelDeckkraft * szeneDa }, licht);
      };
      // der Mond gehört zur Seite der Erde
      ((id === 'mond' ? erdeHinten : oy < 0) ? hinten : vorn).push(zeichne);
    }

    // Reihenfolge der Tiefe: hintere Bahnbögen, hintere Planeten, Sonne, vordere Bahnbögen, vordere Planeten
    bahnen(0, Math.PI);
    hinten.forEach((f) => f());
    zeichneSonne();
    // vordere Bögen enden an der Sonnenkante, sie ziehen nicht als Streifen über die Scheibe
    c.save();
    if (szeneDa > 0 && so.kugelDeckkraft > 0.003) {
      c.beginPath(); c.rect(0, 0, BREITE, BREITE); c.arc(sx, sy, sonnenR + 1, 0, Math.PI * 2, true); c.clip('evenodd');
    }
    bahnen(Math.PI, Math.PI * 2);
    c.restore();
    vorn.forEach((f) => f());

    // im Poster: alles läuft am runden Rand weich aus, nichts endet an der Videokante
    posterRand(c, P);

    /* Deckkraft: Weltraum nach Helligkeit, Körper und Lichter nach ihrem Alphakanal (als Weiß) */
    if (alpha) {
      const ra = raumA.current!.getContext('2d')!;
      ra.setTransform(1, 0, 0, 1, 0, 0); // Bildpunkt für Bildpunkt kopieren
      ra.globalCompositeOperation = 'copy';
      ra.globalAlpha = raumDeck;
      ra.filter = 'grayscale(1) brightness(1.25)';
      ra.drawImage(raum.current!, 0, 0);
      ra.filter = 'none';
      ra.globalAlpha = 1;
      ra.globalCompositeOperation = 'source-over';
      const ka = koerperA.current!.getContext('2d')!;
      ka.setTransform(1, 0, 0, 1, 0, 0);
      ka.clearRect(0, 0, BREITE * dichte, BREITE * dichte);
      ka.filter = 'brightness(0) invert(1)';
      ka.drawImage(koerper.current!, 0, 0);
      ka.filter = 'none';
    }
  }, [frame, bereit]);

  useLayoutEffect(() => {
    if (bereit) continueRender(warten);
  }, [bereit]);

  const rad = 940 * PX;
  const platz = { left: MITTE - rad / 2, top: MITTE - rad / 2, width: rad, height: rad };
  const voll: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
  /* hell: das ganze Bild dunkelblau und voll deckend; die Seite schneidet es als Rechteck wie einen Film */
  const blauFlaeche = (farbe: string): React.CSSProperties => ({ ...voll, background: farbe, opacity: 0 });
  const silhouette: React.CSSProperties = { filter: 'brightness(0) invert(1)' };
  /* hell: Nachtszene auf das Rechteck RAHMEN_HELL beschnitten (derzeit das ganze Bild); die helle Radix nicht */
  const R = RAHMEN_HELL;
  void R;
  const film: React.CSSProperties = {};
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="flug-tinte-hell" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.1059 0.2082 0.0388 0 0 0.0824 0.1620 0.0302 0 0 0.0353 0.0694 0.0129 0 0 0 0 0 1 0" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 0, width: BREITE, height: BREITE * (alpha ? 2 : 1), transform: `scale(${dichte})`, transformOrigin: '0 0' }}>
      {/* Bild: Szene vormultipliziert auf Schwarz */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: BREITE, height: BREITE, overflow: 'hidden' }}>
        {hell && <div ref={nacht} style={{ ...blauFlaeche(NACHTBLAU), ...film }} />}
        {/* hell: Sterne als warme Tinte (Helligkeit × Farbe), auf der Seite über Weiß dunkel und zart */}
        <canvas ref={raum} width={BREITE * dichte} height={BREITE * dichte} style={{ ...voll, mixBlendMode: 'screen', ...film, ...(hell ? { filter: 'url(#flug-tinte-hell)' } : {}) }} />
        {/* Planeten über der Radix-Szene: Die Erde verdeckt ihre eigene Bahn; zu Zeichen werden sie ohnehin ausgeblendet */}
        <div className="flug-dunkel" style={{ ...voll, ...film }}><div ref={hostD} className="radix flug-szene" style={platz} /></div>
        {hell && <div className="flug-hell"><div ref={hostH} className="radix flug-szene" style={platz} /></div>}
        <canvas ref={koerper} width={BREITE * dichte} height={BREITE * dichte} style={{ ...voll, ...film }} />
      </div>
      {/* Deckkraft: dieselbe Szene als Weiß auf Schwarz */}
      {alpha && (
        <div style={{ position: 'absolute', left: 0, top: BREITE, width: BREITE, height: BREITE, overflow: 'hidden' }}>
          {hell && <div ref={nachtA} style={{ ...blauFlaeche('#ffffff'), ...film }} />}
          <canvas ref={raumA} width={BREITE * dichte} height={BREITE * dichte} style={{ ...voll, mixBlendMode: 'screen', ...film }} />
          <div className="flug-dunkel" style={{ ...voll, ...silhouette, ...film }}><div ref={hostDA} className="radix flug-szene" style={platz} /></div>
          {hell && <div className="flug-hell" style={silhouette}><div ref={hostHA} className="radix flug-szene" style={platz} /></div>}
          <canvas ref={koerperA} width={BREITE * dichte} height={BREITE * dichte} style={{ ...voll, ...film }} />
        </div>
      )}
      </div>
    </AbsoluteFill>
  );
};
