# Blueprint Deck Kit

**Turn your docs into a deck people will love: an interactive diagram you can present, edit and send as one file.**

**Free and open source (MIT).** No account, no tracking, nothing else to install: it runs on your own coding agent.

![A Blueprint Deck: a pan-and-zoom map of a system with areas, boxes, connections and tabs](docs/images/overview.jpg)

Your coding agent (Claude Code, Codex or any agent that supports skills) reads your docs and writes a
*Blueprint Deck*: a pan-and-zoom map of your product, process or system that is also a slide deck.

- **Click any box** for a side panel: what it is, why it matters, the technology, its sources.
- **Tabs** highlight one question at a time: the request path, governance, cost, the manual steps.
- **Personas**: pick one and see its numbered path through the map.
- **A guided tour** tells the story step by step; the camera follows. Use ← → like slides.
- **Sheets** for what isn't a place on the map: roadmap, pilot options, pricing tiers.
- **Several diagrams in one file**, e.g. a product view for executives and a technical view for engineers.
- **Edit it in the browser**: press **E** to change texts, colours, theme, logo, boxes, tabs, tour and personas.
- **One HTML file** that works offline, on phones, in any browser. **P** exports a PDF deck.

It works for product and architecture blueprints, data flows, business processes, customer journeys, partner
ecosystems and org maps, in a product (what it does for whom) or technical (components and technology) viewpoint.

| | |
|---|---|
| ![Personas: picking one numbers its path through the map](docs/images/persona-path.jpg) | ![The guided tour on a light theme: the camera zooms to what each step talks about](docs/images/tour-light.jpg) |
| **Personas** with their numbered path through the map | **A guided tour**, here on the light `paper` theme |
| ![The editor: click a box to change its texts, icon, area, status and colour](docs/images/editor.jpg) | ![The configurator: shared settings, one tab per diagram, a live theme preview and the prompt](docs/images/configurator.jpg) |
| **The editor** (press E): no agent, no rebuild | **The configurator** writes the config and the prompt |

**[Website & configurator](https://blueprint-deck.lukasvecerka.dev)** ·
**[Examples](https://blueprint-deck.lukasvecerka.dev/gallery/)** ·
**[Docs](https://blueprint-deck.lukasvecerka.dev/docs/)**

---

## Quick start

### 1. Install the skill (once)

macOS / Linux:
```bash
curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh
```
Windows (PowerShell):
```powershell
irm https://blueprint-deck.lukasvecerka.dev/install.ps1 | iex
```

The script copies the skill into the skills folder of every agent it finds (`~/.claude/skills`, `~/.codex/skills`,
`~/.agents/skills`). Options: `--agent claude|codex|agents|all`, `--dir <folder>`, `--project` (into the current
repository), `--uninstall`. From a clone, run `./install.sh`. Prefer to do it by hand? Copy `skill/blueprint-deck/`
into your agent's skills folder.

Nothing else to install, no account: the skill is plain files, and the agent runs on your computer with your own subscription.

### 2. Describe the diagram

Open the **[configurator](https://blueprint-deck.lukasvecerka.dev/configurator/)** (or `configurator/index.html`
from a clone, offline). Pick the type, viewpoint, audience, sources, tabs, tour, look and brand colours, one tab per
diagram if you want several. Click **Copy prompt**: it contains the whole configuration.

No form? Just ask your agent: *"Use the blueprint-deck skill to make a diagram of this repository."* It asks the few
things it needs.

### 3. Generate

Paste the prompt into your agent, in your repository. The agent:
1. reads the sources from the config,
2. proposes the structure (areas, personas, tabs, tour) and waits for your OK,
3. writes `diagrams/index.html` and an `extraction-report.md` (sources read, conflicts between your docs, gaps,
   assumptions),
4. checks every tab and tour step, and fixes what doesn't fit.

### 4. Present, change, share

- Open `diagrams/index.html`. `←` `→` / Space walk the tour, `Esc` closes, `F` fits the map, `1`–`9` switch
  diagrams, `P` makes a PDF deck.
- **Small changes: press E.** Click a box or an area to edit it, drag boxes to move them, change the theme and colours,
  upload a logo, edit tabs, tour steps and personas. In Chrome and Edge your changes are saved straight into the file;
  in other browsers they are kept in the browser until you download the updated file.
- **Bigger changes: ask the agent.** "Make it more technical", "add a persona for the auditor", "step 7 should also
  show the registry", "shorten the tour to 10 steps". When your docs change: "update the diagram".
- **Share** the file by email or chat, or upload it to any static host (Cloudflare Pages, Netlify, GitHub Pages, your
  intranet) for a link that also works on phones. Deep links open a view directly: `index.html#tour=5`,
  `#lens=governance`, `#node=gateway`, `#list=personas&item=2`.

---

## How it works

```
diagram.config.yaml ──▶ your agent + the blueprint-deck skill ──▶ diagrams/index.html
   what you want           reads your docs, writes the content       the engine + your diagram's JSON
   (configurator)          as JSON, checks the result                 one file, opens anywhere
```

The engine is fixed and lives inside every file; the agent only writes the diagram's content (areas, boxes,
connections, tabs, personas, tour, sheets) as a JSON block at the top of the file. That is why every diagram behaves
the same, why it needs no build step, and why you can edit it without the agent. The format is documented in
[`skill/blueprint-deck/reference/spec.md`](skill/blueprint-deck/reference/spec.md); the rules the agent follows in
[`SKILL.md`](skill/blueprint-deck/SKILL.md) and the [style guide](skill/blueprint-deck/reference/style-guide.md).

Optional, if you have Node 18+: `node ~/.claude/skills/blueprint-deck/tools/check.mjs diagrams/index.html --explain`
validates a file and lists what each view highlights. Without Node, press E → Check in the browser.

## Examples

Open them from [`examples/`](examples/) or the [gallery](https://blueprint-deck.lukasvecerka.dev/gallery/):
- `acme`: a fictional shop, two diagrams in one file (platform architecture with personas + checkout process)
- `blueprint-deck`: this kit explaining itself
- `saas-onboarding`: a customer journey (fictional), light theme
- `postgresql`: how PostgreSQL works, a technical view built from the official docs

## Requirements

- A coding agent that supports Agent Skills (`SKILL.md`), such as Claude Code or Codex.
  Other agents can be pointed at `SKILL.md` as instructions.
- A modern browser (Chrome, Edge, Safari, Firefox; phones included).
- Optional: a browser tool in your agent (e.g. Playwright MCP) so it can look at the result itself, and Node 18+ for
  `check.mjs`.

## Contributing

Issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for how the engine is built and tested.

## Licence

[MIT](LICENSE). Icons from [Lucide](https://lucide.dev) (ISC); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
