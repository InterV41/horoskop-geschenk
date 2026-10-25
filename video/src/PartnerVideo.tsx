// Partner-Radix als Video: Clara und Jonas zerfallen zu Goldstaub, der Staub strömt in einem Wirbel zur
// Mitte und formt dort die Doppelradix, die sich zum Schluss Ring für Ring nachzeichnet.
// Für die Seite wird nur der Sand gebraucht (nurSand): schwarzer bzw. weißer Grund, den die Seite
// wegblendet; die Räder zeichnet die Seite selbst scharf als Vektorgrafik darunter, im selben Takt.
// Ohne nurSand entsteht der ganze Film mit Rädern und Himmel (etwa für Social Media).
// Jedes Bild hängt nur von der Bildnummer ab, so ruckelt nichts und Vor- und Zurückspulen stimmt.
import '../../node_modules/@fontsource/stix-two-text/400.css';
import '../../node_modules/@fontsource/stix-two-text/500.css';
import '../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './radix.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { baueSzene, type Szene } from '../../src/scripts/kosmos/szene';
import { layout } from '../../src/scripts/kosmos/layout';
import { teil } from '../../src/scripts/kosmos/zeitplan';
import { laengen, RADIX_REIHE } from '../../src/scripts/kosmos/modell';
import type { Sprache } from '../../src/scripts/kosmos/texte';
import { TAU_A, TAU_B } from '../../src/scripts/partner/paar';
import { erzeugeKoerner, maskeRad, maskeDoppel, type Geometrie, type Korn, type Rad } from '../../src/scripts/partner/sand';
import { baueDoppel, type Doppel } from '../../src/scripts/partner/doppel';
import { setzeZerfall } from '../../src/scripts/partner/zerfall';
import { FILM_LAGE, filmFortschritt, filmStand, type FilmFormat } from '../../src/scripts/partner/film';
import { kornImWirbel, type Ort } from './wirbel';

export type Fassung = 'hell' | 'dunkel';
export interface PartnerVideoProps {
  fassung: Fassung;
  format: FilmFormat;
  sprache: Sprache;
  koerner: number;
  nurSand: boolean;
}

const FARBE = {
  dunkel: { sand: '#f0d590', grund: '#07102a', himmel: 'radial-gradient(120% 70% at 50% 0%, #101c48 0%, transparent 70%), linear-gradient(180deg, #08122e 0%, #060e26 100%)', sterne: ['stars-dark-fern.svg', 'stars-dark-nah.svg'], korn: 1 },
  hell: { sand: '#8c6a24', grund: '#ffffff', himmel: 'none', sterne: ['stars-light-fern.svg', 'stars-light-nah.svg'], korn: 1.35 },
};

export const PartnerVideo: React.FC<PartnerVideoProps> = ({ fassung, format, sprache, koerner, nurSand }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const hostA = useRef<HTMLDivElement>(null), hostB = useRef<HTMLDivElement>(null), hostD = useRef<HTMLDivElement>(null);
  const leinwand = useRef<HTMLCanvasElement>(null);
  const welt = useRef<{ a?: Szene; b?: Szene; d?: Doppel; koerner: Korn[] } | null>(null);
  const [warten] = useState(() => delayRender('Räder und Schriften'));
  const lage = FILM_LAGE[format];
  const farbe = FARBE[fassung];
  const dunkel = fassung === 'dunkel';

  /* einmal: Räder bauen (nicht bei nurSand), Sand anlegen, auf die Schriften warten */
  useLayoutEffect(() => {
    const la = laengen(TAU_A), lb = laengen(TAU_B);
    const koernerListe = erzeugeKoerner(koerner, 11, RADIX_REIHE.map((r) => la[r.id]), RADIX_REIHE.map((r) => lb[r.id]));
    if (nurSand) {
      welt.current = { koerner: koernerListe };
    } else {
      const a = baueSzene(hostA.current!, 201, sprache, { nurRadix: true });
      const b = baueSzene(hostB.current!, 202, sprache, { nurRadix: true });
      const d = baueDoppel(hostD.current!, 203, sprache, '');
      const dick = fassung === 'hell' ? 1.6 : 1;
      a.setzeStrich(dick); b.setzeStrich(dick); d.setzeStrich(dick);
      welt.current = { a, b, d, koerner: koernerListe };
    }
    document.fonts.ready.then(() => continueRender(warten));
  }, []);

  /* jedes Bild */
  useLayoutEffect(() => {
    const w = welt.current;
    if (!w) return;
    const { tauA, tauB, ascA, ascB } = filmStand(frame);
    const s = filmFortschritt(frame);
    if (w.a && w.b && w.d) {
      w.a.zeichne(layout(tauA, 1, ascA));
      w.b.zeichne(layout(tauB, 1, ascB));
      const d = maskeDoppel(s);
      w.d.zeichne(laengen(tauA), laengen(tauB), ascA, teil(d, 0.75, 1));
      w.d.einzeichnen(d);
      const m = maskeRad(s);
      setzeZerfall(hostA.current!, m);
      setzeZerfall(hostB.current!, m);
    }

    // Sand
    const c = leinwand.current!, ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    if (s <= 0 || s >= 1) return;
    const rad = ([x, y, dm]: readonly [number, number, number], asc: number): Rad => ({ cx: x, cy: y, massstab: dm / 940, asc });
    const g: Geometrie = { a: rad(lage.a, ascA), b: rad(lage.b, ascB), doppel: rad(lage.d, ascA) };
    const jetzt: Ort = { x: 0, y: 0, o: 0, frisch: 0, ruht: false }, vorher: Ort = { x: 0, y: 0, o: 0, frisch: 0, ruht: false };
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

    // Körner; frisch gelöste leuchten auf, das gibt das Licht an der Zerfallskante.
    // Gelandeter Sand liegt dicht: zurückhaltender, damit er wie Goldstaub wirkt und nicht ausbrennt
    for (const k of w.koerner) {
      kornImWirbel(k, s, g, jetzt);
      if (jetzt.o <= 0.02) continue;
      const gr = k.groesse * farbe.korn * (1 + 0.6 * jetzt.frisch);
      const grund = jetzt.ruht ? (dunkel ? 0.3 : 0.5) : dunkel ? 0.42 : 0.8;
      ctx.globalAlpha = Math.min(1, jetzt.o * grund * (1 + 0.8 * jetzt.frisch));
      ctx.fillRect(jetzt.x - gr / 2, jetzt.y - gr / 2, gr, gr);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [frame]);

  const platz = ([x, y, dm]: readonly [number, number, number]): React.CSSProperties => ({ left: x - dm / 2, top: y - dm / 2, width: dm, height: dm });
  // nur Sand: einfarbiger Grund, den die Seite wegblendet (dunkel: Schwarz und „screen“, hell: Weiß und „multiply“)
  if (nurSand)
    return (
      <AbsoluteFill style={{ background: dunkel ? '#000000' : '#ffffff' }}>
        <canvas ref={leinwand} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill className={`video-${fassung}`} style={{ background: farbe.grund, backgroundImage: farbe.himmel }}>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(farbe.sterne[0])}), url(${staticFile(farbe.sterne[1])})`, backgroundSize: '1200px 1200px', backgroundPosition: '0 0, 380px 520px', opacity: dunkel ? 1 : 0.8 }} />
      <div ref={hostD} className="radix" style={platz(lage.d)} />
      <div ref={hostA} className="radix" style={platz(lage.a)} />
      <div ref={hostB} className="radix" style={platz(lage.b)} />
      <canvas ref={leinwand} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};
