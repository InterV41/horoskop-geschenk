// Kosmos-Film: das Sonnensystem verwandelt sich in die Radix, mit Tiefe, Leuchten und Lichtfäden.
// Gerendert auf reinem Schwarz (dunkel) bzw. Weiß (hell); die Seite rechnet den Grund beim Abspielen
// wieder in Durchsichtigkeit um. Jedes Bild hängt nur von der Bildnummer ab (filmLayout).
import '../../../node_modules/@fontsource/stix-two-text/400.css';
import '../../../node_modules/@fontsource/stix-two-text/500.css';
import '../../../node_modules/@fontsource/noto-sans-symbols/400.css';
import '../../../node_modules/@fontsource/noto-sans-symbols-2/400.css';
import './kosmos.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { baueSzene, type Szene } from '../../../src/scripts/kosmos/szene';
import { FILM_RUHE, filmLaenge, filmLayout, lichtfaeden } from '../../../src/scripts/kosmos/film';
import type { Sprache } from '../../../src/scripts/kosmos/texte';

export type Fassung = 'hell' | 'dunkel';
export interface KosmosVideoProps {
  fassung: Fassung;
  sprache: Sprache;
}

/* Feinwerte nach Augenmaß in Remotion Studio */
const GRUND: Record<Fassung, string> = { dunkel: '#000000', hell: '#ffffff' };
const TIEFENSCHAERFE_PX = 3; // Unschärfe ganz hinten, in Pixeln bei 1440 Bildbreite
const LEUCHTEN: Record<Fassung, { gold: string; staerke: number }> = {
  dunkel: { gold: '224, 194, 126', staerke: 1 },
  hell: { gold: '154, 122, 51', staerke: 0.5 },
};
const FADEN: Record<Fassung, string> = { dunkel: '#fff1c8', hell: '#9a7a33' };
const STRICH: Record<Fassung, number> = { dunkel: 1, hell: 1.6 };

/* Stärke des Leuchtens: im Sonnensystem 0,6, mitten in der Verwandlung bis 1, in der Ruhe am Ende auf 0 */
function leuchtStaerke(bild: number, p: number): number {
  const ruheAb = filmLaenge() - FILM_RUHE;
  const verwandlung = 0.6 + 0.4 * Math.sin(Math.PI * p);
  if (bild < ruheAb) return verwandlung;
  return 0.6 * (1 - (bild - ruheAb) / (FILM_RUHE - 1));
}

export const KosmosVideo: React.FC<KosmosVideoProps> = ({ fassung, sprache }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const host = useRef<HTMLDivElement>(null);
  const [szene, setzeSzene] = useState<Szene | null>(null);
  const [warten] = useState(() => delayRender('Radix und Schriften'));

  useLayoutEffect(() => {
    const einheit = width / 940; // Pixel je Zeichenflächen-Einheit
    const s = baueSzene(host.current!, 301, sprache, { nurRadix: true, tiefenschaerfe: TIEFENSCHAERFE_PX / einheit });
    s.setzeStrich(STRICH[fassung]);
    setzeSzene(s);
    document.fonts.ready.then(() => continueRender(warten));
  }, []);

  const l = filmLayout(frame);
  useLayoutEffect(() => {
    szene?.zeichne(l);
  }, [szene, frame]);

  const k = leuchtStaerke(frame, l.p) * LEUCHTEN[fassung].staerke;
  const gold = LEUCHTEN[fassung].gold;
  const leuchten = k > 0.001
    ? `drop-shadow(0 0 ${(6 * k).toFixed(2)}px rgba(${gold}, ${(0.55 * k).toFixed(3)})) drop-shadow(0 0 ${(18 * k).toFixed(2)}px rgba(${gold}, ${(0.35 * k).toFixed(3)}))`
    : 'none';
  const faeden = lichtfaeden(l, frame);

  return (
    <AbsoluteFill className={`film-${fassung}`} style={{ background: GRUND[fassung] }}>
      <AbsoluteFill style={{ filter: leuchten }}>
        <div ref={host} className="radix" />
        <svg viewBox="-470 -470 940 940" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {faeden.map((f, i) =>
            f.deckkraft > 0.001 ? (
              <line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={FADEN[fassung]} strokeWidth={1} strokeLinecap="round" opacity={f.deckkraft} />
            ) : null,
          )}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
