import { describe, it, expect } from 'vitest';
import { synastrie, entzerre, TAU_A, TAU_B } from '../../src/scripts/partner/paar';
import { laengen, RADIX_REIHE, norm, abst, type RadixId } from '../../src/scripts/kosmos/modell';

/* Alle Planeten weit weg von 0°, damit nur die Sonne Aspekte bildet */
const ruhig = (sonne: number) => Object.fromEntries(RADIX_REIHE.map((r) => [r.id, r.id === 'sonne' ? sonne : 0])) as Record<RadixId, number>;
const nurSonne = (la: Record<RadixId, number>, lb: Record<RadixId, number>) => synastrie(la, lb).find((x) => x.a === 'sonne' && x.b === 'sonne');

describe('synastrie', () => {
  it('erkennt jede Aspektart', () => {
    for (const [deg, hart] of [[0, false], [60, false], [90, true], [120, false], [180, true]] as const) {
      const s = nurSonne(ruhig(10), ruhig(norm(10 + deg + 2)));
      expect(s, `Aspekt ${deg}°`).toBeDefined();
      expect(s!.hart).toBe(hart);
    }
  });

  it('liefert nur Paare zwischen A und B mit Stärke in (0, 1]', () => {
    const s = synastrie(laengen(0.3), laengen(0.7));
    expect(s.length).toBeGreaterThan(0);
    const ids = new Set(RADIX_REIHE.map((r) => r.id));
    for (const x of s) {
      expect(ids.has(x.a) && ids.has(x.b)).toBe(true);
      expect(x.staerke).toBeGreaterThan(0);
      expect(x.staerke).toBeLessThanOrEqual(1);
    }
  });

  it('beachtet die Orbs', () => {
    expect(nurSonne(ruhig(10), ruhig(10 + 65.5))).toBeUndefined();
    expect(nurSonne(ruhig(10), ruhig(10 + 97.9))?.hart).toBe(true);
  });

  it('die erfundenen Konstellationen haben weiche und harte Aspekte zwischen A und B', () => {
    const s = synastrie(laengen(TAU_A), laengen(TAU_B)).filter((x) => x.staerke > 0.4);
    expect(s.some((x) => x.hart)).toBe(true);
    expect(s.some((x) => !x.hart)).toBe(true);
  });
});

describe('entzerre', () => {
  it('hält Mindestabstand, verschiebt höchstens 6°, auch über 0° hinweg', () => {
    const orig = [358, 1, 3, 200, 204];
    const w = entzerre(orig);
    for (let i = 0; i < w.length; i++) {
      expect(abst(w[i], orig[i])).toBeLessThanOrEqual(6.0001);
      for (let j = i + 1; j < w.length; j++) expect(abst(w[i], w[j])).toBeGreaterThanOrEqual(6.999);
    }
  });

  it('lässt weit auseinanderliegende Winkel unverändert', () => {
    expect(entzerre([10, 100, 250])).toEqual([10, 100, 250]);
  });
});
