import { describe, it, expect } from 'vitest';
import { filmFortschritt, filmStand, FILM_BILDER } from '../../src/scripts/partner/film';
import { TAU_A, ASC_VERSATZ_B } from '../../src/scripts/partner/paar';
import { ASC0 } from '../../src/scripts/kosmos/layout';

describe('film', () => {
  it('steht am Anfang und am Ende still und steigt dazwischen monoton', () => {
    expect(filmFortschritt(0)).toBe(0);
    expect(filmFortschritt(12)).toBe(0);
    expect(filmFortschritt(FILM_BILDER - 24)).toBe(1);
    expect(filmFortschritt(FILM_BILDER - 1)).toBe(1);
    let alt = -1;
    for (let b = 0; b < FILM_BILDER; b++) {
      expect(filmFortschritt(b)).toBeGreaterThanOrEqual(alt);
      alt = filmFortschritt(b);
    }
  });
  it('beginnt mit den Startwerten von Clara und Jonas', () => {
    const s = filmStand(0);
    expect(s.tauA).toBe(TAU_A);
    expect(s.ascA).toBe(ASC0);
    expect(s.ascB - s.ascA).toBe(ASC_VERSATZ_B);
  });
  it('dreht langsam weiter', () => {
    expect(filmStand(300).ascA).toBeGreaterThan(filmStand(0).ascA);
    expect(filmStand(300).ascA - filmStand(0).ascA).toBeLessThan(5);
  });
});
