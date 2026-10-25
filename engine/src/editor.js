/* Blueprint Deck editor (press E): change texts, colours, theme and logo, move boxes, connect them, edit tabs, the tour
   and personas, without an agent and without a rebuild. Every change is saved at once (see boot.js: file or browser). */
const BDEditor = (() => {
  const $ = id => document.getElementById(id);
  const escA = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const plain = s => BDCore.stripTags(s);
  const ed = { active: false, justDragged: false };
  let bar = null, pane = null, sel = { kind: "diagram" }, pick = null, connectFrom = null;
  const undo = [], redo = [];
  let lastKey = "", lastAt = 0;

  /* ------------------------------------------------------------ data access (always re-read: undo replaces the data) */
  const D = () => BD.data;
  const own = () => BD.multi() ? D().diagrams[BD.index] : D();
  // the theme of a multi-diagram file is shared by all diagrams (a diagram's own theme would hide the change)
  const themeHost = () => { if (BD.multi()) D().diagrams.forEach(d => delete d.theme); return D(); };
  const spec = () => BD.current && BD.current.spec;
  const nodeRaw = id => (own().nodes || []).find(n => n.id === id);
  const zoneRaw = id => (own().zones || []).find(z => z.id === id);
  const edgesObj = () => {
    const r = own();
    r.edges = (r.edges || []).map(e => {
      if (!Array.isArray(e)) return e;
      const [from, to, groups, label, dashed] = e, o = { from, to, groups: groups || [] };
      if (label) o.label = label;
      if (dashed) o.dashed = true;
      return o;
    });
    return r.edges;
  };
  const getPath = (o, path) => path.split(".").reduce((x, k) => x == null ? undefined : x[k], o);
  const setPath = (o, path, v) => {
    const ks = path.split("."), last = ks.pop();
    const t = ks.reduce((x, k) => (x[k] && typeof x[k] === "object") ? x[k] : (x[k] = {}), o);
    if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) delete t[last]; else t[last] = v;
  };
  const uid = (base, taken) => {
    let s = String(base || "item").toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item", id = s, k = 2;
    while (taken.has(id)) id = s + "-" + k++;
    return id;
  };

  /* ------------------------------------------------------------ changes, history */
  function change(fn, key, refresh) {
    const before = JSON.stringify(D());
    fn(own(), D());
    if (JSON.stringify(D()) === before) return;
    const now = Date.now();
    if (!(key && key === lastKey && now - lastAt < 1500)) { undo.push(before); if (undo.length > 150) undo.shift(); redo.length = 0; }
    lastKey = key || ""; lastAt = now;
    BD.persist();
    BD.rerender();
    if (refresh) render();
    else updateCounts();
  }
  function stepHistory(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(D()));
    BD.data = JSON.parse(from.pop());
    lastKey = "";
    BD.persist();
    BD.rerender();
    render();
  }

  /* ------------------------------------------------------------ UI shell */
  function build() {
    bar = document.createElement("div");
    bar.id = "ed-bar"; bar.className = "glass";
    bar.innerHTML = `
      <span class="ed-live"><i></i>Editing</span>
      <span class="ed-save" id="ed-save"></span>
      <span class="ed-sep"></span>
      <button data-p="diagram">Diagram</button><button data-p="tabs">Tabs</button><button data-p="tour">Tour</button><button data-p="personas">Personas</button>
      <button data-p="check">Check <b id="ed-n"></b></button>
      <span class="ed-sep"></span>
      <button data-a="undo" title="Undo (Ctrl+Z)">↶</button><button data-a="redo" title="Redo (Ctrl+Shift+Z)">↷</button>
      <span class="ed-sep"></span>
      <button data-a="share" title="Download a copy to send: read-only or editable">Share…</button>
      <button data-a="done" class="ed-done">Done</button>`;
    bar.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { pick = null; connectFrom = null; select({ kind: b.dataset.p }); });
    bar.querySelector("[data-a=undo]").onclick = () => stepHistory(undo, redo);
    bar.querySelector("[data-a=redo]").onclick = () => stepHistory(redo, undo);
    bar.querySelector("[data-a=done]").onclick = () => toggle(false);
    bar.querySelector("[data-a=share]").onclick = () => share();
    pane = document.createElement("aside");
    pane.id = "ed-panel"; pane.className = "glass";
    document.body.append(bar, pane);
    BD.onStatus(saveStatus);
  }
  function saveStatus(s) {
    const el = $("ed-save");
    if (!el) return;
    if (s === null) { el.innerHTML = `<span class="ed-warn">Not applied: fix the errors in Check</span>`; return; }
    const file = BD.fileName();
    // one Save button: into the file itself (Chrome, Edge), else a download of the updated file
    const saveTitle = BD.fs ? (BD.hasHandle ? `Keep saving into ${file}` : `Save into ${file} (choose the file once; later changes are saved automatically)`) : `Download the updated ${file} and replace the old one`;
    const save = `<button data-s="save" class="primary" title="${escA(saveTitle)}">Save</button>`;
    const parts = {
      file: `<span class="ok" title="Saved to ${escA(file)}">✓ Saved</span>`,
      saving: `<span>Saving…</span>`,
      clean: `<span title="Nothing changed since the file was opened">No changes</span>`,
      browser: `<span class="ed-warn" title="Your changes are kept in this browser, not yet in the file">Unsaved</span>${save}`,
    };
    el.innerHTML = parts[s] || "";
    el.querySelectorAll("[data-s=save]").forEach(b => b.onclick = () => BD.fs ? (BD.hasHandle ? BD.resumeFile() : BD.connectFile()) : BD.download());
  }
  function toggle(onOff) {
    const want = onOff === undefined ? !ed.active : onOff;
    if (want === ed.active) return;
    if (want && BD.current && BD.current.spec.settings.editor === false) return;
    ed.active = want;
    if (!bar) build();
    document.body.classList.toggle("editing", want);
    pick = null; connectFrom = null;
    if (want) {
      BD.current.hideHero();
      BD.current.closePanel(true);
      sel = { kind: "diagram" };
      render();
      BD.status();
      // the browser's storage may be blocked (sandboxed viewers, private mode): then the intro just shows every time
      let seen = false; try { seen = !!localStorage.getItem("bd-editor-intro"); } catch { /* storage blocked */ }
      if (!seen) {
        BD.toast("Click a box or an area to edit it · drag boxes to move them · changes are saved as you go", [{ label: "Got it", fn: () => { try { localStorage.setItem("bd-editor-intro", "1"); } catch { /* storage blocked */ } } }], 9000);
      }
    }
    BD.rerender();
  }
  let shownIndex = -1;
  function mounted() {
    // another diagram of the file was opened from the switcher: show its settings, not the previous diagram's
    if (ed.active && BD.index !== shownIndex) { shownIndex = BD.index; pick = null; connectFrom = null; sel = { kind: "diagram" }; render(); return; }
    decorate(); updateCounts();
  }

  /* ------------------------------------------------------------ share: download a copy under a name you choose */
  // readOnly: the ⋯ menu's "Download a read-only copy" (only the file name to confirm); otherwise the editor's Share…
  function share({ readOnly = false } = {}) {
    document.querySelector(".ed-modal")?.remove();
    const m = document.createElement("div");
    m.className = "ed-modal";
    m.innerHTML = `<div class="ed-modal-card glass" role="dialog" aria-modal="true" aria-labelledby="shareTitle">
      <h3 id="shareTitle">${readOnly ? "Download a read-only copy" : "Download a copy to share"}</h3>
      <div class="fld"><label for="shareName">File name</label><input type="text" id="shareName" value="${escA(BD.suggestName())}" spellcheck="false"></div>
      ${readOnly ? `<p class="ed-note">The same diagram, tour and PDF export, but no editor: it can't be changed in the browser. Your own file stays editable.</p>` : `<div class="fld"><label>Copy</label>
        <label class="opt"><input type="radio" name="shareMode" value="ro" checked><span><b>Read-only</b> (recommended for sending)<small>The same diagram, tour and PDF export, but no editor: the file can't be changed in the browser.</small></span></label>
        <label class="opt"><input type="radio" name="shareMode" value="rw"><span><b>Editable</b><small>A copy with the editor, like this file.</small></span></label>
      </div>
      <p class="ed-note">Your own file stays editable. When the diagram changes, download a new copy.</p>`}
      <div class="ed-modal-acts"><button type="button" class="mini" data-x="cancel">Cancel</button><button type="button" class="mini primary" data-x="go">Download</button></div>
    </div>`;
    document.body.appendChild(m);
    const name = m.querySelector("#shareName");
    name.focus(); name.setSelectionRange(0, name.value.replace(/\.html?$/i, "").length);
    const close = () => m.remove();
    const go = () => { const ro = readOnly || m.querySelector("[name=shareMode]:checked").value === "ro"; if (BD.exportCopy({ name: name.value, readOnly: ro })) close(); };
    m.querySelector("[data-x=cancel]").onclick = close;
    m.querySelector("[data-x=go]").onclick = go;
    m.onclick = e => { if (e.target === m) close(); };
    m.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } if (e.key === "Enter" && e.target === name) go(); });
  }

  /* ------------------------------------------------------------ selection */
  function select(t) {
    // a persona's box on the map is edited in the persona form
    if (t.kind === "node" && !nodeRaw(t.id) && !pick && !connectFrom) {
      const i = (own().personas || []).findIndex((p, k) => (p.id || "persona-" + (k + 1)) === t.id);
      if (i >= 0) t = { kind: "persona", i };
    }
    if (pick && t.kind === "node") { togglePick(t.id); return; }
    if (connectFrom && t.kind === "node") { connect(connectFrom, t.id); return; }
    if (t.kind === "canvas") { if (pick || connectFrom) return; t = { kind: "diagram" }; }
    sel = t;
    const cur = BD.current;
    if (t.kind === "node" && cur.nodeById[t.id]) cur.fit(focusBox([t.id]), true, 0.9);
    if (t.kind === "zone") cur.fit(zoneBox(t.id), true, 0.9);
    render();
  }
  const focusBox = ids => { const ns = ids.map(i => BD.current.nodeById[i]).filter(Boolean); const x1 = Math.min(...ns.map(n => n.x)), y1 = Math.min(...ns.map(n => n.y)); return { x: x1 - 160, y: y1 - 120, w: Math.max(...ns.map(n => n.x + n.w)) - x1 + 320, h: Math.max(...ns.map(n => n.y + n.h)) - y1 + 240 }; };
  const zoneBox = id => { const z = BD.current.zoneById[id]; return { x: z.x - 40, y: z.y - 40, w: z.w + 80, h: z.h + 80 }; };
  function decorate() {
    if (!ed.active || !BD.current) return;
    const cur = BD.current;
    document.querySelectorAll(".node.ed-sel, .zone.ed-sel").forEach(x => x.classList.remove("ed-sel"));
    if (sel.kind === "node" && cur.nodeById[sel.id]) cur.nodeById[sel.id].el.classList.add("ed-sel");
    if (sel.kind === "zone" && cur.zoneById[sel.id]) cur.zoneById[sel.id].el.classList.add("ed-sel");
    document.body.classList.toggle("ed-picking", !!(pick || connectFrom));
    Object.values(cur.nodeById).forEach(n => {
      if (n.el.dataset.edWired) return;
      n.el.dataset.edWired = "1";
      n.el.addEventListener("pointerdown", e => startDrag(e, n.id));
    });
  }

  /* ------------------------------------------------------------ form helpers */
  // fields: [path, label, type, extra]; values are read from / written to obj() at path
  function fields(list, obj, keyBase) {
    const o = obj() || {};
    return list.map(([path, label, type = "text", x = {}]) => {
      const v = getPath(o, path), id = "f-" + keyBase + "-" + path.replace(/\W/g, "_");
      const hint = x.hint ? `<small>${x.hint}</small>` : "";
      const attrs = `id="${id}" data-path="${path}" data-type="${type}"`;
      let input;
      if (type === "area") input = `<textarea ${attrs} rows="${x.rows || 4}" placeholder="${escA(x.ph || "")}">${escA(v || "")}</textarea>`;
      else if (type === "lines") input = `<textarea ${attrs} rows="${x.rows || 3}" placeholder="One per line">${escA((v || []).join("\n"))}</textarea>`;
      else if (type === "select") input = `<select ${attrs}>${x.options.map(([val, txt]) => `<option value="${escA(val)}" ${String(v ?? x.def ?? "") === String(val) ? "selected" : ""}>${escA(txt)}</option>`).join("")}</select>`;
      else if (type === "seg") input = `<div class="seg" ${attrs}>${x.options.map(([val, txt]) => `<button type="button" data-v="${escA(val)}" class="${String(v ?? x.def) === String(val) ? "on" : ""}">${escA(txt)}</button>`).join("")}</div>`;
      else if (type === "color") input = `<span class="colorf"><input type="color" ${attrs} value="${BDCore.isHex(v) ? v : x.def || "#888888"}"><code>${escA(v || x.def || "")}</code>${x.clear && v ? `<button type="button" class="mini" data-clear="${path}">Reset</button>` : ""}</span>`;
      else if (type === "check") input = `<label class="sw"><input type="checkbox" ${attrs} ${(v ?? x.def) ? "checked" : ""}><span></span>${escA(x.text || "")}</label>`;
      else if (type === "number") input = `<input type="number" ${attrs} value="${v ?? ""}" placeholder="${escA(x.ph ?? "")}" min="${x.min ?? ""}" max="${x.max ?? ""}">`;
      else if (type === "icon") input = `<button type="button" class="iconf" ${attrs}>${iconHtml(v || "cog", own().icons)}<span>${escA(v || "choose…")}</span></button>`;
      else input = `<input type="text" ${attrs} value="${escA(v ?? "")}" placeholder="${escA(x.ph || "")}">`;
      return `<div class="fld${type === "check" ? " fld-check" : ""}"><label for="${id}">${label}</label>${input}${hint}</div>`;
    }).join("");
  }
  function wire(root, obj, keyBase) {
    const set = (path, v, key, refresh) => change(() => setPath(obj(), path, v), key, refresh);
    root.querySelectorAll("[data-path]").forEach(el => {
      const path = el.dataset.path, type = el.dataset.type, key = keyBase + ":" + path;
      if (type === "seg") { el.querySelectorAll("button").forEach(b => b.onclick = () => { el.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); set(path, b.dataset.v, key, true); }); return; }
      if (type === "icon") { el.onclick = () => iconPicker(el, v => set(path, v, key, true)); return; }
      if (type === "check") { el.onchange = () => set(path, el.checked, key); return; }
      if (type === "color") { el.oninput = () => { el.nextElementSibling.textContent = el.value; set(path, el.value, key); }; return; }
      if (type === "select") { el.onchange = () => set(path, el.value, key, true); return; }
      const read = () => type === "lines" ? el.value.split("\n").map(s => s.trim()).filter(Boolean) : type === "number" ? (el.value === "" ? undefined : +el.value) : el.value;
      let t = 0;
      el.oninput = () => { clearTimeout(t); t = setTimeout(() => set(path, read(), key), 350); };
      el.onchange = () => { clearTimeout(t); set(path, read(), key); };
    });
    root.querySelectorAll("[data-clear]").forEach(b => b.onclick = () => set(b.dataset.clear, undefined, "", true));
  }
  function iconPicker(anchor, done) {
    document.querySelector(".ed-icons")?.remove();
    const names = [...new Set([...Object.keys(own().icons || {}), ...Object.keys(ICONS)])];
    const pop = document.createElement("div");
    pop.className = "ed-icons glass";
    pop.innerHTML = `<input type="search" placeholder="Search ${names.length} icons…"><div class="grid">${names.map(n => `<button type="button" title="${n}" data-n="${n}">${iconHtml(n, own().icons)}</button>`).join("")}</div>`;
    const r = anchor.getBoundingClientRect();
    Object.assign(pop.style, { top: Math.min(r.bottom + 6, innerHeight - 380) + "px", right: (innerWidth - r.right) + "px" });
    document.body.appendChild(pop);
    const q = pop.querySelector("input");
    q.focus();
    q.oninput = () => pop.querySelectorAll("[data-n]").forEach(b => b.style.display = b.dataset.n.includes(q.value.toLowerCase().trim()) ? "" : "none");
    pop.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { pop.remove(); done(b.dataset.n); });
    setTimeout(() => addEventListener("pointerdown", function off(e) { if (!pop.contains(e.target)) { pop.remove(); removeEventListener("pointerdown", off); } }), 0);
  }
  const head = (title, sub, actions = "") => `<div class="ed-head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ""}</div><div class="ed-acts">${actions}</div></div>`;
  const section = (title, html) => `<section><h4>${title}</h4>${html}</section>`;
  const chips = (ids, field) => `<div class="chips-ed">${(ids || []).map((id, k) => `<span class="chip-ed" data-id="${escA(id)}">${field === "path" ? `<b>${k + 1}</b>` : ""}${escA(BD.current.nodeById[id] ? plain(BD.current.nodeById[id].title) : id)}<button type="button" data-rm="${escA(id)}" title="Remove">×</button></span>`).join("") || `<em>none</em>`}</div>`;

  /* ------------------------------------------------------------ panels */
  function render() {
    if (!pane || !ed.active) return;
    shownIndex = BD.index;
    bar.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("on", b.dataset.p === sel.kind || (sel.kind === "step" && b.dataset.p === "tour") || (sel.kind === "lens" && b.dataset.p === "tabs") || (sel.kind === "persona" && b.dataset.p === "personas")));
    const fn = { diagram: pDiagram, zone: pZone, node: pNode, tabs: pTabs, lens: pLens, tour: pTour, step: pStep, personas: pPersonas, persona: pPersona, check: pCheck }[sel.kind] || pDiagram;
    const scroll = pane.querySelector(".ed-body")?.scrollTop || 0;
    fn();
    if (sel.same) { const b = pane.querySelector(".ed-body"); if (b) b.scrollTop = scroll; }
    sel.same = false;
    decorate();
    updateCounts();
  }
  const paint = html => { pane.innerHTML = `<div class="ed-body">${html}</div>`; return pane; };
  const keep = () => { sel.same = true; };

  function pDiagram() {
    const multi = BD.multi();
    const th = () => themeHost().theme || (themeHost().theme = {});
    const T = BDCore.THEMES;
    const resolved = spec() ? spec().theme : {};
    const brandObj = () => multi ? D() : own();
    const grp = (g, html) => `<div data-g="${g}">${html}</div>`;
    const p = paint(head("Diagram", multi ? `Diagram ${BD.index + 1} of ${BD.entries().length}` : "Title, look and behaviour") +
      section("Title", grp("own", fields([["meta.title", "Title"], ["meta.subtitle", "Subtitle"]], own, "meta"))) +
      section("Look" + (multi ? " <small>(all diagrams)</small>" : ""), grp("theme", fields([
        ["preset", "Theme", "select", { options: Object.keys(T).map(k => [k, k[0].toUpperCase() + k.slice(1) + (T[k].mode === "light" && k !== "light" ? " (light)" : "")]), def: "midnight" }],
        ["primary", "Main colour", "color", { def: resolved.primary, clear: true }],
        ["secondary", "Second colour", "color", { def: resolved.secondary, clear: true }],
        ["shape", "Shape", "seg", { options: [["rounded", "Rounded"], ["square", "Square"], ["pill", "Pill"]], def: "rounded", hint: "Areas and boxes; menus and panels stay the same." }],
      ], th, "theme"))) +
      section("Branding" + (multi ? " <small>(all diagrams)</small>" : ""), `
        <div class="fld"><label>Logo</label><div class="logof"><span class="lg">${logoPreview()}</span>
          <button type="button" class="mini" id="lgUp">Upload image…</button><button type="button" class="mini" id="lgIcon">Use an icon…</button>${getPath(brandObj(), "meta.logo") ? `<button type="button" class="mini" id="lgClr">Remove</button>` : ""}</div>
          <small>PNG, SVG or JPG. It is stored inside the file.</small></div>` +
        grp("brand", fields([["meta.url", "Link (opens when the logo is clicked)", "text", { ph: "https://…" }]], brandObj, "brand"))) +
      section("Content", grp("own2", fields([
        ["meta.type", "Diagram type", "select", { options: Object.keys(BDCore.TYPE_LABELS).map(k => [k, k]), def: "architecture" }],
        ["meta.viewpoint", "Viewpoint", "seg", { options: [["product", "Product"], ["mixed", "Mixed"], ["technical", "Technical"]], def: "mixed", hint: "Product: what it does for whom. Technical: components and technology." }],
        ["settings.panel.tech", "Technology in the side panel", "select", { options: [["", "From the viewpoint"], ["full", "Pick + alternatives & exit path"], ["pick", "Technology pick only"], ["off", "Hidden"]] }],
      ], own, "content"))) +
      section("Behaviour", grp("own3", fields([
        ["settings.legend", "Legend", "select", { options: [["collapsed", "Collapsed (click to open)"], ["open", "Open"], ["false", "Hidden"]], def: "collapsed" }],
        ["settings.edges.overview", "Connections in the overview", "select", { options: [["all", "All, faint"], ["main", "Only the main flow"], ["none", "None (hover shows them)"]], def: "all" }],
        ["settings.edges.particles", "Moving dots", "select", { options: [["main", "On the main flow"], ["focus", "Only in tabs and steps"], ["off", "Off"]], def: "main" }],
        ["settings.tour.position", "Tour card", "select", { options: [["auto", "Side on wide screens, else bottom"], ["right", "Always on the side"], ["bottom", "Always at the bottom"]], def: "auto" }],
        ["settings.hero", "Start screen", "check", { def: true, text: "Show the start screen" }],
        ["settings.credit", "Credit", "check", { def: true, text: "Show “Made with Blueprint Deck Kit” (start screen, ⋯ menu, PDF)" }],
      ], own, "settings"))) +
      section("Start screen", grp("own4", fields([["hero.eyebrow", "Eyebrow"], ["hero.title", "Headline"], ["hero.lead", "Lead", "area", { rows: 3 }], ["hero.footnote", "Footnote"]], own, "hero"))) +
      section("Areas", `<button type="button" class="mini" id="addZone">+ Add an area</button><small>Click an area's title on the map to edit it.</small>`) +
      section("This file", `<p class="ed-note">Blueprint Deck Kit engine <b>${escA(BDCore.VERSION)}</b>. For a newer engine, update the skill (run the install command again) and ask your agent to upgrade this file; your content stays as it is. <a href="https://github.com/lukasvecerka23/blueprint-deck-kit/releases" target="_blank" rel="noopener">What's new</a></p>`));
    wire(p.querySelector("[data-g=theme]"), th, "theme");
    wire(p.querySelector("[data-g=brand]"), brandObj, "brand");
    ["own", "own2", "own3", "own4"].forEach(g => wire(p.querySelector(`[data-g=${g}]`), own, g));
    // legend "false" is the boolean false
    const lg = p.querySelector('[data-path="settings.legend"]');
    lg.onchange = () => change(r => setPath(r, "settings.legend", lg.value === "false" ? false : lg.value), "legend");
    p.querySelector("#lgUp").onclick = () => uploadLogo();
    p.querySelector("#lgIcon").onclick = e => iconPicker(e.target, n => change(() => setPath(brandObj(), "meta.logo", "icon:" + n), "", true));
    p.querySelector("#lgClr")?.addEventListener("click", () => change(() => setPath(brandObj(), "meta.logo", undefined), "", true));
    p.querySelector("#addZone").onclick = addZone;
  }
  function wireOne(el, obj) {
    const path = el.dataset.path;
    let t = 0;
    el.oninput = () => { clearTimeout(t); t = setTimeout(() => change(() => setPath(obj(), path, el.value), "one:" + path), 350); };
    el.onchange = () => change(() => setPath(obj(), path, el.value), "one:" + path);
  }
  function logoPreview() {
    const l = getPath(BD.multi() ? D() : own(), "meta.logo") || "icon:layout-grid";
    if (l.startsWith("icon:")) return iconHtml(l.slice(5), own().icons);
    if (l.startsWith("<svg")) return l;
    return `<img src="${escA(l)}" alt="">`;
  }
  function uploadLogo() {
    const inp = Object.assign(document.createElement("input"), { type: "file", accept: "image/png,image/svg+xml,image/jpeg,image/webp" });
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      if (f.size > 400000) BD.toast("That image is large (" + Math.round(f.size / 1024) + " KB); it will make the file bigger. A small PNG or SVG is better.", [], 6000);
      const rd = new FileReader();
      rd.onload = () => change(() => setPath(BD.multi() ? D() : own(), "meta.logo", rd.result), "", true);
      rd.readAsDataURL(f);
    };
    inp.click();
  }

  function pZone() {
    const z = () => zoneRaw(sel.id);
    if (!z()) return select({ kind: "diagram" });
    const count = (own().nodes || []).filter(n => n.zone === sel.id).length;
    const hasGrid = !!getPath(own(), "settings.layout.grid") && z().grid;
    const p = paint(head("Area", escA(plain(z().title)), `<button type="button" class="mini danger" id="delZone">Delete</button>`) +
      section("Text", fields([["title", "Title"], ["sub", "Subtitle"], ["desc", "Description (side panel)", "area"], ["points", "Key points", "lines"], ["tag", "Tag", "text", { ph: "e.g. MVP" }]], z, "z" + sel.id)) +
      section("Look", fields([
        ["color", "Colour", "color"],
        ["boundary", "Boundary", "select", { options: [["", "Ours"], ["customer", "Customer-owned"], ["partner", "Partner"], ["external", "External (outside)"]], hint: "Outside areas get a dashed border and a badge, so it's clear what isn't yours." }],
        ["icon", "Icon (side panel)", "icon"],
      ], z, "z" + sel.id)) +
      section("Layout", fields([["layout.columns", "Box columns", "number", { min: 1, max: 6, ph: "1" }]], z, "z" + sel.id) +
        (hasGrid ? `<div class="fld"><label>Grid cell</label><div class="row4">${["Column", "Row", "Width", "Height"].map((l, i) => `<label><small>${l}</small><input type="number" min="${i < 2 ? 0 : 1}" data-gi="${i}" value="${[...z().grid, 1, 1][i]}"></label>`).join("")}</div><small>Cells of the diagram's grid (from 0). Overlapping areas are reported in Check.</small></div>` : "")) +
      section(`Boxes (${count})`, `<button type="button" class="mini" id="addNode">+ Add a box</button><small>Drag boxes on the map to reorder them or move them to another area.</small>`));
    wire(p, z, "z" + sel.id);
    const b = p.querySelector('[data-path="boundary"]');
    b.onchange = () => change(() => { const o = z(); if (b.value) o.boundary = b.value; else delete o.boundary; delete o.outside; }, "", true);
    p.querySelectorAll("[data-gi]").forEach(inp => inp.onchange = () => change(() => { const g = [...z().grid, 1, 1].slice(0, 4); g[+inp.dataset.gi] = Math.max(+inp.min, +inp.value || 0); z().grid = g; }, ""));
    p.querySelector("#addNode").onclick = () => addNode(sel.id);
    p.querySelector("#delZone").onclick = () => {
      if (count && !confirmInline(p.querySelector("#delZone"), `Delete with its ${count} boxes?`)) return;
      const id = sel.id;
      change(r => { (r.nodes || []).filter(n => n.zone === id).map(n => n.id).forEach(nid => purgeNode(r, nid)); r.zones = r.zones.filter(x => x.id !== id); r.edges = (r.edges || []).filter(e => ![].concat(Array.isArray(e) ? e.slice(0, 2) : [e.from, e.to]).includes("zone:" + id)); }, "", false);
      select({ kind: "diagram" });
    };
  }
  // two clicks to delete: the first one asks
  function confirmInline(btn, text) {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = "1"; btn.textContent = text;
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = "Delete"; } }, 3500);
    return false;
  }

  function pNode() {
    const n = () => nodeRaw(sel.id);
    if (!n()) return select({ kind: "diagram" });
    const zones = (own().zones || []).map(z => [z.id, plain(z.title)]);
    const status = ((own().status || D().status || {}).values || []).map(v => [v.id, v.label]);
    const edges = edgesObj().map((e, i) => ({ e, i })).filter(({ e }) => e.from === sel.id || e.to === sel.id);
    const groups = [...new Set(edgesObj().flatMap(e => e.groups || []))];
    const name = id => id.startsWith("zone:") ? "Area: " + plain((zoneRaw(id.slice(5)) || {}).title || id) : plain((nodeRaw(id) || {}).title || id);
    const p = paint(head("Box", escA(plain(n().title)), `<button type="button" class="mini" id="dupNode">Duplicate</button><button type="button" class="mini danger" id="delNode">Delete</button>`) +
      section("On the map", fields([["title", "Title"], ["sub", "Subtitle"], ["icon", "Icon", "icon"], ["badge", "Badge", "text", { ph: "e.g. NEW" }]], n, "n" + sel.id) +
        fields([["zone", "Area", "select", { options: zones }], ...(status.length ? [["status", "Status", "select", { options: [["", "—"], ...status] }]] : []),
          ["size", "Size", "seg", { options: [["", "Normal"], ["big", "Big"]], def: "" }], ["color", "Colour (default: the area's)", "color", { def: (zoneRaw(n().zone) || {}).color, clear: true }]], n, "n" + sel.id)) +
      section("Side panel", fields([["what", "What it is", "area"], ["why", "Why it matters", "lines"], ["pick", "Technology pick", "area", { rows: 2 }], ["alt", "Alternatives & exit path", "area", { rows: 2 }], ["sources", "Sources", "lines", { rows: 2 }]], n, "n" + sel.id)) +
      section(`Connections (${edges.length})`, `<div class="conns">${edges.map(({ e, i }) => `
        <div class="conn" data-ei="${i}"><div class="conn-h"><span>${e.from === sel.id ? "→ " + escA(name(e.to)) : "← " + escA(name(e.from))}</span><button type="button" class="mini" data-flip="${i}" title="Reverse direction">⇄</button><button type="button" class="mini danger" data-del="${i}">×</button></div>
          <div class="row2"><input type="text" data-ef="label" value="${escA(e.label || "")}" placeholder="Label"><input type="text" data-ef="groups" value="${escA((e.groups || []).join(", "))}" placeholder="Groups, e.g. request" list="ed-groups"></div>
          <label class="sw"><input type="checkbox" data-ef="dashed" ${e.dashed ? "checked" : ""}><span></span>Dashed (optional or planned)</label></div>`).join("")}</div>
        <datalist id="ed-groups">${groups.map(g => `<option value="${escA(g)}">`).join("")}</datalist>
        <button type="button" class="mini" id="conn">${connectFrom ? "Click the box to connect to… (Esc cancels)" : "+ Connect to another box…"}</button>`));
    wire(p, n, "n" + sel.id);
    p.querySelector('[data-path="zone"]').onchange = e => change(() => { n().zone = e.target.value; delete n().x; delete n().y; }, "", true);
    p.querySelectorAll(".conn").forEach(c => {
      const i = +c.dataset.ei;
      c.querySelectorAll("[data-ef]").forEach(inp => {
        const f = inp.dataset.ef;
        const apply = () => change(() => { const e = edgesObj()[i]; const v = f === "dashed" ? inp.checked : f === "groups" ? inp.value.split(",").map(s => s.trim()).filter(Boolean) : inp.value; if (v === "" || v === false) delete e[f]; else e[f] = v; if (f === "groups") e.groups = v || []; }, "e" + i + f);
        let t = 0;
        inp.oninput = () => { clearTimeout(t); t = setTimeout(apply, 400); };
        inp.onchange = () => { clearTimeout(t); apply(); };
      });
    });
    p.querySelectorAll("[data-del]").forEach(b => b.onclick = () => change(() => edgesObj().splice(+b.dataset.del, 1), "", true));
    p.querySelectorAll("[data-flip]").forEach(b => b.onclick = () => change(() => { const e = edgesObj()[+b.dataset.flip]; [e.from, e.to] = [e.to, e.from]; }, "", true));
    p.querySelector("#conn").onclick = () => { connectFrom = connectFrom ? null : sel.id; keep(); render(); };
    p.querySelector("#delNode").onclick = e => { if (!confirmInline(e.target, "Click again to delete")) return; const id = sel.id; change(r => purgeNode(r, id)); select({ kind: "zone", id: n() ? n().zone : (own().zones[0] || {}).id }); };
    p.querySelector("#dupNode").onclick = () => {
      const src = n(), id = uid(src.id, new Set(own().nodes.map(x => x.id)));
      change(r => { const c = JSON.parse(JSON.stringify(src)); c.id = id; c.title = src.title + " (copy)"; delete c.x; delete c.y; r.nodes.splice(r.nodes.indexOf(src) + 1, 0, c); });
      select({ kind: "node", id });
    };
  }
  function connect(from, to) {
    connectFrom = null;
    if (from === to) { keep(); render(); return; }
    const main = getPath(own(), "settings.edges.mainFlow");
    const groups = edgesObj().find(e => e.from === from || e.to === from)?.groups || (main ? [main] : ["main"]);
    change(() => edgesObj().push({ from, to, groups: [...groups] }), "", false);
    select({ kind: "node", id: from });
  }
  function purgeNode(r, id) {
    r.nodes = (r.nodes || []).filter(n => n.id !== id);
    r.edges = (r.edges || []).filter(e => { const [f, t] = Array.isArray(e) ? e : [e.from, e.to]; return f !== id && t !== id; });
    const strip = d => { if (d.nodes) d.nodes = d.nodes.filter(x => x !== id); if (d.path) d.path = d.path.filter(x => x !== id); };
    (r.lenses || []).forEach(strip); (r.tour || []).forEach(strip); (r.personas || []).forEach(strip);
    Object.values(r.lists || {}).forEach(L => (L.items || []).forEach(strip));
    Object.keys(r.groups || {}).forEach(g => { r.groups[g] = r.groups[g].filter(x => x !== id); });
    ((r.roadmap || {}).phases || []).forEach(ph => (ph.items || []).forEach(strip));
  }
  function addNode(zoneId) {
    const id = uid("new-box", new Set((own().nodes || []).map(n => n.id)));
    change(r => { r.nodes ||= []; const last = r.nodes.map(n => n.zone).lastIndexOf(zoneId); r.nodes.splice(last < 0 ? r.nodes.length : last + 1, 0, { id, zone: zoneId, title: "New box", sub: "", icon: "box", what: "" }); });
    select({ kind: "node", id });
    setTimeout(() => { const t = pane.querySelector('[data-path="title"]'); t && (t.focus(), t.select()); }, 50);
  }
  function addZone() {
    const id = uid("new-area", new Set((own().zones || []).map(z => z.id)));
    const colors = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#f472b6", "#60a5fa", "#2dd4bf", "#fb7185"];
    change(r => {
      r.zones ||= [];
      const color = colors[r.zones.length % colors.length];
      const grid = getPath(r, "settings.layout.grid");
      if (grid) {
        const used = new Set();
        r.zones.forEach(z => { if (!z.grid) return; const [c, rw, cs, rs] = [...z.grid, 1, 1]; for (let i = c; i < c + cs; i++) for (let j = rw; j < rw + rs; j++) used.add(i + "," + j); });
        let cell = null;
        for (let j = 0; j < grid.rows.length && !cell; j++) for (let i = 0; i < grid.columns.length && !cell; i++) if (!used.has(i + "," + j)) cell = [i, j];
        if (!cell) { grid.rows.push(220); cell = [0, grid.rows.length - 1]; }
        r.zones.push({ id, title: "New area", color, grid: cell });
      } else {
        const s = spec(), y = s ? Math.max(...s.zones.map(z => z.y + z.h)) + 40 : 100, x = s ? Math.min(...s.zones.map(z => z.x)) : 60;
        r.zones.push({ id, title: "New area", color, x, y, w: 320, h: 200 });
      }
    });
    select({ kind: "zone", id });
  }

  /* tabs */
  function pTabs() {
    const L = own().lenses || [];
    const p = paint(head("Tabs", "Each tab highlights part of the map") + `<div class="items">${L.map((l, i) => `
      <div class="item" data-i="${i}"><span class="dot" style="background:${escA(l.color || "#888")}"></span><b>${escA(plain(l.title))}</b><small>${i === 0 ? "first tab (overview)" : (l.nodes || []).length + " boxes"}</small>
        <span class="mv"><button type="button" class="mini" data-up="${i}" ${i < 2 ? "disabled" : ""}>↑</button><button type="button" class="mini" data-dn="${i}" ${i === 0 || i === L.length - 1 ? "disabled" : ""}>↓</button></span></div>`).join("")}</div>
      <button type="button" class="mini" id="addLens">+ Add a tab</button>`);
    p.querySelectorAll(".item").forEach(it => it.onclick = e => { if (e.target.closest("button")) return; const l = L[+it.dataset.i]; BD.current.endTour(); BD.current.setLens(l.id); select({ kind: "lens", id: l.id }); });
    p.querySelectorAll("[data-up]").forEach(b => b.onclick = () => change(r => { const i = +b.dataset.up; [r.lenses[i - 1], r.lenses[i]] = [r.lenses[i], r.lenses[i - 1]]; }, "", true));
    p.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => change(r => { const i = +b.dataset.dn; [r.lenses[i + 1], r.lenses[i]] = [r.lenses[i], r.lenses[i + 1]]; }, "", true));
    p.querySelector("#addLens").onclick = () => {
      const id = uid("new-tab", new Set(L.map(l => l.id)));
      change(r => { r.lenses ||= [{ id: "overview", title: "Overview", color: "#e2e8f0" }]; r.lenses.push({ id, title: "New tab", color: "#60a5fa", nodes: [] }); });
      BD.current.setLens(id); select({ kind: "lens", id }); startPick("lens", id, "nodes");
    };
  }
  const lensRaw = id => (own().lenses || []).find(l => l.id === id);
  function pLens() {
    const l = () => lensRaw(sel.id);
    if (!l()) return select({ kind: "tabs" });
    const first = (own().lenses || [])[0] === l();
    const zones = own().zones || [];
    const p = paint(head("Tab", escA(plain(l().title)), `<button type="button" class="mini" id="back">← Tabs</button>${first ? "" : `<button type="button" class="mini danger" id="del">Delete</button>`}`) +
      section("Tab", fields([["title", "Title"], ["color", "Colour", "color"]], l, "l" + sel.id)) +
      (first ? `<p class="ed-note">The first tab is the overview: nothing is highlighted.</p>` :
        section("Highlighted boxes", chips(l().nodes, "nodes") + pickBtn("lens", sel.id, "nodes")) +
        section("Whole areas", `<div class="checks">${zones.map(z => `<label class="sw"><input type="checkbox" data-z="${z.id}" ${(l().zones || []).includes(z.id) ? "checked" : ""}><span></span>${escA(plain(z.title))}</label>`).join("")}</div>`) +
        section("Connections", fields([["edges", "Only these connection groups", "lines", { rows: 2, hint: "One group per line, e.g. request. Empty: all connections between highlighted boxes." }]], l, "l" + sel.id))));
    wire(p, l, "l" + sel.id);
    wireChips(p, () => l().nodes, v => (l().nodes = v));
    p.querySelectorAll("[data-z]").forEach(c => c.onchange = () => change(() => { const s = new Set(l().zones || []); c.checked ? s.add(c.dataset.z) : s.delete(c.dataset.z); l().zones = [...s]; if (!l().zones.length) delete l().zones; }, ""));
    p.querySelector("#back").onclick = () => select({ kind: "tabs" });
    p.querySelector("#del")?.addEventListener("click", e => { if (!confirmInline(e.target, "Click again to delete")) return; const id = sel.id; change(r => { r.lenses = r.lenses.filter(x => x.id !== id); }); BD.current.setLens(own().lenses[0].id); select({ kind: "tabs" }); });
    wirePick(p);
  }

  /* tour */
  function pTour() {
    const T = own().tour || [];
    const p = paint(head("Guided tour", `${T.length} steps`) + `<div class="items">${T.map((st, i) => `
      <div class="item" data-i="${i}"><span class="num">${i + 1}</span><b>${st.roadmap ? "Roadmap phases" : escA(plain(st.title))}</b>
        <span class="mv"><button type="button" class="mini" data-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" class="mini" data-dn="${i}" ${i === T.length - 1 ? "disabled" : ""}>↓</button></span></div>`).join("")}</div>
      <button type="button" class="mini" id="addStep">+ Add a step</button>`);
    p.querySelectorAll(".item").forEach(it => it.onclick = e => { if (e.target.closest("button")) return; const i = +it.dataset.i; if (T[i].roadmap) return; showStep(i); select({ kind: "step", i }); });
    const swap = (r, a, b) => { [r.tour[a], r.tour[b]] = [r.tour[b], r.tour[a]]; };
    p.querySelectorAll("[data-up]").forEach(b => b.onclick = () => change(r => swap(r, +b.dataset.up, +b.dataset.up - 1), "", true));
    p.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => change(r => swap(r, +b.dataset.dn, +b.dataset.dn + 1), "", true));
    p.querySelector("#addStep").onclick = () => { change(r => { r.tour ||= []; r.tour.push({ title: "New step", text: "", nodes: [] }); }); const i = own().tour.length - 1; showStep(i); select({ kind: "step", i }); startPick("step", i, "nodes"); };
  }
  // the step index in the rendered tour (roadmap entries expand to several steps)
  function showStep(i) {
    const T = own().tour || [];
    let k = 0;
    for (let j = 0; j < i; j++) k += T[j].roadmap ? (((own().roadmap || {}).phases) || []).length : 1;
    BD.current.goStep(k);
  }
  function pStep() {
    const st = () => (own().tour || [])[sel.i];
    if (!st()) return select({ kind: "tour" });
    const lists = Object.keys(own().lists || {}).concat((own().personas || []).length ? ["personas"] : []);
    const ovs = (own().overlays || []).map(o => [o.id, plain(o.title)]);
    const p = paint(head(`Step ${sel.i + 1}`, escA(plain(st().title)), `<button type="button" class="mini" id="back">← Tour</button><button type="button" class="mini danger" id="del">Delete</button>`) +
      section("Text", fields([["title", "Title"], ["text", "Text", "area", { rows: 6 }]], st, "s" + sel.i) + `<small class="wc">${plain(st().text).split(/\s+/).filter(Boolean).length} words (under ~110 fits the card)</small>`) +
      section("Highlighted boxes", chips(st().nodes, "nodes") + pickBtn("step", sel.i, "nodes") +
        fields([["fit", "Camera", "seg", { options: [["", "Zoom to the boxes"], ["all", "Show the whole map"]], def: "" }]], st, "s" + sel.i)) +
      section("Connections", fields([["edges", "Only these connection groups", "lines", { rows: 2, hint: "One per line; 'none' hides all connections." }]], st, "s" + sel.i)) +
      section("Also show", fields([["list", "A list in the side panel", "select", { options: [["", "—"], ...lists.map(l => [l, l])] }], ...(ovs.length ? [["overlay", "A sheet", "select", { options: [["", "—"], ...ovs] }]] : [])], st, "s" + sel.i)));
    wire(p, st, "s" + sel.i);
    wireChips(p, () => st().nodes, v => (st().nodes = v));
    p.querySelector("#back").onclick = () => select({ kind: "tour" });
    p.querySelector("#del").onclick = e => { if (!confirmInline(e.target, "Click again to delete")) return; const i = sel.i; change(r => r.tour.splice(i, 1)); BD.current.endTour(); BD.current.setLens(own().lenses?.[0]?.id || "overview"); select({ kind: "tour" }); };
    wirePick(p);
    const ta = p.querySelector('[data-path="text"]');
    ta.addEventListener("input", () => { p.querySelector(".wc").textContent = ta.value.split(/\s+/).filter(Boolean).length + " words (under ~110 fits the card)"; });
  }

  /* personas */
  function pPersonas() {
    const P = own().personas || [];
    const p = paint(head("Personas", "Who uses it; pick one on the map to see its path") + `<div class="items">${P.map((x, i) => `
      <div class="item" data-i="${i}"><span class="dot" style="background:${escA(x.color || "#93b4ff")}"></span><b>${escA(plain(x.title))}</b><small>${(x.path || []).length ? x.path.length + " steps" : (x.nodes || []).length + " boxes"}</small></div>`).join("")}</div>
      <button type="button" class="mini" id="addP">+ Add a persona</button>${P.length ? "" : `<p class="ed-note">Personas appear as a tab with a list; clicking one numbers its path through the map.</p>`}`);
    p.querySelectorAll(".item").forEach(it => it.onclick = () => { const i = +it.dataset.i; showPersona(i); select({ kind: "persona", i }); });
    p.querySelector("#addP").onclick = () => {
      const colors = ["#60a5fa", "#2dd4bf", "#f43f5e", "#a78bfa", "#f59e0b", "#94a3b8"];
      change(r => { r.personas ||= []; r.personas.push({ id: uid("persona", new Set(r.personas.map(x => x.id))), title: "New persona", sub: "What they want", color: colors[r.personas.length % colors.length], text: "", path: [] }); });
      const i = own().personas.length - 1; showPersona(i); select({ kind: "persona", i }); startPick("persona", i, "path");
    };
  }
  function showPersona(i) {
    const cur = BD.current;
    cur.endTour();
    if (cur.spec.lenses.some(l => l.id === "personas")) cur.setLens("personas");
    else cur.openList("personas");
    setTimeout(() => { const b = document.querySelectorAll("#panel .stage")[i]; b && b.click(); }, 30);
  }
  function pPersona() {
    const x = () => (own().personas || [])[sel.i];
    if (!x()) return select({ kind: "personas" });
    const p = paint(head("Persona", escA(plain(x().title)), `<button type="button" class="mini" id="back">← Personas</button><button type="button" class="mini danger" id="del">Delete</button>`) +
      section("Persona", fields([["tag", "Tag", "text", { ph: "e.g. A1" }], ["title", "Name"], ["sub", "What they want"], ["text", "Text", "area"], ["color", "Colour", "color"], ["icon", "Icon", "icon"]], x, "p" + sel.i)) +
      section("On the map", fields([["zone", "Also show as a box in", "select", { options: [["", "Only in the Personas tab"], ...(own().zones || []).map(z => [z.id, plain(z.title)])], hint: "Put personas next to the applications they use. Clicking the box shows their path." }], ["boxSub", "Short subtitle on the box", "text", { ph: "e.g. Runs the platform" }]], x, "p" + sel.i)) +
      section("Path through the map", chips(x().path, "path") + pickBtn("persona", sel.i, "path") + `<small>Click boxes in order; each one gets a number on the map.</small>`) +
      section("Also highlight", chips(x().nodes, "nodes") + pickBtn("persona", sel.i, "nodes")));
    wire(p, x, "p" + sel.i);
    const lists = p.querySelectorAll(".chips-ed");
    wireChips(lists[0].parentElement, () => x().path, v => (x().path = v));
    wireChips(lists[1].parentElement, () => x().nodes, v => (x().nodes = v));
    p.querySelector("#back").onclick = () => select({ kind: "personas" });
    p.querySelector("#del").onclick = e => { if (!confirmInline(e.target, "Click again to delete")) return; const i = sel.i; change(r => r.personas.splice(i, 1)); select({ kind: "personas" }); };
    wirePick(p);
  }

  /* picking boxes on the map for a tab, step or persona */
  const pickBtn = (kind, ref, field) => `<button type="button" class="mini${pick && pick.kind === kind && pick.ref === ref && pick.field === field ? " primary" : ""}" data-pick="${kind}|${ref}|${field}">${pick && pick.kind === kind && pick.ref === ref && pick.field === field ? "Done picking" : field === "path" ? "Pick the path on the map…" : "Pick boxes on the map…"}</button>`;
  function startPick(kind, ref, field) { pick = { kind, ref, field }; keep(); render(); }
  function wirePick(p) {
    p.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
      const [kind, ref, field] = b.dataset.pick.split("|"), r = kind === "lens" ? ref : +ref;
      pick = pick && pick.kind === kind && pick.ref === r && pick.field === field ? null : { kind, ref: r, field };
      keep(); render();
    });
  }
  function pickTarget() {
    if (!pick) return null;
    if (pick.kind === "lens") return lensRaw(pick.ref);
    if (pick.kind === "step") return (own().tour || [])[pick.ref];
    if (pick.kind === "persona") return (own().personas || [])[pick.ref];
    return null;
  }
  function togglePick(id) {
    const f = pick.field;
    change(() => { const t = pickTarget(); if (!t) return; const a = t[f] || []; t[f] = a.includes(id) ? a.filter(x => x !== id) : [...a, id]; }, "");
    if (pick.kind === "persona") showPersona(pick.ref);
    keep(); render();
  }
  function wireChips(root, get, setV) {
    root.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { change(() => setV((get() || []).filter(x => x !== b.dataset.rm)), ""); keep(); render(); });
  }

  /* check */
  function pCheck() {
    const rep = BD.report || { errors: [], warnings: [] };
    const p = paint(head("Check", "Problems the build and the browser found") +
      section(`Errors (${rep.errors.length})`, rep.errors.length ? `<ul class="issues">${rep.errors.map(x => `<li class="err">${escA(x)}</li>`).join("")}</ul>` : `<p class="ed-note ok">None.</p>`) +
      section(`Warnings (${rep.warnings.length})`, rep.warnings.length ? `<ul class="issues">${rep.warnings.map(x => `<li>${link(x)}</li>`).join("")}</ul>` : `<p class="ed-note ok">None.</p>`) +
      section("Every view on this screen", `<button type="button" class="mini" id="runAll">Check all tabs and tour steps</button><div id="viewIssues"></div>`));
    p.querySelectorAll("[data-goto]").forEach(a => a.onclick = () => { const [k, id] = a.dataset.goto.split(":"); select({ kind: k, id }); });
    p.querySelector("#runAll").onclick = () => {
      const cur = BD.current, keepS = cur.snapshot(), out = [];
      cur.spec.lenses.forEach(l => { cur.endTour(); cur.setLens(l.id, false); cur.runCheck().forEach(x => out.push(["tab " + plain(l.title), x])); });
      const n = (cur.spec.tour || []).reduce((s, st) => s + (st.roadmap ? ((cur.spec.roadmap || {}).phases || []).length : 1), 0);
      for (let i = 0; i < n; i++) { cur.goStepNow(i); cur.runCheck().forEach(x => out.push(["step " + (i + 1), x])); }
      cur.endTour(); cur.restore(keepS);
      document.body.classList.remove("check");
      $("viewIssues").innerHTML = out.length ? `<ul class="issues">${out.map(([v, x]) => `<li><b>${escA(v)}</b>: ${x.node ? `<a data-goto="node:${escA(x.node)}">${escA(x.node)}</a> ` : x.zone ? `<a data-goto="zone:${escA(x.zone)}">${escA(x.zone)}</a> ` : ""}${escA(x.problem)}${x.edge ? " (" + escA(x.edge) + ")" : ""}</li>`).join("")}</ul>` : `<p class="ed-note ok">Nothing cut off, covered or too small.</p>`;
      $("viewIssues").querySelectorAll("[data-goto]").forEach(a => a.onclick = () => { const [k, id] = a.dataset.goto.split(":"); select({ kind: k, id }); });
    };
  }
  // turn "node 'x'" / "zone 'y'" mentions into links
  const link = s => escA(s).replace(/(node|zone) '([\w-]+)'/g, (m, k, id) => `${k} <a data-goto="${k}:${id}">${id}</a>`);
  function updateCounts() {
    const n = $("ed-n");
    if (!n || !BD.report) return;
    const c = BD.report.errors.length + BD.report.warnings.length;
    n.textContent = c ? c : "";
    n.className = BD.report.errors.length ? "err" : c ? "warn" : "";
  }

  /* ------------------------------------------------------------ dragging boxes */
  let dragS = null;
  function startDrag(e, id) {
    if (!ed.active || e.button !== 0 || pick || connectFrom) return;
    e.stopPropagation();
    const cur = BD.current, n = cur.nodeById[id], w0 = cur.toWorld(e.clientX, e.clientY);
    dragS = { id, sx: e.clientX, sy: e.clientY, dx: w0.x - n.x, dy: w0.y - n.y, ghost: null, zone: null };
    addEventListener("pointermove", moveDrag);
    addEventListener("pointerup", endDrag, { once: true });
  }
  function zoneAt(wx, wy) {
    return BD.current.spec.zones.filter(z => wx >= z.x && wx <= z.x + z.w && wy >= z.y && wy <= z.y + z.h).sort((a, b) => a.w * a.h - b.w * b.h)[0] || null;
  }
  function moveDrag(e) {
    if (!dragS) return;
    const cur = BD.current;
    if (!dragS.ghost) {
      if (Math.hypot(e.clientX - dragS.sx, e.clientY - dragS.sy) < 5) return;
      const el = cur.nodeById[dragS.id].el;
      const g = el.cloneNode(true);
      g.classList.add("ed-ghost"); g.classList.remove("ed-sel");
      Object.assign(g.style, { position: "fixed", left: "0px", top: "0px", transformOrigin: "0 0", zIndex: 80, pointerEvents: "none" });
      document.body.appendChild(g);
      el.classList.add("ed-dragging");
      dragS.ghost = g;
    }
    const w = cur.toWorld(e.clientX, e.clientY);
    dragS.ghost.style.transform = `translate(${e.clientX - dragS.dx * cur.cam.s}px, ${e.clientY - dragS.dy * cur.cam.s}px) scale(${cur.cam.s})`;
    const z = zoneAt(w.x, w.y);
    document.querySelectorAll(".zone.ed-drop").forEach(x => x.classList.remove("ed-drop"));
    if (z) cur.zoneById[z.id].el.classList.add("ed-drop");
    dragS.zone = z; dragS.w = w;
  }
  function endDrag() {
    removeEventListener("pointermove", moveDrag);
    const d = dragS;
    dragS = null;
    if (!d || !d.ghost) return;
    d.ghost.remove();
    document.querySelectorAll(".ed-drop, .ed-dragging").forEach(x => x.classList.remove("ed-drop", "ed-dragging"));
    ed.justDragged = true;
    setTimeout(() => (ed.justDragged = false), 50);
    if (!d.zone) return;
    const cur = BD.current, raw = nodeRaw(d.id);
    if (!raw) return;
    if (raw.x !== undefined && raw.y !== undefined) {
      change(() => { raw.zone = d.zone.id; raw.x = Math.round((d.w.x - d.dx) / 10) * 10; raw.y = Math.round((d.w.y - d.dy) / 10) * 10; }, "");
    } else {
      // automatic layout: the drop point decides the position in the area's order
      const others = cur.spec.nodes.filter(n => n.zone === d.zone.id && n.id !== d.id);
      const before = others.filter(n => n.y + n.h / 2 < d.w.y - n.h / 2 || (Math.abs(n.y + n.h / 2 - d.w.y) <= n.h / 2 + 8 && n.x + n.w / 2 < d.w.x)).length;
      change(r => {
        const i = r.nodes.indexOf(raw);
        r.nodes.splice(i, 1);
        raw.zone = d.zone.id;
        const idx = r.nodes.map((n, k) => n.zone === d.zone.id ? k : -1).filter(k => k >= 0);
        const at = before < idx.length ? idx[before] : idx.length ? idx[idx.length - 1] + 1 : r.nodes.length;
        r.nodes.splice(at, 0, raw);
      }, "");
    }
    if (sel.kind === "node" && sel.id === d.id) { keep(); render(); }
  }

  /* ------------------------------------------------------------ keys */
  addEventListener("keydown", e => {
    if (!ed.active) return;
    const inField = e.target.closest && e.target.closest("input, textarea, select");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !inField) { e.preventDefault(); e.shiftKey ? stepHistory(redo, undo) : stepHistory(undo, redo); }
    if (e.key === "Escape") {
      if (pick || connectFrom) { pick = null; connectFrom = null; keep(); render(); e.preventDefault(); }
      else if (!inField && !document.querySelector(".ed-icons")) toggle(false);
    }
  }, true);

  return Object.assign(ed, { toggle, select, mounted, render, share });
})();
