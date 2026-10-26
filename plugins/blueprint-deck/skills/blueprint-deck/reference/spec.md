# Diagram data reference

A Blueprint Deck is **one HTML file**. The diagram itself is the JSON in the block at the top of that file:

```html
<script type="application/json" id="bd-data">
{ "meta": { … }, "zones": [ … ], "nodes": [ … ], … }
</script>
<!-- ===== BD-ENGINE … do not edit below this line ===== -->
```

Everything after that block is the engine (the same in every diagram). The engine fills in defaults, lays out the
boxes, validates the data and renders it when the file opens; there is no build step. Problems are shown on screen,
in the console (`[diagram-errors]`, `[diagram-warnings]`), in `window.__diagramIssues`, in the editor's Check tab,
and by `node tools/check.mjs <file>` if Node is available.

Text fields may contain simple inline HTML: `<b>` `<strong>` `<i>` `<em>` `<u>` `<s>` `<br>` `<code>` `<small>` `<sub>`
`<sup>` `<mark>` `<span>` and `<a href="https://…">`. Anything else (scripts, event handlers, `javascript:` links,
other tags) is removed before rendering and reported as a warning. Escape a literal `<` as `&lt;`; write `</` as `<\/`
(the editor and the tools do this when they save). Images (logos, icons) must be inside the file as `data:` URIs or
SVG markup: every file blocks network requests (Content Security Policy). Coordinates are world pixels; the camera scales the world to the screen.

## Top level

```jsonc
{
  "meta":     { ... },          // required
  "hero":     { ... },          // start screen; omit or set settings.hero=false to skip it
  "settings": { ... },          // behaviour; everything has a default
  "theme":    { ... },          // look: preset, colours, shape
  "status":   { ... },          // optional status tags on boxes (MVP/Next/Later, Running/Planned, …)
  "frame":    { ... },          // optional labelled frame around all zones that are ours
  "zones":    [ ... ],          // required: the areas
  "nodes":    [ ... ],          // required: the boxes
  "edges":    [ ... ],          // connections
  "groups":   { ... },          // named node sets, referenced as "@name"
  "lenses":   [ ... ],          // tabs; the first one is the overview
  "personas": [ ... ],          // optional: who uses it, each with a path through the map (becomes a tab + list)
  "lists":    { ... },          // clickable lists shown in a panel (usage patterns, options …)
  "tour":     [ ... ],          // guided tour steps
  "roadmap":  { ... },          // optional phases → tour steps + a roadmap sheet
  "overlays": [ ... ],          // optional full-screen sheets (options, sizing, pricing …)
  "icons":    { ... }           // optional extra icons: { "name": "<path d=…/>" } (24×24, stroke)
}
```

## meta

```json
{ "title": "Acme Commerce Platform", "subtitle": "Platform blueprint", "type": "architecture",
  "viewpoint": "product", "language": "en", "logo": "icon:shopping-cart", "url": "https://acme.example" }
```
- `type`: `architecture` | `data-flow` | `process` | `journey` | `ecosystem` | `org` | `custom`. Sets the UI wording
  (legend, panel kicker, tour hint), e.g. "Step" / "External party" for a process. Layout rules per type: style guide.
- `viewpoint`: `product` | `mixed` (default) | `technical`. Decides how much technology the side panels show
  (`settings.panel.tech`) and how the content is written (style guide). Product = what it does for whom;
  technical = components, protocols, technology choices and exit paths.
- `logo`: `icon:<name>`, an inline `<svg …>`, a `data:` URI (PNG/SVG/JPG, stored in the file), or 1–3 letters.
- `url`: the company or product website, kept as information only: the deck doesn't link it (links belong in a
  box's `sources`).

## hero

```json
{
  "eyebrow": "Platform blueprint",
  "title": "Acme Commerce Platform",
  "lead": "One or two sentences: what it is and for whom.",
  "pillars": [ { "icon": "zap", "color": "#38bdf8", "title": "Fast checkout", "text": "One line of value" } ],
  "footnote": "Fictional example · based on docs/ · use ← → in the tour"
}
```
Up to 4 pillars look best.

## settings (all optional)

```jsonc
{
  "hero": true,                     // show the start screen
  "legend": "collapsed",            // collapsed (small pill, opens on click) | open | false
  "editor": true,                   // E opens the editor; false switches it off (a read-only copy also leaves its code out)
  "credit": true,                   // a small "Made with Blueprint Deck Kit" on the start screen, in the ⋯ menu and the PDF footer
  "keyboard": true,                 // ← → Space Esc F + - P (PDF) E (edit) 1–9 (switch diagram)
  "tour":   { "position": "auto" }, // auto (right sidebar on landscape screens, else bottom) | right | bottom
  "camera": { "zoomToFocus": true, "maxZoom": 1.25, "nodeZoom": 1.15, "zoneZoom": 1.3, "padding": 24 },
  "edges":  { "filterByContext": true, // inside a tab/step, clicks and hovers show only that tab's edge groups
              "raiseOnHover": true,    // a hovered box's connections are drawn above the boxes
              "labels": "focus",       // focus = labels on highlighted edges | never
              "particles": "main",     // main = dots on the main flow and highlighted edges | focus = only highlighted | off
              "mainFlow": "order",     // edge group drawn brighter (with dots) in the overview
              "overview": "all" },     // edges in the overview: all (faint) | main (only mainFlow) | none
  "motion": { "intro": true },      // boxes pop in on load
  "panel":  { "sections": ["what", "why", "pick", "alt", "links", "sources"], "showSources": true,
              "tech": "pick" },     // full = pick + alternatives & exit path | pick = pick only | off; default from meta.viewpoint
  "personas": { "tab": true },      // personas get their own tab
  "layout": { "grid": { "columns": [280, 280, 640, 380, 300], "rows": [660, 290, 220], "gap": 40, "origin": [60, 230] } },
  "labels": { "inside": "Platform component", "outside": "Outside the platform", "what": "What it is", ... }
}
```
`labels` overrides any UI string, so the whole UI can be translated: `inside`, `outside`, `area`, `boundary`
(`{ours, customer, partner, external}`), `hint`, `what`, `why`, `pick`, `alt`, `links`, `partOf`, `sources`, `overview`,
`points`, `components`, `clickOne`, `showAll`, `tour`, `startTour`, `explore`, `back`, `next`, `finish`, `fullRoadmap`,
`tourHint`, `legend`, `personas`, `personasSub`.

## theme

```json
{ "preset": "light", "primary": "#0d9488", "secondary": "#7c3aed", "shape": "rounded", "font": "Inter, sans-serif" }
```
- `preset`: dark `midnight` (default: navy, blue and violet), `blueprint` (navy, blueprint blue and cyan), `graphite`
  (neutral), `forest` (green), `ember` (dark red); light `light`, `paper` (warm).
- `primary` / `secondary`: the brand colours (buttons, highlights, the logo tile, progress). Lighter and darker shades are
  derived automatically and adjusted for light or dark presets. `accent` / `accentAlt` are accepted as older names.
- `shape`: `rounded` | `square` | `pill`: the corners of areas, boxes, their icons and tags. Menus, panels and buttons keep the same rounding.
- `vars`: overrides any CSS variable (`bg`, `ink`, `glass`, `node-a`, `node-b`, `muted`, `body`, `font`, `r-node` …).

## status

```json
{
  "toggleLabel": "MVP scope", "toggleTitle": "Show what is in the MVP and what comes later", "default": true,
  "values": [
    { "id": "mvp",   "label": "MVP",   "long": "In the MVP",   "color": "#6ee7b7" },
    { "id": "next",  "label": "Next",  "long": "Next horizon", "color": "#fcd34d", "dashed": true },
    { "id": "later", "label": "Later", "long": "Later",        "color": "#cbd5e1", "dashed": true }
  ]
}
```
A node gets a tag with `"status": "mvp"`. `dashed` also draws the box border dashed while tags are shown.

## frame

```json
{ "label": "<b>Acme platform</b> · one Kubernetes cluster", "margin": 25 }
```
Without `x/y/w/h` it wraps all zones that are ours (not external or partner).

## zones

```json
{ "id": "core", "title": "Commerce core", "sub": "Order path", "color": "#a78bfa",
  "grid": [2, 0],                       // or explicit "x", "y", "w", "h"; grid = [col, row, colSpan?, rowSpan?]
  "boundary": "ours",                   // ours (default) | customer | partner | external
  "base": false,                        // neutral grey: a foundation layer spanning several columns
  "frame": true,                        // false: keep this zone out of the automatic frame
  "tag": "Core",                        // small pill on the right of the header (replaces the boundary badge)
  "icon": "layers",
  "layout": { "columns": 2, "gap": 16, "padding": 20, "top": 55 },
  "desc": "Panel overview: 2–4 sentences.",
  "points": ["Key point", "Key point"],
  "sources": ["docs/architecture.md#commerce-core"] }
```
`boundary` makes clear what is not yours: `external` (third-party services, users' own apps; dashed border, "External"
badge, legend entry), `partner` (dashed, "Partner"), `customer` (dotted, "Customer-owned", e.g. the customer's data
centre or VPC). `"outside": true` is the older name for `external`. `"boundaryTag": false` hides the badge.
Each zone needs a 6-digit hex `color`; its nodes inherit it. Keep headers short: title + sub + badge must fit the zone width.

## nodes

```json
{ "id": "api", "zone": "core", "title": "Commerce API", "sub": "One API for carts, orders and accounts",
  "icon": "route", "size": "big", "badge": "API", "status": "mvp",
  "what": "1–3 plain sentences: what it is and does here.",
  "why": ["2–4 bullets: why it matters to the audience"],
  "pick": "Technology pick and why (optional)",
  "alt": "Alternatives and exit path (optional)",
  "extra": [ { "title": "Sizing", "text": "Paragraph or [\"bullets\"]" } ],
  "sources": ["docs/architecture.md#commerce-api", "docs/decisions.md#adr-3"],
  "kind": "Platform component" }
```
`sources`: paths relative to the project, or full `https://` URLs. URLs are shown short and clickable (a file in a
GitHub/GitLab/Bitbucket repo as its path, `src/app.go#L10-L40`; other pages as `host/…/page`), so write full permalinks.
Placement: omit `x/y` to let the zone place it (in array order, filling `layout.columns`; `"span": 2` for a wider box),
or give `x`, `y`, `w`, `h` explicitly. Defaults: `w` = column width (240 if explicit), `h` = 64 (normal) or 110 (`size: "big"`).
`compact: true` uses a smaller title in big boxes. A normal box shows one line of subtitle (cut with …); a big box wraps to two.
`icon`: a name from `reference/icons.md`, a name from the diagram's `icons`, or an image (`data:` URI).

## edges

Object or array form:
```json
{ "from": "api", "to": "payments", "groups": ["order", "pay"], "label": "authorise · capture", "dashed": false }
["api", "payments", ["order", "pay"], "authorise · capture"]
```
`from`/`to` may be `"zone:<id>"` to connect to a whole zone. `groups` are free-form ids: tabs and tour steps select
which groups are shown. `dashed` = optional/planned connection. The edge takes the colour of its `from` side's zone;
set `"color": "#hex"` to override. Shape: a connection leaves sideways when the boxes are apart horizontally and the
horizontal offset is more than ~0.45× the vertical offset; otherwise it leaves from the top or bottom. That decides
which boxes it passes. A connection that would run through other boxes is better attached to a whole zone
(`"zone:<id>"`) or avoided by reordering; the checks warn when it runs through a box that is highlighted with it.

## groups

```json
{ "order-core": ["web", "api", "orders"], "money": ["@order-core", "payments"] }
```
Use `"@order-core"` in any `nodes` or `path` list.

## lenses (tabs)

```json
{ "id": "pay", "title": "Payments", "color": "#f43f5e",
  "nodes": ["@money"], "zones": ["partners"],           // what lights up (zones = all their nodes)
  "edges": ["pay"],                                     // which edge groups light up; ["none"] = no edges
  "list": "channels",                                   // optional: open this list in the side panel
  "fit": "all", "camZones": ["core"] }                  // optional camera: whole map / these zones
```
The first lens is the overview and normally has no `nodes`.

## personas

```json
[ { "id": "shopper", "tag": "P1", "title": "Shopper", "sub": "Find it, pay, get it delivered", "icon": "user",
    "text": "Pains and how the product serves them, 1–3 sentences.", "color": "#60a5fa",
    "path": ["web", "api", "orders", "payments"],                  // ordered: their way through the map
    "nodes": ["mail"],                                             // optional: also highlighted, not numbered
    "edges": ["order"],                                            // optional: also light these edge groups
    "zone": "customers" } ]                                        // optional: also a box on the map, in this zone
```
Personas become a **Personas** tab (unless `settings.personas.tab` is false) that opens the list `personas` in the
side panel; a tour step can show it too with `"list": "personas"`. `icon` replaces the tag in the list.
Picking one highlights its path: the boxes are numbered 1, 2, 3 … in order, the connections between consecutive
steps light up, and the panel lists the steps.

With `zone`, the persona is **also a box on the map** in that zone (before the zone's other boxes), with a connection
to the first step of its path; that connection only shows when the persona is picked or hovered. Clicking the box opens
the Personas panel with that persona picked. The box uses the persona's `id` (default `persona-<n>`), `title`, `sub`,
`icon` (default `user`) and `color`. The box shows `boxSub` if given (a short subtitle that fits a box), else `sub`; set `badge` for a badge on the box. Use `path` when the order means something (how they use it), `nodes`
for what they rely on without an order.

## lists

```json
"channels": { "title": "Sales channels", "eyebrow": "How orders come in", "sub": "…", "icon": "route", "color": "#f59e0b",
  "intro": "Shown above the items.", "edges": ["order"],
  "items": [ { "tag": "C1", "title": "Web shop", "sub": "…", "text": "…", "color": "#22d3ee",
               "nodes": ["@order-core", "catalog"], "path": ["web", "api", "catalog"], "withInside": false } ] }
```
Clicking an item highlights its `nodes` and `path` (plus every inside node if `withInside`) and the edges of
`item.edges`, else the list's `edges`; with neither, every edge between highlighted nodes lights up. With a `path`,
the path's connections light up and the boxes are numbered. Open a list from a lens or tour step with `"list": "<id>"`.

## tour

```json
{ "title": "One API for every channel", "text": "60–110 words.", "nodes": [...], "zones": [...], "edges": ["order"],
  "summary": [["Bold", "one line"], ["Bold", "one line"]],   // optional 2–6 tiles
  "list": "channels",                                        // optional clickable list in the card
  "overlay": "options",                                      // optional: render an overlay's blocks as a wide sheet
  "blocks": [0, 1],                                          // optional: only these blocks of the overlay (by index)
  "fit": "all", "camZones": ["core"] }
{ "roadmap": true }                                          // expands to one step per roadmap phase
```

## roadmap

```json
{ "title": "Roadmap", "lead": "How phases are paced.", "buttonLabel": "Roadmap", "buttonOpens": "tour",
  "phases": [ { "when": "NOW", "title": "Launch the core", "main": true, "text": "Tour text for this phase.",
                "items": [ { "title": "Checkout v1", "text": "Outcome …", "note": "depends on the payment contract", "nodes": ["payments"] } ] } ],
  "notes": [ { "title": "Hosting decision", "text": "…" } ] }
```
The roadmap button starts a tour through the phases (`buttonOpens: "overlay"` opens the full roadmap sheet instead).

## overlays

```json
{ "id": "options", "title": "Launch options", "eyebrow": "Acme Commerce", "lead": "…", "icon": "rocket",
  "buttonLabel": "Launch options", "button": true,
  "blocks": [
    { "type": "cards", "columns": 3, "cards": [ { "tag": "Option A", "title": "…", "text": "…", "main": false, "rows": [["Effort", "~6 weeks"]] } ] },
    { "type": "note", "title": "Recommendation", "text": "…" },
    { "type": "grid", "title": "Success criteria", "columns": 3, "items": [["In active use", "…"]] },
    { "type": "text", "title": "Assumptions", "text": "…" },
    { "type": "roadmap" } ] }
```
`"button": false` hides the overlay's top-bar button. `"tour": false` on a block leaves it out when a tour step shows the overlay.

## Several diagrams in one file

```jsonc
{
  "meta":  { "title": "Acme Commerce", "logo": "icon:shopping-cart", "url": "https://acme.example" },  // shared: title of the collection, logo, website
  "theme": { "preset": "midnight" },                              // shared by all diagrams
  "settings": { "legend": "collapsed" },                           // shared defaults; a diagram's own settings win
  "hero": "first",                                                 // first | all | none: which diagrams show their start screen
  "diagrams": [
    { "id": "platform", "title": "Platform architecture", "sub": "Components and connections", "meta": { "type": "architecture" }, "zones": […], "nodes": […], … },
    { "id": "checkout", "title": "Checkout process", "sub": "From cart to delivery", "meta": { "type": "process" }, … }
  ]
}
```
Each entry in `diagrams` is a complete diagram plus `id`, `title` and `sub` for the switcher. `theme`, `settings`,
`icons`, `status` and `meta` (except title/subtitle) at the top level are shared. The logo box becomes a switcher
(click it, or press 1–9). Deep links: `#d=checkout&tour=2`.

## Deep links

`index.html#lens=pay`, `#tour=5`, `#overlay=options`, `#node=api`, `#zone=core`, `#list=personas&item=2`,
`#status=off`, `#d=<diagram id>`, combinable with `&`.
`#check` runs the screen check and stores the result in `window.__diagramCheck` (re-run with `window.__diagramCheckRun()`):
text that doesn't fit, edge labels on boxes or zone headers, highlighted boxes covered by the HUD or off screen,
tour cards/sheets that scroll, steps zoomed out too far. `window.__diagramReady` turns true when the camera has settled.
`window.__diagramIssues` holds the data checks (`errors`, `warnings`, `stats`) of the diagram on screen.
