import { describe, it, expect } from 'vitest';
import { lesefortschritt, wortHelligkeit, DUNKEL } from '../src/scripts/aufleuchten';

describe('lesefortschritt', () => {
  const H = 800;
  it('ist 0, solange der Text unten im Fenster steht, und 1, wenn er die Mitte passiert hat', () => {
    expect(lesefortschritt({ top: 760, bottom: 860 }, H)).toBe(0);
    expect(lesefortschritt({ top: 200, bottom: 300 }, H)).toBe(1);
  });
  it('steigt dazwischen monoton', () => {
    let alt = -1;
    for (let top = 760; top >= 200; top -= 10) {
      const p = lesefortschritt({ top, bottom: top + 100 }, H);
      expect(p).toBeGreaterThanOrEqual(alt);
      alt = p;
    }
  });
});

describe('wortHelligkeit', () => {
  it('ist am Anfang überall gedämpft und am Ende überall voll', () => {
    for (let i = 0; i < 12; i++) {
      expect(wortHelligkeit(0, i, 12)).toBe(DUNKEL);
      expect(wortHelligkeit(1, i, 12)).toBe(1);
    }
  });
  it('leuchtet Wort für Wort von vorn nach hinten auf', () => {
    const p = 0.5;
    for (let i = 1; i < 12; i++) expect(wortHelligkeit(p, i, 12)).toBeLessThanOrEqual(wortHelligkeit(p, i - 1, 12));
    expect(wortHelligkeit(p, 0, 12)).toBe(1);
    expect(wortHelligkeit(p, 11, 12)).toBe(DUNKEL);
  });
});
