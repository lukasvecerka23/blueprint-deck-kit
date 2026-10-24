/* Blueprint Deck shell: reads the diagram data from this file, restores unsaved edits, mounts the diagram (or the
   switcher for several), and saves: into the file itself (Chrome, Edge), in this browser, or as a downloaded copy. */
const BD = (() => {
  // the page as it was loaded, used as the template when saving (taken before anything is rendered)
  const SOURCE = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  const dataEl = document.getElementById("bd-data");
  const FILE_JSON = dataEl ? dataEl.textContent.trim() : "";
  const ICON_NAMES = [...Object.keys(ICONS), ...Object.keys(ICON_ALIASES)];
  const $ = id => document.getElementById(id);
  const escH = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const hasEditor = () => typeof BDEditor !== "undefined";
  const hashStr = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const canon = d => JSON.stringify(d);
  const fileName = () => decodeURIComponent(location.pathname.split("/").pop() || "") || "diagram.html";

  /* ------------------------------------------------------------ messages */
  function message(title, html) {
    const m = $("msg");
    m.innerHTML = `<div class="card"><h1>${title}</h1>${html}</div>`;
    m.classList.add("open");
    return m;
  }
  let toastTimer = 0;
  function toast(html, buttons = [], ms = 0) {
    const t = $("toast");
    t.innerHTML = `<span>${html}</span>` + buttons.map((b, i) => `<button class="btn${b.primary ? " primary" : ""}" data-i="${i}">${b.label}</button>`).join("");
    t.querySelectorAll("[data-i]").forEach(el => el.onclick = () => { closeToast(); buttons[+el.dataset.i].fn(); });
    t.classList.add("open");
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(closeToast, ms);
  }
  const closeToast = () => $("toast").classList.remove("open");

  /* ------------------------------------------------------------ data */
  let DATA = null;
  try { DATA = FILE_JSON ? JSON.parse(FILE_JSON) : null; }
  catch (e) {
    const m = String(e.message).match(/position (\d+)/), pos = m ? +m[1] : -1;
    const line = pos >= 0 ? FILE_JSON.slice(0, pos).split("\n").length : "?";
    message("The diagram data is not valid JSON", `<p>Line ${line} of the data block at the top of this file: <code>${escH(e.message)}</code></p><p>Fix the JSON (a missing comma or quote, usually) and reload.</p>`);
    return null;
  }
  const EMPTY = !DATA || DATA.blueprintDeck === "empty";

  /* ------------------------------------------------------------ edits kept in this browser */
  const KEY = "blueprint-deck:" + location.pathname;
  const BASE = hashStr(FILE_JSON);
  const local = {
    read() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } },
    write(data) { try { localStorage.setItem(KEY, JSON.stringify({ data, base: BASE, at: Date.now() })); return true; } catch { return false; } },
    clear() { try { localStorage.removeItem(KEY); } catch { /* private mode */ } },
  };
  const when = t => new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  /* ------------------------------------------------------------ saving into the file (File System Access API) */
  const FS = "showSaveFilePicker" in window;
  const idb = (mode, fn) => new Promise((res, rej) => {
    const r = indexedDB.open("blueprint-deck", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("handles");
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const tx = r.result.transaction("handles", mode), q = fn(tx.objectStore("handles")); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); };
  });
  let handle = null, template = SOURCE, fileState = "none"; // none | ready | needs-permission
  const serialize = data => {
    const json = JSON.stringify(data, null, 1).replace(/<\//g, "<\\/");
    const open = '<script type="application/json" id="bd-data">';
    const a = template.indexOf(open), b = template.indexOf("</script>", a);
    return template.slice(0, a) + open + "\n" + json + "\n" + template.slice(b);
  };
  async function loadHandle() {
    if (!FS) return;
    try {
      handle = await idb("readonly", s => s.get(KEY)) || null;
      if (handle) fileState = (await handle.queryPermission({ mode: "readwrite" })) === "granted" ? "ready" : "needs-permission";
    } catch { handle = null; }
  }
  async function useTemplateOf(h) {
    try { const t = await (await h.getFile()).text(); if (t.includes('id="bd-data"')) template = t; } catch { /* keep SOURCE */ }
  }
  async function connectFile() {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: fileName(), types: [{ description: "Blueprint Deck (HTML)", accept: { "text/html": [".html", ".htm"] } }] });
      handle = h; fileState = "ready";
      await useTemplateOf(h);
      try { await idb("readwrite", s => s.put(h, KEY)); } catch { /* not persisted: ask again next time */ }
      return writeFile();
    } catch (e) { if (e.name !== "AbortError") toast("Couldn't open the file for saving: " + escH(e.message), [], 5000); return false; }
  }
  async function resumeFile() {
    if (!handle) return connectFile();
    try {
      if ((await handle.requestPermission({ mode: "readwrite" })) !== "granted") return false;
      fileState = "ready";
      await useTemplateOf(handle);
      return writeFile();
    } catch { return connectFile(); }
  }
  let saving = Promise.resolve(), dirty = false;
  async function writeFile() {
    if (!handle || fileState !== "ready") return false;
    saving = saving.then(async () => {
      const w = await handle.createWritable();
      await w.write(serialize(DATA));
      await w.close();
    });
    try { await saving; dirty = false; local.clear(); status(); return true; }
    catch (e) { fileState = "needs-permission"; status(); toast("Saving to the file failed: " + escH(e.message), [], 5000); return false; }
  }
  function download(name = fileName(), html = serialize(DATA)) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ------------------------------------------------------------ copies to send: editable, or read-only (no editor at all) */
  const slug = s => BDCore.stripTags(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const suggestName = () => (slug((DATA.meta || {}).title) || fileName().replace(/\.html?$/i, "")) + ".html";
  // the read-only copy: editing switched off and the editor's code and styles cut out of the file
  function readOnlyHtml() {
    const d = JSON.parse(JSON.stringify(DATA));
    d.settings = { ...(d.settings || {}), editor: false };
    if (Array.isArray(d.diagrams)) d.diagrams.forEach(x => { if (x.settings && "editor" in x.settings) x.settings.editor = false; });
    return serialize(d)
      .replace(/\/\*BD-EDITOR-START\*\/[\s\S]*?\/\*BD-EDITOR-END\*\//, "")
      .replace(/\/\*BD-EDITOR-CSS-START\*\/[\s\S]*?\/\*BD-EDITOR-CSS-END\*\//, "");
  }
  function exportCopy({ name, readOnly }) {
    name = (name || suggestName()).trim();
    if (!/\.html?$/i.test(name)) name += ".html";
    const html = readOnly ? readOnlyHtml() : serialize(DATA);
    // a plain download under the name from the dialog (no second "Save as" dialog from the system)
    download(name, html);
    toast(`Downloaded ${escH(name)}${readOnly ? " (read-only)" : ""}`, [], 3500);
    return true;
  }
  let saveTimer = 0;
  // every edit: kept in this browser at once, and written into the file shortly after (when allowed)
  function persist() {
    dirty = true;
    local.write(DATA);
    clearTimeout(saveTimer);
    if (fileState === "ready") saveTimer = setTimeout(writeFile, 600);
    status();
  }
  const statusListeners = [];
  function status() {
    const s = !dirty ? (handle && fileState === "ready" ? "file" : "clean") : fileState === "ready" ? "saving" : "browser";
    statusListeners.forEach(f => f(s, { fs: FS, handle: !!handle, fileState }));
    return s;
  }

  /* ------------------------------------------------------------ mounting */
  const multi = () => !EMPTY && Array.isArray(DATA.diagrams);
  const entries = () => multi() ? BDCore.diagramsOf(DATA) : [{ id: "main", title: BDCore.stripTags((DATA.meta || {}).title), sub: "", index: 0, raw: DATA }];
  let current = null, curIndex = 0, report = { errors: [], warnings: [] };
  const host = {
    editing: () => !!(hasEditor() && BDEditor.active),
    onEdit: t => hasEditor() && BDEditor.select(t),
    dragged: () => !!(hasEditor() && BDEditor.justDragged),
    actions: (addBtn, icon) => {
      const b = addBtn(icon("ellipsis"), "icon-only", "More: edit, export");
      b.onclick = e => { e.stopPropagation(); moreMenu(b); };
    },
  };
  function moreMenu(anchor) {
    let m = $("more-menu");
    if (m) { m.remove(); return; }
    m = document.createElement("div");
    m.id = "more-menu"; m.className = "glass";
    const r = anchor.getBoundingClientRect();
    Object.assign(m.style, { position: "fixed", zIndex: 45, top: r.bottom + 8 + "px", right: innerWidth - r.right + "px", padding: "6px", borderRadius: "var(--r-ui)", display: "grid", gap: "2px", minWidth: "230px", background: "var(--glass-strong)" });
    const item = (label, key, fn) => `<button data-a="${fn}" style="display:flex;justify-content:space-between;gap:16px;border:0;background:transparent;padding:9px 10px;border-radius:var(--r-sm);cursor:pointer;text-align:left;font-size:13.5px"><span>${label}</span><kbd style="color:var(--muted);font:inherit;font-size:12px">${key}</kbd></button>`;
    const S = current && current.spec.settings;
    const canEdit = hasEditor() && !(S && S.editor === false);
    m.innerHTML = (canEdit ? item("Edit this diagram", "E", "edit") + item("Download a copy to share…", "", "share") : "") + item("Export a PDF deck", "P", "pdf") + item("Copy a link to this view", "", "link");
    m.querySelectorAll("button").forEach(b => {
      b.onmouseenter = () => (b.style.background = "rgba(var(--fg-rgb),.06)");
      b.onmouseleave = () => (b.style.background = "transparent");
      b.onclick = () => { m.remove(); ({ edit: () => BDEditor.toggle(true), share: () => BDEditor.share(), pdf: () => current.printDeck(), link: copyLink })[b.dataset.a](); };
    });
    document.body.appendChild(m);
    setTimeout(() => addEventListener("click", function off(ev) { if (!m.contains(ev.target)) { m.remove(); removeEventListener("click", off); } }), 0);
  }
  function copyLink() {
    const st = current.state, p = new URLSearchParams();
    if (multi()) p.set("d", entries()[curIndex].id);
    if (st.tour >= 0) p.set("tour", st.tour + 1); else if (st.lens !== current.spec.lenses[0].id) p.set("lens", st.lens);
    if (st.panel && current.nodeById[st.panel]) p.set("node", st.panel);
    const url = location.href.split("#")[0] + (p.toString() ? "#" + p : "");
    // a file opened from disk has a file:// address: the link works on this computer only
    const local = location.protocol === "file:";
    const note = local ? "<br><small>This file is opened from your disk, so the link works on this computer only. For a link others can open, host the file (see Sharing in the docs).</small>" : "";
    const done = () => toast("Link copied" + (local ? "" : ": " + escH(url.length > 70 ? "…" + url.slice(-60) : url)) + note, [], local ? 9000 : 3500);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, () => toast(escH(url) + note, [], 12000));
    else toast(escH(url) + note, [], 12000);
  }

  // several diagrams: the brand box becomes a switcher (click it, or press 1–9)
  function renderSwitcher(brand, lg) {
    const list = entries(), d = list[curIndex], meta = DATA.meta || {};
    brand.classList.add("switch");
    brand.innerHTML = `<div class="logo${lg.img ? " img" : ""}">${lg.html}</div><div class="txt"><div class="bt">${meta.title || ""}</div><div class="bs">${escH(d.title)}</div></div><span class="chev">▾</span>`;
    brand.title = "Switch diagram (1–" + Math.min(9, list.length) + ")";
    let menu = $("sw-menu");
    if (!menu) { menu = document.createElement("div"); menu.id = "sw-menu"; document.body.appendChild(menu); }
    menu.innerHTML = list.map((x, i) => `<button data-i="${i}" class="${i === curIndex ? "cur" : ""}"><span class="n">${i + 1}</span><span><b>${escH(x.title)}</b>${x.sub ? `<span class="s">${escH(x.sub)}</span>` : ""}</span></button>`).join("")
      + `<div class="hint">Keys 1–${Math.min(9, list.length)} switch diagrams</div>`;
    menu.querySelectorAll("[data-i]").forEach(b => b.onclick = e => { e.stopPropagation(); show(+b.dataset.i); });
    brand.onclick = e => { e.stopPropagation(); const open = !menu.classList.contains("open"); menu.classList.toggle("open", open); brand.classList.toggle("open", open); };
  }
  addEventListener("click", () => { const m = $("sw-menu"); if (m) { m.classList.remove("open"); $("brand").classList.remove("open"); } });

  function resolveEntry(i) {
    const e = entries()[i];
    const hero = multi() ? (DATA.hero === "all" || (DATA.hero !== "none" && i === 0)) : undefined;
    const r = BDCore.resolve(e.raw, { icons: ICON_NAMES, hero: hero === false ? false : undefined });
    return { e, r };
  }
  function mount(i, opts = {}) {
    const { e, r } = resolveEntry(i);
    report = r;
    window.__diagramIssues = { errors: r.errors, warnings: r.warnings, stats: r.stats };
    if (r.errors.length) console.warn("[diagram-errors]", JSON.stringify(r.errors));
    if (r.warnings.length) console.info("[diagram-warnings]", JSON.stringify(r.warnings));
    if (!r.spec || r.errors.length) {
      if (current && opts.restore) {
        // while editing, keep showing the last good version; the editor lists the errors
        statusListeners.forEach(f => f(null));
        return false;
      }
      if (!r.spec) { message("This diagram can't be shown", `<ul>${r.errors.map(x => `<li class="err">${escH(x)}</li>`).join("")}</ul>`); return false; }
    }
    if (current) current.destroy();
    curIndex = i;
    $("msg").classList.remove("open");
    const h = { ...host };
    if (multi()) { h.renderBrand = renderSwitcher; h.title = (DATA.meta || {}).title || e.title; }
    current = createDiagram(r.spec, h, opts);
    if (r.errors.length) toast(`${r.errors.length} error${r.errors.length > 1 ? "s" : ""} in this diagram (shown in the console${r.spec.settings.editor !== false ? " and the editor's Check tab" : ""})`, [], 6000);
    if (hasEditor() && BDEditor.active) BDEditor.mounted();
    return true;
  }
  function show(i, innerHash = "") {
    const list = entries();
    i = Math.max(0, Math.min(list.length - 1, i));
    mount(i, { hash: innerHash, intro: false, hero: false });
    history.replaceState(null, "", "#" + ["d=" + list[i].id, innerHash].filter(Boolean).join("&"));
  }
  function fromHash(first) {
    const p = new URLSearchParams(location.hash.slice(1));
    if (!multi()) {
      if (first) return mount(0);
      return current && current.applyHash(location.hash);
    }
    const list = entries(), id = p.get("d");
    let i = id ? list.findIndex(x => x.id === id) : -1;
    p.delete("d");
    if (first) return mount(i < 0 ? 0 : i, { hash: p.toString(), hero: i < 0 && !p.toString() ? undefined : false });
    if (i < 0) i = curIndex;
    if (i !== curIndex) show(i, p.toString());
    else current.applyHash(p.toString());
  }
  // after an edit: re-render the current diagram, keeping the view (tab, tour step, open panel, camera)
  function rerender(keepCam = true) {
    if (!current) return mount(curIndex);
    return mount(curIndex, { restore: current.snapshot(), keepCam, intro: false });
  }

  /* ------------------------------------------------------------ keys */
  addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const n = +e.key;
    if (multi() && n >= 1 && n <= Math.min(9, entries().length) && !(hasEditor() && BDEditor.active)) { show(n - 1); return; }
    if ((e.key === "e" || e.key === "E") && current && current.spec.settings.editor !== false && hasEditor()) { e.preventDefault(); BDEditor.toggle(); }
    if ((e.key === "p" || e.key === "P") && current) { e.preventDefault(); current.printDeck(); }
  });
  addEventListener("hashchange", () => fromHash(false));

  /* ------------------------------------------------------------ start */
  const starter = () => ({
    meta: { title: "New diagram", subtitle: "Press E to edit", type: "architecture", viewpoint: "product" },
    settings: { layout: { grid: { columns: [320, 320], rows: [260], gap: 40, origin: [60, 120] } } },
    zones: [{ id: "area-1", title: "First area", color: "#38bdf8", grid: [0, 0] }, { id: "area-2", title: "Second area", color: "#a78bfa", grid: [1, 0] }],
    nodes: [{ id: "box-1", zone: "area-1", title: "First box", sub: "What it does", icon: "box", what: "Describe it here." },
      { id: "box-2", zone: "area-2", title: "Second box", sub: "What it does", icon: "database", what: "Describe it here." }],
    edges: [{ from: "box-1", to: "box-2", groups: ["main"], label: "uses" }],
    lenses: [{ id: "overview", title: "Overview", color: "#e2e8f0" }],
  });
  // ?preview: a live preview inside the configurator, which sends { bdPreview: { theme, meta, settings } } messages.
  // Nothing is saved and the editor is off.
  const PREVIEW = /[?&]preview\b/.test(location.search);
  if (PREVIEW) addEventListener("message", e => {
    const p = e.data && e.data.bdPreview;
    if (!p || !DATA || EMPTY) return;
    const top = DATA;
    // the message carries the whole theme: missing, null or "" values fall back to the preset's
    if (p.theme) { top.theme = Object.fromEntries(Object.entries(p.theme).filter(([, v]) => v !== undefined && v !== null && v !== "")); if (multi()) DATA.diagrams.forEach(d => delete d.theme); }
    if (p.meta) top.meta = { ...(top.meta || {}), ...p.meta };
    if (p.settings) top.settings = BDCore.deepMerge(top.settings || {}, p.settings);
    rerender(true);
  });
  function start() {
    if (PREVIEW) {
      if (DATA && !EMPTY) { DATA.settings = BDCore.deepMerge(DATA.settings || {}, { editor: false, hero: false }); if (multi()) DATA.diagrams.forEach(d => { d.settings = BDCore.deepMerge(d.settings || {}, { editor: false, hero: false }); }); }
      fromHash(true);
      return;
    }
    if (EMPTY) {
      const m = message("Blueprint Deck", `<p>This file is the Blueprint Deck engine without a diagram yet.</p>
        <p>Ask your coding agent to generate one with the <code>/blueprint-deck</code> skill, or start one by hand here.</p>
        <p style="margin-top:18px"><button class="btn primary" id="startEmpty">Start an empty diagram</button></p>`);
      m.querySelector("#startEmpty").onclick = () => { DATA = starter(); persist(); mount(0, { hero: false }); BDEditor.toggle(true); };
      return;
    }
    // a read-only copy never picks up edits kept in this browser
    const locked = !hasEditor() || (DATA.settings || {}).editor === false;
    const stored = locked ? null : local.read();
    if (stored && stored.data) {
      if (canon(stored.data) === canon(DATA)) local.clear();
      else if (stored.base === BASE) {
        DATA = stored.data; dirty = true;
        setTimeout(() => toast(`Showing your unsaved edits from ${when(stored.at)}.`, [
          { label: "Save…", primary: true, fn: () => BDEditor.toggle(true) },
          { label: "Discard", fn: () => { local.clear(); DATA = JSON.parse(FILE_JSON); dirty = false; rerender(false); status(); } }]), 400);
      } else {
        setTimeout(() => toast(`This file changed after your edits from ${when(stored.at)}.`, [
          { label: "Use my edits", fn: () => { DATA = stored.data; dirty = true; rerender(false); status(); BDEditor.toggle(true); } },
          { label: "Discard them", fn: () => local.clear() }]), 400);
      }
    }
    fromHash(true);
    loadHandle().then(status);
  }

  return {
    get data() { return DATA; }, set data(d) { DATA = d; },
    get current() { return current; }, get index() { return curIndex; }, get report() { return report; },
    multi, entries, mount, show, rerender, persist, status, onStatus: f => statusListeners.push(f),
    connectFile, resumeFile, writeFile, download, serialize, exportCopy, suggestName, readOnlyHtml, toast, closeToast, fs: FS, get fileState() { return fileState; }, get hasHandle() { return !!handle; },
    ICON_NAMES, start, fileName,
  };
})();
