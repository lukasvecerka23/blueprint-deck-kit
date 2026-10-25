// Scene 1 (Hook: documents of every kind) and scene 3 (Agent: the prompt is pasted, files flow in).
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Terminal, Check, MessageSquare, Sparkles } from 'lucide-react';
import { AGENT, FILES, FILE_TYPES } from '../content';
import { C, FONT, MONO } from '../theme';
import { clamp, Logo, useLayout } from '../components/common';

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

// Scene 3: the two ways to run it. Left/top: a terminal agent gets the pasted prompt and reads the
// repo. Right/bottom: a chat app gets attached docs and a plain request. No vendor logos.
export const Agent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const u = square ? 1.0 : 1.2 * k;
  const fs = 19 * u; // terminal font
  const cardW = square ? w - 80 : 880 * k;
  const gap = 50 * k;
  const term = square ? { x: 40, y: 28, w: cardW } : { x: (w - 2 * cardW - gap) / 2, y: 225 * k, w: cardW };
  const chat = square ? { x: 40, y: 400, w: cardW } : { x: term.x + cardW + gap, y: 190 * k, w: cardW };
  const termIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const chatIn = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 140 } });
  const pasted = interpolate(frame, [10, 16], [0, 1], clamp);
  const sent = interpolate(frame, [28, 34], [0, 1], clamp);
  const pos = square ? POS_SQUARE : POS_WIDE;
  const termCenter = { x: term.x + term.w / 2, y: term.y + 160 * u };
  const typed = Math.floor(interpolate(frame, [48, 84], [0, AGENT.chatMessage.length], clamp));
  const heading = (t: string, x: number, y: number, op: number) =>
    square ? null : (
      <div style={{ position: 'absolute', left: x, top: y - 52 * k, color: '#c7d2fe', fontSize: 22 * k, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', opacity: op, fontFamily: FONT }}>{t}</div>
    );
  const titleBar = (label: string, icon: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `${11 * u}px ${18 * u}px`, borderBottom: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.03)', fontFamily: FONT }}>
      {['#f87171', '#fbbf24', '#34d399'].map((c) => <div key={c} style={{ width: 12 * u, height: 12 * u, borderRadius: 99, background: c, opacity: 0.8 }} />)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, color: C.muted, fontSize: 16 * u }}>{icon} {label}</div>
    </div>
  );
  const card: React.CSSProperties = { position: 'absolute', borderRadius: 20 * u, overflow: 'hidden', background: 'rgba(10,13,26,0.98)', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 30px 80px rgba(0,0,0,.55)', zIndex: 2 };

  return (
    <AbsoluteFill>
      {/* files flow into the terminal */}
      {FILES.map((f, i) => {
        if (i % 2) return null;
        const [fx, fy] = pos[i];
        const p = spring({ frame: frame - 34 - i * 3, fps, config: { damping: 22, stiffness: 80 } });
        if (frame < 34 + i * 3) return null;
        const sx = fx * w;
        const sy = fy * h;
        const x = sx + (termCenter.x - sx) * p;
        const y = sy + (termCenter.y - sy) * p;
        const op = Math.min(interpolate(p, [0, 0.15], [0, 1], clamp), interpolate(p, [0.55, 0.9], [1, 0], clamp));
        return (
          <div key={f.name} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 - 0.45 * p})`, opacity: op, zIndex: 3 }}>
            <FileCard name={f.name} type={f.type} meta={f.meta} size={square ? 0.8 : k} />
          </div>
        );
      })}

      {heading(AGENT.terminalHeading, term.x + 6, term.y, termIn)}
      {heading(AGENT.chatHeading, chat.x + 6, chat.y, chatIn)}

      {/* terminal */}
      <div style={{ ...card, left: term.x, top: term.y, width: term.w, opacity: termIn, transform: `translateY(${(1 - termIn) * 30}px)`, fontFamily: MONO }}>
        {titleBar(square ? `${AGENT.terminalHeading} · ${AGENT.title}` : AGENT.title, <Terminal size={17 * u} color={C.muted} />)}
        <div style={{ padding: `${18 * u}px ${24 * u}px ${20 * u}px`, fontSize: fs, color: C.text, lineHeight: 1.55, minHeight: (square ? 250 : 300) * u, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: 12, opacity: pasted, transform: `translateY(${(1 - pasted) * 8}px)` }}>
            <span style={{ color: '#a78bfa' }}>&gt;</span>
            <div style={{ borderLeft: '3px solid rgba(167,139,250,0.6)', paddingLeft: 12, background: `rgba(139,92,246,${0.12 * (1 - sent * 0.6)})`, borderRadius: 4, flex: 1, minWidth: 0 }}>
              {AGENT.prompt.map((l, i) => (
                <div key={l} style={{ color: i === 0 ? '#fff' : '#c4b5fd', fontWeight: i === 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
              ))}
            </div>
          </div>
          {frame < 10 ? (
            <div style={{ color: C.dim }}>
              &gt; <span style={{ display: 'inline-block', width: fs * 0.55, height: fs * 1.05, background: '#93c5fd', verticalAlign: 'text-bottom', opacity: Math.floor(frame / 6) % 2 ? 1 : 0.25 }} />
            </div>
          ) : null}
          <div style={{ marginTop: 12 * u }}>
            {AGENT.lines.map((l, i) => {
              const at = 46 + i * 24;
              const op = interpolate(frame, [at, at + 6], [0, 1], clamp);
              const last = i === AGENT.lines.length - 1;
              return (
                <div key={l} style={{ opacity: op, color: last ? '#86efac' : C.muted, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                  {i === 0 ? <span style={{ color: '#60a5fa' }}>●</span> : <Check size={fs * 0.9} color={last ? '#86efac' : '#60a5fa'} />}
                  {l}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* paste hint */}
      <div style={{ position: 'absolute', left: term.x + term.w - 150 * u, top: square ? term.y + 7 : term.y - 50 * k, zIndex: 4, opacity: Math.min(interpolate(frame, [2, 8], [0, 1], clamp), interpolate(frame, [26, 34], [1, 0], clamp)), fontFamily: FONT, display: 'flex', gap: 8, alignItems: 'center', color: C.text, fontSize: 20 * u, fontWeight: 600 }}>
        <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(180deg,#1d2440,#121729)', border: '1.5px solid rgba(148,163,184,0.35)' }}>⌘V</span> paste
      </div>

      {/* chat */}
      <div style={{ ...card, left: chat.x, top: chat.y, width: chat.w, opacity: chatIn, transform: `translateY(${(1 - chatIn) * 30}px)`, fontFamily: FONT }}>
        {titleBar(square ? `${AGENT.chatHeading} · any AI app` : AGENT.chatTitle, <MessageSquare size={17 * u} color={C.muted} />)}
        <div style={{ padding: `${18 * u}px ${24 * u}px`, minHeight: (square ? 270 : 300) * u, boxSizing: 'border-box' }}>
          {/* user: attachments + message, right-aligned */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 * u }}>
            <div style={{ display: 'flex', gap: 8 * u }}>
              {AGENT.chatFiles.map((f, i) => {
                const q = spring({ frame: frame - (24 + i * 6), fps, config: { damping: 16, stiffness: 160 } });
                const color = FILE_TYPES[f.type].color;
                return (
                  <div key={f.name} style={{ opacity: q, transform: `scale(${0.8 + 0.2 * q})`, display: 'flex', alignItems: 'center', gap: 8 * u, padding: `${6 * u}px ${12 * u}px ${6 * u}px ${6 * u}px`, borderRadius: 10 * u, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.22)', whiteSpace: 'nowrap' }}>
                    <span style={{ padding: `${2 * u}px ${6 * u}px`, borderRadius: 6 * u, background: `${color}26`, color, fontSize: 12 * u, fontWeight: 800 }}>{f.type}</span>
                    <span style={{ color: C.text, fontSize: 16 * u }}>{f.name}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ maxWidth: '82%', minHeight: 30 * u, padding: `${12 * u}px ${16 * u}px`, borderRadius: `${16 * u}px ${16 * u}px 4px ${16 * u}px`, background: 'rgba(59,130,246,0.22)', border: '1px solid rgba(96,165,250,0.35)', color: '#fff', fontSize: 20 * u, lineHeight: 1.4, opacity: interpolate(frame, [44, 48], [0, 1], clamp) }}>
              {AGENT.chatMessage.slice(0, typed)}
              {frame < 90 ? <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#93c5fd', marginLeft: 2, verticalAlign: '-2px', opacity: Math.floor(frame / 6) % 2 ? 1 : 0.2 }} /> : null}
            </div>
          </div>
          {/* assistant */}
          <div style={{ display: 'flex', gap: 12 * u, marginTop: 16 * u, opacity: interpolate(frame, [94, 100], [0, 1], clamp) }}>
            <div style={{ width: 34 * u, height: 34 * u, borderRadius: 99, flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18 * u} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: frame < 116 ? C.muted : C.text, fontSize: 19 * u, marginTop: 5 * u }}>{frame < 116 ? AGENT.chatReading : AGENT.chatReply}</div>
              {frame >= 116 ? (
                <div style={{ marginTop: 10 * u, display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${10 * u}px ${16 * u}px ${10 * u}px ${10 * u}px`, borderRadius: 14 * u, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.25)', opacity: interpolate(frame, [116, 124], [0, 1], clamp), transform: `translateY(${interpolate(frame, [116, 124], [8, 0], clamp)}px)` }}>
                  <Logo size={40 * u} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 18 * u, whiteSpace: 'nowrap' }}>{AGENT.chatResult.name}</div>
                    <div style={{ color: C.muted, fontSize: 14.5 * u, whiteSpace: 'nowrap' }}>{AGENT.chatResult.meta}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: square ? 815 : 760 * k, textAlign: 'center', fontFamily: FONT, color: C.muted, fontSize: square ? 25 : 28 * k, fontWeight: 500, letterSpacing: 0.2, opacity: interpolate(frame, [16, 30], [0, 1], clamp), zIndex: 3 }}>
        {AGENT.agents}
      </div>
    </AbsoluteFill>
  );
};
