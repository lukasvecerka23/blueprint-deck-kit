import React from 'react';
import { AbsoluteFill, Audio, Sequence, getStaticFiles, interpolate, staticFile, useVideoConfig } from 'remotion';
import { CONFIG, MUSIC, SCENES, sceneStarts } from './content';
import { MapThemeProvider } from './map/theme';
import { Background, SceneFade, Subtitles } from './components/common';
import { Agent, Hook } from './scenes/Intro';
import { Config } from './scenes/Config';
import { MapScene } from './scenes/MapScene';
import { EndCard, OneFile, RealThing } from './scenes/Outro';

// Plays public/music.mp3 if it exists (fades in and out); otherwise the video stays silent.
export const Music: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const has = getStaticFiles().some((f) => f.name === MUSIC.file);
  if (!has) return null;
  return (
    <Audio
      src={staticFile(MUSIC.file)}
      volume={(f) =>
        interpolate(f, [0, MUSIC.fadeIn, durationInFrames - MUSIC.fadeOut, durationInFrames], [0, MUSIC.volume, MUSIC.volume, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    />
  );
};

// Used by both Promo (16:9) and PromoSquare (1:1); scenes re-lay themselves out from the frame size.
export const Promo: React.FC = () => {
  const s = sceneStarts();
  return (
    <AbsoluteFill style={{ background: '#06070d' }}>
      <Background />
      <Sequence from={s.hook} durationInFrames={SCENES.hook} name="1 Documents">
        <SceneFade dur={SCENES.hook} fadeIn={0}><Hook /></SceneFade>
      </Sequence>
      <Sequence from={s.config} durationInFrames={SCENES.config} name="2 Configurator">
        <SceneFade dur={SCENES.config}><Config /></SceneFade>
      </Sequence>
      <Sequence from={s.agent} durationInFrames={SCENES.agent} name="3 Agent">
        <SceneFade dur={SCENES.agent}><Agent /></SceneFade>
      </Sequence>
      <Sequence from={s.map} durationInFrames={SCENES.map} name="4-10 Map, tour, panel, tabs, switcher, edit, PDF">
        <SceneFade dur={SCENES.map}>
          {/* the map uses the theme picked in the configurator */}
          <MapThemeProvider id={CONFIG.themePick}><MapScene /></MapThemeProvider>
        </SceneFade>
      </Sequence>
      <Sequence from={s.oneFile} durationInFrames={SCENES.oneFile} name="11 One file">
        <SceneFade dur={SCENES.oneFile}><OneFile /></SceneFade>
      </Sequence>
      <Sequence from={s.real} durationInFrames={SCENES.real} name="12 Real product">
        <SceneFade dur={SCENES.real}><RealThing dur={SCENES.real} /></SceneFade>
      </Sequence>
      <Sequence from={s.end} durationInFrames={SCENES.end} name="13 End card">
        <SceneFade dur={SCENES.end} fadeOut={0}><EndCard /></SceneFade>
      </Sequence>
      <Subtitles />
      <Music />
    </AbsoluteFill>
  );
};
