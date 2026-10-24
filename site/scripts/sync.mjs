#!/usr/bin/env node
// Prebuild step: puts the kit's runtime files into site/public/ so the site serves them.
// Runs before `npm run dev` and `npm run build`. Everything it writes is a build artifact (see site/.gitignore).
//
//   ../configurator/                            -> public/configurator/
//   ../examples/                                -> public/examples/
//   ../skill/blueprint-deck/blueprint-deck.html -> public/engine/blueprint-deck.html
//   ../install.sh, ../install.ps1               -> public/install.sh, public/install.ps1 (the short install URLs)
//   _redirects                                  -> the skill downloads go to the latest GitHub release
//
// The skill itself is never hosted here: releases live on GitHub (see CONTRIBUTING.md → Releasing). The install scripts
// download the latest published release (or --version) from there.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
copyFile("skill/blueprint-deck/blueprint-deck.html", "engine/blueprint-deck.html");
copyFile("install.sh", "install.sh");
copyFile("install.ps1", "install.ps1");
// leftovers from when the site hosted the releases
for (const f of ["releases", "version.json", "blueprint-deck-skill.zip", "blueprint-deck-skill.tar.gz"]) rmSync(join(PUBLIC, f), { recursive: true, force: true });

// Cloudflare Pages redirects: the skill downloads and the version list live on GitHub
writeFileSync(join(PUBLIC, "_redirects"), [
  `/blueprint-deck-skill.zip ${GITHUB}/releases/latest/download/blueprint-deck-skill.zip 302`,
  `/blueprint-deck-skill.tar.gz ${GITHUB}/releases/latest/download/blueprint-deck-skill.tar.gz 302`,
  `/releases ${GITHUB}/releases 302`,
  `/releases/* ${GITHUB}/releases 302`,
].join("\n") + "\n");
log(`public/_redirects -> skill downloads from ${GITHUB}/releases`);
log(warnings ? `done with ${warnings} warning(s)` : "done");
