// Raumschiff-Gefühl: Sterne rasen von der Bildmitte nach außen an der Kamera vorbei.
// Ein Tunnel aus Sternen vor der Kamera; die Kamera fliegt um die Strecke D(t) vorwärts.
// Je schneller der Zoom, desto weiter kommt sie pro Bild voran, desto länger die Streifen.
// Beim Abbremsen vor dem Sonnensystem werden die Streifen kürzer, die Sterne stehen und verblassen.
// Jedes Bild hängt nur von der Bildnummer ab (D ist vorab je Bild aufsummiert).
import { BREITE, MITTE, BILDER, FPS, lnMassstab, rampe } from './drehbuch';

const N = 520;
const TIEFE = 10; // Länge des Tunnels in Tunneleinheiten; was hinter der Kamera liegt, kommt vorne neu
const NAH = 0.25; // näher als dies: gerade vorbeigezogen, blendet aus
const BRENN = BREITE * 0.55;

/* Fahrt je Zoomschritt: nur solange wir durch die Sterne fliegen */
const fahrt = (ln: number) => rampe(ln, -16.2, -14.8) * (1 - rampe(ln, -6.5, -3.2));
const SCHUB = 3.2; // Tunneleinheiten je Einheit ln

/* Zurückgelegte Strecke je Bild, Mittelwertregel über Teilschritte */
const D = new Float64Array(BILDER + 2);
for (let b = 1; b < D.length; b++) {
  let s = 0;
  for (let k = 0; k < 8; k++) {
    const t0 = (b - 1 + k / 8) / FPS, t1 = (b - 1 + (k + 1) / 8) / FPS;
    const l0 = lnMassstab(t0), l1 = lnMassstab(t1);
    s += Math.max(0, l1 - l0) * fahrt((l0 + l1) / 2);
  }
  D[b] = D[b - 1] + s * SCHUB;
}

function zufall(saat: number) {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = zufall(4242);
const FARBEN = ['#ffffff', '#dfe8ff', '#cfdcff', '#fff1dc', '#ffe2b0'];
const STERNE = Array.from({ length: N }, () => {
  // Lage im Querschnitt: nicht genau auf der Achse, sonst stünde ein Stern starr in der Mitte
  const w = r() * Math.PI * 2, q = 0.08 + Math.sqrt(r()) * 1.6;
  return { x: Math.cos(w) * q, y: Math.sin(w) * q, z: r() * TIEFE, hell: 0.35 + 0.65 * r() ** 2, farbe: FARBEN[Math.floor(r() * FARBEN.length)] };
});

const ort = (s: (typeof STERNE)[number], d: number) => {
  const z = (((s.z - d) % TIEFE) + TIEFE) % TIEFE; // vor der Kamera, 0…TIEFE
  return { z, x: MITTE + (BRENN * s.x) / z, y: MITTE + (BRENN * s.y) / z };
};

/* Wie stark der Tunnel gerade zu sehen ist (für Abstimmung mit dem Himmel dahinter) */
export function warpSichtbar(t: number): number {
  const ln = lnMassstab(t);
  return rampe(ln, -16.2, -15) * (1 - rampe(ln, -4.2, -1.8));
}

export function zeichneWarp(ctx: CanvasRenderingContext2D, bild: number, hell: boolean) {
  const t = bild / FPS;
  const da = warpSichtbar(t);
  if (da <= 0.002) return;
  const b = Math.min(D.length - 1, Math.max(1, Math.round(bild)));
  const jetzt = D[b], vorher = D[b - 1];
  const tempo = jetzt - vorher; // Tunneleinheiten pro Bild
  // Streifen zeigen den Weg mehrerer Bilder, dann wirken sie wie Belichtung
  const spur = Math.min(0.9, tempo * 3.5);
  ctx.save();
  ctx.globalCompositeOperation = hell ? 'source-over' : 'lighter';
  ctx.lineCap = 'round';
  for (const s of STERNE) {
    const a = ort(s, jetzt);
    if (a.z < 0.02) continue;
    const zVor = a.z + spur;
    const p = { x: MITTE + (BRENN * s.x) / zVor, y: MITTE + (BRENN * s.y) / zVor };
    if (a.x < -60 || a.x > BREITE + 60 || a.y < -60 || a.y > BREITE + 60) continue;
    // nah: größer und heller; ganz nah und ganz fern: aus
    const naehe = 1 / a.z;
    const ein = rampe(a.z, TIEFE, TIEFE * 0.7) * rampe(a.z, NAH * 0.4, NAH);
    const o = Math.min(1, s.hell * (0.25 + 0.9 * naehe)) * ein * da;
    if (o < 0.01) continue;
    const breite = Math.min(3.2, 0.6 + 1.6 * naehe);
    const len = Math.hypot(a.x - p.x, a.y - p.y);
    if (len < 1.2) {
      ctx.globalAlpha = o;
      ctx.fillStyle = hell ? '#7a6128' : s.farbe;
      ctx.beginPath(); ctx.arc(a.x, a.y, breite * 0.6, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    // Streifen: hinten durchsichtig, vorn hell
    const g = ctx.createLinearGradient(p.x, p.y, a.x, a.y);
    const farbe = hell ? '122,97,40' : s.farbe === '#ffffff' ? '255,255,255' : s.farbe === '#dfe8ff' ? '223,232,255' : s.farbe === '#cfdcff' ? '207,220,255' : s.farbe === '#fff1dc' ? '255,241,220' : '255,226,176';
    g.addColorStop(0, `rgba(${farbe},0)`);
    g.addColorStop(1, `rgba(${farbe},${o.toFixed(3)})`);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = g;
    ctx.lineWidth = breite;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(a.x, a.y); ctx.stroke();
  }
  ctx.restore();
}
