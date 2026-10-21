import { describe, it, expect } from 'vitest';
import { fortschritt, type Kasten } from '../../src/scripts/partner/fortschritt';

const H = 800;
const kasten = (top: number, height: number): Kasten => ({ top, bottom: top + height, height });
/* Paar 300 hoch, Doppelradix 600 hoch 1400 darunter; y = Oberkante des Paars im Fenster.
   Auf der Seite steht das Paar bei 800, gescrollt ist also 800 - y. */
const bei = (y: number, rest = 5000, oben = 800) => fortschritt(kasten(y, 300), kasten(y + 1400, 600), H, rest, oben - y);

describe('fortschritt', () => {
  it('ist 0, solange das Paar ganz zu sehen ist', () => {
    expect(bei(500)).toBe(0);
    expect(bei(380)).toBe(0); // Unterkante 680 = 0,85 · 800
  });

  it('ist ganz oben auf der Seite 0, auch wenn das Paar weit oben steht', () => {
    expect(bei(100, 5000, 100)).toBe(0);
    expect(bei(60, 5000, 100)).toBeGreaterThan(0);
  });

  it('ist 1, sobald die Mitte der Doppelradix die Fenstermitte erreicht', () => {
    // Doppelmitte = y + 1700 = 400 → y = -1300
    expect(bei(-1300)).toBe(1);
    expect(bei(-2000)).toBe(1);
  });

  it('steigt dazwischen monoton', () => {
    let alt = -1;
    for (let y = 380; y >= -1300; y -= 20) {
      const s = bei(y);
      expect(s).toBeGreaterThanOrEqual(alt);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      alt = s;
    }
    expect(bei(-460)).toBeGreaterThan(0.4);
    expect(bei(-460)).toBeLessThan(0.6);
  });

  it('erreicht 1 auch, wenn die Seite zu kurz ist', () => {
    expect(bei(-500, 0)).toBe(1);
  });
});
