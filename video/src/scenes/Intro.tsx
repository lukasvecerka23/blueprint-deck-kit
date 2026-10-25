// Scene 1 (Hook: documents of every kind) and scene 3 (Agent: the prompt is pasted, files flow in).
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Terminal, Check, CornerDownLeft } from 'lucide-react';
import { AGENT, FILES, FILE_TYPES } from '../content';
import { C, FONT, MONO } from '../theme';
import { clamp, useLayout } from '../components/common';

const POS_WIDE = [[0.14, 0.17], [0.38, 0.11], [0.63, 0.15], [0.87, 0.2], [0.11, 0.46], [0.36, 0.42], [0.64, 0.44], [0.89, 0.5], [0.25, 0.7], [0.75, 0.7]];
const POS_SQUARE = [[0.2, 0.12], [0.55, 0.09], [0.84, 0.17], [0.16, 0.33], [0.5, 0.3], [0.83, 0.38], [0.18, 0.54], [0.52, 0.52], [0.84, 0.6], [0.36, 0.71]];

// A document card. Fixed width; the name and the meta line are truncated, never spill.
export const FileCard: React.FC<{ name: string; type: string; meta: string; size: number }> = ({ name, type, meta, size: s }) => {
  const t = FILE_TYPES[type];
  const color = t.color;
  const bar = (w: number, ml = 0, c = 'rgba(148,163,184,0.16)') => (
    <div style={{ height: 6 * s, width: `${w * 100}%`, marginLeft: ml * s, borderRadius: 9, background: c, marginTop: 7 * s }} />
  );
  return (
    <div style={{ width: 300 * s, padding: 16 * s, borderRadius: 16 * s, background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 18px 40px rgba(0,0,0,.45)', fontFamily: FONT, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s, minWidth: 0 }}>
        <div style={{ flexShrink: 0, minWidth: 56 * s, height: 26 * s, padding: `0 ${7 * s}px`, boxSizing: 'border-box', borderRadius: 7 * s, background: `${color}26`, border: `1px solid ${color}66`, color, fontSize: 12.5 * s, fontWeight: 800, letterSpacing: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{type}</div>
        <div style={{ minWidth: 0, flex: 1, color: C.text, fontSize: 19 * s, fontWeight: 600, fontFamily: t.kind === 'code' ? MONO : FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      </div>
      <div style={{ color: C.muted, fontSize: 14 * s, marginTop: 6 * s, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>
      <div style={{ height: 46 * s, marginTop: 8 * s, overflow: 'hidden' }}>
        {t.kind === 'slides' ? (
          <div style={{ display: 'flex', gap: 8 * s }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 74 * s, height: 42 * s, borderRadius: 5 * s, background: 'rgba(148,163,184,0.12)', borderTop: `${5 * s}px solid ${color}aa` }} />
            ))}
          </div>
        ) : null}
        {t.kind === 'doc' ? (<>{bar(0.9, 0, `${color}55`)}{bar(0.7)}{bar(0.82)}{bar(0.5)}</>) : null}
        {t.kind === 'code' ? (<>{bar(0.45, 0, `${color}66`)}{bar(0.55, 16)}{bar(0.4, 32, `${color}44`)}{bar(0.5, 16)}</>) : null}
        {t.kind === 'sheet' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 * s }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{ height: 12 * s, borderRadius: 2, background: i < 5 ? `${color}55` : 'rgba(148,163,184,0.14)' }} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const pos = square ? POS_SQUARE : POS_WIDE;
  const cardK = square ? 0.8 : k;
  return (
    <AbsoluteFill>
      {FILES.map((f, i) => {
        const [fx, fy] = pos[i];
        const enter = spring({ frame: frame - 4 - i * 5, fps, config: { damping: 18, stiffness: 70 } });
        const fromX = (fx < 0.5 ? -1 : 1) * 260;
        const fromY = (fy < 0.4 ? -1 : 1) * 120;
        const x = fx * w + fromX * (1 - enter) + Math.sin(frame / 37 + i) * 8;
        const y = fy * h + fromY * (1 - enter) + Math.cos(frame / 43 + i * 2) * 7;
        const rot = ((i * 37) % 11 - 5) * 0.8;
        return (
          <div key={f.name} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, opacity: enter }}>
            <FileCard name={f.name} type={f.type} meta={f.meta} size={cardK} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Agent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const term = { x: w / 2, y: square ? h * 0.4 : h * 0.43 };
  const termIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const tw = square ? 980 : 1080 * k;
  const fs = square ? 24 : 26 * k;
  const pasted = interpolate(frame, [10, 16], [0, 1], clamp);
  const sent = interpolate(frame, [28, 34], [0, 1], clamp);
  const flyStart = 32;
  const pos = square ? POS_SQUARE : POS_WIDE;

  return (
    <AbsoluteFill>
      {/* files flow into the terminal */}
      {FILES.map((f, i) => {
        const [fx, fy] = pos[i];
        const p = spring({ frame: frame - flyStart - i * 4, fps, config: { damping: 22, stiffness: 80 } });
        if (frame < flyStart + i * 4) return null;
        const sx = fx * w;
        const sy = fy * h;
        const x = sx + (term.x - sx) * p;
        const y = sy + (term.y - sy) * p;
        const op = Math.min(interpolate(p, [0, 0.15], [0, 1], clamp), interpolate(p, [0.6, 0.95], [1, 0], clamp));
        return (
          <div key={f.name} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.75 - 0.5 * p})`, opacity: op, zIndex: 0 }}>
            <FileCard name={f.name} type={f.type} meta={f.meta} size={square ? 0.8 : k} />
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute', left: term.x - tw / 2, top: term.y - (square ? 230 : 220 * k), width: tw, opacity: termIn, zIndex: 2,
          transform: `scale(${0.9 + 0.1 * termIn})`, borderRadius: 22 * (square ? 1 : k), overflow: 'hidden', fontFamily: MONO,
          background: 'rgba(10,13,26,0.98)', border: '1px solid rgba(148,163,184,0.22)',
          boxShadow: `0 30px 80px rgba(0,0,0,.6), 0 0 ${80 * interpolate(frame, [34, 90], [0, 1], clamp)}px rgba(79,70,229,.35)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `${12 * (fs / 26)}px ${20 * (fs / 26)}px`, borderBottom: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.03)' }}>
          {['#f87171', '#fbbf24', '#34d399'].map((c) => <div key={c} style={{ width: 13 * (fs / 26), height: 13 * (fs / 26), borderRadius: 99, background: c, opacity: 0.8 }} />)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 14, color: C.muted, fontFamily: FONT, fontSize: fs * 0.72 }}>
            <Terminal size={fs * 0.8} color={C.muted} /> {AGENT.title}
          </div>
        </div>
        <div style={{ padding: `${22 * (fs / 26)}px ${28 * (fs / 26)}px ${26 * (fs / 26)}px`, fontSize: fs, color: C.text, lineHeight: 1.6 }}>
          {/* pasted prompt */}
          <div style={{ display: 'flex', gap: 12, opacity: pasted, transform: `translateY(${(1 - pasted) * 8}px)` }}>
            <span style={{ color: '#a78bfa' }}>&gt;</span>
            <div style={{ borderLeft: '3px solid rgba(167,139,250,0.6)', paddingLeft: 14, background: `rgba(139,92,246,${0.12 * (1 - sent * 0.6)})`, borderRadius: 4, flex: 1, minWidth: 0 }}>
              {AGENT.prompt.map((l, i) => (
                <div key={l} style={{ color: i === 0 ? '#fff' : '#c4b5fd', fontWeight: i === 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
              ))}
            </div>
            {frame < 34 ? <CornerDownLeft size={fs} color={frame > 26 ? '#93c5fd' : C.dim} style={{ alignSelf: 'flex-end' }} /> : null}
          </div>
          {frame < 10 ? (
            <div style={{ color: C.dim }}>
              &gt; <span style={{ display: 'inline-block', width: fs * 0.55, height: fs * 1.05, background: '#93c5fd', verticalAlign: 'text-bottom', opacity: Math.floor(frame / 6) % 2 ? 1 : 0.25 }} />
            </div>
          ) : null}
          <div style={{ marginTop: 14 * (fs / 26) }}>
            {AGENT.lines.map((l, i) => {
              const at = 42 + i * 24;
              const op = interpolate(frame, [at, at + 6], [0, 1], clamp);
              const last = i === AGENT.lines.length - 1;
              return (
                <div key={l} style={{ opacity: op, color: last ? '#86efac' : C.muted, display: 'flex', alignItems: 'center', gap: 12, fontSize: fs * 0.95 }}>
                  {i === 0 ? <span style={{ color: '#60a5fa' }}>●</span> : <Check size={fs * 0.9} color={last ? '#86efac' : '#60a5fa'} />}
                  {l}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* paste hint */}
      <div style={{ position: 'absolute', left: term.x + tw / 2 - (square ? 150 : 170 * k), top: term.y - (square ? 290 : 280 * k), zIndex: 3, opacity: Math.min(interpolate(frame, [2, 8], [0, 1], clamp), interpolate(frame, [26, 34], [1, 0], clamp)), fontFamily: FONT, display: 'flex', gap: 8, alignItems: 'center', color: C.text, fontSize: square ? 24 : 24 * k, fontWeight: 600 }}>
        <span style={{ padding: '4px 12px', borderRadius: 8, background: 'linear-gradient(180deg,#1d2440,#121729)', border: '1.5px solid rgba(148,163,184,0.35)' }}>⌘V</span> paste
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: term.y + (square ? 215 : 205 * k), textAlign: 'center', fontFamily: FONT, color: C.muted, fontSize: square ? 30 : 30 * k, fontWeight: 500, letterSpacing: 0.3, opacity: interpolate(frame, [14, 28], [0, 1], clamp), zIndex: 3 }}>
        {AGENT.agents}
      </div>
    </AbsoluteFill>
  );
};
