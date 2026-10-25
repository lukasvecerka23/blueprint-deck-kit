// Poster frame for the landing page (1920x1080, one frame): the fully built map in the brand
// (Midnight) look, overview with the deck UI. Only the build beat runs; everything else is off.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Background } from './components/common';
import { MapScene } from './scenes/MapScene';
import { MAP_BEATS, NEVER, type MapBeats } from './content';

export const POSTER_FRAME = 175; // frames into the build: everything drawn, dots moving
const BEATS: MapBeats = Object.fromEntries(Object.keys(MAP_BEATS).map((k) => [k, k === 'build' ? 0 : NEVER])) as MapBeats;

export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: '#06070d' }}>
    <Background />
    <Sequence from={-POSTER_FRAME}>
      <MapScene beats={BEATS} />
    </Sequence>
  </AbsoluteFill>
);
