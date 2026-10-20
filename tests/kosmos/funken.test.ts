import { describe, it, expect } from 'vitest';
import { erzeugeFunken, ausbreitung, anteil, ort } from '../../src/scripts/kosmos/funken';

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
    expect(Math.max(...unterwegs) - Math.min(...unterwegs)).toBeGreaterThan(0.3); // nicht alle gleichzeitig
  });

  it('die Bahn beginnt genau zu Hause und endet genau am Ziel, dazwischen geschwungen', () => {
    const f = funken.find((x) => !x.bleibt)!;
    const heim: [number, number] = [20, -10], ziel: [number, number] = [-300, 180];
    const a = ort(f, 0, heim, ziel), b = ort(f, 1, heim, ziel);
    expect(a[0]).toBeCloseTo(20); expect(a[1]).toBeCloseTo(-10);
    expect(b[0]).toBeCloseTo(-300); expect(b[1]).toBeCloseTo(180);
    let max = 0, vorher = a;
    for (let q = 0.01; q <= 1.0001; q += 0.01) { const c = ort(f, q, heim, ziel); max = Math.max(max, Math.hypot(c[0] - vorher[0], c[1] - vorher[1])); vorher = c; }
    expect(max).toBeLessThan(30); // stetig, kein Sprung
  });

  it('ist bei jedem Besuch gleich verteilt', () => {
    expect(erzeugeFunken(120)).toEqual(funken);
  });
});
