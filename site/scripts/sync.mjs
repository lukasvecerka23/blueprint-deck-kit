#!/usr/bin/env node
// Prebuild step: copies the kit's runtime files from the repository into site/public/ so the site serves them.
// Runs before `npm run dev` and `npm run build`. Everything it writes is a build artifact (see site/.gitignore).
//
//   ../configurator/                        -> public/configurator/
//   ../examples/                            -> public/examples/
//   ../skill/blueprint-deck/blueprint-deck.html -> public/engine/blueprint-deck.html
//   ../install.sh, ../install.ps1           -> public/install.sh, public/install.ps1
//   ../skill/blueprint-deck/                -> public/blueprint-deck-skill.zip (folder "blueprint-deck/" inside)
//
// Missing sources are skipped with a warning, so the site still builds while parts of the kit are being written.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(SITE, "..");
const PUBLIC = join(SITE, "public");
const IGNORE = new Set([".DS_Store", "Thumbs.db", ".git", "node_modules"]);

let warnings = 0;
const log = msg => console.log(`[sync] ${msg}`);
const warn = msg => { warnings++; console.warn(`[sync] WARN ${msg}`); };
const rel = p => relative(REPO, p) || ".";

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

/* ------------------------------------------------------------------ a small zip writer (deflate, no dependencies) */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}
function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}
function writeZip(srcDir, rootName, dest) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const file of listFiles(srcDir)) {
    const name = Buffer.from(`${rootName}/${relative(srcDir, file).split(sep).join("/")}`, "utf8");
    const data = readFileSync(file);
    const st = statSync(file);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);
    const { time, date } = dosTime(st.mtime);
    const executable = (st.mode & 0o111) !== 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);              // version needed
    local.writeUInt16LE(0x0800, 6);          // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, so the file mode below is honoured
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);            // extra
    central.writeUInt16LE(0, 32);            // comment
    central.writeUInt16LE(0, 34);            // disk
    central.writeUInt16LE(0, 36);            // internal attrs
    central.writeUInt32LE(((0o100000 | (executable ? 0o755 : 0o644)) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const count = centrals.length / 2;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  writeFileSync(dest, Buffer.concat([...locals, centralBuf, end]));
  return count;
}

function zipSkill() {
  const src = join(REPO, "skill/blueprint-deck");
  const dest = join(PUBLIC, "blueprint-deck-skill.zip");
  rmSync(dest, { force: true });
  if (!existsSync(join(src, "SKILL.md"))) return warn("skill/blueprint-deck/SKILL.md not found, zip skipped");
  try {
    const n = writeZip(src, "blueprint-deck", dest);
    log(`${rel(src)}/ -> public/blueprint-deck-skill.zip (${n} files, ${(statSync(dest).size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    rmSync(dest, { force: true });
    warn(`could not write the skill zip (${e.message}), skipped`);
  }
}

// the install scripts download this (works while the GitHub repository is private, too)
function tarSkill() {
  const dest = join(PUBLIC, "blueprint-deck-skill.tar.gz");
  rmSync(dest, { force: true });
  try {
    execFileSync("tar", ["-czf", dest, "-C", join(REPO, "skill"), "--exclude", ".DS_Store", "blueprint-deck"]);
    log(`skill/blueprint-deck/ -> public/blueprint-deck-skill.tar.gz (${(statSync(dest).size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    rmSync(dest, { force: true });
    warn(`could not write the skill tarball (${e.message}), skipped`);
  }
}

// what the skill's update check and the installer read: the current version and where to read what's new
function versionJson() {
  const m = readFileSync(join(REPO, "engine/src/core.js"), "utf8").match(/VERSION = "([^"]+)"/);
  if (!m) return warn("no VERSION in engine/src/core.js, version.json skipped");
  const site = "https://blueprint-deck.lukasvecerka.dev";
  writeFileSync(join(PUBLIC, "version.json"), JSON.stringify({
    version: m[1], changelog: site + "/changelog/", install: { sh: `curl -fsSL ${site}/install.sh | sh`, ps: `irm ${site}/install.ps1 | iex` },
  }, null, 2) + "\n");
  log(`version ${m[1]} -> public/version.json`);
}

mkdirSync(PUBLIC, { recursive: true });
copyDir("configurator", "configurator");
copyDir("examples", "examples");
copyFile("skill/blueprint-deck/blueprint-deck.html", "engine/blueprint-deck.html");
copyFile("install.sh", "install.sh");
copyFile("install.ps1", "install.ps1");
zipSkill();
tarSkill();
versionJson();
log(warnings ? `done with ${warnings} warning(s)` : "done");
