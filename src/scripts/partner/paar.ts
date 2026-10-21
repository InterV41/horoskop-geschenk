// Paar: zwei erfundene Geburtsbilder A und B und die Aspekte zwischen ihnen (Synastrie).
// Fasst das DOM nicht an, damit es sich prüfen lässt.
import { RADIX_REIHE, abst, norm, type RadixId } from '../kosmos/modell';

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

/* Wie in der Einzelradix, dazu die Konjunktion: zwischen zwei Menschen zählt sie besonders */
const ASPEKTE = [
  { deg: 0, orb: 8, hart: false },
  { deg: 60, orb: 5, hart: false },
  { deg: 90, orb: 8, hart: true },
  { deg: 120, orb: 8, hart: false },
  { deg: 180, orb: 8, hart: true },
];

export function synastrie(la: Record<RadixId, number>, lb: Record<RadixId, number>): SynAspekt[] {
  const aus: SynAspekt[] = [];
  for (const { id: a } of RADIX_REIHE)
    for (const { id: b } of RADIX_REIHE) {
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

/* Zeichen im selben Ring auseinanderschieben, damit sie sich nicht überdecken.
   Nur die Anzeige wandert, höchstens 6° vom echten Grad. */
const MAX_VERSATZ = 6;
export function entzerre(winkel: number[], mindest = 7): number[] {
  const n = winkel.length;
  if (n < 2) return [...winkel];
  const reihe = winkel.map((w, i) => ({ i, w: norm(w) })).sort((x, y) => x.w - y.w);
  // ungewickelt arbeiten: Versätze statt Winkel, so gibt es keinen Sprung bei 0°
  const versatz = new Array(n).fill(0);
  for (let runde = 0; runde < 60; runde++) {
    let bewegt = false;
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const wk = reihe[k].w + versatz[k];
      let wj = reihe[j].w + versatz[j];
      if (j === 0) wj += 360;
      const luecke = wj - wk;
      if (luecke < mindest) {
        const schub = (mindest - luecke) / 2 + 1e-4;
        versatz[k] = Math.max(-MAX_VERSATZ, versatz[k] - schub);
        versatz[j] = Math.min(MAX_VERSATZ, versatz[j] + schub);
        bewegt = true;
      }
    }
    if (!bewegt) break;
  }
  const aus = new Array(n);
  reihe.forEach((r, k) => (aus[r.i] = versatz[k] === 0 ? winkel[r.i] : norm(r.w + versatz[k])));
  return aus;
}
