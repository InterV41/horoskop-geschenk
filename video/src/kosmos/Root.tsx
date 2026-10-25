import { Composition } from 'remotion';
import { KosmosVideo, type KosmosVideoProps } from './KosmosVideo';
import { FILM_FPS, filmLaenge } from '../../../src/scripts/kosmos/film';

/* Je Fassung (hell, dunkel) und Sprache (Tierkreisnamen im Rad); quadratisch wie das Rad auf der Seite */
const GROESSE = 1440;
const varianten: { id: string; props: KosmosVideoProps }[] = [];
for (const sprache of ['de', 'en'] as const)
  for (const fassung of ['dunkel', 'hell'] as const) varianten.push({ id: `kosmos-${fassung}-${sprache}`, props: { fassung, sprache } });

export const Root: React.FC = () => (
  <>
    {varianten.map((v) => (
      <Composition key={v.id} id={v.id} component={KosmosVideo} durationInFrames={filmLaenge()} fps={FILM_FPS} width={GROESSE} height={GROESSE} defaultProps={v.props} />
    ))}
  </>
);
