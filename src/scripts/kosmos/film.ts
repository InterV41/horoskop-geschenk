// Kosmos-Film: welcher Animationszustand zu welchem Filmbild gehört. Remotion rendert damit jedes Bild,
// die Seite rechnet beim Abspielen aus der Videozeit dasselbe aus. Reine Rechnung ohne DOM.
import { schritt, phase, EINSTIEG, TEMPO_SEITE, type Uhr } from './zeitplan';
import { layout, aszendent, type Layout } from './layout';
import { RADIX_REIHE } from './modell';

export const FILM_FPS = 30;
export const FILM_RUHE = FILM_FPS; // eine Sekunde fertige Radix am Ende, in der das Leuchten abklingt

let uhren: Uhr[] | null = null;

/* Zustand für jedes Filmbild, genau wie die Seite rechnet, nur mit festem Takt */
export function filmUhren(): readonly Uhr[] {
  if (uhren) return uhren;
  const weiter = (u: Uhr) => schritt(u, TEMPO_SEITE / FILM_FPS);
  const liste: Uhr[] = [{ t: 0, tau: 0 }];
  // bis zum ersten Bild der fertigen Radix …
  while (phase(liste[liste.length - 1].t + EINSTIEG) < 1) liste.push(weiter(liste[liste.length - 1]));
  // … und dann noch eine Sekunde Ruhe (dieses erste Bild zählt mit)
  for (let i = 1; i < FILM_RUHE; i++) liste.push(weiter(liste[liste.length - 1]));
  uhren = liste;
  return uhren;
}

export function filmLaenge(): number {
  return filmUhren().length;
}

const klemmBild = (bild: number) => Math.min(filmLaenge() - 1, Math.max(0, Math.round(bild)));

export function filmPhase(bild: number): number {
  return phase(filmUhren()[klemmBild(bild)].t + EINSTIEG);
}

export function filmLayout(bild: number): Layout {
  const u = filmUhren()[klemmBild(bild)];
  return layout(u.tau, filmPhase(bild), aszendent(u.t));
}

export interface Faden { x1: number; y1: number; x2: number; y2: number; deckkraft: number }

/* Feine Lichtstrahlen von der Erde zu jedem Körper, nur mitten in der Verwandlung */
export function lichtfaeden(l: Layout, bild: number): Faden[] {
  const q = (l.p - 0.15) / 0.7;
  const grund = q <= 0 || q >= 1 ? 0 : Math.sin(Math.PI * q);
  const e = l.koerper.erde;
  return RADIX_REIHE.map((r, i) => ({
    x1: e.x, y1: e.y, x2: l.koerper[r.id].x, y2: l.koerper[r.id].y,
    deckkraft: grund * (0.75 + 0.25 * Math.sin(bild * 0.9 + i * 2.1)),
  }));
}
