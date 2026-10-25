import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Check } from 'lucide-react';
import { MapWorld } from '../map/MapWorld';
import { FOCUS, NODES, PROCESS, PROCESS_OVERVIEW, type Rect } from '../map/data';
import { camAt, camTransform, fit, toScreen, type CamKey } from '../map/camera';
import { DeckHeader, Page, PersonaChip, SidePanel, SwitcherMenu, Tabs, TourButton, TourCard } from '../map/Chrome';
import { MAP_BEATS, MAP_TEXT, NEVER, type MapBeats } from '../content';
import { useMapTheme } from '../map/theme';
import { C, FONT } from '../theme';
import { clamp, Cursor, Keycap, useLayout } from '../components/common';

type Seg = { from: number; to: number; nodes: string[]; edges: string[] };

const segAmount = (f: number, s: Seg) => Math.min(interpolate(f, [s.from, s.from + 10], [0, 1], clamp), interpolate(f, [s.to - 10, s.to], [1, 0], clamp));
const inflate = (r: Rect, k: number): Rect => ({ x: r.x - (r.w * (k - 1)) / 2, y: r.y - (r.h * (k - 1)) / 2, w: r.w * k, h: r.h * k });
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export const MapScene: React.FC<{ beats?: MapBeats }> = ({ beats = MAP_BEATS }) => {
  const B = beats;
  const T = useMapTheme();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, square, k } = useLayout();
  const u = square ? 0.86 : k;

  // ---- screen areas the camera may use
  const top = square ? 104 : 118 * k;
  const bottom = square ? 240 : 170 * k;
  const availFull: Rect = { x: square ? 24 : 40 * k, y: top, w: w - (square ? 48 : 80 * k), h: h - top - bottom };
  const tourCardW = square ? w - 60 : 520 * k;
  const tourCardTop = square ? 96 : 132 * k;
  const availTour: Rect = square
    ? { x: 20, y: 330, w: w - 40, h: h - 330 - bottom }
    : { x: 30 * k, y: top, w: w - 80 * k - tourCardW - 40 * k, h: h - top - bottom };
  const panelW = square ? 500 : 540 * k;
  const panelTop = square ? 96 : 120 * k;
  const panelH = square ? 560 : 640 * k;
  const availPanel: Rect = { x: 20, y: top, w: w - panelW - 60 * (square ? 1 : k), h: h - top - bottom };
  const panelFocus: Rect = square ? { x: 840, y: 120, w: 330, h: 470 } : { x: 350, y: 70, w: 1220, h: 500 };
  const editRect: Rect = { x: 780, y: 70, w: 780, h: 420 };
  const editAvail: Rect = square ? { ...availFull, y: 210, h: h - 210 - bottom } : availFull;

  // ---- the architecture diagram camera
  const cam = camAt(f, [
    { at: 0, cam: fit(inflate(FOCUS.overview, 1.12), availFull) },
    { at: 0, cam: fit(FOCUS.overview, availFull), dur: 130 },
    { at: B.tour + 6, cam: fit(FOCUS.checkoutFan, availTour), dur: 42 },
    { at: B.tourStep2, cam: fit(FOCUS.payments, availTour), dur: 40 },
    ...(B.panel < NEVER
      ? [{ at: B.panel - 6, cam: fit(panelFocus, availPanel), dur: 36 }, { at: B.tabs, cam: fit(FOCUS.overview, availFull), dur: 34 }]
      : [{ at: B.tourEnd - 6, cam: fit(FOCUS.overview, availFull), dur: 34 }]),
  ] as CamKey[]);
  // ---- the second diagram (process) camera
  const sw = B.switcher;
  const switchAt = sw + 52;
  const pcam = camAt(f, [
    { at: 0, cam: fit(inflate(PROCESS_OVERVIEW, 1.08), availFull) },
    { at: switchAt, cam: fit(PROCESS_OVERVIEW, availFull), dur: 50 },
    { at: B.edit + 4, cam: fit(editRect, editAvail), dur: 30 },
    { at: B.pdf, cam: fit(PROCESS_OVERVIEW, availFull), dur: 26 },
  ]);
  const toProcess = interpolate(f, [switchAt - 2, switchAt + 16], [0, 1], clamp);

  // ---- highlights on the architecture diagram
  const segs: Seg[] = [
    { from: B.tour + 16, to: B.tourStep2 + 8, ...FOCUS.tourStep3 },
    { from: B.tourStep2 + 2, to: B.tourEnd - 4, ...FOCUS.tourStep4 },
    { from: B.tabs + 8, to: B.persona + 2, ...FOCUS.paymentsTab },
    { from: B.persona, to: B.switcher + 6, ...FOCUS.persona },
  ];
  const dimNode = (id: string) => Math.max(0, ...segs.map((s) => (s.nodes.includes(id) ? 0 : segAmount(f, s))));
  const emphEdge = (id: string) => Math.max(0, ...segs.map((s) => (s.edges.includes(id) ? segAmount(f, s) : 0)));
  const dimEdge = (id: string) => Math.max(0, ...segs.map((s) => (s.edges.includes(id) ? 0 : segAmount(f, s))));

  // ---- header / switcher geometry (also used by the cursor)
  const hu = square ? 0.8 : k;
  const hdr = { x: square ? 22 : 36 * k, y: square ? 22 : 30 * k };
  const brandC = { x: hdr.x + 130 * hu, y: hdr.y + 33 * hu };
  const menuTop = hdr.y + 74 * hu;
  const item2 = { x: hdr.x + 150 * hu, y: menuTop + (8 + 62 + 29) * hu };
  const menuIn = spring({ frame: f - (sw + 24), fps, config: { damping: 18, stiffness: 200 } });
  const menuOut = interpolate(f, [switchAt, switchAt + 8], [0, 1], clamp);
  const menuOp = f >= sw + 24 ? menuIn * (1 - menuOut) : 0;
  const itemHover = interpolate(f, [sw + 44, sw + 48], [0, 1], clamp);
  const onProcess = f >= switchAt;

  // ---- click on "Payments"
  const clickAt = B.panel + 34;
  const pay = NODES.find((n) => n.id === MAP_TEXT.panel.node)!;
  const payScreen = toScreen(cam, pay.x + pay.w * 0.42, pay.y + pay.h * 0.6);
  const panelIn = spring({ frame: f - clickAt - 4, fps, config: { damping: 20, stiffness: 120 } });
  const panelOut = interpolate(f, [B.tabs - 6, B.tabs + 8], [0, 1], clamp);
  const panelX = w - panelW - (square ? 24 : 40 * k) + (1 - panelIn + panelOut) * (panelW + 80);

  // ---- cursor: Payments box, then the switcher
  const start = { x: w * 0.55, y: h * 0.95 };
  let cur = start;
  let cursorOp = 0;
  let click = 0;
  if (f < Math.min(B.tabs, sw)) {
    cur = lerp(start, payScreen, ease(interpolate(f, [B.panel + 6, clickAt - 4], [0, 1], clamp)));
    cursorOp = Math.min(interpolate(f, [B.panel + 2, B.panel + 10], [0, 1], clamp), interpolate(f, [clickAt + 22, clickAt + 32], [1, 0], clamp));
    click = interpolate(f, [clickAt, clickAt + 14], [0, 1], clamp);
  } else {
    const from = { x: w * 0.5, y: h * 0.5 };
    cur = lerp(from, brandC, ease(interpolate(f, [sw + 4, sw + 22], [0, 1], clamp)));
    cur = lerp(cur, item2, ease(interpolate(f, [sw + 32, sw + 46], [0, 1], clamp)));
    cursorOp = Math.min(interpolate(f, [sw, sw + 8], [0, 1], clamp), interpolate(f, [switchAt + 14, switchAt + 24], [1, 0], clamp));
    click = f < sw + 40 ? interpolate(f, [sw + 24, sw + 38], [0, 1], clamp) : interpolate(f, [switchAt, switchAt + 14], [0, 1], clamp);
  }

  // ---- edit (on the process diagram)
  const E = MAP_TEXT.edit;
  const editMode = Math.min(interpolate(f, [B.edit + 6, B.edit + 14], [0, 1], clamp), interpolate(f, [B.editEnd - 6, B.editEnd + 2], [1, 0], clamp));
  const del = Math.floor(interpolate(f, [B.edit + 16, B.edit + 30], [0, E.from.length], clamp));
  const add = Math.floor(interpolate(f, [B.edit + 32, B.edit + 48], [0, E.to.length], clamp));
  const editTitle = f < B.edit + 32 ? E.from.slice(0, E.from.length - del) : E.to.slice(0, add);
  const toastIn = spring({ frame: f - (B.edit + 54), fps, config: { damping: 16 } });
  const toastOut = interpolate(f, [B.editEnd - 4, B.editEnd + 4], [0, 1], clamp);
  const archSelected = { id: MAP_TEXT.panel.node, amount: Math.min(spring({ frame: f - clickAt, fps, config: { damping: 14 } }), 1 - panelOut) };

  // ---- persona badges
  const badges = MAP_TEXT.persona.path.map((node, i) => ({
    node, n: i + 1,
    amount: Math.min(spring({ frame: f - (B.persona + 8 + i * 7), fps, config: { damping: 12, stiffness: 160 } }), interpolate(f, [sw - 2, sw + 8], [1, 0], clamp)),
  }));

  // ---- tabs
  const activeTab = B.tabs < NEVER ? interpolate(f, [B.tabs, B.tabs + 8, B.persona - 4, B.persona + 4, sw - 4, sw + 4], [0, 2, 2, 4, 4, 0], clamp) : 0;

  // ---- tour card
  const tourIn = spring({ frame: f - (B.tour + 18), fps, config: { damping: 20, stiffness: 110 } });
  const tourOut = interpolate(f, [B.tourEnd - 8, B.tourEnd + 4], [0, 1], clamp);
  const mixB = interpolate(f, [B.tourStep2 - 4, B.tourStep2 + 8], [0, 1], clamp);

  // ---- PDF
  const pdf = interpolate(f, [B.pdf + 4, B.pdf + 22], [0, 1], clamp);
  const chromeIn = interpolate(f, [8, 26], [0, 1], clamp);
  const pageW = square ? 470 : 600 * k;
  const keyPos = { x: square ? 128 : 180 * k, y: square ? 150 : h - 250 * k };

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* the diagram's own background (theme) */}
      <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 15% 0%, ${T.glow1}, transparent 70%), radial-gradient(60% 60% at 95% 100%, ${T.glow2}, transparent 70%), ${T.bg}` }}>
        <AbsoluteFill style={{ backgroundImage: `radial-gradient(${T.dot} 1.3px, transparent 1.3px)`, backgroundSize: '28px 28px' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - 0.93 * pdf, transform: `scale(${1 - 0.08 * pdf})`, filter: pdf > 0 ? `blur(${pdf * 4}px)` : undefined }}>
        {/* diagram 1: architecture */}
        {toProcess < 1 ? (
          <AbsoluteFill style={{ opacity: 1 - toProcess, transform: `scale(${1 - 0.05 * toProcess})` }}>
            <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: camTransform(cam) }}>
              <MapWorld frame={f} build={f} fps={fps} dimNode={dimNode} emphEdge={emphEdge} dimEdge={dimEdge} selected={archSelected} badges={badges} />
            </div>
          </AbsoluteFill>
        ) : null}
        {/* diagram 2: checkout process */}
        {toProcess > 0 ? (
          <AbsoluteFill style={{ opacity: toProcess }}>
            <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: camTransform(pcam) }}>
              <MapWorld
                map={PROCESS} frame={f} build={f - switchAt} speed={2.2} fps={fps}
                selected={f >= B.edit + 10 ? { id: E.node, amount: editMode } : undefined} editMode={editMode}
                titles={f >= B.edit + 14 ? { [E.node]: editTitle } : undefined}
                caret={f >= B.edit + 14 && f < B.edit + 64 ? E.node : undefined}
              />
            </div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>

      {/* chrome */}
      <div style={{ opacity: chromeIn * (1 - pdf) }}>
        <div style={{ position: 'absolute', left: hdr.x, top: hdr.y }}>
          <DeckHeader u={hu} sub={onProcess ? MAP_TEXT.diagrams[1].title : MAP_TEXT.deckSub} active={menuOp} />
        </div>
        <div style={{ position: 'absolute', left: square ? undefined : 0, right: square ? 22 : 0, top: square ? 26 : 34 * k, display: 'flex', justifyContent: 'center' }}>
          <Tabs u={square ? 0.74 : k} active={onProcess ? 0 : activeTab} items={onProcess ? MAP_TEXT.processTabs : MAP_TEXT.tabs} />
        </div>
        {square ? null : (
          <div style={{ position: 'absolute', right: 36 * k, top: 34 * k }}>
            <TourButton u={k} glow={Math.min(interpolate(f, [B.tour, B.tour + 10], [0, 1], clamp), 1 - tourOut)} />
          </div>
        )}
        {menuOp > 0 ? (
          <div style={{ position: 'absolute', left: hdr.x, top: menuTop, opacity: menuOp, transform: `translateY(${(1 - menuOp) * -10}px)`, transformOrigin: 'top left' }}>
            <SwitcherMenu u={hu} current={0} hover={itemHover} />
          </div>
        ) : null}
      </div>

      {/* tour card */}
      {f >= B.tour + 16 && f < B.tourEnd + 6 ? (
        <div style={{ position: 'absolute', top: tourCardTop, left: square ? 30 : w - tourCardW - 40 * k, opacity: tourIn * (1 - tourOut), transform: square ? `translateY(${(1 - tourIn) * -40}px)` : `translateX(${(1 - tourIn + tourOut) * 120}px)` }}>
          <TourCard u={u} width={tourCardW} a={MAP_TEXT.tour[0]} b={MAP_TEXT.tour[1]} mixB={mixB} compact={square} />
        </div>
      ) : null}

      {/* side panel */}
      {f >= clickAt && f < B.tabs + 10 ? (
        <div style={{ position: 'absolute', left: panelX, top: panelTop }}>
          <SidePanel u={u} width={panelW} height={panelH} />
        </div>
      ) : null}
      {cursorOp > 0 ? <Cursor x={cur.x} y={cur.y} click={click} size={40 * u} opacity={cursorOp} /> : null}

      {/* persona chip */}
      {f >= B.persona && f < sw + 8 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: square ? 104 : 112 * k, display: 'flex', justifyContent: 'center', opacity: Math.min(interpolate(f, [B.persona, B.persona + 8], [0, 1], clamp), interpolate(f, [sw - 4, sw + 4], [1, 0], clamp)) }}>
          <PersonaChip u={u} />
        </div>
      ) : null}

      {/* edit mode */}
      {editMode > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: square ? 104 : 112 * k, display: 'flex', justifyContent: 'center', opacity: editMode }}>
          <div style={{ padding: `${9 * u}px ${20 * u}px`, borderRadius: 99, background: 'rgba(251,191,36,0.14)', border: '1px solid rgba(251,191,36,0.55)', color: '#fcd34d', fontWeight: 600, fontSize: 19 * u }}>{E.banner}</div>
        </div>
      ) : null}
      {f >= B.edit + 54 && f < B.editEnd + 6 ? (
        <div style={{ position: 'absolute', right: square ? 30 : 50 * k, top: square ? 160 : 112 * k, opacity: toastIn * (1 - toastOut), transform: `translateY(${(1 - toastIn) * 20}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${14 * u}px ${22 * u}px`, borderRadius: 16 * u, background: 'rgba(6,78,59,0.9)', border: '1px solid rgba(52,211,153,0.6)', color: '#d1fae5', fontWeight: 600, fontSize: 21 * u, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            <Check size={22 * u} color="#34d399" /> {E.toast}
          </div>
        </div>
      ) : null}
      <Keycap label="E" hint="Edit" at={B.edit} until={B.editEnd - 2} x={keyPos.x} y={keyPos.y} size={square ? 70 : 92 * k} />
      <Keycap label="P" hint="PDF deck" at={B.pdf} until={B.pdf + 200} x={keyPos.x} y={keyPos.y} size={square ? 70 : 92 * k} />

      {/* PDF pages fan out */}
      {pdf > 0
        ? [1, 3, 4, 2, 0].map((kind) => {
            const slot = [0, -1, 1, -2, 2][kind];
            const p = spring({ frame: f - (B.pdf + 8 + Math.abs(slot) * 4), fps, config: { damping: 15, stiffness: 90 } });
            const spread = square ? 120 : 210 * k;
            const x = w / 2 + slot * spread * p;
            const y = (square ? h * 0.44 : h * 0.47) + Math.abs(slot) * 26 * u * p + (1 - p) * 40;
            return (
              <div key={kind} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${slot * 7 * p}deg) scale(${(0.6 + 0.4 * p) * (1 - Math.abs(slot) * 0.06)})`, opacity: Math.min(1, p * 1.5), zIndex: 10 - Math.abs(slot) }}>
                <Page w={pageW} kind={kind} frame={f} />
              </div>
            );
          })
        : null}
      {pdf > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: square ? h * 0.44 + pageW * 0.28 + 70 : h * 0.47 + pageW * 0.28 + 80 * k, textAlign: 'center', color: C.muted, fontSize: 24 * u, fontWeight: 500, opacity: interpolate(f, [B.pdf + 24, B.pdf + 34], [0, 1], clamp), zIndex: 20 }}>
          {MAP_TEXT.pdf.file} · {MAP_TEXT.pdf.pages}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
