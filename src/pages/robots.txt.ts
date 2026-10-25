import type { APIRoute } from 'astro';

// Bestellbestätigung und Danke-Seite sind ausgeschlossen
export const GET: APIRoute = ({ site }) =>
  import.meta.env.PUBLIC_VORSCHAU === '1'
    ? new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    :
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /danke', 'Disallow: /en/thank-you', '', `Sitemap: ${new URL('sitemap-index.xml', site)}`].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
