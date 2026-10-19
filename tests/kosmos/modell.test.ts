import { describe, it, expect } from 'vitest';
import { laengen, sonnenWinkel, rechenAbstand, aspekte, abst, PLANETEN, RADIX_REIHE } from '../../src/scripts/kosmos/modell';

const grad = (x: number) => (x * 180) / Math.PI;
const vorz = (a: number, b: number) => ((a - b + 540) % 360) - 180; // signierte Differenz

describe('modell', () => {
  it('hat neun Planeten und zehn Radix-Körper', () => {
    expect(PLANETEN.map((p) => p.id)).toEqual(['merkur', 'venus', 'erde', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto']);
    expect(RADIX_REIHE.map((r) => r.id)).toEqual(['sonne', 'mond', 'merkur', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto']);
  });
  it('Sonne steht von der Erde aus gegenüber der Erde', () => {
    for (const tau of [0, 0.3, 1.7, 12]) expect(abst(laengen(tau).sonne, sonnenWinkel('erde', tau) + 180)).toBeLessThan(1e-9);
  });
  it('Merkur und Venus bleiben nahe bei der Sonne', () => {
    for (const id of ['merkur', 'venus'] as const) {
      const grenze = grad(Math.asin(rechenAbstand(id))) + 0.5;
      for (let tau = 0; tau < 8; tau += 0.002) { const l = laengen(tau); expect(abst(l[id], l.sonne)).toBeLessThan(grenze); }
    }
  });
  it('Mars wird innerhalb von 4 Erdumläufen rückläufig', () => {
    let rueck = false;
    for (let tau = 0; tau < 4; tau += 0.001) if (vorz(laengen(tau + 0.001).mars, laengen(tau).mars) < 0) rueck = true;
    expect(rueck).toBe(true);
  });
  it('alle Längen liegen in [0, 360)', () => {
    for (const v of Object.values(laengen(3.21))) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(360); }
  });
  it('erkennt Aspekte mit den bestehenden Regeln', () => {
    const l = { sonne: 0, mond: 90, merkur: 200, venus: 330, mars: 45, jupiter: 120, saturn: 181, uranus: 10, neptun: 270, pluto: 300 };
    const a = aspekte(l);
    const sm = a.find((x) => x.a === 'sonne' && x.b === 'mond')!;
    expect(sm.hart).toBe(true); expect(sm.staerke).toBeCloseTo(1);
    const sj = a.find((x) => x.a === 'sonne' && x.b === 'jupiter')!;
    expect(sj.hart).toBe(false); expect(sj.staerke).toBeCloseTo(1);
    const ss = a.find((x) => x.a === 'sonne' && x.b === 'saturn')!;
    expect(ss.hart).toBe(true); expect(ss.staerke).toBeCloseTo(1 - 1 / 8);
    expect(a.find((x) => x.a === 'sonne' && x.b === 'uranus')).toBeUndefined();
  });
});
