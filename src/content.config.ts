import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Ausführliche Antworten in den FAQ: eine Markdown-Datei je Thema, der Dateiname wird zur Adresse /fragen/<name>.
// Englische Artikel liegen unter en/ und erscheinen unter /en/faq/<name>.
const ratgeber = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ratgeber' }),
  schema: z.object({
    title: z.string().max(65), // Seitentitel für Google, Suchbegriff vorne
    description: z.string().max(160),
    h1: z.string(),
    frage: z.string(), // so erscheint der Artikel in der FAQ-Liste
    keyword: z.string(),
    teaser: z.string(),
    published: z.coerce.date(),
    draft: z.boolean().default(true),
    de: z.string().optional(), // englische Artikel: Dateiname des deutschen Gegenstücks
  }),
});

export const collections = { ratgeber };
