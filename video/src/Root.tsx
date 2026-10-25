import React from 'react';
import { Composition } from 'remotion';
import { Promo } from './Promo';
import { PromoShort, shortStarts } from './PromoShort';
import { Poster } from './Poster';
import { ReadmeGif, GIF } from './ReadmeGif';
import { FPS, sceneStarts } from './content';

export const RemotionRoot: React.FC = () => {
  const total = sceneStarts().total;
  const short = shortStarts().total;
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={total} fps={FPS} width={1920} height={1080} />
      <Composition id="PromoSquare" component={Promo} durationInFrames={total} fps={FPS} width={1080} height={1080} />
      <Composition id="PromoShort" component={PromoShort} durationInFrames={short} fps={FPS} width={1080} height={1080} />
      <Composition id="PromoShortWide" component={PromoShort} durationInFrames={short} fps={FPS} width={1920} height={1080} />
      <Composition id="ReadmeGif" component={ReadmeGif} durationInFrames={GIF.end} fps={FPS} width={1200} height={630} />
      <Composition id="Poster" component={Poster} durationInFrames={1} fps={FPS} width={1920} height={1080} />
    </>
  );
};
