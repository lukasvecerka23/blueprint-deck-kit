#!/usr/bin/env node
// Prebuild step: puts the kit's runtime files into site/public/ so the site serves them.
// Runs before `npm run dev` and `npm run build`. Everything it writes is a build artifact (see site/.gitignore).
//
//   ../configurator/                            -> public/configurator/
//   ../examples/                                -> public/examples/
//   ../plugins/blueprint-deck/skills/blueprint-deck/blueprint-deck.html -> public/engine/blueprint-deck.html
//   _redirects                                  -> /install.sh and /install.ps1 go to the scripts on GitHub (one source);
//                                                  the skill downloads go to the latest GitHub release
//
// In the copied examples it also writes each deck's title, description and preview image (src/data/examples.json)
// into the head: a deck's own head only says "Blueprint Deck", and search engines and link previews read the head.
//
// The skill itself is never hosted here: releases live on GitHub (see CONTRIBUTING.md → Releasing). The install scripts
// download the latest published release (or --version) from there.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(SITE, "..");
const PUBLIC = join(SITE, "public");
const GITHUB = "https://github.com/lukasvecerka23/blueprint-deck-kit";
const IGNORE = new Set([".DS_Store", "Thumbs.db", ".git", "node_modules"]);

let warnings = 0;
const log = msg => console.log(`[sync] ${msg}`);
const warn = msg => { warnings++; console.warn(`[sync] WARN ${msg}`); };

function copyDir(from, to) {
  const src = join(REPO, from), dest = join(PUBLIC, to);
  rmSync(dest, { recursive: true, force: true });
  if (!existsSync(src)) return warn(`${from} not found, skipped`);
  cpSync(src, dest, { recursive: true, filter: s => !IGNORE.has(s.split(sep).pop()) });
  log(`${from} -> public/${to}`);
}
function copyFile(from, to) {
  const src = join(REPO, from), dest = join(PUBLIC, to);
  rmSync(dest, { force: true });
  if (!existsSync(src)) return warn(`${from} not found, skipped`);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  log(`${from} -> public/${to}`);
}

mkdirSync(PUBLIC, { recursive: true });
copyDir("configurator", "configurator");
copyDir("examples", "examples");
const URL_BASE = "https://blueprintdeck.dev";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
for (const e of JSON.parse(readFileSync(join(SITE, "src/data/examples.json"), "utf8"))) {
  const file = join(PUBLIC, "examples", e.slug, "index.html");
  if (!existsSync(file)) { warn(`examples/${e.slug}/index.html not found`); continue; }
  const html = readFileSync(file, "utf8");
  const title = `${e.title}: a Blueprint Deck example`, url = `${URL_BASE}/examples/${e.slug}/`;
  const image = existsSync(join(PUBLIC, "shots", `${e.slug}.jpg`)) ? `${URL_BASE}/shots/${e.slug}.jpg` : `${URL_BASE}/og.jpg`;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(e.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Blueprint Deck Kit">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(e.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join("\n");
  if (!html.includes("<title>Blueprint Deck</title>")) { warn(`examples/${e.slug}: no default <title>, head left as it is`); continue; }
  writeFileSync(file, html.replace("<title>Blueprint Deck</title>", () => head));
}
log("examples: titles, descriptions and preview images written into their heads");
copyFile("plugins/blueprint-deck/skills/blueprint-deck/blueprint-deck.html", "engine/blueprint-deck.html");
// leftovers from earlier setups: the site used to copy the install scripts and host the releases
for (const f of ["install.sh", "install.ps1", "releases", "version.json", "blueprint-deck-skill.zip", "blueprint-deck-skill.tar.gz"]) rmSync(join(PUBLIC, f), { recursive: true, force: true });

// Cloudflare Pages redirects: the short install URLs, the skill downloads and the version list all live on GitHub
// (curl -L and PowerShell's irm follow redirects)
const RAW = "https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main";
writeFileSync(join(PUBLIC, "_redirects"), [
  `/install.sh ${RAW}/install.sh 302`,
  `/install.ps1 ${RAW}/install.ps1 302`,
  `/blueprint-deck-skill.zip ${GITHUB}/releases/latest/download/blueprint-deck-skill.zip 302`,
  `/blueprint-deck-skill.tar.gz ${GITHUB}/releases/latest/download/blueprint-deck-skill.tar.gz 302`,
  `/releases ${GITHUB}/releases 302`,
  `/releases/* ${GITHUB}/releases 302`,
  // some tools only look for /sitemap.xml; Astro writes sitemap-index.xml
  `/sitemap.xml /sitemap-index.xml 301`,
].join("\n") + "\n");
log(`public/_redirects -> skill downloads from ${GITHUB}/releases`);
log(warnings ? `done with ${warnings} warning(s)` : "done");
