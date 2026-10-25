import { describe, it, expect } from 'vitest';
import { T, EINSTIEG, glatt, phase, teil, tempo, schritt, TEMPO_RADIX, TEMPO_SONNENSYSTEM } from '../../src/scripts/kosmos/zeitplan';

describe('zeitplan', () => {
  it('glatt klemmt und hat feste Randwerte', () => {
    expect(glatt(-1)).toBe(0); expect(glatt(0)).toBe(0);
    expect(glatt(0.5)).toBeCloseTo(0.5); expect(glatt(1)).toBe(1); expect(glatt(2)).toBe(1);
  });
  it('folgt der Ablauftabelle', () => {
    expect(phase(0)).toBe(0); expect(phase(3.99)).toBe(0);
    expect(phase(6)).toBeCloseTo(0.5); expect(phase(8)).toBe(1);
    expect(phase(25)).toBe(1); expect(phase(38)).toBeCloseTo(0.5); expect(phase(40)).toBe(0);
  });
  it('beginnt beim Laden im Sonnensystem und verwandelt sich gleich sichtbar in die Radix', () => {
    for (let t = 0; t <= 0.4; t += 0.1) expect(phase(EINSTIEG + t)).toBe(0);
    expect(phase(EINSTIEG + 2.5)).toBeGreaterThan(0.3);
    for (let t = 4.5; t <= 30; t += 0.5) expect(phase(EINSTIEG + t)).toBe(1);
  });
  it('ist periodisch', () => {
    for (const x of [0, 3, 11.3, 20, 37.7]) {
      expect(phase(x + T)).toBeCloseTo(phase(x), 12);
      expect(phase(x - T)).toBeCloseTo(phase(x), 12);
    }
  });
  it('springt nie und hat flache Ränder', () => {
    const h = 0.001; let max = 0;
    for (let x = 0; x < 2 * T; x += h) max = Math.max(max, Math.abs(phase(x + h) - phase(x)));
    expect(max).toBeLessThan((1.875 / 4) * h * 1.01); // höchste Steigung von smootherstep über 4 s
    for (const rand of [4, 8, 36, 40]) {
      expect(Math.abs(phase(rand + 1e-4) - phase(rand - 1e-4))).toBeLessThan(1e-9);
    }
  });
  it('teil glättet ein Teilfenster', () => {
    expect(teil(0.2, 0.3, 0.8)).toBe(0); expect(teil(0.55, 0.3, 0.8)).toBeCloseTo(0.5); expect(teil(0.9, 0.3, 0.8)).toBe(1);
  });
  it('tempo ist immer positiv und mischt linear', () => {
    expect(tempo(0)).toBe(TEMPO_SONNENSYSTEM); expect(tempo(1)).toBeCloseTo(TEMPO_RADIX);
    expect(TEMPO_RADIX).toBeCloseTo(0.5 / 360); expect(TEMPO_SONNENSYSTEM).toBeCloseTo(6 * TEMPO_RADIX);
    for (let p = 0; p <= 1; p += 0.05) expect(tempo(p)).toBeGreaterThan(0);
  });
  it('schritt begrenzt große Sprünge auf 0,1 s', () => {
    const u = schritt({ t: 0, tau: 0 }, 600);
    expect(u.t).toBeCloseTo(0.1);
    expect(schritt({ t: 0, tau: 0 }, -1).t).toBe(0);
  });
  it('tau läuft stetig vorwärts', () => {
    let u = { t: 0, tau: 0 }, vorher = 0;
    for (let i = 0; i < 60 * 90; i++) { u = schritt(u, 1 / 60); expect(u.tau).toBeGreaterThan(vorher); vorher = u.tau; }
  });
});
