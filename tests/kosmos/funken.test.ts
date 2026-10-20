import { describe, it, expect } from 'vitest';
import { erzeugeFunken, ausbreitung, anteil, ort, strahlZiel, textFreiheit, type Rechteck } from '../../src/scripts/kosmos/funken';

/* Fläche des ersten Bildschirms, gemessen von der Mitte des Rads */
const RAND: Rechteck = { links: -300, oben: -350, rechts: 900, unten: 350 };
/* Textblock rechts neben dem Rad */
const TEXT: Rechteck = { links: 420, oben: -120, rechts: 860, unten: 140 };

describe('funken', () => {
  const funken = erzeugeFunken(120);

  it('ist im Sonnensystem zusammengezogen und in der Radix ganz ausgebreitet', () => {
    expect(ausbreitung(0)).toBe(0);
    expect(ausbreitung(1)).toBe(1);
    for (let p = 0; p < 1; p += 0.01) expect(ausbreitung(p + 0.01)).toBeGreaterThanOrEqual(ausbreitung(p));
  });

  it('lässt einen Teil der kleineren Sterne immer draußen', () => {
    const bleibend = funken.filter((f) => f.bleibt);
    expect(bleibend.length).toBeGreaterThan(funken.length * 0.2);
    expect(bleibend.length).toBeLessThan(funken.length * 0.5);
    const mittel = (l: typeof funken) => l.reduce((s, f) => s + f.groesse, 0) / l.length;
    expect(mittel(bleibend)).toBeLessThan(mittel(funken.filter((f) => !f.bleibt)));
    for (const f of bleibend) { expect(anteil(f, 0)).toBe(1); expect(anteil(f, 1)).toBe(1); }
  });

  it('die übrigen fliegen gestaffelt hinaus: bei 0 zu Hause, bei 1 alle am Ziel', () => {
    const fliegend = funken.filter((f) => !f.bleibt);
    for (const f of fliegend) { expect(anteil(f, 0)).toBe(0); expect(anteil(f, 1)).toBe(1); }
    const unterwegs = fliegend.map((f) => anteil(f, 0.4));
    expect(Math.max(...unterwegs) - Math.min(...unterwegs)).toBeGreaterThan(0.3);
  });

  it('das Ziel liegt auf dem Strahl von der Mitte durch das Zuhause, außerhalb des Rads', () => {
    for (const f of funken) {
      const z = strahlZiel(f, 220, RAND, []);
      if (!z) continue;
      const wHeim = Math.atan2(f.heimY, f.heimX), wZiel = Math.atan2(z[1], z[0]);
      expect(Math.abs(Math.atan2(Math.sin(wZiel - wHeim), Math.cos(wZiel - wHeim)))).toBeLessThan(1e-9);
      expect(Math.hypot(z[0], z[1])).toBeGreaterThanOrEqual(220 - 1e-9);
      expect(z[0]).toBeGreaterThanOrEqual(RAND.links); expect(z[0]).toBeLessThanOrEqual(RAND.rechts);
      expect(z[1]).toBeGreaterThanOrEqual(RAND.oben); expect(z[1]).toBeLessThanOrEqual(RAND.unten);
    }
  });

  it('kein Ziel liegt auf dem Text', () => {
    let gesetzt = 0;
    for (const f of funken) {
      const z = strahlZiel(f, 220, RAND, [TEXT]);
      if (!z) continue;
      gesetzt++;
      expect(z[0] >= TEXT.links && z[0] <= TEXT.rechts && z[1] >= TEXT.oben && z[1] <= TEXT.unten).toBe(false);
    }
    expect(gesetzt).toBeGreaterThan(funken.length * 0.7);
  });

  it('die Bahn ist gerade vom Zuhause zum Ziel, ohne Schwung, und kreuzt keine andere', () => {
    const f = funken.find((x) => !x.bleibt)!;
    const heim: [number, number] = [100, -50], ziel: [number, number] = [400, -200];
    for (const q of [0, 0.25, 0.5, 0.75, 1]) {
      const [x, y] = ort(f, q, heim, ziel);
      expect(x).toBeCloseTo(100 + 300 * q); expect(y).toBeCloseTo(-50 - 150 * q);
    }
  });

  it('blendet Sterne über Text weich aus', () => {
    expect(textFreiheit(600, 0, [TEXT])).toBe(0); // mitten im Text
    expect(textFreiheit(0, 0, [TEXT])).toBe(1); // weit weg
    const amRand = textFreiheit(TEXT.links - 6, 0, [TEXT]);
    expect(amRand).toBeGreaterThan(0); expect(amRand).toBeLessThan(1); // weicher Übergang
  });

  it('ist bei jedem Besuch gleich verteilt', () => {
    expect(erzeugeFunken(120)).toEqual(funken);
  });
});
