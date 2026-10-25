import React from 'react';
import { interpolate, spring } from 'remotion';
import { getLength, getPointAtLength } from '@remotion/paths';
import { C, FONT } from '../theme';
import { ARCH, edgePath, type MapDef } from './data';
import { useMapTheme } from './theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Paths and lengths are computed once per map.
const cache = new Map<string, { paths: Record<string, string>; lengths: Record<string, number> }>();
const geometry = (m: MapDef) => {
  if (!cache.has(m.id)) {
    const paths = Object.fromEntries(m.edges.map((e) => [e.id, edgePath(e, m.nodes)]));
    const lengths = Object.fromEntries(m.edges.map((e) => [e.id, getLength(paths[e.id])]));
    cache.set(m.id, { paths, lengths });
  }
  return cache.get(m.id)!;
};

export type MapState = {
  map?: MapDef; // which diagram (default: the architecture map)
  frame: number; // any running frame, drives the moving dots
  build: number; // frames since the build started (>= 150 = complete)
  fps: number;
  speed?: number; // build speed multiplier (1 = promo)
  dimNode?: (id: string) => number; // 0 = normal, 1 = fully dimmed
  emphEdge?: (id: string) => number; // 0 = normal, 1 = highlighted
  dimEdge?: (id: string) => number;
  selected?: { id: string; amount: number };
  editMode?: number;
  titles?: Record<string, string>;
  caret?: string;
  badges?: Array<{ node: string; n: number; amount: number }>;
  dotsOnlyHighlighted?: boolean; // GIF: fewer changing pixels per frame = smaller file
};

export const MapWorld: React.FC<MapState> = ({
  map = ARCH, frame, build, fps, speed = 1, dimNode, emphEdge, dimEdge, selected, editMode = 0, titles, caret, badges, dotsOnlyHighlighted,
}) => {
  const b = build * speed;
  const T = useMapTheme();
  const { zones: ZONES, nodes: NODES, edges: EDGES, order: NODE_ORDER } = map;
  const { paths: PATHS, lengths: LENGTHS } = geometry(map);
  const zoneById = (id: string) => ZONES.find((z) => z.id === id)!;
  const WORLD = { w: map.w, h: map.h };
  const pop = (delay: number) => spring({ frame: b - delay, fps, config: { damping: 15, stiffness: 140, mass: 0.7 } });

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, fontFamily: FONT }}>
      {/* areas */}
      {ZONES.map((z, i) => {
        const p = pop(i * 6);
        const op = interpolate(b, [i * 6, i * 6 + 14], [0, 1], clamp);
        return (
          <div
            key={z.id}
            style={{
              position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h, borderRadius: 22,
              background: hexA(z.color, 0.045), border: `1.5px solid ${hexA(z.color, 0.26)}`,
              opacity: op, transform: `scale(${0.96 + 0.04 * p})`,
            }}
          >
            <div style={{ position: 'absolute', left: 22, top: 18, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ color: z.color, fontWeight: 700, fontSize: 15, letterSpacing: 2.6, textTransform: 'uppercase' }}>{z.title}</span>
              {z.sub ? <span style={{ color: C.muted, fontSize: 13 }}>{z.sub}</span> : null}
            </div>
            {z.tag ? (
              <div style={{ position: 'absolute', right: 18, top: 15, fontSize: 10.5, letterSpacing: 1.4, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 99, padding: '3px 9px', fontWeight: 600 }}>{z.tag}</div>
            ) : null}
          </div>
        );
      })}

      {/* connections */}
      <svg width={WORLD.w} height={WORLD.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {EDGES.map((e, i) => {
          const start = 78 + i * 4;
          const drawn = interpolate(b, [start, start + 20], [0, 1], clamp);
          if (drawn <= 0) return null;
          const len = LENGTHS[e.id];
          const color = zoneById(NODES.find((n) => n.id === e.from)!.zone).color;
          const emph = emphEdge ? emphEdge(e.id) : 0;
          const dim = dimEdge ? dimEdge(e.id) : 0;
          const op = (0.42 + 0.53 * emph) * (1 - 0.8 * dim);
          const period = 54;
          const t = (((frame + i * 11) % period) + period) % period / period;
          const dotOn = interpolate(b, [start + 18, start + 26], [0, 1], clamp) * (dotsOnlyHighlighted ? emph : 1);
          const pt = getPointAtLength(PATHS[e.id], len * t);
          return (
            <g key={e.id}>
              {emph > 0.01 ? (
                <path d={PATHS[e.id]} fill="none" stroke={color} strokeOpacity={0.35 * emph} strokeWidth={9} filter="url(#glow)" />
              ) : null}
              <path
                d={PATHS[e.id]} fill="none" stroke={color} strokeOpacity={op} strokeWidth={1.8 + 1.6 * emph}
                strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - drawn)}
              />
              <circle cx={pt?.x ?? 0} cy={pt?.y ?? 0} r={3.4 + 1.4 * emph} fill={emph > 0.3 ? '#fff' : color} opacity={dotOn * (0.65 + 0.35 * emph) * (1 - 0.85 * dim)} />
            </g>
          );
        })}
      </svg>

      {/* boxes */}
      {NODES.map((n) => {
        const idx = NODE_ORDER.indexOf(n.id);
        const delay = 16 + idx * 3.4;
        const p = pop(delay);
        const op = interpolate(b, [delay, delay + 6], [0, 1], clamp);
        const z = zoneById(n.zone);
        const dim = dimNode ? dimNode(n.id) : 0;
        const sel = selected && selected.id === n.id ? selected.amount : 0;
        const title = titles?.[n.id] ?? n.title;
        const big = !!n.big;
        const iconBox = big ? 46 : 36;
        const Icon = n.icon;
        return (
          <div
            key={n.id}
            style={{
              position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, borderRadius: big ? 22 : 14,
              background: `linear-gradient(180deg, ${hexA(z.color, 0.07)}, transparent), linear-gradient(180deg, ${T.nodeA}, ${T.nodeB})`,
              border: `1.5px ${n.planned ? 'dashed' : 'solid'} ${sel > 0 ? hexA('#ffffff', 0.4 + 0.5 * sel) : hexA(z.color, 0.32)}`,
              boxShadow: sel > 0 ? `0 0 0 ${4 * sel}px ${hexA(z.color, 0.35)}, 0 0 40px ${hexA(z.color, 0.45 * sel)}` : '0 6px 18px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', boxSizing: 'border-box',
              opacity: op * (1 - 0.78 * dim), transform: `scale(${0.6 + 0.4 * p})`,
              outline: editMode > 0 ? `2px dashed ${hexA('#fbbf24', 0.55 * editMode)}` : undefined, outlineOffset: 5,
            }}
          >
            <div style={{ width: iconBox, height: iconBox, borderRadius: big ? 13 : 10, background: hexA(z.color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={big ? 24 : 19} color={z.color} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: big ? 22 : 16.5, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {title}
                {caret === n.id ? <span style={{ display: 'inline-block', width: 2, height: '1em', background: C.amber, marginLeft: 2, verticalAlign: '-2px', opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2 }} /> : null}
              </div>
              <div style={{ color: C.muted, fontSize: big ? 14 : 12.5, marginTop: 3, whiteSpace: 'nowrap' }}>{n.sub}</div>
            </div>
            {n.badge || n.planned ? (
              <div style={{ position: 'absolute', right: 14, top: -10, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, padding: '2px 8px', borderRadius: 99, background: '#0d1122', color: n.planned ? C.amber : n.badgeColor ?? z.color, border: `1px solid ${hexA(n.planned ? '#fbbf24' : n.badgeColor ?? z.color, 0.55)}` }}>
                {n.planned ? 'PLANNED' : n.badge}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* numbered persona path */}
      {badges?.map(({ node, n, amount }) => {
        const nd = NODES.find((x) => x.id === node)!;
        if (amount <= 0) return null;
        return (
          <div
            key={node}
            style={{
              position: 'absolute', left: nd.x - 14, top: nd.y - 14, width: 30, height: 30, borderRadius: 99,
              background: `linear-gradient(135deg,${T.primary},${T.secondary})`, color: '#fff', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 3px ${T.bg}, 0 0 22px ${hexA(T.primary, 0.8)}`,
              transform: `scale(${amount})`,
            }}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
};
