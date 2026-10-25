// Ausführliche FAQ-Artikel je Sprache: deutsche liegen direkt im Ordner, englische unter en/
import { getCollection, type CollectionEntry } from 'astro:content';
import { routes, type Lang } from '../i18n';

type Artikel = CollectionEntry<'ratgeber'>;
const istEnglisch = (a: Artikel) => a.id.startsWith('en/');
export const slugVon = (a: Artikel) => a.id.replace(/^en\//, '');
export const pfadVon = (a: Artikel) => `${routes.fragen[istEnglisch(a) ? 'en' : 'de']}/${slugVon(a)}`;

// Entwürfe nur im Entwicklungsmodus
export async function artikelListe(lang: Lang) {
  const alle = await getCollection('ratgeber', (a) => import.meta.env.DEV || !a.data.draft);
  return alle.filter((a) => istEnglisch(a) === (lang === 'en')).sort((a, b) => a.data.h1.localeCompare(b.data.h1, lang));
}

// Adresse des Gegenstücks in der anderen Sprache, falls es eins gibt
export async function gegenstueck(a: Artikel): Promise<string | null> {
  const alle = await getCollection('ratgeber', (x) => import.meta.env.DEV || !x.data.draft);
  if (istEnglisch(a)) {
    const de = alle.find((x) => !istEnglisch(x) && x.id === a.data.de);
    return de ? pfadVon(de) : null;
  }
  const en = alle.find((x) => istEnglisch(x) && x.data.de === a.id);
  return en ? pfadVon(en) : null;
}
