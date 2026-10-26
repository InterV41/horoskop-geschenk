// Sichtbarer Umlauf im Sonnensystem: Die Planeten kreisen dort schneller, als das Modell sie laufen lässt,
// damit man ihre Bewegung auf der Bahn sieht. Der Vorsprung schrumpft auf 0, bevor die Kamera die Erde
// ansteuert; ab dann stehen alle genau dort, wo das Modell sie hat, und die Verwandlung bleibt stetig.
// Dazu die Leuchtspur: ein kurzer, weich auslaufender Bogen auf der eigenen Bahn hinter dem Planeten.
import { PLANETEN, type PlanetId } from '../../../src/scripts/kosmos/modell';
import { SCHWENK_AB, rampe } from './drehbuch';

/* Zusätzliche Winkelgeschwindigkeit in Grad pro Sekunde, innen schneller (wie Kepler, gemildert) */
const EXTRA_ERDE = 22;
const extraTempo = (id: PlanetId) => {
  const pl = PLANETEN.find((p) => p.id === id)!;
  return EXTRA_ERDE * Math.pow(160 / pl.bildRadius, 1.1);
};

/* g(t): 1 im Sonnensystem, läuft vor dem Schwenk zur Erde weich auf 0 aus */
const AUS_AB = SCHWENK_AB - 1.2, AUS_BIS = SCHWENK_AB + 0.8;
const g = (t: number) => 1 - rampe(t, AUS_AB, AUS_BIS);
/* ∫ g von t bis AUS_BIS: der noch fehlende Weg, numerisch */
function rest(t: number): number {
  if (t >= AUS_BIS) return 0;
  const a = Math.max(t, 0), n = 120, h = (AUS_BIS - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += g(a + (i + 0.5) * h) * h;
  return s;
}

/* Vorsprung-Winkel (Grad, im Sinne des Modells): negativ, der Planet holt bis AUS_BIS auf */
export function vorsprung(id: PlanetId, t: number): number {
  return -extraTempo(id) * rest(t);
}
/* Momentane Zusatzgeschwindigkeit, für die Länge der Spur */
export function zusatzTempo(id: PlanetId, t: number): number {
  return extraTempo(id) * g(t);
}

/* Punkt im Bild der Szene (ungekippt x, gekippt y = −sin · r · K) um die Sonne drehen */
export function drehe(x: number, y: number, K: number, grad: number): [number, number] {
  const r = Math.hypot(x, y / K), a = Math.atan2(-y / K, x) + (grad * Math.PI) / 180;
  return [Math.cos(a) * r, -Math.sin(a) * r * K];
}

/* Leuchtspur: Bogen auf der Bahn hinter dem Planeten, in Bildpunkten gezeichnet */
export function zeichneSpur(
  ctx: CanvasRenderingContext2D,
  bildpunkt: (x: number, y: number) => [number, number],
  x: number, y: number, K: number,
  laengeGrad: number, breite: number, farbe: string, deckkraft: number, hell: boolean,
) {
  if (deckkraft <= 0.003 || laengeGrad < 1) return;
  const r = Math.hypot(x, y / K), a0 = Math.atan2(-y / K, x);
  const schritte = Math.max(16, Math.ceil(laengeGrad / 0.6));
  ctx.save();
  ctx.globalCompositeOperation = hell ? 'source-over' : 'lighter';
  ctx.lineCap = 'butt'; // runde Enden überlappen sich und wirken wie Perlen
  let vorher = bildpunkt(x, y);
  for (let i = 1; i <= schritte; i++) {
    const f = i / schritte;
    const a = a0 - (laengeGrad * f * Math.PI) / 180; // gegen die Laufrichtung
    const p = bildpunkt(Math.cos(a) * r, -Math.sin(a) * r * K);
    ctx.globalAlpha = deckkraft * Math.pow(1 - f, 1.6);
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite * (1 - 0.7 * f);
    ctx.beginPath(); ctx.moveTo(vorher[0], vorher[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    vorher = p;
  }
  ctx.restore();
}
