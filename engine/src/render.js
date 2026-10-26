/* Blueprint Deck renderer: draws one resolved diagram into the page and runs it (camera, tabs, panels, tour, overlays).
   createDiagram() can be called again with a changed spec (the editor does that on every change, the switcher on every
   diagram change); destroy() removes everything the previous run added. */
const SVGNS = "http://www.w3.org/2000/svg";
const PLAY = '<svg class="i" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
const rgbOf = h => { const c = BDCore.hexRgb(h) || [128, 128, 128]; return c.join(","); };
// custom properties (--c, --rgb) need setProperty; Object.assign on style silently drops them
const setStyle = (el, props) => Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, typeof v === "number" ? v + "px" : v));
// the credit ("Made with Blueprint Deck Kit", settings.credit): the kit's mark and name, on the start screen, in the
// ⋯ menu and the PDF footer
const BDK_SITE = "https://blueprintdeck.dev";
// each copy gets its own gradient id: a copy that is hidden (the start screen while printing) can't lend it to others
let bdkN = 0;
const bdkCredit = () => { const n = ++bdkN; return `Made with <b class="bdk-name"><svg class="bdk-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="bdk-g${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#bdk-g${n})"/><rect x="10" y="6" width="16" height="12.5" rx="2.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><rect x="6" y="10.5" width="18" height="15" rx="3" fill="#fff"/><path d="M10.6 16.2h8.6M10.6 16.2l4.3 5.2M19.2 16.2l-4.3 5.2" stroke="#4f46e5" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="10.6" cy="16.2" r="2" fill="#2563eb"/><circle cx="19.2" cy="16.2" r="2" fill="#2563eb"/><circle cx="14.9" cy="21.4" r="2" fill="#7c3aed"/></svg>Blueprint Deck Kit</b>`; };
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function iconHtml(name, custom) {
  const n = name || "cog";
  if (/^(data:|https?:)/.test(n) || /\.(png|svg|jpe?g|webp|gif)$/i.test(n)) return `<img src="${esc(n)}" alt="">`;
  if (n.startsWith("<svg")) return n;
  const inner = (custom && custom[n]) || ICONS[n] || ICONS[ICON_ALIASES[n]] || ICONS.cog;
  return inner.trim().startsWith("<svg") ? inner : `<svg class="i" viewBox="0 0 24 24">${inner}</svg>`;
}
// The browser tab's icon follows the deck's logo: an image as it is; a Lucide icon (or the logo's initials) on the
// accent gradient, like the logo in the corner. Remote images can't load (the file blocks network requests), so they
// fall back to the default icon.
function setFavicon(logo, customIcons) {
  try {
    const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
    const l = String(logo || "icon:layout-grid").trim();
    if (/^data:image\//.test(l)) { link.href = l; return; }
    if (l.startsWith("<svg")) { link.href = "data:image/svg+xml," + encodeURIComponent(l.includes("xmlns=") ? l : l.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')); return; }
    const cs = getComputedStyle(document.documentElement);
    const v = (k, d) => (cs.getPropertyValue(k).trim() || d).replace(/"/g, "");
    const a = v("--accent", "#3b82f6"), b = v("--accent-alt", a), on = v("--on-accent", "#fff");
    let inner;
    if (l.startsWith("icon:") || /^https?:|\.(png|svg|jpe?g|webp)$/i.test(l)) {
      const name = l.startsWith("icon:") ? l.slice(5) : "layout-grid";
      const svg = iconHtml(name, customIcons);
      const body = svg.startsWith("<svg") ? svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>")) : ICONS["layout-grid"];
      inner = `<g transform="translate(6 6) scale(0.8333)" fill="none" stroke="${on}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
    } else {
      inner = `<text x="16" y="21.5" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="${on}">${esc(l.slice(0, 2))}</text>`;
    }
    link.href = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/>${inner}</svg>`);
  } catch { /* keep the previous icon */ }
}
function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars || {}).forEach(([k, v]) => root.style.setProperty("--" + k, v));
  document.body.classList.toggle("light", theme.mode === "light");
  document.body.dataset.shape = theme.shape || "rounded";
}

function createDiagram(SPEC, host = {}, opts = {}) {
  const ac = new AbortController(), sig = { signal: ac.signal };
  const on = (target, type, fn, o = {}) => target.addEventListener(type, fn, { ...o, signal: ac.signal });
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const editing = () => !!(host.editing && host.editing());

  const META = SPEC.meta, S = SPEC.settings, L10N = S.labels;
  const ZONES = SPEC.zones, NODES = SPEC.nodes, EDGES = SPEC.edges;
  const LENSES = SPEC.lenses, LISTS = SPEC.lists || {}, OVERLAYS = SPEC.overlays || [], ROADMAP = SPEC.roadmap;
  const STATUS = SPEC.status;
  const WORLD = SPEC.world, ALL_BOX = SPEC.fitBox;
  const icon = n => iconHtml(n, SPEC.icons);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = id => document.getElementById(id);

  applyTheme(SPEC.theme);
  document.documentElement.lang = META.language || "en";
  document.title = BDCore.stripTags(host.title || META.title) + (META.subtitle && !host.title ? " — " + BDCore.stripTags(META.subtitle) : "");
  document.body.classList.toggle("intro", opts.intro !== false && S.motion.intro !== false);
  ["tour-side", "panel-open", "touring", "sheet-open", "status", "check"].forEach(c => document.body.classList.remove(c));

  /* =====================================================================
     BUILD
     ===================================================================== */
  const world = $("world"), viewport = $("viewport");
  world.replaceChildren(Object.assign(document.createElement("div"), { className: "grid" }));
  world.className = "world";
  world.style.width = WORLD.w + "px"; world.style.height = WORLD.h + "px";
  const zoneById = Object.fromEntries(ZONES.map(z => [z.id, z]));
  const nodeById = Object.fromEntries(NODES.map(n => [n.id, n]));
  const listById = id => LISTS[id];

  ZONES.forEach(z => { z.rgb = rgbOf(z.color); });
  NODES.forEach(n => {
    const z = zoneById[n.zone];
    n.color = n.color || z.color; n.rgb = rgbOf(n.color);
    if (!n.kind) n.kind = z.boundary && z.boundary !== "ours" ? (z.outside ? L10N.outside : L10N.boundary[z.boundary]) : L10N.inside;
    n.why = n.why || [];
  });
  const INSIDE = NODES.filter(n => !zoneById[n.zone].outside).map(n => n.id);

  /* brand (in a multi-diagram file the host turns it into the switcher) */
  const brand = $("brand");
  brand.className = "hud glass"; brand.onclick = null; brand.style.display = ""; brand.style.cursor = "";
  const logoOf = () => {
    const l = META.logo || "icon:layout-grid";
    if (l.startsWith("icon:")) return { html: icon(l.slice(5)), img: false };
    if (l.startsWith("<svg")) return { html: l, img: true };
    if (/^(data:|https?:)/.test(l) || /\.(png|svg|jpe?g|webp)$/i.test(l)) return { html: `<img src="${esc(l)}" alt="">`, img: true };
    return { html: esc(l.slice(0, 3)), img: false };
  };
  setFavicon(META.logo, SPEC.icons);
  if (host.renderBrand) host.renderBrand(brand, logoOf());
  else {
    const lg = logoOf();
    brand.innerHTML = `<div class="logo${lg.img ? " img" : ""}">${lg.html}</div><div class="txt"><div class="bt">${META.title}</div>${META.subtitle ? `<div class="bs">${META.subtitle}</div>` : ""}</div>`;
  }

  /* frame around the "inside" zones */
  if (SPEC.frame) {
    const f = SPEC.frame, frame = document.createElement("div");
    frame.className = "frame";
    setStyle(frame, { left: f.x, top: f.y, width: f.w, height: f.h });
    if (f.label) frame.innerHTML = `<div class="frame-label">${f.label}</div>`;
    world.appendChild(frame);
  }

  ZONES.forEach(z => {
    const el = document.createElement("div");
    const b = z.boundary || "ours";
    el.className = "zone b-" + b + (z.outside ? " outside" : "") + (z.base ? " base" : "");
    setStyle(el, { left: z.x, top: z.y, width: z.w, height: z.h, "--c": z.color, "--rgb": z.rgb, "--d": (z.x / WORLD.w * 0.6 + z.y / WORLD.h * 0.3) + "s" });
    const tag = z.tag ? `<span class="zone-tag">${z.tag}</span>` : b !== "ours" && z.boundaryTag !== false ? `<span class="zone-tag bt">${L10N.boundary[b]}</span>` : "";
    el.innerHTML = `<div class="zone-head"><span class="zone-title">${z.title}</span><span class="zone-sub">${z.sub || ""}</span>${tag}</div>`;
    on(el.querySelector(".zone-head"), "click", e => { e.stopPropagation(); if (editing()) host.onEdit({ kind: "zone", id: z.id }); else openZone(z.id); });
    world.appendChild(el);
    z.el = el;
  });

  const svg = document.createElementNS(SVGNS, "svg");
  svg.id = "edges"; svg.setAttribute("width", WORLD.w); svg.setAttribute("height", WORLD.h);
  const gEdges = document.createElementNS(SVGNS, "g"), gParticles = document.createElementNS(SVGNS, "g"), gLabels = document.createElementNS(SVGNS, "g");
  gParticles.setAttribute("class", "particles");
  svg.append(gEdges, gParticles, gLabels);
  world.appendChild(svg);

  /* status tags (e.g. MVP / Next / Later, or Running / Planned) */
  const statusById = STATUS ? Object.fromEntries(STATUS.values.map(v => [v.id, v])) : {};
  $("dyn-css").textContent = STATUS ? STATUS.values.map(v => {
    const rgb = rgbOf(v.color), line = v.dashed ? "dashed" : "solid";
    return `.node .st.st-${v.id}{color:${v.color};border:1px ${line} rgba(${rgb},.6)}` +
      `body.light .node .st.st-${v.id}{color:color-mix(in srgb, ${v.color} 62%, #000)}` +
      (v.dashed ? `body.status .node.st-${v.id}{border-style:dashed}` : "") +
      `.chip.st-${v.id}{color:${v.color};border:1px ${line} rgba(${rgb},.5);background:rgba(${rgb},.1)}` +
      `body.light .chip.st-${v.id}{color:color-mix(in srgb, ${v.color} 62%, #000)}` +
      `#legend .sw.st-${v.id}{border:1.5px ${line} ${v.color}}`;
  }).join("\n") : "";
  const statusMark = n => n.status && statusById[n.status] ? `<span class="st st-${n.status}">${statusById[n.status].label}</span>` : "";
  NODES.forEach(n => {
    const el = document.createElement("div");
    el.className = "node" + (n.size === "big" ? " big" : "") + (n.compact ? " compact" : "") + (zoneById[n.zone].outside ? " outside" : "");
    el.dataset.id = n.id;
    setStyle(el, { left: n.x, top: n.y, width: n.w, height: n.h, "--c": n.color, "--rgb": n.rgb, "--d": (0.15 + n.x / WORLD.w * 0.8 + n.y / WORLD.h * 0.5) + "s" });
    el.innerHTML = `<div class="ic">${icon(n.icon)}</div><div class="tx"><div class="t">${n.title}</div>${n.sub ? `<div class="s">${n.sub}</div>` : ""}</div>${n.badge ? `<span class="badge">${n.badge}</span>` : ""}${statusMark(n)}`;
    if (n.status) el.classList.add("st-" + n.status);
    on(el, "click", e => { e.stopPropagation(); if (editing()) { if (!host.dragged || !host.dragged()) host.onEdit({ kind: "node", id: n.id }); } else openNode(n.id); });
    on(el, "mouseenter", () => hoverNode(n.id, true));
    on(el, "mouseleave", () => hoverNode(n.id, false));
    world.appendChild(el);
    n.el = el;
  });

  const isZoneEnd = id => id.startsWith("zone:");
  const endRect = id => isZoneEnd(id) ? zoneById[id.slice(5)] : nodeById[id];
  // a zone endpoint counts as highlighted when any of its boxes is
  const endIn = (set, id) => isZoneEnd(id) ? NODES.some(n => n.zone === id.slice(5) && set.has(n.id)) : set.has(id);
  const zoneMembers = id => NODES.filter(n => n.zone === id.slice(5)).map(n => n.id);
  const endIs = (end, id) => end === id || (isZoneEnd(end) && nodeById[id] && nodeById[id].zone === end.slice(5));

  function edgeD(a, b) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const dx = bx - ax, dy = by - ay;
    const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
    if (gapX > 10 && Math.abs(dx) > Math.abs(dy) * 0.45) {
      const s = Math.sign(dx);
      const x1 = s > 0 ? a.x + a.w : a.x, x2 = s > 0 ? b.x : b.x + b.w;
      const k = Math.max(40, Math.abs(x2 - x1) * 0.5);
      return `M${x1},${ay} C${x1 + s * k},${ay} ${x2 - s * k},${by} ${x2},${by}`;
    }
    const s = Math.sign(dy) || 1;
    const y1 = s > 0 ? a.y + a.h : a.y, y2 = s > 0 ? b.y : b.y + b.h;
    const k = Math.max(30, Math.abs(y2 - y1) * 0.5);
    return `M${ax},${y1} C${ax},${y1 + s * k} ${bx},${y2 - s * k} ${bx},${y2}`;
  }

  EDGES.forEach(e => {
    const a = endRect(e.from), b = endRect(e.to);
    if (!a || !b) return;
    e.rgb = e.color ? rgbOf(e.color) : a.rgb;
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", edgeD(a, b));
    p.setAttribute("class", "edge" + (e.dashed ? " opt" : ""));
    p.style.setProperty("--rgb", e.rgb);
    gEdges.appendChild(p);
    e.el = p; e.len = p.getTotalLength(); e.pts = null;
    if (e.label && S.edges.labels !== "never") {
      const mid = p.getPointAtLength(e.len / 2);
      const t = document.createElementNS(SVGNS, "text");
      t.setAttribute("class", "elabel"); t.setAttribute("x", mid.x); t.setAttribute("y", mid.y + 4);
      t.textContent = e.label;
      gLabels.appendChild(t);
      e.lab = t;
    } else e.lab = null;
  });
  // a copy of the hovered box's connections is drawn above the boxes, so they stay visible
  const svgTop = document.createElementNS(SVGNS, "svg");
  svgTop.id = "edges-top"; svgTop.setAttribute("width", WORLD.w); svgTop.setAttribute("height", WORLD.h);
  world.appendChild(svgTop);
  function showOnTop(edges) {
    svgTop.replaceChildren();
    if (!S.edges.raiseOnHover) return;
    edges.forEach(e => { const p = e.el.cloneNode(); p.setAttribute("class", "edge on top" + (e.dashed ? " opt" : "")); svgTop.appendChild(p); });
    edges.forEach(e => { if (e.lab) { const t = e.lab.cloneNode(true); t.setAttribute("class", "elabel on"); svgTop.appendChild(t); } });
  }

  /* lens tabs */
  const lensBar = $("lenses");
  lensBar.replaceChildren();
  LENSES.forEach((l, i) => {
    const b = document.createElement("button");
    b.innerHTML = (i === 0 ? "" : `<span class="dot" style="background:${l.color};box-shadow:0 0 8px ${l.color}"></span>`) + l.title;
    b.onclick = () => { endTour(); setLens(l.id); };
    lensBar.appendChild(b);
    l.btn = b;
  });
  lensBar.style.display = LENSES.length < 2 ? "none" : "";

  /* legend: "collapsed" (a small pill that opens on click), "open", or false */
  const legendEl = $("legend");
  const bset = new Set(ZONES.map(z => z.boundary || "ours"));
  const swFor = { external: "dash", partner: "dash", customer: "dot", ours: "" };
  legendEl.innerHTML = [
    `<button class="lg-h" title="Show or hide the legend">${L10N.legend}</button>`,
    `<div class="row"><span class="sw"></span>${L10N.inside}</div>`,
    ...["customer", "partner", "external"].filter(b => bset.has(b)).map(b => `<div class="row"><span class="sw ${swFor[b]}"></span>${b === "external" ? L10N.outside : L10N.boundary[b]}</div>`),
    ...(STATUS ? STATUS.values.map(v => `<div class="row st-row"><span class="sw st-${v.id}"></span>${v.long || v.label}</div>`) : []),
    `<div class="hint">${L10N.hint}</div>`,
  ].join("");
  legendEl.style.display = S.legend === false ? "none" : "";
  if (!opts.restore || !opts.restore.legendOpen) legendEl.classList.toggle("collapsed", S.legend !== "open");
  else legendEl.classList.remove("collapsed");
  legendEl.querySelector(".lg-h").onclick = () => legendEl.classList.toggle("collapsed");

  /* =====================================================================
     CAMERA
     ===================================================================== */
  const cam = { x: 0, y: 0, s: 0.5 };
  let lastBox = null;
  function applyCam(animate) {
    world.style.transition = animate && !reduceMotion ? "transform 1.15s cubic-bezier(.65,.05,.25,1)" : "none";
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
  }
  function boxOf(ids, zoneIds) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const add = r => { x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h); };
    (ids || []).forEach(id => { const n = nodeById[id]; if (n) add(n); });
    (zoneIds || []).forEach(id => zoneById[id] && add(zoneById[id]));
    if (x1 === Infinity) return ALL_BOX;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  const phone = () => innerWidth <= 700;
  // the tour is a right-hand sidebar on landscape screens (position "auto"), always ("right") or never ("bottom")
  function sideTour() {
    if (phone()) return false;
    const p = S.tour.position;
    if (p === "bottom") return false;
    if (p === "right") return innerWidth >= 900;
    return innerWidth >= 1200 && innerWidth / innerHeight >= 1.5;
  }
  const tourEl = $("tour"), panel = $("panel");
  // the part of the screen not covered by the HUD, panel or tour card
  function freeArea() {
    const panelOpen = document.body.classList.contains("panel-open");
    const card = tourEl.classList.contains("open") && !tourEl.classList.contains("sheet");
    if (phone()) {
      const bottom = panelOpen ? panel.offsetHeight + 10 : card ? tourEl.offsetHeight + 10 : 64;
      return { x: 0, y: 60, w: innerWidth, h: innerHeight - 60 - bottom };
    }
    const side = card && sideTour();
    const panelW = editing() ? 452 : panelOpen ? 462 : 0;
    const tourW = side && !panelW ? 430 + 32 : 0, tourH = card && !side ? tourEl.offsetHeight + 30 : 0;
    const top = 76, bottom = Math.max(tourH, 20) + (editing() ? 56 : 0);
    return { x: 0, y: top, w: innerWidth - panelW - tourW, h: innerHeight - top - bottom };
  }
  function sizeTabs() {
    if (phone() || lensBar.style.display === "none") { lensBar.style.maxWidth = ""; return; }
    const b = brand.getBoundingClientRect(), a = $("actions").getBoundingClientRect();
    const room = 2 * Math.min(innerWidth / 2 - b.right, a.left - innerWidth / 2) - 24;
    lensBar.style.maxWidth = Math.max(240, room) + "px";
    lensBar.style.overflowX = lensBar.scrollWidth > lensBar.clientWidth + 1 ? "auto" : "";
  }
  const scaleFor = box => { const a = freeArea(), pad = phone() ? 12 : S.camera.padding; return Math.min((a.w - pad * 2) / box.w, (a.h - pad * 2) / box.h, S.camera.maxZoom); };
  function fit(box, animate = true, maxScale = S.camera.maxZoom) {
    lastBox = box;
    sizeTabs();
    document.body.classList.toggle("tour-side", sideTour());
    const a = freeArea(), pad = phone() ? 12 : S.camera.padding;
    const s = Math.max(0.05, Math.min((a.w - pad * 2) / box.w, (a.h - pad * 2) / box.h, maxScale));
    cam.s = s;
    cam.x = a.x + (a.w - box.w * s) / 2 - box.x * s;
    cam.y = a.y + (a.h - box.h * s) / 2 - box.y * s;
    applyCam(animate);
  }
  function zoomBy(f, cx = innerWidth / 2, cy = innerHeight / 2, animate = false) {
    const s2 = Math.min(3, Math.max(0.08, cam.s * f));
    cam.x = cx - (cx - cam.x) * (s2 / cam.s);
    cam.y = cy - (cy - cam.y) * (s2 / cam.s);
    cam.s = s2; lastBox = null;
    applyCam(animate);
  }

  /* pan, pinch & zoom */
  const pointers = new Map();
  let drag = null, pinch = null;
  on(viewport, "pointerdown", e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), s: cam.s, cx: cam.x, cy: cam.y, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2 };
      drag = null;
      return;
    }
    if (e.target.closest(".node, .zone-head")) return;
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    viewport.setPointerCapture(e.pointerId);
  });
  on(viewport, "pointermove", e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      const s2 = Math.min(3, Math.max(0.08, pinch.s * Math.hypot(p.x - q.x, p.y - q.y) / pinch.d));
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      cam.x = mx - (pinch.mx - pinch.cx) * (s2 / pinch.s); cam.y = my - (pinch.my - pinch.cy) * (s2 / pinch.s); cam.s = s2; lastBox = null;
      applyCam(false);
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true; viewport.classList.add("dragging");
    cam.x = drag.cx + dx; cam.y = drag.cy + dy; lastBox = null;
    applyCam(false);
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && !drag.moved && e.type === "pointerup") {
      if (editing()) host.onEdit({ kind: "canvas" });
      else if (state.panel) closePanel();
    }
    drag = null; viewport.classList.remove("dragging");
  };
  on(viewport, "pointerup", up);
  on(viewport, "pointercancel", up);
  on(viewport, "wheel", e => {
    e.preventDefault();
    const mouseLike = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40);
    if (e.ctrlKey || mouseLike) zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
    else { cam.x -= e.deltaX; cam.y -= e.deltaY; lastBox = null; applyCam(false); }
  }, { passive: false });
  $("zIn").onclick = () => zoomBy(1.25, undefined, undefined, true);
  $("zOut").onclick = () => zoomBy(0.8, undefined, undefined, true);
  $("zFit").onclick = () => fit(currentBox());
  on(window, "resize", () => fit(lastBox || currentBox(), false));

  /* =====================================================================
     FOCUS / HIGHLIGHT
     ===================================================================== */
  const state = { lens: LENSES[0].id, panel: null, tour: -1, focus: null, listItem: null };
  const MAIN_FLOW = S.edges.mainFlow;
  // in the overview, edges can be all faintly visible, only the main flow, or none (hover still reveals a box's edges)
  // persona connections only show when the persona is picked (or hovered)
  const hiddenInOverview = e => e.persona || S.edges.overview === "none" || (S.edges.overview === "main" && !(MAIN_FLOW && e.groups.includes(MAIN_FLOW)));

  function clearPath() { world.querySelectorAll(".node .pn").forEach(x => x.remove()); EDGES.forEach(e => e.el && e.el.classList.remove("path")); }
  function setFocus(nodeSet, edgeFilter, selected) {
    clearPath();
    state.focus = { nodeSet, labels: true };
    world.classList.toggle("dim", !!nodeSet);
    NODES.forEach(n => {
      n.el.classList.toggle("hl", !!nodeSet && nodeSet.has(n.id));
      n.el.classList.toggle("sel", n.id === selected);
    });
    ZONES.forEach(z => z.el.classList.toggle("hl", !!nodeSet && NODES.some(n => n.zone === z.id && nodeSet.has(n.id))));
    const active = [];
    const isOn = e => !!e.el && !!nodeSet && (edgeFilter ? edgeFilter(e) : endIn(nodeSet, e.from) && endIn(nodeSet, e.to));
    EDGES.forEach(e => {
      if (!e.el) return;
      const onE = isOn(e), main = !nodeSet && !!MAIN_FLOW && e.groups.includes(MAIN_FLOW);
      e.el.classList.toggle("on", onE);
      e.el.classList.toggle("off", (!!nodeSet && !onE) || (!nodeSet && hiddenInOverview(e)));
      e.el.classList.remove("dimmed");
      e.el.classList.toggle("mid", main);
      if (e.lab) e.lab.classList.toggle("on", onE && state.focus.labels);
      if (onE || main) active.push(e);
    });
    setParticles(active, !nodeSet);
    layoutLabels();
  }
  // a path (e.g. a persona's journey through the map): numbered boxes and the connections between consecutive steps
  const onPath = (e, path) => path.some((id, i) => i < path.length - 1 && ((endIs(e.from, id) && endIs(e.to, path[i + 1])) || (endIs(e.to, id) && endIs(e.from, path[i + 1]))));
  function showPath(path, rgb) {
    path.forEach((id, k) => {
      const n = nodeById[id];
      if (!n) return;
      const b = document.createElement("span");
      b.className = "pn"; b.textContent = k + 1;
      if (rgb) b.style.setProperty("--prgb", rgb);
      b.style.animationDelay = k * 0.07 + "s";
      n.el.appendChild(b);
    });
    EDGES.forEach(e => e.el && e.el.classList.contains("on") && onPath(e, path) && e.el.classList.add("path"));
  }
  // place each visible label along its connection where it overlaps no box and no other label
  const LABEL_SPOTS = [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78, 0.15, 0.85];
  function layoutLabels() {
    const boxes = [...NODES.map(n => ({ x: n.x - 6, y: n.y - 6, w: n.w + 12, h: n.h + 12 })), ...ZONES.map(z => ({ x: z.x, y: z.y, w: z.w, h: 44 }))];
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const placed = [];
    EDGES.filter(e => e.lab && e.lab.classList.contains("on")).sort((a, b) => a.len - b.len).forEach(e => {
      let best = null;
      for (const t of LABEL_SPOTS) {
        const pt = e.el.getPointAtLength(e.len * t);
        e.lab.setAttribute("x", pt.x); e.lab.setAttribute("y", pt.y + 4);
        const bb = e.lab.getBBox(), r = { x: bb.x - 4, y: bb.y - 3, w: bb.width + 8, h: bb.height + 6 };
        if (!best) best = { pt, r };
        if (!boxes.some(b => hit(r, b)) && !placed.some(p => hit(r, p))) { best = { pt, r }; break; }
      }
      e.lab.setAttribute("x", best.pt.x); e.lab.setAttribute("y", best.pt.y + 4);
      placed.push(best.r);
    });
  }
  const touches = (e, id) => [e.from, e.to].some(end => endIs(end, id));
  function hoverNode(id, onH) {
    if (editing()) return;
    if (state.focus && state.focus.nodeSet) {
      // in a highlighted view: trace the hovered box's connections and fade the rest
      if (!nodeById[id].el.classList.contains("hl")) return;
      EDGES.forEach(e => {
        if (!e.el || !e.el.classList.contains("on")) return;
        const mine = touches(e, id);
        e.el.classList.toggle("dimmed", onH && !mine);
        if (e.lab) e.lab.classList.toggle("on", onH ? mine : state.focus.labels);
      });
      const set = state.focus.nodeSet;
      showOnTop(onH ? EDGES.filter(e => e.el && e.el.classList.contains("on") && touches(e, id) && endIn(set, e.from) && endIn(set, e.to)) : []);
      return;
    }
    showOnTop(onH ? EDGES.filter(e => e.el && touches(e, id)) : []);
    EDGES.forEach(e => {
      if (!e.el || !touches(e, id)) return;
      e.el.classList.toggle("on", onH);
      if (hiddenInOverview(e)) e.el.classList.toggle("off", !onH);
      if (e.lab) e.lab.classList.toggle("on", onH);
    });
  }

  function setOf(def) {
    const s = new Set([...(def.nodes || []), ...(def.path || [])]);
    (def.zones || []).forEach(zid => NODES.forEach(n => { if (n.zone === zid) s.add(n.id); }));
    if (def.withInside) INSIDE.forEach(i => s.add(i));
    return s;
  }
  function boxFor(def) {
    if (!def || def.fit === "all" || !S.camera.zoomToFocus) return ALL_BOX;
    if (def.camZones) return boxOf([], def.camZones);
    return boxOf([...setOf(def)], def.zones);
  }
  function currentDef() { return state.tour >= 0 ? tourSteps[state.tour] : LENSES.find(x => x.id === state.lens); }
  function currentBox() { const d = currentDef(); return state.tour < 0 && d === LENSES[0] && !setOf(d).size ? ALL_BOX : boxFor(d); }
  // the kinds of connections the current tab or tour step is about; clicks and hovers inside it show only those
  function ctxGroups() { const d = currentDef(); return S.edges.filterByContext && d && d.edges && !d.edges.includes("none") ? d.edges : null; }
  const inCtx = (e, g = ctxGroups()) => !g || e.groups.some(x => g.includes(x));
  function restoreFocus() {
    const def = currentDef();
    const s = setOf(def);
    const filter = def.edges ? e => endIn(s, e.from) && endIn(s, e.to) && e.groups.some(g => def.edges.includes(g)) : undefined;
    s.size ? setFocus(s, filter) : setFocus(null);
  }
  function setLens(id, animate = true) {
    // an unknown tab id (e.g. from an old deep link) falls back to the overview
    state.lens = LENSES.some(l => l.id === id) ? id : LENSES[0].id;
    state.offscreenOk = null;
    LENSES.forEach(l => l.btn.classList.toggle("active", l.id === state.lens));
    closePanel(true);
    restoreFocus();
    if (currentDef().list) openList(currentDef().list);
    fit(currentBox(), animate);
  }

  /* =====================================================================
     PARTICLES (things moving along the connections)
     ===================================================================== */
  let particles = [];
  const particlesOff = reduceMotion || S.edges.particles === "off";
  const light = document.body.classList.contains("light");
  function pathPoints(e) {
    if (!e.pts) {
      const n = Math.max(24, Math.ceil(e.len / 6));
      e.pts = new Float32Array((n + 1) * 2);
      for (let i = 0; i <= n; i++) { const pt = e.el.getPointAtLength(i / n * e.len); e.pts[i * 2] = pt.x; e.pts[i * 2 + 1] = pt.y; }
    }
    return e.pts;
  }
  function setParticles(edges, overview) {
    gParticles.textContent = "";
    particles = [];
    if (particlesOff || editing() || (overview && S.edges.particles === "focus")) return;
    edges.forEach(e => {
      const count = overview ? 1 : e.len > 500 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const dot = document.createElementNS(SVGNS, "circle");
        dot.setAttribute("r", light ? 3 : 2.6); dot.setAttribute("fill", light ? `rgb(${e.rgb})` : "#fff");
        dot.setAttribute("stroke", light ? "#fff" : `rgb(${e.rgb})`); dot.setAttribute("stroke-width", light ? 2 : 7);
        dot.setAttribute("stroke-opacity", light ? 0.9 : 0.3); dot.setAttribute("paint-order", "stroke");
        gParticles.appendChild(dot);
        particles.push({ e, dot, pts: pathPoints(e), offset: i / count + Math.random() * 0.15, speed: 140 / Math.max(e.len, 120) });
      }
    });
    drawParticles(performance.now());
  }
  function drawParticles(t) {
    const sec = t / 1000;
    for (const p of particles) {
      const f = (sec * p.speed * 0.5 + p.offset) % 1;
      const u = f * (p.pts.length / 2 - 1), i = Math.floor(u) * 2, k = u % 1;
      p.dot.setAttribute("cx", (p.pts[i] + (p.pts[i + 2] - p.pts[i]) * k).toFixed(1));
      p.dot.setAttribute("cy", (p.pts[i + 1] + (p.pts[i + 3] - p.pts[i + 1]) * k).toFixed(1));
      p.dot.setAttribute("opacity", Math.min(1, f * 8, (1 - f) * 8).toFixed(2));
    }
  }
  /* animation loop: capped at 60 fps and paused when the page is hidden, behind the start screen or idle */
  const FRAME_MS = 1000 / 60, IDLE_MS = 90000;
  let rafId = 0, lastFrame = 0, idleTimer = 0, lastWake = 0;
  function tick(t) {
    rafId = requestAnimationFrame(tick);
    if (t - lastFrame < FRAME_MS - 2) return;
    lastFrame = t;
    drawParticles(t);
  }
  function runAnim(onA) {
    onA = onA && !particlesOff && !document.hidden && hero.classList.contains("gone");
    if (onA && !rafId) rafId = requestAnimationFrame(tick);
    if (!onA && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }
  function wake() {
    const now = performance.now();
    if (rafId && now - lastWake < 1000) return;
    lastWake = now;
    runAnim(true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => runAnim(false), IDLE_MS);
  }
  ["pointermove", "pointerdown", "wheel", "keydown", "touchstart"].forEach(ev => on(window, ev, wake, { passive: true }));
  on(document, "visibilitychange", () => document.hidden ? runAnim(false) : wake());

  /* =====================================================================
     SIDE PANEL
     ===================================================================== */
  panel.className = "glass"; panel.replaceChildren();
  function openPanel(html, color, rgb) {
    panel.style.setProperty("--c", color); panel.style.setProperty("--rgb", rgb);
    panel.innerHTML = html;
    panel.querySelector(".p-close").onclick = () => closePanel();
    panel.querySelectorAll("[data-node]").forEach(b => b.onclick = () => openNode(b.dataset.node));
    panel.querySelectorAll("[data-zone]").forEach(b => b.onclick = () => openZone(b.dataset.zone));
    panel.querySelector(".p-body").scrollTop = 0;
    panel.classList.add("open");
    document.body.classList.add("panel-open");
  }
  function closePanel(silent) {
    if (!state.panel) return;
    const wasList = state.panel.startsWith("list:");
    state.panel = null; state.listItem = null;
    panel.classList.remove("open");
    document.body.classList.remove("panel-open");
    if (!silent) {
      restoreFocus();
      // closing a box's panel inside a list view returns to the list
      if (!wasList && currentDef().list && !(state.tour >= 0 && sideTour())) openList(currentDef().list);
      fit(currentBox());
    }
  }
  const tTitle = id => nodeById[id] ? BDCore.stripTags(nodeById[id].title) : id;
  // a clickable list, shown in the side panel, or in the tour card when the tour is itself a side panel
  const listHtml = id => {
    const Li = listById(id);
    return `<div class="stages">${Li.items.map((s, i) => `<button class="stage" data-item="${i}" style="--c:${s.color || Li.color};--rgb:${rgbOf(s.color || Li.color)}"><span class="num">${s.icon && !s.tag ? icon(s.icon) : s.tag || i + 1}</span><span>
      <b>${s.title}</b>${s.sub ? `<em>${s.sub}</em>` : ""}${s.text ? `<span class="sd">${s.text}</span>` : ""}
      ${s.path ? `<span class="path">${s.path.map((p, k) => `<i><b>${k + 1}</b>${esc(tTitle(p))}</i>`).join("")}</span>` : ""}</span></button>`).join("")}</div>
    <button class="btn stAll">${L10N.showAll}</button>`;
  };
  function selectItem(root, id, i) {
    const Li = listById(id), it = Li.items[i];
    if (!it) return;
    root.querySelectorAll(".stage").forEach((x, k) => x.classList.toggle("active", k === i));
    const btn = root.querySelectorAll(".stage")[i];
    if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    state.listItem = { list: id, i };
    const path = it.path || null;
    // a persona that is also a box on the map: its path starts at that box
    const ePath = path && it.personaNode ? [it.personaNode, ...path] : path;
    const set = new Set([...(it.withInside ? INSIDE : []), ...(it.nodes || []), ...(path || []), ...(it.personaNode ? [it.personaNode] : [])]);
    const g = it.edges || Li.edges;
    const filt = e => endIn(set, e.from) && endIn(set, e.to) && ((ePath && onPath(e, ePath)) || (g ? inCtx(e, g) : !path));
    setFocus(set, filt, it.personaNode);
    if (path) showPath(path, rgbOf(it.color || Li.color));
    // a persona box far away from its path would zoom the map out too far: then frame the path only
    let fb = boxOf([...set]);
    state.offscreenOk = null;
    if (it.personaNode && path && scaleFor(fb) < 0.5) { fb = boxOf([...set].filter(x => x !== it.personaNode)); state.offscreenOk = it.personaNode; }
    fit(fb);
  }
  function wireList(root, id) {
    root.querySelectorAll("[data-item]").forEach(b => b.onclick = () => selectItem(root, id, +b.dataset.item));
    root.querySelector(".stAll").onclick = () => { root.querySelectorAll(".stage").forEach(x => x.classList.remove("active")); state.listItem = null; restoreFocus(); fit(currentBox()); };
  }
  function openList(id) {
    const Li = listById(id);
    state.panel = "list:" + id;
    openPanel(`
      <div class="p-head">
        <button class="p-close" title="Close (Esc)">×</button>
        <div class="p-top"><div class="p-ic">${icon(Li.icon || "list")}</div>
          <div><div class="p-zone">${Li.eyebrow || ""}</div><h2>${Li.title}</h2><div class="p-sub">${Li.sub || ""}</div></div></div>
      </div>
      <div class="p-body">
        ${Li.intro ? `<h4>${L10N.overview}</h4><p>${Li.intro}</p>` : ""}
        <h4>${L10N.clickOne}</h4>
        ${listHtml(id)}
      </div>`, Li.color, rgbOf(Li.color));
    wireList(panel, id);
  }
  function linkBtn(n, label) {
    return `<button class="link" data-node="${n.id}" style="--c:${n.color};--rgb:${n.rgb}"><span class="ic">${icon(n.icon)}</span><span class="lt">${n.title}</span>${label ? `<span class="ll">${esc(label)}</span>` : ""}</button>`;
  }
  // A source URL is shown short and clickable: a file in a GitHub/GitLab/Bitbucket repo as its path in the repo
  // (src/frontend/main.go#L80-L120), any other page as host/…/last-part. Local paths stay plain text.
  function shortSource(s) {
    let u;
    try { u = new URL(s); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./, ""), parts = u.pathname.split("/").filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    const line = /^#L\d/.test(u.hash) ? u.hash : "";
    let m = null;
    if (/(^|\.)github\.com$/.test(host) && /^(blob|tree|raw)$/.test(parts[2])) m = parts.slice(4);
    else if (/(^|\.)gitlab\./.test(host) && parts.indexOf("-") > 1 && /^(blob|tree|raw)$/.test(parts[parts.indexOf("-") + 1])) m = parts.slice(parts.indexOf("-") + 3);
    else if (/(^|\.)bitbucket\.org$/.test(host) && parts[2] === "src") m = parts.slice(4);
    if (m) return (m.length ? m.join("/") : parts.slice(0, 2).join("/")) + line;
    if (!parts.length) return host;
    return host + "/" + (parts.length > 2 ? "…/" + parts[parts.length - 1] : parts.join("/"));
  }
  const sourceHtml = s => {
    const short = shortSource(String(s));
    return short ? `<a href="${esc(s)}" target="_blank" rel="noopener noreferrer" title="${esc(s)}"><code>${esc(short)}</code></a>` : `<code>${esc(s)}</code>`;
  };
  const sourcesHtml = src => S.panel.showSources && src && src.length
    ? `<h4>${L10N.sources}</h4><div class="src">${src.map(sourceHtml).join(" ")}</div>` : "";
  function openNode(id) {
    const n = nodeById[id], z = zoneById[n.zone];
    // a persona's box opens the Personas panel with that persona picked
    const pi = n.persona && LISTS.personas ? LISTS.personas.items.findIndex(x => x.personaNode === id) : -1;
    if (pi >= 0) {
      if (state.tour >= 0 && sideTour()) { endTour(); LENSES.forEach(l => l.btn.classList.toggle("active", l.list === "personas")); }
      const lens = LENSES.find(l => l.list === "personas");
      if (lens && state.lens !== lens.id && state.tour < 0) { state.lens = lens.id; LENSES.forEach(l => l.btn.classList.toggle("active", l.id === lens.id)); }
      openList("personas");
      selectItem(panel, "personas", pi);
      return;
    }
    state.panel = id;
    const rel = EDGES.filter(e => e.el && (e.from === id || e.to === id || touches(e, id)));
    const ctxRel = rel.filter(e => inCtx(e));
    const shown = ctxRel.length ? ctxRel : rel;
    const neigh = new Set([id]);
    shown.forEach(e => [e.from, e.to].forEach(end => isZoneEnd(end) ? (end.slice(5) !== n.zone ? zoneMembers(end).forEach(m => neigh.add(m)) : null) : neigh.add(end)));
    setFocus(neigh, e => shown.includes(e), id);
    const st = n.status && statusById[n.status];
    const stChip = st && document.body.classList.contains("status") ? `<span class="chip st-${n.status}">${st.long || st.label}</span>` : "";
    const chips = [stChip, `<span class="chip kind">${n.kind}</span>`, n.badge ? `<span class="chip">${n.badge}</span>` : ""].join("");
    const links = rel.map(e => {
      const fromMe = endIs(e.from, id);
      const otherId = fromMe ? e.to : e.from;
      const other = isZoneEnd(otherId) ? null : nodeById[otherId];
      return other ? linkBtn(other, e.label ? (fromMe ? "→ " : "← ") + e.label : "") : "";
    }).join("");
    const tech = S.panel.tech;
    const parts = {
      what: n.what ? `<h4>${L10N.what}</h4><p>${n.what}</p>` : "",
      why: n.why.length ? `<h4>${L10N.why}</h4><ul>${n.why.map(w => `<li>${w}</li>`).join("")}</ul>` : "",
      pick: n.pick && tech !== "off" ? `<h4>${L10N.pick}</h4><div class="note rec"><span>🧭</span><span>${n.pick}</span></div>` : "",
      alt: n.alt && tech === "full" ? `<h4>${L10N.alt}</h4><div class="note"><span>🔁</span><span>${n.alt}</span></div>` : "",
      links: links ? `<h4>${L10N.links}</h4><div class="links">${links}</div>` : "",
      sources: sourcesHtml(n.sources),
    };
    const custom = (n.extra || []).map(x => `<h4>${x.title}</h4>${Array.isArray(x.text) ? `<ul>${x.text.map(w => `<li>${w}</li>`).join("")}</ul>` : `<p>${x.text}</p>`}`).join("");
    openPanel(`
      <div class="p-head">
        <button class="p-close" title="Close (Esc)">×</button>
        <div class="p-top"><div class="p-ic">${icon(n.icon)}</div>
          <div><div class="p-zone">${z.title}</div><h2>${n.title}</h2><div class="p-sub">${n.sub || ""}</div></div></div>
        <div class="chips">${chips}</div>
      </div>
      <div class="p-body">
        ${S.panel.sections.map(k => parts[k] || "").join("")}
        ${custom}
        <h4>${L10N.partOf}</h4><div class="links"><button class="link" data-zone="${z.id}" style="--c:${z.color};--rgb:${z.rgb}"><span class="ic">${icon("layers")}</span><span class="lt">${z.title}</span></button></div>
      </div>`, n.color, n.rgb);
    fit(boxOf([...neigh]), true, S.camera.nodeZoom);
  }
  function openZone(zid) {
    const z = zoneById[zid];
    state.panel = "zone:" + zid;
    const members = NODES.filter(n => n.zone === zid);
    const set = new Set(members.map(n => n.id));
    setFocus(set, e => endIn(set, e.from) && endIn(set, e.to) && inCtx(e));
    const b = z.boundary || "ours";
    openPanel(`
      <div class="p-head">
        <button class="p-close" title="Close (Esc)">×</button>
        <div class="p-top"><div class="p-ic">${icon(z.icon || "layers")}</div>
          <div><div class="p-zone">${b === "ours" ? L10N.area : z.outside && b === "external" ? L10N.outside : L10N.boundary[b]}</div><h2>${z.title}</h2><div class="p-sub">${z.sub || ""}</div></div></div>
        ${z.tag ? `<div class="chips"><span class="chip kind">${z.tag}</span></div>` : ""}
      </div>
      <div class="p-body">
        ${z.desc ? `<h4>${L10N.overview}</h4><p>${z.desc}</p>` : ""}
        ${z.points ? `<h4>${L10N.points}</h4><ul>${z.points.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}
        ${members.length ? `<h4>${L10N.components}</h4><div class="links">${members.map(n => linkBtn(n, n.badge || "")).join("")}</div>` : ""}
        ${sourcesHtml(z.sources)}
      </div>`, z.color, z.rgb);
    fit(boxOf([], [zid]), true, S.camera.zoneZoom);
  }

  /* =====================================================================
     ROADMAP & OVERLAY BLOCKS
     ===================================================================== */
  const RM_PHASES = ROADMAP ? ROADMAP.phases.map(p => p.when) : [];
  const rmTrack = cur => `<div class="rm-track">${RM_PHASES.map((p, i) => `<span class="${i < cur ? "done" : i === cur ? "cur" : ""}">${p}</span>`).join("")}</div>`;
  // one tour step per roadmap phase, highlighting its boxes; hover an item to show only its boxes
  const RM_STEPS = ROADMAP ? ROADMAP.phases.map((p, k) => ({
    title: `${p.when} · ${p.title}`, text: p.text || "", nodes: [...new Set(p.items.flatMap(it => it.nodes || []))],
    edges: ["none"], rmPhase: k, rmItems: p.items,
  })) : [];
  const rmCols = () => `<div class="rm-cols" style="--cols:${Math.min(4, RM_PHASES.length)}">${ROADMAP.phases.map(p => `
    <div class="rm-col ${p.main ? "main" : ""}"><h4>${p.when}</h4><h3>${p.title}</h3>
      ${p.items.map(it => `<div class="rm-item"><b>${it.title}</b>${it.text || ""}${it.note ? `<br><span class="dep">${it.note}</span>` : ""}</div>`).join("")}
    </div>`).join("")}</div>`;

  function blocksHtml(blocks) {
    return (blocks || []).map(b => {
      const h = b.title ? `<h4 class="blk-h">${b.title}</h4>` : "";
      switch (b.type) {
        case "cards": return h + `<div class="tiers" style="--cols:${b.columns || Math.min(3, b.cards.length)}">${b.cards.map(c => `
          <div class="tier ${c.main ? "main" : ""}">${c.tag ? `<em>${c.tag}</em>` : ""}<h4>${c.title}</h4>
            ${c.text ? `<div class="scope">${c.text}</div>` : ""}
            ${(c.rows || []).map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("")}
          </div>`).join("")}</div>`;
        case "note": return `<div class="ov-note"><span>${b.icon || "🧭"}</span><span>${b.title ? `<b>${b.title}:</b> ` : ""}${b.text}</span></div>`;
        case "grid": return h + `<div class="crit" style="--cols:${b.columns || 3}">${b.items.map(([t, s]) => `<div><b>${t}</b>${s}</div>`).join("")}</div>`;
        case "text": return h + `<p class="blk-p">${b.text}</p>`;
        case "roadmap": return ROADMAP ? h + rmCols() : "";
        default: return "";
      }
    }).join("");
  }
  const overlayById = Object.fromEntries(OVERLAYS.map(o => [o.id, o]));
  if (ROADMAP && !overlayById.roadmap) {
    overlayById.roadmap = { id: "roadmap", title: ROADMAP.title, eyebrow: META.title, lead: ROADMAP.lead, blocks: [{ type: "roadmap" }, ...(ROADMAP.notes || []).map(t => ({ type: "note", ...t }))] };
  }

  /* =====================================================================
     GUIDED TOUR
     ===================================================================== */
  const TOUR = (SPEC.tour || []).flatMap(st => st.roadmap ? RM_STEPS : [st]);
  let tourSteps = TOUR;
  tourEl.className = "glass"; tourEl.replaceChildren();
  function startTour(steps = TOUR) {
    if (!steps.length) return;
    tourSteps = steps;
    closeOverlay();
    hideHero();
    LENSES.forEach(l => l.btn.classList.remove("active"));
    goStep(0);
  }
  function goStep(i, animate = true) {
    if (i < 0 || i >= tourSteps.length) return;
    closePanel(true);
    state.tour = i;
    const st = tourSteps[i];
    document.body.classList.toggle("tour-side", sideTour());
    const ov = st.overlay && overlayById[st.overlay];
    // as a side panel itself, the tour shows the list inside instead of opening a second panel
    const listInCard = st.list && sideTour();
    tourEl.innerHTML = `
      <div class="t-top"><span class="t-step">${String(i + 1).padStart(2, "0")} / ${String(tourSteps.length).padStart(2, "0")}</span>
        <div class="t-bar"><i style="width:${(i + 1) / tourSteps.length * 100}%"></i></div>
        <button class="t-x" title="End tour (Esc)">×</button></div>
      <div class="t-anim">
        ${st.rmPhase !== undefined ? rmTrack(st.rmPhase) : ""}
        <h3>${st.title}</h3>
        ${st.text ? `<p>${st.text}</p>` : ""}
        ${st.summary ? `<div class="t-sum">${st.summary.map(([b, s]) => `<div><b>${b}</b>${s}</div>`).join("")}</div>` : ""}
        ${ov ? blocksHtml(st.blocks ? st.blocks.map(k => ov.blocks[k]).filter(Boolean) : ov.blocks.filter(b => b.tour !== false)) : ""}
        ${listInCard ? `<h4 class="t-h">${L10N.clickOne}</h4>${listHtml(st.list)}` : ""}
        ${st.rmItems ? `<div class="rm-list">${st.rmItems.map(it => `<div data-nodes="${(it.nodes || []).join(" ")}"><b>${it.title}</b>${it.text || ""}${it.note ? ` <span class="dep">${it.note}</span>` : ""}</div>`).join("")}</div>` : ""}
      </div>
      <div class="t-nav">
        <button class="btn" id="tPrev" ${i === 0 ? "disabled style='opacity:.4'" : ""}>${L10N.back}</button>
        <span class="sp">${L10N.tourHint}</span>
        ${st.rmPhase !== undefined ? `<button class="btn" id="tRm">${L10N.fullRoadmap}</button>` : ""}
        <button class="btn primary" id="tNext">${i === tourSteps.length - 1 ? L10N.finish : L10N.next}</button>
      </div>`;
    tourEl.querySelector(".t-x").onclick = () => { endTour(); setLens(LENSES[0].id); };
    if (st.rmPhase !== undefined) tourEl.querySelector("#tRm").onclick = () => openOverlay("roadmap");
    tourEl.querySelector("#tPrev").onclick = () => goStep(i - 1);
    tourEl.querySelector("#tNext").onclick = () => i === tourSteps.length - 1 ? (endTour(), setLens(LENSES[0].id)) : goStep(i + 1);
    tourEl.classList.toggle("sheet", !!ov);
    document.body.classList.toggle("sheet-open", !!ov);
    tourEl.querySelectorAll(".rm-list [data-nodes]").forEach(el => {
      const ids = el.dataset.nodes.split(" ").filter(Boolean);
      // only this item's boxes stay lit while hovering it; leaving restores the whole phase
      el.onmouseenter = () => ids.length && setFocus(new Set(ids));
      el.onmouseleave = () => restoreFocus();
    });
    tourEl.classList.add("open");
    document.body.classList.add("touring");
    restoreFocus();
    if (listInCard) wireList(tourEl, st.list);
    else if (st.list) openList(st.list);
    closeOverlay();
    if (animate) requestAnimationFrame(() => fit(boxFor(st)));
    else fit(boxFor(st), false);
  }
  function endTour() {
    closeOverlay();
    document.body.classList.remove("sheet-open");
    if (state.tour < 0) return;
    state.tour = -1;
    tourEl.classList.remove("open");
    document.body.classList.remove("touring");
  }

  /* =====================================================================
     HERO, OVERLAYS, ACTIONS, KEYS, START
     ===================================================================== */
  const hero = $("hero");
  const H = SPEC.hero || {};
  hero.className = ""; hero.style.transition = "";
  hero.innerHTML = `<div class="hero-card">
    ${H.eyebrow ? `<span class="eyebrow">${H.eyebrow}</span>` : ""}
    <h1>${H.title || META.title}</h1>
    ${H.lead ? `<p class="lead">${H.lead}</p>` : ""}
    ${H.pillars && H.pillars.length ? `<div class="pillars" style="--cols:${Math.min(4, H.pillars.length)}">${H.pillars.map(p => `<div class="pillar glass" style="--c:${p.color};--rgb:${rgbOf(p.color)}"><div class="ic">${icon(p.icon)}</div><b>${p.title}</b><span>${p.text}</span></div>`).join("")}</div>` : ""}
    <div class="hero-btns">
      ${TOUR.length ? `<button class="btn primary" id="heroTour">${PLAY}${L10N.startTour}</button>` : ""}
      <button class="btn" id="heroExplore">${L10N.explore}</button>
    </div>
    ${H.footnote ? `<div class="hero-foot">${H.footnote}</div>` : ""}
    ${SPEC.settings.credit !== false ? `<div class="hero-credit"><a href="${BDK_SITE}" target="_blank" rel="noopener">${bdkCredit()}</a></div>` : ""}
  </div>`;
  function hideHero() { hero.classList.add("gone"); lastWake = 0; wake(); }
  runAnim(false);
  hero.querySelector("#heroTour")?.addEventListener("click", () => startTour(), sig);
  hero.querySelector("#heroExplore").onclick = () => { hideHero(); setLens(LENSES[0].id); };

  const ovEl = $("ov"), ovWrap = ovEl.querySelector(".ov-wrap");
  ovEl.className = ""; ovWrap.replaceChildren();
  let ovOpen = null;
  function openOverlay(id) {
    const o = overlayById[id];
    if (!o) return;
    hideHero();
    ovOpen = id;
    ovWrap.innerHTML = `
      <button class="p-close" title="Close (Esc)">×</button>
      ${o.eyebrow ? `<span class="eyebrow">${o.eyebrow}</span>` : ""}
      <h1>${o.title}</h1>
      ${o.lead ? `<p class="lead">${o.lead}</p>` : ""}
      ${blocksHtml(o.blocks)}`;
    ovWrap.querySelector(".p-close").onclick = closeOverlay;
    ovEl.classList.add("open");
    ovEl.scrollTop = 0;
  }
  function closeOverlay() { ovOpen = null; ovEl.classList.remove("open"); }

  /* top-right actions: status toggle, overlay buttons, roadmap, tour (+ whatever the host adds: more menu) */
  const actions = $("actions");
  actions.replaceChildren();
  const addBtn = (html, cls, title, fn) => { const b = document.createElement("button"); b.className = "btn " + cls; b.title = title || ""; b.innerHTML = html; b.onclick = fn; actions.appendChild(b); return b; };
  let btnStatus = null;
  if (STATUS) btnStatus = addBtn(`${icon("circle-check")}<span class="lbl">${STATUS.toggleLabel}</span>`, "collapse-2", STATUS.toggleTitle || "", () => setStatus(!document.body.classList.contains("status")));
  OVERLAYS.filter(o => o.button !== false).forEach(o => addBtn(`${icon(o.icon || "file")}<span class="lbl">${o.buttonLabel || o.title}</span>`, "collapse-1", o.title, () => openOverlay(o.id)));
  if (ROADMAP && ROADMAP.button !== false) addBtn(`${icon("map")}<span class="lbl">${ROADMAP.buttonLabel || ROADMAP.title}</span>`, "collapse-1", ROADMAP.title,
    () => ROADMAP.buttonOpens === "overlay" ? openOverlay("roadmap") : startTour(RM_STEPS));
  if (TOUR.length) addBtn(`${PLAY}<span class="lbl">${L10N.tour}</span>`, "primary", L10N.tour, () => startTour());
  if (host.actions) host.actions(addBtn, icon);
  function setStatus(onS) { document.body.classList.toggle("status", onS); btnStatus && btnStatus.classList.toggle("on", onS); }
  if (STATUS) setStatus(STATUS.default !== false);
  // re-open a box's panel so the status chip follows the toggle
  if (btnStatus) btnStatus.addEventListener("click", () => { if (state.panel && nodeById[state.panel]) openNode(state.panel); }, sig);

  if (S.keyboard !== false) on(window, "keydown", e => {
    if (e.defaultPrevented || e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (ovOpen) { if (e.key === "Escape") closeOverlay(); return; }
    if (!hero.classList.contains("gone")) {
      if ((e.key === "Enter" || e.key === "ArrowRight") && TOUR.length) startTour();
      if (e.key === "Escape") { hideHero(); setLens(LENSES[0].id); }
      return;
    }
    if (e.key === "Escape") { if (state.panel) closePanel(); else if (state.tour >= 0) { endTour(); setLens(LENSES[0].id); } }
    else if (state.tour >= 0 && (e.key === "ArrowRight" || e.key === " ")) { e.preventDefault(); goStep(state.tour + 1); }
    else if (state.tour >= 0 && e.key === "ArrowLeft") goStep(state.tour - 1);
    else if (e.key === "f" || e.key === "F") fit(currentBox());
    else if (e.key === "+" || e.key === "=") zoomBy(1.25, undefined, undefined, true);
    else if (e.key === "-") zoomBy(0.8, undefined, undefined, true);
  });

  /* =====================================================================
     CHECK MODE (#check): what a reviewer would otherwise have to spot by eye.
     Result: window.__diagramCheck (array of issues) and a "[diagram-check]" console line.
     Re-run after clicks with window.__diagramCheckRun(). window.__diagramReady is true once the camera has settled.
     ===================================================================== */
  function runCheck() {
    document.body.classList.add("check");
    document.querySelectorAll(".overflow").forEach(el => el.classList.remove("overflow"));
    const issues = [];
    const add = (where, problem) => issues.push({ ...where, problem });
    // text width measured with a Range (sub-pixel), compared with the element's own width at the same camera scale
    const textW = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    NODES.forEach(n => {
      const t = n.el.querySelector(".t"), s = n.el.querySelector(".s"), tx = n.el.querySelector(".tx");
      let bad = false;
      if (textW(t) > t.getBoundingClientRect().width + 0.5 || tx.offsetLeft + tx.offsetWidth > n.el.clientWidth - 6) { add({ node: n.id }, "title too wide"); bad = true; }
      if (s && n.size !== "big" && textW(s) > s.getBoundingClientRect().width + 0.5) { add({ node: n.id }, "subtitle cut off"); bad = true; }
      if (tx.scrollHeight > n.el.clientHeight) { add({ node: n.id }, "text taller than box"); bad = true; }
      if (bad) n.el.classList.add("overflow");
    });
    ZONES.forEach(z => {
      const head = z.el.querySelector(".zone-head");
      if (head.scrollWidth > head.clientWidth + 1) { z.el.classList.add("overflow"); add({ zone: z.id }, "zone header too wide"); }
    });
    // visible edge labels sitting on a box, a zone header or another label
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const labs = EDGES.filter(e => e.lab && e.lab.classList.contains("on")).map(e => { const bb = e.lab.getBBox(); return { e, r: { x: bb.x, y: bb.y, w: bb.width, h: bb.height } }; });
    labs.forEach(({ e, r }) => {
      const onBox = NODES.find(n => hit(r, n)), head = ZONES.find(z => hit(r, { x: z.x, y: z.y, w: z.w, h: 40 }));
      if (onBox) add({ edge: `${e.from} → ${e.to}` }, `label "${e.label}" overlaps box ${onBox.id}`);
      else if (head) add({ edge: `${e.from} → ${e.to}` }, `label "${e.label}" overlaps the header of zone ${head.id}`);
    });
    labs.forEach((a, i) => labs.slice(i + 1).forEach(b => { if (hit(a.r, b.r)) add({ edge: `${a.e.from} → ${a.e.to}` }, `label "${a.e.label}" overlaps label "${b.e.label}" (${b.e.from} → ${b.e.to})`); }));
    // highlighted boxes covered by the HUD or outside the screen (not on full-screen sheets, where the map is meant to be hidden)
    const hud = [["brand", "#brand"], ["tabs", "#lenses"], ["buttons", "#actions"], ["legend", "#legend"], ["zoom buttons", "#zoom"], ["tour card", "#tour.open"], ["side panel", "#panel.open"]]
      .map(([name, sel]) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); if (cs.display === "none" || +cs.opacity < 0.1 || cs.visibility === "hidden") return null; return { name, r: el.getBoundingClientRect() }; })
      .filter(Boolean);
    const focusSet = state.focus && state.focus.nodeSet;
    const sheet = tourEl.classList.contains("open") && tourEl.classList.contains("sheet");
    if (!sheet && !ovOpen) NODES.filter(n => !focusSet || focusSet.has(n.id)).forEach(n => {
      const r = n.el.getBoundingClientRect();
      if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) { if (focusSet && n.id !== state.offscreenOk) add({ node: n.id }, "highlighted but off screen"); return; }
      const box = { x: r.left, y: r.top, w: r.width, h: r.height };
      hud.forEach(h => { if (hit(box, { x: h.r.left, y: h.r.top, w: h.r.width, h: h.r.height })) add({ node: n.id }, `covered by the ${h.name}`); });
    });
    if (lensBar.style.display !== "none" && lensBar.scrollWidth > lensBar.clientWidth + 1) add({ view: "tab bar" }, "the tabs don't fit: some can only be reached by scrolling the tab bar; use fewer or shorter tab titles");
    if (tourEl.classList.contains("open") && tourEl.scrollHeight > tourEl.clientHeight + 2 && sheet) add({ view: "tour sheet" }, "taller than the window (scrolls)");
    const tAnim = tourEl.querySelector(".t-anim");
    if (tourEl.classList.contains("open") && tAnim && tAnim.scrollHeight > tAnim.clientHeight + 2) add({ view: "tour card" }, "text scrolls inside the tour card");
    if (ovOpen && ovWrap.offsetHeight > innerHeight) add({ view: "overlay " + ovOpen }, "taller than the window (scrolls)");
    if (focusSet && cam.s < (phone() ? 0.28 : 0.45)) add({ view: state.tour >= 0 ? "tour step " + (state.tour + 1) : "tab " + state.lens }, `zoomed out to ${cam.s.toFixed(2)}: highlight is too spread out for readable text`);
    window.__diagramCheck = issues;
    console.log("[diagram-check]", JSON.stringify(issues));
    return issues;
  }

  /* deep links: #lens=<id>, #tour=<step 1..n>, #overlay=<id>, #node=<id>, #zone=<id>, #list=<id>&item=<n>, #status=on|off, #check */
  const SETTLE_MS = reduceMotion ? 50 : 1300;
  let checkTimer = 0;
  function settle(check) {
    window.__diagramReady = false;
    clearTimeout(checkTimer);
    checkTimer = later(() => { window.__diagramReady = true; if (check) runCheck(); }, SETTLE_MS);
  }
  function applyHash(hash) {
    const h = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    h.delete("d");
    if (![...h.keys()].length) return false;
    hero.style.transition = "none";
    hero.classList.add("gone");
    document.body.classList.remove("intro");
    closePanel(true); closeOverlay();
    if (h.has("tour")) { tourSteps = TOUR; LENSES.forEach(l => l.btn.classList.remove("active")); goStep(Math.max(0, Math.min(TOUR.length, +h.get("tour")) - 1)); }
    else { endTour(); setLens(h.get("lens") || LENSES[0].id, false); }
    if (h.has("node") && nodeById[h.get("node")]) openNode(h.get("node"));
    if (h.has("zone") && zoneById[h.get("zone")]) openZone(h.get("zone"));
    if (h.has("list") && LISTS[h.get("list")]) { openList(h.get("list")); if (h.has("item")) selectItem(panel, h.get("list"), +h.get("item") - 1); }
    if (h.has("overlay")) openOverlay(h.get("overlay"));
    if (h.has("status")) setStatus(h.get("status") !== "off");
    settle(h.has("check"));
    wake();
    return true;
  }

  /* =====================================================================
     PDF DECK: a cover, the overview, every tour step (or every tab) and every sheet, one landscape page each
     ===================================================================== */
  function printDeck(opts = {}) {
    const keep = snapshot();
    const out = $("print");
    out.replaceChildren();
    document.body.classList.toggle("print-bw", !!opts.bw);
    const PW = 1123, PH = 792, M = 44;
    const page = cls => { const p = document.createElement("div"); p.className = "pg " + (cls || ""); out.appendChild(p); return p; };
    const credit = SPEC.settings.credit !== false ? `<span class="pg-credit">${bdkCredit()}</span>` : "";
    const foot = (p, txt) => p.insertAdjacentHTML("beforeend", `<div class="pg-foot">${BDCore.stripTags(META.title)}${txt ? " · " + txt : ""}${credit}</div>`);
    const mapInto = (p, box, area) => {
      const c = world.cloneNode(true);
      c.removeAttribute("id");
      c.querySelectorAll(".particles").forEach(g => g.replaceChildren());
      c.querySelectorAll(".grid, #edges-top").forEach(x => x.remove());
      c.querySelectorAll(".pn").forEach(x => (x.style.animation = "none"));
      const s = Math.min((area.w - 20) / box.w, (area.h - 20) / box.h, 1.1);
      c.style.transition = "none";
      c.style.transform = `translate(${(area.w - box.w * s) / 2 - box.x * s}px, ${(area.h - box.h * s) / 2 - box.y * s}px) scale(${s})`;
      const holder = document.createElement("div");
      holder.className = "pg-map";
      setStyle(holder, { left: area.x, top: area.y, width: area.w, height: area.h });
      holder.appendChild(c);
      p.appendChild(holder);
    };
    if (SPEC.hero) {
      const p = page("pg-cover");
      p.innerHTML = hero.innerHTML;
      p.querySelector(".hero-btns")?.remove();
    }
    endTour(); setLens(LENSES[0].id, false);
    const pO = page();
    mapInto(pO, ALL_BOX, { x: M, y: M, w: PW - 2 * M, h: PH - 2 * M - 10 });
    foot(pO, L10N.overview);
    const side = (p, eyebrow, title, html) => p.insertAdjacentHTML("beforeend", `<div class="pg-side"><span class="t-step">${eyebrow}</span><h2>${title}</h2>${html}</div>`);
    // the map on the left, the step's text in a column on the right (84 mm + margins)
    const mapArea = { x: M - 14, y: M - 14, w: PW - 360 - M - 6, h: PH - 2 * M + 10 };
    if (TOUR.length) {
      tourSteps = TOUR;
      TOUR.forEach((st, i) => {
        if (st.overlay) {
          const o = overlayById[st.overlay];
          const p = page("pg-ov");
          p.innerHTML = `<span class="t-step">${String(i + 1).padStart(2, "0")} / ${String(TOUR.length).padStart(2, "0")}</span><h1>${st.title}</h1>${st.text ? `<p class="lead">${st.text}</p>` : ""}${o ? blocksHtml(st.blocks ? st.blocks.map(k => o.blocks[k]).filter(Boolean) : o.blocks.filter(b => b.tour !== false)) : ""}`;
          return;
        }
        goStep(i, false);
        const p = page();
        mapInto(p, boxFor(st), mapArea);
        side(p, `${L10N.tour} · ${String(i + 1).padStart(2, "0")} / ${String(TOUR.length).padStart(2, "0")}`, st.title,
          (st.text ? `<p>${st.text}</p>` : "") + (st.summary ? `<div class="t-sum">${st.summary.map(([b, s]) => `<div><b>${b}</b>${s}</div>`).join("")}</div>` : "")
          + (st.rmItems ? `<div class="t-sum">${st.rmItems.map(it => `<div><b>${it.title}</b>${it.text || ""}</div>`).join("")}</div>` : ""));
        foot(p);
      });
      endTour();
    } else {
      LENSES.slice(1).forEach(l => {
        setLens(l.id, false);
        const p = page();
        mapInto(p, boxFor(l), mapArea);
        side(p, L10N.tour, l.title, l.text ? `<p>${l.text}</p>` : "");
        foot(p);
      });
    }
    Object.values(overlayById).forEach(o => {
      const p = page("pg-ov");
      p.innerHTML = `${o.eyebrow ? `<span class="eyebrow">${o.eyebrow}</span>` : ""}<h1>${o.title}</h1>${o.lead ? `<p class="lead">${o.lead}</p>` : ""}${blocksHtml(o.blocks)}`;
    });
    restore(keep, false);
    const done = () => { out.replaceChildren(); document.body.classList.remove("print-bw"); };
    addEventListener("afterprint", done, { once: true });
    setTimeout(() => window.print(), 60);
  }

  /* =====================================================================
     STATE (kept across re-renders while editing) and start
     ===================================================================== */
  function snapshot() {
    return { lens: state.lens, tour: state.tour, panel: state.panel, listItem: state.listItem, cam: { ...cam }, heroGone: hero.classList.contains("gone"),
      overlay: ovOpen, status: document.body.classList.contains("status"), legendOpen: !legendEl.classList.contains("collapsed") };
  }
  function restore(r, keepCam = true) {
    hero.style.transition = "none";
    if (r.heroGone !== false) hero.classList.add("gone");
    if (STATUS && r.status !== undefined) setStatus(r.status);
    if (r.tour >= 0 && TOUR.length) { tourSteps = TOUR; LENSES.forEach(l => l.btn.classList.remove("active")); goStep(Math.min(r.tour, TOUR.length - 1), false); }
    else setLens(LENSES.some(l => l.id === r.lens) ? r.lens : LENSES[0].id, false);
    if (r.panel) {
      if (nodeById[r.panel]) openNode(r.panel);
      else if (r.panel.startsWith("zone:") && zoneById[r.panel.slice(5)]) openZone(r.panel.slice(5));
      else if (r.panel.startsWith("list:") && LISTS[r.panel.slice(5)]) openList(r.panel.slice(5));
    }
    if (r.listItem && LISTS[r.listItem.list]) selectItem(state.tour >= 0 && sideTour() ? tourEl : panel, r.listItem.list, r.listItem.i);
    if (r.overlay) openOverlay(r.overlay);
    if (keepCam && r.cam) { Object.assign(cam, r.cam); lastBox = null; applyCam(false); }
    world.style.transition = "none";
  }
  if (opts.restore) { restore(opts.restore, opts.keepCam !== false); settle(false); }
  else if (!applyHash(opts.hash !== undefined ? opts.hash : location.hash)) {
    setLens(LENSES[0].id, false);
    if (opts.hero === false || S.hero === false || !SPEC.hero) { hero.style.transition = "none"; hideHero(); }
    settle(false);
  }

  function destroy() {
    ac.abort();
    timers.forEach(clearTimeout);
    clearTimeout(idleTimer);
    if (rafId) cancelAnimationFrame(rafId);
  }
  return {
    spec: SPEC, state, cam, world, destroy, applyHash, runCheck, setLens, goStep: i => { tourSteps = TOUR; goStep(i); }, startTour,
    openNode, openZone, openList, openOverlay, closePanel, endTour, fit, currentBox, snapshot, restore, printDeck, hideHero,
    goStepNow: i => { tourSteps = TOUR; goStep(i, false); }, runCheckSilent: () => runCheck(),
    nodeById, zoneById, toWorld: (x, y) => ({ x: (x - cam.x) / cam.s, y: (y - cam.y) / cam.s }), applyCam,
    refocus: () => { restoreFocus(); },
  };
}
