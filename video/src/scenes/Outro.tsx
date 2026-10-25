import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Globe, WifiOff, FileCheck2, Send, GitBranch, Scale, Link2, Copy, Check } from 'lucide-react';
import { END, ONE_FILE, REAL } from '../content';
import { C, FONT, MONO, GRADIENT, GRADIENT_TEXT } from '../theme';
import { clamp, Logo, useLayout } from '../components/common';

export const OneFile: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const u = square ? 0.95 : k;
  const p = spring({ frame: f - 2, fps, config: { damping: 13, stiffness: 120 } });
  const cy = square ? h * 0.36 : h * 0.37;
  const fw = 250 * u;
  const fh = 310 * u;
  const icons = [FileCheck2, WifiOff, Globe];
  // little paper planes leaving the file = "send it to anyone"
  const planes = [0, 1, 2, 3].map((i) => {
    const t = interpolate(f, [28 + i * 9, 70 + i * 9], [0, 1], clamp);
    const ang = (-30 + i * 22) * (Math.PI / 180) * (i % 2 ? 1 : -1);
    const dist = (square ? 420 : 640 * k) * t;
    return { x: w / 2 + Math.cos(ang) * dist * (i % 2 ? 1 : -1), y: cy - 40 * u + Math.sin(ang) * dist * 0.5 - 60 * t, op: Math.sin(Math.PI * t) };
  });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {planes.map((pl, i) => (
        <div key={i} style={{ position: 'absolute', left: pl.x, top: pl.y, opacity: pl.op * 0.8, transform: `translate(-50%,-50%) rotate(${i % 2 ? 20 : -200}deg)` }}>
          <Send size={34 * u} color={i % 2 ? '#a78bfa' : '#60a5fa'} />
        </div>
      ))}
      <div style={{ position: 'absolute', left: w / 2 - fw / 2, top: cy - fh / 2, width: fw, height: fh, transform: `scale(${p}) rotate(${(1 - p) * -8}deg)` }}>
        <svg width={fw} height={fh} viewBox="0 0 250 310" style={{ filter: 'drop-shadow(0 30px 60px rgba(79,70,229,.45))' }}>
          <defs>
            <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1a2246" /><stop offset="1" stopColor="#0e1226" /></linearGradient>
            <linearGradient id="fb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#6d28d9" /></linearGradient>
          </defs>
          <path d="M20 0 H180 L250 70 V290 a20 20 0 0 1 -20 20 H20 a20 20 0 0 1 -20 -20 V20 a20 20 0 0 1 20 -20 Z" fill="url(#fg)" stroke="rgba(148,163,184,.4)" strokeWidth="2" />
          <path d="M180 0 V50 a20 20 0 0 0 20 20 H250" fill="#28305a" stroke="rgba(148,163,184,.4)" strokeWidth="2" />
          <rect x="34" y="96" width="150" height="54" rx="12" fill="url(#fb)" />
          <text x="109" y="132" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="28" fill="#fff">HTML</text>
          {/* mini map */}
          <rect x="34" y="176" width="70" height="36" rx="8" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
          <rect x="146" y="176" width="70" height="36" rx="8" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
          <rect x="90" y="240" width="70" height="36" rx="8" fill="none" stroke="#34d399" strokeWidth="2.5" />
          <path d="M104 194 H146 M69 212 C69 240 90 240 90 258 M181 212 C181 240 160 240 160 258" stroke="#8b9cc8" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy + fh / 2 + 24 * u, textAlign: 'center', color: C.text, fontSize: 34 * u, fontWeight: 600, opacity: interpolate(f, [8, 18], [0, 1], clamp) }}>
        {ONE_FILE.file}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy + fh / 2 + 96 * u, display: 'flex', justifyContent: 'center', gap: 18 * u, flexWrap: 'wrap', padding: '0 30px' }}>
        {ONE_FILE.pills.map((t, i) => {
          const q = spring({ frame: f - 14 - i * 6, fps, config: { damping: 16 } });
          const Icon = icons[i];
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 * u, padding: `${11 * u}px ${20 * u}px`, borderRadius: 99, background: 'rgba(14,18,34,0.9)', border: `1px solid ${C.border}`, color: C.text, fontSize: 23 * u, fontWeight: 500, opacity: q, transform: `translateY(${(1 - q) * 20}px)` }}>
              <Icon size={22 * u} color="#93c5fd" /> {t}
            </div>
          );
        })}
      </div>
      {/* share as a link */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy + fh / 2 + 168 * u, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 * u, opacity: interpolate(f, [40, 50], [0, 1], clamp), transform: `translateY(${interpolate(f, [40, 50], [16, 0], clamp)}px)` }}>
        <span style={{ color: C.muted, fontSize: 22 * u, fontWeight: 500 }}>{ONE_FILE.shareLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${8 * u}px ${8 * u}px ${8 * u}px ${18 * u}px`, borderRadius: 99, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(96,165,250,0.45)', boxShadow: `0 0 ${24 * interpolate(f, [52, 70], [1, 0], clamp)}px rgba(96,165,250,.6)` }}>
          <Link2 size={22 * u} color="#93c5fd" />
          <span style={{ fontFamily: MONO, color: '#dbeafe', fontSize: 20 * u, whiteSpace: 'nowrap' }}>{ONE_FILE.link}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 * u, padding: `${6 * u}px ${14 * u}px`, borderRadius: 99, background: f >= 62 ? '#047857' : GRADIENT, color: '#fff', fontSize: 16 * u, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {f >= 62 ? <Check size={16 * u} /> : <Copy size={15 * u} />} {f >= 62 ? 'Copied' : ONE_FILE.linkButton}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealThing: React.FC<{ dur: number; startFrom?: number; captions?: { at: number; text: string }[] }> = ({ startFrom = REAL.startFrom, captions = REAL.captions }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const u = square ? 1 : k;
  const ww = square ? w - 60 : 1440 * k;
  const bar = 46 * u;
  const wh = (ww * 9) / 16 + bar;
  const top = square ? (h - wh) / 2 - 100 : 52 * k;
  const t = f / fps; // seconds into the scene
  const caps = captions;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: (w - ww) / 2, top, width: ww, height: wh, borderRadius: 18 * u, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.28)', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 80px rgba(79,70,229,.25)', background: '#090b14' }}>
        <div style={{ height: bar, display: 'flex', alignItems: 'center', gap: 9 * u, padding: `0 ${18 * u}px`, background: '#11152a', borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
          {['#f87171', '#fbbf24', '#34d399'].map((c) => <div key={c} style={{ width: 12 * u, height: 12 * u, borderRadius: 99, background: c, opacity: 0.8 }} />)}
          <div style={{ marginLeft: 16 * u, flex: 1, maxWidth: (square ? 420 : 560) * u, height: 28 * u, borderRadius: 8 * u, background: 'rgba(255,255,255,0.06)', color: C.muted, fontSize: 16 * u, display: 'flex', alignItems: 'center', padding: `0 ${12 * u}px`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {REAL.url}
          </div>
          <div style={{ marginLeft: 'auto', position: 'relative', height: bar, flex: 1 }}>
            {caps.map((c, i) => {
              const end = i < caps.length - 1 ? caps[i + 1].at : 999;
              const op = Math.min(interpolate(t, [c.at + 0.1, c.at + 0.4], [0, 1], clamp), interpolate(t, [end - 0.2, end + 0.1], [1, 0], clamp));
              return (
                <div key={c.text} style={{ position: 'absolute', right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', color: '#c7d2fe', fontSize: (square ? 15 : 17) * u, fontWeight: 600, opacity: op, whiteSpace: 'nowrap' }}>
                  {c.text}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: 'relative', width: ww, height: wh - bar, overflow: 'hidden' }}>
          <OffthreadVideo src={staticFile(REAL.clip)} startFrom={Math.round(startFrom * fps)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { h, square, k } = useLayout();
  const u = square ? 1 : k;
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 16, stiffness: 110 } });
  const line = (d: number): React.CSSProperties => ({ opacity: s(d), transform: `translateY(${(1 - s(d)) * 24}px)` });
  return (
    <AbsoluteFill style={{ fontFamily: FONT, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', paddingBottom: square ? 20 : 30 * k }}>
      <div style={{ transform: `scale(${s(0)}) rotate(${(1 - s(0)) * -20}deg)`, filter: 'drop-shadow(0 20px 50px rgba(99,102,241,.55))' }}>
        <Logo size={150 * u} />
      </div>
      <div style={{ ...line(6), color: '#fff', fontSize: (square ? 80 : 92) * u, fontWeight: 800, letterSpacing: -2, marginTop: 34 * u }}>{END.name}</div>
      <div style={{ ...line(11), fontSize: (square ? 34 : 38) * u, fontWeight: 600, marginTop: 10 * u, backgroundImage: GRADIENT_TEXT, WebkitBackgroundClip: 'text', color: 'transparent', padding: '0 40px' }}>{END.tagline}</div>
      <div style={{ ...line(16), display: 'flex', alignItems: 'center', gap: 12 * u, marginTop: 40 * u, padding: `${12 * u}px ${24 * u}px`, borderRadius: 99, background: GRADIENT, color: '#fff', fontSize: 26 * u, fontWeight: 600 }}>
        <Scale size={24 * u} /> {END.license}
      </div>
      <div style={{ ...line(21), display: 'flex', flexDirection: 'column', gap: 12 * u, marginTop: 34 * u, color: C.text, fontSize: 30 * u, fontWeight: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * u }}><Globe size={28 * u} color="#93c5fd" /> {END.site}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * u, color: C.muted, fontSize: 26 * u }}><GitBranch size={26 * u} color="#a78bfa" /> {END.repo}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 * u, background: GRADIENT, opacity: interpolate(f, [10, 30], [0, 1], clamp) }} />
      <div style={{ display: 'none' }}>{h}</div>
    </AbsoluteFill>
  );
};
