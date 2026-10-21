// Paar: zwei erfundene Geburtsbilder A und B und die Aspekte zwischen ihnen (Synastrie).
// Fasst das DOM nicht an, damit es sich prüfen lässt.
import { RADIX_REIHE, abst, type RadixId } from '../kosmos/modell';

/* Modellzeit, bei der A und B beginnen. Erfunden, so gewählt, dass zwischen beiden
   weiche und harte Aspekte deutlich zu sehen sind. */
export const TAU_A = 0.37;
export const TAU_B = 2.81;
/* Aszendent von B gegenüber A, Grad */
export const ASC_VERSATZ_B = 95;

export interface SynAspekt {
  a: RadixId; // Planet von A
  b: RadixId; // Planet von B
  staerke: number;
  hart: boolean;
}

/* Wie in der Einzelradix, dazu die Konjunktion: zwischen zwei Menschen zählt sie besonders.
   Orbs enger als in der Einzelradix, wie in der Synastrie üblich. */
const ASPEKTE = [
  { deg: 0, orb: 6, hart: false },
  { deg: 60, orb: 4, hart: false },
  { deg: 90, orb: 5, hart: true },
  { deg: 120, orb: 5, hart: false },
  { deg: 180, orb: 6, hart: true },
];
/* Uranus, Neptun und Pluto stehen bei Gleichaltrigen fast gleich: Kontakte untereinander sagen nichts über das Paar */
const GENERATION = new Set<RadixId>(['uranus', 'neptun', 'pluto']);

export function synastrie(la: Record<RadixId, number>, lb: Record<RadixId, number>): SynAspekt[] {
  const aus: SynAspekt[] = [];
  for (const { id: a } of RADIX_REIHE)
    for (const { id: b } of RADIX_REIHE) {
      if (GENERATION.has(a) && GENERATION.has(b)) continue;
      const d = abst(la[a], lb[b]);
      let best: (typeof ASPEKTE)[number] | null = null, s = 0;
      for (const as of ASPEKTE) {
        const v = 1 - Math.abs(d - as.deg) / as.orb;
        if (v > s) { s = v; best = as; }
      }
      if (best) aus.push({ a, b, staerke: s, hart: best.hart });
    }
  return aus;
}

/* Zeichen im selben Ring, die sich überdecken würden, nach innen und außen staffeln.
   Seitliches Schieben springt, sobald zwei Planeten aneinander vorbeiziehen; der Versatz
   nach innen und außen hängt stetig vom Abstand ab. Der Planet mit der kleineren Nummer geht
   nach innen. Ergebnis: Radiusversatz je Planet in Radix-Einheiten. */
export function radialVersatz(winkel: number[], r: number, groesse = 28): number[] {
  const aus = new Array(winkel.length).fill(0);
  for (let i = 0; i < winkel.length; i++)
    for (let j = i + 1; j < winkel.length; j++) {
      const s = Math.sin((abst(winkel[i], winkel[j]) * Math.PI) / 360);
      // Abstand der Punkte auf r - o und r + o: 4o² + (r² - o²) · 4s² ≥ groesse²
      const noetig = groesse * groesse - 4 * r * r * s * s;
      if (noetig <= 0) continue;
      const o = Math.sqrt(noetig / (4 * (1 - s * s)));
      aus[i] -= o;
      aus[j] += o;
    }
  return aus;
}
