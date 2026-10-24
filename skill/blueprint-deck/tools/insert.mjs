#!/usr/bin/env node
// Optional helper (Node 18+, nothing to install): moves diagram JSON in and out of a Blueprint Deck file.
//
//   node insert.mjs data.json diagrams/index.html     new file: the engine + this data (overwrites index.html)
//   node insert.mjs --upgrade diagrams/index.html     put the newest engine into an existing file, keep its data
//   node insert.mjs --extract diagrams/index.html [data.json]   print (or write) the file's data as JSON
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
  } else if (a1 === "--extract") {
    const json = fmt(JSON.parse(dataOf(fs.readFileSync(a2, "utf8")))).replace(/<\\\//g, "</");
    if (a3) { fs.writeFileSync(a3, json + "\n"); console.log(`wrote ${a3}`); } else process.stdout.write(json + "\n");
  } else if (a1 && a2) {
    const data = JSON.parse(fs.readFileSync(a1, "utf8"));
    fs.mkdirSync(path.dirname(path.resolve(a2)), { recursive: true });
    fs.writeFileSync(a2, withData(fs.readFileSync(ENGINE, "utf8"), fmt(data)));
    console.log(`wrote ${a2}; check it with: node ${path.join(path.dirname(fileURLToPath(import.meta.url)), "check.mjs")} ${a2}`);
  } else {
    console.error("usage: node insert.mjs <data.json> <out.html> | --upgrade <file.html> | --extract <file.html> [out.json]");
    process.exit(2);
  }
} catch (e) { console.error("error: " + e.message); process.exit(1); }
