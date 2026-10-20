// Planetenmodell: ein Sonnensystem, aus dem die Radix berechnet wird. Erfundene Konstellation.

/* Umlaufzeiten werden gestaucht, damit auch die äußeren Planeten sichtbar wandern */
export const EXPONENT = 0.6;

export type PlanetId = 'merkur' | 'venus' | 'erde' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptun' | 'pluto';
export type RadixId = 'sonne' | 'mond' | 'merkur' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptun' | 'pluto';

export interface Planet {
  id: PlanetId;
  P: number; // Umlaufzeit in Jahren
  start: number; // Startwinkel um die Sonne, Grad
  bildRadius: number; // Bahn im Bild des Sonnensystems
  groesse: number; // Radius der Kugel im Bild
  farbe: string;
  ring?: boolean;
}

export const PLANETEN: readonly Planet[] = [
  { id: 'merkur', P: 0.2408, start: 40, bildRadius: 70, groesse: 5.4, farbe: '#b9b2a2' },
  { id: 'venus', P: 0.6152, start: 150, bildRadius: 115, groesse: 8, farbe: '#e6cf9a' },
  { id: 'erde', P: 1, start: 270, bildRadius: 160, groesse: 8.5, farbe: '#6f93c4' },
  { id: 'mars', P: 1.8808, start: 20, bildRadius: 205, groesse: 6.7, farbe: '#c27650' },
  { id: 'jupiter', P: 11.862, start: 105, bildRadius: 250, groesse: 16.5, farbe: '#d6b98c' },
  { id: 'saturn', P: 29.457, start: 292, bildRadius: 295, groesse: 11, farbe: '#e0cc98', ring: true },
  { id: 'uranus', P: 84.01, start: 280, bildRadius: 340, groesse: 10.3, farbe: '#9cc9cc' },
  { id: 'neptun', P: 164.8, start: 283, bildRadius: 385, groesse: 9.9, farbe: '#5d7ec4' },
  { id: 'pluto', P: 248, start: 226, bildRadius: 430, groesse: 3.6, farbe: '#a89c8a' },
];

/* Mond: 5 Umläufe pro Erdumlauf, wie das Tempoverhältnis in der Radix, nicht astronomisch */
export const MOND = { start: 0, umlaeufe: 5, bildRadius: 18, groesse: 2.5 };

const VS = '︎'; // Textdarstellung statt Emoji
export const RADIX_REIHE: readonly { id: RadixId; glyph: string; gross?: boolean }[] = [
  { id: 'sonne', glyph: '☉' + VS, gross: true },
  { id: 'mond', glyph: '☽' + VS, gross: true },
  { id: 'merkur', glyph: '☿' + VS },
  { id: 'venus', glyph: '♀' + VS },
  { id: 'mars', glyph: '♂' + VS },
  { id: 'jupiter', glyph: '♃' + VS },
  { id: 'saturn', glyph: '♄' + VS },
  { id: 'uranus', glyph: '♅' + VS },
  { id: 'neptun', glyph: '♆' + VS },
  { id: 'pluto', glyph: '♇' + VS },
];

export const norm = (x: number) => ((x % 360) + 360) % 360;
export const abst = (x: number, y: number) => {
  const d = norm(x - y);
  return d > 180 ? 360 - d : d;
};

const NACH_ID = new Map(PLANETEN.map((p) => [p.id, p]));
const planet = (id: PlanetId) => NACH_ID.get(id)!;

/* Winkel um die Sonne, Grad; tau in Erdumläufen */
export function sonnenWinkel(id: PlanetId, tau: number): number {
  const p = planet(id);
  return norm(p.start + 360 * Math.pow(1 / p.P, EXPONENT) * tau);
}

export function mondWinkel(tau: number): number {
  return norm(MOND.start + 360 * MOND.umlaeufe * tau);
}

/* Abstand für die Blickrichtung, nach Kepler aus der gestauchten Umlaufzeit.
   Echte Abstände mit gestauchten Zeiten würden die Rückläufigkeit verhindern. */
export function rechenAbstand(id: PlanetId): number {
  return Math.pow(planet(id).P, (EXPONENT * 2) / 3);
}

function ort(id: PlanetId, tau: number): [number, number] {
  const a = rechenAbstand(id), w = (sonnenWinkel(id, tau) * Math.PI) / 180;
  return [a * Math.cos(w), a * Math.sin(w)];
}

/* Länge im Tierkreis, von der Erde aus gesehen */
export function laengen(tau: number): Record<RadixId, number> {
  const [ex, ey] = ort('erde', tau);
  const l = { sonne: norm(sonnenWinkel('erde', tau) + 180), mond: mondWinkel(tau) } as Record<RadixId, number>;
  for (const p of PLANETEN) {
    if (p.id === 'erde') continue;
    const [x, y] = ort(p.id, tau);
    l[p.id] = norm((Math.atan2(y - ey, x - ex) * 180) / Math.PI);
  }
  return l;
}

export interface Aspekt {
  a: RadixId;
  b: RadixId;
  staerke: number;
  hart: boolean;
}

/* Aspekte: weich durchgezogen, spannungsreich gestrichelt, je genauer desto kräftiger */
const ASPEKTE = [
  { deg: 60, orb: 5, hart: false },
  { deg: 90, orb: 8, hart: true },
  { deg: 120, orb: 8, hart: false },
  { deg: 180, orb: 8, hart: true },
];

export function aspekte(l: Record<RadixId, number>): Aspekt[] {
  const aus: Aspekt[] = [];
  for (let i = 0; i < RADIX_REIHE.length; i++)
    for (let j = i + 1; j < RADIX_REIHE.length; j++) {
      const a = RADIX_REIHE[i].id, b = RADIX_REIHE[j].id, d = abst(l[a], l[b]);
      let best: (typeof ASPEKTE)[number] | null = null, s = 0;
      for (const as of ASPEKTE) {
        const v = 1 - Math.abs(d - as.deg) / as.orb;
        if (v > s) { s = v; best = as; }
      }
      if (best) aus.push({ a, b, staerke: s, hart: best.hart });
    }
  return aus;
}
