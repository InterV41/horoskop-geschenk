// Drehbuch des Kosmos-Flugs: Was passiert in welcher Sekunde? Rein rechnend, ohne DOM.
// Ein einziger, durchgehender Zoom wie im Vorbild (Zoom aus der Erde hinaus), nur rückwärts:
// Milchstraße → Orion-Arm → Sterne ziehen vorbei → Sonne → Sonnensystem → Erde.
// Auf der Erde setzt die bisherige Verwandlung ein: Die Erde wird zur Mitte, die Radix entsteht.
import { glatt, teil } from '../../../src/scripts/kosmos/zeitplan';
import { FLUG_FPS, FLUG_SEKUNDEN, FLUG_BILDER, FLUG_TEMPO, RAD_ANTEIL, VERWANDLUNG_AB, verwandlung } from '../../../src/scripts/kosmos/flug';
export { FLUG_TEMPO };
export { SEITENTEMPO, VERWANDLUNG_AB, VERWANDLUNG_BIS, verwandlung, modellzeit, aszendentImFilm } from '../../../src/scripts/kosmos/flug';

export const FPS = FLUG_FPS;
export const SEKUNDEN = FLUG_SEKUNDEN;
export const BILDER = FLUG_BILDER;

/* Bild 1080 × 1080. Das Rad der Radix füllt 80 % davon, ringsum bleibt Raum für die Galaxie,
   die auf der Seite weich in den Hintergrund ausläuft. */
export const BREITE = 1080;
export const MITTE = BREITE / 2;
export const PX = (BREITE * RAD_ANTEIL) / 940; // Bildpunkte je Einheit der Radix-Zeichenfläche bei Maßstab 1
export const BRENNWEITE = BREITE * 1.2; // Kamera: Bildpunkte bei Abstand 1

/* Wegmarken des Zooms: Sekunde → ln(Maßstab des Sonnensystems). Maßstab 1 = Sonnensystem füllt das Rad. */
const LN_ERDE = Math.log(40);
const MARKEN: [number, number][] = [
  [0, -18.15], // ganze Milchstraße
  [2.6 * FLUG_TEMPO, -17.25], // langsames Heranschweben
  [5.4 * FLUG_TEMPO, -14.6], // in den Orion-Arm
  [7.6 * FLUG_TEMPO, -9.4], // Sterne ziehen vorbei
  [9.7 * FLUG_TEMPO, -3.4], // ein Stern wird zur Sonne
  [11.5 * FLUG_TEMPO, 0], // das Sonnensystem steht
  [12.4 * FLUG_TEMPO, 0.06],
  [15.1 * FLUG_TEMPO, LN_ERDE], // nah an der Erde
  [16.3 * FLUG_TEMPO, LN_ERDE + 0.08],
];
export const SCHWENK_AB = 12.4 * FLUG_TEMPO; // Kamera löst sich von der Sonne und sucht die Erde
export const SCHWENK_BIS = 15.1 * FLUG_TEMPO;

/* Monotone kubische Kurve durch die Wegmarken (Fritsch-Carlson): kein Überschwingen, kein Knick */
const steig = (() => {
  const n = MARKEN.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((MARKEN[i + 1][1] - MARKEN[i][1]) / (MARKEN[i + 1][0] - MARKEN[i][0]));
  m[0] = 0; // ruhiger Anfang
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]) * 0.9 + 0.1 * Math.min(d[i - 1], d[i]);
  // an den Haltepunkten (Sonnensystem steht) sanft abbremsen
  m[5] = 0.03; m[6] = 0.05;
  return m;
})();

function zoomKurve(t: number): number {
  if (t <= MARKEN[0][0]) return MARKEN[0][1];
  for (let i = 0; i < MARKEN.length - 1; i++) {
    const [t0, z0] = MARKEN[i], [t1, z1] = MARKEN[i + 1];
    if (t > t1) continue;
    const h = t1 - t0, s = (t - t0) / h;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    return h00 * z0 + h10 * h * steig[i] + h01 * z1 + h11 * h * steig[i + 1];
  }
  const letzte = MARKEN[MARKEN.length - 1];
  return letzte[1] + steig[MARKEN.length - 1] * (t - letzte[0]) * 0.3;
}

/* ln(Maßstab): bis zur Verwandlung die Kurve, danach zieht die Kamera mit der Verwandlung zurück auf 1 */
export function lnMassstab(t: number): number {
  if (t < VERWANDLUNG_AB) return zoomKurve(t);
  const start = zoomKurve(VERWANDLUNG_AB);
  return start * (1 - teil(verwandlung(t), 0, 0.64));
}

/* Weiche Treppe zwischen zwei Werten von x */
export function rampe(x: number, von: number, bis: number): number {
  return glatt((x - von) / (bis - von));
}
