import { Easing, interpolate } from 'remotion';
import type { Rect } from './data';

// screen = (world - c) * s + a
export type Cam = { s: number; cx: number; cy: number; ax: number; ay: number };

export const fit = (rect: Rect, avail: Rect, maxScale = 2.4): Cam => {
  const s = Math.min(avail.w / rect.w, avail.h / rect.h, maxScale);
  return { s, cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2, ax: avail.x + avail.w / 2, ay: avail.y + avail.h / 2 };
};

const mix = (a: Cam, b: Cam, p: number): Cam => ({
  s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * p),
  cx: a.cx + (b.cx - a.cx) * p,
  cy: a.cy + (b.cy - a.cy) * p,
  ax: a.ax + (b.ax - a.ax) * p,
  ay: a.ay + (b.ay - a.ay) * p,
});

export type CamKey = { at: number; cam: Cam; dur?: number };

const ease = Easing.bezier(0.65, 0, 0.35, 1);

export const camAt = (frame: number, keys: CamKey[]): Cam => {
  let cur = keys[0].cam;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (frame < k.at) break;
    const p = ease(interpolate(frame, [k.at, k.at + (k.dur ?? 36)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
    cur = mix(cur, k.cam, p);
  }
  return cur;
};

export const toScreen = (cam: Cam, x: number, y: number) => ({ x: (x - cam.cx) * cam.s + cam.ax, y: (y - cam.cy) * cam.s + cam.ay });

export const camTransform = (cam: Cam) =>
  `translate(${cam.ax - cam.cx * cam.s}px, ${cam.ay - cam.cy * cam.s}px) scale(${cam.s})`;
