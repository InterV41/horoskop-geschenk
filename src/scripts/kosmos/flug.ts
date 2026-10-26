// Kosmos-Flug: Zeitachse, die der Film (video/src/flug) und die Startseite teilen.
// Der Film fliegt von der Milchstraße bis zur Erde, dann verwandelt sich alles in die Radix.
// Am Ende übernimmt die Live-Radix der Seite genau in dem Zustand, in dem der Film aufhört.
// Reine Rechnung ohne DOM.
import { EINSTIEG, TEMPO_RADIX, TEMPO_SEITE, glatt, tempo, type Uhr } from './zeitplan';
import { layout, ASC0, ASC_V, type Layout } from './layout';

export const FLUG_FPS = 30;
/* Gesamttempo des Flugs: 4/3 = ein Drittel langsamer als der erste Schnitt (Wunsch von Valentin) */
export const FLUG_TEMPO = 4 / 3;
/* Haltezeit im Sonnensystem (Poster-Ansicht mit Bahnen), eingeschoben zwischen Ankunft und Schwenk zur Erde */
export const FLUG_HALT = 2;
export const FLUG_SEKUNDEN = 24 * FLUG_TEMPO + FLUG_HALT;
export const FLUG_BILDER = FLUG_FPS * FLUG_SEKUNDEN;

/* Der Film läuft im selben Tempo wie die Radix auf der Seite */
export const SEITENTEMPO = TEMPO_SEITE;

/* Bildanteil der Radix im Film: Das Rad füllt 80 % der Breite, ringsum liegt Raum für die Galaxie.
   Auf der Seite ist der Film deshalb um diesen Faktor größer als das Rad. */
export const RAD_ANTEIL = 0.8;

/* Die Verwandlung Erde → Radix im Film, in Sekunden ab Filmbeginn */
export const VERWANDLUNG_AB = 16.3 * FLUG_TEMPO + FLUG_HALT;
export const VERWANDLUNG_BIS = 21.8 * FLUG_TEMPO + FLUG_HALT;

/* Sekunde im Zyklus der Endlosschleife, mit der die Seite nach dem Film weitermacht:
   kurz nach der fertigen Verwandlung, die Radix steht */
export const UEBERGABE_PHI = 9.5;
const UEBERGABE_T = UEBERGABE_PHI - EINSTIEG;
const ASC_ENDE = ASC0 + ASC_V * UEBERGABE_PHI;

/* Verwandlungsgrad wie in der Endlosschleife der Seite: 0 Sonnensystem, 1 Radix */
export function verwandlung(t: number): number {
  return glatt((t - VERWANDLUNG_AB) / (VERWANDLUNG_BIS - VERWANDLUNG_AB));
}

/* Modellzeit je Bild, rückwärts vom Übergabezustand gerechnet: am letzten Bild genau tau 0 */
let TAU: Float64Array | null = null;
function tauListe(): Float64Array {
  if (TAU) return TAU;
  const liste = new Float64Array(FLUG_BILDER + 1);
  const dt = SEITENTEMPO / FLUG_FPS;
  for (let b = FLUG_BILDER - 1; b >= 0; b--) liste[b] = liste[b + 1] - tempo(verwandlung((b + 0.5) / FLUG_FPS)) * dt;
  return (TAU = liste);
}
export function modellzeit(bild: number): number {
  const liste = tauListe();
  const b = Math.min(FLUG_BILDER, Math.max(0, bild));
  const i = Math.floor(b), f = b - i;
  return i >= FLUG_BILDER ? liste[FLUG_BILDER] : liste[i] + (liste[i + 1] - liste[i]) * f;
}
export function aszendentImFilm(t: number): number {
  return ASC_ENDE - ASC_V * SEITENTEMPO * (FLUG_SEKUNDEN - t);
}

/* Layout zu einem Filmbild, ohne gemerkte Drehwege: für die verborgene Szene und die hinausfliegenden
   Sterne auf der Seite. Der Film selbst rechnet die Drehwege für jedes Bild exakt nach. */
export function flugLayout(bild: number): Layout {
  const t = bild / FLUG_FPS;
  return layout(modellzeit(bild), verwandlung(t), aszendentImFilm(t));
}

/* Uhr der Seite nach dem letzten Filmbild */
export function flugUhrAmEnde(): Uhr {
  return { t: UEBERGABE_T, tau: 0 };
}

/* Verwandlungsgrad je Filmbild */
export function flugPhase(bild: number): number {
  return verwandlung(bild / FLUG_FPS);
}

/* Uhr der Seite zu einem Filmbild. In der fertigen Radix passt sie genau zum Bild. Davor (Flug durchs All)
   gibt es auf der Seite kein Gegenstück: Bricht der Film dort ab, beginnt die Live-Verwandlung von vorn. */
export function flugUhr(bild: number): Uhr {
  if (flugPhase(bild) < 1) return { t: 0, tau: 0 };
  return { t: UEBERGABE_T - (FLUG_SEKUNDEN - bild / FLUG_FPS) * SEITENTEMPO, tau: modellzeit(bild) };
}

/* Tempo der Radix-Phase, nur zur Prüfung: am Ende läuft die Sonne wie auf der Seite */
export const SONNENTEMPO_AM_ENDE = TEMPO_RADIX * SEITENTEMPO;

/* Zeitlupe (Wunsch von Valentin): Ab dem Sonnensystem läuft alles 1,5-mal langsamer, bis die Radix steht.
   Der Ablauf oben (Kamera, Planeten, Verwandlung) bleibt in „Ablaufzeit“ beschrieben; der Film rechnet jedes
   Filmbild in ein Ablaufbild um. Vor der Übergabe läuft er wieder im normalen Tempo, damit die Live-Radix
   im selben Takt weitermacht. Die Übergänge des Tempos sind weich. */
export const ZEITLUPE = 1.5;
const LUPE_AB = 11.5 * FLUG_TEMPO; // das Sonnensystem steht
const LUPE_BIS = VERWANDLUNG_BIS; // die Radix steht
const LUPE_WEICH = 0.6; // Sekunden Ablaufzeit für den Übergang des Tempos
/* Ablaufsekunden je Filmsekunde, abhängig von der Ablaufzeit */
function lupenTempo(alt: number): number {
  const w = glatt((alt - (LUPE_AB - LUPE_WEICH)) / (2 * LUPE_WEICH)) * (1 - glatt((alt - (LUPE_BIS - LUPE_WEICH)) / (2 * LUPE_WEICH)));
  return 1 - (1 - 1 / ZEITLUPE) * w;
}
const TEILSCHRITTE = 24;
/* Länge des Films in Bildern */
export const FILM_BILDER = (() => {
  let neu = 0;
  const h = 1 / (FLUG_FPS * TEILSCHRITTE);
  for (let alt = 0; alt < FLUG_SEKUNDEN; alt += h) neu += h / lupenTempo(alt + h / 2);
  return Math.round(neu * FLUG_FPS);
})();
export const FILM_SEKUNDEN = FILM_BILDER / FLUG_FPS;
/* Ablaufbild je Filmbild, vom Ende her gerechnet: das letzte Filmbild ist genau das letzte Ablaufbild */
let ABLAUF: Float64Array | null = null;
function ablaufListe(): Float64Array {
  if (ABLAUF) return ABLAUF;
  const liste = new Float64Array(FILM_BILDER + 1);
  let alt = FLUG_SEKUNDEN;
  liste[FILM_BILDER] = alt * FLUG_FPS;
  const h = 1 / (FLUG_FPS * TEILSCHRITTE);
  for (let b = FILM_BILDER - 1; b >= 0; b--) {
    for (let k = 0; k < TEILSCHRITTE; k++) alt -= h * lupenTempo(alt - (h * lupenTempo(alt)) / 2);
    liste[b] = Math.max(0, alt * FLUG_FPS);
  }
  return (ABLAUF = liste);
}
export function ablaufBild(filmBild: number): number {
  const liste = ablaufListe();
  const b = Math.min(FILM_BILDER, Math.max(0, filmBild));
  const i = Math.floor(b), f = b - i;
  return i >= FILM_BILDER ? liste[FILM_BILDER] : liste[i] + (liste[i + 1] - liste[i]) * f;
}

/* Auf der Seite beginnt der Flug erst mitten im Sternenflug (Einstieg 11 s Filmzeit, Wunsch von Valentin: 3 s
   später als zuvor). Die Videos für die Seite sind ab hier zugeschnitten. Bild 0 der Seite ist Filmbild
   FLUG_EINSTIEG_BILD; der Ablauf dazu kommt über ablaufBild. */
export const FLUG_EINSTIEG_BILD = Math.round((6 * FLUG_TEMPO + 3) * FLUG_FPS);
export const flugSeite = {
  laenge: FILM_BILDER - FLUG_EINSTIEG_BILD,
  layout: (bild: number) => flugLayout(ablaufBild(bild + FLUG_EINSTIEG_BILD)),
  uhr: (bild: number) => flugUhr(ablaufBild(bild + FLUG_EINSTIEG_BILD)),
  phase: (bild: number) => flugPhase(ablaufBild(bild + FLUG_EINSTIEG_BILD)),
};
