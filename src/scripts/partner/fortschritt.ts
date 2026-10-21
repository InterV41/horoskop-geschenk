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
  // Reste unter einem Pixel (hohe Pixeldichte) zählen schon als Seitenende
  const seitenEnde = scrollY + Math.max(0, seitenRest - 1);
  const ende = Math.min(scrollY + doppel.top + doppel.height / 2 - fensterHoehe / 2, seitenEnde);
  let beginn = Math.max(0, scrollY + paar.bottom - fensterHoehe * 0.85);
  if (ende - beginn < 1) beginn = 0; // Seite zu kurz: über den ganzen Scrollweg verteilen
  if (scrollY >= ende) return 1;
  if (scrollY <= beginn) return 0;
  return (scrollY - beginn) / (ende - beginn);
}
