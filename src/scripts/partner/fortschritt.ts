// Fortschritt des Sandübergangs aus der Scrollposition: 0 = Paar ganz, 1 = Doppelradix fertig.

export interface Kasten {
  top: number;
  bottom: number;
  height: number;
}

/* Beginn: die Unterkante des Paars steigt über 85 % der Fensterhöhe, frühestens aber mit dem
   ersten Scrollen. Ende: die Mitte der Doppelradix erreicht die Fenstermitte, oder die Seite ist zu Ende.
   Gerechnet wird in Scrollstrecke, damit das Bild nur von der Position abhängt. */
export function fortschritt(paar: Kasten, doppel: Kasten, fensterHoehe: number, seitenRest: number, scrollY: number): number {
  const beginn = Math.max(0, scrollY + paar.bottom - fensterHoehe * 0.85);
  const ende = scrollY + doppel.top + doppel.height / 2 - fensterHoehe / 2;
  if (scrollY <= beginn) return 0;
  if (seitenRest <= 0 || scrollY >= ende) return 1;
  return Math.min(1, (scrollY - beginn) / Math.max(1, ende - beginn));
}
