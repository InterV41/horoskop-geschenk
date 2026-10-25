// Kosmos-Flug für die Startseite: von der Milchstraße hinein ins Sonnensystem bis zur Erde.
// Dort setzt die bisherige Verwandlung ein: Die Erde wird zur Mitte, die Planeten wandern in den Tierkreis,
// die Radix zeichnet sich ein. Das letzte Bild gleicht genau dem Zustand, mit dem die laufende Radix
// der Seite weitermacht. Jedes Bild hängt nur von der Bildnummer ab.
import '../../node_modules/@fontsource/stix-two-text/400.css';
import '../../node_modules/@fontsource/stix-two-text/500.css';
import '../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './radix.css';
import './flug/flug.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { baueSzene, type Szene } from '../../src/scripts/kosmos/szene';
import { layout, type Richtungen, type Layout } from '../../src/scripts/kosmos/layout';
import type { Sprache } from '../../src/scripts/kosmos/texte';
import { BREITE, MITTE, PX, FPS, VERWANDLUNG_AB, SCHWENK_AB, SCHWENK_BIS, lnMassstab, verwandlung, modellzeit, aszendentImFilm, rampe } from './flug/drehbuch';
import { erzeugeHimmel, baueMaler, kamera, type Fassung, type Himmel, type Maler } from './flug/galaxie';
import { zeichneErde, zeichneMond, type Licht } from './flug/erde';

export interface KosmosFlugProps {
  fassung: Fassung;
  sprache: Sprache;
}

const GRUND: Record<Fassung, string> = { dunkel: '#07102a', hell: '#ffffff' };

let himmelCache: Himmel | null = null;

/* Zustand der Szene in Sekunde t. Die Drehwege der Verwandlung werden ab ihrem Beginn nachgerechnet,
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

export const KosmosFlug: React.FC<KosmosFlugProps> = ({ fassung, sprache }) => {
  const frame = useCurrentFrame();
  const host = useRef<HTMLDivElement>(null);
  const hinten = useRef<HTMLCanvasElement>(null);
  const vorne = useRef<HTMLCanvasElement>(null);
  const welt = useRef<{ szene: Szene; maler: Maler } | null>(null);
  const [warten] = useState(() => delayRender('Szene, Himmel und Schriften'));

  useLayoutEffect(() => {
    const szene = baueSzene(host.current!, 301, sprache, { nurRadix: true });
    szene.setzeStrich(fassung === 'hell' ? 1.6 : 1);
    himmelCache ??= erzeugeHimmel();
    welt.current = { szene, maler: baueMaler(himmelCache, fassung) };
    // Schriften der Zeichen ausdrücklich laden, sie sind am Anfang noch unsichtbar
    Promise.all([
      document.fonts.load('29px "Noto Sans Symbols"', '☉☽☿♀♂♃♄♅♆♇'),
      document.fonts.load('29px "Noto Sans Symbols 2"', '♈♉♊♋♌♍♎♏♐♑♒♓'),
      document.fonts.load('16px "STIX Two Text"', 'WIDDER'),
      document.fonts.load('500 16px "STIX Two Text"', 'WIDDER'),
    ]).then(() => document.fonts.ready).then(() => continueRender(warten));
  }, []);

  useLayoutEffect(() => {
    const w = welt.current;
    if (!w) return;
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

    /* Szene: Bahnen tauchen auf, sobald das Sonnensystem ein paar Bildpunkte groß ist */
    const szeneDeckkraft = rampe(ln, -6.2, -3.4);
    const st = host.current!.style;
    st.visibility = szeneDeckkraft <= 0.001 ? 'hidden' : '';
    st.opacity = szeneDeckkraft.toFixed(3);
    st.transform = `scale(${S}) translate(${(-cx * PX).toFixed(3)}px, ${(-cy * PX).toFixed(3)}px)`;
    w.szene.zeichne(l);

    /* Himmel */
    const k = kamera(ln, t), kv = kamera(lnMassstab(t - 1 / FPS), t - 1 / FPS);
    const h = hinten.current!.getContext('2d')!;
    h.clearRect(0, 0, BREITE, BREITE);
    w.maler.zeichne(h, k, kv, (1 - 0.45 * rampe(ln, -9, -2)) * (1 - 0.25 * rampe(t, VERWANDLUNG_AB, VERWANDLUNG_AB + 5)));

    /* Vorne: Lichthof der Sonne beim Anflug, Erde und Mond aus der Nähe */
    const v = vorne.current!.getContext('2d')!;
    v.clearRect(0, 0, BREITE, BREITE);
    w.maler.sonne(v, k, ln, 1);
    const bildpunkt = (x: number, y: number): [number, number] => [MITTE + (x - cx) * S * PX, MITTE + (y - cy) * S * PX];
    // Licht kommt von der Sonne, bezogen auf den Platz der Erde im Sonnensystem
    const lx = -E0.x, ly = -E0.y, lh = Math.hypot(lx, ly) || 1;
    const licht: Licht = { x: lx / lh, y: ly / lh, z: 0.42 };
    const er = l.koerper.erde, mo = l.koerper.mond;
    const [ex, ey] = bildpunkt(er.x, er.y), erad = er.kugelR * S * PX;
    const [mx, my] = bildpunkt(mo.x, mo.y), mrad = mo.kugelR * S * PX;
    const vorErde = mo.y > er.y; // der Mond vor oder hinter der Erde
    const mond = () => zeichneMond(v, fassung, mx, my, mrad * 1.02, licht, mo.kugelDeckkraft * rampe(mrad, 2, 6) * szeneDeckkraft);
    if (!vorErde) mond();
    zeichneErde(v, fassung, ex, ey, erad * 1.03, 30 + t * 7, licht, er.kugelDeckkraft * rampe(erad, 2.5, 8) * szeneDeckkraft);
    if (vorErde) mond();
  }, [frame]);

  const rad = 940 * PX;
  return (
    <AbsoluteFill className={`flug-${fassung}`} style={{ background: GRUND[fassung] }}>
      <canvas ref={hinten} width={BREITE} height={BREITE} style={{ position: 'absolute', inset: 0 }} />
      <div ref={host} className="radix flug-szene" style={{ left: MITTE - rad / 2, top: MITTE - rad / 2, width: rad, height: rad }} />
      <canvas ref={vorne} width={BREITE} height={BREITE} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};
