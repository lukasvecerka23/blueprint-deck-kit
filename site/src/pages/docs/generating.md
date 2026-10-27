---
layout: ../../layouts/Docs.astro
title: Generating
description: Start a run, see what the agent does and where the files go, and keep working with it afterwards (changes, updates when the docs change, a newer engine, a newer skill).
---

You work with Blueprint Deck in your agent session, in plain words. The agent picks what to do from what you ask; you
never have to name a mode.

## Start a run

Open a new agent session in your project folder (a codebase, or any folder with your docs), then either:

- paste the prompt from the [configurator](/configurator/). It carries the whole config, and the agent saves it to
  `diagrams/diagram.config.yaml` first;
- or point it at a config you already have: `/blueprint-deck diagrams/diagram.config.yaml` in Claude Code, or
  *"Use the blueprint-deck skill to make a diagram from diagrams/diagram.config.yaml"* in any agent;
- or just ask: *"Make a Blueprint Deck of this repo for our executives."* Without a config, the agent copies the
  template config into `diagrams/`, fills in what it can tell from the files, and asks you about the audience, the
  viewpoint and what story the tour should tell.

In a chat app (Claude, ChatGPT, Gemini) you attach the docs instead; see [Agents](/docs/agents/#chat-apps-claude-chatgpt-gemini).

## What the agent does

1. **Find the config:** the path you gave, else `diagrams/diagram.config.yaml`, else `diagram.config.yaml` in the
   project folder, or the config pasted into the prompt.
2. **Read the sources** the config lists, minus `exclude`. For big repos it may hand the reading to sub-agents. With
   `derive_status_from` it reads manifests to see what actually runs; with `branding.website` it takes the logo,
   colours and product name from your site.
3. **Propose the structure** (when `workflow.confirm_structure` is on): 5 to 9 areas, the personas and their paths,
   the tabs, and the tour as one line per step. You correct it; it continues.
4. **Write the content** following the [format](/docs/format/) and the [style guide](/docs/style-guide/). Every box
   and area gets its `sources`.
5. **Put it into the file and check it:** with Node, `node tools/check.mjs`; with a browser tool, it opens the file,
   walks every tab, tour step, persona and sheet, and fixes what doesn't fit. Without either, it tells you to press
   E → Check.
6. **Report:** where the file is, the structure and the tour, conflicts and gaps, what it took from your website and
   what it could not verify.

The agent **never writes HTML, CSS or JavaScript**. It copies the engine that ships with the skill, replaces the
placeholder data block with the JSON it wrote, and never touches anything below the `BD-ENGINE` line. That keeps every
deck consistent, keeps the agent's work small, and makes the editor possible.

## Where the files go

The deck is written to `workflow.output` in the config, **relative to the config file's folder**. The template says
`output: "index.html"`, so with the usual `diagrams/diagram.config.yaml` you get `diagrams/index.html`, in the folder
you started the agent in. Next to it:

| file | when |
|---|---|
| `index.html` (or your `workflow.output`) | always: the deck, the editable master |
| `extraction-report.md` | always: the sources read, why the areas are what they are, which box came from which source, conflicts, gaps, status evidence, branding and assumptions |
| `<title>.html`, e.g. `private-ai-platform.html` | with `workflow.read_only_copy: true`, or when you ask for "a copy to send": the same deck without the editor |
| `diagram.config.yaml` | when the agent made the config for you (pasted prompt or no config yet) |

To put the deck somewhere else, change `workflow.output`, e.g. `output: "../docs/architecture.html"`. Sources
(`sources.include`) are relative to the project folder instead, and may also be URLs.

To stop after the content and the report, before the file is checked, set `workflow.pause_after_extract: true`.

## Keep working with the agent

After the first run you stay in the same conversation, or come back later in a new session. Ask in plain words:

| you ask | what happens |
|---|---|
| *"Move the audit log into Governance"*, *"add a persona for the support team"*, *"step 7 should explain retention"*, *"lighter theme"* | **a change:** it edits only what you asked, keeps ids stable, re-checks the file and tells you what changed |
| *"Always say Acme Group"*, *"no moving dots"* | the change, and it writes the lasting preference into the config, so a later update keeps it |
| *"The docs changed, update the deck"* | **an update:** it re-reads the sources and changes only what they changed. Your edits from the browser or by hand stay, and so does every box marked `"locked": true` |
| *"Upgrade the deck to the new version"* | **an upgrade:** it puts the newest engine into the file and moves your content over unchanged. The editor shows a file's engine under **E → Diagram → This file** |
| *"Update the Blueprint Deck skill"* | it runs the update command that matches how you installed it (see [Updating](/docs/agents/#updating)). Start a new session afterwards so the agent loads the new version |
| *"Make me a copy to send"* | the read-only copy next to the deck |
| *"Add a second diagram for the data flow"* | a new entry in the config's `diagrams:` list, and a switcher in the same file |

The agent always re-reads the data block before changing anything, so edits you made in the browser (press
<kbd class="kbd">E</kbd>) and saved into the file are kept. Small fixes are often quicker in the editor itself; see
[Editing & sharing](/docs/editing/).

When the skill starts, it checks GitHub for a newer release and tells you in one line, with the command to update. It
never updates anything on its own. When you open an older deck, it mentions once that the file can get the newer
engine, and upgrades it only when you agree.

## Tips

- Keep `workflow.confirm_structure: true` for the first run. Most of a deck's quality comes from the areas and their
  names, and correcting an outline is cheaper than correcting 30 boxes.
- Point `sources.include` at the docs that matter for this audience; less noise gives a clearer map.
- Write what the last version got wrong into `comments`. The agent treats every comment and note as an instruction.
- Big repos: agents with sub-agents read in parallel and hand back structured facts, which keeps the main context free.
- Read `extraction-report.md` once: the gaps and conflicts are usually the questions your audience will ask.

## What's in the skill

The skill is a folder, `blueprint-deck/`, with a `SKILL.md` that tells the agent what to do, and the files it needs.
In the repository it lives at
[`plugins/blueprint-deck/skills/blueprint-deck/`](https://github.com/lukasvecerka23/blueprint-deck-kit/tree/main/plugins/blueprint-deck/skills/blueprint-deck).

| file | what it is |
|---|---|
| `SKILL.md` | the instructions: modes, steps, rules |
| `blueprint-deck.html` | the engine with an empty data block; copied for every new diagram |
| `reference/spec.md` | the JSON format ([Diagram format](/docs/format/)) |
| `reference/style-guide.md` | content, structure, viewpoint, layout and tour rules ([Style guide](/docs/style-guide/)) |
| `reference/icons.md`, `reference/lucide-a-l.json`, `reference/lucide-m-z.json` | the icon names, and every Lucide icon for extras |
| `templates/diagram.config.yaml` | the annotated config ([Configuring](/docs/configuring/)) |
| `templates/example.json` | a finished example |
| `tools/check.mjs`, `tools/insert.mjs` | optional command-line tools: the check, and putting JSON into a file, upgrading it or making the read-only copy (Node 18+, nothing to install) |
