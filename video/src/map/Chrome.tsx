// Screen-space UI around the map: header, tabs, tour card, side panel, pages.
import React from 'react';
import { ShoppingCart, Play, User, FileCode2, ArrowLeft, ArrowRight, X, Check, ChevronDown } from 'lucide-react';
import { C, FONT, MONO, GRADIENT, GRADIENT_TEXT } from '../theme';
import { MAP_TEXT } from '../content';
import { MapWorld } from './MapWorld';
import { useMapTheme, rgba } from './theme';
import { ARCH, PROCESS, WORLD } from './data';

export const DeckHeader: React.FC<{ u: number; sub?: string; active?: number }> = ({ u, sub = MAP_TEXT.deckSub, active = 0 }) => {
  const T = useMapTheme();
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 * u, padding: `${10 * u}px ${16 * u}px ${10 * u}px ${10 * u}px`, borderRadius: 16 * u, background: active > 0 ? rgba(T.primary, 0.18) : T.glass, border: `1px solid ${active > 0 ? 'rgba(129,140,248,0.6)' : C.border}`, fontFamily: FONT, width: 300 * u, boxSizing: 'border-box' }}>
    <div style={{ width: 46 * u, height: 46 * u, borderRadius: 12 * u, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ShoppingCart size={24 * u} color="#fff" />
    </div>
    <div>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 21 * u, whiteSpace: 'nowrap' }}>{MAP_TEXT.deckTitle}</div>
      <div style={{ color: '#93a4d6', fontSize: 15 * u, marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
    <ChevronDown size={18 * u} color="#93a4d6" style={{ marginLeft: 'auto' }} />
  </div>
  );
};

// The diagram switcher that opens from the header. Item rows are 62*u tall, starting 8*u from the top.
export const SwitcherMenu: React.FC<{ u: number; current: number; hover: number }> = ({ u, current, hover }) => {
  const T = useMapTheme();
  return (
  <div style={{ width: 340 * u, padding: 8 * u, boxSizing: 'border-box', borderRadius: 16 * u, background: T.glass, border: '1px solid rgba(148,163,184,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,.6)', fontFamily: FONT }}>
    {MAP_TEXT.diagrams.map((d, i) => {
      const on = i === current ? 1 : i === 1 ? hover : 0;
      return (
        <div key={d.title} style={{ display: 'flex', gap: 12 * u, alignItems: 'flex-start', height: 58 * u, marginBottom: 4 * u, padding: `${9 * u}px ${12 * u}px`, boxSizing: 'border-box', borderRadius: 11 * u, background: rgba(T.primary, 0.2 * on) }}>
          <div style={{ width: 22 * u, height: 22 * u, borderRadius: 6 * u, background: i === current ? T.primary : 'rgba(148,163,184,0.2)', color: '#fff', fontSize: 13 * u, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 17 * u }}>{d.title}</div>
            <div style={{ color: C.muted, fontSize: 13.5 * u, marginTop: 2 * u }}>{d.sub}</div>
          </div>
        </div>
      );
    })}
    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4 * u, padding: `${8 * u}px ${12 * u}px ${4 * u}px`, color: C.dim, fontSize: 12.5 * u }}>{MAP_TEXT.switcherHint}</div>
  </div>
  );
};

const TAB_DOTS = ['', '#a78bfa', '#f43f5e', '#a3e635', '#38bdf8'];
const PROCESS_DOTS = ['', '#38bdf8', '#a78bfa', '#34d399'];

export const Tabs: React.FC<{ u: number; active: number; items?: string[] }> = ({ u, active, items = MAP_TEXT.tabs }) => {
  const T = useMapTheme();
  return (
  <div style={{ display: 'flex', gap: 4 * u, padding: 5 * u, borderRadius: 16 * u, background: T.glass, border: `1px solid ${C.border}`, fontFamily: FONT }}>
    {items.map((t, i) => {
      const dots = items === MAP_TEXT.tabs ? TAB_DOTS : PROCESS_DOTS;
      const on = Math.max(0, 1 - Math.abs(active - i));
      return (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 * u, padding: `${9 * u}px ${16 * u}px`, borderRadius: 12 * u, fontSize: 18 * u, fontWeight: 500, color: on > 0.5 ? '#fff' : '#b8c0d4', background: rgba(T.primary, 0.32 * on), boxShadow: on > 0.5 ? `inset 0 0 0 1px ${rgba(T.secondary, 0.5 * on)}` : undefined }}>
          {dots[i] ? <span style={{ width: 8 * u, height: 8 * u, borderRadius: 9, background: dots[i] }} /> : null}
          {t}
        </div>
      );
    })}
  </div>
  );
};

export const TourButton: React.FC<{ u: number; glow: number }> = ({ u, glow }) => {
  const T = useMapTheme();
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 * u, padding: `${12 * u}px ${22 * u}px`, borderRadius: 14 * u, background: T.primary, color: '#fff', fontWeight: 600, fontSize: 19 * u, fontFamily: FONT, boxShadow: `0 0 ${10 + 30 * glow}px ${rgba(T.primary, 0.4 + 0.5 * glow)}` }}>
    <Play size={18 * u} color="#fff" /> {MAP_TEXT.tourButton}
  </div>
  );
};

export type TourStep = { step: number; total: number; title: string; body: string };

export const TourCard: React.FC<{ u: number; width: number; a: TourStep; b?: TourStep; mixB: number; compact?: boolean }> = ({ u, width, a, b, mixB, compact }) => {
  const T = useMapTheme();
  const cur = mixB > 0.5 && b ? b : a;
  const contentOp = b ? Math.abs(mixB - 0.5) * 2 : 1;
  const progress = (a.step + (b ? (b.step - a.step) * mixB : 0)) / a.total;
  return (
    <div style={{ width, boxSizing: 'border-box', padding: `${(compact ? 22 : 30) * u}px ${30 * u}px`, borderRadius: 22 * u, background: T.glass, border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 30px 80px rgba(0,0,0,.55)', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 * u }}>
        <div style={{ color: T.secondary, fontWeight: 700, fontSize: 17 * u, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
          {String(cur.step).padStart(2, '0')} / {cur.total}
        </div>
        <div style={{ flex: 1, height: 4 * u, borderRadius: 9, background: 'rgba(148,163,184,0.2)' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 9, background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})` }} />
        </div>
        <X size={20 * u} color={C.muted} />
      </div>
      <div style={{ opacity: contentOp }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: (compact ? 32 : 36) * u, lineHeight: 1.15, marginTop: 18 * u, letterSpacing: -0.5 }}>{cur.title}</div>
        <div style={{ color: '#c3cadb', fontSize: (compact ? 21 : 23) * u, lineHeight: 1.45, marginTop: 12 * u }}>{cur.body}</div>
      </div>
      {compact ? null : (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 * u }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 * u, color: C.text, fontSize: 18 * u, padding: `${9 * u}px ${16 * u}px`, borderRadius: 12 * u, border: `1px solid ${C.border}` }}>
            <ArrowLeft size={17 * u} /> Back
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 * u, color: '#fff', fontWeight: 600, fontSize: 18 * u, padding: `${9 * u}px ${18 * u}px`, borderRadius: 12 * u, background: T.primary }}>
            Next <ArrowRight size={17 * u} />
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed vertical offsets so the cursor can find the first source link.
export const PANEL_SOURCES_TOP = 455;

export const SidePanel: React.FC<{ u: number; width: number; height: number }> = ({ u, width, height }) => {
  const T = useMapTheme();
  const p = MAP_TEXT.panel;
  const label = (t: string) => <div style={{ color: '#8ea0c8', fontSize: 15 * u, fontWeight: 700, letterSpacing: 2.2, marginBottom: 10 * u }}>{t}</div>;
  return (
    <div style={{ position: 'relative', width, height, boxSizing: 'border-box', padding: `${30 * u}px ${32 * u}px`, borderRadius: 24 * u, background: T.glass, border: '1px solid rgba(148,163,184,0.22)', boxShadow: '-30px 0 80px rgba(0,0,0,.5)', fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 * u }}>
        <div style={{ width: 52 * u, height: 52 * u, borderRadius: 14 * u, background: 'rgba(167,139,250,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: 26 * u }}>
          <svg width={28 * u} height={28 * u} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 30 * u }}>{p.title}</div>
          <div style={{ color: C.muted, fontSize: 17 * u, marginTop: 2 }}>{p.sub}</div>
        </div>
        <X size={22 * u} color={C.muted} />
      </div>
      <div style={{ position: 'absolute', left: 32 * u, right: 32 * u, top: 130 * u }}>
        {label('WHAT')}
        <div style={{ color: '#d9deea', fontSize: 24 * u, lineHeight: 1.4 }}>{p.what}</div>
      </div>
      <div style={{ position: 'absolute', left: 32 * u, right: 32 * u, top: 290 * u }}>
        {label('WHY')}
        {p.why.map((w) => (
          <div key={w} style={{ display: 'flex', gap: 12 * u, alignItems: 'center', color: '#d9deea', fontSize: 22 * u, marginBottom: 12 * u }}>
            <Check size={20 * u} color="#34d399" /> {w}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 32 * u, right: 32 * u, top: (PANEL_SOURCES_TOP - 40) * u }}>
        {label('SOURCES')}
        {p.sources.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 * u, fontFamily: MONO, fontSize: 16 * u, color: '#93c5fd', padding: `${7 * u}px ${12 * u}px`, borderRadius: 10 * u, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(96,165,250,0.18)', marginBottom: 8 * u, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <FileCode2 size={17 * u} color="#60a5fa" /> {s}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PersonaChip: React.FC<{ u: number }> = ({ u }) => {
  const T = useMapTheme();
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${9 * u}px ${18 * u}px ${9 * u}px ${9 * u}px`, borderRadius: 99, background: T.glass, border: `1px solid ${rgba(T.secondary, 0.5)}`, fontFamily: FONT, boxShadow: `0 0 30px ${rgba(T.primary, 0.35)}` }}>
    <div style={{ width: 36 * u, height: 36 * u, borderRadius: 99, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <User size={20 * u} color="#fff" />
    </div>
    <span style={{ color: '#fff', fontWeight: 600, fontSize: 19 * u }}>{MAP_TEXT.persona.name}</span>
    <span style={{ color: C.muted, fontSize: 17 * u }}>{MAP_TEXT.persona.sub}</span>
  </div>
  );
};

// One page of the exported PDF deck.
export const Page: React.FC<{ w: number; kind: number; frame: number }> = ({ w, kind, frame }) => {
  const T = useMapTheme();
  const h = (w * 9) / 16;
  const s = w / 1600;
  const mini = (opts: { emph?: string[]; dim?: string[]; process?: boolean }) => (
    <div style={{ position: 'absolute', left: w * 0.04, top: h * 0.22, width: WORLD.w, height: WORLD.h, transform: `scale(${(w * 0.92) / WORLD.w})`, transformOrigin: '0 0' }}>
      <MapWorld map={opts.process ? PROCESS : ARCH} frame={frame} build={400} fps={30} emphEdge={(id) => (opts.emph?.includes(id) ? 1 : 0)} dimNode={(id) => (opts.dim && !opts.dim.includes(id) ? 1 : 0)} />
    </div>
  );
  const title = (t: string, sub: string) => (
    <div style={{ position: 'absolute', left: w * 0.05, top: h * 0.06 }}>
      <div style={{ color: T.secondary, fontSize: 22 * s * 1.6, fontWeight: 700, letterSpacing: 2 }}>{sub}</div>
      <div style={{ color: '#fff', fontSize: 52 * s * 1.6, fontWeight: 700 }}>{t}</div>
    </div>
  );
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: 14 * s * 1.6, overflow: 'hidden', background: `linear-gradient(160deg, ${T.nodeA}, ${T.bg})`, border: '1px solid rgba(148,163,184,0.25)', boxShadow: '0 30px 70px rgba(0,0,0,.6)', fontFamily: FONT }}>
      {kind === 0 ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 * s }}>
          <div style={{ color: '#93c5fd', fontSize: 30 * s, letterSpacing: 4, fontWeight: 700 }}>ARCHITECTURE DECK</div>
          <div style={{ fontSize: 120 * s, fontWeight: 800, backgroundImage: `linear-gradient(90deg, ${T.primary}, ${T.secondary})`, WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: -2 }}>Acme Commerce</div>
          <div style={{ color: C.muted, fontSize: 40 * s }}>Platform architecture · 12 pages</div>
        </div>
      ) : null}
      {kind === 1 ? (<>{title('The whole platform', 'OVERVIEW')}{mini({})}</>) : null}
      {kind === 2 ? (<>{title('Checkout calls six services', 'STEP 3 / 10')}{mini({ emph: ['co-catalog', 'co-cart', 'co-payments', 'co-fraud', 'co-shipping', 'co-email'], dim: ['checkout', 'catalog', 'cart', 'payments', 'fraud', 'shipping', 'email'] })}</>) : null}
      {kind === 3 ? (<>{title('Checkout process', 'DIAGRAM 2')}{mini({ process: true })}</>) : null}
      {kind === 4 ? (
        <>
          {title('Roadmap', 'NEXT')}
          {[0.7, 0.45, 0.85, 0.3].map((b, i) => (
            <div key={i} style={{ position: 'absolute', left: w * (0.08 + i * 0.12), top: h * (0.42 + i * 0.12), width: w * 0.5 * b, height: h * 0.07, borderRadius: 99, background: i % 2 ? 'rgba(167,139,250,0.55)' : 'rgba(96,165,250,0.55)' }} />
          ))}
        </>
      ) : null}
    </div>
  );
};
