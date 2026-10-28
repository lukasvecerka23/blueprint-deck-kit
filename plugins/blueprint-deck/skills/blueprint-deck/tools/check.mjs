#!/usr/bin/env node
// Optional: validate a Blueprint Deck file from the command line (needs Node 18+; nothing to install).
// It runs the same checks the file runs when it opens in a browser, with the skill's own engine (engine-core.mjs),
// never with code from the checked file (which may come from anyone).
//
//   node check.mjs diagrams/index.html            errors, warnings, stats
//   node check.mjs diagrams/index.html --explain  + box positions, connections through boxes, what every view highlights
//
// Exit code 1 if there are errors.
import fs from "node:fs";
import { BDCore, ICONS, ICON_ALIASES } from "./engine-core.mjs";

const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error("usage: node check.mjs <diagram.html> [--explain]"); process.exit(2); }
const html = fs.readFileSync(file, "utf8");
const OPEN = '<script type="application/json" id="bd-data">';
const a = html.indexOf(OPEN);
if (a < 0) { console.error(`${file}: no diagram data block (${OPEN})`); process.exit(2); }
const raw = html.slice(a + OPEN.length, html.indexOf("</script>", a)).trim();
let data;
try { data = JSON.parse(raw); }
catch (e) {
  const m = String(e.message).match(/position (\d+)/);
  const line = m ? raw.slice(0, +m[1]).split("\n").length : "?";
  console.log(`ERROR  the diagram data is not valid JSON (data line ${line}): ${e.message}`);
  process.exit(1);
}
const c1 = html.indexOf("/*BD-CORE-START*/"), c2 = html.indexOf("/*BD-CORE-END*/");
if (c1 < 0 || c2 < 0) { console.error(`${file}: no engine found (is this a Blueprint Deck file?)`); process.exit(2); }
if (data.blueprintDeck === "empty") { console.log("empty engine file: no diagram yet"); process.exit(0); }
const fileVersion = (html.slice(c1, c2).match(/const VERSION = "([^"]+)"/) || [])[1] || "?";
console.log(`engine ${fileVersion}` + (fileVersion === BDCore.VERSION ? "" : ` (checked with ${BDCore.VERSION}; upgrade the file to get the same result in the browser)`));

const icons = [...Object.keys(ICONS), ...Object.keys(ICON_ALIASES)];
const list = BDCore.diagramsOf(data) || [{ id: "main", raw: data }];
let failed = 0;
const ids = new Set();
for (const d of list) {
  if (list.length > 1) { console.log(`\n== ${d.id}: ${d.title}`); if (ids.has(d.id)) { console.log("ERROR  duplicate diagram id"); failed = 1; } ids.add(d.id); }
  const r = BDCore.resolve(d.raw, { icons });
  r.errors.forEach(m => console.log("ERROR  " + m));
  r.warnings.forEach(m => console.log("WARN   " + m));
  if (r.stats) console.log(r.stats);
  console.log(`${r.errors.length} errors, ${r.warnings.length} warnings`);
  if (flags.includes("--explain") && r.spec) { console.log(""); BDCore.explain(r.spec).forEach(l => console.log(l)); }
  if (r.errors.length || !r.spec) failed = 1;
}
process.exit(failed);
