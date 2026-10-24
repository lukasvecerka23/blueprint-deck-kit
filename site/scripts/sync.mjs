#!/usr/bin/env node
// Prebuild step: puts the kit's runtime files into site/public/ so the site serves them.
// Runs before `npm run dev` and `npm run build`. Everything it writes is a build artifact (see site/.gitignore).
//
// The website and the skill have separate release cycles. The site itself (pages, docs) comes from the current
// commit. Everything users install or download comes from the PUBLISHED version: the git tag v<latest> named in
// site/release.json. So main can contain unreleased skill work while the site keeps serving the published version.
//
//   v<latest>:configurator/, examples/      -> public/configurator/, public/examples/
//   v<latest>:skill/.../blueprint-deck.html -> public/engine/blueprint-deck.html
//   v<latest>:install.sh, install.ps1       -> public/install.sh, public/install.ps1
//   v<latest>:skill/blueprint-deck/         -> public/blueprint-deck-skill.{tar.gz,zip}
//   every tag v*:skill/blueprint-deck/      -> public/releases/<version>/blueprint-deck-skill.{tar.gz,zip}
//   versions                                -> public/version.json (the skill's update check reads it)
//
// `npm run dev` without the tag falls back to the working tree (with a warning); `npm run build` fails instead.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(SITE, "..");
let SRC_ROOT = REPO; // where the copied kit files come from: the published tag, unpacked (or the working tree in dev)
const PUBLIC = join(SITE, "public");
const IGNORE = new Set([".DS_Store", "Thumbs.db", ".git", "node_modules"]);

let warnings = 0;
const log = msg => console.log(`[sync] ${msg}`);
const warn = msg => { warnings++; console.warn(`[sync] WARN ${msg}`); };
const rel = p => relative(REPO, p) || ".";

function copyDir(from, to) {
  const src = join(SRC_ROOT, from), dest = join(PUBLIC, to);
  rmSync(dest, { recursive: true, force: true });
  if (!existsSync(src)) return warn(`${from} not found, skipped`);
  cpSync(src, dest, { recursive: true, filter: s => !IGNORE.has(s.split(sep).pop()) });
  log(`${from} -> public/${to}`);
}

function copyFile(from, to) {
  const src = join(SRC_ROOT, from), dest = join(PUBLIC, to);
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

/* ------------------------------------------------------------------ versions: git tags v<x.y.z> */
const RELEASE = JSON.parse(readFileSync(join(SITE, "release.json"), "utf8")); // { "latest": "2.1.0" }
const DEV = process.env.npm_lifecycle_event === "predev" || process.env.BD_SITE_DEV === "1";
const git = (...args) => execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const semver = v => v.split(".").map(n => parseInt(n, 10) || 0);
const newestFirst = (a, b) => { const x = semver(a), y = semver(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]; };
function versions() {
  try { return git("tag", "-l", "v*").split("\n").filter(t => /^v\d+\.\d+\.\d+$/.test(t)).map(t => t.slice(1)).sort(newestFirst); }
  catch { return []; }
}
// a CI checkout (e.g. Cloudflare Pages) may be shallow or come without tags: fetch them once
function ensureVersions() {
  let list = versions();
  if (list.includes(RELEASE.latest)) return list;
  try {
    if (git("rev-parse", "--is-shallow-repository") === "true") git("fetch", "--quiet", "--unshallow", "--tags");
    else git("fetch", "--quiet", "--tags");
  } catch (e) { warn(`could not fetch tags (${String(e.message).split("\n")[0]})`); }
  return versions();
}
// unpack the published files of one tag into a temporary folder
function unpackTag(tag, paths, dest) {
  mkdirSync(dest, { recursive: true });
  const have = paths.filter(p => { try { git("cat-file", "-e", `${tag}:${p}`); return true; } catch { return false; } });
  const tarFile = join(dest, "..", "bd-src.tar");
  git("archive", "--format=tar", "-o", tarFile, tag, ...have);
  execFileSync("tar", ["-xf", tarFile, "-C", dest]);
  rmSync(tarFile, { force: true });
}
// one version's skill as .tar.gz and .zip (a "blueprint-deck/" folder inside), straight from git history
function releaseArchives(version, dir) {
  mkdirSync(dir, { recursive: true });
  const tag = "v" + version, tree = `${tag}:skill/blueprint-deck`;
  const tar = execFileSync("git", ["-C", REPO, "archive", "--format=tar", "--prefix=blueprint-deck/", tree], { maxBuffer: 64 << 20 });
  writeFileSync(join(dir, "blueprint-deck-skill.tar.gz"), zlib.gzipSync(tar, { level: 9 }));
  git("archive", "--format=zip", "--prefix=blueprint-deck/", "-o", join(dir, "blueprint-deck-skill.zip"), tree);
}

/* ------------------------------------------------------------------ the archives of the working tree (dev only) */
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

// what the skill's update check and the installer read: the published version, every version, where to read what's new
function versionJson(version, all) {
  const site = "https://blueprint-deck.lukasvecerka.dev";
  if (!version) { const m = readFileSync(join(REPO, "engine/src/core.js"), "utf8").match(/VERSION = "([^"]+)"/); version = m ? m[1] + "-dev" : "dev"; }
  writeFileSync(join(PUBLIC, "version.json"), JSON.stringify({
    version, versions: all, changelog: site + "/changelog/",
    install: { sh: `curl -fsSL ${site}/install.sh | sh`, ps: `irm ${site}/install.ps1 | iex` },
  }, null, 2) + "\n");
  log(`version ${version} -> public/version.json`);
}

/* ------------------------------------------------------------------ run */
mkdirSync(PUBLIC, { recursive: true });
const all = ensureVersions();
const published = all.includes(RELEASE.latest);
if (!published && !DEV) {
  console.error(`[sync] ERROR site/release.json publishes ${RELEASE.latest}, but there is no tag v${RELEASE.latest}. Tag the release first (see CONTRIBUTING.md → Releasing), or set "latest" to an existing version (${all.join(", ") || "none yet"}).`);
  process.exit(1);
}
const tmp = join(SITE, "node_modules", ".bd-release");
rmSync(tmp, { recursive: true, force: true });
if (published) {
  unpackTag("v" + RELEASE.latest, ["configurator", "examples", "skill/blueprint-deck", "install.sh", "install.ps1"], tmp);
  SRC_ROOT = tmp;
  log(`publishing the skill ${RELEASE.latest} (tag v${RELEASE.latest})`);
} else warn(`no tag v${RELEASE.latest}: dev mode serves the working tree instead of a release`);

copyDir("configurator", "configurator");
copyDir("examples", "examples");
copyFile("skill/blueprint-deck/blueprint-deck.html", "engine/blueprint-deck.html");
copyFile("install.sh", "install.sh");
copyFile("install.ps1", "install.ps1");

// every released version stays installable: /releases/<version>/; the root archives are the published one
rmSync(join(PUBLIC, "releases"), { recursive: true, force: true });
for (const v of all) releaseArchives(v, join(PUBLIC, "releases", v));
if (all.length) log(`releases: ${all.join(", ")} -> public/releases/`);
if (published) {
  for (const f of ["blueprint-deck-skill.tar.gz", "blueprint-deck-skill.zip"]) cpSync(join(PUBLIC, "releases", RELEASE.latest, f), join(PUBLIC, f));
} else { zipSkill(); tarSkill(); }
versionJson(published ? RELEASE.latest : null, all);
rmSync(tmp, { recursive: true, force: true });
