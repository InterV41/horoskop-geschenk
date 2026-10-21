# Partner-Radix: zwei Radixe zerfallen zu Sand und werden zur Doppelradix

Stand: 21. Oktober 2026 · Status: Konzept, zur Freigabe

## Ziel

Auf der Seite Partnerschaftshoroskop (`/partnerschaftshoroskop`, englisch `/en/partnership-horoscope`) stehen oben zwei Radixe nebeneinander, A und B. Beim Runterscrollen zerfallen beide wie Sand, die Körner rieseln nach unten und setzen sich darunter zu einer dritten Radix zusammen: der Doppelradix (Synastrie) aus A und B.

### Was Valentin entschieden hat

| Frage | Entscheidung |
| --- | --- |
| Radix oben | **Die vorhandene Kosmos-Radix im fertigen Zustand**, ohne Sonnensystem, Himmel und Funken. Sie dreht sich wie auf der Geburtshoroskop-Seite. |
| Ergebnis unten | **Doppelradix**: gemeinsamer Tierkreis, innen die Planeten von A, außen die von B, Häuser von A, Aspekte nur zwischen A und B. So wird Synastrie in der Praxis gezeigt. |
| Übergang | **Zerfall zu Sand**: A und B lösen sich in Körner auf, die nach unten rieseln und die Doppelradix bilden. |
| Auslöser | **Scrollen**, wie die Kosmos-Radix auf der Geburtshoroskop-Seite. Zurückscrollen spult zurück. |
| Planeten | Planetenzeichen in den Rädern ja, **keine Umlaufbahnen, kein Sonnensystem**. |

### Nicht Teil dieser Arbeit

- Keine echten Geburtsdaten: Beide Konstellationen sind erfunden.
- Kein Composit, kein Davison.
- Keine Änderung am Verhalten oder Aussehen der Kosmos-Radix auf Start- und Geburtshoroskop-Seite.
- Keine neue Bibliothek, kein WebGL.
- Der Platzhalter-Charakter der Seite bleibt (noindex, „Demnächst“, Mail-Knopf).

## Aufbau der Seite

`Demnaechst.astro` bekommt für `art="partner"` diese Reihenfolge:

1. Marke „Demnächst“, Überschrift
2. **Paar**: Radix A und Radix B nebeneinander, darunter klein „A“ und „B“ (bzw. die Namen aus `texte.ts`, siehe unten)
3. Einleitungstext und Hinweis wie bisher
4. **Doppelradix**, groß und mittig
5. Mail-Knopf und Link zum Geburtshoroskop

Desktop: A und B je etwa 40 % der Inhaltsbreite, Doppelradix etwa 70 %, höchstens so hoch wie 80 % des Fensters. Handy (unter 640 px): A und B je knapp die halbe Breite nebeneinander, Doppelradix volle Breite mit 16 px Rand. Das Kinderhoroskop bleibt unverändert.

## Die drei Räder

### A und B

Jedes Rad nutzt `baueSzene` aus `src/scripts/kosmos/szene.ts` mit `layout(tau, 1, asc)`, also den Endzustand der Verwandlung. Damit stimmen Maße, Linien, Schrift, Farben und Hell/Dunkel mit der Geburtshoroskop-Seite überein.

- Himmel (Sterne, Nebel) und Funken werden für diese Räder nicht gezeigt. Dafür bekommt `baueSzene` eine Option `nurRadix`, die diese Ebenen gar nicht erst anlegt. Ohne Option verhält sich die Szene wie bisher.
- Eigene Konstellationen: A startet bei Modellzeit `TAU_A`, B bei `TAU_B`, beide laufen im Radix-Tempo (`TEMPO_RADIX`) weiter. Die Werte werden so gewählt, dass zwischen A und B mehrere klare Aspekte entstehen (mindestens ein weicher und ein harter).
- Eigene Aszendenten: A startet bei `ASC0`, B um 95° versetzt. Beide drehen mit `ASC_V` (1° pro Sekunde), wie die Kosmos-Radix.

### Doppelradix

Neue Szene `src/scripts/partner/doppel.ts`, gebaut aus denselben Teilen:

- **Tierkreisring**: Der Code, der in `baueSzene` den Ring mit Scheibe, Gradskala, Grenzen und Namen baut, wandert in eine eigene Funktion `baueTierkreis(svg, defs, id, tx)` in `src/scripts/kosmos/tierkreis.ts`. `baueSzene` ruft sie auf (keine sichtbare Änderung), die Doppelradix ebenso.
- **Häuser von A**, Achsen ASC/IC/DC/MC und Nabe wie in der Kosmos-Radix. Der Aszendent ist der von A, das Rad dreht sich also im Gleichlauf mit A.
- **Zwei Planetenringe**: A innen auf Spur `SPUR_INNEN = 250`, B außen auf `SPUR_AUSSEN = 306`, getrennt durch einen feinen Kreis bei `R_TRENN = 278`. B steht in der Farbe `--rx-partner` (hell: kühles Blaugrau `#4f6a86`, dunkel: `#9fc3d9`), A in der üblichen Goldschrift. Planetenzeichen etwas kleiner als in der Einzelradix (`26` statt `29`), damit beide Ringe Platz haben. Liegen zwei Zeichen im selben Ring näher als 7°, werden sie wie in der Praxis leicht auseinandergeschoben (nur das Zeichen, die Markierung am Aspektring bleibt am echten Grad).
- **Aspekte nur zwischen A und B**, Regeln wie `aspekte()` in `modell.ts` (Sextil, Quadrat, Trigon, Opposition, dazu Konjunktion mit Orb 8°). Weich durchgezogen, hart gestrichelt, Linien wie in der Kosmos-Radix. Für A die Markierung am Aspektring wie gewohnt, für B ein kleiner Ring statt eines Punkts.
- Planetenzeichen als bewegliche HTML-Elemente wie in `szene.ts` (kein Zittern).

## Ablauf beim Scrollen

`s` ist der Fortschritt von 0 bis 1:

- `s = 0`, solange die Unterkante des Paars noch unterhalb von 85 % der Fensterhöhe liegt (also auch ganz oben auf der Seite, wenn das Paar ganz zu sehen ist).
- `s = 1`, sobald die Mitte der Doppelradix die Fenstermitte erreicht.
- dazwischen linear in der Scrollstrecke, für das Bild mit `glatt()` aus `zeitplan.ts` geglättet.

| s | Was passiert |
| --- | --- |
| 0 | A und B ganz, Doppelradix leer (nur ein ganz zarter Umriss des äußeren Kreises, Deckkraft 0,08, damit der Platz nicht leer wirkt) |
| 0 – 0,45 | A und B zerfallen: Körner lösen sich von oben nach unten, mit etwas Zufall. Wo sich Körner gelöst haben, verschwindet das Rad (Maske, siehe unten). |
| 0,15 – 0,85 | Körner rieseln nach unten zur Doppelradix, mit leichter Seitwärtsdrift |
| 0,45 – 1 | Doppelradix entsteht: Körner landen von außen nach innen, die Linien und Zeichen blenden unter den gelandeten Körnern auf |
| 0,9 – 1 | Aspektlinien zwischen A und B blenden ein, die Körner verblassen |
| 1 | Doppelradix fertig, keine Körner mehr zu sehen |

Rückwärts scrollen spielt dieselbe Abbildung rückwärts ab. Die Räder drehen sich in jedem Zustand weiter, Start- und Zielpunkte der Körner drehen mit.

## Sand

Eigenes Modul `src/scripts/partner/sand.ts` (rein rechnend, ohne DOM) und eine Canvas-Ebene.

- **Körner**: rund 2400 auf dem Desktop, 1200 auf dem Handy (unter 640 px Breite). Feste Saat, also bei jedem Besuch gleich.
- **Herkunft**: Jedes Korn gehört zu A oder B und hat einen Startpunkt in Radix-Koordinaten (Radius, Winkel im Tierkreis), verteilt auf die sichtbaren Teile: Ränder und Ringe, Zeichengrenzen, Häuserlinien, Planeten- und Tierkreiszeichen (kleine Wolken an ihrer Position). Gewichtung nach Linienlänge, damit die Dichte gleichmäßig wirkt.
- **Ziel**: ein Punkt der Doppelradix nach derselben Regel. Körner von A landen bevorzugt innen (A-Planeten, Häuser, Nabe), Körner von B bevorzugt außen (B-Planeten, Tierkreisring).
- **Zeitfenster pro Korn**: Ablösen zwischen 0 und 0,45, abhängig von der Höhe im Rad (oben früher) plus Zufall ±0,08; Landen zwischen 0,45 und 0,95, abhängig vom Zielradius (außen früher) plus Zufall.
- **Weg**: Bezier-Kurve vom Start zum Ziel in Seitenkoordinaten, mit einem Kontrollpunkt seitlich versetzt (Wind) und einem leichten Durchhängen nach unten. Unterwegs zittern die Körner minimal (Rauschen aus der Saat, kein `Math.random` pro Bild).
- **Aussehen**: Punkte von 0,8 bis 1,8 px in `--rx-gold`, Deckkraft 0,5 bis 0,95. Im Dunkeln mit leichtem Schein (ein zweiter, größerer Punkt mit geringer Deckkraft), im Hellen ohne.
- **Canvas**: `position: fixed` über dem ganzen Fenster, `pointer-events: none`, hinter dem Text (`z-index` unter dem Inhalt). Gezeichnet wird nur, wenn `0 < s < 1` ist. Bei `s = 0` oder `s = 1` ist sie leer und die Schleife zeichnet nicht. Gerätepixelverhältnis höchstens 2.
- **Maske für den Zerfall**: Die Räder A und B bekommen eine CSS-Maske (`mask-image`, linearer Verlauf von oben nach unten mit weicher, leicht welliger Kante aus einem SVG-Rauschmuster), deren Kante mit dem Ablösen der Körner nach unten wandert. Die Doppelradix bekommt dieselbe Maske umgekehrt, von außen nach innen als radialer Verlauf.

## Daten und Rechnung

- `src/scripts/partner/paar.ts`: `TAU_A`, `TAU_B`, Aszendent-Versatz, `laengenA(tau)`, `laengenB(tau)` (beide über `laengen()` aus `modell.ts`), `synastrie(la, lb)` liefert die Aspekte zwischen A und B.
- `src/scripts/partner/fortschritt.ts`: `fortschritt(paarRect, doppelRect, fensterHoehe)` → `s`.
- `src/scripts/partner/sand.ts`: `erzeugeKoerner(n, saat)`, `kornOrt(korn, s, geometrie)` → `{ x, y, deckkraft }` in Seitenkoordinaten. `geometrie` enthält Mitte, Maßstab und Aszendent aller drei Räder.
- Komponente `src/components/PartnerRadix.astro`: rendert das Paar und die Doppelradix als zwei Hosts (die Seite setzt den Text dazwischen über Slots), startet eine gemeinsame Bildschleife für alle drei Räder und den Sand. Die Schleife läuft nur, solange einer der Hosts im Bild und der Tab sichtbar ist (wie in `KosmosRadix.astro`).

## Sprache

Die Tierkreisnamen kommen wie bisher aus `texte.ts`. Neu sind die Bezeichnungen unter dem Paar: Deutsch „Partner A“ und „Partner B“, Englisch „Partner A“ und „Partner B“. Die Beschreibung für Screenreader: „Zwei Geburtsbilder, die sich zu einer Doppelradix verbinden“ bzw. „Two birth charts merging into a combined synastry chart“.

## Barrierefreiheit und Bewegung

- Bei `prefers-reduced-motion: reduce`: keine Drehung, kein Sand, keine Maske. A, B und die Doppelradix stehen fertig da.
- Canvas und alle Zeichen-Ebenen sind `aria-hidden`. Jede Radix hat `role="img"` mit Beschreibung.
- Hell und Dunkel folgen der Seite (`themechange`), wie in der Kosmos-Radix.

## Leistung

- Ein `requestAnimationFrame` für alles. Räder wie bisher (Ring dreht als Ganzes per CSS).
- Sand nur während des Übergangs. Pro Bild höchstens die Körner neu berechnen, keine Objekte erzeugen (Arrays vorab anlegen).
- Ziel: flüssig auf einem Mittelklasse-Handy; falls nicht, Kornzahl über eine Konstante senken.

## Tests

Vitest, im Stil der vorhandenen Tests unter `tests/kosmos`:

- `fortschritt`: 0 vor Beginn, 1 am Ende, dazwischen monoton, geklemmt.
- `synastrie`: nur Paare aus A und B, richtige Erkennung von Konjunktion, Sextil, Quadrat, Trigon, Opposition an konstruierten Längen; Orb-Grenzen.
- Konstellationen: Zu `TAU_A` und `TAU_B` gibt es mindestens einen weichen und einen harten Aspekt zwischen A und B.
- `sand`: gleiche Saat ergibt gleiche Körner; bei `s = 0` liegt jedes Korn auf seinem Startpunkt und ist unsichtbar, bei `s = 1` auf dem Ziel und unsichtbar; Ablöse- und Landefenster liegen in den festgelegten Bereichen.
- `baueTierkreis`-Auslagerung: vorhandene Kosmos-Tests bleiben grün.

Danach Sichtprüfung im Browser: Desktop und Handy, hell und dunkel, Scrollen vor und zurück, „Bewegung reduzieren“, Geburtshoroskop- und Startseite unverändert.
