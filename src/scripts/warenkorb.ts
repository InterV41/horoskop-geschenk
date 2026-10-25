// Warenkorb im Browser. Die Geburtsdaten verlassen das Gerät erst beim Bezahlen und werden nach drei Tagen
// ohne Bestellung von selbst verworfen. Alles in try/catch, damit die Seite auch ohne Speicher funktioniert.

export type Fassung = 'hell' | 'dunkel' | 'beide';
export interface Posten {
  id: string;
  vorname: string;
  datum: string; // JJJJ-MM-TT
  zeit: string | null; // HH:MM oder null, wenn unbekannt
  ort: string;
  lat: string;
  lon: string;
  zeitzone: string;
  fassung: Fassung;
}

const SCHLUESSEL = 'warenkorb';
const HALTBAR_MS = 3 * 24 * 60 * 60 * 1000;

export function lesen(): Posten[] {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return [];
    const d = JSON.parse(roh) as { gespeichert: number; posten: Posten[] };
    if (Date.now() - d.gespeichert > HALTBAR_MS) {
      localStorage.removeItem(SCHLUESSEL);
      return [];
    }
    return Array.isArray(d.posten) ? d.posten : [];
  } catch {
    return [];
  }
}

function schreiben(posten: Posten[]) {
  try {
    if (posten.length) localStorage.setItem(SCHLUESSEL, JSON.stringify({ gespeichert: Date.now(), posten }));
    else localStorage.removeItem(SCHLUESSEL);
  } catch {}
  document.dispatchEvent(new CustomEvent('warenkorb'));
}

export function hinzufuegen(p: Omit<Posten, 'id'>) {
  const posten = lesen();
  posten.push({ ...p, id: Math.random().toString(36).slice(2, 10) });
  schreiben(posten);
}

export function entfernen(id: string) {
  schreiben(lesen().filter((p) => p.id !== id));
}

export function leeren() {
  schreiben([]);
}

// Preise kommen aus site.ts und werden der Seite als data-Attribut mitgegeben
export interface Preise {
  grund: number;
  aufpreis: number;
}
export const preisVon = (p: Posten, preise: Preise) => preise.grund + (p.fassung === 'beide' ? preise.aufpreis : 0);
export const summe = (posten: Posten[], preise: Preise) => posten.reduce((s, p) => s + preisVon(p, preise), 0);
export const euro = (betrag: number, lang: string) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(betrag) ? 0 : 2,
  }).format(betrag);
