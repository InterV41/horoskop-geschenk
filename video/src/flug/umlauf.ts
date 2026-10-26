// Sichtbarer Umlauf im Sonnensystem: Die Planeten kreisen dort schneller, als das Modell sie laufen lässt,
// damit man ihre Bewegung auf der Bahn sieht. Der Vorsprung schrumpft auf 0, bevor die Kamera die Erde
// ansteuert; ab dann stehen alle genau dort, wo das Modell sie hat, und die Verwandlung bleibt stetig.
// Dazu die Leuchtspur: ein kurzer, weich auslaufender Bogen auf der eigenen Bahn hinter dem Planeten.
import { PLANETEN, sonnenWinkel, type PlanetId } from '../../../src/scripts/kosmos/modell';
import { SCHWENK_AB, VERWANDLUNG_AB, FPS, modellzeit } from './drehbuch';
import { POSTER_DA } from './poster';

/* Zwei Phasen:
   1. Poster (bis T1): Bei POSTER_DA stehen alle aufgereiht rechts vorn auf ihrer Bahn und kreisen dann ruhig,
      innen schneller als außen.
   2. Anflug auf die Erde (T1 bis T2): Den Rest bis zu ihrer Stellung im Modell holen sie auf, während die übrigen
      Planeten aus dem Bild sind; die Kamera folgt der Erde dort, wo sie gezeichnet ist. Ab T2 gilt das Modell. */
const T1 = SCHWENK_AB - 1.4, T2 = VERWANDLUNG_AB - 0.3;
const RUHIG_ERDE = 7; // Grad pro Sekunde
// innen deutlich schneller: Merkur zieht im Poster einmal hinter der Sonne durch
const ruhig = (bildRadius: number) => RUHIG_ERDE * Math.pow(160 / bildRadius, 1.9);
const modell = (id: PlanetId, t: number) => sonnenWinkel(id, modellzeit(t * FPS));

interface Plan { v0: number; w: number; v1: number; ende: number }
/* Merkur startet hinten und zieht im Halt schnell einmal hinter der Sonne durch */
function plane() {
  const plan = new Map<PlanetId, Plan>();
  PLANETEN.forEach((pl, i) => {
    const merkur = pl.id === 'merkur';
    const ziel = merkur ? 25 : -6 - 2.5 * i; // Grad: rechts, leicht nach vorn, Pluto am weitesten
    let v0 = ziel - modell(pl.id, POSTER_DA);
    v0 = ((v0 % 360) + 360) % 360 - 360; // (−360, 0]
    const w = merkur ? 66 : ruhig(pl.bildRadius);
    const v1 = v0 + w * (T1 - POSTER_DA);
    // Ziel 360·k: vorwärts weiter, mindestens ein Stück weiter als der Schwung allein trägt
    const h = T2 - T1;
    const ende = 360 * Math.ceil((v1 + 0.35 * w * h) / 360);
    plan.set(pl.id, { v0, w, v1, ende });
  });
  return plan;
}
const PLAN = plane();

/* Vorsprung des gezeichneten Planeten gegenüber dem Modell, in Grad */
export function vorsprung(id: PlanetId, t: number): number {
  const p = PLAN.get(id)!;
  if (t <= T1) return p.v0 + p.w * (t - POSTER_DA);
  if (t >= T2) return 0;
  // Hermite: Lage v1 mit Tempo w → Lage ende mit Tempo 0, danach gilt das Modell (ende ist ein Vielfaches von 360)
  const h = T2 - T1, s = (t - T1) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2;
  return h00 * p.v1 + h10 * h * p.w + h01 * p.ende;
}
/* Momentane Zusatzgeschwindigkeit, für die Länge der Spur */
export function zusatzTempo(id: PlanetId, t: number): number {
  return Math.abs(vorsprung(id, t + 0.02) - vorsprung(id, t - 0.02)) / 0.04;
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
