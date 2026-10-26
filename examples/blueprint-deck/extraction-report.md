# Extraction report: Blueprint Deck Kit (examples/blueprint-deck/index.html)

Mode: **update** of the existing deck (engine 0.6.0), regenerated against the repository's working tree on 2026-10-26.
Run unattended (`workflow.confirm_structure: false`), so the structure is recorded here instead of being confirmed first.
The network version check was skipped.

Result: `7 zones · 34 boxes · 29 connections · 8 tabs · 12 tour steps · 0 overlays`; `tools/check.mjs`: 0 errors,
0 warnings. Browser check (`dev/browser-check.mjs`, Chrome, 1600×950): all 24 views (8 tabs, 12 tour steps, 4 personas)
clean, no console errors. The file is byte-identical to what `node dev/assemble.mjs --upgrade` produces (as CI checks).

## Sources read

- Skill: `plugins/blueprint-deck/skills/blueprint-deck/SKILL.md`, `reference/spec.md`, `reference/style-guide.md`,
  `reference/icons.md` (`lucide-a-l.json` only to copy the `file-cog` icon), `templates/diagram.config.yaml`,
  `tools/check.mjs`, `tools/insert.mjs` (headers), `VERSION.txt`, `README.md` of the plugin, both plugin manifests
  (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`)
- Marketplaces: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`
- Engine: `engine/src/boot.js`, `core.js`, `render.js`, `editor.js` (header comments, section markers and the relevant
  functions: favicon, credit, PDF dialog and `printDeck`, sandbox handling, copies to send, preview), `icons.js` (header),
  `engine.css` (media queries), `template.html`
- Docs: `README.md`, `CHANGELOG.md` (0.1.0–0.6.0), `CONTRIBUTING.md`, `SECURITY.md`, `site/src/pages/docs/index.md`,
  `agents.md`, `editing.md` (`configuring.astro`, `format.astro`, `style-guide.astro` render the skill's own files)
- Install and release: `install.sh` (header and options), `install.ps1` (options), `.github/workflows/ci.yml`,
  `.github/workflows/release.yml`
- Dev: `dev/assemble.mjs`, `dev/make-icons.mjs`, `dev/browser-check.mjs`, `dev/readme-shots.mjs`
- Website and video: `site/README.md`, `site/public/_redirects`, `site/src/pages/index.astro` (live-demo iframe),
  `video/README.md`; `configurator/index.html` (intro, outputs, preview iframe)
- Not used as sources: `examples/` (outputs), the generated `blueprint-deck.html`, `site/dist`, `video/out`.

## Structure (proposed and used)

The six areas of the previous deck are kept; one area is added ("Get the skill"), and "Your coding agent" became
"Where it runs" because the skill now also runs in chat apps.

| area | boundary | why |
|---|---|---|
| Your repo | customer | The user's project: sources, config, extraction report. Not part of the kit. |
| The agent side | ours | What the kit gives the agent: skill, format and rules, templates, icon list, empty engine file, checker, configurator. |
| The file | ours | What a Blueprint Deck is: data block + engine (loader, core, renderer, editor, icons, PDF export). |
| Sharing | external | Where the file is opened: any browser or a static host, phones, deep links, Teams/SharePoint previews, a Claude artifact. |
| Where it runs | external | Coding agents (Claude Code, Codex, Copilot, Gemini CLI), chat apps (Claude, ChatGPT, Gemini), the optional browser check. |
| Get the skill (new) | ours | Plugin marketplace, install script, release zips, website & docs. |
| Dev tooling | ours | Assemble, engine sources, icon generator, plus (new) the Release workflow and CI checks. |

Layout: grid columns 300 / 560 / 600 / 300, rows 460 / 300. The bottom row reads left to right: where the skill runs →
how it gets there → how it is built and released. "Get the skill" places its boxes explicitly: the three that connect
to "Where it runs" (marketplace, install script, release zips) sit in the left column so their connections are short
and pass no box. The frame is explicit (x 375, y 85, 1250 × 860) around the four zones that are ours, because the
customer zone "Your repo" would otherwise be wrapped too.

Personas (users as personas, as the config asks; names exactly as configured):

- **Agent user**: configurator → config → skill → data block → command-line check (also: sources, coding agent, report, plugin marketplace)
- **Presenter**: browser → renderer → editor → loader → data block (also: PDF export)
- **Viewer**: link to a view → browser → renderer (also: phones, PDF, Teams & SharePoint, Claude artifact)
- **Contributor**: icon generator → engine sources → assemble → empty engine file (also: Release workflow, CI checks, release zips)

Tabs: Overview · Generate · Get the skill (new) · Edit & save · Present & share · Inside the file · Dev tooling · Personas (automatic).

Tour (12 steps; the config allows 8–12):
1. One file you can present, edit and send
2. Install once, in the agent you already use (new)
3. You describe the deck; your agent builds it
4. The skill is the rulebook, the engine is fixed
5. The agent writes data, not a web page
6. Checked before anyone opens it
7. Inside the file: data on top, engine below (loader; CSP; unsafe markup stripped)
8. Press E: edit in the browser, save into the file (loader)
9. Present with a tour, hand out a PDF (colour or black and white)
10. Share one file; it opens anywhere (static host, Teams/SharePoint, Claude artifact on a yes, phones, links)
11. Built from plain source files, shipped as releases (CI, Release workflow)
12. Why one file and a fixed engine (6 summary tiles)

Edge groups: `gen` (main flow), `check`, `inside`, `edit`, `share`, `dev`, `install` (new).

### What changed against the previous deck

- **Shell → Loader**: the box for `engine/src/boot.js` is now "Loader" (`boot.js · load, save, switcher`, icon
  `file-cog`, added to the deck's `icons` from `lucide-a-l.json`); its id changed from `shell` to `loader`, and every
  text (tour steps 7 and 8, assemble, engine sources, the group `engine`, the presenter's path) says loader.
- **Versions**: hero eyebrow "Open-source tool · beta 0.6.0" (was "2.0.0"); the release box says 0.x until 1.0.0.
- **meta.url**: `https://github.com/lukasvecerka23/blueprint-deck-kit` (the old value lacked "23"); it is information
  only, the deck no longer links it.
- **Sources**: every source is now a GitHub link (`blob/main/…`, `tree/main/…`) to a file that exists in the
  repository, shown short and clickable in the panels. The old ones pointed at `skill/blueprint-deck/…`, a path that
  no longer holds the skill.
- **New boxes**: Plugin marketplace, Install script, Release zips, Website & docs (Get the skill); Chat apps (Where it
  runs); Teams & SharePoint, Claude artifact (Sharing); Release workflow, CI checks (Dev tooling).
- **Updated boxes**: PDF deck export (colour or black and white, Shift+P); Renderer (favicon from the logo, the
  "Made with Blueprint Deck Kit" credit and `settings.credit`); Link to a view (the ⋯ menu's copy-link is gone, see
  0.5.0); Any browser (static hosts, mail filters); Core (unsafe markup removed); Configurator (described as it is now:
  one tab per diagram, live theme preview, prompt); Coding agent (Claude Code, Codex, Copilot, Gemini CLI); Skill
  (update check); Icon list and icon generator (`lucide-a-l.json` / `lucide-m-z.json`); Assemble (copies the version
  into `VERSION.txt` and both plugin manifests).
- **Config**: sources now cover the whole repository as listed in the brief; the comments "README is being rewritten"
  and "configurator is being rebuilt" were removed (both are current now); `must_show`, `notes` and the tab list say
  loader and include the install channels; versioning and `meta.url` are recorded in `comments`.

## Inventory

All sources are `https://github.com/lukasvecerka23/blueprint-deck-kit/blob/main/<path>`; below by path.

| id | source |
|---|---|
| sources | SKILL.md §1; style-guide.md "From code" |
| report | SKILL.md §3 |
| config | templates/diagram.config.yaml; SKILL.md §0 |
| skill | SKILL.md (modes, steps, "Before you start: versions") |
| configurator | configurator/index.html; boot.js L306-L318 (`?preview`); docs/index.md §2 |
| spec | reference/spec.md; reference/style-guide.md |
| templates | templates/diagram.config.yaml; templates/example.json |
| checker | tools/check.mjs; SKILL.md §5 |
| icons-ref | reference/icons.md |
| engine-copy | SKILL.md §4; tools/insert.mjs; dev/assemble.mjs |
| data | spec.md "Top level"; engine/src/template.html |
| loader | engine/src/boot.js (whole file; L118-L153 copies to send; L259-L264 sandboxed viewers) |
| core | engine/src/core.js (L156-L203 safe content); SECURITY.md |
| editor | engine/src/editor.js; docs/editing.md "The editor" |
| renderer | engine/src/render.js (L23-L46 favicon; L9-L14 credit) |
| icons | engine/src/icons.js; reference/icons.md |
| pdf | render.js L1010-L1085 (`printDeck`); boot.js L188-L207 (PDF dialog); docs/editing.md "PDF deck" |
| links | spec.md "Deep links"; docs/editing.md "Deep links"; CHANGELOG 0.5.0 |
| browser | SKILL.md §6; docs/editing.md "Sharing"; SECURITY.md "Sending decks by email" |
| phone | engine.css L378-L381 (`max-width` media queries); render.js L316-L330 (pinch) |
| viewers | docs/editing.md "Sharing"; CHANGELOG 0.5.0; boot.js L259-L264 |
| artifact | SKILL.md L22-L31; docs/agents.md "Chat apps"; CHANGELOG 0.5.1 |
| agent | SKILL.md; docs/agents.md; SECURITY.md |
| browsercheck | SKILL.md §5; spec.md "Deep links" |
| chatapps | SKILL.md L22-L31; docs/agents.md "Chat apps"; CHANGELOG 0.4.0 |
| market | .claude-plugin/marketplace.json; .agents/plugins/marketplace.json; both plugin manifests; docs/agents.md "GitHub Copilot" |
| script | install.sh; install.ps1; docs/index.md "The install script"; docs/agents.md "Gemini CLI" |
| zips | .github/workflows/release.yml; README "Install the skill"; CHANGELOG 0.4.0 |
| website | site/README.md; site/public/_redirects; site/src/pages/index.astro; video/README.md |
| assemble | dev/assemble.mjs |
| enginesrc | engine/src (folder); CONTRIBUTING.md "How the repository fits together" |
| release | .github/workflows/release.yml; CONTRIBUTING.md "Releasing"; CHANGELOG.md |
| icongen | dev/make-icons.mjs |
| ci | .github/workflows/ci.yml; dev/browser-check.mjs |

Connections and their evidence: sources/config → skill, skill → data/report (SKILL.md §1–4); configurator → config
(configurator outputs); agent/chat apps → skill (SKILL.md, docs/agents.md); engine-copy → file and checker → data
(SKILL.md §4–5, check.mjs); agent → browser check (SKILL.md §5.2); loader ↔ data, editor → loader/renderer, data →
core → renderer, icons → renderer (boot.js, render.js, editor.js); renderer → PDF/browser/phones/Teams previews
(render.js `printDeck`, editing.md "Sharing", engine.css); links → browser (spec "Deep links"); marketplace and install
script → coding agent (docs/agents.md, install.sh); release zips → install script (install.sh downloads the latest
release) and → chat apps (zip upload, docs/agents.md); Release workflow → zips (release.yml); icon generator → engine
sources → assemble → empty engine file (make-icons.mjs, assemble.mjs).

## Conflicts

1. **SKILL.md "Never publish the file anywhere" vs. the artifact offer.** The chat-app paragraph (L27-L31) tells the
   agent to offer publishing the deck as a Claude artifact and to publish when the user says yes; the "Never" list
   (L230) says never publish the file anywhere. Resolved by reading the "Never" rule as "never on your own": the deck
   says the artifact is published only when the user says yes. Worth aligning the wording in SKILL.md.
2. **Install-script options in the docs are behind.** `site/src/pages/docs/index.md` lists `--agent
   claude|codex|gemini|agents|all` and the folders without `~/.copilot/skills`; `install.sh`, `install.ps1`, README and
   docs/agents.md have `copilot`. The deck follows the scripts (code wins).
3. **The editor no longer edits the logo link.** `docs/editing.md` still says the editor can change "the link the
   logo opens"; editor.js (0.6.0) removed that field and the logo no longer opens a link (CHANGELOG 0.6.0). The deck
   follows the code and doesn't mention a logo link.
4. **README "Updating" doesn't list GitHub Copilot.** SKILL.md and docs/agents.md have `copilot plugin update
   blueprint-deck` and `gh skill update blueprint-deck`; the README's Updating paragraph doesn't. Not shown on the map
   (the marketplace box only says updates come through the agent).
5. **Frame and customer zones** (unchanged from the previous run): the automatic frame would also wrap the customer
   zone "Your repo"; resolved with an explicit frame.

## Gaps

- **Which marketplace file the Copilot CLI reads** is not stated in the sources (README and docs only give the
  command). The marketplace box names both files and says "this repository is its own plugin marketplace", without
  mapping Copilot to one of them.
- **Hosting of the website**: site/README.md says Cloudflare Pages; CONTRIBUTING.md says it deploys from `main` on
  every push. The box says "deployed from main on every push" and doesn't name the host.
- **Codex `$skill-installer` URL** is shortened in the install-script panel (`…/plugins/blueprint-deck/skills/blueprint-deck`).

## Status evidence

No `status` used: the config disables status tags, and everything shown is in the repository and released (0.6.0 in
`engine/src/core.js`, `VERSION.txt` and both plugin manifests).

## Branding

No website in the config (`branding.website: ""`), so nothing was fetched. Theme `midnight`, primary `#6366f1`, secondary
`#22d3ee`, shape `rounded`, logo `icon:layers` (from the config). `meta.url` = https://github.com/lukasvecerka23/blueprint-deck-kit
(the plugin manifests' `repository`); it is information only, the deck doesn't link it. The website,
blueprintdeck.dev, appears in the hero footnote and the "Website & docs" box.

## Assumptions

- The audience is "developers and presenters", so the viewpoint stays mixed: capability titles, file names and
  technology in the subtitles, `pick` texts only where a technology choice exists (config, skill, data block, loader).
- The new "Get the skill" area is counted as ours (inside the frame): the marketplace files, install scripts, release
  workflow and website all live in this repository. The agents and chat apps that consume them stay external.
- The Claude artifact is drawn in Sharing without a connection: it is made from a chat app, which sits on the other
  side of the map; its panel and the tour say how it is made.
- Source links point at `blob/main`, so they show the files once the current working-tree changes are on `main`;
  line anchors (`#L…`) were taken from the working tree.
