// Zeitplan der Endlosschleife: Sonnensystem → Radix → Sonnensystem, ohne Anfang und Ende.

/* Dauer eines Durchlaufs in Sekunden und Einstieg: im Sonnensystem, 1,5 s vor der Verwandlung.
   So sieht man beim Öffnen gleich, wie aus dem Sonnensystem die Radix wird. Die Uhr läuft erst,
   wenn das Rad im Bild ist, weiter unten auf einer Seite beginnt der Effekt also beim Hinscrollen. */
export const T = 40;
export const EINSTIEG = 8.5;

/* Tempo der Modellzeit in Erdumläufen pro Sekunde. In der Radix wandert die Sonne 0,5° pro Sekunde. */
export const TEMPO_RADIX = 0.5 / 360;
export const TEMPO_SONNENSYSTEM = 6 * TEMPO_RADIX;

/* Abschnitte in Sekunden: rauf von 10 bis 14, runter von 36 bis 40 */
const RAUF = 10, RADIX = 14, RUNTER = 36, DAUER = 4;

/* smootherstep: Tempo und Beschleunigung an den Rändern null, so findet das Auge keinen Knick */
export function glatt(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/* Verwandlungsgrad: 0 = Sonnensystem, 1 = Radix */
export function phase(phi: number): number {
  const z = ((phi % T) + T) % T;
  if (z < RAUF) return 0;
  if (z < RADIX) return glatt((z - RAUF) / DAUER);
  if (z < RUNTER) return 1;
  return 1 - glatt((z - RUNTER) / DAUER);
}

/* Fortschritt in einem Teilfenster der Verwandlung, geglättet */
export function teil(p: number, von: number, bis: number): number {
  return glatt((p - von) / (bis - von));
}

export function tempo(p: number): number {
  return TEMPO_SONNENSYSTEM + (TEMPO_RADIX - TEMPO_SONNENSYSTEM) * p;
}

export interface Uhr {
  t: number; // gelaufene Sekunden
  tau: number; // Modellzeit in Erdumläufen
}

/* Ein Bild weiter. Höchstens 0,1 s, damit nach einer Pause nichts nachspringt. */
export function schritt(u: Uhr, dt: number): Uhr {
  const d = Math.min(Math.max(dt, 0), 0.1);
  const t = u.t + d;
  return { t, tau: u.tau + tempo(phase(t + EINSTIEG)) * d };
}
