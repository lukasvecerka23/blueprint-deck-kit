# Style guide

Rules distilled from real presentation rounds. Each one exists because a presenter or a reviewer had to ask for it.

## Structure first: areas a person would draw

Before writing boxes, decide the 5–9 areas (zones) that are ours (plus the outside areas around them) as a person would explain the thing on a whiteboard to the
audience in the config, and get them approved when `workflow.confirm_structure` is on. Areas are named after what
they do for someone ("Who uses it", "Access & identity", "One API for every model", "Guardrails", "Where models run"),
not after the repository layout or the order of the docs. A reviewer compared a hand-made diagram with a generated
one: the hand-made one read as a product, the generated one as an implementation inventory. The difference was the
area structure and the naming, not the number of boxes.

## Viewpoint

`meta.viewpoint` comes from the config and changes what goes into every box and panel:

| | product (default for executives, business, customers, investors) | mixed | technical (architects, engineers) |
|---|---|---|---|
| areas | capabilities and who they serve | capabilities, technology underneath | layers, runtimes, deployment units |
| box title | the capability ("Guardrails on every request") | capability | the component ("Guardrail hook") |
| box sub | what it does for whom | technology in a few words | technology, protocol, version |
| `what` / `why` | outcome and value | both | mechanism, failure modes, limits |
| `pick` / `alt` | `pick` at most (`panel.tech: pick` or `off`) | `pick` | `pick` + `alt` with the exit path (`panel.tech: full`) |
| personas | yes, with paths | yes | optional |
| external parties | always marked | always marked | always marked |

The same sources can produce both; when the config asks for two audiences, make two diagrams in one file
(`diagrams:` list) rather than one diagram that tries to be both.

## Boundaries: what is ours and what isn't

- Every zone that is not built and run by the product/organisation gets a `boundary`: `external` for third-party
  services and the users' own applications, `partner` for partners, `customer` for things the customer owns and runs
  (their data centre, their VPC, their identity provider). The engine draws them dashed/dotted with a badge and adds
  them to the legend, so nobody mistakes an external API for a component of the product.
- Which boundary? Apps the customer builds and runs, their identity provider, their hardware → `customer`; third-party
  SaaS and public APIs → `external`; a named partner's system → `partner`.
- Users and client applications sit on the left, external providers on the right, and both are outside the frame.
  The automatic frame wraps only the zones that are ours; keep other zones out of its rectangle (the check warns).

## Content

- **Sourced, not invented.** Every component, number, name and claim comes from the sources in the config. If the
  sources don't say it, leave it out or list it as a gap in the report. Put file references in `sources`.
- **Planned vs. real.** Never present planned things as built. Use `status` for it, and say "intended" / "planned"
  in the hero footnote when `project.maturity` is `planned`. With `derive_status_from`, a component counts as
  running only if a manifest actually deploys it.
- **Write for the audience in the config.** Executive tone: outcomes and value first, product names second, no
  protocol soup. Technical tone: name the protocols, ports, data formats and failure modes.
- **Panel text:** `what` = 1–3 sentences. `why` = 2–4 bullets, each a benefit, not a feature restated.
  `pick` = the chosen technology + the one reason it won. `alt` = real alternatives + the exit path.
- **Text budget per box.** Room for text = box width − 76 px (normal box) or − 90 px (big box). A title character takes
  about 8 px (normal, 14.5 px font) or 10 px (big); a subtitle character about 6 px. So a 240 px box fits ~20 title and
  ~27 subtitle characters, a 200 px box (two columns) ~15 and ~20. Normal boxes cut the subtitle with …; big boxes wrap
  it to two lines. A zone header fits its title (13 px capitals, ~10 px per character) + subtitle + badge in the zone
  width minus ~40 px. Product name in the title only if the product *is* the component; otherwise put it in `sub`.
- **Decision ids and question ids** from the docs (DL7, Q4, C2) belong in `badge`, `sub` or the text, so people can find the source.
- **Doc inconsistencies are findings.** Resolve by `sources.priority`, then list them in the report. Don't silently pick one.
- **Name rules** from `branding.name_rules` apply to every string, including the hero and overlays.
- **No ambiguous jargon in titles.** A word that means something else to part of the audience gets replaced or
  qualified: "Edge" (reads as edge computing) → "Access layer" or "Entry point"; "Agent" (software agent or a person?),
  "Pipeline", "Platform" alone. If the sources use the ambiguous term, keep it in `sub` or the panel text.
- **Control points are on the path.** If the sources say requests pass a control (guardrails, policy check, approval,
  audit, budget check), the main flow edges must go *through* those boxes in the map and in every tab and persona path
  that shows that flow. A guardrail that is only mentioned in a panel reads as optional.

## Diagram types

Pick `meta.type` from the config. The engine is the same; what changes is what a zone, a box and an edge mean,
and the reading direction.

| type | zones are | boxes are | edges are | layout |
|---|---|---|---|---|
| architecture | layers / areas of the system | components | calls, data, control | users left, system middle (framed), providers right, foundation bottom |
| data-flow | stages (ingest → process → store → serve) | jobs, topics, stores | data movement, labelled with format/volume | sources left → consumers right, one column per stage |
| process | phases, numbered in the title ("1 · Cart") | steps | sequence ("then"), hand-offs | phases left → right, external parties as a bottom row; `status` = manual/automated or owner |
| journey | journey stages | touchpoints, channels | the customer's path | stages left → right; pains/opportunities in panel `extra` sections |
| ecosystem | domains or partner groups | products, partners, platforms | contracts, integrations, money | "us" in the framed middle, partners around it |
| org | units / departments | teams or roles | reporting, collaboration, services | top-down by hierarchy, or grouped by value stream |
| custom | as the config says | | | follow the config's map notes |

Tabs for non-architecture types ask the same kind of question: process → "happy path", "exceptions", "manual
steps"; journey → "typical path", "time to value", "pain points" (a list, one item per stage), "outside parties";
org → "who owns X". The tour follows the reading direction.

- **Journey and process**: stages/phases are columns left → right; external parties and customer-owned systems go in a
  row along the bottom (`boundary` set), so each stage can connect straight down to them. `status` for a journey is
  who drives the touchpoint (self-serve / human-led) or the channel; for a process manual / automated or the owner.
  Box counts are smaller than for architecture: about 2–4 per stage (a 7-stage journey ≈ 15–25 boxes, whatever `map.detail` says).
- **Aspect ratio**: aim for roughly 16:9 overall. A single long row of 7+ stages gets tiny in the overview (the check
  warns); use two rows, or narrower columns.

## Map layout

- Reading order is the main flow: requests/data enter on the **left**, the system is in the **middle**, external
  providers/targets are on the **right**, shared foundations run along the **bottom**.
- Use `settings.layout.grid` for zones: columns of 280–640 px, rows sized to their content, gap 40.
  A world around 2000–2400 × 1300–1600 px fits a 16:9 screen well.
- 3–8 components per zone. Prefer automatic node placement (`zone.layout.columns`), explicit `x/y` only to
  fix a specific arrangement. Start nodes ≥ 55 px below the zone top so the header stays clear.
- `size: "big"` for the 1–2 most important components of a zone (110 px tall), normal for the rest (64 px).
- Put components that talk to each other a lot next to each other; avoid edges that cross the whole map.
  A hub with many spokes (a gateway calling detectors) reads best with the spokes stacked in one column next to it.
- Inside a zone, order boxes along their internal chain (a → b → c top to bottom), so connections between them
  are short and never skip over a box. A connection that must pass several boxes is better attached to the zone
  (`"zone:<id>"`). The build warns when a connection runs through a box highlighted together with it.
- `boundary` for everything that isn't ours (see above); `base: true` for a foundation layer.
- Every zone colour is distinct and readable on dark and light themes (Tailwind 400–500 shades work well; the engine
  darkens titles automatically on light themes). On light themes (`light`, `paper`) prefer the 500–600 shades for zones
and edges, so thin lines stay visible. External zones read best in grey (`#94a3b8`; `#64748b` on light themes).
- Automatic placement uses zone padding 20, gap 16 and the first box 55 px below the zone top (`zone.layout`
  `padding`, `gap`, `top`); use the same numbers when you place a box by hand.
- A zone that is ours but should sit outside the frame (e.g. replica servers, a second site) gets `"frame": false`.

## Edges

- Every edge has ≥ 1 group. Groups are the kinds of flow (`req`, `data`, `gov`, `ops`, `deploy` …), 5–10 in total.
- Label only edges where the label adds information ("OIDC / JWT", "append-only", "U2"); 2–4 words. Labels need
  room: a label of 2–3 words needs a connection of about 80–120 px, so label connections that cross between zones,
  not ones between boxes stacked 16 px apart or zones 40 px apart (the check warns).
- `settings.edges.mainFlow` = the group that tells the core story; it is drawn brighter with moving dots in the overview.
  On dense maps (40+ boxes) set `settings.edges.overview: "main"` so the overview shows only that story.
- `dashed: true` for optional, planned or one-off connections.

## Tabs (lenses)

- 4–8 tabs including the overview; keep titles short (1–3 words) so they fit the tab bar (the check reports it). Each tab answers one question ("How does a request flow?", "Who governs what?").
- A tab lights up only what belongs to it: `nodes`/`zones` + its edge `groups`. Clicking a box inside the tab then
  shows only that tab's kinds of connections (`edges.filterByContext`).
- Use a `list` when the question has alternatives (usage patterns, deployment options, tiers): each item highlights its own path.

## Personas

- If the sources name users, roles, actors or personas, add `personas` (3–7). Each gets a `path`: the boxes they touch,
  in the order they touch them (typically: their app or console → access → the capability they came for → what
  records it). 3–8 steps. The engine numbers the boxes and lights the connections between consecutive steps, so
  consecutive steps should be connected by an edge where the sources say they talk to each other.
- `text`: their goal and their main pain, and which parts serve them (1–3 sentences). Mark unvalidated personas as
  hypotheses in the text when the sources say so.
- When the config sets `personas.on_map`, give each persona a `zone`: the area with the applications or channels they
  use (often a "Who uses it" or "Applications" area on the left), so the path visibly starts at the person. Make that
  zone tall enough for the extra boxes, or use `layout.columns: 2`. Best is a column of its own to the **left** of
  the zones where their paths start (people → their apps → the system): the connection from a persona's box then
  runs sideways. A personas zone directly above or below the apps makes those connections run through the other
  persona boxes. Persona titles are often long: give that column ~300 px, and set `boxSub` to a short subtitle. Otherwise keep personas off the map (the Personas
  tab is enough) and never draw them as ordinary boxes.
- No roles in the sources (common for technical diagrams of a piece of software): no personas. Never make them up;
  say so in the report.

## Tour

- 12–22 steps. Opening: the problem or the vision. Middle: one step per area or per stage of the story. End: roadmap,
  options, open questions, then a closing "why this" with a `summary` of 4–6 tiles.
- One idea per step, up to ~110 words (shorter is fine), active voice. Title = the takeaway ("Guardrails in the request path, not in a document"),
  not the component name.
- Each step highlights only what the text talks about (≤ ~15 boxes) and sets `edges` to the relevant groups, or
  `["none"]` for summary steps. The camera zooms to the highlight, so a tight highlight = a readable zoom.
- `fit: "all"` for intro and closing steps and for steps about the whole map.
- Use `summary` tiles for lists of 3–6 parallel points instead of a long sentence.

## Overlays

- Use an overlay for content that is a table or a set of options, not a place on the map: pilot options, pricing
  or sizing tiers, the full roadmap. Cards: 2–4, the recommended one `main: true`. Add a `note` with the recommendation.
- Reference an overlay from the tour with `"overlay": "<id>"`. In the tour the sheet must fit one screen: show only
  the essential blocks with `"blocks": [0, 1]` or mark the rest `"tour": false`; the full sheet stays on its button.

## Visual check (what went wrong before)

- Text that doesn't fit its box → `#check` flags it; shorten or widen. Never leave a cut-off title.
- Zone headers overlapping their first component → start nodes lower.
- Labels on top of boxes → move or drop the label; the engine already avoids collisions where it can.
- A tour step that zooms to a sliver → its highlight is too spread out; narrow it or use `fit: "all"`.
- Two panels at once (list panel + node panel) is expected only outside the tour; the sidebar tour shows lists inline.
- `#check` reports all of the above automatically; `node tools/check.mjs <file> --explain` shows what each view
  highlights; the editor's Check tab (press E) runs both for every tab and step.
