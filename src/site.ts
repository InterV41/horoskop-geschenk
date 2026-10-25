// Seitenweite Angaben, an einer Stelle änderbar
import { routes, type Lang, type Route } from './i18n';

export const site = {
  name: 'Horoskop-Geschenk.de', // sichtbarer Name: Kopfzeile, Titel, Fußzeile, Texte
  brand: 'Horoskop Geschenk', // nur für Suchmaschinen-Daten (JSON-LD, og:site_name)
  url: 'https://horoskop-geschenk.de',
  price: 35,
  priceLabel: { de: '35 €', en: '€35' } as Record<Lang, string>,
  // Beide Fassungen zusammen: Aufpreis auf den Grundpreis
  bothSurcharge: 5,
  bothSurchargeLabel: { de: '+ 5 €', en: '+ €5' } as Record<Lang, string>,
  bothPriceLabel: { de: '40 €', en: '€40' } as Record<Lang, string>,
  // Kleinunternehmerregelung noch offen: danach z. B. 'inkl. MwSt.' oder 'Kein Steuerausweis nach § 19 UStG'
  vatNote: { de: '', en: '' } as Record<Lang, string>,
  pages: 34,
  // davon individuell berechnet und geschrieben; je nach Geburtsbild schwankt der Umfang um eine Seite
  pagesIndividual: 20,
  umfang: {
    de: '34 Seiten, davon über 20 individuell berechnet und geschrieben',
    en: '34 pages, more than 20 of them individually calculated and written',
  } as Record<Lang, string>,
  umfangSchwankung: {
    de: 'Je nach Geburtsbild schwankt die Zahl um eine Seite.',
    en: 'Depending on the natal chart, the number varies by one page.',
  } as Record<Lang, string>,
  chapters: 17,
};

// Anbieter für Impressum, AGB, Widerruf und Datenschutz. Werte in eckigen Klammern sind Platzhalter
// und erscheinen auf der Seite markiert, bis sie ersetzt sind.
export const anbieter = {
  name: '[Vor- und Nachname]',
  strasse: '[Straße und Hausnummer]',
  ort: '[PLZ Ort]',
  land: { de: 'Deutschland', en: 'Germany' } as Record<Lang, string>,
  email: 'kontakt@horoskop-geschenk.de',
  telefon: '[Telefonnummer]',
  // Kleinunternehmer nach § 19 UStG oder Umsatzsteuer-ID, sobald geklärt
  steuer: '[Kleinunternehmer nach § 19 UStG oder USt-IdNr.]',
  stand: { de: 'Oktober 2026', en: 'October 2026' } as Record<Lang, string>,
};

// Lieferzeit. Phase 1: Erstellung von Hand, 48 Stunden. Phase 2: automatisch, 15 Minuten.
// Nur hier ändern, alle Seiten in beiden Sprachen ziehen mit.
const PHASE = 2 as 1 | 2;
export const delivery = {
  phase: PHASE,
  duration: (lang: Lang) =>
    ({ de: PHASE === 1 ? '48 Stunden' : '15 Minuten', en: PHASE === 1 ? '48 hours' : '15 minutes' })[lang],
  sentence: (lang: Lang) =>
    ({
      de: `Dein Horoskop kommt innerhalb von ${PHASE === 1 ? '48 Stunden' : '15 Minuten'} per Mail.`,
      en: `Your horoscope arrives by email within ${PHASE === 1 ? '48 hours' : '15 minutes'}.`,
    })[lang],
};

// Kopfzeile: Start, Produkte und About, jeweils mit Untermenü. Die Geschichte steht als Eintrag in den FAQ.
type Ziel = { label: string; route: Route; anker?: string };
type Kopfpunkt = Ziel & { unter?: Ziel[] };
const KOPF: Record<Lang, Kopfpunkt[]> = {
  de: [
    { label: 'Start', route: 'start' },
    {
      label: 'Produkte',
      route: 'produkt',
      unter: [
        { label: 'Geburtshoroskop', route: 'produkt' },
        { label: 'Partnerschaftshoroskop', route: 'partner' },
        { label: 'Kinderhoroskop', route: 'kinder' },
      ],
    },
    {
      label: 'About',
      route: 'about',
      unter: [
        { label: 'Über Horoskop-Geschenk.de', route: 'about' },
        { label: 'Häufige Fragen', route: 'fragen' },
        { label: 'Kontakt', route: 'fragen', anker: '#kontakt' },
      ],
    },
  ],
  en: [
    { label: 'Home', route: 'start' },
    {
      label: 'Products',
      route: 'produkt',
      unter: [
        { label: 'Birth chart', route: 'produkt' },
        { label: 'Partnership horoscope', route: 'partner' },
        { label: 'Child horoscope', route: 'kinder' },
      ],
    },
    {
      label: 'About',
      route: 'about',
      unter: [
        { label: 'About Horoskop-Geschenk.de', route: 'about' },
        { label: 'FAQ', route: 'fragen' },
        { label: 'Contact', route: 'fragen', anker: '#kontakt' },
      ],
    },
  ],
};
const zielHref = (z: Ziel, lang: Lang) => routes[z.route][lang] + (z.anker ?? '');
export const kopfmenue = (lang: Lang) =>
  KOPF[lang].map((n) => ({
    label: n.label,
    href: zielHref(n, lang),
    pfad: routes[n.route][lang], // ohne Anker, für die Markierung der aktuellen Seite
    unter: n.unter?.map((u) => ({ label: u.label, href: zielHref(u, lang), pfad: routes[u.route][lang] })),
  }));

const LEGAL = {
  de: [
    { label: 'Impressum', route: 'impressum' },
    { label: 'Datenschutz', route: 'datenschutz' },
    { label: 'AGB', route: 'agb' },
    { label: 'Widerruf', route: 'widerruf' },
  ],
  en: [
    { label: 'Legal notice', route: 'impressum' },
    { label: 'Privacy', route: 'datenschutz' },
    { label: 'Terms', route: 'agb' },
    { label: 'Withdrawal', route: 'widerruf' },
  ],
} as const;
export const legal = (lang: Lang) =>
  LEGAL[lang].map((n) => ({ label: n.label, href: routes[n.route][lang] + ('anker' in n ? n.anker : '') }));

