// Zweisprachigkeit: Deutsch unter /, Englisch unter /en/

export type Lang = 'de' | 'en';
export const langs: Lang[] = ['de', 'en'];

// Welche deutsche Adresse zu welcher englischen gehört. Einmal vergeben, nie wieder ändern.
export const routes = {
  start: { de: '/', en: '/en' },
  produkt: { de: '/geburtshoroskop', en: '/en/birth-chart' },
  partner: { de: '/partnerschaftshoroskop', en: '/en/partnership-horoscope' },
  kinder: { de: '/kinderhoroskop', en: '/en/child-horoscope' },
  bestellen: { de: '/bestellen', en: '/en/order' },
  warenkorb: { de: '/warenkorb', en: '/en/cart' },
  about: { de: '/about', en: '/en/about' },
  fragen: { de: '/fragen', en: '/en/faq' },
  geschichte: { de: '/geschichte-der-astrologie', en: '/en/history-of-astrology' },
  danke: { de: '/danke', en: '/en/thank-you' },
  impressum: { de: '/impressum', en: '/en/legal-notice' },
  datenschutz: { de: '/datenschutz', en: '/en/privacy' },
  agb: { de: '/agb', en: '/en/terms' },
  widerruf: { de: '/widerruf', en: '/en/withdrawal' },
} as const;
export type Route = keyof typeof routes;

// Beim Bauen enthält die Adresse die Dateiendung (/agb.html, /en.html), im Browser nicht. Hier vereinheitlicht.
export const normPath = (path: string): string =>
  path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';

export const langFromPath = (path: string): Lang => (/^\/en(\/|$)/.test(normPath(path)) ? 'en' : 'de');

// Gegenstück der aktuellen Adresse in der anderen Sprache. Unbekannte Adressen führen zur Startseite.
export function alternatePath(path: string, ziel: Lang): string {
  const sauber = normPath(path);
  for (const r of Object.values(routes)) {
    if (r.de === sauber || r.en === sauber) return r[ziel];
  }
  return routes.start[ziel];
}

export const localeOf = { de: 'de_DE', en: 'en_GB' } as const;
