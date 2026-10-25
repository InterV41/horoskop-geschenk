// Drehbuch des Kosmos-Flugs: Was passiert in welcher Sekunde? Rein rechnend, ohne DOM.
// Ein einziger, durchgehender Zoom wie im Vorbild (Zoom aus der Erde hinaus), nur rückwärts:
// Milchstraße → Orion-Arm → Sterne ziehen vorbei → Sonne → Sonnensystem → Erde.
// Auf der Erde setzt die bisherige Verwandlung ein: Die Erde wird zur Mitte, die Radix entsteht.
import { glatt, tempo, teil, EINSTIEG } from '../../../src/scripts/kosmos/zeitplan';
import { ASC0, ASC_V } from '../../../src/scripts/kosmos/layout';

export const FPS = 30;
export const SEKUNDEN = 24;
export const BILDER = FPS * SEKUNDEN;

/* Bild 1080 × 1080. Das Rad der Radix füllt 80 % davon, ringsum bleibt Raum für die Galaxie,
   die auf der Seite weich in den Hintergrund ausläuft. */
export const BREITE = 1080;
export const MITTE = BREITE / 2;
export const RAD_ANTEIL = 0.8;
export const PX = (BREITE * RAD_ANTEIL) / 940; // Bildpunkte je Einheit der Radix-Zeichenfläche bei Maßstab 1
export const BRENNWEITE = BREITE * 1.2; // Kamera: Bildpunkte bei Abstand 1

/* Tempo wie auf der Seite (KosmosRadix: TEMPO 0,55), damit die Übergabe ohne Ruck klappt */
export const SEITENTEMPO = 0.55;

/* Übergabe an die laufende Radix der Seite: Diese startet mit Uhr { t: UEBERGABE_T, tau: 0 } */
export const UEBERGABE_PHI = 9.5; // Sekunde im Seitenzyklus: kurz nach der fertigen Verwandlung
export const UEBERGABE_T = UEBERGABE_PHI - EINSTIEG;
const ASC_ENDE = ASC0 + ASC_V * UEBERGABE_PHI;

/* Wegmarken des Zooms: Sekunde → ln(Maßstab des Sonnensystems). Maßstab 1 = Sonnensystem füllt das Rad. */
const LN_ERDE = Math.log(23);
const MARKEN: [number, number][] = [
  [0, -18.15], // ganze Milchstraße
  [2.6, -17.25], // langsames Heranschweben
  [5.4, -14.6], // in den Orion-Arm
  [7.6, -9.4], // Sterne ziehen vorbei
  [9.7, -3.4], // ein Stern wird zur Sonne
  [11.5, 0], // das Sonnensystem steht
  [12.4, 0.06],
  [15.1, LN_ERDE], // nah an der Erde
  [16.3, LN_ERDE + 0.08],
];
export const VERWANDLUNG_AB = 16.3;
export const VERWANDLUNG_BIS = 21.8;
export const SCHWENK_AB = 12.4; // Kamera löst sich von der Sonne und sucht die Erde
export const SCHWENK_BIS = 15.1;

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

/* Verwandlungsgrad wie in der Endlosschleife der Seite */
export function verwandlung(t: number): number {
  return glatt((t - VERWANDLUNG_AB) / (VERWANDLUNG_BIS - VERWANDLUNG_AB));
}

/* ln(Maßstab): bis zur Verwandlung die Kurve, danach zieht die Kamera mit der Verwandlung zurück auf 1 */
export function lnMassstab(t: number): number {
  if (t < VERWANDLUNG_AB) return zoomKurve(t);
  const start = zoomKurve(VERWANDLUNG_AB);
  return start * (1 - teil(verwandlung(t), 0, 0.82));
}

/* Modellzeit und Aszendent je Bild, rückwärts vom Übergabezustand gerechnet: am letzten Bild
   genau tau 0 und der Aszendent, mit dem die Seite weitermacht. */
const TAU = new Float64Array(BILDER + 1);
{
  const dt = SEITENTEMPO / FPS;
  TAU[BILDER] = 0;
  for (let b = BILDER - 1; b >= 0; b--) TAU[b] = TAU[b + 1] - tempo(verwandlung((b + 0.5) / FPS)) * dt;
}
export function modellzeit(bild: number): number {
  const b = Math.min(BILDER, Math.max(0, bild));
  const i = Math.floor(b), f = b - i;
  return i >= BILDER ? TAU[BILDER] : TAU[i] + (TAU[i + 1] - TAU[i]) * f;
}
export function aszendentImFilm(t: number): number {
  return ASC_ENDE - ASC_V * SEITENTEMPO * (SEKUNDEN - t);
}

/* Weiche Treppe zwischen zwei Werten von x */
export function rampe(x: number, von: number, bis: number): number {
  return glatt((x - von) / (bis - von));
}
