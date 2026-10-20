// Sterne, die beim Umschalten zur Radix aus dem Sonnensystem hinausfliegen und sich über den
// ersten Bildschirm verteilen. Beim Rückweg kehren sie zurück, ein Teil der kleineren bleibt draußen.
// Reine Rechnung ohne DOM.
import { glatt, teil } from './zeitplan';

export interface Funke {
  heimX: number; // Platz im Sonnensystem, Zeichenflächen-Einheiten um die Mitte
  heimY: number;
  u: number; // Ziel auf dem Bildschirm, 0…1 über Breite und Höhe der Fläche
  v: number;
  d: number; // Verzögerung beim Hinausfliegen, Anteil der Ausbreitung
  dreh: number; // Schwung der Bahn in Grad
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
    const r = 60 + rnd() * 330, w = rnd() * Math.PI * 2;
    return {
      heimX: Math.cos(w) * r,
      heimY: Math.sin(w) * r * 0.42, // in der Ebene des schrägen Sonnensystems
      u: rnd(),
      v: rnd(),
      d: rnd() * STAFFEL,
      dreh: (rnd() - 0.5) * 80,
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

/* Ort auf einer geschwungenen Bahn um die Mitte, beginnt genau zu Hause und endet genau am Ziel */
export function ort(f: Funke, a: number, heim: [number, number], ziel: [number, number]): [number, number] {
  const rh = Math.hypot(heim[0], heim[1]), rz = Math.hypot(ziel[0], ziel[1]);
  const wh = Math.atan2(heim[1], heim[0]), wz = Math.atan2(ziel[1], ziel[0]);
  let dw = wz - wh;
  if (dw > Math.PI) dw -= 2 * Math.PI;
  if (dw < -Math.PI) dw += 2 * Math.PI;
  const r = rh + (rz - rh) * a;
  const w = wh + dw * a + ((f.dreh * Math.PI) / 180) * Math.sin(Math.PI * a);
  return [Math.cos(w) * r, Math.sin(w) * r];
}
