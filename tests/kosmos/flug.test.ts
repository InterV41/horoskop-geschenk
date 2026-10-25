import { describe, it, expect } from 'vitest';
import { FLUG_BILDER, FLUG_FPS, SEITENTEMPO, VERWANDLUNG_AB, VERWANDLUNG_BIS, modellzeit, verwandlung, aszendentImFilm, flugLayout, flugUhrAmEnde } from '../../src/scripts/kosmos/flug';
import { layout, aszendent } from '../../src/scripts/kosmos/layout';
import { tempo, phase, EINSTIEG } from '../../src/scripts/kosmos/zeitplan';

describe('Kosmos-Flug', () => {
  it('das letzte Filmbild gleicht dem ersten Bild der Live-Radix nach der Übergabe', () => {
    const u = flugUhrAmEnde();
    const film = flugLayout(FLUG_BILDER);
    const seite = layout(u.tau, phase(u.t + EINSTIEG), aszendent(u.t));
    expect(phase(u.t + EINSTIEG)).toBe(1);
    expect(film.p).toBe(1);
    expect(film.tierkreisDrehung).toBeCloseTo(seite.tierkreisDrehung, 9);
    for (const id of Object.keys(seite.koerper) as (keyof typeof seite.koerper)[]) {
      expect(film.koerper[id].x).toBeCloseTo(seite.koerper[id].x, 6);
      expect(film.koerper[id].y).toBeCloseTo(seite.koerper[id].y, 6);
    }
  });

  it('Modellzeit und Aszendent laufen am Ende im Tempo der Seite weiter, ohne Ruck', () => {
    const dt = 1 / FLUG_FPS;
    const tauSchritt = modellzeit(FLUG_BILDER) - modellzeit(FLUG_BILDER - 1);
    expect(tauSchritt).toBeCloseTo(tempo(1) * SEITENTEMPO * dt, 12);
    const ascSchritt = aszendentImFilm(FLUG_BILDER / FLUG_FPS) - aszendentImFilm((FLUG_BILDER - 1) / FLUG_FPS);
    // auf der Seite: aszendent(t) mit t im Seitentempo
    expect(ascSchritt).toBeCloseTo(aszendent(SEITENTEMPO * dt) - aszendent(0), 9);
  });

  it('Modellzeit steigt stetig, die Verwandlung liegt im Film und endet vor dem Schluss', () => {
    for (let b = 1; b <= FLUG_BILDER; b++) expect(modellzeit(b)).toBeGreaterThan(modellzeit(b - 1));
    expect(verwandlung(VERWANDLUNG_AB)).toBe(0);
    expect(verwandlung(VERWANDLUNG_BIS)).toBe(1);
    expect(VERWANDLUNG_BIS).toBeLessThan(FLUG_BILDER / FLUG_FPS);
  });
});

import { flugUhr, flugPhase } from '../../src/scripts/kosmos/flug';
import { erzeugeFilmsteuerung } from '../../src/scripts/kosmos/filmsteuerung';

describe('Kosmos-Flug auf der Seite', () => {
  it('die Uhr zum letzten Filmbild trifft genau dessen Bild', () => {
    const b = FLUG_BILDER - 1, u = flugUhr(b), t = b / FLUG_FPS;
    expect(flugPhase(b)).toBe(1);
    expect(u.tau).toBe(modellzeit(b));
    expect(aszendent(u.t)).toBeCloseTo(aszendentImFilm(t), 9);
    expect(phase(u.t + EINSTIEG)).toBe(1);
  });
  it('bricht der Film im Flug ab, beginnt die Live-Verwandlung von vorn', () => {
    expect(flugUhr(100)).toEqual({ t: 0, tau: 0 });
  });
  it('die Steuerung klemmt auf die Länge des Flugs', () => {
    const s = erzeugeFilmsteuerung(FLUG_BILDER, FLUG_FPS);
    s.schritt({ jetzt: 0, zeit: 0.1, bereit: true, ende: false, fehler: false });
    const d = s.schritt({ jetzt: 16, zeit: 99, bereit: true, ende: false, fehler: false });
    expect(d).toEqual({ art: 'zeichnen', bild: FLUG_BILDER - 1 });
  });
});
