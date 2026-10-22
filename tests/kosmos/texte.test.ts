import { describe, it, expect } from 'vitest';
import { sprache, texte } from '../../src/scripts/kosmos/texte';

describe('texte', () => {
  it('erkennt Englisch auch mit Regionskürzel, sonst Deutsch', () => {
    expect(sprache('en')).toBe('en');
    expect(sprache('en-GB')).toBe('en');
    expect(sprache('EN-us')).toBe('en');
    expect(sprache('de')).toBe('de');
    expect(sprache('fr')).toBe('de');
    expect(sprache(undefined)).toBe('de');
  });
  it('liefert die englischen Tierkreisnamen in Reihenfolge ab Widder', () => {
    expect(texte('en').tierkreis).toEqual(['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES']);
  });
  it('lässt die deutschen Namen unverändert', () => {
    expect(texte('de').tierkreis).toEqual(['WIDDER', 'STIER', 'ZWILLINGE', 'KREBS', 'LÖWE', 'JUNGFRAU', 'WAAGE', 'SKORPION', 'SCHÜTZE', 'STEINBOCK', 'WASSERMANN', 'FISCHE']);
  });
  it('beschreibt die Animation in der jeweiligen Sprache', () => {
    expect(texte('de').beschreibung).toBe('Animation: Das Sonnensystem verwandelt sich in ein Geburtshoroskop-Rad');
    expect(texte('en').beschreibung).toBe('Animation: the solar system transforms into a birth chart wheel');
  });
  it('beschriftet die Partner-Radix wie das Deckblatt', () => {
    expect(texte('de').partner).toEqual({
      a: { name: 'Clara', datum: '5. November 1989 · 03:35 MEZ', ort: 'Hamburg' },
      b: { name: 'Jonas', datum: '22. Dezember 1990 · 07:20 MEZ', ort: 'Freiburg' },
      paarName: 'Clara & Jonas',
      paar: 'Zwei Geburtsbilder nebeneinander: Clara und Jonas',
      doppel: 'Die Geburtsbilder von Clara und Jonas verbinden sich zu einer Doppelradix',
    });
    expect(texte('en').partner).toEqual({
      a: { name: 'Clara', datum: '5 November 1989 · 03:35 CET', ort: 'Hamburg' },
      b: { name: 'Jonas', datum: '22 December 1990 · 07:20 CET', ort: 'Freiburg' },
      paarName: 'Clara & Jonas',
      paar: 'Two birth charts side by side: Clara and Jonas',
      doppel: 'The birth charts of Clara and Jonas merge into a combined synastry chart',
    });
  });
});
