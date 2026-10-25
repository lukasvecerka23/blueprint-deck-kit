// Short social cut (~26 s): hook -> map builds -> tour -> switcher + edit -> real clip -> end card.
// Same components as the main cut, with the beats from SHORT in content.ts. Midnight (brand) theme.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { OVERLAP, SHORT } from './content';
import { Background, SceneFade, Subtitles, type Sub } from './components/common';
import { Hook } from './scenes/Intro';
import { MapScene } from './scenes/MapScene';
import { EndCard, RealThing } from './scenes/Outro';
import { Music } from './Promo';

export const shortStarts = () => {
  const S = SHORT.scenes;
  const hook = 0;
  const map = hook + S.hook - OVERLAP;
  const real = map + S.map - OVERLAP;
  const end = real + S.real - OVERLAP;
  return { hook, map, real, end, total: end + S.end };
};

export const PromoShort: React.FC = () => {
  const s = shortStarts();
  const S = SHORT.scenes;
  const subs: Sub[] = SHORT.subtitles.map(([scene, from, to, text]) => ({ from: s[scene] + from, to: s[scene] + to, text }));
  return (
    <AbsoluteFill style={{ background: '#06070d' }}>
      <Background />
      <Sequence from={s.hook} durationInFrames={S.hook} name="Documents">
        <SceneFade dur={S.hook} fadeIn={0}><Hook /></SceneFade>
      </Sequence>
      <Sequence from={s.map} durationInFrames={S.map} name="Map, tour, switcher, edit">
        <SceneFade dur={S.map}><MapScene beats={SHORT.beats} /></SceneFade>
      </Sequence>
      <Sequence from={s.real} durationInFrames={S.real} name="Real clip">
        <SceneFade dur={S.real}><RealThing dur={S.real} startFrom={SHORT.real.startFrom} captions={SHORT.real.captions} /></SceneFade>
      </Sequence>
      <Sequence from={s.end} durationInFrames={S.end} name="End card">
        <SceneFade dur={S.end} fadeOut={0}><EndCard /></SceneFade>
      </Sequence>
      <Subtitles items={subs} />
      <Music />
    </AbsoluteFill>
  );
};
