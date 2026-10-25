# Extraction report: Blueprint Deck Kit (examples/blueprint-deck/index.html)

Generated unattended (`workflow.confirm_structure: false`), so the proposed structure is recorded here instead of being
confirmed first. Check result: `6 zones · 25 boxes · 22 connections · 7 tabs · 11 tour steps · 0 overlays`, 0 errors, 0 warnings.
No browser check was run (see Assumptions).

## Sources read

- `plugins/blueprint-deck/skills/blueprint-deck/SKILL.md`
- `plugins/blueprint-deck/skills/blueprint-deck/reference/spec.md`, `style-guide.md`, `icons.md` (`lucide-all.json` only by size/role)
- `plugins/blueprint-deck/skills/blueprint-deck/templates/diagram.config.yaml`, `templates/example.json`
- `plugins/blueprint-deck/skills/blueprint-deck/tools/check.mjs`
- `engine/src/core.js`, `render.js`, `boot.js`, `editor.js` (header comments, section comments and the relevant functions),
  `engine.css` (media queries), `editor.css` (not used), `icons.js` (header), `template.html`
- `dev/assemble.mjs`, `dev/make-icons.mjs`
- `configurator/index.html` (only the header, the "How to use it" steps and the output section)
- Not used: `README.md` (being rewritten), `dev/old-*` (old engine), `examples/` (outputs, not sources).

## Structure (proposed and used)

Areas, left to right, as a person would explain the kit on a whiteboard:

| area | boundary | why |
|---|---|---|
| Your repo | customer | The user's own repository: sources, config, extraction report. Not part of the kit. |
| The agent side | ours | What the kit gives the agent: skill, format and rules, templates, icon list, empty engine file, checker, configurator. |
| The file | ours | What a Blueprint Deck is: data block + engine (shell, core, renderer, editor, icons, PDF export). |
| Sharing | external | Where the file is opened: any browser, phones, deep links. |
| Your coding agent | external | Claude Code or another agent; plus the optional browser check. |
| Dev tooling | ours | Engine sources, assemble, icon generator (for contributors). |

Users are personas, not boxes (as the config asks):

- **Agent user**: configurator → config → skill → data block → command-line check (also: sources, coding agent, report)
- **Presenter**: browser → renderer → editor → shell → data block (also: PDF export)
- **Viewer**: link to a view → browser → renderer (also: phones, PDF)
- **Contributor**: icon generator → engine sources → assemble → empty engine file

Tabs: Overview · Generate · Edit & save · Present & share · Inside the file · Dev tooling · Personas (automatic).

Tour (11 steps):
1. One file you can present, edit and send
2. You describe the diagram; your agent builds it
3. The skill is the rulebook, the engine is fixed
4. The agent writes data, not a web page
5. Checked before anyone opens it
6. Inside the file: data on top, engine below
7. Press E: edit in the browser, save into the file
8. Present with a tour, hand out a PDF
9. Share one file; it opens anywhere
10. Built from plain source files
11. Why one file and a fixed engine (summary tiles)

Edge groups: `gen` (main flow), `check`, `inside`, `edit`, `share`, `dev`.

## Inventory

| id | source |
|---|---|
| sources | SKILL.md §1; templates/diagram.config.yaml `sources` |
| report | SKILL.md §3 (report sections) |
| config | templates/diagram.config.yaml; SKILL.md §0 |
| skill | SKILL.md (modes table, steps 0–6, Never) |
| configurator | configurator/index.html (lead, "How to use it", outputs); boot.js `?preview`; SKILL.md §0 |
| spec | reference/spec.md; reference/style-guide.md |
| templates | templates/diagram.config.yaml; templates/example.json; SKILL.md "init" mode |
| checker | tools/check.mjs; SKILL.md §5 |
| icons-ref | reference/icons.md (373 icons, aliases, ~1903 in lucide-all.json) |
| engine-copy | SKILL.md §4; dev/assemble.mjs (default output) |
| data | spec.md "Top level"; template.html |
| shell | boot.js (load, local edits, File System Access save, download, switcher 1–9) |
| core | core.js (defaults, TYPE_LABELS, VIEWPOINT_TECH, placeZones/placeNodes, expandRefs, addPersonas, validate; "no DOM access") |
| editor | editor.js header (texts, colours, theme, logo, move, connect, tabs, tour, personas), undo/redo, Check tab |
| renderer | render.js header and sections (camera, pinch, tabs, panels, paths, tour, overlays, #check) |
| icons | icons.js header (Lucide, ISC); icons.md |
| pdf | render.js `printDeck` (cover, overview, every step or tab, every sheet) |
| links | spec.md "Deep links"; boot.js `copyLink` (⋯ menu) |
| browser | SKILL.md §6 ("opens offline by double-click"); spec.md (no build step) |
| phone | engine.css `@media (max-width: 700px)` and 1100px; render.js pinch |
| agent | SKILL.md (sub-agents, steps); configurator ("In Claude Code …") |
| browsercheck | SKILL.md §5.2; spec.md "Deep links" (#check, `__diagramCheck`) |
| assemble | dev/assemble.mjs (default, `--upgrade`, `--from-json`) |
| enginesrc | dev/assemble.mjs (file list); template.html |
| icongen | dev/make-icons.mjs |

## Conflicts

1. **Configurator naming is stale.** `configurator/index.html` still says "diagram-kit", writes the prompt
   `/diagram-kit:diagram diagrams/diagram.config.yaml` and points to `plugin/skills/diagram/templates/diagram.config.yaml`;
   the skill is now `blueprint-deck` in `plugins/blueprint-deck/skills/blueprint-deck/`. Resolved by the config comment (it is being rebuilt):
   the box only says "a form that writes diagram.config.yaml and a prompt", no names or paths from it.
2. **`templates/example.json` also uses the old name** ("used to show what diagram-kit generates … from one diagram.json").
   Not shown in the diagram; reported for the maintainers.
3. **Frame and customer zones.** spec.md says the automatic frame wraps "all zones that are ours (not external or
   partner)"; `customer` zones are therefore inside the frame, and the frame is a bounding box, so it would also have
   covered the external "Your coding agent" zone below "Your repo". Resolved with an explicit `frame` x/y/w/h around
   the kit's own zones.

## Gaps

- **Static host** (suggested in the brief under Sharing): no source mentions hosting the file on a web server or a
  static host. Left out; the Sharing area shows the file, phones and deep links only.
- **Configurator URL**: SKILL.md names https://blueprintdeck.dev/configurator; not shown on the map
  because the configurator is being rebuilt. `meta.url` is the GitHub repo from the template's comment instead.
- Whether the configurator's live preview (boot.js `?preview`) is wired up in the configurator being rebuilt is not
  verifiable from the current configurator source; the box says only that the engine has a preview mode.

## Status evidence

No `status` used: the kit is running software (engine 2.0.0 in core.js) and the config disables status tags.

## Branding

No website in the config. Theme `midnight`, primary `#6366f1`, secondary `#22d3ee`, shape `rounded`, logo `icon:layers`
(all from the config, chosen for this example). `meta.url` = https://github.com/lukasvecerka23/blueprint-deck-kit
(from the comment in `engine/src/template.html`).

## Assumptions

- The audience is "developers and presenters", so the viewpoint is mixed: capability titles, file names and
  technology in the subtitles, `pick` texts only where a technology choice exists (config, data block, shell, skill).
- "Any agent that can read files and run commands" is inferred from SKILL.md covering environments with and without
  Node, sub-agents and browser tools; Claude Code is the only agent named in the sources (configurator).
- No visual check in a browser (not allowed for this run). Layout was planned so that no connection passes another
  box; the checker found none, and all persona paths have an edge between each pair of consecutive steps.
