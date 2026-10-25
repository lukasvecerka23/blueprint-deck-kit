# Changelog

Versions: a new minor version (2.1, 2.2 …) adds features and keeps every older diagram working; a new major version
(3.0) may need diagrams to be upgraded. To update, run the install command again; to give an existing diagram the new
engine, ask your agent to upgrade it (or `node tools/insert.mjs --upgrade <file>`). All releases and their files:
https://github.com/lukasvecerka23/blueprint-deck-kit/releases

## 2.3.0 (2026-10-25)

Install it from inside the agent or app you already use.

- **Claude Code plugin.** `/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit`, then
  `/blueprint-deck`. The repository is its own plugin marketplace; updates come through Claude Code.
- **Codex plugin**, also in the ChatGPT desktop app:
  `codex plugin marketplace add lukasvecerka23/blueprint-deck-kit && codex plugin add blueprint-deck@blueprint-deck-kit`;
  updates with `codex plugin marketplace upgrade`. Codex's `$skill-installer` works too.
- **Gemini CLI:** `gemini skills install https://github.com/lukasvecerka23/blueprint-deck-kit --path plugins/blueprint-deck/skills/blueprint-deck`.
- **Chat apps, no terminal:** upload the release zip as a skill in Claude (Desktop or claude.ai), ChatGPT on the web or
  the Gemini app. The skill knows how to work in a chat: the attached files are the sources, and you get the HTML file
  to download.
- **The install script** asks which agents when it finds several (Enter = all; `--yes` skips the question), knows
  Gemini CLI (`--agent gemini`), and stays the way for any other agent, Windows or a specific version.
- **New layout:** the skill moved to `plugins/blueprint-deck/skills/blueprint-deck/` (the standard plugin layout) with
  manifests for Claude Code and Codex. The release zip still contains just the `blueprint-deck/` folder.
- **Stricter apps:** the skill's `VERSION` and `LICENSE` are now `VERSION.txt` and `LICENSE.md`, and the frontmatter is
  quoted, because the Gemini app refuses files without an extension and parses YAML strictly. The installers read the
  old `VERSION` of earlier installs.
- The skill's "newer version" notice names the right way to update for each kind of install.
- New example: `meetbuddy`, a macOS meeting recorder read from its code, with a product and a technical diagram.

## 2.2.0 (2026-10-24)

- **Diagrams from code.** The style guide has a "From code" section: services, contracts, clients and deployment
  files become the map, every connection needs evidence in the code, docs and code conflicts are reported. The
  configurator has a "What to read" choice (docs, code, both) that fills in the source lists.
- New example: `online-boutique`, Google's microservices demo built from its code alone.
- **Short, clickable sources.** A source URL shows as its path in the repo (`src/frontend/main.go#L80-L120`) or as
  `host/…/page.html`, linked to the full URL; local paths stay as they are. Side panels, sheets and the tour card
  never scroll sideways: long text wraps.

## 2.1.0 (2026-10-24)

- **Personas on the map.** A persona with a `zone` is also a box next to the applications it uses; clicking it opens
  the Personas panel and lights its path from the box. `boxSub` for a short subtitle on the box.
- **Read-only copies to send.** ⋯ → Download a read-only copy: name it and download; the copy has no editor code.
  The editor's Share… also offers an editable copy. Agents: `tools/insert.mjs --read-only` or `workflow.read_only_copy`.
- **Update check.** The skill tells you when a newer version is out, the installer shows the version it replaced and
  what's new, and the editor shows which engine a file has.
- **Security**: every file carries a Content Security Policy (no network requests at all), and the engine removes
  scripts, event handlers and unsupported tags from the content before showing it.
- **Versions**: releases are GitHub releases; the installer takes the latest published one, or any earlier one with
  `--version` (PowerShell `-Version`).
- **Licence notices** in the installed skill and in every diagram file.
- **Editor bar** fits laptop screens: one Save button, a short status, wraps instead of hiding buttons.
- **Shape** (rounded, square, pill) changes only the diagram, not menus and panels.
- The editor follows the diagram switcher; "Copy a link to this view" only for hosted files.
- Works with any docs (a repository, a folder of Markdown, text or PDF files, wiki exports, web pages).

## 2.0.0 (2026-10-24)

First public version, renamed from the internal "diagram-kit". Thanks to Pavel Sládek for the early feedback and
ideas behind many of these changes.

- **One file is the diagram.** The diagram data is a JSON block at the top of the HTML file; the engine lays it out,
  validates it and renders it when the file opens. No build step, no Python, no Node needed to make or use a diagram.
- **Editor in the file (press E).** Edit texts, colours, theme, logo, areas, boxes, connections, tabs, tour and
  personas; drag boxes to move them; undo/redo; a Check tab. Changes are saved into the file (Chrome, Edge) or in the
  browser with a download.
- **Personas with paths.** Pick a persona and see its numbered path through the map.
- **Boundaries.** Areas are ours, customer-owned, partner or external, each drawn and labelled differently.
- **Viewpoints.** Product, mixed or technical: what the boxes and panels say, and whether technology alternatives show.
- **Themes.** Light themes (light, paper) next to the dark ones, any primary/secondary colour, rounded/square/pill shapes.
- **Lucide icons** (373 bundled, any Lucide icon can be added per diagram).
- **Several diagrams in one file** without iframes; switch with the logo menu or keys 1–9.
- **PDF deck export (P)**: a cover, the overview, one page per tour step and every sheet.
- **Phones**: pinch to zoom, bottom-sheet panels and tour card.
- **Any agent.** The skill follows the Agent Skills format; one install script for Claude Code, Codex and others.
- **Configurator** rebuilt: shared settings plus a full set of options per diagram, live theme preview, a prompt that
  carries the whole config.
- Optional `tools/check.mjs` validates a file from the command line (Node 18+).

## 1.0.0 (2026-10-20, internal)

The first version, called **diagram-kit**, built inside a client project and never published. 2.0.0 is its public
rewrite.

- A Claude Code plugin (`/diagram-kit:diagram`) or a personal skill; Claude only.
- A form (the first configurator) wrote `diagram.config.yaml`; Claude read the repository's docs, wrote the content as
  `diagram.json` plus an extraction report, and a Python build script turned it into one offline HTML file.
- Clickable boxes with side panels, tabs that highlight one aspect at a time, a guided tour with a zooming camera,
  roadmap and option sheets, and several diagrams in one file with a switcher.
- Change requests in plain language and an `update` mode that kept manual edits.
- Dark themes only (four presets plus an accent colour), boxes on a grid of areas, no editor in the browser, no
  personas, no PDF export.
