---
layout: ../../layouts/Docs.astro
title: Agents
description: How the skill works, its modes (generate, change, update, upgrade, init) and how to use it with Claude Code, Codex and other agents.
---

## How the skill works

The skill is a folder, `blueprint-deck/`, with a `SKILL.md` that tells the agent what to do, and the files it needs:

| file | what it is |
|---|---|
| `SKILL.md` | the instructions: modes, steps, rules |
| `blueprint-deck.html` | the engine with an empty data block; copied for every new diagram |
| `reference/spec.md` | the JSON format ([Diagram format](/docs/format/)) |
| `reference/style-guide.md` | content, structure, viewpoint, layout and tour rules ([Style guide](/docs/style-guide/)) |
| `reference/icons.md`, `reference/lucide-all.json` | the icon names, and every Lucide icon for extras |
| `templates/diagram.config.yaml` | the annotated config ([Configuring](/docs/configuring/)) |
| `templates/example.json` | a finished example |
| `tools/check.mjs` | an optional command-line check (needs Node 18+, nothing to install) |

The agent **never writes HTML, CSS or JavaScript**. It copies the engine, replaces the placeholder data block
(`{ "blueprintDeck": "empty" }`) with the JSON it wrote, and never touches anything below the `BD-ENGINE` line.
That keeps every deck consistent, keeps the agent's work small, and makes the editor possible.

What it does on a first run:

1. **Find the config:** the path you gave, else `diagrams/diagram.config.yaml`, else `diagram.config.yaml`, or the
   config pasted into the prompt (it saves it first).
2. **Read the sources** the config lists, minus `exclude`; for big repos it may delegate reading to sub-agents. With
   `derive_status_from` it reads manifests to see what actually runs. With `branding.website` it takes the logo,
   colours and product name from your site.
3. **Propose the structure** (when `workflow.confirm_structure` is on): 5 to 9 areas, personas and their paths, the
   tabs, and the tour as one line per step. You correct it; it continues.
4. **Write the content** following the spec and the style guide. Every box and area gets `sources`.
5. **Put it into the file** and **check it**: with Node, `node tools/check.mjs`; with a browser tool, it opens the
   file, walks every tab, tour step, persona and sheet, and fixes what doesn't fit. Without either it tells you to
   press E → Check.
6. **Report:** the output path, the structure and tour, conflicts and gaps, what it took from your website and what
   it could not verify. The details go into `extraction-report.md`.

## Modes

The agent picks the mode from what you ask:

| mode | when | what it does |
|---|---|---|
| **generate** | the first time, or `/blueprint-deck <config>` | the full run above |
| **change** | any change request on an existing file ("move X", "add a persona", "step 7 should …", "lighter theme") | edits the data block, re-checks, says what changed |
| **update** | the sources changed | re-reads the sources, changes only what changed, keeps manual edits and `"locked": true` boxes |
| **upgrade** | you want the newest engine in an existing file | copies the new engine and moves the old data block into it |
| **init** | no config exists yet | copies the template config, fills in what it can infer, asks you about audience, viewpoint and the tour story |

Change requests are the normal way to iterate. Lasting preferences ("always say Acme Group", "no moving dots") are
also written into the config so a later update keeps them.

## Claude Code

Install with `curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh -s -- --agent claude` (or the
default command, which finds Claude Code by itself). The skill lands in `~/.claude/skills/blueprint-deck`; use
`--project` to put it into the repository's `.claude/skills/` so the whole team gets it.

Start a new session in your repository, then either paste the prompt from the [configurator](/configurator/) or use
the slash command:

```text
/blueprint-deck
/blueprint-deck diagrams/diagram.config.yaml
```

Claude Code also picks the skill on its own when you ask for "an interactive diagram of this repo" or "a blueprint of
the platform for the board meeting".

## Codex

Install with `curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh -s -- --agent codex`; the skill
lands in `~/.codex/skills/blueprint-deck`. Start a new Codex session in your repository and paste the prompt from the
configurator, or ask:

```text
Use the blueprint-deck skill to make a diagram of this repo from diagrams/diagram.config.yaml.
```

## Other agents

Agents that support Agent Skills find the skill in their skills folder: `--agent agents` installs into the shared
`~/.agents/skills`, and `--dir <path>` into any folder. For an agent without skill support, put the folder somewhere
it can read and start with:

```text
Read blueprint-deck/SKILL.md and follow it. SKILL_DIR is the folder that file is in.
Then make a Blueprint Deck from diagrams/diagram.config.yaml.
```

## Tips

- Keep `workflow.confirm_structure: true` for the first run. Most of a deck's quality comes from the areas and their
  names, and correcting an outline is cheaper than correcting 30 boxes.
- Point `sources.include` at the docs that matter for this audience; less noise gives a clearer map.
- Write what the last version got wrong into `comments`. The agent treats every comment and note as an instruction.
- Big repos: agents with sub-agents read in parallel and hand back structured facts, which keeps the main context free.
