// Leseprobe aus dem Testhoroskop "Mia" (erfundene Person): Beschriftung der Seiten
import type { Lang } from '../i18n';

// Beschriftung je Seite des Testhoroskops, nach dessen Inhaltsverzeichnis
export const TITEL: Record<number, [string, string]> = {
  1: ['Deckblatt, auch zum Aufhängen', 'Cover, also for framing'],
  2: ['Inhalt', 'Contents'],
  3: ['Die Geschichte der Astrologie', 'The history of astrology'],
  6: ['Dein Geburtsbild', 'Your natal chart'],
  7: ['Dein Geburtsbild lesen', 'Reading your natal chart'],
  9: ['I · Einführung', 'I · Introduction'],
  10: ['Teil I · Wer du bist', 'Part I · Who you are'],
  11: ['II · Dein Grundgerüst', 'II · Your foundation'],
  12: ['III · Innenwelt und Gefühlsleben', 'III · Inner world and emotions'],
  13: ['IV · Dein Schwerpunkt', 'IV · Your focus'],
  14: ['V · Denken und Ausdruck', 'V · Thinking and expression'],
  15: ['Teil II · Wie du lebst und liebst', 'Part II · How you live and love'],
  16: ['VI · Liebe und Partnerschaft', 'VI · Love and partnership'],
  18: ['VII · Familie und Herkunft', 'VII · Family and origins'],
  19: ['VIII · Beruf und öffentliche Rolle', 'VIII · Career and public role'],
  20: ['IX · Kreativität und Ausdruck', 'IX · Creativity and expression'],
  21: ['Teil III · Wo du wächst', 'Part III · Where you grow'],
  22: ['X · Deine Stärken im Einzelnen', 'X · Your strengths in detail'],
  23: ['XI · Wo Entwicklung liegt', 'XI · Where growth lies'],
  24: ['XII · Dein Lebensthema', 'XII · Your life theme'],
  25: ['XIII · Kraftquellen und Grenzen', 'XIII · Sources of strength and limits'],
  26: ['XIV · Stärken und wo Unterstützung hilft', 'XIV · Strengths and where support helps'],
  27: ['Teil IV · Was kommt, was bleibt', 'Part IV · What comes, what stays'],
  28: ['XV · Gegenwart', 'XV · The present'],
  29: ['XVI · Was dich trägt', 'XVI · What carries you'],
  30: ['Deine stärksten Eigenschaften', 'Your strongest traits'],
  31: ['XVII · Der Zeitrahmen', 'XVII · The time frame'],
  32: ['Rechtlicher Hinweis', 'Legal note'],
  33: ['Glossar', 'Glossary'],
};

export const seitenTitel = (lang: Lang) =>
  Object.fromEntries(Object.entries(TITEL).map(([k, v]) => [k, v[lang === 'de' ? 0 : 1]])) as Record<number, string>;

// Folgeseiten ohne eigenen Eintrag übernehmen die Beschriftung der vorigen Seite
export const titelVon = (nr: number, titel: Record<number, string>) => {
  let n = nr;
  while (!titel[n] && n > 1) n--;
  return titel[n];
};
