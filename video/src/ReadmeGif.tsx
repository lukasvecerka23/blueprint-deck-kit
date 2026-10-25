// 1200x630, 8 s loop: the map assembles, the tour camera glides to two steps, then everything fades
// back to the empty background so the last frame matches the first.
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MapWorld } from './map/MapWorld';
import { FOCUS, type Rect } from './map/data';
import { camAt, camTransform, fit } from './map/camera';
import { Tabs, TourCard } from './map/Chrome';
import { MAP_TEXT } from './content';
import { Background, clamp } from './components/common';


export const GIF = { build: 0, tour: 100, step2: 165, back: 205, fadeOut: 214, end: 240 };

export const ReadmeGif: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width: w, height: h } = useVideoConfig();
  const u = 0.62;
  const cardW = 380;
  const full: Rect = { x: 24, y: 76, w: w - 48, h: h - 96 };
  const tour: Rect = { x: 16, y: 76, w: w - cardW - 60, h: h - 96 };
  const cam = camAt(f, [
    { at: 0, cam: fit(FOCUS.overview, full) },
    { at: GIF.tour, cam: fit(FOCUS.checkoutFan, tour), dur: 36 },
    { at: GIF.step2, cam: fit(FOCUS.payments, tour), dur: 34 },
    { at: GIF.back, cam: fit(FOCUS.overview, full), dur: 30 },
  ]);
  const segs = [
    { from: GIF.tour + 8, to: GIF.step2 + 8, ...FOCUS.tourStep3 },
    { from: GIF.step2 + 2, to: GIF.back + 6, ...FOCUS.tourStep4 },
  ];
  const amt = (s: { from: number; to: number }) => Math.min(interpolate(f, [s.from, s.from + 10], [0, 1], clamp), interpolate(f, [s.to - 10, s.to], [1, 0], clamp));
  const dimNode = (id: string) => Math.max(0, ...segs.map((s) => (s.nodes.includes(id) ? 0 : amt(s))));
  const emphEdge = (id: string) => Math.max(0, ...segs.map((s) => (s.edges.includes(id) ? amt(s) : 0)));
  const dimEdge = (id: string) => Math.max(0, ...segs.map((s) => (s.edges.includes(id) ? 0 : amt(s))));
  const cardIn = spring({ frame: f - (GIF.tour + 10), fps, config: { damping: 20, stiffness: 110 } });
  const cardOut = interpolate(f, [GIF.back - 6, GIF.back + 6], [0, 1], clamp);
  const mixB = interpolate(f, [GIF.step2 - 4, GIF.step2 + 8], [0, 1], clamp);
  const out = interpolate(f, [GIF.fadeOut, GIF.end - 4], [1, 0], clamp);
  const chrome = Math.min(interpolate(f, [4, 20], [0, 1], clamp), out);
  return (
    <AbsoluteFill style={{ background: '#06070d' }}>
      <Background still />
      <AbsoluteFill style={{ opacity: out }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: camTransform(cam) }}>
          <MapWorld frame={f} build={f} speed={1.6} fps={fps} dimNode={dimNode} emphEdge={emphEdge} dimEdge={dimEdge} dotsOnlyHighlighted />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', justifyContent: 'center', opacity: chrome }}>
        <Tabs u={u} active={0} />
      </div>
      {f > GIF.tour + 8 && f < GIF.back + 8 ? (
        <div style={{ position: 'absolute', right: 24, top: 86, opacity: cardIn * (1 - cardOut), transform: `translateX(${(1 - cardIn + cardOut) * 80}px)` }}>
          <TourCard u={u} width={cardW} a={MAP_TEXT.tour[0]} b={MAP_TEXT.tour[1]} mixB={mixB} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
