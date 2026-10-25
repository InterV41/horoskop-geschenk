// Steuerung des Kosmos-Films auf der Seite: entscheidet je Bild, ob gezeichnet, gewartet, an die Live-Radix
// übergeben oder auf die Live-Verwandlung ausgewichen wird. Rein und ohne DOM, damit sich der Ablauf prüfen lässt.
import { FILM_FPS, filmLaenge } from './film';

export interface Beobachtung {
  jetzt: number; // Millisekunden
  zeit: number; // Videozeit in Sekunden
  bereit: boolean; // Video liefert ein Bild (readyState ≥ 2) und spult nicht
  ende: boolean;
  fehler: boolean;
}

export type Entscheidung =
  | { art: 'zeichnen'; bild: number } // Filmbild zeigen
  | { art: 'warten'; bild: number } // letztes Bild stehen lassen (lädt noch, spult nach Quellwechsel)
  | { art: 'uebergabe' } // Film zu Ende, die Live-Radix übernimmt
  | { art: 'live'; bild: number }; // Film aufgeben, live ab diesem Bild weiter

const START_FRIST = 2500; // so lange darf das Video brauchen, bis es läuft
const STOCK_FRIST = 1500; // so lange darf es nach dem Start stehen bleiben
const LUECKE = 250; // längere Pausen zwischen zwei Schritten: Tab im Hintergrund, zählt nicht mit

/* laenge und fps: vom gespielten Film, ohne Angabe der Kosmos-Film */
export function erzeugeFilmsteuerung(laenge: number = filmLaenge(), fps: number = FILM_FPS) {
  let gestartet = false;
  let bild = 0;
  let letzteZeit = 0;
  let startAb: number | null = null;
  let fortschrittAb = 0;
  let letzterSchritt: number | null = null;

  const klemm = (b: number) => Math.min(laenge - 1, Math.max(0, b));

  function schritt(e: Beobachtung): Entscheidung {
    // Lücke (keine Bildwechsel, weil die Seite nicht sichtbar war): Fristen um die Lücke verschieben
    if (letzterSchritt !== null && e.jetzt - letzterSchritt > LUECKE) {
      const luecke = e.jetzt - letzterSchritt;
      if (startAb !== null) startAb += luecke;
      fortschrittAb += luecke;
    }
    letzterSchritt = e.jetzt;
    if (startAb === null) { startAb = e.jetzt; fortschrittAb = e.jetzt; }

    if (e.fehler) return { art: 'live', bild: gestartet ? bild : 0 };
    if (e.ende) return { art: 'uebergabe' };

    if (e.bereit) {
      if (e.zeit > letzteZeit + 1e-3 || (!gestartet && e.zeit > 0)) {
        fortschrittAb = e.jetzt;
        if (e.zeit > 0) gestartet = true;
      }
      letzteZeit = e.zeit;
      bild = klemm(Math.round(e.zeit * fps));
    }

    if (!gestartet && e.jetzt - startAb > START_FRIST) return { art: 'live', bild: 0 };
    if (gestartet && e.jetzt - fortschrittAb > STOCK_FRIST) return { art: 'live', bild };
    return gestartet && e.bereit ? { art: 'zeichnen', bild } : { art: 'warten', bild };
  }

  return { schritt, gestartet: () => gestartet };
}
