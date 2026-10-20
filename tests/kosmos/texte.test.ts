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
});
