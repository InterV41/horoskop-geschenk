// Fortschritt des Sandübergangs aus der Scrollposition: 0 = Paar ganz, 1 = Doppelradix fertig.
// Zwei Abschnitte: Bis die Doppelradix in ihrer Bahn stehen bleibt, zerfallen A und B und der Sand
// fällt (0 bis LANDEN_AB). Solange sie steht, landet der Sand und baut sie auf (LANDEN_AB bis 1).

export interface Kasten {
  top: number;
  bottom: number;
  height: number;
}

export const LANDEN_AB = 0.45;

export interface Lage {
  paar: Kasten; // die beiden Räder samt Beschriftung
  bahn: Kasten; // Bereich, in dem die Doppelradix beim Scrollen stehen bleibt
  doppelHoehe: number;
  stickyTop: number; // Abstand vom Fensterrand, an dem sie stehen bleibt
  fensterHoehe: number;
  seitenRest: number; // noch scrollbare Strecke nach unten
  scrollY: number;
}

export function fortschritt(l: Lage): number {
  const y = l.scrollY;
  // Beginn: die Unterkante des Paars steigt über 85 % der Fensterhöhe, frühestens mit dem ersten Scrollen
  const beginn = Math.max(0, y + l.paar.bottom - l.fensterHoehe * 0.85);
  const festAb = Math.max(beginn + 1, y + l.bahn.top - l.stickyTop);
  const festBis = Math.max(festAb + 1, y + l.bahn.bottom - l.stickyTop - l.doppelHoehe);
  const wert = (z: number) => {
    if (z <= beginn) return 0;
    if (z < festAb) return (LANDEN_AB * (z - beginn)) / (festAb - beginn);
    return Math.min(1, LANDEN_AB + ((1 - LANDEN_AB) * (z - festAb)) / (festBis - festAb));
  };
  // Endet die Seite vorher, wird der Weg bis zum Seitenende gestreckt. Reste unter einem Pixel zählen als Ende.
  const seitenEnde = y + Math.max(0, l.seitenRest - 1);
  if (y >= seitenEnde) return 1;
  const amEnde = wert(seitenEnde);
  if (amEnde < 1) return amEnde > 0 ? wert(y) / amEnde : 0;
  return wert(y);
}
