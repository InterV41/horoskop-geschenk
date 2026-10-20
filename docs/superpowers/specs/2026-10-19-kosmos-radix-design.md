# Kosmos-Radix: Sonnensystem, das sich endlos in die Radix verwandelt

Stand: 19. Oktober 2026 · Status: Konzept, zur Freigabe

## Ziel

Oben auf der Startseite (`src/pages/index.astro`, Element `.start__radix`) läuft eine endlose Animation: Ein Sonnensystem wird zur Radix des Horoskops und wieder zurück. Sie soll sehr hochwertig wirken, ruhig und etwas mystisch, aber klar lesbar. Sie soll so fließen, dass man **keinen Anfang und kein Ende** erkennt. Die meiste Zeit steht die drehende Radix im Bild.

Die Radix am Ziel ist die bestehende Radix (`src/components/RadixAnimation.astro`, gleichwertig mit `Radix_Animation_Dunkel.html` und `Radix_Animation_Hell.html`): gleiche Maße, gleiche Linien, gleiche Schrift, gleiche Drehung, gleiche Aspektregeln.

### Was Valentin entschieden hat

| Frage | Entscheidung |
| --- | --- |
| Stil des Sonnensystems | **D, Kosmos mit Goldzeichnung**, aber **ohne Planetenzeichen an den Planeten** und **ohne Strahlenkranz um die Sonne**. Also: Schrägsicht, Bahnen in Gold, warme plastische Planeten, Nebel, leuchtende Sonne. |
| Hell und dunkel | Die Animation **folgt dem Modus der Seite**. Beide Fassungen werden gebaut. |
| Auslöser | **Endlose Schleife.** Das ersetzt die frühere Idee, den Übergang ans Scrollen zu koppeln. |
| Verwandlung | **Blick von der Erde:** Die Erde wird zur Mitte, die Planeten wandern an ihre Stelle im Tierkreis. |
| Dauer | **rund 40 Sekunden pro Durchlauf**, die Radix-Phase am längsten |

### Nicht Teil dieser Arbeit

- Keine echte Geburtskonstellation: Die Stellung ist erfunden und gehört keiner Person (wie bisher).
- Keine Steuerung durch Scrollen, Klicken oder Maus.
- Kein Video, kein WebGL, keine neue Bibliothek für Animationen.
- Keine Änderungen an Text, Kaufknopf oder Aufbau des ersten Bildschirms.

## Ablauf eines Durchlaufs

Ein Durchlauf dauert `T = 40 s` und wiederholt sich ohne Pause. `p` ist der Verwandlungsgrad: 0 = Sonnensystem, 1 = Radix.

| Abschnitt | Zeit | p | Was man sieht |
| --- | --- | --- | --- |
| Sonnensystem | 0–10 s | 0 | Stil D. Die Planeten kreisen um die Sonne, das ganze System dreht sich sehr langsam mit. |
| Verwandlung | 10–14 s | 0 → 1 | siehe unten |
| Radix | 14–36 s | 1 | die bestehende Radix: Tierkreis dreht sich, Aspekte entstehen und vergehen |
| Rückverwandlung | 36–40 s | 1 → 0 | dieselbe Bewegung, rückwärts |

Die Übergänge folgen einer weichen Kurve (smootherstep, `6x⁵ − 15x⁴ + 10x³`). Damit sind Tempo und Beschleunigung an den Rändern null, und das Auge findet keinen Knick. Hin- und Rückweg nutzen dieselbe Abbildung von `p` auf das Bild. Der Rückweg ist deshalb genau der Hinweg rückwärts, nur die Planeten stehen inzwischen woanders.

**Einstieg:** Beim Laden beginnt die Animation bei `t = 5 s`, also mitten im Sonnensystem. Besucher sehen so nach etwa 5 Sekunden die erste Verwandlung, und nichts wirkt wie ein Start. Der Wert steht als Konstante `EINSTIEG` im Code und lässt sich ändern.

### Die Verwandlung im Einzelnen

Innerhalb der 4 Sekunden laufen die Teilbewegungen gestaffelt. `q` ist der Fortschritt im jeweiligen Teilfenster, jeweils mit smootherstep geglättet.

| Teil | Fenster in p | Bewegung |
| --- | --- | --- |
| Aufrichten | 0,00–0,60 | Neigung der Bahnen von `K = 0,42` (Schrägsicht) auf `K = 1` (Draufsicht) |
| Wandern | 0,00–0,70 | Jeder Körper wandert von seinem Platz im Sonnensystem auf seinen Platz in der Radix (siehe „Positionen“) |
| Kugel → Zeichen | 0,30–0,80 | Die Planetenkugel wird kleiner und blasser, an derselben Stelle wird das goldene Planetenzeichen sichtbar. Der Punkt auf dem Aspektring erscheint mit dem Zeichen. |
| Sonne | 0,00–0,70 | Der Lichthof der Sonne schrumpft und verblasst, die Sonne wird zu ☉ |
| Erde | 0,00–0,60 | Die Erde gleitet in die Mitte und verschwindet dort in der Nabe, ihr Mond wird zu ☽ |
| Bahnen → Ringe | 0,40–1,00 | Die Bahnellipsen werden zu Kreisen und gleiten auf die Radien der Radix-Ringe (Zuordnung unten). Bahnen ohne Gegenstück verblassen. |
| Radix zeichnet sich ein | 0,60–1,00 | Gradskala, Zeichengrenzen, Tierkreisnamen und -zeichen, Häuserlinien, ASC/IC/DC/MC und Nabe mit Hausnummern blenden ein |
| Aspekte | 0,85–1,00 | Die Deckkraft der Aspektlinien wird zusätzlich mit q multipliziert |
| Nebel | 0,00–1,00 | Deckkraft von 1 auf 0,25 |

Sterne bleiben die ganze Zeit sichtbar und bewegen sich nicht. Sie sind der ruhende Hintergrund, der die Schleife zusammenhält.

### Zuordnung Bahnen → Radix-Ringe

Radix-Radien wie bisher: `out 418`, `out−7 411`, `band 370`, `ring 332`, `asp 212`, `hub 92`, `hub−26 66`.

| Bahn | wird zu |
| --- | --- |
| Pluto | out (418) |
| Neptun | out − 7 (411) |
| Uranus | band (370) |
| Saturn | ring (332) |
| Jupiter | asp (212) |
| Mars | hub (92) |
| Erde | hub − 26 (66) |
| Merkur, Venus | schrumpfen Richtung Mitte und verblassen |

Strichstärke und Deckkraft gleiten von den Werten der Bahn auf die Werte des Rings.

## Das Planetenmodell

Unter allem läuft **ein** Modell. Die Radix wird aus dem Sonnensystem berechnet, nicht getrennt davon animiert. So kann beim Übergang nichts springen.

- **Körper:** Sonne, Merkur, Venus, Erde mit Mond, Mars, Jupiter, Saturn, Uranus, Neptun, Pluto. Pluto kommt im Sonnensystem als zarte neunte Bahn mit kleinem, blassem Körper dazu, weil er in der Radix vorkommt.
- **Bahnen:** Kreise um die Sonne, gleichförmige Bewegung. Startwinkel fest (erfundene Konstellation).
- **Zeit:** Das Modell hat eine eigene Zeit `τ` (in Erdumläufen). `τ` läuft immer vorwärts, aber unterschiedlich schnell, siehe „Zeitplan“.
- **Umlaufzeiten:** Die echten Verhältnisse wären für die äußeren Planeten zu langsam. Daher gilt `Winkelgeschwindigkeit_i = ω_Erde · (P_Erde / P_i)^0,6`. Die Reihenfolge stimmt, und alle bewegen sich sichtbar.
- **Mond:** kreist um die Erde, 1,3-mal so schnell wie die Erde um die Sonne (nicht astronomisch). In der Radix bleibt er so langsamer als die Drehung des Rads und zieht wie alle anderen im Uhrzeigersinn (Änderung vom 20.10.2026, vorher 5-mal, dadurch lief er gegen die Drehung).
- **Zwei Arten von Abstand:**
  - *Bildradius:* für das Zeichnen des Sonnensystems, gleichmäßig gestaffelt von Merkur 70 bis Pluto 430 (Einheiten der Zeichenfläche −470…470).
  - *Rechenabstand:* nur für die Blickrichtung von der Erde. Nach dem dritten Keplerschen Gesetz aus den gestauchten Umlaufzeiten: `a_i = (P_i / P_Erde)^(0,6 · 2/3)` in AE. Echte Abstände zusammen mit gestauchten Zeiten würden die Rückläufigkeit verhindern, weil Mars dann schneller wäre als die Erde. Mit Kepler bleibt jeder äußere Planet langsamer, und die Geometrie stimmt.
- **Länge von der Erde aus (geozentrisch):** `λ_i = atan2(y_i − y_Erde, x_i − x_Erde)` mit Rechenabständen. Für die Sonne ergibt das `λ_Erde + 180°`, für den Mond seinen Winkel um die Erde. Dadurch entsteht ganz von selbst echtes Verhalten: Merkur und Venus bleiben nahe bei der Sonne (höchstens `asin(a)`, also rund 34° und 55°), äußere Planeten werden zeitweise rückläufig.
- **Aspekte:** werden aus den Längen `λ` mit den bestehenden Regeln berechnet (60° Orb 5, 90°/120°/180° Orb 8, weich durchgezogen, hart gestrichelt, je genauer desto kräftiger).

## Zeitplan

- **Phasenuhr:** `t` = Sekunden seit Start (nur gezählt, solange die Animation läuft), `φ = (t + EINSTIEG) mod 40`. Daraus ergibt sich `p(φ)` nach der Ablauftabelle.
- **Tempo der Modellzeit:** `dτ/dt = mix(TEMPO_SONNENSYSTEM, TEMPO_RADIX, p)` mit `TEMPO_RADIX = 0,5 / 360` Erdumläufen pro Sekunde. Im Sonnensystem läuft die Erde etwa 6-mal so schnell wie in der Radix. In der Radix entspricht das Tempo der bisherigen Animation: Die Sonne wandert rund 0,5° pro Sekunde durch den Tierkreis. `τ` wird Bild für Bild aufsummiert, dadurch ist es stetig und ohne Sprünge.
- **Drehung:** Der Aszendent dreht sich immer mit 1° pro Sekunde (wie bisher). Das Sonnensystem dreht sich **nicht** mit: Sonst liefen die langsamen äußeren Planeten scheinbar rückwärts (Änderung vom 20.10.2026). Den Unterschied gleicht die Verwandlung aus.

Hinweis zur Nahtlosigkeit: Bei `φ = 0` und `φ = 40` ist der *Verwandlungszustand* gleich (beide Male mitten im Sonnensystem). Die Planeten stehen dann woanders, weil die Zeit weiterläuft. Genau das soll so sein, denn ein exakt gleiches Bild würde die Schleife verraten.

## Positionen im Bild

Für jeden Körper gibt es zwei Endpunkte:

- **Sonnensystem (p = 0):** `x = r_Bild · cos(α)`, `y = r_Bild · sin(α) · K`. Die Sonne steht in der Mitte.
- **Radix (p = 1):** auf der Planetenbahn der Radix, `SPUR = 292`, beim Bildwinkel aus `λ` und Aszendent, wie in der bestehenden Radix. Die Erde steht in der Mitte (Radius 0).

Dazwischen wird **in Polarkoordinaten um die Bildmitte** gemischt: Der Radius gleitet linear, der Winkel nimmt den kürzeren Weg, und `K` wird mitgeführt. So ziehen die Planeten auf Bögen nach außen oder innen, statt quer durch die Mitte zu schneiden. Für Körper mit Radius 0 an einem Ende (Sonne am Anfang, Erde am Ende) gilt der Winkel des anderen Endes.

Tiefe: Im Sonnensystem liegen Planeten auf der hinteren Bahnhälfte hinter der Sonne und sind etwas kleiner (Faktor 0,82…1). Mit `K → 1` läuft der Tiefeneffekt aus.

## Aussehen

### Dunkel

- Grund: Seitenhintergrund und Lichthof wie bisher (`.start__radix::before`)
- Sterne: wie in der Vorschau-Datei (feine Punkte in Creme- und Goldtönen, einige funkeln langsam)
- Nebel: zwei weiche Flächen, violett `#4a3560` und warmes Braun `#5a4420`, Deckkraft ≤ 0,45
- Bahnen: Gold `#e0c27e`, Strich etwa 1,4 (Zeichenfläche −470…470), Deckkraft 0,6
- Sonne: Kern mit Verlauf `#fffbea → #f6d27a → #d99a3a`, Lichthof `#ffe9b0` weich auslaufend. Keine Strahlen, keine Korona.
- Planeten: Kugeln mit Lichtpunkt oben links, Grundfarbe zu 35 % Richtung Gold gemischt, Schatten Richtung `#0a0f22`. Saturn mit Ring.
- Radix: Werte der bestehenden Komponente (`--rx-gold #e0c27e`, `--rx-text #e0c27e`, `--rx-dick 1`, Schnitt 400, Scheibe `rgb(7 16 42 / 0.5)`)

### Hell

- Grund weiß, warmer Schleier `#f3e6c8` statt Nebel, Sterne als feine Goldpunkte
- Bahnen `#86662a`, Deckkraft 0,7
- Planeten wie dunkel, Schatten Richtung `#5a4a35`
- Radix: Werte der bestehenden Komponente (`--rx-gold #86662a`, `--rx-text #5e4413`, `--rx-dick 1,6`, Schnitt 500). Die Hell-Datei aus den Downloads nutzt einfarbig `#9A7A33`. Die Werte der Seite sind schon auf Lesbarkeit abgestimmt und haben deshalb Vorrang.

Schaltet jemand mitten in der Animation um, wechseln die Farben sofort. Die Bewegung läuft ungestört weiter (Ereignis `themechange`, wie bisher).

## Aufbau im Code

| Datei | Aufgabe | hängt ab von |
| --- | --- | --- |
| `src/scripts/kosmos/modell.ts` | Körperdaten, `positionen(τ)` → Sonnenwinkel jedes Körpers, `laengen(τ)` → geozentrische Länge λ, `aspekte(laengen)` | nichts |
| `src/scripts/kosmos/zeitplan.ts` | `phase(φ)` → p, `tempo(p)`, `teil(p, von, bis)` → geglättetes q, Konstanten T, EINSTIEG | nichts |
| `src/scripts/kosmos/layout.ts` | `layout(τ, p, aszendent)` → alle Bildkoordinaten, Größen, Deckkräfte, Strichstärken als reines Datenobjekt | modell, zeitplan |
| `src/scripts/kosmos/szene.ts` | baut das SVG einmal auf und überträgt pro Bild ein Layout auf die Elemente. Übernimmt den Radix-Zeichencode der bisherigen Komponente. | layout |
| `src/components/KosmosRadix.astro` | Hülle: Schriften (Fontsource), CSS-Variablen für hell/dunkel, Bildschleife, Pausieren, Umschalten, reduzierte Bewegung | szene, zeitplan |

`modell`, `zeitplan` und `layout` fassen das DOM nicht an und lassen sich deshalb einzeln testen. `index.astro` bindet `KosmosRadix` statt `RadixAnimation` ein. `RadixAnimation.astro` wird gelöscht, wenn die neue Komponente steht.

### Leistung

- Einmal aufbauen, danach nur Attribute setzen. Kein Neuaufbau pro Bild.
- Gradskala, Zeichengrenzen und Namen liegen in Gruppen. Pro Bild werden nur deren `transform` und `opacity` gesetzt.
- Pro Bild bewegen sich 11 Körper, 10 Zeichen, 10 Punkte, 9 Ringe und 45 mögliche Aspektlinien. Unsichtbare Gruppen (Deckkraft 0) bekommen `visibility: hidden`.
- Keine SVG-Filter (kein Weichzeichner). Verläufe und Deckkraft reichen für den Stil und laufen auch auf dem Handy flüssig.
- Die Bildschleife läuft nur, wenn das Element sichtbar ist (IntersectionObserver) und der Tab im Vordergrund ist (`visibilitychange`). Die Zeit springt nach einer Pause nicht nach (Schritt pro Bild höchstens 100 ms, wie bisher).

### Barrierefreiheit

- `role="img"` mit `aria-label="Animation: Das Sonnensystem verwandelt sich in ein Geburtshoroskop-Rad"`
- Bei `prefers-reduced-motion: reduce`: keine Bewegung, es steht die Radix als Standbild (p = 1, Zeit fest).
- Ohne JavaScript bleibt die Fläche leer, wie bisher.

## Prüfen

### Automatisch (Vitest, neu als Entwicklungsabhängigkeit, `npm test`)

- **zeitplan:** `phase(0) = phase(40)`. `phase` ist stetig: Abtastung in 1-ms-Schritten, kein Sprung größer als der Höchstwert der Kurvensteigung. An allen Übergangsrändern ist die Steigung null. `tempo(p) > 0` für alle p.
- **modell:** Geozentrische Sonne = Erdwinkel + 180°. Merkur und Venus weichen nie mehr als `asin(a) + 0,5°` von der Sonne ab. Mars wird innerhalb von 4 simulierten Erdumläufen mindestens einmal rückläufig (synodische Periode bei Exponent 0,6: rund 3,2 Umläufe).
- **layout:** über zwei volle Durchläufe in Schritten von 1/60 s abgetastet: Kein Körper bewegt sich zwischen zwei Bildern weiter als ein fester Höchstwert (Nahtlosigkeit, auch über die Schleifengrenze). Bei p = 1 stimmen alle Radix-Koordinaten mit den Formeln der bestehenden Radix überein. Bei p = 0 ist alles Radix-Spezifische unsichtbar.

### Im Browser

- hell und dunkel, Umschalten mitten in der Verwandlung
- Handybreite (375 px) und großer Bildschirm
- `prefers-reduced-motion` → Standbild
- Leistungsprofil in den Entwicklerwerkzeugen: gleichmäßig 60 Bilder pro Sekunde, keine langen Aufgaben
- mehrere volle Durchläufe ansehen: Ist eine Naht erkennbar?

## Offene Feinheiten (werden beim Bauen nach Augenmaß eingestellt)

- genaue Tempi (`TEMPO_SONNENSYSTEM`, `TEMPO_RADIX`) und der Exponent 0,6
- Bildradien der Bahnen und die Größe des Sonnensystems im Quadrat
- Staffelung der Teilfenster innerhalb der Verwandlung

Diese Werte stehen als benannte Konstanten oben im Code, damit Valentin sie später selbst nachstellen kann.
