// Dev only (users never run this): assembles engine/src into the single engine file the skill copies for every diagram.
//   node dev/assemble.mjs                         → plugins/blueprint-deck/skills/blueprint-deck/blueprint-deck.html (empty engine)
//   node dev/assemble.mjs --upgrade a.html b.html → put the current engine into existing diagrams, keeping their data
//   node dev/assemble.mjs --from-json d.json out.html [--minify-data]
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const src = f => fs.readFileSync(path.join(root, "engine/src", f), "utf8");
const VERSION = src("core.js").match(/VERSION = "([^"]+)"/)[1];

const core = src("icons.js") + "\n" + src("core.js").replace(/^if \(typeof module.*$/m, "");
const js = [
  "/*BD-CORE-START*/", core, "/*BD-CORE-END*/",
  // the editor sits between markers, so a read-only copy can leave it out (boot.js: readOnlyHtml, tools/insert.mjs --read-only)
  src("render.js"), src("boot.js"), "/*BD-EDITOR-START*/", src("editor.js"), "/*BD-EDITOR-END*/",
  "if (BD) BD.start();",
].join("\n").replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
const css = src("engine.css") + "\n/*BD-EDITOR-CSS-START*/\n" + src("editor.css") + "\n/*BD-EDITOR-CSS-END*/";
const OPEN = '<script type="application/json" id="bd-data">';

export function page(dataJson) {
  return src("template.html")
    .replace(/__VERSION__/g, VERSION)
    .replace("__CSS__", () => css)
    .replace("__JS__", () => js)
    .replace("__DATA__", () => dataJson.replace(/<\//g, "<\\/"));
}
export function dataOf(html) {
  const a = html.indexOf(OPEN);
  if (a < 0) throw new Error("no bd-data block");
  return html.slice(a + OPEN.length, html.indexOf("</script>", a)).trim();
}
const fmt = obj => JSON.stringify(obj, null, 1);

const args = process.argv.slice(2);
if (args[0] === "--upgrade") {
  for (const f of args.slice(1)) {
    const data = JSON.parse(dataOf(fs.readFileSync(f, "utf8")));
    fs.writeFileSync(f, page(fmt(data)));
    console.log("upgraded", f);
  }
} else if (args[0] === "--from-json") {
  const data = JSON.parse(fs.readFileSync(args[1], "utf8"));
  fs.writeFileSync(args[2], page(fmt(data)));
  console.log("wrote", args[2]);
} else {
  // the installed skill and its zip carry the licence and the third-party notices
  for (const f of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) fs.copyFileSync(path.join(root, f), path.join(root, "plugins/blueprint-deck/skills/blueprint-deck", f));
  // the installed skill knows its version (install.sh, the update check in SKILL.md)
  fs.writeFileSync(path.join(root, "plugins/blueprint-deck/skills/blueprint-deck/VERSION"), VERSION + "\n");
  // the plugin manifests (Claude Code; Codex and the ChatGPT desktop app) carry the same version: plugin updates
  // reach users only when it changes
  for (const m of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
    const file = path.join(root, "plugins/blueprint-deck", m);
    const plugin = JSON.parse(fs.readFileSync(file, "utf8"));
    if (plugin.version !== VERSION) { plugin.version = VERSION; fs.writeFileSync(file, JSON.stringify(plugin, null, 2) + "\n"); }
  }
  const out = path.join(root, "plugins/blueprint-deck/skills/blueprint-deck/blueprint-deck.html");
  fs.writeFileSync(out, page('{ "blueprintDeck": "empty" }'));
  console.log(`engine ${VERSION} → ${path.relative(root, out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}
