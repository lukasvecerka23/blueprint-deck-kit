import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MousePointer2 } from 'lucide-react';
import { C, FONT, GRADIENT } from '../theme';
import { SUBTITLES, sceneStarts } from '../content';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export type Layout = { w: number; h: number; square: boolean; k: number; subH: number };

// k = scale factor for screen-space UI (1 for 1920x1080).
export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  const square = width === height;
  const k = square ? 0.9 : width / 1920;
  return { w: width, h: height, square, k, subH: square ? 210 : 150 };
};

export const Background: React.FC<{ glow?: number; still?: boolean }> = ({ glow = 1, still }) => {
  const current = useCurrentFrame();
  const frame = still ? 0 : current;
  const { w, h } = useLayout();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 0%, #0d1328 0%, ${C.bg} 60%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.10) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(90% 80% at 50% 45%, black 30%, transparent 100%)',
        }}
      />
      <div style={{ position: 'absolute', left: w * 0.12 + drift, top: -h * 0.25, width: w * 0.55, height: w * 0.55, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.16), transparent 65%)', opacity: glow }} />
      <div style={{ position: 'absolute', right: w * 0.02 - drift, bottom: -h * 0.35, width: w * 0.55, height: w * 0.55, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.17), transparent 65%)', opacity: glow }} />
    </AbsoluteFill>
  );
};

// Fades a whole scene in and out (used with overlapping Sequences).
export const SceneFade: React.FC<{ dur: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode }> = ({ dur, fadeIn = 12, fadeOut = 12, children }) => {
  const frame = useCurrentFrame();
  const op = Math.min(
    fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1,
    fadeOut ? interpolate(frame, [dur - fadeOut, dur], [1, 0], clamp) : 1,
  );
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

export type Sub = { from: number; to: number; text: string };
// Default: the main cut's subtitles. Other cuts pass their own list (global frames).
export const mainSubtitles = (): Sub[] => {
  const starts = sceneStarts();
  return SUBTITLES.map(([scene, from, to, text]) => ({ from: starts[scene] + from, to: starts[scene] + to, text }));
};

export const Subtitles: React.FC<{ items?: Sub[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { k, square, w } = useLayout();
  const active = (items ?? mainSubtitles()).find((s) => frame >= s.from && frame < s.to);
  if (!active) return null;
  const p = spring({ frame: frame - active.from, fps, config: { damping: 20, stiffness: 160 } });
  const out = interpolate(frame, [active.to - 8, active.to], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: (square ? 56 : 54) * (square ? 1 : k), display: 'flex', justifyContent: 'center',
        opacity: p * out, transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      <div
        style={{
          maxWidth: square ? w - 90 : w - 240, textAlign: 'center', fontFamily: FONT, fontWeight: 650, color: '#fff',
          fontSize: square ? 54 : 58 * k, lineHeight: 1.18, letterSpacing: -0.6, padding: square ? '14px 30px' : `${14 * k}px ${34 * k}px`,
          borderRadius: 22 * k, background: 'rgba(6,8,16,0.72)', border: '1px solid rgba(148,163,184,0.14)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#lg)" />
    <rect x="10" y="6" width="16" height="12.5" rx="2.6" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
    <rect x="6" y="10.5" width="18" height="15" rx="3" fill="#fff" />
    <path d="M10.6 16.2h8.6M10.6 16.2l4.3 5.2M19.2 16.2l-4.3 5.2" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <circle cx="10.6" cy="16.2" r="2" fill="#2563eb" />
    <circle cx="19.2" cy="16.2" r="2" fill="#2563eb" />
    <circle cx="14.9" cy="21.4" r="2" fill="#7c3aed" />
  </svg>
);

export const Keycap: React.FC<{ label: string; at: number; until: number; x: number; y: number; size: number; hint?: string }> = ({ label, at, until, x, y, size, hint }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || frame > until) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 180 } });
  const press = interpolate(frame - at, [8, 11, 15], [0, 1, 0], clamp);
  const out = interpolate(frame, [until - 8, until], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})`, opacity: out, display: 'flex', alignItems: 'center', gap: size * 0.3, fontFamily: FONT }}>
      <div
        style={{
          width: size, height: size, borderRadius: size * 0.2, background: 'linear-gradient(180deg,#1d2440,#121729)', border: '1.5px solid rgba(148,163,184,0.35)',
          boxShadow: `0 ${8 - 6 * press}px 0 #070a14, 0 18px 40px rgba(0,0,0,.5), 0 0 ${30 * press}px rgba(99,102,241,.8)`,
          transform: `translateY(${6 * press}px)`, color: '#fff', fontWeight: 700, fontSize: size * 0.48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {label}
      </div>
      {hint ? <div style={{ color: C.text, fontSize: size * 0.3, fontWeight: 600, whiteSpace: 'nowrap' }}>{hint}</div> : null}
    </div>
  );
};

export const Cursor: React.FC<{ x: number; y: number; click?: number; size?: number; opacity?: number }> = ({ x, y, click = 0, size = 34, opacity = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none' }}>
    {click > 0 && click < 1 ? (
      <div style={{ position: 'absolute', left: -size * 1.2 * click, top: -size * 1.2 * click, width: size * 2.4 * click, height: size * 2.4 * click, borderRadius: '50%', border: `3px solid rgba(147,197,253,${1 - click})` }} />
    ) : null}
    <MousePointer2 size={size} color="#fff" fill="#0b1020" strokeWidth={1.6} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))', transform: `scale(${1 - 0.15 * Math.sin(Math.PI * Math.min(1, click * 2))})` }} />
  </div>
);

export const GradientPill: React.FC<{ children: React.ReactNode; size: number }> = ({ children, size }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5, background: GRADIENT, color: '#fff', fontWeight: 600, fontSize: size, padding: `${size * 0.45}px ${size * 0.9}px`, borderRadius: 999, fontFamily: FONT, boxShadow: '0 8px 30px rgba(79,70,229,.45)' }}>
    {children}
  </div>
);
