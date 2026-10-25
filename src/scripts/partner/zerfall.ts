// Zerfallskante der Räder Clara und Jonas: verrauschtes Maskenbild, dreimal so hoch wie das Rad, oben
// durchsichtig, unten deckend. Geschoben wird nur seine Lage. Seite und Video nutzen dieselbe Kante.

export const ZERFALL_MASKE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='600' viewBox='0 0 200 600' preserveAspectRatio='none'>" +
    "<filter id='f' x='-0.2' y='-0.1' width='1.4' height='1.2'><feTurbulence type='fractalNoise' baseFrequency='0.04 0.025' numOctaves='2' seed='4'/>" +
    "<feDisplacementMap in='SourceGraphic' scale='46' xChannelSelector='R' yChannelSelector='G'/></filter>" +
    "<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0.47' stop-opacity='0'/><stop offset='0.53'/></linearGradient>" +
    "<rect x='-40' y='-40' width='280' height='680' fill='url(#g)' filter='url(#f)'/></svg>",
)}")`;

/* Lage der Maske für einen Zerfallsgrad m (0 = ganz, 1 = zerfallen): die Kante läuft von 35 % über dem Rad
   bis 35 % unter das Rad */
export function zerfallLage(m: number): string {
  return `0 ${(92.5 - 85 * m).toFixed(2)}%`;
}

/* Setzt die Maske auf ein Element; bei m = 0 ohne Maske */
export function setzeZerfall(e: HTMLElement, m: number): void {
  const st = e.style;
  if (m <= 0) {
    st.maskImage = st.webkitMaskImage = '';
    return;
  }
  if (!st.maskImage) {
    st.maskImage = st.webkitMaskImage = ZERFALL_MASKE;
    st.maskSize = st.webkitMaskSize = '100% 300%';
    st.maskRepeat = st.webkitMaskRepeat = 'no-repeat';
  }
  st.maskPosition = st.webkitMaskPosition = zerfallLage(m);
}
