// Partner-Radix als Video: Clara und Jonas drehen sich, zerfallen zu Goldstaub, der Staub strömt in einem
// Wirbel zur Mitte und formt dort die Doppelradix, die sich zum Schluss Ring für Ring nachzeichnet.
// Jedes Bild hängt nur von der Bildnummer ab, so ruckelt nichts und Vor- und Zurückspulen stimmt.
import '../../node_modules/@fontsource/stix-two-text/400.css';
import '../../node_modules/@fontsource/stix-two-text/500.css';
import '../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './radix.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { baueSzene, type Szene } from '../../src/scripts/kosmos/szene';
import { layout, ASC0, ASC_V } from '../../src/scripts/kosmos/layout';
import { TEMPO_RADIX, teil } from '../../src/scripts/kosmos/zeitplan';
import { laengen, RADIX_REIHE } from '../../src/scripts/kosmos/modell';
import { TAU_A, TAU_B, ASC_VERSATZ_B } from '../../src/scripts/partner/paar';
import { erzeugeKoerner, maskeRad, maskeDoppel, type Geometrie, type Korn, type Rad } from '../../src/scripts/partner/sand';
import { baueDoppel, type Doppel } from '../../src/scripts/partner/doppel';
import type { Sprache } from '../../src/scripts/kosmos/texte';
import { kornImWirbel, type Ort } from './wirbel';

export type Fassung = 'hell' | 'dunkel';
export type Format = 'quer' | 'hoch';
export interface PartnerVideoProps {
  fassung: Fassung;
  format: Format;
  sprache: Sprache;
  koerner: number;
}

/* Lage der Räder im Bild: Mitte und Durchmesser in Pixeln */
const LAGE: Record<Format, { a: [number, number, number]; b: [number, number, number]; d: [number, number, number] }> = {
  quer: { a: [500, 540, 620], b: [1420, 540, 620], d: [960, 540, 900] },
  hoch: { a: [540, 520, 640], b: [540, 1400, 640], d: [540, 960, 980] },
};
/* Drehung wie auf der Seite: ein Viertel des Kosmos-Tempos */
const DREHTEMPO = 0.25;
/* Zerfallskante wie auf der Seite: verrauschtes Maskenbild, dreimal so hoch wie das Rad */
const RAND = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='600' viewBox='0 0 200 600' preserveAspectRatio='none'>" +
    "<filter id='f' x='-0.2' y='-0.1' width='1.4' height='1.2'><feTurbulence type='fractalNoise' baseFrequency='0.04 0.025' numOctaves='2' seed='4'/>" +
    "<feDisplacementMap in='SourceGraphic' scale='46' xChannelSelector='R' yChannelSelector='G'/></filter>" +
    "<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0.47' stop-opacity='0'/><stop offset='0.53'/></linearGradient>" +
    "<rect x='-40' y='-40' width='280' height='680' fill='url(#g)' filter='url(#f)'/></svg>",
)}")`;

const FARBE = {
  dunkel: { sand: '#f0d590', grund: '#07102a', himmel: 'radial-gradient(120% 70% at 50% 0%, #101c48 0%, transparent 70%), linear-gradient(180deg, #08122e 0%, #060e26 100%)', sterne: ['stars-dark-fern.svg', 'stars-dark-nah.svg'], korn: 1 },
  hell: { sand: '#8c6a24', grund: '#ffffff', himmel: 'none', sterne: ['stars-light-fern.svg', 'stars-light-nah.svg'], korn: 1.35 },
};

export const PartnerVideo: React.FC<PartnerVideoProps> = ({ fassung, format, sprache, koerner }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const hostA = useRef<HTMLDivElement>(null), hostB = useRef<HTMLDivElement>(null), hostD = useRef<HTMLDivElement>(null);
  const leinwand = useRef<HTMLCanvasElement>(null);
  const welt = useRef<{ a: Szene; b: Szene; d: Doppel; koerner: Korn[] } | null>(null);
  const [warten] = useState(() => delayRender('Räder und Schriften'));
  const lage = LAGE[format];
  const farbe = FARBE[fassung];

  /* einmal: Räder bauen, Sand anlegen, auf die Schriften warten */
  useLayoutEffect(() => {
    const a = baueSzene(hostA.current!, 201, sprache, { nurRadix: true });
    const b = baueSzene(hostB.current!, 202, sprache, { nurRadix: true });
    const d = baueDoppel(hostD.current!, 203, sprache, '');
    const dick = fassung === 'hell' ? 1.6 : 1;
    a.setzeStrich(dick); b.setzeStrich(dick); d.setzeStrich(dick);
    const la = laengen(TAU_A), lb = laengen(TAU_B);
    welt.current = {
      a, b, d,
      koerner: erzeugeKoerner(koerner, 11, RADIX_REIHE.map((r) => la[r.id]), RADIX_REIHE.map((r) => lb[r.id])),
    };
    document.fonts.ready.then(() => continueRender(warten));
  }, []);

  /* jedes Bild */
  useLayoutEffect(() => {
    const w = welt.current;
    if (!w) return;
    const t = (frame / fps) * DREHTEMPO;
    const tauA = TAU_A + TEMPO_RADIX * t, tauB = TAU_B + TEMPO_RADIX * t;
    const ascA = ASC0 + ASC_V * t, ascB = ascA + ASC_VERSATZ_B;
    w.a.zeichne(layout(tauA, 1, ascA));
    w.b.zeichne(layout(tauB, 1, ascB));

    // kurz stehen lassen, dann der ganze Übergang, am Ende kurz die fertige Doppelradix
    const s = Math.min(1, Math.max(0, (frame - 12) / (durationInFrames - 36)));
    const d = maskeDoppel(s);
    w.d.zeichne(laengen(tauA), laengen(tauB), ascA, teil(d, 0.75, 1));
    w.d.einzeichnen(d);

    const m = maskeRad(s);
    for (const h of [hostA.current!, hostB.current!]) {
      const st = h.style;
      if (m <= 0) { st.maskImage = ''; continue; }
      st.maskImage = RAND;
      st.maskSize = '100% 300%';
      st.maskRepeat = 'no-repeat';
      st.maskPosition = `0 ${(92.5 - 85 * m).toFixed(2)}%`;
    }

    // Sand
    const c = leinwand.current!, ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    if (s <= 0 || s >= 1) return;
    const rad = ([x, y, dm]: [number, number, number], asc: number): Rad => ({ cx: x, cy: y, massstab: dm / 940, asc });
    const g: Geometrie = { a: rad(lage.a, ascA), b: rad(lage.b, ascB), doppel: rad(lage.d, ascA) };
    const jetzt: Ort = { x: 0, y: 0, o: 0, frisch: 0, ruht: false }, vorher: Ort = { x: 0, y: 0, o: 0, frisch: 0, ruht: false };
    const dunkel = fassung === 'dunkel';
    ctx.globalCompositeOperation = dunkel ? 'lighter' : 'source-over';
    ctx.fillStyle = farbe.sand;
    ctx.strokeStyle = farbe.sand;

    // Bewegungsspuren: kurze Linien zur Lage einen Augenblick zuvor, alle in einem Zug gezeichnet
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = dunkel ? 0.15 : 0.18;
    ctx.beginPath();
    for (const k of w.koerner) {
      kornImWirbel(k, s, g, jetzt);
      if (jetzt.o <= 0.02 || jetzt.ruht) continue;
      kornImWirbel(k, s - 0.004, g, vorher);
      const dx = jetzt.x - vorher.x, dy = jetzt.y - vorher.y;
      if (dx * dx + dy * dy < 1) continue;
      ctx.moveTo(vorher.x, vorher.y);
      ctx.lineTo(jetzt.x, jetzt.y);
    }
    ctx.stroke();

    // Körner; frisch gelöste leuchten auf, das gibt das Licht an der Zerfallskante
    for (const k of w.koerner) {
      kornImWirbel(k, s, g, jetzt);
      if (jetzt.o <= 0.02) continue;
      // gelandeter Sand liegt dicht beieinander: zurückhaltender, damit er wie Goldstaub wirkt und nicht ausbrennt
      const gr = k.groesse * farbe.korn * (1 + 0.6 * jetzt.frisch);
      const grund = jetzt.ruht ? (dunkel ? 0.3 : 0.5) : dunkel ? 0.42 : 0.8;
      ctx.globalAlpha = Math.min(1, jetzt.o * grund * (1 + 0.8 * jetzt.frisch));
      ctx.fillRect(jetzt.x - gr / 2, jetzt.y - gr / 2, gr, gr);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [frame]);

  const platz = ([x, y, dm]: [number, number, number]): React.CSSProperties => ({ left: x - dm / 2, top: y - dm / 2, width: dm, height: dm });
  return (
    <AbsoluteFill className={`video-${fassung}`} style={{ background: farbe.grund, backgroundImage: farbe.himmel }}>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(farbe.sterne[0])}), url(${staticFile(farbe.sterne[1])})`, backgroundSize: '1200px 1200px', backgroundPosition: '0 0, 380px 520px', opacity: dunkel(fassung) ? 1 : 0.8 }} />
      <div ref={hostD} className="radix" style={platz(lage.d)} />
      <div ref={hostA} className="radix" style={platz(lage.a)} />
      <div ref={hostB} className="radix" style={platz(lage.b)} />
      <canvas ref={leinwand} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};

const dunkel = (f: Fassung) => f === 'dunkel';
