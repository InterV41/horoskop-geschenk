// Sterne, die beim Umschalten zur Radix aus dem Sonnensystem hinausfliegen und sich über den
// ersten Bildschirm verteilen. Beim Rückweg kehren sie zurück, ein Teil der kleineren bleibt draußen.
// Reine Rechnung ohne DOM.
import { glatt, teil } from './zeitplan';

export interface Funke {
  heimX: number; // Platz im Sonnensystem, Zeichenflächen-Einheiten um die Mitte
  heimY: number;
  d: number; // Verzögerung beim Hinausfliegen, Anteil der Ausbreitung
  weite: number; // wie weit hinaus auf seinem Strahl, 0 am Rad … 1 am Rand der Fläche
  groesse: number; // Durchmesser in Pixeln
  bleibt: boolean; // bleibt auch im Sonnensystem draußen
  funkelt: boolean;
  takt: number; // Dauer des Funkelns in Sekunden
  versatz: number;
}

const STAFFEL = 0.4; // so weit verteilt sich der Start der Sterne

export function erzeugeFunken(n: number): Funke[] {
  let saat = 11;
  const rnd = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => {
    const m = Math.pow(rnd(), 1.8); // viele kleine, wenige große
    const groesse = 1 + m * 2.4;
    // Richtung gleichmäßig verteilt, damit die Sterne nach allen Seiten fliegen; der Abstand
    // bleibt innerhalb der flachen Ellipse des schrägen Sonnensystems
    const w = rnd() * Math.PI * 2, c = Math.cos(w), sn = Math.sin(w);
    const ellipse = 1 / Math.sqrt((c * c) / (390 * 390) + (sn * sn) / (164 * 164));
    const r = (0.2 + 0.8 * rnd()) * ellipse;
    return {
      heimX: c * r,
      heimY: sn * r,
      d: rnd() * STAFFEL,
      weite: rnd(),
      groesse,
      bleibt: groesse < 1.9 && rnd() < 0.55,
      funkelt: rnd() < 0.5,
      takt: 3 + rnd() * 4,
      versatz: rnd() * 7,
    };
  });
}

/* Gesamte Ausbreitung aus dem Verwandlungsgrad: setzt ein, wenn die Radix sichtbar wird */
export function ausbreitung(p: number): number {
  return teil(p, 0.2, 0.9);
}

/* Wie weit ein einzelner Stern unterwegs ist: 0 zu Hause, 1 am Ziel */
export function anteil(f: Funke, s: number): number {
  return f.bleibt ? 1 : glatt((s - f.d) / (1 - STAFFEL));
}

/* Deckkraft aus dem Flugfortschritt: im Sonnensystem unsichtbar, auf den ersten Metern der Bahn
   blenden die Sterne ein. Die bleibenden stehen immer draußen und sind immer zu sehen. */
export function sichtbarkeit(f: Funke, a: number): number {
  return f.bleibt ? 1 : glatt(a / 0.4);
}

/* Ort auf der geraden Bahn vom Zuhause zum Ziel. Ziel und Zuhause liegen auf demselben Strahl
   von der Mitte, so fliegen alle Sterne sternförmig nach außen und kreuzen sich nicht. */
export function ort(_f: Funke, a: number, heim: [number, number], ziel: [number, number]): [number, number] {
  return [heim[0] + (ziel[0] - heim[0]) * a, heim[1] + (ziel[1] - heim[1]) * a];
}

/* Rechteck relativ zur Mitte des Rads, in Pixeln */
export interface Rechteck { links: number; oben: number; rechts: number; unten: number }

const drin = (x: number, y: number, r: Rechteck) => x >= r.links && x <= r.rechts && y >= r.oben && y <= r.unten;

/* Ziel auf dem Strahl durch das Zuhause: zwischen dem Rad (minR) und dem Rand der Fläche, nie auf Text.
   Liegt die gewünschte Weite auf Text, werden andere Weiten probiert; findet sich keine, gibt es kein Ziel. */
export function strahlZiel(f: Funke, minR: number, rand: Rechteck, sperren: Rechteck[]): [number, number] | null {
  const w = Math.atan2(f.heimY, f.heimX), c = Math.cos(w), s = Math.sin(w);
  const grenzen = [c > 0 ? rand.rechts / c : c < 0 ? rand.links / c : Infinity, s > 0 ? rand.unten / s : s < 0 ? rand.oben / s : Infinity];
  const maxD = Math.min(...grenzen.filter((t) => t > 0));
  if (!(maxD > minR)) return null;
  for (let k = 0; k < 8; k++) {
    const anteilWeite = (f.weite + k * 0.137) % 1;
    const d = minR + anteilWeite * (maxD - minR), x = c * d, y = s * d;
    if (!sperren.some((r) => drin(x, y, r))) return [x, y];
  }
  return null;
}

/* 1 weit weg von Text, 0 auf Text, dazwischen ein weicher Rand */
export function textFreiheit(x: number, y: number, sperren: Rechteck[], weich = 12): number {
  let frei = 1;
  for (const r of sperren) {
    const dx = Math.max(r.links - x, 0, x - r.rechts), dy = Math.max(r.oben - y, 0, y - r.unten);
    frei = Math.min(frei, Math.min(1, Math.hypot(dx, dy) / weich));
  }
  return frei;
}
