// Kosmos-Flug für die Startseite: von der Milchstraße hinein ins Sonnensystem bis zur Erde.
// Dort setzt die bisherige Verwandlung ein: Die Erde wird zur Mitte, die Planeten wandern in den Tierkreis,
// die Radix zeichnet sich ein. Das letzte Bild gleicht genau dem Zustand, mit dem die laufende Radix
// der Seite weitermacht. Jedes Bild hängt nur von der Bildnummer ab.
// Ebenen von hinten nach vorn: Weltraum (3D) · Sonne und Planeten (echte Oberflächen) · Radix (SVG).
import '../../node_modules/@fontsource/stix-two-text/400.css';
import '../../node_modules/@fontsource/stix-two-text/500.css';
import '../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './radix.css';
import './flug/flug.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { baueSzene, type Szene } from '../../src/scripts/kosmos/szene';
import { layout, type Richtungen, type Layout } from '../../src/scripts/kosmos/layout';
import type { Sprache } from '../../src/scripts/kosmos/texte';
import { BREITE, MITTE, PX, FPS, FLUG_TEMPO, VERWANDLUNG_AB, SCHWENK_AB, SCHWENK_BIS, lnMassstab, verwandlung, modellzeit, aszendentImFilm, rampe } from './flug/drehbuch';
import { kamera, SONNE, type Fassung, type Kamera } from './flug/galaxie';
import { baueWeltraum, type Weltraum } from './flug/weltraum';
import { ladeTexturen, zeichneKugel, zeichneSonnenlicht, type Texturen, type Licht, type KoerperId } from './flug/planeten';

export interface KosmosFlugProps {
  fassung: Fassung;
  sprache: Sprache;
}

/* Reines Schwarz und Weiß: Die Seite rechnet den Grund wieder heraus, dann liegt nur das Licht über ihr */
const GRUND: Record<Fassung, string> = { dunkel: '#000000', hell: '#ffffff' };

/* Je Körper: Drehung in Grad pro Sekunde, Startlänge, Neigung der Achse zum Betrachter */
const DREHUNG: Partial<Record<KoerperId, [number, number, number]>> = {
  erde: [10, 20, 18], mond: [0, 0, 6], merkur: [8, 0, 0], venus: [3, 0, 0], mars: [9, 40, 15],
  jupiter: [16, 0, 5], saturn: [14, 0, 10], uranus: [6, 0, 50], neptun: [7, 0, 20], pluto: [4, 0, 0], sonne: [2, 0, 6],
};

/* Zustand der Szene in einem Bild. Die Drehwege der Verwandlung werden ab ihrem Beginn nachgerechnet,
   so ist jedes Bild unabhängig von der Reihenfolge, in der gerendert wird. */
function szenenStand(bild: number): { l: Layout; l0: Layout } {
  const t = bild / FPS;
  const tau = modellzeit(bild), asc = aszendentImFilm(t);
  const l0 = layout(tau, 0, asc);
  const p = verwandlung(t);
  if (p <= 0 || p >= 1) return { l: p <= 0 ? l0 : layout(tau, 1, asc), l0 };
  const wege: Richtungen = new Map();
  const ab = Math.floor(VERWANDLUNG_AB * FPS);
  for (let b = ab; b < bild; b++) layout(modellzeit(b), verwandlung(b / FPS), aszendentImFilm(b / FPS), wege);
  return { l: layout(tau, p, asc, wege), l0 };
}

/* Sonne aufs Bild der 3D-Kamera, für die Zeit, bevor das Sonnensystem steht */
function sonneImBild(k: Kamera): [number, number] | null {
  const vx = SONNE[0] - k.ox, vy = SONNE[1] - k.oy, vz = SONNE[2] - k.oz;
  const tz = vx * k.fx + vy * k.fy + vz * k.fz;
  if (tz <= 0) return null;
  const f = BREITE * 1.2;
  return [MITTE + (f * (vx * k.rx + vy * k.ry + vz * k.rz)) / tz, MITTE - (f * (vx * k.ux + vy * k.uy + vz * k.uz)) / tz];
}

export const KosmosFlug: React.FC<KosmosFlugProps> = ({ fassung, sprache }) => {
  const frame = useCurrentFrame();
  const host = useRef<HTMLDivElement>(null);
  const raum = useRef<HTMLCanvasElement>(null);
  const koerper = useRef<HTMLCanvasElement>(null);
  const welt = useRef<{ szene: Szene; weltraum: Weltraum; tex: Texturen; bahnen: SVGElement[] } | null>(null);
  const [warten] = useState(() => delayRender('Weltraum, Texturen und Schriften', { timeoutInMilliseconds: 120000 }));
  const [bereit, setBereit] = useState(false);

  useLayoutEffect(() => {
    const szene = baueSzene(host.current!, 301, sprache, { nurRadix: true });
    szene.setzeStrich(fassung === 'hell' ? 1.6 : 1);
    // Die gezeichneten Kugeln und die Sonne der Szene ersetzen wir durch echte Oberflächen
    const h = host.current!;
    h.querySelectorAll<SVGElement>('circle[fill^="url(#kx301-p-"]').forEach((c) => ((c.parentElement as unknown as SVGElement).style.display = 'none'));
    h.querySelectorAll<SVGElement>('circle[fill="url(#kx301-hof)"], circle[fill="url(#kx301-kern)"]').forEach((c) => (c.style.display = 'none'));
    const bahnen = Array.from(h.querySelectorAll<SVGElement>('ellipse[stroke="url(#kx301-bahn)"]'));
    Promise.all([
      baueWeltraum(raum.current!, staticFile),
      ladeTexturen(staticFile),
      document.fonts.load('29px "Noto Sans Symbols"', '☉☽☿♀♂♃♄♅♆♇'),
      document.fonts.load('29px "Noto Sans Symbols 2"', '♈♉♊♋♌♍♎♏♐♑♒♓'),
      document.fonts.load('16px "STIX Two Text"', 'WIDDER'),
      document.fonts.load('500 16px "STIX Two Text"', 'WIDDER'),
    ])
      .then(([weltraum, tex]) => {
        welt.current = { szene, weltraum, tex, bahnen };
        return document.fonts.ready;
      })
      .then(() => setBereit(true))
      .catch((e) => cancelRender(e));
  }, []);

  useLayoutEffect(() => {
    const w = welt.current;
    if (!w || !bereit) return;
    const t = frame / FPS;
    const ln = lnMassstab(t), S = Math.exp(ln);
    const { l, l0 } = szenenStand(frame);

    /* Kameramitte in Einheiten der Szene: erst die Sonne, dann gleitet die Erde in die Bildmitte und bleibt dort */
    const E0 = l0.koerper.erde;
    let cx = 0, cy = 0;
    if (t >= VERWANDLUNG_AB) { cx = l.koerper.erde.x; cy = l.koerper.erde.y; }
    else if (t >= SCHWENK_AB) {
      const g = rampe(t, SCHWENK_AB, SCHWENK_BIS), S0 = Math.exp(lnMassstab(SCHWENK_AB));
      cx = E0.x - (E0.x * S0 * (1 - g)) / S;
      cy = E0.y - (E0.y * S0 * (1 - g)) / S;
    }

    /* Weltraum: verblasst etwas, wenn die Radix steht, damit sie ruhig liest */
    // Kamera und Himmel rechnen in der Zeit des ersten Schnitts, der Film ist um FLUG_TEMPO gedehnt
    const k = kamera(ln, t / FLUG_TEMPO);
    w.weltraum.zeichne(k, t / FLUG_TEMPO);
    raum.current!.style.opacity = (1 - 0.55 * rampe(t, VERWANDLUNG_AB + 1, VERWANDLUNG_AB + 6)).toFixed(3);
    // Hell: der Weltraum als goldene Zeichnung auf Weiß (Licht wird zu Tinte), Planeten bleiben echt
    if (fassung === 'hell') raum.current!.style.filter = 'url(#flug-tinte)';

    /* Radix-Szene: Bahnen sind im Sonnensystem nur ein Hauch und werden erst mit der Verwandlung zu Ringen */
    const szeneDa = rampe(ln, -5.2, -2.6);
    const st = host.current!.style;
    st.visibility = szeneDa <= 0.001 ? 'hidden' : '';
    st.transform = `scale(${S}) translate(${(-cx * PX).toFixed(3)}px, ${(-cy * PX).toFixed(3)}px)`;
    w.szene.setzeStrich((fassung === 'hell' ? 1.75 : 1.25) / Math.max(1, S));
    w.szene.zeichne(l);
    // Umlaufbahnen nur beim Übergang in die Radix, dann deutlich
    const bahn = rampe(t, VERWANDLUNG_AB - 1.4, VERWANDLUNG_AB + 0.2);
    w.bahnen.forEach((b) => (b.style.opacity = bahn.toFixed(3)));

    /* Sonne und Planeten mit echten Oberflächen */
    const c = koerper.current!.getContext('2d')!;
    c.clearRect(0, 0, BREITE, BREITE);
    // Hell: Licht der Sonne als Goldtinte, wie der Weltraum dahinter
    const licht = (f: () => void) => { if (fassung === 'hell') { c.save(); c.filter = 'url(#flug-tinte)'; f(); c.restore(); } else f(); };
    const bildpunkt = (x: number, y: number): [number, number] => [MITTE + (x - cx) * S * PX, MITTE + (y - cy) * S * PX];

    // Sonne: aus der Ferne ein Stern mit Reflex, nah eine leuchtende Kugel
    const so = l.koerper.sonne;
    const [sx, sy] = bildpunkt(so.x, so.y);
    // im Sonnensystem kleiner, damit sie die Planeten nicht erdrückt; nah an der Erde wieder in voller Größe
    const sonnenR = so.kugelR * S * PX * (0.5 + 0.5 * rampe(ln, 0.6, 2.4));
    const fern = sonneImBild(k);
    const stern = rampe(ln, -15, -9);
    if (fern && szeneDa < 1) licht(() => zeichneSonnenlicht(c, fern[0], fern[1], 0.1 + 0.25 * rampe(ln, -10, -5) * (1 - rampe(ln, -5, -2.6)), stern * (1 - szeneDa), MITTE));
    if (szeneDa > 0 && so.kugelDeckkraft > 0.003) {
      zeichneKugel(c, w.tex, { id: 'sonne', x: sx, y: sy, r: sonnenR, drehung: t * DREHUNG.sonne![0], neigung: DREHUNG.sonne![2], deckkraft: szeneDa * so.kugelDeckkraft }, { x: 0, y: 0, z: 1 });
      // je größer die Erde im Bild, desto mehr tritt das Sonnenlicht zurück
      const blend = (1 - 0.65 * rampe(ln, 0.5, 2.6)) * (1 - verwandlung(t));
      // Sonne ruhiger, damit die Planeten daneben nicht untergehen
      licht(() => zeichneSonnenlicht(c, sx, sy, Math.min(1, 0.08 + 0.12 * Math.max(0, ln)), 0.45 * szeneDa * blend * so.kugelDeckkraft, MITTE));
    }

    // Planeten, Erde und Mond, hinten (oben im Bild) zuerst
    const ids = (['merkur', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'pluto', 'erde', 'mond'] as const)
      .map((id) => ({ id, kl: l.koerper[id] }))
      .sort((a, b) => a.kl.y - b.kl.y);
    for (const { id, kl } of ids) {
      if (kl.kugelDeckkraft <= 0.003) continue;
      const [x, y] = bildpunkt(kl.x, kl.y);
      if (x < -400 || x > BREITE + 400 || y < -400 || y > BREITE + 400) continue;
      // Licht kommt von der Sonne, im Bild von deren Ort aus
      const lx = sx - x, ly = sy - y, lh = Math.hypot(lx, ly) || 1;
      const licht: Licht = { x: lx / lh, y: ly / lh, z: 0.35 };
      const [v, start, nei] = DREHUNG[id]!;
      // Im Sonnensystem sind die Planeten maßstäblich nur wenige Bildpunkte groß: dort deutlich größer zeigen,
      // beim Heranfliegen an die Erde gleitet das auf die wahre Größe zurück
      const wahr = kl.kugelR * S * PX * (id === 'erde' || id === 'mond' ? 1.02 : 1);
      // Mindestgröße in Bildpunkten, damit man die Planeten erkennt, sobald das Sonnensystem in Sicht ist.
      // Nach oben begrenzt durch den Abstand der Bahnen (45 Einheiten, in der Schrägsicht gestaucht):
      // so bleibt jeder Planet auf seiner Bahn, nichts schiebt sich ineinander.
      const mindest = (1.6 + 12 * rampe(ln, -4.2, -0.6)) * (0.7 + 0.3 * Math.min(1.6, kl.kugelR / 8)) * (1 - rampe(ln, 0.6, 2.4));
      // Bahnabstand in Richtung des Planeten: quer zur Blickrichtung voll, in die Tiefe um K gestaucht
      const richtung = Math.atan2(kl.y / Math.max(l.K, 1e-3), kl.x);
      const deckel = Math.max(0.9, 0.45 * 45 * S * PX * Math.hypot(Math.cos(richtung), l.K * Math.sin(richtung)));
      const r = Math.max(wahr, Math.min(mindest, deckel));
      zeichneKugel(c, w.tex, { id, x, y, r, drehung: start + t * v, neigung: nei, deckkraft: kl.kugelDeckkraft * szeneDa }, licht);
    }
  }, [frame, bereit]);

  useLayoutEffect(() => {
    if (bereit) continueRender(warten);
  }, [bereit]);

  const rad = 940 * PX;
  return (
    <AbsoluteFill className={`flug-${fassung}`} style={{ background: GRUND[fassung] }}>
      {/* Hell: Helligkeit L wird zu Goldtinte, Farbe = 1 − L · (1 − Gold #9a7a33); Schwarz bleibt reines Weiß */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="flug-tinte" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={[0.4, 0.52, 0.8].map((k) => `${(-k * 0.3 * 0.85).toFixed(4)} ${(-k * 0.59 * 0.85).toFixed(4)} ${(-k * 0.11 * 0.85).toFixed(4)} 0 1`).join(' ') + ' 0 0 0 1 0'} />
        </filter>
      </svg>
      <canvas ref={raum} width={BREITE} height={BREITE} style={{ position: 'absolute', inset: 0 }} />
      {/* Planeten über der Radix-Szene: Die Erde verdeckt ihre eigene Bahn; zu Zeichen werden sie ohnehin ausgeblendet */}
      <div ref={host} className="radix flug-szene" style={{ left: MITTE - rad / 2, top: MITTE - rad / 2, width: rad, height: rad }} />
      <canvas ref={koerper} width={BREITE} height={BREITE} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};
