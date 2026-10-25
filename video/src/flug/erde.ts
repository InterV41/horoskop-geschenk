// Erde und Mond aus der Nähe: echte Küstenlinien (Natural Earth, gemeinfrei), Wolken, Licht von der Sonne,
// goldene Stadtlichter auf der Nachtseite und ein feiner Saum aus Atmosphäre. Gezeichnet auf eine Leinwand.
import { geoOrthographic, geoPath, geoCircle, geoContains, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import welt from 'world-atlas/land-50m.json';
import type { Fassung } from './galaxie';

const land = feature(welt as unknown as Topology, (welt as unknown as Topology).objects.land as GeometryCollection);

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

/* Wolken: Felder in Bändern (Tropen, Westwinde), jedes Feld aus mehreren weichen Kreisen */
const r = zufall(31415);
const WOLKEN: { lon: number; lat: number; rad: number; o: number }[] = [];
for (let k = 0; k < 260; k++) {
  const band = r();
  const lat = band < 0.3 ? (r() - 0.5) * 22 : (band < 0.65 ? 1 : -1) * (40 + r() * 22);
  const lon = r() * 360 - 180;
  // ein Wolkenfeld: Schlieren entlang der Breite, leicht gebogen wie ein Wirbel
  const teile = 8 + Math.floor(r() * 14), bogen = (r() - 0.5) * 0.6, laenge = 10 + r() * 30;
  for (let j = 0; j < teile; j++) {
    const s = (j / teile - 0.5) * laenge;
    WOLKEN.push({ lon: lon + s + (r() - 0.5) * 3, lat: Math.max(-80, Math.min(80, lat + bogen * s + (r() - 0.5) * 4)), rad: 0.6 + r() * 2.4, o: 0.06 + r() * 0.12 });
  }
}

/* Stadtlichter: Punkte auf dem Land, gehäuft in den bewohnten Breiten */
const STAEDTE: [number, number, number][] = [];
{
  const z = zufall(2718);
  let n = 0;
  while (STAEDTE.length < 2600 && n < 60000) {
    n++;
    const lat = Math.asin(z() * 2 - 1) * (180 / Math.PI);
    if (lat < -45 || lat > 64) continue;
    const lon = z() * 360 - 180;
    if (!geoContains(land, [lon, lat])) continue;
    // Ballungen: um einen Teil der Punkte weitere dicht herum
    STAEDTE.push([lon, lat, 0.4 + z() * 0.6]);
    if (z() < 0.3) for (let j = 0; j < 4; j++) STAEDTE.push([lon + (z() - 0.5) * 2.5, lat + (z() - 0.5) * 2, 0.3 + z() * 0.5]);
  }
}

/* Meere des Mondes (grob, genügt für den Eindruck) */
const MARE: [number, number, number][] = [
  [-15, 30, 16], [10, 20, 12], [30, 10, 11], [-40, 5, 18], [55, 15, 7], [25, -12, 9], [-25, -20, 8], [-5, -25, 6],
];

const FARBE = {
  dunkel: { meer: [24, 52, 104], meerHell: [58, 104, 166], land: [138, 124, 86], landGruen: [72, 94, 58], wolke: [245, 242, 235], nacht: [5, 9, 24], licht: [255, 205, 120], saum: [120, 165, 255] },
  hell: { meer: [40, 78, 132], meerHell: [84, 128, 184], land: [150, 134, 94], landGruen: [86, 106, 66], wolke: [250, 248, 242], nacht: [16, 24, 50], licht: [255, 200, 110], saum: [150, 185, 230] },
};

export interface Licht { x: number; y: number; z: number } // Richtung zur Sonne, im Bild: x rechts, y unten, z zum Betrachter

/* Hilfsleinwände, einmal je Größe */
let basis: HTMLCanvasElement | null = null, lichter: HTMLCanvasElement | null = null;
function leinwand(alt: HTMLCanvasElement | null, groesse: number) {
  const c = alt ?? document.createElement('canvas');
  if (c.width < groesse) c.width = c.height = groesse;
  return c;
}

/* Erde mit Mittelpunkt (cx, cy) und Radius rad in Bildpunkten. drehung in Grad (Längengrad in der Mitte). */
export function zeichneErde(ctx: CanvasRenderingContext2D, fassung: Fassung, cx: number, cy: number, rad: number, drehung: number, licht: Licht, deckkraft: number) {
  if (rad < 2 || deckkraft <= 0.002) return;
  const F = FARBE[fassung];
  const saum = rad * 0.09;
  const g = Math.ceil((rad + saum) * 2 + 4);
  const m = g / 2;
  basis = leinwand(basis, g);
  lichter = leinwand(lichter, g);
  const b = basis.getContext('2d', { willReadFrequently: true })!;
  const l = lichter.getContext('2d', { willReadFrequently: true })!;
  b.clearRect(0, 0, g, g);
  l.clearRect(0, 0, g, g);

  const proj = geoOrthographic().scale(rad).translate([m, m]).rotate([-drehung, -18, -12]).clipAngle(90);
  const pfad = geoPath(proj, b);

  // Meer
  b.fillStyle = `rgb(${F.meer.join(',')})`;
  b.beginPath(); b.arc(m, m, rad, 0, Math.PI * 2); b.fill();
  // Land: oben trocken und goldbraun, Wälder dunkler grün darunter gemischt
  b.beginPath(); pfad(land); b.fillStyle = `rgb(${F.land.join(',')})`; b.fill();
  b.save(); b.globalAlpha = 0.45; b.fillStyle = `rgb(${F.landGruen.join(',')})`;
  b.beginPath(); pfad({ type: 'Sphere' }); b.clip();
  b.beginPath(); pfad(land); b.fill(); b.restore();
  // feines Gradnetz, kaum sichtbar, wie auf einem gestochenen Globus
  b.save(); b.globalAlpha = 0.07; b.strokeStyle = '#e0c27e'; b.lineWidth = Math.max(0.5, rad / 300);
  b.beginPath(); pfad(geoGraticule10()); b.stroke(); b.restore();
  // Wolken
  b.fillStyle = `rgb(${F.wolke.join(',')})`;
  const kreis = geoCircle();
  for (const w of WOLKEN) {
    b.globalAlpha = w.o;
    b.beginPath(); pfad(kreis.center([w.lon, w.lat]).radius(w.rad)()); b.fill();
  }
  b.globalAlpha = 1;
  // Stadtlichter auf eigener Leinwand, sie leuchten nur auf der Nachtseite
  const lp = geoPath(proj, l);
  l.fillStyle = `rgb(${F.licht.join(',')})`;
  for (const [lon, lat, h] of STAEDTE) {
    const pt = proj([lon, lat]);
    if (!pt) continue;
    // nur die sichtbare Halbkugel
    const d = lp.centroid({ type: 'Point', coordinates: [lon, lat] });
    if (!Number.isFinite(d[0])) continue;
    const s = Math.max(0.6, (rad / 260) * (0.8 + h));
    l.globalAlpha = 0.5 + 0.5 * h;
    l.fillRect(pt[0] - s / 2, pt[1] - s / 2, s, s);
  }

  /* Licht Bildpunkt für Bildpunkt: Tag, weicher Übergang, Nacht mit Lichtern, Saum aus Atmosphäre */
  const bild = b.getImageData(0, 0, g, g), px = bild.data;
  const lic = l.getImageData(0, 0, g, g).data;
  const ln = Math.hypot(licht.x, licht.y, licht.z) || 1;
  const Lx = licht.x / ln, Ly = licht.y / ln, Lz = licht.z / ln;
  const r2 = rad * rad;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      const i = (y * g + x) * 4;
      const dx = (x + 0.5 - m) / rad, dy = (y + 0.5 - m) / rad;
      const q = dx * dx + dy * dy;
      if (q <= 1) {
        const nz = Math.sqrt(1 - q);
        const lam = dx * Lx + dy * Ly + nz * Lz; // Lambert
        const tag = Math.min(1, Math.max(0, (lam + 0.12) / 0.5));
        const hell = 0.08 + 0.95 * Math.max(0, lam) ** 0.8;
        // Glanz der Sonne auf dem Meer
        const glanz = Math.max(0, lam) ** 24 * 0.35;
        const nacht = 1 - tag;
        const lichtStaerke = (lic[i + 3] / 255) * nacht ** 1.5;
        for (let c = 0; c < 3; c++) {
          const tagWert = px[i + c] * hell + 255 * glanz;
          const nachtWert = F.nacht[c] + px[i + c] * 0.05;
          px[i + c] = Math.min(255, tagWert * tag + nachtWert * nacht + F.licht[c] * lichtStaerke * 1.1);
        }
        // Atmosphäre am Rand der Tagseite
        const rand = Math.max(0, 1 - nz) ** 3 * Math.max(0, lam + 0.25);
        for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, px[i + c] + F.saum[c] * rand * 0.9);
        // Kante weich gegen das All
        const kante = Math.min(1, (1 - Math.sqrt(q)) * rad * 1.2);
        px[i + 3] = 255 * Math.max(0, kante);
      } else {
        const dist = (Math.sqrt(q) - 1) * rad;
        if (dist > saum) { px[i + 3] = 0; continue; }
        // Saum: zur Sonne hin kräftig, auf der Nachtseite fast nichts
        const lx = dx / Math.sqrt(q), ly = dy / Math.sqrt(q);
        const seite = Math.max(0, lx * Lx + ly * Ly + 0.35 * Lz + 0.2);
        const a = Math.exp(-dist / (saum * 0.28)) * Math.min(1, seite) * 0.85;
        px[i] = F.saum[0]; px[i + 1] = F.saum[1]; px[i + 2] = F.saum[2];
        px[i + 3] = 255 * a;
      }
    }
  }
  b.putImageData(bild, 0, 0);
  ctx.save();
  ctx.globalAlpha = deckkraft;
  ctx.drawImage(basis, 0, 0, g, g, cx - m, cy - m, g, g);
  ctx.restore();
}

/* Mond: grau, mit dunklen Meeren, vom selben Licht beschienen */
export function zeichneMond(ctx: CanvasRenderingContext2D, fassung: Fassung, cx: number, cy: number, rad: number, licht: Licht, deckkraft: number) {
  if (rad < 1.5 || deckkraft <= 0.002) return;
  const g = Math.ceil(rad * 2 + 4), m = g / 2;
  basis = leinwand(basis, g);
  const b = basis.getContext('2d', { willReadFrequently: true })!;
  b.clearRect(0, 0, g, g);
  const proj = geoOrthographic().scale(rad).translate([m, m]).rotate([0, -6, 0]).clipAngle(90);
  const pfad = geoPath(proj, b);
  b.fillStyle = '#b9b4aa';
  b.beginPath(); b.arc(m, m, rad, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#7f7a72';
  for (const [lon, lat, rr] of MARE) { b.globalAlpha = 0.55; b.beginPath(); pfad(geoCircle().center([lon, lat]).radius(rr)()); b.fill(); }
  b.globalAlpha = 1;
  const bild = b.getImageData(0, 0, g, g), px = bild.data;
  const ln = Math.hypot(licht.x, licht.y, licht.z) || 1;
  const Lx = licht.x / ln, Ly = licht.y / ln, Lz = licht.z / ln;
  const nacht = FARBE[fassung].nacht;
  for (let y = 0; y < g; y++)
    for (let x = 0; x < g; x++) {
      const i = (y * g + x) * 4;
      const dx = (x + 0.5 - m) / rad, dy = (y + 0.5 - m) / rad, q = dx * dx + dy * dy;
      if (q > 1) { px[i + 3] = 0; continue; }
      const nz = Math.sqrt(1 - q);
      const lam = Math.max(0, dx * Lx + dy * Ly + nz * Lz);
      const hell = 0.04 + 1.0 * lam ** 0.9;
      for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, px[i + c] * hell + nacht[c] * (1 - Math.min(1, lam * 3)));
      px[i + 3] = 255 * Math.min(1, (1 - Math.sqrt(q)) * rad * 1.2);
    }
  b.putImageData(bild, 0, 0);
  ctx.save();
  ctx.globalAlpha = deckkraft;
  ctx.drawImage(basis, 0, 0, g, g, cx - m, cy - m, g, g);
  ctx.restore();
}
