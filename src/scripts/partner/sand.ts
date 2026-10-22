// Sand: Körner, die sich von den Radixen A und B lösen und unten die Doppelradix bilden.
// Rein rechnend, ohne DOM. Jedes Bild hängt nur vom Fortschritt s und der Lage der Räder ab.
import { R, SPUR, CUSPS, pt } from '../kosmos/layout';
import { glatt } from '../kosmos/zeitplan';
import { LANDEN_AB } from './fortschritt';

/* Spuren der Doppelradix: A innen, B außen, dazwischen ein feiner Kreis */
export const SPUR_INNEN = 250;
export const SPUR_AUSSEN = 306;
export const R_TRENN = 278;

/* Zeitfenster in s */
const LOS_ENDE = 0.25; // bis hier hat sich jedes Korn gelöst: früh, solange die Räder noch im Bild sind
const LAND_BEGINN = LANDEN_AB, LAND_ENDE = 0.75;
/* Die Doppelradix entsteht aus Sand: gelandete Körner bleiben liegen. Ab ZEICHNUNG zieht sich die
   scharfe Zeichnung Ring für Ring nach, ab SAND_AUS verblasst der Sand darunter. */
const ZEICHNUNG = 0.78, ZEICHNUNG_VOLL = 0.98, SAND_AUS = 0.85;
const STREU_LOS = 0.05, STREU_LAND = 0.05;

export interface Korn {
  von: 'A' | 'B';
  /* Radius in Radix-Einheiten, Winkel als Tierkreisgrad; bei *Rel ab dem Aszendenten (Häuserlinien stehen fest) */
  startR: number;
  startW: number;
  startRel: boolean;
  zielR: number;
  zielW: number;
  zielRel: boolean;
  streu: number; // -1..1, verschiebt den Ablösezeitpunkt
  an: number; // Landezeit
  wind: number; // -1..1, Seitwärtsdrift
  groesse: number; // Pixel
  deckkraft: number;
  zitter: number; // Phase des Zitterns
}

export interface Rad {
  cx: number;
  cy: number;
  massstab: number; // Pixel je Radix-Einheit (Hostbreite / 940)
  asc: number;
}
export interface Geometrie {
  a: Rad;
  b: Rad;
  doppel: Rad;
}

/* Teile eines Rads, auf denen Körner liegen, mit Gewicht nach sichtbarer Länge */
interface Teil {
  gewicht: number;
  punkt(z: () => number): [number, number, boolean]; // Radius, Winkel, relativ
}
const kreis = (r: number): Teil => ({ gewicht: 2 * Math.PI * r, punkt: (z) => [r, z() * 360, false] });
const strahl = (r0: number, r1: number, w: number, rel: boolean): Teil => ({ gewicht: r1 - r0, punkt: (z) => [r0 + z() * (r1 - r0), w, rel] });
/* Wolke um ein Zeichen: dichter in der Mitte */
const wolke = (r: number, w: number, gewicht: number, streu = 12): Teil => ({
  gewicht,
  punkt: (z) => {
    const d = (z() + z() - 1) * streu, q = (z() + z() - 1) * streu;
    return [r + d, w + (q / r) * (180 / Math.PI), false];
  },
});

const zeichenGrenzen = () => Array.from({ length: 12 }, (_, i) => strahl(R.ring, R.out, i * 30, false));
const zeichenWolken = () => Array.from({ length: 12 }, (_, i) => wolke(R.band - 25, i * 30 + 15, 60));
const haeuser = () => CUSPS.map((c) => strahl(R.hub, R.ring, c, true));

function einzelRad(planeten: number[]): Teil[] {
  return [
    ...[R.out, R.band, R.ring, R.asp, R.hub, R.hub - 26].map(kreis),
    ...zeichenGrenzen(), ...zeichenWolken(), ...haeuser(),
    ...planeten.map((w) => wolke(SPUR, w, 110)),
  ];
}
/* In der Doppelradix: A füllt das Innere, B den Tierkreis und den äußeren Ring */
const zielA = (planeten: number[]): Teil[] => [
  ...[R.hub, R.hub - 26, R.asp, R_TRENN].map(kreis), ...haeuser(), ...planeten.map((w) => wolke(SPUR_INNEN, w, 110, 10)),
];
const zielB = (planeten: number[]): Teil[] => [
  ...[R.ring, R.band, R.out].map(kreis), ...zeichenGrenzen(), ...zeichenWolken(), ...planeten.map((w) => wolke(SPUR_AUSSEN, w, 110, 10)),
];

function waehle(teile: Teil[], z: () => number): Teil {
  const summe = teile.reduce((a, t) => a + t.gewicht, 0);
  let x = z() * summe;
  for (const t of teile) if ((x -= t.gewicht) <= 0) return t;
  return teile[teile.length - 1];
}

export function erzeugeKoerner(n: number, saat: number, planetenA: number[], planetenB: number[]): Korn[] {
  let st = saat % 2147483647 || 1;
  const z = () => (st = (st * 16807) % 2147483647) / 2147483647;
  const quellen = { A: einzelRad(planetenA), B: einzelRad(planetenB) };
  const ziele = { A: zielA(planetenA), B: zielB(planetenB) };
  const aus: Korn[] = [];
  for (let i = 0; i < n; i++) {
    const von = i % 2 === 0 ? 'A' : 'B';
    const [startR, startW, startRel] = waehle(quellen[von], z).punkt(z);
    const [zielR, zielW, zielRel] = waehle(ziele[von], z).punkt(z);
    // außen früher landen: der Aufbau wandert wie die Maske von außen nach innen
    const an = LAND_BEGINN + (LAND_ENDE - LAND_BEGINN) * (1 - zielR / R.out) + (z() * 2 - 1) * STREU_LAND;
    aus.push({
      von, startR, startW, startRel, zielR, zielW, zielRel,
      streu: z() * 2 - 1,
      an: Math.min(LAND_ENDE, Math.max(LAND_BEGINN + 0.02, an)),
      wind: z() * 2 - 1,
      groesse: 0.6 + z() * 0.6, // feiner Sand, aber sichtbar
      deckkraft: 0.6 + z() * 0.4,
      zitter: z() * Math.PI * 2,
    });
  }
  return aus;
}

/* Bildpunkt eines Radix-Punkts in Seitenpixeln */
function bild(rad: Rad, r: number, w: number, rel: boolean, aus: { x: number; y: number }) {
  const [x, y] = pt(r, rel ? 180 + w : 180 - rad.asc + w);
  aus.x = rad.cx + x * rad.massstab;
  aus.y = rad.cy + y * rad.massstab;
}

const p0 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };

/* Ablösezeit: wie die Maske von oben nach unten, mit etwas Streuung */
export function losZeit(k: Korn, g: Geometrie): number {
  const rad = k.von === 'A' ? g.a : g.b;
  bild(rad, k.startR, k.startW, k.startRel, p0);
  const h = ((p0.y - rad.cy) / (R.out * rad.massstab) + 1) / 2; // 0 oben, 1 unten
  return Math.min(LOS_ENDE, Math.max(0, h * LOS_ENDE + k.streu * STREU_LOS));
}

export function kornOrt(k: Korn, s: number, g: Geometrie, aus: { x: number; y: number; o: number }): void {
  const rad = k.von === 'A' ? g.a : g.b;
  bild(rad, k.startR, k.startW, k.startRel, p0);
  bild(g.doppel, k.zielR, k.zielW, k.zielRel, p2);
  const los = losZeit(k, g);
  const q = glatt((s - los) / (k.an - los));
  // Bogen: Wind schiebt seitlich, der Sand hängt etwas durch
  const mx = (p0.x + p2.x) / 2 + k.wind * 120, my = (p0.y + p2.y) / 2 + 80;
  const u = 1 - q;
  const zitter = Math.sin(q * Math.PI) * Math.sin(q * 9 + k.zitter) * 3;
  aus.x = u * u * p0.x + 2 * u * q * mx + q * q * p2.x + zitter;
  aus.y = u * u * p0.y + 2 * u * q * my + q * q * p2.y;
  const rein = Math.min(1, Math.max(0, (s - los) / 0.03));
  const raus = Math.min(1, Math.max(0, (s - SAND_AUS) / (1 - SAND_AUS)));
  aus.o = k.deckkraft * rein * (1 - raus);
}

/* Wie weit die Zerfallskante von oben nach unten über A und B gewandert ist */
export function maskeRad(s: number): number {
  return Math.min(1, Math.max(0, s / LOS_ENDE));
}

/* Wie weit sich die scharfe Doppelradix nachgezogen hat: erst wenn aller Sand liegt */
export function maskeDoppel(s: number): number {
  return Math.min(1, Math.max(0, (s - ZEICHNUNG) / (ZEICHNUNG_VOLL - ZEICHNUNG)));
}
