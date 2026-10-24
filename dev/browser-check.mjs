// Dev/CI: opens diagram files in headless Chromium and runs the screen check on every view
// (each diagram's tabs, tour steps, list items and sheets). Needs `npm install --no-save playwright` + a Chromium.
//   node dev/browser-check.mjs examples/*/index.html [--strict]
// Fails on data errors, console errors and screen problems (with --strict also on data warnings).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const files = process.argv.slice(2).filter(f => !f.startsWith("--"));
const strict = process.argv.includes("--strict");
// sheets with many cards are allowed to scroll; everything else must fit
const ALLOWED = [/taller than the window/];

const root = process.cwd();
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
// BD_BROWSER_CHANNEL=chrome uses an installed Google Chrome instead of the downloaded Chromium
const browser = await chromium.launch(process.env.BD_BROWSER_CHANNEL ? { channel: process.env.BD_BROWSER_CHANNEL } : {});
let failed = 0;

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const consoleErrors = [];
  page.on("console", m => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", e => consoleErrors.push(String(e)));
  await page.goto(base + file + "#lens=overview");
  await page.waitForFunction(() => window.__diagramReady === true, null, { timeout: 15000 }).catch(() => {});
  // every view of every diagram, computed in the page
  const views = await page.evaluate(() => {
    const out = [];
    const list = BD.entries();
    list.forEach((d, i) => {
      const pre = BD.multi() ? `d=${d.id}&` : "";
      const r = BDCore.resolve(d.raw, { icons: BD.ICON_NAMES });
      if (!r.spec) { out.push({ hash: pre + "lens=overview", label: d.id }); return; }
      const s = r.spec;
      s.lenses.forEach(l => out.push({ hash: pre + "lens=" + l.id, label: `${d.id} tab ${l.id}` }));
      const n = (s.tour || []).reduce((k, st) => k + (st.roadmap ? ((s.roadmap || {}).phases || []).length : 1), 0);
      for (let t = 1; t <= n; t++) out.push({ hash: pre + "tour=" + t, label: `${d.id} step ${t}` });
      Object.entries(s.lists || {}).forEach(([id, L]) => (L.items || []).forEach((_, k) => out.push({ hash: `${pre}list=${id}&item=${k + 1}`, label: `${d.id} ${id} #${k + 1}` })));
      (s.overlays || []).forEach(o => out.push({ hash: pre + "overlay=" + o.id, label: `${d.id} sheet ${o.id}` }));
    });
    return out;
  });
  const problems = [];
  let dataIssues = null;
  for (const v of views) {
    await page.evaluate(h => { location.hash = "x=" + Math.random(); location.hash = h + "&check"; }, v.hash);
    await page.waitForFunction(() => window.__diagramReady === true, null, { timeout: 15000 }).catch(() => problems.push(`${v.label}: never settled`));
    const res = await page.evaluate(() => ({ check: window.__diagramCheck || [], issues: window.__diagramIssues }));
    res.check.filter(x => !ALLOWED.some(a => a.test(x.problem))).forEach(x => problems.push(`${v.label}: ${x.node || x.zone || x.edge || x.view || ""} ${x.problem}`));
    if (res.issues && (res.issues.errors.length || (strict && res.issues.warnings.length))) dataIssues = res.issues;
  }
  const bad = problems.length || consoleErrors.length || dataIssues;
  console.log(`${bad ? "FAIL" : "ok  "}  ${file}  (${views.length} views)`);
  // the same problem in many views is reported once, with the views it shows up in
  const grouped = new Map();
  problems.forEach(p => { const i = p.indexOf(": "), view = p.slice(0, i), what = p.slice(i + 2); if (!grouped.has(what)) grouped.set(what, []); grouped.get(what).push(view); });
  for (const [what, views] of grouped) console.log(`      screen  ${what}  [${views.length > 3 ? views.slice(0, 3).join(", ") + ` +${views.length - 3} more` : views.join(", ")}]`);
  consoleErrors.forEach(e => console.log("      console " + e));
  if (dataIssues) [...dataIssues.errors, ...(strict ? dataIssues.warnings : [])].forEach(e => console.log("      data    " + e));
  if (bad) failed = 1;
  await page.close();
}
await browser.close();
server.close();
process.exit(failed);
