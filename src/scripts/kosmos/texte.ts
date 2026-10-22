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
    /* Erfundenes Paar; Daten passend zu Sonne und Aszendent der gezeigten Räder beim Start */
    partner: {
      a: { name: 'Clara', datum: '5. November 1989 · 03:35 MEZ', ort: 'Hamburg' },
      b: { name: 'Jonas', datum: '22. Dezember 1990 · 07:20 MEZ', ort: 'Freiburg' },
      paarName: 'Clara & Jonas',
      paar: 'Zwei Geburtsbilder nebeneinander: Clara und Jonas',
      doppel: 'Die Geburtsbilder von Clara und Jonas verbinden sich zu einer Doppelradix',
    },
  },
  en: {
    tierkreis: ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'],
    beschreibung: 'Animation: the solar system transforms into a birth chart wheel',
    partner: {
      a: { name: 'Clara', datum: '5 November 1989 · 03:35 CET', ort: 'Hamburg' },
      b: { name: 'Jonas', datum: '22 December 1990 · 07:20 CET', ort: 'Freiburg' },
      paarName: 'Clara & Jonas',
      paar: 'Two birth charts side by side: Clara and Jonas',
      doppel: 'The birth charts of Clara and Jonas merge into a combined synastry chart',
    },
  },
};

export function texte(s: Sprache) {
  return TEXTE[s];
}
