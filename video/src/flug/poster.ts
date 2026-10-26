// Poster-Ansicht im Sonnensystem, wie ein klassisches Sonnensystem-Poster: flache Schrägsicht von der Seite,
// Bahnen als feine helle Ellipsen von links unten nach rechts oben gekippt, die Sonne groß am linken Rand.
// Der Grad P (0…1) blendet zwischen der normalen Ansicht der Szene und dem Poster; vor dem Anflug auf
// die Erde ist P wieder 0, ab dann gilt die Geometrie der Radix-Szene unverändert.
import { BREITE, MITTE, PX, FLUG_TEMPO, SCHWENK_AB, rampe } from './drehbuch';

export const POSTER_K = 0.2; // Neigung: so flach wie auf dem Poster
export const POSTER_WINKEL = (-12 * Math.PI) / 180; // links unten nach rechts oben
export const POSTER_LN = Math.log(1.75); // Maßstab: Pluto reicht fast bis an den rechten Rand
export const POSTER_SONNE_X = 0.17 * BREITE; // Mitte der Sonne, am linken Rand angeschnitten
export const POSTER_SONNE_R = 112; // Bildpunkte

/* Ein: während das Sonnensystem ankommt; aus: zusammen mit dem Schwenk zur Erde */
export const POSTER_DA = 11.5 * FLUG_TEMPO + 0.4; // ab hier voll im Poster
export function posterGrad(t: number): number {
  return rampe(t, 11.5 * FLUG_TEMPO - 1.6, POSTER_DA) * (1 - rampe(t, SCHWENK_AB - 1.4, SCHWENK_AB + 1.0));
}

/* Punkt der Szene (ungekippt x, gekippt y = −sin · r · K) in die Poster-Geometrie überführen */
export function posterOrt(x: number, y: number, K: number, P: number): [number, number] {
  if (P <= 0) return [x, y];
  const r = Math.hypot(x, y / K), a = Math.atan2(-y / K, x);
  const k = K + (POSTER_K - K) * P, w = POSTER_WINKEL * P;
  const x1 = Math.cos(a) * r, y1 = -Math.sin(a) * r * k;
  return [x1 * Math.cos(w) - y1 * Math.sin(w), x1 * Math.sin(w) + y1 * Math.cos(w)];
}

/* Kameramitte im Poster (Einheiten der Szene), damit die Sonne links steht */
export function posterMitte(S: number): [number, number] {
  return [(MITTE - POSTER_SONNE_X) / (S * PX), 0];
}

/* Bahnellipse als Linie, in Bildpunkten */
export function zeichneBahn(
  ctx: CanvasRenderingContext2D,
  bildpunkt: (x: number, y: number) => [number, number],
  r: number, K: number, P: number, deckkraft: number, breite: number,
) {
  if (deckkraft <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = deckkraft;
  ctx.strokeStyle = '#cfd4e0';
  ctx.lineWidth = breite;
  ctx.beginPath();
  const n = 240;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const [x, y] = posterOrt(Math.cos(a) * r, -Math.sin(a) * r * K, K, P);
    const [px, py] = bildpunkt(x, y);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/* Weicher runder Rand im Poster: Sonne, Bahnen und Planeten laufen vor dem Videorand und innerhalb der
   dunkelblauen Fläche (hell) weich aus, statt an einer Kante zu enden. Voll bis INNEN, 0 ab AUSSEN. */
const INNEN = 0.3 * BREITE, AUSSEN = 0.42 * BREITE;
export function posterRand(ctx: CanvasRenderingContext2D, P: number) {
  if (P <= 0.001) return;
  const g = ctx.createRadialGradient(MITTE, MITTE, INNEN, MITTE, MITTE, AUSSEN);
  for (let i = 0; i <= 10; i++) {
    const x = i / 10, s = x * x * (3 - 2 * x); // weich
    g.addColorStop(x, `rgba(0,0,0,${(1 - P * s).toFixed(4)})`);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BREITE, BREITE);
  // außerhalb des Verlaufs gilt die letzte Farbe (1 − P)
  ctx.restore();
}
