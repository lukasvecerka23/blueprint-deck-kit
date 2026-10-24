/* Blueprint Deck core: turns the diagram JSON into a resolved spec (defaults, layout, validation).
   Pure JavaScript with no DOM access, so the same code runs in the browser and in tools/check.mjs (Node). */
const BDCore = (() => {
  const VERSION = "2.1.0"; // the one version number of the kit: dev/assemble.mjs copies it everywhere else

  /* ------------------------------------------------------------ colours */
  const hexRgb = h => {
    h = String(h || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  const rgbStr = h => (hexRgb(h) || [128, 128, 128]).join(", ");
  const toHex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  // mix(a, b, t): t = 0 gives a, t = 1 gives b
  const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return x && y ? toHex(x.map((v, i) => v + (y[i] - v) * t)) : a; };
  const isHex = c => /^#[0-9a-fA-F]{6}$/.test(c || "");

  /* ------------------------------------------------------------ themes */
  const DARK = {
    bg: "#050914", "bg-rgb": "5, 9, 20", fg: "#ffffff", "fg-rgb": "255, 255, 255", text: "#e8ecf7", body: "#d7deef", muted: "#8f9ab8", faint: "#6f7a99",
    ink: "#0a1024", glass: "rgba(12, 18, 40, 0.8)", "glass-strong": "rgba(10, 15, 34, 0.94)",
    "node-a": "rgba(24, 33, 66, 0.96)", "node-b": "rgba(12, 18, 40, 0.96)", "node-base": "#0d1430",
    glow1: "rgba(37, 99, 235, 0.38)", glow2: "rgba(167, 139, 250, 0.16)", glow3: "rgba(56, 189, 248, 0.06)",
    dot: "rgba(150, 170, 230, 0.12)", frame: "rgba(140, 165, 230, 0.2)", "frame-label": "#b4c0de",
    "shadow-rgb": "0, 0, 0", "shadow-k": "1", tone: "0%", "tab-text": "#aab4cf",
  };
  const LIGHT = {
    bg: "#f4f6fa", "bg-rgb": "244, 246, 250", fg: "#0b1220", "fg-rgb": "15, 23, 42", text: "#111827", body: "#334155", muted: "#64748b", faint: "#94a3b8",
    ink: "#ffffff", glass: "rgba(255, 255, 255, 0.84)", "glass-strong": "rgba(255, 255, 255, 0.97)",
    "node-a": "#ffffff", "node-b": "#fbfcfe", "node-base": "#ffffff",
    glow1: "rgba(59, 130, 246, 0.10)", glow2: "rgba(168, 85, 247, 0.06)", glow3: "rgba(14, 165, 233, 0.04)",
    dot: "rgba(15, 23, 42, 0.09)", frame: "rgba(15, 23, 42, 0.14)", "frame-label": "#475569",
    "shadow-rgb": "15, 23, 42", "shadow-k": "0.22", tone: "38%", "tab-text": "#475569",
  };
  const THEMES = {
    // the default: navy with blue and violet
    midnight: { mode: "dark", primary: "#3b82f6", secondary: "#7c3aed", vars: {} },
    // navy, blueprint blue and cyan (an alternative palette)
    blueprint: {
      mode: "dark", primary: "#1f6feb", secondary: "#22b8e6", vars: {
        bg: "#06132a", "bg-rgb": "6, 19, 42", ink: "#0a1a36", glass: "rgba(10, 24, 52, 0.82)", "glass-strong": "rgba(8, 20, 44, 0.95)",
        "node-a": "rgba(20, 40, 80, 0.96)", "node-b": "rgba(10, 24, 52, 0.96)", "node-base": "#0c1d3d",
        glow1: "rgba(31, 111, 235, 0.34)", glow2: "rgba(34, 184, 230, 0.14)", glow3: "rgba(245, 165, 36, 0.04)",
        dot: "rgba(120, 170, 240, 0.13)", frame: "rgba(120, 170, 240, 0.24)", "frame-label": "#b3cdf2", muted: "#8ea3c4", "tab-text": "#a7bad8",
      },
    },
    graphite: {
      mode: "dark", primary: "#22d3ee", secondary: "#6366f1", vars: {
        bg: "#0a0b0e", "bg-rgb": "10, 11, 14", ink: "#111317", glass: "rgba(22, 24, 29, 0.82)", "glass-strong": "rgba(17, 18, 22, 0.95)",
        "node-a": "rgba(36, 38, 45, 0.96)", "node-b": "rgba(21, 22, 27, 0.96)", "node-base": "#16181d",
        glow1: "rgba(120, 130, 150, 0.18)", glow2: "rgba(34, 211, 238, 0.08)", glow3: "rgba(255, 255, 255, 0.03)",
        dot: "rgba(200, 205, 215, 0.09)", frame: "rgba(200, 205, 215, 0.18)", "frame-label": "#c3c7d0", muted: "#9097a4",
      },
    },
    forest: {
      mode: "dark", primary: "#10b981", secondary: "#0ea5e9", vars: {
        bg: "#04100c", "bg-rgb": "4, 16, 12", ink: "#081a14", glass: "rgba(10, 30, 24, 0.82)", "glass-strong": "rgba(8, 24, 19, 0.95)",
        "node-a": "rgba(18, 48, 38, 0.96)", "node-b": "rgba(9, 28, 22, 0.96)", "node-base": "#0b221b",
        glow1: "rgba(16, 185, 129, 0.26)", glow2: "rgba(132, 204, 22, 0.12)", glow3: "rgba(45, 212, 191, 0.05)",
        dot: "rgba(150, 230, 200, 0.1)", frame: "rgba(150, 230, 200, 0.2)", "frame-label": "#b4e0cf", muted: "#8fb3a6",
      },
    },
    ember: {
      mode: "dark", primary: "#e11d48", secondary: "#f97316", vars: {
        bg: "#0f0708", "bg-rgb": "15, 7, 8", ink: "#1a0c0e", glass: "rgba(32, 14, 16, 0.82)", "glass-strong": "rgba(26, 11, 13, 0.95)",
        "node-a": "rgba(52, 24, 27, 0.96)", "node-b": "rgba(30, 13, 15, 0.96)", "node-base": "#241012",
        glow1: "rgba(220, 38, 38, 0.26)", glow2: "rgba(251, 146, 60, 0.12)", glow3: "rgba(244, 63, 94, 0.05)",
        dot: "rgba(240, 180, 180, 0.09)", frame: "rgba(240, 180, 180, 0.2)", "frame-label": "#e8c4c4", muted: "#b39a9c",
      },
    },
    light: { mode: "light", primary: "#2563eb", secondary: "#7c3aed", vars: {} },
    paper: {
      mode: "light", primary: "#c2410c", secondary: "#0f766e", vars: {
        bg: "#f7f3ec", "bg-rgb": "247, 243, 236", ink: "#fffdf9", glass: "rgba(255, 253, 249, 0.86)", "glass-strong": "rgba(255, 253, 249, 0.97)",
        "node-a": "#fffdf9", "node-b": "#fcf9f3", "node-base": "#fffdf9", fg: "#1c1917", "fg-rgb": "28, 25, 23", text: "#1c1917", body: "#44403c",
        muted: "#78716c", faint: "#a8a29e", dot: "rgba(28, 25, 23, 0.08)", frame: "rgba(28, 25, 23, 0.14)", "frame-label": "#57534e",
        glow1: "rgba(234, 88, 12, 0.07)", glow2: "rgba(15, 118, 110, 0.05)", glow3: "rgba(0, 0, 0, 0)", "shadow-rgb": "41, 37, 36", "tab-text": "#57534e",
      },
    },
  };
  // the shape changes the diagram only (areas, boxes, their icons and tags); menus, panels and buttons stay as they are
  const SHAPES = {
    rounded: { "r-zone": "22px", "r-node": "14px", "r-ic": "10px", "r-tag": "99px" },
    square: { "r-zone": "4px", "r-node": "3px", "r-ic": "3px", "r-tag": "3px" },
    pill: { "r-zone": "30px", "r-node": "999px", "r-ic": "999px", "r-tag": "99px" },
  };

  /* ------------------------------------------------------------ defaults */
  const DEFAULT_SETTINGS = {
    hero: true,
    legend: "collapsed", // collapsed | open | false
    editor: true,
    keyboard: true,
    tour: { position: "auto" }, // auto | right | bottom
    camera: { zoomToFocus: true, maxZoom: 1.25, nodeZoom: 1.15, zoneZoom: 1.3, padding: 24 },
    edges: { filterByContext: true, raiseOnHover: true, labels: "focus", particles: "main", mainFlow: null, overview: "all" },
    motion: { intro: true },
    panel: { sections: ["what", "why", "pick", "alt", "links", "sources"], showSources: true, tech: null },
    personas: { tab: true },
    layout: {},
    labels: {
      inside: "Platform component", outside: "Outside the platform", area: "Platform area",
      boundary: { ours: "Ours", customer: "Customer-owned", partner: "Partner", external: "External" },
      hint: "Click any box · hover to trace its links · drag to pan · scroll or pinch to zoom",
      what: "What it is", why: "Why it matters", pick: "Technology pick", alt: "Alternatives & exit path",
      links: "Connected to", partOf: "Part of", sources: "Sources", overview: "Overview", points: "Key points",
      components: "Components", clickOne: "Click one to highlight it on the map", showAll: "Show all",
      tour: "Guided tour", startTour: "Start the guided tour", explore: "Explore the map",
      back: "← Back", next: "Next →", finish: "Finish", fullRoadmap: "Full roadmap",
      tourHint: "Click any highlighted box for details", legend: "Legend", personas: "Personas", persona: "Persona", path: "Path",
      personasSub: "Click one to see its path", edit: "Edit", export: "PDF",
    },
  };
  // default wording per diagram type (meta.type); settings.labels overrides any of it
  const TYPE_LABELS = {
    architecture: { inside: "Platform component", outside: "Outside the platform", area: "Platform area" },
    "data-flow": { inside: "Processing step or store", outside: "Source or consumer", area: "Stage" },
    process: { inside: "Step", outside: "External party", area: "Phase", tourHint: "Click any highlighted step for details" },
    journey: { inside: "Touchpoint", outside: "Outside the journey", area: "Stage", tourHint: "Click any highlighted touchpoint for details" },
    ecosystem: { inside: "Our part", outside: "Partner or third party", area: "Domain" },
    org: { inside: "Team or role", outside: "External", area: "Unit", tourHint: "Click any highlighted team for details" },
    custom: { inside: "Element", outside: "External", area: "Area" },
  };
  // viewpoint (meta.viewpoint) sets what panels say about technology; settings.panel.tech overrides it
  const VIEWPOINT_TECH = { product: "pick", mixed: "pick", technical: "full" };
  const VIEWPOINT_LABELS = { product: { pick: "Built with" }, mixed: {}, technical: {} };
  const BOUNDARIES = ["ours", "customer", "partner", "external"];

  const NODE_H = 64, BIG_H = 110, ZONE_HEAD = 55, ZONE_PAD = 20, NODE_GAP = 16;

  const clone = o => JSON.parse(JSON.stringify(o));
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  function deepMerge(base, over) {
    const out = clone(base || {});
    for (const [k, v] of Object.entries(over || {})) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : clone(v);
    return out;
  }
  const stripTags = s => String(s || "").replace(/<[^>]+>/g, "");

  /* rough rendered width of a string in a sans-serif font (the browser check measures the real thing) */
  function textPx(s, size, bold = true) {
    let w = 0;
    for (const ch of stripTags(s)) {
      if ("il.,:;'|!·".includes(ch)) w += 0.28;
      else if ("fjtr() -".includes(ch)) w += 0.36;
      else if ("mwMW@".includes(ch)) w += 0.86;
      else if (ch !== ch.toLowerCase() || /\d/.test(ch)) w += 0.64;
      else w += 0.53;
    }
    return w * size * (bold ? 1.04 : 1);
  }

  /* ------------------------------------------------------------ safe content
     Text fields may contain a little inline HTML. Everything else is removed before rendering, so a diagram made from
     untrusted documents can't run code in the viewer's browser: no <script>, no event handlers, no javascript: links,
     no tags beyond simple formatting. Icons and logos given as SVG keep their drawing but lose scripts and handlers. */
  const RICH = new Set(["b", "strong", "i", "em", "u", "s", "br", "code", "small", "sub", "sup", "mark", "span", "a"]);
  const DANGEROUS = /<(script|style|iframe|object|embed|template|noscript|textarea|title|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi;
  function cleanHtml(s, c) {
    if (s.indexOf("<") < 0) return s;
    return s.replace(DANGEROUS, () => (c.n++, "")).replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g, (m, tag, attrs) => {
      const t = tag.toLowerCase();
      if (!RICH.has(t)) { c.n++; return ""; }
      if (m[1] === "/") return `</${t}>`;
      if (/\son\w+\s*=/i.test(attrs)) c.n++;
      if (t === "a") {
        const h = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i), url = h ? (h[1] ?? h[2]).trim() : "";
        if (/^(https?:|mailto:)/i.test(url)) return `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
        if (url) c.n++;
        return "<a>";
      }
      return t === "br" ? "<br>" : `<${t}>`;
    });
  }
  function cleanSvg(s, c) {
    return s.replace(/<(script|foreignObject|style|iframe)\b[\s\S]*?<\/\1\s*>/gi, () => (c.n++, ""))
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, () => (c.n++, ""))
      .replace(/\s(?:xlink:)?href\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, () => (c.n++, ""))
      .replace(/<\/?a\b[^>]*>/gi, () => (c.n++, ""));
  }
  // walks the whole diagram: icons and logos as SVG, everything else as text with simple formatting
  function sanitize(spec, rep) {
    const c = { n: 0 }, images = [];
    const walk = (v, key, inIcons) => {
      if (typeof v === "string") {
        if (inIcons || ((key === "icon" || key === "logo") && /^\s*</.test(v))) return cleanSvg(v, c);
        if ((key === "icon" || key === "logo") && /^(https?:)?\/\//i.test(v)) { images.push(v); return v; }
        if (/^\s*(javascript|vbscript|data:text\/html)/i.test(v)) { c.n++; return ""; }
        return cleanHtml(v, c);
      }
      if (Array.isArray(v)) return v.map(x => walk(x, key, inIcons));
      if (v && typeof v === "object") { for (const k of Object.keys(v)) v[k] = walk(v[k], k, inIcons || (key === null && k === "icons")); return v; }
      return v;
    };
    for (const k of Object.keys(spec)) spec[k] = walk(spec[k], k, k === "icons");
    if (spec.meta && spec.meta.url && !/^(https?:|mailto:)/i.test(spec.meta.url)) { c.n++; delete spec.meta.url; }
    if (c.n) rep.warn(`removed ${c.n} unsafe part(s) of the content (scripts, event handlers, javascript: links or unsupported tags). Text may use only <b> <i> <em> <strong> <u> <s> <br> <code> <small> <sub> <sup> <mark> <span> and <a href="https://…">`);
    if (images.length) rep.warn(`images must be inside the file (data: URIs): the file makes no network requests, so ${images.slice(0, 2).join(", ")}${images.length > 2 ? " …" : ""} won't show`);
  }

  /* ------------------------------------------------------------ several diagrams in one file */
  // data is either one diagram, or { meta, theme, settings, icons, diagrams: [ {id, title, sub, ...diagram} ] }
  function diagramsOf(data) {
    if (!data || !Array.isArray(data.diagrams)) return null;
    const shared = {};
    for (const k of ["theme", "settings", "icons", "status"]) if (data[k]) shared[k] = data[k];
    const sharedMeta = Object.fromEntries(Object.entries(data.meta || {}).filter(([k]) => !["title", "subtitle"].includes(k)));
    return data.diagrams.map((d, i) => {
      const own = Object.fromEntries(Object.entries(d).filter(([k]) => !["id", "title", "sub"].includes(k)));
      const raw = deepMerge(shared, own);
      raw.meta = deepMerge(sharedMeta, own.meta || {});
      if (!raw.meta.title) raw.meta.title = d.title || "Diagram " + (i + 1);
      return { id: d.id || "d" + (i + 1), title: d.title || stripTags(raw.meta.title), sub: d.sub || "", index: i, raw };
    });
  }

  /* ------------------------------------------------------------ layout */
  function placeZones(spec, rep) {
    const grid = spec.settings.layout.grid;
    for (const z of spec.zones) {
      if (z.grid) {
        if (!grid) { rep.err(`zone '${z.id}' uses grid placement but settings.layout.grid is not defined`); continue; }
        const cols = grid.columns, rows = grid.rows, gap = grid.gap ?? 40, [ox, oy] = grid.origin || [60, 230];
        const [c, r, cs, rs] = [...z.grid, 1, 1].slice(0, 4);
        if (c + cs > cols.length || r + rs > rows.length) { rep.err(`zone '${z.id}' grid [${z.grid}] is outside the ${cols.length}x${rows.length} grid`); continue; }
        const sum = (a, i, j) => a.slice(i, j).reduce((s, v) => s + v, 0);
        z.x ??= ox + sum(cols, 0, c) + gap * c;
        z.y ??= oy + sum(rows, 0, r) + gap * r;
        z.w ??= sum(cols, c, c + cs) + gap * (cs - 1);
        z.h ??= sum(rows, r, r + rs) + gap * (rs - 1);
      }
      for (const k of ["x", "y", "w"]) if (z[k] === undefined) { rep.err(`zone '${z.id}' has no '${k}' (give x/y/w/h or a grid cell)`); z[k] = 0; }
    }
  }
  function placeNodes(spec, rep) {
    const zones = Object.fromEntries(spec.zones.map(z => [z.id, z]));
    const byZone = {};
    for (const n of spec.nodes) (byZone[n.zone] ||= []).push(n);
    for (const [zid, nodes] of Object.entries(byZone)) {
      const z = zones[zid];
      if (!z) continue;
      const L = z.layout || {};
      const cols = L.columns || 1, gap = L.gap ?? NODE_GAP, pad = L.padding ?? ZONE_PAD, top = L.top ?? ZONE_HEAD;
      const auto = nodes.filter(n => n.x === undefined || n.y === undefined);
      if (!auto.length) continue;
      const cw = (z.w - pad * 2 - gap * (cols - 1)) / cols;
      const yc = Array(cols).fill(z.y + top);
      for (const n of auto) {
        const span = Math.min(n.span || 1, cols);
        let col = 0, best = Infinity;
        for (let c = 0; c <= cols - span; c++) { const m = Math.max(...yc.slice(c, c + span)); if (m < best) { best = m; col = c; } }
        const h = n.h ?? (n.size === "big" ? BIG_H : NODE_H);
        n.x = Math.round(z.x + pad + col * (cw + gap));
        n.y = Math.round(best);
        n.w ??= Math.round(cw * span + gap * (span - 1));
        n.h ??= h;
        for (let c = col; c < col + span; c++) yc[c] = best + h + gap;
      }
      const need = Math.max(...yc) - gap + pad - z.y;
      if (z.h === undefined) z.h = Math.round(need);
      else if (need > z.h + 1) rep.warn(`zone '${zid}': its boxes need ${Math.round(need)}px height but the zone is ${z.h}px; raise the zone height, use more columns or fewer boxes`);
    }
    for (const n of spec.nodes) { n.h ??= n.size === "big" ? BIG_H : NODE_H; n.w ??= 240; }
    for (const z of spec.zones) z.h ??= 200;
  }
  const bounds = rects => ({
    x1: Math.min(...rects.map(r => r.x)), y1: Math.min(...rects.map(r => r.y)),
    x2: Math.max(...rects.map(r => r.x + r.w)), y2: Math.max(...rects.map(r => r.y + r.h)),
  });
  function placeWorld(spec) {
    let { x1, y1, x2, y2 } = bounds([...spec.zones, ...spec.nodes]);
    const fr = spec.frame;
    if (fr) {
      const inside = spec.zones.filter(z => (!z.boundary || z.boundary === "ours") && z.frame !== false);
      if (inside.length && !["x", "y", "w", "h"].every(k => k in fr)) {
        const b = bounds(inside), m = fr.margin ?? 25;
        Object.assign(fr, { x: b.x1 - m, y: b.y1 - m - 10, w: b.x2 - b.x1 + 2 * m, h: b.y2 - b.y1 + 2 * m + 10 });
      }
      if (["x", "y", "w", "h"].every(k => k in fr)) {
        x1 = Math.min(x1, fr.x); y1 = Math.min(y1, fr.y); x2 = Math.max(x2, fr.x + fr.w); y2 = Math.max(y2, fr.y + fr.h);
      }
    }
    spec.fitBox ||= { x: x1 - 20, y: y1 - 20, w: x2 - x1 + 40, h: y2 - y1 + 40 };
    spec.world ||= { w: x2 + 60, h: y2 + 60 };
  }

  /* ------------------------------------------------------------ references */
  function expandRefs(spec, rep) {
    const groups = spec.groups || {};
    const expand = (ids, where, depth = 0) => {
      const out = [];
      for (const i of ids || []) {
        if (typeof i === "string" && i.startsWith("@")) {
          const g = i.slice(1);
          if (!groups[g]) { rep.err(`${where}: unknown group '${i}'`); continue; }
          if (depth > 10) { rep.err(`${where}: group '${i}' refers to itself`); continue; }
          out.push(...expand(groups[g], where, depth + 1));
        } else out.push(i);
      }
      return [...new Set(out)];
    };
    for (const k of Object.keys(groups)) groups[k] = expand(groups[k], `groups.${k}`);
    spec.lenses.forEach(l => { l.nodes = expand(l.nodes, `tab '${l.id}'`); });
    (spec.tour || []).forEach((st, i) => { if (st.nodes) st.nodes = expand(st.nodes, `tour step ${i + 1}`); });
    for (const [lid, L] of Object.entries(spec.lists || {})) (L.items || []).forEach(it => {
      it.nodes = expand(it.nodes, `list '${lid}' item '${stripTags(it.title)}'`);
      if (it.path) it.path = expand(it.path, `list '${lid}' item '${stripTags(it.title)}' path`);
    });
    ((spec.roadmap || {}).phases || []).forEach(p => (p.items || []).forEach(it => { it.nodes = expand(it.nodes, `roadmap item '${stripTags(it.title)}'`); }));
  }
  function normalizeEdges(spec) {
    spec.edges = (spec.edges || []).map(e => {
      if (Array.isArray(e)) { const [from, to, groups, label, dashed] = e; e = { from, to, groups, label, dashed }; }
      const o = Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined && v !== null && v !== ""));
      o.groups ||= [];
      return o;
    });
  }
  // personas become a clickable list (and a tab): pick one to see its path
  function addPersonas(spec, rep) {
    const P = spec.personas;
    if (Array.isArray(P) && P.length && (spec.lists || {}).personas) rep.warn("both 'personas' and 'lists.personas' exist; the personas list is built from 'personas'");
    if (!Array.isArray(P) || !P.length) return;
    spec.lists ||= {};
    const L10N = spec.settings.labels;
    // a persona with a "zone" is also a box on the map (e.g. next to the applications); its path starts at that box
    const zoneIds = new Set(spec.zones.map(z => z.id)), boxIds = new Set(spec.nodes.map(n => n.id));
    const onMap = P.map((p, i) => {
      if (!p.zone) return null;
      const id = p.id || "persona-" + (i + 1);
      if (!zoneIds.has(p.zone)) { rep.err(`persona '${stripTags(p.title)}': unknown zone '${p.zone}'`); return null; }
      if (boxIds.has(id)) { rep.err(`persona id '${id}' is also the id of a box; give the persona its own id`); return null; }
      const node = { id, zone: p.zone, title: p.title, sub: p.boxSub ?? p.sub, icon: p.icon || "user", what: p.text || p.sub || "", persona: true, kind: L10N.persona };
      for (const k of ["color", "x", "y", "w", "h", "size", "span", "badge", "status", "sources"]) if (p[k] !== undefined) node[k] = p[k];
      // persona boxes come first in their zone, in the order of the personas
      const first = spec.nodes.findIndex(n => n.zone === p.zone && !n.persona);
      spec.nodes.splice(first < 0 ? spec.nodes.length : first, 0, node);
      boxIds.add(id);
      if (p.path && p.path.length) spec.edges.push({ from: id, to: p.path[0], groups: ["personas"], persona: true });
      return id;
    });
    spec.lists.personas = {
      title: L10N.personas, sub: L10N.personasSub, icon: "users", color: spec.theme.vars.accent || "#3b82f6",
      eyebrow: spec.personasEyebrow || "", intro: spec.personasIntro || "", personas: true,
      items: P.map((p, i) => ({ tag: p.tag, title: p.title, sub: p.sub, text: p.text, color: p.color, icon: p.icon, nodes: p.nodes || [], path: p.path, edges: p.edges, id: p.id, personaNode: onMap[i] || undefined })),
    };
    if (spec.settings.personas.tab !== false && !spec.lenses.some(l => l.list === "personas"))
      spec.lenses.push({ id: "personas", title: L10N.personas, color: spec.theme.vars["accent-light"] || "#93b4ff", list: "personas", fit: "all", auto: true });
  }

  /* ------------------------------------------------------------ edge geometry (mirrors edgeD in the renderer) */
  function edgePoints(a, b, steps = 40) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2, dx = bx - ax, dy = by - ay;
    const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
    let P;
    if (gapX > 10 && Math.abs(dx) > Math.abs(dy) * 0.45) {
      const s = Math.sign(dx), x1 = s > 0 ? a.x + a.w : a.x, x2 = s > 0 ? b.x : b.x + b.w, k = Math.max(40, Math.abs(x2 - x1) * 0.5);
      P = [[x1, ay], [x1 + s * k, ay], [x2 - s * k, by], [x2, by]];
    } else {
      const s = Math.sign(dy) || 1, y1 = s > 0 ? a.y + a.h : a.y, y2 = s > 0 ? b.y : b.y + b.h, k = Math.max(30, Math.abs(y2 - y1) * 0.5);
      P = [[ax, y1], [ax, y1 + s * k], [bx, y2 - s * k], [bx, y2]];
    }
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, m = 1 - t;
      pts.push([0, 1].map(j => m ** 3 * P[0][j] + 3 * m * m * t * P[1][j] + 3 * m * t * t * P[2][j] + t ** 3 * P[3][j]));
    }
    return pts;
  }
  // (label, node set, edge groups) for every tab, list item, tour step and roadmap phase
  function viewDefs(spec) {
    const zoneOf = Object.fromEntries(spec.zones.map(z => [z.id, z]));
    const inside = new Set(spec.nodes.filter(n => zoneOf[n.zone] && !zoneOf[n.zone].outside).map(n => n.id));
    const nset = d => {
      const s = new Set([...(d.nodes || []), ...(d.path || [])]);
      (d.zones || []).forEach(zid => spec.nodes.forEach(n => n.zone === zid && s.add(n.id)));
      if (d.withInside) inside.forEach(i => s.add(i));
      return s;
    };
    const out = spec.lenses.map(l => [`tab '${l.id}'`, nset(l), l.edges]);
    for (const [lid, L] of Object.entries(spec.lists || {})) (L.items || []).forEach(it => out.push([`list '${lid}' item '${stripTags(it.title)}'`, nset(it), it.edges || L.edges]));
    let n = 0;
    for (const st of spec.tour || []) {
      if (st.roadmap) for (const p of (spec.roadmap || {}).phases || []) { n++; out.push([`tour step ${n}`, new Set(p.items.flatMap(it => it.nodes || [])), ["none"]]); }
      else { n++; out.push([`tour step ${n}`, nset(st), st.edges]); }
    }
    return out;
  }
  // every connection that passes through a box it doesn't connect (whether or not they are ever highlighted together)
  function crossings(spec) {
    const zones = Object.fromEntries(spec.zones.map(z => [z.id, z])), nodes = Object.fromEntries(spec.nodes.map(n => [n.id, n]));
    const rect = end => end.startsWith("zone:") ? zones[end.slice(5)] : nodes[end];
    const out = [];
    spec.edges.forEach(e => {
      const a = rect(e.from || ""), b = rect(e.to || "");
      if (!a || !b) return;
      const skip = new Set([e.from, e.to, ...spec.nodes.filter(n => [e.from, e.to].includes("zone:" + n.zone)).map(n => n.id)]);
      const pts = edgePoints(a, b);
      const hit = spec.nodes.filter(n => !skip.has(n.id) && pts.some(([x, y]) => n.x + 4 < x && x < n.x + n.w - 4 && n.y + 4 < y && y < n.y + n.h - 4)).map(n => n.id);
      if (hit.length) out.push(`${e.from} → ${e.to} passes ${hit.join(", ")}`);
    });
    return out;
  }
  function checkEdges(spec, rep) {
    const zones = Object.fromEntries(spec.zones.map(z => [z.id, z])), nodes = Object.fromEntries(spec.nodes.map(n => [n.id, n]));
    const rect = end => end.startsWith("zone:") ? zones[end.slice(5)] : nodes[end];
    const members = end => end.startsWith("zone:") ? new Set(spec.nodes.filter(n => n.zone === end.slice(5)).map(n => n.id)) : new Set([end]);
    const crossings = new Map();
    spec.edges.forEach((e, idx) => {
      const a = rect(e.from || ""), b = rect(e.to || "");
      if (!a || !b) return;
      const skip = new Set([...members(e.from), ...members(e.to)]);
      const pts = edgePoints(a, b);
      for (const n of spec.nodes) {
        if (skip.has(n.id)) continue;
        const x1 = n.x + 4, y1 = n.y + 4, x2 = n.x + n.w - 4, y2 = n.y + n.h - 4;
        if (pts.some(([x, y]) => x1 < x && x < x2 && y1 < y && y < y2)) { if (!crossings.has(idx)) crossings.set(idx, []); crossings.get(idx).push(n.id); }
      }
      if (e.label) {
        let len = 0;
        for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        const need = textPx(e.label, 12) + 24;
        if (len < Math.max(40, need * 0.8)) rep.warn(`edge ${e.from} → ${e.to}: the label '${e.label}' won't fit on a ${Math.round(len)}px connection; drop the label or move the boxes apart`);
      }
    });
    if (!crossings.size) return;
    const seen = new Map();
    const note = (idx, c, label) => { const k = idx + "|" + c; if (!seen.has(k)) seen.set(k, []); seen.get(k).push(label); };
    const main = spec.settings.edges.mainFlow;
    if (main && spec.settings.edges.overview !== "none")
      for (const [idx, crossed] of crossings) if (spec.edges[idx].groups.includes(main)) crossed.forEach(c => note(idx, c, "the overview (main flow)"));
    for (const [label, ns, groups] of viewDefs(spec)) {
      if (groups && groups.includes("none")) continue;
      const endIn = end => [...members(end)].some(m => ns.has(m));
      for (const [idx, crossed] of crossings) {
        const e = spec.edges[idx];
        if (!(endIn(e.from) && endIn(e.to))) continue;
        if (groups && !e.groups.some(g => groups.includes(g))) continue;
        crossed.forEach(c => ns.has(c) && note(idx, c, label));
      }
    }
    for (const [k, views] of seen) {
      const [idx, c] = k.split("|"), e = spec.edges[+idx];
      rep.warn(`edge ${e.from} → ${e.to} runs through the highlighted box '${c}' in ${views[0]}${views.length > 1 ? ` and ${views.length - 1} more` : ""}: reorder boxes, move a zone, or connect to the zone ('zone:<id>')`);
    }
  }

  /* ------------------------------------------------------------ validation */
  const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  function validate(spec, rep, knownIcons) {
    const seenIds = new Set();
    for (const [kind, items] of [["zone", spec.zones], ["node", spec.nodes]]) for (const it of items) {
      if (!it.id) { rep.err(`a ${kind} has no id: ${JSON.stringify(it).slice(0, 80)}`); continue; }
      if (seenIds.has(kind + ":" + it.id)) rep.err(`duplicate ${kind} id '${it.id}'`);
      seenIds.add(kind + ":" + it.id);
      if (!/^[A-Za-z0-9_-]+$/.test(it.id)) rep.err(`${kind} id '${it.id}' may only use letters, digits, '-' and '_'`);
    }
    const zones = Object.fromEntries(spec.zones.map(z => [z.id, z])), nodes = Object.fromEntries(spec.nodes.filter(n => n.id).map(n => [n.id, n]));
    const iconOk = i => !i || knownIcons.has(i) || /^(data:|<svg|https?:)/.test(i); // remote images are reported by sanitize()
    for (const z of spec.zones) {
      if (!isHex(z.color)) rep.err(`zone '${z.id}' needs a 6-digit hex color, got '${z.color}'`);
      if (!z.title) rep.err(`zone '${z.id}' has no title`);
      if (z.boundary && !BOUNDARIES.includes(z.boundary)) rep.err(`zone '${z.id}': boundary '${z.boundary}' is not one of ${BOUNDARIES.join(", ")}`);
      const tag = z.tag || (z.boundary && z.boundary !== "ours" ? "x" : "");
      const head = textPx(String(z.title || "").toUpperCase(), 13) * 1.12 + textPx(z.sub || "", 12, false) + (tag ? 70 : 0) + 42;
      if (head > z.w) rep.warn(`zone '${z.id}': title + subtitle (~${Math.round(head)}px) may not fit the ${z.w}px header; shorten them`);
    }
    const statusIds = new Set(((spec.status || {}).values || []).map(v => v.id));
    for (const n of Object.values(nodes)) {
      const z = zones[n.zone];
      if (!z) { rep.err(`node '${n.id}' is in unknown zone '${n.zone}'`); continue; }
      if (!iconOk(n.icon)) rep.warn(`node '${n.id}': unknown icon '${n.icon}' (shows a cog); see reference/icons.md`);
      if (!n.title) rep.err(`node '${n.id}' has no title`);
      if (!n.what && !n.persona) rep.warn(`node '${n.id}' has no 'what' text: its panel will be nearly empty`);
      if (n.status && !statusIds.has(n.status)) rep.err(`node '${n.id}': status '${n.status}' is not one of ${[...statusIds].join(", ") || "status.values (none defined)"}`);
      if (!(z.x - 1 <= n.x && n.x + n.w <= z.x + z.w + 1 && z.y - 1 <= n.y && n.y + n.h <= z.y + z.h + 1)) rep.warn(`node '${n.id}' sticks out of its zone '${z.id}'`);
      if (n.y < z.y + 44) rep.warn(`node '${n.id}' overlaps the header of zone '${z.id}' (start it at least 50px below the zone top)`);
      const big = n.size === "big", avail = n.w - 28 - (big ? 62 : 48), tsize = big ? (n.compact ? 15.5 : 18) : 14.5;
      const tw = textPx(n.title, tsize);
      if (tw > avail * 1.03) rep.warn(`node '${n.id}': title '${stripTags(n.title)}' (~${Math.round(tw)}px) is wider than the ${Math.round(avail)}px available; shorten it, widen the box${big ? " or set compact: true" : ""}`);
      if (n.sub && !big && textPx(n.sub, 12, false) > avail * 1.03) rep.warn(`node '${n.id}': subtitle will be cut off with '…' (~${Math.round(textPx(n.sub, 12, false))}px > ${Math.round(avail)}px)`);
      if (n.sub && big && textPx(n.sub, 12.5, false) > avail * 2) rep.warn(`node '${n.id}': subtitle needs more than two lines in a big box; shorten it`);
    }
    const nl = Object.values(nodes);
    nl.forEach((a, i) => nl.slice(i + 1).forEach(b => overlap(a, b, -1) && rep.err(`nodes '${a.id}' and '${b.id}' overlap`)));
    spec.zones.forEach((a, i) => spec.zones.slice(i + 1).forEach(b => overlap(a, b, -1) && rep.warn(`zones '${a.id}' and '${b.id}' overlap`)));
    const checkEnd = (id, where) => {
      if (id.startsWith("zone:")) { if (!zones[id.slice(5)]) rep.err(`${where}: unknown zone '${id.slice(5)}'`); }
      else if (!nodes[id]) rep.err(`${where}: unknown node '${id}'`);
    };
    const edgeGroups = new Set(), pairs = new Set();
    for (const e of spec.edges) {
      const where = `edge ${e.from} → ${e.to}`;
      checkEnd(e.from || "", where); checkEnd(e.to || "", where);
      if (!e.groups.length) rep.warn(`${where} has no groups: it will never be highlighted by a tab or tour step`);
      e.groups.forEach(g => edgeGroups.add(g));
      if (e.color && !isHex(e.color)) rep.err(`${where}: color must be a 6-digit hex color`);
      const key = e.from + ">" + e.to;
      if (pairs.has(key)) rep.warn(`${where} is defined twice`);
      pairs.add(key);
    }
    const main = spec.settings.edges.mainFlow;
    if (main && !edgeGroups.has(main)) rep.err(`settings.edges.mainFlow '${main}' is not a group used by any edge`);
    const overlayIds = new Set((spec.overlays || []).map(o => o.id));
    const checkDef = (d, where) => {
      for (const id of [...(d.nodes || []), ...(d.path || [])]) if (!nodes[id]) rep.err(`${where}: unknown node '${id}'`);
      for (const zid of [...(d.zones || []), ...(d.camZones || [])]) if (!zones[zid]) rep.err(`${where}: unknown zone '${zid}'`);
      for (const g of d.edges || []) if (g !== "none" && !edgeGroups.has(g)) rep.warn(`${where}: edge group '${g}' is not used by any edge`);
      if (d.list && !(spec.lists || {})[d.list]) rep.err(`${where}: unknown list '${d.list}'`);
      if (d.overlay && !overlayIds.has(d.overlay) && !(d.overlay === "roadmap" && spec.roadmap)) rep.err(`${where}: unknown overlay '${d.overlay}'`);
    };
    if (!spec.lenses.length) rep.err("at least one lens (tab) is required; the first one is the overview");
    const lensIds = new Set();
    for (const l of spec.lenses) {
      if (lensIds.has(l.id)) rep.err(`duplicate tab id '${l.id}'`);
      lensIds.add(l.id);
      checkDef(l, `tab '${l.id}'`);
    }
    (spec.tour || []).forEach((st, i) => {
      if (st.roadmap) { if (!spec.roadmap) rep.err(`tour step ${i + 1} expands the roadmap but there is no roadmap`); return; }
      checkDef(st, `tour step ${i + 1} '${stripTags(st.title).slice(0, 40)}'`);
      if (!st.title) rep.err(`tour step ${i + 1} has no title`);
      const words = stripTags(st.text).split(/\s+/).filter(Boolean).length;
      if (words > 130) rep.warn(`tour step ${i + 1}: ${words} words; keep tour text under ~110 words so it fits the card`);
      if ((st.nodes || []).length > 24 && st.fit !== "all") rep.warn(`tour step ${i + 1} highlights ${st.nodes.length} boxes; consider fit: 'all' or a tighter focus`);
    });
    for (const [lid, L] of Object.entries(spec.lists || {})) {
      if (!isHex(L.color)) rep.err(`list '${lid}' needs a 6-digit hex color`);
      (L.items || []).forEach(it => {
        checkDef(it, `list '${lid}' item '${stripTags(it.title)}'`);
        if (it.color && !isHex(it.color)) rep.err(`list '${lid}' item '${stripTags(it.title)}': color must be a 6-digit hex color`);
      });
    }
    ((spec.roadmap || {}).phases || []).forEach(p => (p.items || []).forEach(it => checkDef(it, `roadmap item '${stripTags(it.title)}'`)));
    for (const o of spec.overlays || []) for (const b of o.blocks || [])
      if (!["cards", "note", "grid", "text", "roadmap"].includes(b.type)) rep.err(`overlay '${o.id}': unknown block type '${b.type}'`);
    // every box should be reachable from at least one view, otherwise nobody ever sees it highlighted
    const covered = new Set();
    for (const d of [...spec.lenses, ...(spec.tour || []), ...Object.values(spec.lists || {}).flatMap(L => L.items || [])]) {
      [...(d.nodes || []), ...(d.path || [])].forEach(i => covered.add(i));
      (d.zones || []).forEach(zid => nl.forEach(n => n.zone === zid && covered.add(n.id)));
    }
    // icons everywhere, not only on boxes
    const iconWarn = (i, where) => { if (i && !iconOk(i)) rep.warn(`${where}: unknown icon '${i}' (shows a cog); see reference/icons.md`); };
    spec.zones.forEach(z => iconWarn(z.icon, `zone '${z.id}'`));
    ((spec.hero || {}).pillars || []).forEach((p, i) => iconWarn(p.icon, `hero pillar ${i + 1}`));
    for (const [lid, L] of Object.entries(spec.lists || {})) { iconWarn(L.icon, `list '${lid}'`); (L.items || []).forEach(it => iconWarn(it.icon, `list '${lid}' item '${stripTags(it.title)}'`)); }
    (spec.overlays || []).forEach(o => iconWarn(o.icon, `overlay '${o.id}'`));
    if (typeof spec.meta.logo === "string" && spec.meta.logo.startsWith("icon:")) iconWarn(spec.meta.logo.slice(5), "meta.logo");
    // a path's consecutive steps should be connected, otherwise nothing lights up between them
    const linked = (a, b) => spec.edges.some(e => { const is = (end, id) => end === id || (end.startsWith("zone:") && nodes[id] && nodes[id].zone === end.slice(5)); return (is(e.from, a) && is(e.to, b)) || (is(e.from, b) && is(e.to, a)); });
    for (const [lid, L] of Object.entries(spec.lists || {})) (L.items || []).forEach(it => {
      const p = (it.path || []).filter(id => nodes[id]);
      const gaps = p.slice(1).map((id, i) => [p[i], id]).filter(([a, b]) => !linked(a, b));
      if (gaps.length) rep.warn(`${lid === "personas" ? "persona" : `list '${lid}' item`} '${stripTags(it.title)}': no connection between path steps ${gaps.map(([a, b]) => a + " → " + b).join(", ")}; add the edge or reorder the path`);
    });
    // the frame should not cover areas that aren't ours
    if (spec.frame && ["x", "y", "w", "h"].every(k => k in spec.frame))
      spec.zones.filter(z => (z.boundary && z.boundary !== "ours") || z.frame === false).forEach(z => { if (overlap(spec.frame, z, -2)) rep.warn(`the frame covers zone '${z.id}' (${z.boundary}); move the zone outside the frame or give frame x/y/w/h`); });
    // the overview on a 16:9 laptop screen (1600×950 minus the top bar)
    const fb = spec.fitBox || { w: 1, h: 1 }, ov = Math.min((1600 - 48) / fb.w, (950 - 96 - 48) / fb.h);
    if (ov < 0.4) rep.warn(`the whole map is ${Math.round(fb.w)}×${Math.round(fb.h)}px, so the overview shows it at ${ov.toFixed(2)}× on a 1600×950 screen and text is hard to read; aim for about 16:9 (e.g. wrap a long row of areas into two rows)`);
    const orphans = nl.filter(n => !covered.has(n.id) && !spec.edges.some(e => e.from === n.id || e.to === n.id)).map(n => n.id);
    if (orphans.length) rep.warn(`boxes with no connection and in no tab, list or tour step: ${orphans.join(", ")}`);
  }

  /* ------------------------------------------------------------ theme */
  function resolveTheme(t, rep) {
    t = t || {};
    let preset = t.preset || "midnight";
    if (!THEMES[preset]) { rep.err(`unknown theme preset '${preset}' (choose: ${Object.keys(THEMES).join(", ")})`); preset = "midnight"; }
    const P = THEMES[preset], mode = t.mode || P.mode;
    const vars = { ...(mode === "light" ? LIGHT : DARK), ...P.vars };
    const primary = t.primary || t.accent || P.primary, secondary = t.secondary || t.accentAlt || P.secondary;
    for (const [k, c] of [["primary", primary], ["secondary", secondary]]) if (!isHex(c)) rep.err(`theme.${k} must be a 6-digit hex color, got '${c}'`);
    vars.accent = primary;
    vars["accent-rgb"] = rgbStr(primary);
    vars["accent-alt"] = secondary;
    vars["accent-alt-rgb"] = rgbStr(secondary);
    vars["accent-deep"] = t.accentDeep || mix(primary, "#000000", 0.28);
    // light text on dark themes, darker text on light themes
    vars["accent-light"] = t.accentLight || (mode === "light" ? mix(primary, "#000000", 0.18) : mix(primary, "#ffffff", 0.45));
    vars["on-accent"] = "#ffffff";
    if (t.font) vars.font = t.font;
    const shape = t.shape || "rounded";
    if (!SHAPES[shape]) rep.err(`theme.shape '${shape}' is not one of ${Object.keys(SHAPES).join(", ")}`);
    Object.assign(vars, SHAPES[shape] || SHAPES.rounded, t.vars || {});
    return { preset, mode, shape, primary, secondary, vars };
  }

  /* ------------------------------------------------------------ resolve one diagram */
  function makeReport() {
    const r = { errors: [], warnings: [] };
    r.err = m => r.errors.push(m);
    r.warn = m => r.warnings.push(m);
    return r;
  }
  function resolve(raw, opts = {}) {
    const rep = makeReport();
    let spec;
    try { spec = clone(raw); } catch (e) { rep.err("the diagram data is not valid JSON: " + e.message); return { spec: null, ...rep }; }
    if (!isObj(spec)) { rep.err("the diagram data must be an object"); return { spec: null, ...rep }; }
    for (const k of ["meta", "zones", "nodes"]) if (!spec[k]) rep.err(`missing top-level key '${k}'`);
    if (rep.errors.length) return { spec: null, ...rep };
    sanitize(spec, rep);
    let type = spec.meta.type || "architecture";
    if (!TYPE_LABELS[type]) { rep.warn(`meta.type '${type}' is not one of ${Object.keys(TYPE_LABELS).join(", ")}; using 'custom' wording`); type = "custom"; }
    let vp = spec.meta.viewpoint || "mixed";
    if (!VIEWPOINT_TECH[vp]) { rep.warn(`meta.viewpoint '${vp}' is not one of product, technical, mixed`); vp = "mixed"; }
    spec.edges ||= [];
    spec.lenses ||= [{ id: "overview", title: "Overview", color: "#e2e8f0" }];
    spec.settings = deepMerge(deepMerge(DEFAULT_SETTINGS, { labels: { ...TYPE_LABELS[type], ...VIEWPOINT_LABELS[vp] } }), spec.settings);
    const S = spec.settings;
    S.panel.tech ||= VIEWPOINT_TECH[vp];
    if (!["full", "pick", "off"].includes(S.panel.tech)) { rep.err(`settings.panel.tech '${S.panel.tech}' is not one of full, pick, off`); S.panel.tech = "full"; }
    if (opts.embedded) S.embedded = true;
    if (opts.hero === false) S.hero = false;
    if (spec.status) spec.status.toggleLabel ||= "Status";
    // a zone's boundary decides how it looks: "external" is the old outside: true
    for (const z of spec.zones) {
      if (z.outside && !z.boundary) z.boundary = "external";
      if (z.boundary === "external" || z.boundary === "partner") z.outside = true;
    }
    spec.theme = resolveTheme(spec.theme, rep);
    const known = new Set([...(opts.icons || []), ...Object.keys(spec.icons || {})]);
    addPersonas(spec, rep);
    expandRefs(spec, rep);
    normalizeEdges(spec);
    placeZones(spec, rep);
    if (rep.errors.length) return { spec: null, ...rep };
    placeNodes(spec, rep);
    placeWorld(spec);
    checkEdges(spec, rep);
    validate(spec, rep, known);
    return { spec, ...rep, stats: stats(spec) };
  }
  const tourLength = spec => (spec.tour || []).reduce((s, st) => s + (st.roadmap ? ((spec.roadmap || {}).phases || []).length : 1), 0);
  const stats = spec => `${spec.zones.length} zones · ${spec.nodes.length} boxes · ${spec.edges.length} connections · ${spec.lenses.length} tabs · ${tourLength(spec)} tour steps · ${(spec.overlays || []).length} overlays`;

  // what each tab, list item and tour step highlights, after @group expansion
  function explain(spec) {
    const lines = ["  Layout (world px): zones x,y w×h; boxes x,y w×h"];
    spec.zones.forEach(z => lines.push(`  zone ${z.id}: ${z.x},${z.y} ${z.w}×${z.h}${z.boundary && z.boundary !== "ours" ? " (" + z.boundary + ")" : ""}  boxes: ${spec.nodes.filter(n => n.zone === z.id).map(n => `${n.id} ${n.x},${n.y} ${n.w}×${n.h}`).join(" · ")}`));
    const cr = crossings(spec);
    lines.push("", `  Connections through other boxes (${cr.length}; only those highlighted together are warnings):`);
    cr.forEach(c => lines.push("    " + c));
    lines.push("", "  What lights up where (after @group expansion):");
    const line = (label, d) => {
      const ids = [...(d.path || []), ...(d.nodes || []).filter(i => !(d.path || []).includes(i))];
      lines.push(`  ${label}: ${ids.length} boxes${(d.zones || []).length ? " + zones " + d.zones.join(",") : ""}${d.edges ? "  edges=" + d.edges.join(",") : ""}${d.path ? "  (path)" : ""}`);
      lines.push("      " + ids.join(", "));
    };
    spec.lenses.forEach(l => line(`tab '${l.id}'`, l));
    for (const [lid, L] of Object.entries(spec.lists || {})) (L.items || []).forEach(it => line(`list '${lid}' · ${stripTags(it.title)}`, it));
    let n = 0;
    for (const st of spec.tour || []) {
      if (st.roadmap) for (const p of (spec.roadmap || {}).phases || []) { n++; line(`tour #${n} roadmap ${p.when}`, { nodes: [...new Set(p.items.flatMap(it => it.nodes || []))] }); }
      else { n++; line(`tour #${n} ${stripTags(st.title).slice(0, 50)}`, st); }
    }
    return lines;
  }

  return { VERSION, crossings, THEMES, SHAPES, TYPE_LABELS, BOUNDARIES, DEFAULT_SETTINGS, resolve, resolveTheme, diagramsOf, explain, stripTags, deepMerge, mix, hexRgb, rgbStr, isHex, makeReport, edgePoints };
})();
if (typeof module !== "undefined") module.exports = BDCore;
