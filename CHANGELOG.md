# Changelog

Versions: a new minor version (2.1, 2.2 …) adds features and keeps every older diagram working; a new major version
(3.0) may need diagrams to be upgraded. To update, run the install command again; to give an existing diagram the new
engine, ask your agent to upgrade it (or `node tools/insert.mjs --upgrade <file>`). All releases and their files:
https://github.com/lukasvecerka23/blueprint-deck-kit/releases

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
