# Changelog

## 2.0.0 (unreleased)

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
- **Read-only copies to send**: ⋯ → Download a copy to share (name it, pick read-only); the copy has no editor code.
  `tools/insert.mjs --read-only` and `workflow.read_only_copy` do the same for agents.
- **Personas on the map**: a persona with a `zone` is also a box; clicking it shows its path.
