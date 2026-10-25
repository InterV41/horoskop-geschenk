import { describe, it, expect } from 'vitest';
import { FILM_FPS, FILM_RUHE, filmUhren, filmLaenge, filmPhase, filmLayout, lichtfaeden } from '../../src/scripts/kosmos/film';
import { schritt, phase, EINSTIEG, TEMPO_SEITE } from '../../src/scripts/kosmos/zeitplan';

describe('film', () => {
  it('rechnet Bild für Bild genau wie die Seite mit festem Takt', () => {
    let u = { t: 0, tau: 0 };
    filmUhren().forEach((f, i) => {
      if (i > 0) u = schritt(u, TEMPO_SEITE / FILM_FPS);
      expect(f.t).toBe(u.t); expect(f.tau).toBe(u.tau);
    });
  });
  it('beginnt am Einstieg und endet mit einer Sekunde fertiger Radix', () => {
    expect(filmPhase(0)).toBe(phase(EINSTIEG));
    expect(filmPhase(filmLaenge() - FILM_RUHE - 1)).toBeLessThan(1);
    for (let b = filmLaenge() - FILM_RUHE; b < filmLaenge(); b++) expect(filmPhase(b)).toBe(1);
  });
  it('das letzte Filmbild ist der Übergabezustand', () => {
    const l = filmLayout(filmLaenge() - 1);
    expect(l.p).toBe(1);
    expect(filmUhren()).toHaveLength(filmLaenge());
  });
  it('klemmt Bildnummern außerhalb des Films', () => {
    expect(filmPhase(-5)).toBe(filmPhase(0));
    expect(filmPhase(filmLaenge() + 50)).toBe(1);
  });
  it('Lichtfäden: zehn von der Erde aus, nur mitten in der Verwandlung sichtbar', () => {
    let b = 0; // Bild mit Verwandlungsgrad am nächsten an 0,5
    for (let i = 0; i < filmLaenge(); i++) if (Math.abs(filmPhase(i) - 0.5) < Math.abs(filmPhase(b) - 0.5)) b = i;
    const mitte = filmLayout(b);
    const f = lichtfaeden(mitte, b);
    expect(f).toHaveLength(10);
    expect(Math.max(...f.map((x) => x.deckkraft))).toBeGreaterThan(0.5);
    for (const x of f) { expect(x.x1).toBeCloseTo(mitte.koerper.erde.x); expect(x.y1).toBeCloseTo(mitte.koerper.erde.y); }
    expect(Math.max(...lichtfaeden(filmLayout(0), 0).map((x) => x.deckkraft))).toBe(0);
    expect(Math.max(...lichtfaeden(filmLayout(filmLaenge() - 1), 0).map((x) => x.deckkraft))).toBe(0);
  });
  it('kein Körper springt zwischen zwei Filmbildern, auch in beliebiger Reihenfolge berechnet', () => {
    let max = 0;
    for (let b = 1; b < filmLaenge(); b++) {
      const a = filmLayout(b - 1), c = filmLayout(b);
      for (const id of Object.keys(c.koerper) as (keyof typeof c.koerper)[])
        max = Math.max(max, Math.hypot(c.koerper[id].x - a.koerper[id].x, c.koerper[id].y - a.koerper[id].y));
    }
    expect(max).toBeLessThan(25);
    const rueckwaerts = filmLayout(Math.floor(filmLaenge() / 2));
    expect(filmLayout(Math.floor(filmLaenge() / 2))).toEqual(rueckwaerts); // gleiches Bild, gleicher Inhalt
  });
});
