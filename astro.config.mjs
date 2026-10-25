import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Seiten, die nicht in die Sitemap gehören
const ausgeschlossen = ['/danke', '/en/thank-you', '/warenkorb', '/en/cart', '/404', '/partnerschaftshoroskop', '/kinderhoroskop', '/en/partnership-horoscope', '/en/child-horoscope'];

export default defineConfig({
  site: 'https://horoskop-geschenk.de',
  trailingSlash: 'never',
  build: { format: 'file' },
  redirects: {
    '/vorschau': '/geburtshoroskop#leseprobe',
    // Die zwei Fassungen sind jetzt ein Abschnitt der Geburtshoroskop-Seite
    '/hell-oder-dunkel': '/geburtshoroskop#fassungen',
    '/en/light-or-dark': '/en/birth-chart#fassungen',
    // Kontakt steht als Feld am Ende der FAQ-Seite
    '/kontakt': '/fragen#kontakt',
    '/en/contact': '/en/faq#kontakt',
    // Ratgeber und Fragen sind zusammengelegt
    '/ratgeber': '/fragen',
    '/ratgeber/[slug]': '/fragen/[slug]',
    '/en/guide': '/en/faq',
    '/en/guide/[slug]': '/en/faq/[slug]',
  },
  integrations: [
    sitemap({
      filter: (page) => !ausgeschlossen.some((p) => new URL(page).pathname.startsWith(p)),
    }),
  ],
});
