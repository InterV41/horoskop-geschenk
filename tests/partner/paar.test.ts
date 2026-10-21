import { describe, it, expect } from 'vitest';
import { synastrie, radialVersatz, TAU_A, TAU_B } from '../../src/scripts/partner/paar';
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
    expect(nurSonne(ruhig(10), ruhig(10 + 64.5))).toBeUndefined();
    expect(nurSonne(ruhig(10), ruhig(10 + 94.9))?.hart).toBe(true);
    expect(nurSonne(ruhig(10), ruhig(10 + 95.5))).toBeUndefined();
  });

  it('lässt Kontakte zwischen Uranus, Neptun und Pluto beider Partner weg', () => {
    const l = ruhig(0); // alle Planeten auf 0°
    const s = synastrie(l, l);
    expect(s.some((x) => x.a === 'uranus' && x.b === 'neptun')).toBe(false);
    expect(s.some((x) => x.a === 'pluto' && x.b === 'pluto')).toBe(false);
    expect(s.some((x) => x.a === 'sonne' && x.b === 'pluto')).toBe(true);
  });

  it('die erfundenen Konstellationen haben weiche und harte Aspekte zwischen A und B', () => {
    const s = synastrie(laengen(TAU_A), laengen(TAU_B)).filter((x) => x.staerke > 0.4);
    expect(s.some((x) => x.hart)).toBe(true);
    expect(s.some((x) => !x.hart)).toBe(true);
  });
});

describe('radialVersatz', () => {
  const abstand = (w1: number, r1: number, w2: number, r2: number) => {
    const [x1, y1] = [r1 * Math.cos((w1 * Math.PI) / 180), r1 * Math.sin((w1 * Math.PI) / 180)];
    const [x2, y2] = [r2 * Math.cos((w2 * Math.PI) / 180), r2 * Math.sin((w2 * Math.PI) / 180)];
    return Math.hypot(x1 - x2, y1 - y2);
  };

  it('trennt zwei Zeichen auf gleichem Grad um mindestens die Zeichengröße', () => {
    const v = radialVersatz([100, 100, 250], 250, 28);
    expect(abstand(100, 250 + v[0], 100, 250 + v[1])).toBeGreaterThanOrEqual(27.99);
    expect(v[2]).toBe(0);
  });

  it('ändert sich stetig, wenn zwei Planeten aneinander vorbeiziehen', () => {
    let alt = radialVersatz([95, 100], 250, 28);
    for (let w = 95; w <= 105; w += 0.05) {
      const v = radialVersatz([w, 100], 250, 28);
      expect(Math.abs(v[0] - alt[0])).toBeLessThan(1.5);
      expect(Math.abs(v[1] - alt[1])).toBeLessThan(1.5);
      expect(abstand(w, 250 + v[0], 100, 250 + v[1])).toBeGreaterThanOrEqual(27.99);
      alt = v;
    }
  });

  it('lässt weit auseinanderliegende Zeichen auf ihrer Spur, auch über 0° hinweg', () => {
    expect(radialVersatz([10, 100, 250], 250, 28)).toEqual([0, 0, 0]);
    const v = radialVersatz([359, 1], 250, 28);
    expect(v[0]).not.toBe(0);
  });
});
