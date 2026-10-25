import { describe, it, expect } from 'vitest';
import { entmische } from '../../src/scripts/kosmos/durchsicht';

const ueber = (c: number[], a: number, grund: number) => c.map((x) => x * a + grund * (1 - a));

describe('durchsicht', () => {
  it('Gold auf Weiß ergibt wieder Gold mit seiner Deckkraft', () => {
    const gold = [154 / 255, 122 / 255, 51 / 255];
    const [r, g, b, a] = entmische(...(ueber(gold, 0.6, 1) as [number, number, number]), 'weiss');
    expect(a).toBeCloseTo(0.6 * (1 - 51 / 255), 5); // Deckkraft aus dem dunkelsten Kanal (Blau)
    expect(r * a + (1 - a)).toBeCloseTo(ueber(gold, 0.6, 1)[0], 5); // zurück auf Weiß gelegt = Ausgangsbild
  });
  it('Licht auf Schwarz ergibt wieder Licht', () => {
    const licht = [1, 0.95, 0.8];
    const [r, , , a] = entmische(...(ueber(licht, 0.5, 0) as [number, number, number]), 'schwarz');
    expect(a).toBeCloseTo(0.5, 5);
    expect(r).toBeCloseTo(1, 5);
  });
  it('reiner Grund ist ganz durchsichtig', () => {
    expect(entmische(0, 0, 0, 'schwarz')[3]).toBe(0);
    expect(entmische(1, 1, 1, 'weiss')[3]).toBe(0);
  });
  it('Rauschen unter 3 % wird durchsichtig, kein grauer Schleier', () => {
    expect(entmische(0.02, 0.025, 0.01, 'schwarz')[3]).toBe(0);
    expect(entmische(0.98, 0.975, 0.99, 'weiss')[3]).toBe(0);
    expect(entmische(0.2, 0.2, 0.2, 'schwarz')[3]).toBeCloseTo(0.2, 5);
  });
  it('graue Sprite-Ecken bis gut 5 % (gemessen: 14 von 255 unter dem Mond) werden ganz durchsichtig', () => {
    expect(entmische(14 / 255, 13 / 255, 12 / 255, 'schwarz')[3]).toBe(0);
    expect(entmische(1 - 14 / 255, 1 - 13 / 255, 1 - 12 / 255, 'weiss')[3]).toBe(0);
    expect(entmische(0.3, 0.25, 0.15, 'schwarz')[3]).toBeCloseTo(0.3, 5); // echte Inhalte bleiben
  });
});
