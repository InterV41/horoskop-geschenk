// Weg eines Sandkorns im Video: Es löst sich von Clara oder Jonas, sackt kurz ab wie Sand und strömt dann
// in einem sanften Wirbel um die Mitte auf seinen Platz in der Doppelradix. Rein rechnend, ohne DOM.
// Start, Ziel und Zeitfenster kommen aus derselben Sand-Rechnung wie auf der Seite.
import { pt } from '../../src/scripts/kosmos/layout';
import { glatt } from '../../src/scripts/kosmos/zeitplan';
import { losZeit, type Korn, type Geometrie, type Rad } from '../../src/scripts/partner/sand';

const SAND_AUS = 0.85; // wie auf der Seite: danach übernimmt die scharfe Zeichnung
const WIRBEL_MIN = Math.PI * 0.6; // jedes Korn dreht sich mindestens so weit um die Mitte, alle im Uhrzeigersinn
const FALL = 70; // Pixel, die ein frisch gelöstes Korn zuerst absackt

function bild(rad: Rad, r: number, w: number, rel: boolean): [number, number] {
  const [x, y] = pt(r, rel ? 180 + w : 180 - rad.asc + w);
  return [rad.cx + x * rad.massstab, rad.cy + y * rad.massstab];
}

export interface Ort {
  x: number;
  y: number;
  o: number; // Deckkraft
  frisch: number; // 1 direkt nach dem Ablösen, fällt rasch auf 0: Licht an der Zerfallskante
  ruht: boolean; // gelandet und Teil der Doppelradix aus Sand
}

export function kornImWirbel(k: Korn, s: number, g: Geometrie, aus: Ort): void {
  const rad = k.von === 'A' ? g.a : g.b;
  const [x0, y0] = bild(rad, k.startR, k.startW, k.startRel);
  const [x2, y2] = bild(g.doppel, k.zielR, k.zielW, k.zielRel);
  const los = losZeit(k, g);
  const roh = (s - los) / (k.an - los);
  const q = glatt(roh);

  // Polar um die Mitte der Doppelradix: Radius schrumpft auf das Ziel, der Winkel dreht zusätzlich mit
  const cx = g.doppel.cx, cy = g.doppel.cy;
  const r0 = Math.hypot(x0 - cx, y0 - cy), r2 = Math.hypot(x2 - cx, y2 - cy);
  const w0 = Math.atan2(y0 - cy, x0 - cx), w2 = Math.atan2(y2 - cy, x2 - cx);
  // Drehweg so wählen, dass das Korn genau auf seinem Ziel ankommt und alle in dieselbe Richtung strömen
  let dw = (((w2 - w0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (dw < WIRBEL_MIN) dw += 2 * Math.PI;
  const w = w0 + dw * q;
  // auf halbem Weg weiter außen, so wirkt der Strom wie eine Spirale
  const r = r0 + (r2 - r0) * q + Math.sin(Math.PI * q) * (60 + 50 * k.wind);
  const unruhe = Math.sin(Math.PI * q) * 5;
  const fall = Math.sin(Math.PI * Math.min(1, Math.max(0, roh) * 2.2)) * FALL * (1 - q);

  aus.x = cx + Math.cos(w) * r + Math.sin(q * 11 + k.zitter) * unruhe;
  aus.y = cy + Math.sin(w) * r + Math.cos(q * 9 + k.zitter) * unruhe + fall;
  const rein = Math.min(1, Math.max(0, (s - los) / 0.02));
  const raus = Math.min(1, Math.max(0, (s - SAND_AUS) / (1 - SAND_AUS)));
  aus.o = k.deckkraft * rein * (1 - raus);
  aus.frisch = s < los ? 0 : Math.max(0, 1 - (s - los) / 0.025);
  aus.ruht = s >= k.an;
}
