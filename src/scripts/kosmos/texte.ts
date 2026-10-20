// Sichtbare Texte der Animation je Sprache. ASC, IC, DC und MC heißen in beiden Sprachen gleich.

export type Sprache = 'de' | 'en';

/* Aus einem lang-Wert wie "en-GB" die Sprache machen. Alles andere bleibt Deutsch. */
export function sprache(lang: string | undefined): Sprache {
  return lang?.toLowerCase().startsWith('en') ? 'en' : 'de';
}

const TEXTE = {
  de: {
    tierkreis: ['WIDDER', 'STIER', 'ZWILLINGE', 'KREBS', 'LÖWE', 'JUNGFRAU', 'WAAGE', 'SKORPION', 'SCHÜTZE', 'STEINBOCK', 'WASSERMANN', 'FISCHE'],
    beschreibung: 'Animation: Das Sonnensystem verwandelt sich in ein Geburtshoroskop-Rad',
  },
  en: {
    tierkreis: ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'],
    beschreibung: 'Animation: the solar system transforms into a birth chart wheel',
  },
};

export function texte(s: Sprache) {
  return TEXTE[s];
}
