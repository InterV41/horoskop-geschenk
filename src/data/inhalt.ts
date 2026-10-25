// Aufbau des Horoskops, wie im Testhoroskop "Mia"
import type { Lang } from '../i18n';

interface Aufbau {
  vorspann: string[];
  teile: { titel: string; kapitel: { nr: string; titel: string }[] }[];
  anhang: string[];
}

export const inhalt: Record<Lang, Aufbau> = {
  de: {
    vorspann: ['Die Geschichte der Astrologie', 'Dein Geburtsbild', 'Dein Geburtsbild lesen'],
    teile: [
      { titel: 'Einführung', kapitel: [{ nr: 'I', titel: 'Einführung' }] },
      {
        titel: 'Wer du bist',
        kapitel: [
          { nr: 'II', titel: 'Dein Grundgerüst' },
          { nr: 'III', titel: 'Innenwelt und Gefühlsleben' },
          { nr: 'IV', titel: 'Dein Schwerpunkt' },
          { nr: 'V', titel: 'Denken und Ausdruck' },
        ],
      },
      {
        titel: 'Wie du lebst und liebst',
        kapitel: [
          { nr: 'VI', titel: 'Liebe und Partnerschaft' },
          { nr: 'VII', titel: 'Familie und Herkunft' },
          { nr: 'VIII', titel: 'Beruf und öffentliche Rolle' },
          { nr: 'IX', titel: 'Kreativität und Ausdruck' },
        ],
      },
      {
        titel: 'Wo du wächst',
        kapitel: [
          { nr: 'X', titel: 'Deine Stärken im Einzelnen' },
          { nr: 'XI', titel: 'Wo Entwicklung liegt' },
          { nr: 'XII', titel: 'Dein Lebensthema' },
          { nr: 'XIII', titel: 'Kraftquellen und Grenzen' },
          { nr: 'XIV', titel: 'Stärken und wo Unterstützung hilft' },
        ],
      },
      {
        titel: 'Was kommt, was bleibt',
        kapitel: [
          { nr: 'XV', titel: 'Gegenwart' },
          { nr: 'XVI', titel: 'Was dich trägt' },
          { nr: 'XVII', titel: 'Der Zeitrahmen' },
        ],
      },
    ],
    anhang: ['Rechtlicher Hinweis', 'Glossar'],
  },
  en: {
    vorspann: ['The history of astrology', 'Your natal chart', 'Reading your natal chart'],
    teile: [
      { titel: 'Introduction', kapitel: [{ nr: 'I', titel: 'Introduction' }] },
      {
        titel: 'Who you are',
        kapitel: [
          { nr: 'II', titel: 'Your foundation' },
          { nr: 'III', titel: 'Inner world and emotions' },
          { nr: 'IV', titel: 'Your focus' },
          { nr: 'V', titel: 'Thinking and expression' },
        ],
      },
      {
        titel: 'How you live and love',
        kapitel: [
          { nr: 'VI', titel: 'Love and partnership' },
          { nr: 'VII', titel: 'Family and origins' },
          { nr: 'VIII', titel: 'Career and public role' },
          { nr: 'IX', titel: 'Creativity and expression' },
        ],
      },
      {
        titel: 'Where you grow',
        kapitel: [
          { nr: 'X', titel: 'Your strengths in detail' },
          { nr: 'XI', titel: 'Where growth lies' },
          { nr: 'XII', titel: 'Your life theme' },
          { nr: 'XIII', titel: 'Sources of strength and limits' },
          { nr: 'XIV', titel: 'Strengths and where support helps' },
        ],
      },
      {
        titel: 'What comes, what stays',
        kapitel: [
          { nr: 'XV', titel: 'The present' },
          { nr: 'XVI', titel: 'What carries you' },
          { nr: 'XVII', titel: 'The time frame' },
        ],
      },
    ],
    anhang: ['Legal note', 'Glossary'],
  },
};
