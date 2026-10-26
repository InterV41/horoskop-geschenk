// Himmelskörper mit echten Oberflächen (Solar System Scope, CC BY 4.0), Bildpunkt für Bildpunkt beleuchtet.
// Jede Kugel: Oberfläche nach Länge und Breite abgetastet, Licht von der Sonne, weicher Rand.
// Erde zusätzlich mit Stadtlichtern auf der Nachtseite, Wolken und einem Saum aus Atmosphäre.
// Saturn mit Ring, der vor und hinter der Kugel liegt. Texturen in mehreren Stufen, damit nichts flimmert.
import { ladeBild } from './weltraum';

export interface Licht { x: number; y: number; z: number } // Richtung zur Sonne: x rechts, y unten, z zum Betrachter

type Stufen = { b: number; h: number; d: Uint8ClampedArray }[];

/* Textur in Stufen halber Größe, jeweils weich verkleinert */
function stufen(bild: HTMLImageElement, max: number): Stufen {
  const aus: Stufen = [];
  let b = Math.min(max, bild.naturalWidth);
  while (b >= 64) {
    const h = b / 2;
    const c = document.createElement('canvas');
    c.width = b; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.imageSmoothingQuality = 'high';
    x.drawImage(bild, 0, 0, b, h);
    aus.push({ b, h, d: x.getImageData(0, 0, b, h).data });
    b /= 2;
  }
  return aus;
}
/* passende Stufe: etwa ein Bildpunkt der Textur je Bildpunkt auf dem Schirm */
const waehle = (s: Stufen, radius: number) => {
  const soll = Math.PI * 2 * radius;
  for (const st of s) if (st.b <= soll * 1.4) return st;
  return s[s.length - 1];
};

export type KoerperId = 'merkur' | 'venus' | 'erde' | 'mond' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptun' | 'pluto' | 'sonne';

export interface Texturen {
  oberflaeche: Partial<Record<KoerperId, Stufen>>;
  nacht: Stufen;
  wolken: Stufen;
  ring: { b: number; d: Uint8ClampedArray };
}

export async function ladeTexturen(quelle: (pfad: string) => string): Promise<Texturen> {
  const dateien: [KoerperId | 'nacht' | 'wolken', string, number][] = [
    ['erde', '8k_earth_daymap.jpg', 4096],
    ['nacht', '8k_earth_nightmap.jpg', 4096],
    ['wolken', '8k_earth_clouds.jpg', 4096],
    ['mond', '2k_moon.jpg', 2048],
    ['merkur', '2k_mercury.jpg', 1024],
    ['venus', '2k_venus_atmosphere.jpg', 1024],
    ['mars', '2k_mars.jpg', 1024],
    ['jupiter', '2k_jupiter.jpg', 1024],
    ['saturn', '2k_saturn.jpg', 1024],
    ['uranus', '2k_uranus.jpg', 1024],
    ['neptun', '2k_neptune.jpg', 1024],
    ['pluto', '2k_mercury.jpg', 512],
    ['sonne', '2k_sun.jpg', 1024],
  ];
  const bilder = await Promise.all(dateien.map(([, f]) => ladeBild(quelle('texturen/' + f))));
  const t: Texturen = { oberflaeche: {}, nacht: [], wolken: [], ring: { b: 0, d: new Uint8ClampedArray() } };
  dateien.forEach(([id, , max], i) => {
    const s = stufen(bilder[i], max);
    if (id === 'nacht') t.nacht = s;
    else if (id === 'wolken') t.wolken = s;
    else t.oberflaeche[id] = s;
  });
  const ring = await ladeBild(quelle('texturen/2k_saturn_ring_alpha.png'));
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(ring, 0, 0, 1024, 1);
  t.ring = { b: 1024, d: x.getImageData(0, 0, 1024, 1).data };
  return t;
}

/* Saturnring, in Planetenradien: C-Ring zart, B-Ring hell, Cassini-Teilung, A-Ring etwas dunkler */
const RING_INNEN = 1.22, RING_AUSSEN = 2.2;
const RING_DREH = (-17 * Math.PI) / 180; // im Bild leicht steiler als die Bahnebene (−12°)
const RING_OEFFNUNG = 0.3; // kleine Achse zur großen: flach, aber als Ellipse lesbar
const glattStufe = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* Deckkraft des Rings am Radius r; w = ein Bildpunkt in Planetenradien, für weiche Kanten */
function ringDichte(r: number, w: number): number {
  const k = Math.max(0.02, w * 1.2);
  const band = (a: number, b: number, d: number) => d * glattStufe(a - k, a + k, r) * (1 - glattStufe(b - k, b + k, r));
  return Math.min(1,
    band(RING_INNEN, 1.45, 0.22) + // C-Ring
    band(1.45, 1.84, 0.92) + // B-Ring
    band(1.84, 1.9, 0.12) + // Cassini-Teilung
    band(1.9, RING_AUSSEN, 0.7) * (1 - 0.35 * glattStufe(2.05, RING_AUSSEN, r)), // A-Ring, außen auslaufend
  );
}
function ringFarbe(r: number): [number, number, number] {
  if (r < 1.45) return [190, 176, 150];
  if (r < 1.9) return [236, 220, 184];
  return [214, 198, 162];
}

const FARBE_NACHT = [3, 5, 12];
const SAUM = [95, 150, 255];

let puffer: HTMLCanvasElement | null = null;
function arbeitsflaeche(g: number) {
  puffer ??= document.createElement('canvas');
  if (puffer.width < g || puffer.height < g) puffer.width = puffer.height = Math.max(g, puffer.width);
  return puffer.getContext('2d', { willReadFrequently: true })!;
}

export interface Kugel {
  id: KoerperId;
  x: number; y: number; r: number; // Mitte und Radius in Bildpunkten
  drehung: number; // Grad, Länge in der Bildmitte
  neigung: number; // Grad, Achse zum Betrachter gekippt
  deckkraft: number;
}

/* Eine Kugel zeichnen */
export function zeichneKugel(ctx: CanvasRenderingContext2D, tex: Texturen, k: Kugel, licht: Licht) {
  if (k.r < 0.6 || k.deckkraft <= 0.003) return;
  const ober = tex.oberflaeche[k.id];
  if (!ober) return;
  const erde = k.id === 'erde', saturn = k.id === 'saturn', sonne = k.id === 'sonne';
  // sehr kleine Körper: ein weicher Lichtpunkt in der mittleren Farbe genügt
  if (k.r < 1.6) {
    const st = ober[ober.length - 1];
    let rr = 0, gg = 0, bb = 0;
    for (let i = 0; i < st.d.length; i += 4) { rr += st.d[i]; gg += st.d[i + 1]; bb += st.d[i + 2]; }
    const n = st.d.length / 4;
    ctx.save();
    ctx.globalAlpha = k.deckkraft * Math.min(1, k.r);
    ctx.fillStyle = `rgb(${(rr / n) | 0},${(gg / n) | 0},${(bb / n) | 0})`;
    ctx.beginPath(); ctx.arc(k.x, k.y, Math.max(0.8, k.r), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  const saum = erde ? k.r * 0.07 : 0;
  const ringAussen = saturn ? RING_AUSSEN + 0.05 : 0;
  const halb = Math.ceil(k.r * Math.max(1 + saum / k.r, ringAussen || 1)) + 2;
  const g = halb * 2;
  const a = arbeitsflaeche(g);
  const bild = a.createImageData(g, g), px = bild.data;

  const st = waehle(ober, k.r);
  const nacht = erde ? waehle(tex.nacht, k.r) : null;
  const wolken = erde ? waehle(tex.wolken, k.r) : null;
  const ln = Math.hypot(licht.x, licht.y, licht.z) || 1;
  const Lx = licht.x / ln, Ly = licht.y / ln, Lz = licht.z / ln;
  const dreh = (k.drehung * Math.PI) / 180;
  const nei = (k.neigung * Math.PI) / 180, cn = Math.cos(nei), sn = Math.sin(nei);
  // Ringebene: im Bild um RING_DREH gedreht (wie die Bahnebene, leicht stärker), um RING_OEFFNUNG geöffnet.
  // Achsen der Ebene: eu (in der Bildebene) und ew (vorn unten zum Betrachter hin), beide Länge 1.
  const cb = Math.cos(RING_DREH), sb = Math.sin(RING_DREH), oz = Math.sqrt(1 - RING_OEFFNUNG ** 2);
  const eu = [cb, sb, 0], ew = [-sb * RING_OEFFNUNG, cb * RING_OEFFNUNG, oz];
  const rn = [eu[1] * ew[2] - eu[2] * ew[1], eu[2] * ew[0] - eu[0] * ew[2], eu[0] * ew[1] - eu[1] * ew[0]];

  const abtasten = (s: { b: number; h: number; d: Uint8ClampedArray }, lon: number, lat: number, aus: number[]) => {
    // bilinear
    const u = ((lon / (2 * Math.PI)) % 1 + 1) % 1 * s.b - 0.5, v = (0.5 - lat / Math.PI) * s.h - 0.5;
    const x0 = Math.floor(u), y0 = Math.max(0, Math.min(s.h - 1, Math.floor(v)));
    const fx = u - x0, fy = Math.max(0, Math.min(1, v - y0));
    const x1 = (x0 + 1 + s.b) % s.b, xa = (x0 + s.b) % s.b, y1 = Math.min(s.h - 1, y0 + 1);
    const i00 = (y0 * s.b + xa) * 4, i10 = (y0 * s.b + x1) * 4, i01 = (y1 * s.b + xa) * 4, i11 = (y1 * s.b + x1) * 4;
    for (let c = 0; c < 3; c++)
      aus[c] = (s.d[i00 + c] * (1 - fx) + s.d[i10 + c] * fx) * (1 - fy) + (s.d[i01 + c] * (1 - fx) + s.d[i11 + c] * fx) * fy;
  };
  const f = [0, 0, 0], fn = [0, 0, 0], fw = [0, 0, 0];

  for (let y = 0; y < g; y++)
    for (let x = 0; x < g; x++) {
      const i = (y * g + x) * 4;
      const dx = (x + 0.5 - halb) / k.r, dy = (y + 0.5 - halb) / k.r;
      const q = dx * dx + dy * dy;
      let R = 0, G = 0, B = 0, A = 0;
      let kugelZ = -Infinity;
      if (q <= 1) {
        const nz = Math.sqrt(1 - q);
        kugelZ = nz;
        // Normale im Körper: um die Neigung zurückdrehen (x bleibt, y/z kippen)
        const oben = -dy;
        const by = oben * cn + nz * sn, bz = -oben * sn + nz * cn;
        const lat = Math.asin(Math.max(-1, Math.min(1, by)));
        const lon = Math.atan2(dx, bz) + dreh;
        abtasten(st, lon, lat, f);
        const lam = dx * Lx + dy * Ly + nz * Lz;
        if (sonne) {
          // Sonne leuchtet selbst, zum Rand dunkler (Randverdunkelung)
          const rand = 0.55 + 0.45 * Math.pow(nz, 0.6);
          R = Math.min(255, f[0] * 1.25 * rand + 40); G = Math.min(255, f[1] * 1.15 * rand + 25); B = Math.min(255, f[2] * 0.9 * rand);
        } else {
          const tag = Math.min(1, Math.max(0, (lam + 0.06) / 0.28));
          const hell = 0.02 + 1.05 * Math.pow(Math.max(0, lam), 0.85);
          R = f[0] * hell; G = f[1] * hell; B = f[2] * hell;
          if (erde && wolken && nacht) {
            abtasten(wolken, lon + 0.02, lat, fw);
            const w = fw[0] / 255;
            R = R * (1 - w) + 255 * w * hell * 0.98; G = G * (1 - w) + 255 * w * hell * 0.98; B = B * (1 - w) + 255 * w * hell;
            // Glanz der Sonne auf dem Meer: Meer ist dunkel und blau
            const meer = f[2] > f[0] * 1.25 && f[2] > 50 ? 1 - w : 0;
            const spiegel = Math.pow(Math.max(0, 2 * lam * nz - Lz), 40) * meer * 160;
            R += spiegel; G += spiegel * 0.95; B += spiegel * 0.85;
            abtasten(nacht, lon, lat, fn);
            const stadt = Math.pow(1 - tag, 1.6) * (1 - w * 0.8);
            R += fn[0] * stadt * 1.1; G += fn[1] * stadt * 0.95; B += fn[2] * stadt * 0.6;
            // Atmosphäre: zum Rand bläulich, auf der Tagseite
            const randL = Math.pow(1 - nz, 2.2) * Math.max(0, lam + 0.3);
            R += SAUM[0] * randL * 0.9; G += SAUM[1] * randL * 0.9; B += SAUM[2] * randL * 0.9;
          }
          // Nachtseite fast schwarz, mit einem Hauch Blau
          R += FARBE_NACHT[0] * (1 - tag); G += FARBE_NACHT[1] * (1 - tag); B += FARBE_NACHT[2] * (1 - tag);
        }
        A = Math.min(1, (1 - Math.sqrt(q)) * k.r * 1.3);
      } else if (erde) {
        // Saum aus Atmosphäre außerhalb der Kugel
        const dist = (Math.sqrt(q) - 1) * k.r;
        if (dist < saum) {
          const lx = dx / Math.sqrt(q), ly = dy / Math.sqrt(q);
          const seiteL = Math.max(0, lx * Lx + ly * Ly + 0.3 * Lz + 0.15);
          const s = Math.exp(-dist / (saum * 0.25)) * Math.min(1, seiteL) * 0.9;
          R = SAUM[0]; G = SAUM[1]; B = SAUM[2]; A = s;
        }
      }
      if (saturn) {
        // Schatten des Rings auf der Kugel: vom Kugelpunkt zur Sonne, trifft der Strahl den Ring?
        if (kugelZ > -Infinity) {
          const pz = kugelZ, dn = Lx * rn[0] + Ly * rn[1] + Lz * rn[2];
          if (Math.abs(dn) > 1e-4) {
            const lam = -(dx * rn[0] + dy * rn[1] + pz * rn[2]) / dn;
            if (lam > 0) {
              const hx = dx + lam * Lx, hy = dy + lam * Ly, hz = pz + lam * Lz;
              const dichte = ringDichte(Math.hypot(hx, hy, hz), 1 / k.r);
              R *= 1 - 0.6 * dichte; G *= 1 - 0.6 * dichte; B *= 1 - 0.6 * dichte;
            }
          }
        }
        // Ring: Bildpunkt auf die Ringebene (Blick parallel zur z-Achse)
        const v = -dx * sb + dy * cb; // quer zur Ringachse im Bild, unten = vorn
        const t = v / RING_OEFFNUNG; // Lage entlang ew
        const u = dx * cb + dy * sb;
        const rad = Math.hypot(u, t), rz = t * oz;
        const dichte = rad > RING_INNEN - 0.05 && rad < RING_AUSSEN + 0.05 && rz > kugelZ ? ringDichte(rad, 1 / k.r) : 0;
        if (dichte > 0.002) {
          // Schatten der Kugel auf dem Ring: vom Ringpunkt zur Sonne, trifft der Strahl die Kugel?
          const rx = u * eu[0] + t * ew[0], ry = u * eu[1] + t * ew[1], rzz = t * ew[2];
          const bq = rx * Lx + ry * Ly + rzz * Lz, cq = rx * rx + ry * ry + rzz * rzz - 1;
          const schatten = bq < 0 && bq * bq - cq > 0 ? 0.12 : 1;
          // Licht auf dem Ring: schräg von der Sonne, die Rückseite etwas dunkler
          const licht = (0.62 + 0.38 * Math.min(1, Math.abs(Lx * rn[0] + Ly * rn[1] + Lz * rn[2]) * 2.2)) * schatten;
          const [fr, fg, fb] = ringFarbe(rad);
          R = R * (1 - dichte) + fr * licht * dichte; G = G * (1 - dichte) + fg * licht * dichte; B = B * (1 - dichte) + fb * licht * dichte;
          A = A + dichte * (1 - A);
        }
      }
      px[i] = Math.min(255, R); px[i + 1] = Math.min(255, G); px[i + 2] = Math.min(255, B); px[i + 3] = 255 * Math.max(0, A);
    }
  a.clearRect(0, 0, g, g);
  a.putImageData(bild, 0, 0);
  ctx.save();
  // rund zuschneiden: außerhalb von Kugel, Saum und Ring bleibt das Bild exakt leer
  ctx.beginPath();
  ctx.arc(k.x, k.y, saturn ? k.r * (RING_AUSSEN + 0.06) : k.r + saum + 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = k.deckkraft;
  ctx.drawImage(a.canvas, 0, 0, g, g, k.x - halb, k.y - halb, g, g);
  ctx.restore();
}

/* Sonne als Licht: Lichthof, waagrechter Reflex wie durch ein Kameraobjektiv, farbige Geister
   auf der Linie durch die Bildmitte. groesse: 0 ferner Stern … 1 nah. */
export function zeichneSonnenlicht(ctx: CanvasRenderingContext2D, x: number, y: number, groesse: number, deckkraft: number, mitte: number) {
  if (deckkraft <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const fleck = (r: number, farbe: string, a: number, innen = 0) => {
    const gr = ctx.createRadialGradient(x, y, r * innen, x, y, r);
    gr.addColorStop(0, farbe.replace('A', String(a)));
    gr.addColorStop(0.25, farbe.replace('A', String(a * 0.35)));
    gr.addColorStop(1, farbe.replace('A', '0'));
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const o = deckkraft;
  fleck(14 + 220 * groesse, 'rgba(255,214,160,A)', 0.45 * o);
  fleck(5 + 60 * groesse, 'rgba(255,246,228,A)', 0.9 * o);
  fleck(2.5 + 14 * groesse, 'rgba(255,255,255,A)', 1 * o);
  // kein waagrechter Reflex mehr: Von fern las er sich als Ellipse in der Mitte
  // feine Strahlen
  ctx.translate(x, y);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    const l = 30 + 140 * groesse;
    const sg = ctx.createLinearGradient(0, 0, l, 0);
    sg.addColorStop(0, `rgba(255,245,230,${0.3 * o})`);
    sg.addColorStop(1, 'rgba(255,245,230,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, -0.6, l, 1.2);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // keine farbigen Linsengeister: sie standen als Ringe frei im Bild
  ctx.restore();
}
