// Milchstraße und Sterne in 3D, gezeichnet auf eine Leinwand. Feste Saat: jedes Rendern sieht gleich aus.
// Einheiten wie die Radix-Zeichenfläche (Pluto-Bahn = 430). Die Sonne steht im Ursprung des Sonnensystems,
// die Galaxie liegt in der Ebene z = 0. Abstände sind echt gestaffelt, damit ein gleichmäßiger
// logarithmischer Zoom von der Galaxie bis zur Erde funktioniert.
import { BRENNWEITE, MITTE, BREITE, PX, rampe } from './drehbuch';

export const LJ = 6.8e5; // Einheiten je Lichtjahr (1 AE ≈ 10,75 Einheiten)
export const RG = 50000 * LJ; // Radius der Galaxie
const SONNE_R = 0.53 * RG;

export type Fassung = 'hell' | 'dunkel';

/* Zufall mit fester Saat */
function zufall(saat: number) {
  let a = saat >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = () => {
    const u = Math.max(1e-9, r()), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { r, g };
}

/* Spiralarme: logarithmische Spirale ab dem Ende des Balkens */
const STEIGUNG = Math.tan((19 * Math.PI) / 180);
const R0 = 0.13 * RG;
const BALKEN_WINKEL = 0.45;
const ARME = [
  { w: BALKEN_WINKEL, gewicht: 1 }, // Scutum-Centaurus
  { w: BALKEN_WINKEL + Math.PI, gewicht: 1 }, // Perseus
  { w: BALKEN_WINKEL + Math.PI / 2, gewicht: 0.55 }, // Sagittarius
  { w: BALKEN_WINKEL + (3 * Math.PI) / 2, gewicht: 0.55 }, // Norma / Orion-Sporn
];
const armWinkel = (arm: number, r: number) => ARME[arm].w + Math.log(r / R0) / STEIGUNG;

/* Die Sonne sitzt auf dem kleinen Arm, wie im Orion-Sporn */
const SONNEN_WINKEL = armWinkel(3, SONNE_R) + 0.04;
export const SONNE: [number, number, number] = [Math.cos(SONNEN_WINKEL) * SONNE_R, Math.sin(SONNEN_WINKEL) * SONNE_R, 0];

/* Arten von Teilchen */
const STERN = 0, NAH = 1;

export interface Himmel {
  // Sterne (Galaxie und Nachbarschaft der Sonne)
  x: Float64Array; y: Float64Array; z: Float64Array;
  art: Uint8Array; farbe: Uint8Array; hell: Float32Array; groesse: Float32Array;
  vonSonne: Float64Array; // Abstand zur Sonne, für die Nachbarsterne
  // Leuchtende Wolken und Staub
  wolken: { x: number; y: number; z: number; r: number; o: number; farbe: number; staub: boolean }[];
}

export function erzeugeHimmel(n = 420000, nNah = 75000): Himmel {
  const { r, g } = zufall(20261025);
  const N = n + nNah;
  const h: Himmel = {
    x: new Float64Array(N), y: new Float64Array(N), z: new Float64Array(N),
    art: new Uint8Array(N), farbe: new Uint8Array(N), hell: new Float32Array(N), groesse: new Float32Array(N),
    vonSonne: new Float64Array(N), wolken: [],
  };
  let i = 0;
  const setze = (x: number, y: number, z: number, art: number, farbe: number, hell: number, groesse: number) => {
    h.x[i] = x; h.y[i] = y; h.z[i] = z; h.art[i] = art; h.farbe[i] = farbe; h.hell[i] = hell; h.groesse[i] = groesse; i++;
  };
  const armPunkt = (arm: number, rr: number, streu: number): [number, number] => {
    const w = armWinkel(arm, rr) + g() * 0.04;
    const quer = g() * streu; // quer zum Arm
    const nx = Math.cos(w), ny = Math.sin(w);
    return [nx * rr - ny * quer, ny * rr + nx * quer];
  };
  const armWahl = () => {
    const s = r() * 3.1;
    return s < 1 ? 0 : s < 2 ? 1 : s < 2.55 ? 2 : 3;
  };
  const armRadius = () => {
    // exponentiell nach außen dünner, ohne harte Kante am Rand
    for (;;) {
      const rr = R0 - Math.log(1 - r()) * 0.3 * RG;
      if (rr < RG * (0.85 + 0.15 * r())) return rr;
    }
  };

  for (let k = 0; k < n; k++) {
    const s = r();
    if (s < 0.1) {
      // Kern: warm und dicht, abgeflacht
      const rr = Math.abs(g()) * 0.065 * RG, w = r() * 2 * Math.PI;
      setze(Math.cos(w) * rr, Math.sin(w) * rr * 0.85, g() * 0.035 * RG, STERN, r() < 0.8 ? 2 : 4, 0.22 + 0.3 * r(), 0.8 + r() * 0.6);
    } else if (s < 0.15) {
      // Balken
      const l = g() * 0.12 * RG, q = g() * 0.03 * RG;
      setze(Math.cos(BALKEN_WINKEL) * l - Math.sin(BALKEN_WINKEL) * q, Math.sin(BALKEN_WINKEL) * l + Math.cos(BALKEN_WINKEL) * q, g() * 0.018 * RG, STERN, 2, 0.25 + 0.3 * r(), 0.8 + r() * 0.5);
    } else if (s < 0.62) {
      // Arme, gut ein Drittel davon in Sternhaufen geballt
      const arm = armWahl(), rr = armRadius();
      const streu = (0.03 + 0.045 * (rr / RG)) * RG * (ARME[arm].gewicht < 1 ? 0.8 : 1) * (0.6 + 0.8 * r());
      let [x, y] = armPunkt(arm, rr, streu * (r() < 0.25 ? 2.2 : 1));
      if (r() < 0.35) { x += g() * 0.006 * RG; y += g() * 0.006 * RG; }
      const jung = r() < 0.3;
      setze(x, y, g() * 0.007 * RG, STERN, jung ? (r() < 0.5 ? 3 : 0) : r() < 0.5 ? 1 : 4, 0.35 + 0.65 * r() ** 2, 0.7 + r() * 0.9);
    } else {
      // Scheibe zwischen den Armen
      const rr = Math.min(RG * 1.05, -Math.log(1 - r() * 0.97) * 0.3 * RG), w = r() * 2 * Math.PI;
      setze(Math.cos(w) * rr, Math.sin(w) * rr, g() * 0.012 * RG, STERN, r() < 0.5 ? 1 : 4, 0.22 + 0.4 * r(), 0.7 + r() * 0.6);
    }
  }

  /* Nachbarschaft der Sonne: Abstände logarithmisch gleich verteilt, so ziehen auf jeder Stufe des Zooms
     Sterne vorbei. Weit draußen flacher, wie die Scheibe. */
  for (let k = 0; k < nNah; k++) {
    const d = Math.exp(Math.log(0.6 * LJ) + r() * (Math.log(14000 * LJ) - Math.log(0.6 * LJ)));
    let ux = g(), uy = g(), uz = g();
    const l = Math.hypot(ux, uy, uz) || 1;
    ux /= l; uy /= l; uz /= l;
    uz *= Math.min(1, ((600 * LJ) / d) ** 0.85);
    const hell = Math.min(1, 0.08 + 0.5 * r() ** 3 + (r() < 0.03 ? 0.6 : 0));
    h.vonSonne[i] = d;
    setze(SONNE[0] + ux * d, SONNE[1] + uy * d, SONNE[2] + uz * d, NAH, Math.floor(r() * 5), hell, 0.9 + r() * 1.2);
  }

  /* Leuchtende Wolken entlang der Arme und im Kern, dunkler Staub am Innenrand der Arme */
  for (let k = 0; k < 14; k++) {
    // breites, warmes Glühen um den Kern und den Balken
    const l = g() * 0.06 * RG;
    h.wolken.push({ x: Math.cos(BALKEN_WINKEL) * l, y: Math.sin(BALKEN_WINKEL) * l, z: 0, r: (0.16 + 0.1 * r()) * RG, o: 0.035, farbe: 0, staub: false });
  }
  for (let k = 0; k < 900; k++) {
    // zartes Licht der ganzen Scheibe, auch zwischen den Armen
    const rr = Math.min(RG, -Math.log(1 - r() * 0.95) * 0.32 * RG), w = r() * 2 * Math.PI;
    h.wolken.push({ x: Math.cos(w) * rr, y: Math.sin(w) * rr, z: 0, r: (0.06 + 0.05 * r()) * RG, o: 0.018, farbe: r() < 0.5 ? 1 : 3, staub: false });
  }
  for (let k = 0; k < 3400; k++) {
    if (r() < 0.12) {
      const rr = Math.abs(g()) * 0.08 * RG, w = r() * 2 * Math.PI;
      h.wolken.push({ x: Math.cos(w) * rr, y: Math.sin(w) * rr * 0.85, z: g() * 0.02 * RG, r: (0.05 + 0.06 * r()) * RG, o: 0.04 + 0.05 * r(), farbe: 0, staub: false });
      continue;
    }
    const arm = armWahl(), rr = armRadius();
    const [x, y] = armPunkt(arm, rr, (0.02 + 0.03 * (rr / RG)) * RG);
    const rosa = r() < 0.06;
    h.wolken.push({ x, y, z: g() * 0.004 * RG, r: (rosa ? 0.007 : 0.03 + 0.04 * r()) * RG, o: rosa ? 0.12 + 0.12 * r() : 0.03 + 0.04 * r(), farbe: rosa ? 2 : r() < 0.6 ? 1 : 3, staub: false });
  }
  for (let k = 0; k < 11000; k++) {
    const arm = r() < 0.75 ? (r() < 0.5 ? 0 : 1) : r() < 0.5 ? 2 : 3;
    const rr = R0 * 0.8 + Math.min(0.85 * RG, -Math.log(1 - r() * 0.95) * 0.3 * RG);
    const w = armWinkel(arm, rr) - 0.11 + g() * 0.03; // innen am Arm
    const quer = g() * 0.016 * RG;
    h.wolken.push({ x: Math.cos(w) * rr - Math.sin(w) * quer, y: Math.sin(w) * rr + Math.cos(w) * quer, z: g() * 0.0015 * RG, r: (0.004 + 0.008 * r()) * RG, o: 0.07 + 0.1 * r(), farbe: 0, staub: true });
  }
  return h;
}

/* Kamera: schaut auf ein Ziel, aus einem Abstand und einer Richtung */
export interface Kamera {
  ox: number; oy: number; oz: number; // Ort
  rx: number; ry: number; rz: number; // rechts
  ux: number; uy: number; uz: number; // oben
  fx: number; fy: number; fz: number; // vorwärts
  abstand: number;
}

export function kamera(lnMassstab: number, t: number): Kamera {
  const d = BRENNWEITE / (Math.exp(lnMassstab) * PX);
  const ld = Math.log(d);
  // Ziel: erst die Mitte der Galaxie, ab dem Eintauchen in den Arm die Sonne
  const w = rampe(ld, Math.log(0.5 * RG), Math.log(2.6 * RG));
  const tx = SONNE[0] * (1 - w), ty = SONNE[1] * (1 - w), tz = 0;
  // Blickrichtung: anfangs schräg von oben, beim Eintauchen flacher, damit das Band der Milchstraße entsteht
  const tief = rampe(ld, Math.log(0.004 * RG), Math.log(1.2 * RG));
  const hoehe = ((9 + 47 * tief) * Math.PI) / 180;
  const az = SONNEN_WINKEL + Math.PI * 0.62 - 0.9 * (1 - tief) - 0.012 * t;
  const dx = Math.cos(hoehe) * Math.cos(az), dy = Math.cos(hoehe) * Math.sin(az), dz = Math.sin(hoehe);
  const ox = tx + dx * d, oy = ty + dy * d, oz = tz + dz * d;
  let fx = -dx, fy = -dy, fz = -dz;
  // rechts = vorwärts × oben(Welt)
  let rx = fy * 1 - fz * 0, ry = fz * 0 - fx * 1, rz = 0;
  let l = Math.hypot(rx, ry, rz);
  rx /= l; ry /= l; rz /= l;
  let ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  // leichtes Neigen der Kamera, wie bei einem Flug
  const roll = -0.18 * tief - 0.38 * (1 - tief) + 0.006 * t;
  const c = Math.cos(roll), s = Math.sin(roll);
  const rx2 = rx * c + ux * s, ry2 = ry * c + uy * s, rz2 = rz * c + uz * s;
  const ux2 = ux * c - rx * s, uy2 = uy * c - ry * s, uz2 = uz * c - rz * s;
  l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  return { ox, oy, oz, rx: rx2, ry: ry2, rz: rz2, ux: ux2, uy: uy2, uz: uz2, fx, fy, fz, abstand: d };
}

/* Punkt aufs Bild: [x, y, Tiefe] oder null hinter der Kamera */
function bild(k: Kamera, x: number, y: number, z: number, aus: number[]): boolean {
  const vx = x - k.ox, vy = y - k.oy, vz = z - k.oz;
  const tz = vx * k.fx + vy * k.fy + vz * k.fz;
  if (tz <= k.abstand * 0.002) return false;
  aus[0] = MITTE + (BRENNWEITE * (vx * k.rx + vy * k.ry + vz * k.rz)) / tz;
  aus[1] = MITTE - (BRENNWEITE * (vx * k.ux + vy * k.uy + vz * k.uz)) / tz;
  aus[2] = tz;
  return true;
}

const FARBEN: Record<Fassung, { sterne: string[]; wolken: string[]; staub: string; grund: string }> = {
  dunkel: {
    sterne: ['#c9d6f2', '#f3e3c2', '#ffd9a0', '#ece6f5', '#e0c27e'],
    wolken: ['#ffcf8a', '#7f97d6', '#c27fa8', '#e0c27e'],
    staub: '#060d24',
    grund: '#07102a',
  },
  hell: {
    sterne: ['#9a7a33', '#a8873f', '#c29a45', '#8a6c2c', '#b08d45'],
    wolken: ['#e6c47a', '#ead7a8', '#e2bf8c', '#dcb66c'],
    staub: '#ffffff',
    grund: '#ffffff',
  },
};

/* Weiche runde Lichtflecken als fertige Bildchen, einmal je Farbe */
function fleck(farbe: string, weich = 1): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, farbe);
  gr.addColorStop(0.25 * weich, farbe + 'aa');
  gr.addColorStop(0.6, farbe + '30');
  gr.addColorStop(1, farbe + '00');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  return c;
}

export interface Maler {
  zeichne(ctx: CanvasRenderingContext2D, k: Kamera, vorher: Kamera, deckkraft: number, galaxie: number): void;
  sonne(ctx: CanvasRenderingContext2D, k: Kamera, lnMassstab: number, deckkraft: number): void;
}

export function baueMaler(h: Himmel, fassung: Fassung): Maler {
  const F = FARBEN[fassung];
  const dunkel = fassung === 'dunkel';
  const wolkenFlecken = F.wolken.map((f) => fleck(f));
  const staubFleck = fleck(F.staub, 1.6);
  const sternFlecken = F.sterne.map((f) => fleck(f, 0.5));
  const p = [0, 0, 0], q = [0, 0, 0];
  const N = h.x.length;

  function zeichne(ctx: CanvasRenderingContext2D, k: Kamera, v: Kamera, deckkraft: number, galaxie: number) {
    ctx.save();
    const ld = Math.log(k.abstand);
    // nahe Sterne erst, wenn wir in der Scheibe sind; vorher gehen sie im Leuchten der Galaxie auf
    const nahSichtbar = 1 - rampe(ld, Math.log(0.2 * RG), Math.log(0.9 * RG));
    // die Galaxie wird heller, je näher wir kommen, bis wir in ihr sind
    const naehe = Math.min(1.3, ((1.6 * RG) / Math.max(k.abstand, 0.2 * RG)) ** 0.35);

    /* Wolken und Staub: nur solange wir draußen oder im Arm sind; wer durch eine Wolke fliegt, sieht sie nicht mehr */
    ctx.globalCompositeOperation = dunkel ? 'lighter' : 'source-over';
    for (const w of h.wolken) {
      if (w.staub) continue;
      if (!bild(k, w.x, w.y, w.z, p)) continue;
      const rpx = (BRENNWEITE * w.r) / p[2];
      if (rpx < 1.5 || rpx > 2600) continue;
      if (p[0] < -rpx || p[0] > BREITE + rpx || p[1] < -rpx || p[1] > BREITE + rpx) continue;
      const nah = rampe(p[2], w.r * 1.5, w.r * 6);
      const o = w.o * nah * galaxie * (dunkel ? 1 : 0.7) * Math.min(1, rpx / 6) * (1 - rampe(rpx, 50, 260)) * 0.75;
      if (o < 0.004) continue;
      ctx.globalAlpha = Math.min(1, o);
      ctx.drawImage(wolkenFlecken[w.farbe], p[0] - rpx, p[1] - rpx, rpx * 2, rpx * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const w of h.wolken) {
      if (!w.staub) continue;
      if (!bild(k, w.x, w.y, w.z, p)) continue;
      const rpx = (BRENNWEITE * w.r) / p[2];
      if (rpx < 0.8 || rpx > 2600) continue;
      if (p[0] < -rpx || p[0] > BREITE + rpx || p[1] < -rpx || p[1] > BREITE + rpx) continue;
      const o = w.o * galaxie * (dunkel ? 0.9 : 0.8) * (1 - rampe(rpx, 12, 60));
      if (o < 0.004) continue;
      ctx.globalAlpha = Math.min(1, o);
      ctx.drawImage(staubFleck, p[0] - rpx, p[1] - rpx, rpx * 2, rpx * 2);
    }

    /* Sterne: erst die Spuren der schnellen, dann die Punkte */
    ctx.globalCompositeOperation = dunkel ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const nah = h.art[i] === NAH;
      if (nah && nahSichtbar <= 0.001) continue;
      if (!bild(k, h.x[i], h.y[i], h.z[i], p)) continue;
      const x = p[0], y = p[1];
      if (x < -40 || x > BREITE + 40 || y < -40 || y > BREITE + 40) continue;
      let o: number, gr: number;
      if (nah) {
        // scheinbare Helligkeit: je näher, desto heller, mit weichem Deckel
        const b = h.hell[i] * Math.min(1.3, ((40 * LJ) / p[2]) ** 0.5);
        o = Math.min(1, 0.28 + b) * nahSichtbar * rampe(h.vonSonne[i] / k.abstand, 0.015, 0.07);
        gr = Math.min(2.1, (0.5 + 0.8 * Math.sqrt(b)) * h.groesse[i]);
        o *= rampe(p[2], k.abstand * 0.004, k.abstand * 0.03); // knapp vor der Linse ausblenden
      } else {
        // ein Galaxie-Teilchen steht für viele Sterne; von nahem löst es sich in die Nachbarsterne auf
        const zu = Math.min(2.4, Math.max(1, ((0.35 * RG) / p[2]) ** 0.55));
        o = Math.min(0.38, h.hell[i] * 0.26 * naehe * zu) * rampe(p[2], 0.003 * RG, 0.02 * RG);
        gr = 0.62 * h.groesse[i] * Math.min(1.8, Math.sqrt(zu));
        o *= galaxie / Math.max(deckkraft, 1e-6);
      }
      o *= deckkraft * (dunkel ? 1 : 2.5);
      if (o < 0.01) continue;
      ctx.globalAlpha = Math.min(1, o);
      // Bewegungsspur zum Ort im vorigen Bild
      if (nah && bild(v, h.x[i], h.y[i], h.z[i], q)) {
        const dx = x - q[0], dy = y - q[1], len = Math.hypot(dx, dy);
        if (len > 2 && len < 900) {
          ctx.strokeStyle = F.sterne[h.farbe[i]];
          ctx.lineWidth = Math.max(0.5, gr * 0.6);
          ctx.globalAlpha = Math.min(1, (dunkel ? 0.85 : 0.4) * o * Math.min(1, 8 / len) ** 0.5);
          ctx.beginPath();
          ctx.moveTo(q[0], q[1]);
          ctx.lineTo(x, y);
          ctx.stroke();
          continue;
        }
      }
      if (gr > 1.9) {
        const s = gr * 2.4;
        ctx.drawImage(sternFlecken[h.farbe[i]], x - s, y - s, s * 2, s * 2);
      } else {
        ctx.fillStyle = F.sterne[h.farbe[i]];
        ctx.fillRect(x - gr / 2, y - gr / 2, gr, gr);
      }
    }
    ctx.restore();
  }

  /* Die Sonne: erst ein Stern unter vielen, dann der hellste, mit weichem Lichthof und Lichtstreif.
     Sobald der Lichthof der Szene groß genug ist, übernimmt er. */
  const hof = fleck(dunkel ? '#ffe7b0' : '#e8a93c', 0.4);
  const kern = fleck(dunkel ? '#ffffff' : '#f3c060', 0.3);
  function sonne(ctx: CanvasRenderingContext2D, k: Kamera, ln: number, deckkraft: number) {
    if (!bild(k, SONNE[0], SONNE[1], SONNE[2], p)) return;
    const auf = rampe(ln, -15.5, -9.5); // tritt aus den Sternen hervor
    const aus = 1 - rampe(ln, -1.6, -0.35); // die Sonne der Szene übernimmt
    const o = auf * aus * deckkraft;
    if (o < 0.005) return;
    const gross = rampe(ln, -12, -2.2);
    ctx.save();
    ctx.globalCompositeOperation = dunkel ? 'lighter' : 'source-over';
    const r1 = 5 + 95 * gross, r2 = 2 + 9 * gross;
    ctx.globalAlpha = Math.min(1, o * (0.55 + 0.3 * gross));
    ctx.drawImage(hof, p[0] - r1, p[1] - r1, r1 * 2, r1 * 2);
    ctx.globalAlpha = Math.min(1, o);
    ctx.drawImage(kern, p[0] - r2, p[1] - r2, r2 * 2, r2 * 2);
    // waagrechter Lichtstreif wie durch ein Kameraobjektiv, nur im Dunkeln
    if (dunkel) {
      const breit = 30 + 300 * gross, hoch = 1 + 1.8 * gross;
      const gr = ctx.createLinearGradient(p[0] - breit, 0, p[0] + breit, 0);
      gr.addColorStop(0, 'rgba(160,190,255,0)');
      gr.addColorStop(0.5, 'rgba(255,240,215,0.9)');
      gr.addColorStop(1, 'rgba(160,190,255,0)');
      ctx.globalAlpha = o * 0.55 * (0.4 + 0.6 * gross);
      ctx.fillStyle = gr;
      ctx.fillRect(p[0] - breit, p[1] - hoch / 2, breit * 2, hoch);
    }
    ctx.restore();
  }

  return { zeichne, sonne };
}
