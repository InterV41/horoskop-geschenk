import { describe, it, expect } from 'vitest';
import { fortschritt, LANDEN_AB, type Kasten } from '../../src/scripts/partner/fortschritt';

const H = 800;
const kasten = (top: number, height: number): Kasten => ({ top, bottom: top + height, height });
/* Seite: Paar bei 200 (400 hoch), Bahn der Doppelradix ab 1400, Doppelradix 560 hoch, danach
   1 Fensterhöhe Haltestrecke. Die Doppelradix bleibt 120 px unter dem Fensterrand stehen. */
const STICKY = 120, DOPPEL = 560, BAHN = DOPPEL + H;
const bei = (scrollY: number, seitenEnde = 99999) =>
  fortschritt({
    paar: kasten(200 - scrollY, 400),
    bahn: kasten(1400 - scrollY, BAHN),
    doppelHoehe: DOPPEL,
    stickyTop: STICKY,
    fensterHoehe: H,
    seitenRest: seitenEnde - scrollY,
    scrollY,
  });
const festAb = 1400 - STICKY; // Bahn erreicht die Haltelinie
const festBis = 1400 + BAHN - STICKY - DOPPEL; // Ende der Haltestrecke

describe('fortschritt', () => {
  it('ist ganz oben 0', () => {
    expect(bei(0)).toBe(0);
  });

  it('erreicht den Landebeginn genau, wenn die Doppelradix stehen bleibt', () => {
    expect(bei(festAb)).toBeCloseTo(LANDEN_AB, 6);
  });

  it('ist am Ende der Haltestrecke 1 und danach auch', () => {
    expect(bei(festBis)).toBe(1);
    expect(bei(festBis + 500)).toBe(1);
  });

  it('steigt monoton und bleibt in [0, 1]', () => {
    let alt = -1;
    for (let y = 0; y <= festBis + 200; y += 10) {
      const s = bei(y);
      expect(s).toBeGreaterThanOrEqual(alt);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      alt = s;
    }
  });

  it('landet während des Haltens: die Hälfte der Haltestrecke liegt mitten im Landefenster', () => {
    const s = bei((festAb + festBis) / 2);
    expect(s).toBeGreaterThan(LANDEN_AB);
    expect(s).toBeLessThan(1);
  });

  it('ist auf einer Seite ohne Scrollweg sofort 1', () => {
    expect(bei(0, 0)).toBe(1);
  });

  it('endet stetig am Seitenende, wenn die Haltestrecke nicht ganz erreicht wird', () => {
    const ende = festAb + 300;
    expect(bei(ende, ende)).toBe(1);
    expect(bei(ende - 100, ende)).toBeGreaterThan(LANDEN_AB);
    expect(bei(ende - 100, ende)).toBeLessThan(1);
  });

  it('zählt einen Rest unter einem Pixel als Seitenende', () => {
    expect(bei(1000, 1000.3)).toBe(1);
  });
});
