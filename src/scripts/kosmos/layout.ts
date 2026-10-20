// Layout eines Bildes: aus Modellzeit, Verwandlungsgrad und Aszendent werden alle Bildwerte.
// Fasst das DOM nicht an, damit es sich prüfen lässt.
import { EINSTIEG, teil } from './zeitplan';
import { PLANETEN, MOND, RADIX_REIHE, laengen, sonnenWinkel, mondWinkel, aspekte as findeAspekte, norm, type RadixId, type PlanetId } from './modell';

/* Maße wie im Radix-Rad der PDFs */
export const R = { out: 418, band: 370, ring: 332, asp: 212, hub: 92 };
export const SPUR = 292; // feste Bahn der Planetenzeichen
export const ASC0 = 160;
export const ASC_V = 1; // Grad pro Sekunde
export const K_SCHRAEG = 0.42; // Neigung der Bahnen im Sonnensystem

/* Teilfenster der Verwandlung in p */
const F = {
  aufrichten: [0, 0.6],
  wandern: [0, 0.7],
  zeichen: [0.3, 0.8],
  sonne: [0, 0.7],
  erde: [0, 0.6],
  erdKugel: [0.3, 0.6],
  ringe: [0.4, 1],
  radix: [0.6, 1],
  aspekte: [0.85, 1],
} as const;
const SONNE_R = 26, SONNENHOF_R = 160;

/* Zielringe der Bahnen, in PLANETEN-Reihenfolge: Radius, Strich, Deckkraft */
const ZIELRINGE: Record<PlanetId, [number, number, number]> = {
  merkur: [40, 0.5, 0],
  venus: [50, 0.5, 0],
  erde: [R.hub - 26, 0.5, 1],
  mars: [R.hub, 0.9, 1],
  jupiter: [R.asp, 0.6, 1],
  saturn: [R.ring, 0.6, 1],
  uranus: [R.band, 0.85, 1],
  neptun: [R.out - 7, 0.45, 1],
  pluto: [R.out, 1.1, 1],
};
const BAHN_STRICH = 1.1, BAHN_DECKKRAFT = 0.85; // fein, vorne klar; nach hinten blendet die Szene aus

export interface KoerperLayout { x: number; y: number; kugelR: number; kugelDeckkraft: number; zeichenDeckkraft: number; punktX: number; punktY: number; hinten: boolean }
export interface RingLayout { rx: number; ry: number; breite: number; deckkraft: number }
export interface AspektLayout { a: RadixId; b: RadixId; x1: number; y1: number; x2: number; y2: number; breite: number; hart: boolean; deckkraft: number }
export interface Layout {
  K: number;
  koerper: Record<RadixId | 'erde', KoerperLayout>;
  ringe: RingLayout[];
  aspekte: AspektLayout[];
  radix: number;
  tierkreisDrehung: number;
  zeichen: { x: number; y: number }[];
  namenOben: number[];
  sonnenHof: { r: number; deckkraft: number };
  nebel: number;
}

export function pt(r: number, a: number): [number, number] {
  a = (a * Math.PI) / 180;
  return [Math.cos(a) * r, -Math.sin(a) * r];
}

export function mixWinkel(a: number, b: number, q: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return norm(a + d * q);
}

/* Eine Strecke an einem Kreis um die Mitte kürzen: Was im Kreis liegt, fällt weg.
   Ersetzt eine Maske, die der Browser sonst bei jedem Bild neu anwenden müsste. */
export function zerlegeAmKreis(x1: number, y1: number, x2: number, y2: number, r: number): [number, number, number, number][] {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t0 = len2 > 0 ? -(x1 * dx + y1 * dy) / len2 : 0; // nächster Punkt zur Mitte
  const nx = x1 + dx * t0, ny = y1 + dy * t0, d2 = nx * nx + ny * ny;
  if (d2 >= r * r || t0 <= 0 || t0 >= 1) return [[x1, y1, x2, y2]];
  const h = Math.sqrt((r * r - d2) / len2), ta = t0 - h, tb = t0 + h;
  return [
    [x1, y1, x1 + dx * ta, y1 + dy * ta],
    [x1 + dx * tb, y1 + dy * tb, x2, y2],
  ];
}

export function aszendent(t: number): number {
  return ASC0 + ASC_V * (t + EINSTIEG);
}

const mix = (a: number, b: number, q: number) => a + (b - a) * q;
const klemm = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const fenster = (p: number, f: readonly [number, number]) => teil(p, f[0], f[1]);

/* Während einer Verwandlung merkt sich jeder Körper seinen Drehweg (vorzeichenbehaftet, Grad).
   Start- und Zielwinkel wandern mit; ohne Gedächtnis könnte der kürzere Weg mittendrin
   die Seite wechseln und der Planet über das Bild springen. Die Bildschleife hält eine Map. */
export type Richtungen = Map<string, number>;

/* Polar um die Bildmitte mischen: Bahnen auf Bögen statt quer durch die Mitte.
   Hat ein Ende Radius 0, gilt der Winkel des anderen Endes. */
function mischePolar(r0: number, w0: number, r1: number, w1: number, q: number, weg?: { r: Richtungen; id: string }): [number, number] {
  const a = r0 < 1e-6 ? w1 : w0, b = r1 < 1e-6 ? w0 : w1;
  let d = ((b - a + 540) % 360) - 180;
  if (weg) {
    const alt = weg.r.get(weg.id);
    if (alt !== undefined) d += 360 * Math.round((alt - d) / 360); // dem bisherigen Weg stetig folgen
    weg.r.set(weg.id, d);
  }
  return [mix(r0, r1, q), norm(a + d * q)];
}

/* Bildpunkt (ungekippt) in Polarkoordinaten */
function polar(x: number, y: number): [number, number] {
  return [Math.hypot(x, y), norm((Math.atan2(-y, x) * 180) / Math.PI)];
}

export function layout(tau: number, p: number, asc: number, richtungen?: Richtungen): Layout {
  const rot = 180 - asc;
  if (richtungen && (p <= 0 || p >= 1)) richtungen.clear(); // außerhalb der Verwandlung neu wählen
  const unterwegs = richtungen && p > 0 && p < 1 ? richtungen : undefined;
  const scr = (lon: number) => norm(lon + rot);

  const aufrichten = fenster(p, F.aufrichten);
  const K = K_SCHRAEG + (1 - K_SCHRAEG) * aufrichten;
  const wandern = fenster(p, F.wandern);
  const kz = fenster(p, F.zeichen);
  const sonne = fenster(p, F.sonne);
  const l = laengen(tau);

  /* Startpunkte im Sonnensystem, ungekippt, als [Radius, Winkel]. Das Sonnensystem dreht sich nicht
     mit dem Tierkreis mit: sonst liefen die langsamen äußeren Planeten scheinbar rückwärts. */
  const start = {} as Record<RadixId | 'erde', [number, number]>;
  for (const pl of PLANETEN) start[pl.id] = [pl.bildRadius, sonnenWinkel(pl.id, tau)];
  start.sonne = [0, 0];
  const erdPunkt = pt(...start.erde), mondVersatz = pt(MOND.bildRadius, mondWinkel(tau));
  start.mond = polar(erdPunkt[0] + mondVersatz[0], erdPunkt[1] + mondVersatz[1]);

  const koerper = {} as Record<RadixId | 'erde', KoerperLayout>;
  const setze = (id: RadixId | 'erde', r1: number, w1: number, q: number, groesse: number, kugelDeckkraft: number, zeichenDeckkraft: number) => {
    const [r0, w0] = start[id];
    const [r, w] = mischePolar(r0, w0, r1, w1, q, unterwegs && { r: unterwegs, id });
    const [x, y] = pt(r, w);
    const tiefe = r0 > 0 ? Math.sin((w0 * Math.PI) / 180) : 0; // oben = hinten
    const massstab = 1 - 0.18 * ((tiefe + 1) / 2) * (1 - aufrichten);
    const [px, py] = pt(R.asp + 2, w1);
    koerper[id] = {
      x, y: y * K,
      kugelR: groesse * massstab, kugelDeckkraft, zeichenDeckkraft,
      punktX: px, punktY: py,
      hinten: tiefe > 0 && p < 0.6,
    };
  };

  const groesse = new Map(PLANETEN.map((pl) => [pl.id as string, pl.groesse]));
  for (const { id } of RADIX_REIHE) {
    if (id === 'sonne') setze(id, SPUR, scr(l.sonne), wandern, SONNE_R * (1 - sonne), 1 - kz, kz);
    else if (id === 'mond') setze(id, SPUR, scr(l.mond), wandern, MOND.groesse, 1 - kz, kz);
    else setze(id, SPUR, scr(l[id]), wandern, groesse.get(id)!, 1 - kz, kz);
  }
  setze('erde', 0, 0, fenster(p, F.erde), groesse.get('erde')!, 1 - fenster(p, F.erdKugel), 0);

  /* Bahnen werden zu Ringen */
  const qr = fenster(p, F.ringe);
  const ringe = PLANETEN.map((pl) => {
    const [zr, zb, zd] = ZIELRINGE[pl.id];
    const rx = mix(pl.bildRadius, zr, qr);
    return { rx, ry: rx * K, breite: mix(BAHN_STRICH, zb, qr), deckkraft: mix(BAHN_DECKKRAFT, zd, qr) };
  });

  /* Aspekte: immer alle 45 Paare, ohne Aspekt unsichtbar */
  const gefunden = new Map(findeAspekte(l).map((a) => [a.a + '|' + a.b, a]));
  const qa = fenster(p, F.aspekte);
  const aspekte: AspektLayout[] = [];
  for (let i = 0; i < RADIX_REIHE.length; i++)
    for (let j = i + 1; j < RADIX_REIHE.length; j++) {
      const a = RADIX_REIHE[i].id, b = RADIX_REIHE[j].id, g = gefunden.get(a + '|' + b);
      const [x1, y1] = pt(R.asp, scr(l[a])), [x2, y2] = pt(R.asp, scr(l[b]));
      aspekte.push({
        a, b, x1, y1, x2, y2,
        breite: g ? 0.55 + 0.55 * g.staerke : 0.55,
        hart: g ? g.hart : false,
        deckkraft: g ? klemm(g.staerke * 2.5) * qa : 0,
      });
    }

  /* Tierkreis wie in der bisherigen Radix */
  const zeichen = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = pt(R.band - 25, scr(i * 30 + 15));
    return { x, y };
  });
  const namenOben = Array.from({ length: 12 }, (_, i) => klemm(0.5 + Math.sin((scr(i * 30 + 15) * Math.PI) / 180) * 14));

  return {
    K, koerper, ringe, aspekte,
    radix: fenster(p, F.radix),
    tierkreisDrehung: -rot,
    zeichen, namenOben,
    sonnenHof: { r: SONNENHOF_R * (1 - sonne), deckkraft: 1 - sonne },
    nebel: 1 - 0.75 * p,
  };
}
