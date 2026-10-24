#!/usr/bin/env node
// Optional helper (Node 18+, nothing to install): moves diagram JSON in and out of a Blueprint Deck file.
//
//   node insert.mjs data.json diagrams/index.html     new file: the engine + this data (overwrites index.html)
//   node insert.mjs --upgrade diagrams/index.html     put the newest engine into an existing file, keep its data
//   node insert.mjs --extract diagrams/index.html [data.json]   print (or write) the file's data as JSON
//   node insert.mjs --read-only diagrams/index.html [out.html]  a copy to send: no editor, editing off
//                                                                (default name: <title>.html next to the file)
//
// Without Node, do the same by hand: copy blueprint-deck.html and replace the placeholder line with the JSON.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "blueprint-deck.html");
const OPEN = '<script type="application/json" id="bd-data">';
const dataOf = html => {
  const a = html.indexOf(OPEN);
  if (a < 0) throw new Error("no diagram data block in this file");
  return html.slice(a + OPEN.length, html.indexOf("</script>", a)).trim();
};
const withData = (html, json) => {
  const a = html.indexOf(OPEN), b = html.indexOf("</script>", a);
  return html.slice(0, a) + OPEN + "\n" + json + "\n" + html.slice(b);
};
// pretty JSON, and "</" escaped so text can't end the script block
const fmt = obj => JSON.stringify(obj, null, 1).replace(/<\//g, "<\\/");

const [a1, a2, a3] = process.argv.slice(2);
try {
  if (a1 === "--upgrade") {
    const data = JSON.parse(dataOf(fs.readFileSync(a2, "utf8")));
    fs.writeFileSync(a2, withData(fs.readFileSync(ENGINE, "utf8"), fmt(data)));
    console.log(`${a2}: engine upgraded, data kept`);
  } else if (a1 === "--read-only") {
    const html = fs.readFileSync(a2, "utf8");
    const data = JSON.parse(dataOf(html));
    data.settings = { ...(data.settings || {}), editor: false };
    if (Array.isArray(data.diagrams)) data.diagrams.forEach(x => { if (x.settings && "editor" in x.settings) x.settings.editor = false; });
    if (!html.includes("/*BD-EDITOR-START*/")) throw new Error("this file's engine is too old to strip the editor; run --upgrade first");
    const out = withData(html, fmt(data))
      .replace(/\/\*BD-EDITOR-START\*\/[\s\S]*?\/\*BD-EDITOR-END\*\//, "")
      .replace(/\/\*BD-EDITOR-CSS-START\*\/[\s\S]*?\/\*BD-EDITOR-CSS-END\*\//, "");
    const slug = String((data.meta || {}).title || "diagram").replace(/<[^>]+>/g, "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "diagram";
    let dest = a3 || path.join(path.dirname(a2), slug + ".html");
    if (path.resolve(dest) === path.resolve(a2)) dest = dest.replace(/\.html?$/i, "") + "-readonly.html";
    fs.writeFileSync(dest, out);
    console.log(`wrote ${dest} (read-only, ${Math.round(out.length / 1024)} KB)`);
  } else if (a1 === "--extract") {
    const json = fmt(JSON.parse(dataOf(fs.readFileSync(a2, "utf8")))).replace(/<\\\//g, "</");
    if (a3) { fs.writeFileSync(a3, json + "\n"); console.log(`wrote ${a3}`); } else process.stdout.write(json + "\n");
  } else if (a1 && a2) {
    const data = JSON.parse(fs.readFileSync(a1, "utf8"));
    fs.mkdirSync(path.dirname(path.resolve(a2)), { recursive: true });
    fs.writeFileSync(a2, withData(fs.readFileSync(ENGINE, "utf8"), fmt(data)));
    console.log(`wrote ${a2}; check it with: node ${path.join(path.dirname(fileURLToPath(import.meta.url)), "check.mjs")} ${a2}`);
  } else {
    console.error("usage: node insert.mjs <data.json> <out.html> | --upgrade <file.html> | --extract <file.html> [out.json] | --read-only <file.html> [out.html]");
    process.exit(2);
  }
} catch (e) { console.error("error: " + e.message); process.exit(1); }
