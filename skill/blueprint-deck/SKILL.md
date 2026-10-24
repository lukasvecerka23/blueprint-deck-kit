---
name: blueprint-deck
license: MIT (see LICENSE in this folder)
description: Generate, change or update an interactive presentation diagram (a "Blueprint Deck") from documentation: a repository's docs and code, a folder of Markdown, text or PDF files, wiki or Notion exports, or web pages. The result is one HTML file that works offline - a pan-and-zoom map with clickable boxes and side panels, tabs, personas with their paths, a guided tour, roadmap and option sheets, a built-in editor (press E) and PDF export. Works for architecture and product blueprints, data flows, processes, customer journeys, ecosystems and org maps; one file can hold several diagrams. Use when the user asks for an interactive diagram, blueprint, architecture or product presentation, or to change an existing Blueprint Deck.
---

# Blueprint Deck

You turn documentation (a repository's docs and code, a folder of Markdown/text/PDF files, wiki exports, web pages) into an interactive diagram. The **engine is fixed**: you never write
HTML, CSS or JavaScript. A Blueprint Deck is one HTML file = the engine + a JSON data block at the top of the file.
You write the JSON. That keeps every diagram consistent and lets people fix texts later without you (press E).

`SKILL_DIR` below means the folder this SKILL.md is in. Files you need:
- `SKILL_DIR/blueprint-deck.html`: the engine with an empty data block; copy it for every new diagram
- `SKILL_DIR/reference/spec.md`: the JSON format
- `SKILL_DIR/reference/style-guide.md`: content, structure, viewpoint, layout and tour rules (read it, it matters)
- `SKILL_DIR/reference/icons.md`: the icon names
- `SKILL_DIR/templates/diagram.config.yaml`: the annotated config; `SKILL_DIR/templates/example.json`: a finished example
- `SKILL_DIR/tools/check.mjs`: optional command-line check (needs Node 18+, nothing to install)

## Modes

Pick the mode from the user's words and arguments:

| mode | when | what you do |
|---|---|---|
| generate | first time, or "/blueprint-deck <config>" | steps 0–6 |
| change | any change request on an existing file ("move X", "add a persona", "step 7 should …", "lighter theme") | edit the data block, step 5, report what changed |
| update | the sources changed | re-read sources, change only what changed, keep manual edits, steps 5–6 |
| upgrade | the user wants the newest engine in an existing file | copy `blueprint-deck.html`, move the old data block into it (step 4), step 5 |
| init | no config exists and the user wants one | copy the template config, fill what you can infer, ask the questions in step 0 |

**Change requests are the normal way to iterate.** Edit only what was asked, keep ids stable, check, and say what
changed. If a change expresses a lasting preference ("always say X", "no moving dots"), also add it to the config
(`comments`, `branding.name_rules` or `behaviour`) so a later `update` keeps it. The user may also have edited the
file in the browser (press E); those edits are in the data block, so always re-read it before changing anything.

## 0. Find the config

Use the path given, else `diagrams/diagram.config.yaml`, else `diagram.config.yaml`. The user may also paste the
config into the prompt: save it to `diagrams/diagram.config.yaml` first. Version 1 configs (no `diagrams:` list, a
top-level `type`) mean one diagram with those settings.

Without a config: copy `SKILL_DIR/templates/diagram.config.yaml` to `diagrams/`, fill in what you can infer from the
repo, and ask the user in one message: the audience and goal, product or technical viewpoint, and what story the tour
should tell. Mention the configurator (https://blueprint-deck.lukasvecerka.dev/configurator).

The config is the user's control surface: follow it literally. `comments`, `focus` and every `notes` field are
instructions; `comments` override `sources.priority` (still report the conflict). Shared sections (project,
branding, sources, behaviour, workflow) apply to every diagram; each `diagrams:` entry has its own type, viewpoint,
audience, map, personas, views, tour and overlays. `sources.include` is relative to the project folder (where the agent runs; usually a repository, but any folder with docs works) and may contain URLs;
`workflow.output` is relative to the config file's folder.

## 1. Read the sources

1. Read every file matched by the sources (minus `exclude`). Entries that are URLs are fetched with your web tool;
   cite them as the URL with the section anchor (`https://…/page.html#section`), and note the page's version/date in
   the report. For big repos, delegate reading to sub-agents if your
   environment has them, asking for structured facts (components, actors, flows, decisions, statuses, numbers with
   their source), not prose.
2. If `derive_status_from` is set, read those manifests and record what is actually deployed.
3. Note conflicts between sources and resolve them per `on_conflict` (`ask` = stop and ask before writing).
4. Branding: if `branding.website` is set, fetch the page (with your web tool, or `curl -sL`). Take the logo
   (an inline `<svg>` in the header, else `<link rel="icon" | "apple-touch-icon">` or `og:image`), the brand colours
   (`<meta name="theme-color">`, CSS custom properties, the main button colour) and the product name. An SVG logo goes
   into `meta.logo` as the `<svg …>` markup itself; a PNG/JPG becomes a `data:` URI (`base64 -i logo.png` on
   macOS/Linux, `[Convert]::ToBase64String([IO.File]::ReadAllBytes("logo.png"))` in PowerShell). Explicit
   `primary`/`secondary`/`logo` values in the config win over what you found. Say in the report what you took.

## 2. Propose the structure (when `workflow.confirm_structure` is true)

Before writing boxes, send the user a short outline per diagram and wait for an OK or corrections:
- the 5–9 areas, named as a person would explain them to this audience (style guide: "Structure first"), and which
  are external / customer-owned / partner
- the personas and, for each, their path in a few words
- the tabs, and the tour as one line per step

Keep it to one screen. Apply the corrections, then continue. When `confirm_structure` is false (or nobody can
answer, e.g. an unattended run), don't wait: put the same outline into the report's **Structure** section and continue.

## 3. Write the content

Build the JSON for each diagram following the spec and the style guide, for the diagram's type and viewpoint:
areas → boxes → connections (with flow groups) → tabs → personas → lists → tour → roadmap/options sheets.

Config → JSON mapping:

| config | JSON |
|---|---|
| project.name / subtitle / one_liner | meta.title / meta.subtitle, hero.title / hero.lead |
| project.maturity | planned → say "intended", nothing shown as built, footnote says so; partly-built → status says what runs (from evidence); running → describe it as it is today |
| diagrams[].focus, audience.who / goal | what the map, tabs and tour emphasise; the hero lead; the tour's opening and closing |
| diagrams[].type / viewpoint | meta.type / meta.viewpoint |
| audience.tone, language | writing style; meta.language; translate `settings.labels` if not English |
| map.detail | number of boxes (overview 12–20, medium 25–40, detailed 40–60) |
| map.external / customer_owned | zones with `boundary: external` / `customer` (and `partner`) |
| map.frame_label | `frame.label` |
| map.technology | `settings.panel.tech`; `from-viewpoint` = leave it out (the viewpoint then decides: product → pick, mixed → pick, technical → full) |
| map.must_show / leave_out / notes | must exist / must not be shown / layout and naming wishes |
| map.status.enabled: false | no `status` at all |
| map.status (meaning, values) | `status`: scope → MVP / Next / Later, build → Running / Planned, custom → one value per string in `values` (`{ "id": "<slug>", "label": "<string>" }`); plus node.status |
| map.must_show / leave_out | boxes that must exist / must not; report anything in must_show that the sources don't support |
| personas.enabled / names / on_map | `personas` with `path` (style guide: Personas); `names` = exactly these personas; `on_map: true` → each persona gets a `zone` (a box on the map) |
| views.presets / custom | `lenses`, one per preset or custom line (+ `lists` for questions with alternatives) |
| tour.steps / story / use_case / opening / closing | number of `tour` steps (the config wins over the style guide's 12–22) and their order |
| tour.include | `roadmap` → `{ "roadmap": true }`; `options` → a step with `overlay` (+ `blocks`); `open-questions` → a step or sheet listing them |
| overlays.roadmap / options / custom | `roadmap`, `overlays` (one per custom entry, from its `source`) |
| branding.theme / primary / secondary / shape / logo / website | `theme.preset` / `theme.primary` / `theme.secondary` / `theme.shape` / `meta.logo` / `meta.url` |
| behaviour.hero / tour_position / zoom_to_focus | settings.hero / settings.tour.position / settings.camera.zoomToFocus |
| behaviour.edges_filter_by_view / edge_labels / overview_edges | settings.edges.filterByContext / labels / overview |
| behaviour.particles (main-flow/focus-only/off) | settings.edges.particles (main/focus/off) + settings.edges.mainFlow |
| behaviour.legend / editor / keyboard | settings.legend (`off` → false) / settings.editor / settings.keyboard |
| workflow.read_only_copy | after step 5, also write the read-only copy (step 4) |

Every box and area gets `sources` (file + section). Nothing without a source (`sources.invent: never`). If sources
disagree about a status, add a status value such as `{"id": "open", "label": "Undecided"}`.

The config always wins over the defaults and ranges in the style guide.

Several diagrams → one file with `{ "meta", "theme", "settings", "hero": "first", "diagrams": [ … ] }` (spec.md:
"Several diagrams in one file"). Shared branding and behaviour go to the top level.

Write the JSON and the report with your file-writing tool (not a shell heredoc: backticks and `$` in the text get
mangled). Also write `extraction-report.md` next to the output: **Sources read** · **Structure** (areas and why) ·
**Inventory** (id → source) · **Conflicts** (what disagreed, how resolved) · **Gaps** (asked for, not in the sources)
· **Status evidence** · **Branding** · **Assumptions**.

If `workflow.pause_after_extract` is true: write the file (step 4), then stop and summarise the report.

## 4. Put the content into the file

New file:
1. Copy the engine: `cp SKILL_DIR/blueprint-deck.html <output>` (PowerShell: `Copy-Item`). Don't read the engine;
   it is large and you never need it.
2. Near the top of the copy is the data block with one placeholder line:
   `{ "blueprintDeck": "empty" }`. Replace that line with your JSON (indented, one space is fine). Inside strings,
   write `</` as `<\/`.

   With Node 18+ you can instead write the JSON to a file and run `node SKILL_DIR/tools/insert.mjs data.json <output>`
   (it copies the engine and escapes for you); `--extract <file>` gives you an existing file's JSON, `--upgrade <file>`
   puts the newest engine into it.

Read-only copy (when `workflow.read_only_copy` is true, or the user asks for "a copy to send"): with Node,
`node SKILL_DIR/tools/insert.mjs --read-only <output> [name.html]` writes a copy without the editor (default name:
the title, e.g. `private-ai-platform.html`). Without Node, tell the user to open the file and use
⋯ → **Download a copy to share** → Read-only. The editable `<output>` stays the master; make a new copy after changes.

Existing file (change, update, upgrade): the data block is at the top. Read the file only up to the line containing
`BD-ENGINE` (first lines of the file) and edit the JSON there. Never change anything below the `BD-ENGINE` line.
For upgrade: copy the new engine as in step 1 and put the old data block's JSON in place of the placeholder.

## 5. Check and fix until clean

1. **If Node 18+ is available:** `node SKILL_DIR/tools/check.mjs <output>` (add `--explain` to list what every tab,
   list item and tour step highlights). Fix every ERROR. Fix the WARNs (text too wide, overlaps, connections through
   highlighted boxes, labels without room, orphan boxes, long tour steps) or say in the report why one is acceptable.
2. **If you have a browser tool** (Playwright, Chrome, a built-in browser): serve the folder
   (`python3 -m http.server 8765 --directory <folder>` or `npx serve`; browsers block automation on `file://`) and
   open `http://localhost:8765/<file>?v=<n>` at 1600×950 (bump `v` after every change; browsers cache).
   - `window.__diagramIssues` has the same errors and warnings as check.mjs.
   - Navigate by setting the hash on the loaded page: `window.__diagramReady = false; location.hash = "tour=3&check"`
     (reset the flag yourself: the hash change is handled a moment later). Setting the same hash again does nothing;
     go via another one (`lens=overview`). Wait until `window.__diagramReady === true`, then read
     `window.__diagramCheck`: text cut off, labels on boxes, highlighted boxes covered by the HUD or off screen, tour
     cards that scroll, tabs that don't fit the tab bar, steps zoomed out too far. Fix every issue (a full sheet that
     scrolls a little on its own button is acceptable; the tour version must fit).
   - The browser measures real text; where it disagrees with check.mjs, the browser is right.
   - Look at the overview, every tab (`lens=<id>`), every tour step (`tour=<n>`), each persona
     (`list=personas&item=<n>`) and every sheet (`overlay=<id>`). Several diagrams: prefix `d=<id>&`.
   - Check the console for errors. Stop the server you started and delete your screenshots.
3. **With neither:** say so, and tell the user to open the file and press E → Check (it checks every tab and step).

## 6. Report

The output path (opens offline by double-click; press E to edit, P for a PDF deck), the stats line, the structure
(areas, personas, tabs) and the tour (one line per step), conflicts and gaps, what you took from the website, and
what you could not verify. For a change: what changed and what you re-checked.

## Update mode

Re-read the sources, change only what the sources changed, keep everything else: edits made in the browser or by
hand (anything not traceable to a source counts as a manual edit), and nodes with `"locked": true`. Keep ids and
order stable. List what changed.

## Never

- Never edit below the `BD-ENGINE` line or write diagram-specific HTML/JS. If the engine can't express something, say
  so and propose the closest option in the spec.
- Never invent numbers, customers, dates, statuses or personas.
- Never publish the file anywhere; it is a local file the user shares.
