// Scene 2: a simplified configurator. The cursor picks audience, viewpoint, tabs, tour story and a
// theme (with its primary/secondary colours), then clicks "Copy prompt". Everything is laid out in
// "design units" inside a scaled window, so the cursor targets are computed from the same numbers.
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Copy, Check, Upload, RotateCcw } from 'lucide-react';
import { CONFIG } from '../content';
import { C, FONT, MONO, GRADIENT } from '../theme';
import { clamp, Cursor, Logo, useLayout } from '../components/common';

const CHAR = 9.4; // average glyph width at 17px
const chipW = (t: string) => Math.round(32 + t.length * CHAR);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Click schedule (local frames).
export const CLICK = { audience: 30, viewpoint: 48, tab1: 66, tab2: 82, story: 100, theme: 124, copy: 154 };

type Box = { x: number; y: number; w: number; h: number };

export const Config: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, square, k } = useLayout();

  // window geometry in design units
  const W = 960 + (square ? 0 : 540);
  const H = square ? 906 : 750;
  const sc = square ? 0.92 : 1.1 * k;
  const left = (w - W * sc) / 2;
  const topY = square ? 18 : 50 * k;
  const FW = square ? 904 : 900;
  const fx = 28;
  const cx = fx + 24; // content x
  const formH = 580;
  const rowY = { audience: 166, viewpoint: 266, tabs: 370, theme: 520, colours: 636 };
  const storyX = cx + 400;

  // controls
  const audience = CONFIG.audience.map((t, i) => {
    const x = cx + CONFIG.audience.slice(0, i).reduce((a, s) => a + chipW(s) + 10, 0);
    return { t, b: { x, y: rowY.audience + 32, w: chipW(t), h: 42 } as Box };
  });
  const segW = 118;
  const viewpoints = CONFIG.viewpoints.map((t, i) => ({ t, b: { x: cx + 4 + i * (segW + 2), y: rowY.viewpoint + 36, w: segW, h: 36 } as Box }));
  const storyW = 172;
  const stories = CONFIG.stories.map((t, i) => ({ t, b: { x: storyX + 4 + i * (storyW + 2), y: rowY.viewpoint + 36, w: storyW, h: 36 } as Box }));
  const tabRows = [CONFIG.tabs.slice(0, 4), CONFIG.tabs.slice(4)];
  const tabs = CONFIG.tabs.map((t, i) => {
    const row = i < 4 ? 0 : 1;
    const rowItems = tabRows[row];
    const j = rowItems.indexOf(t);
    const x = cx + rowItems.slice(0, j).reduce((a, s) => a + chipW(s) + 10, 0);
    return { t, b: { x, y: rowY.tabs + 32 + row * 52, w: chipW(t), h: 42 } as Box };
  });
  const tileW = 112;
  const themes = CONFIG.themes.map((t, i) => ({ t, b: { x: cx + i * (tileW + 8), y: rowY.theme + 32, w: tileW, h: 70 } as Box }));
  const copyBtn: Box = square ? { x: fx + FW - 270, y: 750, w: 246, h: 50 } : { x: 956 + 24, y: 300, w: 468, h: 54 };

  // state over time
  const audienceOn = f >= CLICK.audience;
  const viewpoint = f >= CLICK.viewpoint ? CONFIG.viewpointPick : 2;
  const tabsOn = new Set([CONFIG.tabsPick[0], ...(f >= CLICK.tab1 ? [CONFIG.tabsPick[1]] : []), ...(f >= CLICK.tab2 ? [CONFIG.tabsPick[2]] : [])]);
  const story = f >= CLICK.story ? CONFIG.storyPick : 1;
  const pickIndex = CONFIG.themes.findIndex((t) => t.id === CONFIG.themePick);
  const themeIdx = f >= CLICK.theme ? pickIndex : 0;
  const theme = CONFIG.themes[themeIdx];
  const copied = f >= CLICK.copy;

  // cursor
  const center = (b: Box) => ({ x: left + (b.x + b.w * 0.55) * sc, y: topY + (b.y + b.h * 0.6) * sc });
  const path = [
    { at: CLICK.audience, p: center(audience[CONFIG.audiencePick].b) },
    { at: CLICK.viewpoint, p: center(viewpoints[CONFIG.viewpointPick].b) },
    { at: CLICK.tab1, p: center(tabs[CONFIG.tabsPick[1]].b) },
    { at: CLICK.tab2, p: center(tabs[CONFIG.tabsPick[2]].b) },
    { at: CLICK.story, p: center(stories[CONFIG.storyPick].b) },
    { at: CLICK.theme, p: center(themes[pickIndex].b) },
    { at: CLICK.copy, p: center(copyBtn) },
  ];
  let cur = { x: w * 0.75, y: topY + H * sc * 1.02 };
  let click = 0;
  for (const s of path) {
    const t = ease(interpolate(f, [s.at - 16, s.at - 2], [0, 1], clamp));
    cur = { x: cur.x + (s.p.x - cur.x) * t, y: cur.y + (s.p.y - cur.y) * t };
    if (f >= s.at && f < s.at + 14) click = (f - s.at) / 14;
  }
  const cursorOp = interpolate(f, [10, 16], [0, 1], clamp);
  const winIn = spring({ frame: f, fps, config: { damping: 18, stiffness: 120 } });
  const flash = (at: number) => (f >= at ? interpolate(f, [at, at + 20], [1, 0], clamp) : 0);

  const chip = (t: string, b: Box, on: boolean, key: string) => (
    <div key={key} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 99, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 500, color: on ? '#fff' : '#b8c0d4', background: on ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${on ? '#60a5fa' : 'rgba(148,163,184,0.22)'}`, whiteSpace: 'nowrap' }}>{t}</div>
  );
  const seg = (items: { t: string; b: Box }[], active: number, width: number, key: string) => (
    <React.Fragment key={key}>
      <div style={{ position: 'absolute', left: items[0].b.x - 4, top: items[0].b.y - 4, width: items.length * (width + 2) + 6, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.16)' }} />
      {items.map(({ t, b }, i) => (
        <div key={key + t} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: i === active ? 600 : 500, color: i === active ? '#fff' : '#9aa3b8', background: i === active ? '#27304f' : 'transparent', boxShadow: i === active ? '0 2px 8px rgba(0,0,0,.4)' : undefined, whiteSpace: 'nowrap' }}>{t}</div>
      ))}
    </React.Fragment>
  );
  const label = (t: string, x: number, y: number) => <div style={{ position: 'absolute', left: x, top: y, color: C.text, fontWeight: 600, fontSize: 18 }}>{t}</div>;
  const swatchFlash = flash(CLICK.theme);
  const picker = (lbl: string, color: string, x: number) => (
    <>
      {label(lbl, x, rowY.colours)}
      <div style={{ position: 'absolute', left: x, top: rowY.colours + 30, width: 210, height: 40, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', boxSizing: 'border-box', boxShadow: swatchFlash > 0 ? `0 0 ${18 * swatchFlash}px ${color}` : undefined }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: color, border: '1px solid rgba(255,255,255,0.25)' }} />
        <span style={{ fontFamily: MONO, fontSize: 16, color: '#d6dbe7' }}>{color}</span>
      </div>
    </>
  );

  const tabsText = CONFIG.tabs.filter((_, i) => tabsOn.has(i)).join(', ');
  const promptLines: Array<[string, number]> = [
    ['audience: ' + (audienceOn ? 'executives' : '—'), flash(CLICK.audience)],
    ['viewpoint: ' + CONFIG.viewpoints[viewpoint].toLowerCase(), flash(CLICK.viewpoint)],
    ['tabs: ' + tabsText, Math.max(flash(CLICK.tab1), flash(CLICK.tab2))],
    ['tour: ' + CONFIG.stories[story], flash(CLICK.story)],
    ['theme: ' + theme.id, flash(CLICK.theme)],
  ];
  const lineEl = ([t, fl]: [string, number], i: number) => (
    <div key={i} style={{ fontFamily: MONO, fontSize: 15.5, color: '#c7d2fe', background: `rgba(96,165,250,${0.25 * fl})`, borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: 'absolute', left, top: topY, width: W, height: H, transform: `scale(${sc * (0.94 + 0.06 * winIn)})`, transformOrigin: 'top left', opacity: winIn, borderRadius: 22, background: '#0b0f1d', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 40px 100px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 58, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          <Logo size={30} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 19 }}>Blueprint Deck</span>
          <span style={{ color: C.muted, fontSize: 16 }}>configurator</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 22, color: C.muted, fontSize: 16 }}>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Upload size={16} /> Import</span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><RotateCcw size={16} /> Reset</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 30, top: 80, color: '#fff', fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{CONFIG.title}</div>

        {/* form card */}
        <div style={{ position: 'absolute', left: fx, top: 140, width: FW, height: formH, borderRadius: 18, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }} />
        {label(CONFIG.audienceLabel, cx, rowY.audience)}
        {audience.map(({ t, b }, i) => chip(t, b, audienceOn && i === CONFIG.audiencePick, 'a' + t))}
        {label(CONFIG.viewpointLabel, cx, rowY.viewpoint)}
        {seg(viewpoints, viewpoint, segW, 'vp')}
        {label(CONFIG.storyLabel, storyX, rowY.viewpoint)}
        {seg(stories, story, storyW, 'st')}
        {label(CONFIG.tabsLabel, cx, rowY.tabs)}
        {tabs.map(({ t, b }, i) => chip(t, b, tabsOn.has(i), 't' + t))}
        {label(CONFIG.themeLabel, cx, rowY.theme)}
        {themes.map(({ t, b }, i) => {
          const on = i === themeIdx;
          return (
            <div key={t.id} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 11, boxSizing: 'border-box', border: on ? '2.5px solid #e5e7eb' : '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
              <div style={{ height: 40, background: t.bg, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 8, top: 8, width: 30, height: 9, borderRadius: 3, background: t.primary }} />
                <div style={{ position: 'absolute', left: 8, top: 22, width: 22, height: 9, borderRadius: 3, background: t.secondary }} />
                <div style={{ position: 'absolute', right: 8, top: 7, width: 44, height: 26, borderRadius: 5, background: t.node, border: '1px solid rgba(148,163,184,0.25)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', fontSize: 13.5, color: on ? '#fff' : '#c3cadb', fontWeight: on ? 700 : 500 }}>
                <span style={{ textTransform: 'capitalize' }}>{t.id}</span>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{t.mode}</span>
              </div>
            </div>
          );
        })}
        {picker(CONFIG.primaryLabel, theme.primary, cx)}
        {picker(CONFIG.secondaryLabel, theme.secondary, cx + 260)}

        {/* prompt panel */}
        {square ? (
          <>
            <div style={{ position: 'absolute', left: fx, top: 736, width: FW, height: 150, borderRadius: 18, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }} />
            <div style={{ position: 'absolute', left: cx, top: 760, color: '#fff', fontWeight: 600, fontSize: 20 }}>{CONFIG.promptTitle}</div>
            <div style={{ position: 'absolute', left: cx, top: 812, width: FW - 60 }}>
              {lineEl([`${promptLines[0][0]} · ${promptLines[1][0]} · ${promptLines[3][0]}`, Math.max(promptLines[0][1], promptLines[1][1], promptLines[3][1])], 0)}
              {lineEl([`${promptLines[2][0]} · ${promptLines[4][0]}`, Math.max(promptLines[2][1], promptLines[4][1])], 1)}
            </div>
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', left: 956, top: 140, width: 516, height: formH, borderRadius: 18, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }} />
            <div style={{ position: 'absolute', left: 980, top: 162, color: '#fff', fontWeight: 600, fontSize: 20 }}>{CONFIG.promptTitle}</div>
            <div style={{ position: 'absolute', left: 980, top: 196, width: 468, color: C.muted, fontSize: 15, lineHeight: 1.4 }}>Paste the prompt into your agent, in the repository you want a diagram for.</div>
            <div style={{ position: 'absolute', left: 980, top: 250, display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'rgba(255,255,255,0.05)', fontSize: 15 }}>
              <span style={{ padding: '4px 12px', borderRadius: 7, background: '#27304f', color: '#fff', fontWeight: 600 }}>Prompt</span>
              <span style={{ padding: '4px 12px', color: C.muted }}>diagram.config.yaml</span>
            </div>
            <div style={{ position: 'absolute', left: 980, top: 376, width: 468, height: 320, borderRadius: 12, background: '#070a14', border: `1px solid ${C.border}`, padding: 16, boxSizing: 'border-box', boxShadow: copied ? `0 0 ${30 * flash(CLICK.copy) + 6}px rgba(96,165,250,.45)` : undefined }}>
              <div style={{ fontFamily: MONO, fontSize: 15.5, color: '#e5e7eb', lineHeight: 1.5, marginBottom: 12 }}>Use the blueprint-deck skill to generate a Blueprint Deck for this repository.</div>
              {promptLines.map(lineEl)}
              <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.dim, marginTop: 6 }}>…</div>
            </div>
          </>
        )}
        {/* copy button */}
        <div style={{ position: 'absolute', left: copyBtn.x, top: copyBtn.y, width: copyBtn.w, height: copyBtn.h, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 600, fontSize: 18, color: '#fff', background: copied ? '#047857' : GRADIENT, boxShadow: `0 8px 24px rgba(79,70,229,${copied ? 0.2 : 0.45})` }}>
          {copied ? <Check size={20} /> : <Copy size={19} />} {copied ? CONFIG.copied : CONFIG.copy}
        </div>
      </div>
      {cursorOp > 0 ? <Cursor x={cur.x} y={cur.y} click={click} size={square ? 36 : 38 * k} opacity={cursorOp} /> : null}
    </AbsoluteFill>
  );
};
