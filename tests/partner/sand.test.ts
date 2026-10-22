import { describe, it, expect } from 'vitest';
import { erzeugeKoerner, kornOrt, losZeit, maskeRad, maskeDoppel, type Geometrie } from '../../src/scripts/partner/sand';

const PA = [10, 40, 80, 130, 170, 220, 260, 300, 330, 350];
const PB = [20, 60, 100, 150, 190, 240, 280, 310, 340, 355];
const rad = (cx: number, cy: number, m: number, asc: number) => ({ cx, cy, massstab: m, asc });
const G: Geometrie = { a: rad(300, 200, 0.4, 160), b: rad(700, 200, 0.4, 255), doppel: rad(500, 900, 0.7, 160) };
const aus = { x: 0, y: 0, o: 0 };
const ort = (k: Parameters<typeof kornOrt>[0], s: number, g = G) => (kornOrt(k, s, g, aus), { ...aus });

describe('sand', () => {
  const koerner = erzeugeKoerner(1000, 7, PA, PB);

  it('ist mit gleicher Saat gleich, mit anderer anders', () => {
    expect(erzeugeKoerner(1000, 7, PA, PB)).toEqual(koerner);
    expect(erzeugeKoerner(1000, 8, PA, PB)).not.toEqual(koerner);
  });

  it('teilt die Körner etwa hälftig auf A und B', () => {
    const a = koerner.filter((k) => k.von === 'A').length;
    expect(koerner).toHaveLength(1000);
    expect(a).toBeGreaterThan(400);
    expect(a).toBeLessThan(600);
  });

  it('hält die Zeitfenster ein', () => {
    for (const k of koerner) {
      const los = losZeit(k, G);
      expect(los).toBeGreaterThanOrEqual(0);
      expect(los).toBeLessThanOrEqual(0.25); // zerfallen, solange die Räder noch im Bild sind
      expect(k.an).toBeGreaterThanOrEqual(0.45);
      expect(k.an).toBeLessThanOrEqual(0.75); // alle gelandet, bevor die Zeichnung übernimmt
      expect(los).toBeLessThan(k.an);
    }
  });

  it('löst oben früher als unten, landet außen früher als innen', () => {
    const mit = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const start = koerner.map((k) => ({ k, y: ort(k, 0).y, cy: k.von === 'A' ? G.a.cy : G.b.cy }));
    const oben = start.filter((s) => s.y < s.cy - 80).map((s) => losZeit(s.k, G));
    const unten = start.filter((s) => s.y > s.cy + 80).map((s) => losZeit(s.k, G));
    expect(mit(oben)).toBeLessThan(mit(unten));
    const aussen = koerner.filter((k) => k.zielR > 330).map((k) => k.an);
    const innen = koerner.filter((k) => k.zielR < 220).map((k) => k.an);
    expect(mit(aussen)).toBeLessThan(mit(innen));
  });

  it('liegt bei s = 0 im eigenen Rad und bei s = 1 in der Doppelradix, beide Male unsichtbar', () => {
    for (const k of koerner) {
      const r = k.von === 'A' ? G.a : G.b;
      const a = ort(k, 0);
      expect(Math.hypot(a.x - r.cx, a.y - r.cy)).toBeLessThanOrEqual(430 * r.massstab);
      expect(a.o).toBe(0);
      const e = ort(k, 1);
      expect(Math.hypot(e.x - G.doppel.cx, e.y - G.doppel.cy)).toBeLessThanOrEqual(430 * G.doppel.massstab);
      expect(e.o).toBe(0);
    }
  });

  it('ist unterwegs sichtbar', () => {
    const k = koerner[0];
    expect(ort(k, (losZeit(k, G) + k.an) / 2).o).toBeGreaterThan(0);
  });

  it('bleibt nach der Landung liegen: die Doppelradix entsteht aus Sand', () => {
    for (const k of koerner.slice(0, 200)) {
      const o = ort(k, 0.78);
      expect(o.o).toBeCloseTo(k.deckkraft, 6);
      const e = ort(k, 0.78);
      const z = ort(k, 0.82);
      expect(Math.hypot(e.x - z.x, e.y - z.y)).toBeLessThan(1e-6); // ruht am Ziel
    }
  });

  it('folgt einer verschobenen Doppelradix', () => {
    const g2 = { ...G, doppel: { ...G.doppel, cy: G.doppel.cy + 300 } };
    for (const k of koerner.slice(0, 50)) expect(ort(k, 1, g2).y - ort(k, 1).y).toBeCloseTo(300, 6);
  });

  it('Masken laufen monoton von 0 bis 1', () => {
    expect(maskeRad(0)).toBe(0);
    expect(maskeRad(0.25)).toBe(1);
    expect(maskeDoppel(0.78)).toBe(0); // vorher nur Sand
    expect(maskeDoppel(0.98)).toBe(1); // bis hier hat sich die Zeichnung ganz nachgezogen
    for (let s = 0; s < 1; s += 0.01) {
      expect(maskeRad(s + 0.01)).toBeGreaterThanOrEqual(maskeRad(s));
      expect(maskeDoppel(s + 0.01)).toBeGreaterThanOrEqual(maskeDoppel(s));
    }
  });
});
