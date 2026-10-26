import { Composition } from 'remotion';
import { PartnerVideo, type PartnerVideoProps } from './PartnerVideo';
import { KosmosFlug } from './KosmosFlug';
import { BILDER as FLUG_BILDER, FPS as FLUG_FPS, BREITE as FLUG_BREITE } from './flug/drehbuch';

/* 12 Sekunden bei 30 Bildern: Zerfall, Wirbel, Aufbau, Nachzeichnen */
const LAENGE = 360;
const FPS = 30;

/* Je Fassung (hell, dunkel), Format (quer für Computer, hoch für Handy) und Sprache (Tierkreisnamen im Rad) */
const varianten: { id: string; props: PartnerVideoProps; w: number; h: number }[] = [];
for (const sprache of ['de', 'en'] as const)
  for (const fassung of ['dunkel', 'hell'] as const)
    for (const format of ['quer', 'hoch'] as const)
      varianten.push({
        id: `partner-${fassung}-${format}-${sprache}`,
        props: { fassung, format, sprache, koerner: format === 'quer' ? 120000 : 110000, nurSand: false },
        w: format === 'quer' ? 1920 : 1080,
        h: format === 'quer' ? 1080 : 1920,
      });
/* Für die Webseite: nur der Sand, die Räder zeichnet die Seite scharf selbst (sprachunabhängig) */
for (const fassung of ['dunkel', 'hell'] as const)
  for (const format of ['quer', 'hoch'] as const)
    varianten.push({
      id: `partner-sand-${fassung}-${format}`,
      props: { fassung, format, sprache: 'de', koerner: format === 'quer' ? 120000 : 110000, nurSand: true },
      w: format === 'quer' ? 1920 : 1080,
      h: format === 'quer' ? 1080 : 1920,
    });

export const Root: React.FC = () => (
  <>
    {varianten.map((v) => (
      <Composition key={v.id} id={v.id} component={PartnerVideo} durationInFrames={LAENGE} fps={FPS} width={v.w} height={v.h} defaultProps={v.props} />
    ))}
    {/* Kosmos-Flug für die Startseite: quadratisch, je Fassung und Sprache */}
    {(['de', 'en'] as const).flatMap((sprache) =>
      (['dunkel', 'hell'] as const).flatMap((fassung) => [
        <Composition key={`flug-${fassung}-${sprache}`} id={`kosmos-flug-${fassung}-${sprache}`} component={KosmosFlug} durationInFrames={FLUG_BILDER} fps={FLUG_FPS} width={FLUG_BREITE} height={FLUG_BREITE} defaultProps={{ fassung, sprache }} />,
        /* mit Deckkraft: oben das Bild, unten die Deckkraft; in doppelter Auflösung gezeichnet (2160 breit) */
        <Composition key={`flug-${fassung}-${sprache}-alpha`} id={`kosmos-flug-${fassung}-${sprache}-alpha`} component={KosmosFlug} durationInFrames={FLUG_BILDER} fps={FLUG_FPS} width={FLUG_BREITE * 2} height={FLUG_BREITE * 4} defaultProps={{ fassung, sprache, alpha: true, dichte: 2 }} />,
      ]),
    )}
  </>
);
