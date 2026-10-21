// Fortschritt des Sandübergangs aus der Scrollposition: 0 = Paar ganz, 1 = Doppelradix fertig.

export interface Kasten {
  top: number;
  bottom: number;
  height: number;
}

/* Beginn: die Unterkante des Paars steigt über 85 % der Fensterhöhe.
   Ende: die Mitte der Doppelradix erreicht die Fenstermitte, oder die Seite ist zu Ende. */
export function fortschritt(paar: Kasten, doppel: Kasten, fensterHoehe: number, seitenRest: number): number {
  const gelaufen = fensterHoehe * 0.85 - paar.bottom;
  if (gelaufen <= 0) return 0;
  if (seitenRest <= 0) return 1;
  const offen = doppel.top + doppel.height / 2 - fensterHoehe / 2;
  if (offen <= 0) return 1;
  return Math.min(1, gelaufen / (gelaufen + offen));
}
