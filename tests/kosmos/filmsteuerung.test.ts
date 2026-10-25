import { describe, it, expect } from 'vitest';
import { erzeugeFilmsteuerung, type Beobachtung } from '../../src/scripts/kosmos/filmsteuerung';
import { FILM_FPS, filmLaenge } from '../../src/scripts/kosmos/film';

const b = (o: Partial<Beobachtung>): Beobachtung => ({ jetzt: 0, zeit: 0, bereit: true, ende: false, fehler: false, ...o });

describe('filmsteuerung', () => {
  it('zeichnet das Bild zur Videozeit, solange das Video voranschreitet', () => {
    const s = erzeugeFilmsteuerung();
    expect(s.schritt(b({ jetzt: 0, zeit: 0 }))).toEqual({ art: 'warten', bild: 0 });
    expect(s.schritt(b({ jetzt: 100, zeit: 0.1 }))).toEqual({ art: 'zeichnen', bild: 3 });
    expect(s.gestartet()).toBe(true);
  });
  it('übergibt an die Live-Radix, wenn das Video zu Ende ist', () => {
    const s = erzeugeFilmsteuerung();
    s.schritt(b({ jetzt: 0, zeit: 0.2 }));
    expect(s.schritt(b({ jetzt: 9000, zeit: 9.2, ende: true }))).toEqual({ art: 'uebergabe' });
  });
  it('startet das Video nicht innerhalb von 2,5 s, übernimmt die Live-Verwandlung von vorn', () => {
    const s = erzeugeFilmsteuerung();
    // ein Schritt je Bild (16 ms), wie auf der Seite
    for (let t = 0; t <= 2496; t += 16) expect(s.schritt(b({ jetzt: t, zeit: 0, bereit: false })).art).toBe('warten');
    expect(s.schritt(b({ jetzt: 2512, zeit: 0, bereit: false }))).toEqual({ art: 'live', bild: 0 });
  });
  it('Seite im Hintergrund: die Wartezeit zählt erst ab dem ersten sichtbaren Bild', () => {
    const s = erzeugeFilmsteuerung();
    // Lücken zwischen zwei Schritten (Tab im Hintergrund, keine Bildwechsel) zählen nicht
    s.schritt(b({ jetzt: 0, zeit: 0, bereit: false }));
    expect(s.schritt(b({ jetzt: 60000, zeit: 0, bereit: false })).art).toBe('warten');
    expect(s.schritt(b({ jetzt: 60500, zeit: 0.4 })).art).toBe('zeichnen');
  });
  it('stockt das Video nach dem Start über 1,5 s, geht es live an derselben Stelle weiter', () => {
    const s = erzeugeFilmsteuerung();
    s.schritt(b({ jetzt: 0, zeit: 0 }));
    s.schritt(b({ jetzt: 100, zeit: 4 }));
    for (let t = 116; t < 1500; t += 16) expect(s.schritt(b({ jetzt: t, zeit: 4 })).art).toBe('zeichnen');
    expect(s.schritt(b({ jetzt: 1700, zeit: 4 }))).toEqual({ art: 'live', bild: Math.round(4 * FILM_FPS) });
  });
  it('Fehler mitten im Film: live an derselben Stelle, nicht zurück ins Sonnensystem', () => {
    const s = erzeugeFilmsteuerung();
    s.schritt(b({ jetzt: 0, zeit: 0 }));
    s.schritt(b({ jetzt: 100, zeit: 3 }));
    expect(s.schritt(b({ jetzt: 120, zeit: 3, fehler: true }))).toEqual({ art: 'live', bild: 90 });
  });
  it('Fehler vor dem Start: live von vorn', () => {
    const s = erzeugeFilmsteuerung();
    expect(s.schritt(b({ jetzt: 0, zeit: 0, bereit: false, fehler: true }))).toEqual({ art: 'live', bild: 0 });
  });
  it('Quellwechsel (hell/dunkel): solange das Video lädt, bleibt das letzte Bild stehen', () => {
    const s = erzeugeFilmsteuerung();
    s.schritt(b({ jetzt: 0, zeit: 0 }));
    s.schritt(b({ jetzt: 100, zeit: 5 }));
    // neue Quelle: Zeit springt auf 0, Video lädt
    expect(s.schritt(b({ jetzt: 116, zeit: 0, bereit: false }))).toEqual({ art: 'warten', bild: 150 });
    expect(s.schritt(b({ jetzt: 400, zeit: 5, bereit: false }))).toEqual({ art: 'warten', bild: 150 });
    expect(s.schritt(b({ jetzt: 420, zeit: 5.05 }))).toEqual({ art: 'zeichnen', bild: 152 });
  });
  it('klemmt Bildnummern auf die Filmlänge', () => {
    const s = erzeugeFilmsteuerung();
    s.schritt(b({ jetzt: 0, zeit: 0 }));
    expect(s.schritt(b({ jetzt: 10, zeit: 99 }))).toEqual({ art: 'zeichnen', bild: filmLaenge() - 1 });
  });
});
