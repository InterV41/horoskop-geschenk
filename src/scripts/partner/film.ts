// Gemeinsamer Takt des Partner-Films: Das Video (Sand, aus video/) und die live gezeichneten Räder der Seite
// rechnen mit denselben Zahlen, damit beides genau übereinanderliegt.
import { ASC0, ASC_V } from '../kosmos/layout';
import { TEMPO_RADIX } from '../kosmos/zeitplan';
import { TAU_A, TAU_B, ASC_VERSATZ_B } from './paar';

export const FILM_FPS = 30;
export const FILM_BILDER = 360; // 12 Sekunden
const VORLAUF = 12; // Bilder, in denen Clara und Jonas noch ganz stehen
const NACHLAUF = 24; // Bilder mit der fertigen Doppelradix

/* Drehung wie auf der Seite: ein Viertel des Kosmos-Tempos */
const DREHTEMPO = 0.25;

export type FilmFormat = 'quer' | 'hoch';
/* Lage der Räder im Bild der Vorlage: Mitte x, y und Durchmesser in Pixeln */
export const FILM_LAGE: Record<FilmFormat, { w: number; h: number; a: readonly [number, number, number]; b: readonly [number, number, number]; d: readonly [number, number, number] }> = {
  quer: { w: 1920, h: 1080, a: [500, 540, 620], b: [1420, 540, 620], d: [960, 540, 900] },
  hoch: { w: 1080, h: 1920, a: [540, 520, 640], b: [540, 1400, 640], d: [540, 960, 980] },
};

/* Fortschritt des Übergangs (0 = Clara und Jonas ganz, 1 = Doppelradix fertig) aus der Bildnummer */
export function filmFortschritt(bild: number): number {
  return Math.min(1, Math.max(0, (bild - VORLAUF) / (FILM_BILDER - VORLAUF - NACHLAUF)));
}

/* Stand der Räder zu einer Bildnummer: Modellzeit und Aszendent von Clara und Jonas */
export function filmStand(bild: number) {
  const t = (bild / FILM_FPS) * DREHTEMPO;
  const ascA = ASC0 + ASC_V * t;
  return { tauA: TAU_A + TEMPO_RADIX * t, tauB: TAU_B + TEMPO_RADIX * t, ascA, ascB: ascA + ASC_VERSATZ_B };
}
