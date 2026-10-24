---
layout: ../../layouts/Docs.astro
title: Getting started
description: Install the skill, describe your diagram, let your agent write it, then present, edit and share the file.
---

Blueprint Deck Kit is an **agent skill**. You install it once; afterwards your coding agent (Claude Code, Codex or any
agent that supports Agent Skills) can turn your docs (a repository, a folder of Markdown, text or PDF files, wiki exports or web pages) into a **Blueprint Deck**: one self-contained HTML file
with a pan-and-zoom map, clickable boxes with side panels, tabs, personas with their paths, a guided tour, roadmap and
option sheets, a built-in editor and a PDF export.

The agent only writes the content, a JSON block at the top of the file. The engine underneath is fixed and ships with
the skill, so every deck behaves the same and anyone can fix a text later without the agent.

## 1. Install the skill

macOS and Linux:

```sh
curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh
```

Windows (PowerShell):

```powershell
irm https://blueprint-deck.lukasvecerka.dev/install.ps1 | iex
```

The installer copies the `blueprint-deck` skill folder into the skills folder of every agent it finds
(`~/.claude/skills`, `~/.codex/skills`, `~/.agents/skills`). It installs nothing else.

| option (sh) | option (PowerShell) | what it does |
|---|---|---|
| `--agent claude\|codex\|agents\|all` | `-Agent …` | install for one agent only (or all) |
| `--project` | `-Project` | install into the current repository (`./.claude/skills`, …) |
| `--dir <path>` | `-Dir <path>` | install into any skills folder |
| `--ref <branch or tag>` | `-Ref …` | a specific version (default: `main`) |
| `--uninstall` | `-Uninstall` | remove the skill again |

Pass options to the piped script with `sh -s --`, for example
`curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh -s -- --agent codex`.
Prefer to do it by hand? [Download the skill as a zip](/blueprint-deck-skill.zip) and unzip it into your agent's
skills folder, so that you get `…/skills/blueprint-deck/SKILL.md`.

## 2. Describe your diagram

Open the [configurator](/configurator/) (it also works offline from `configurator/index.html` in the repository).
Answer a few questions: the audience and their goal, the viewpoint (product or technical), how detailed the map
should be, whether to show personas, which tabs you want and what story the tour should tell. You can add several
diagrams to one file, for example a product view for executives and a technical view for engineers.

Then **copy the prompt**. It contains the whole config, so the agent needs nothing else. You can also save the config
as `diagrams/diagram.config.yaml` in your project folder; see [Configuring](/docs/configuring/) for every field.

## 3. Paste it into your agent

Start a new agent session in the folder with your docs and paste the prompt. In Claude Code you can also type
`/blueprint-deck` (optionally followed by a config path). The agent then:

1. saves the config to `diagrams/diagram.config.yaml`;
2. reads the sources the config lists (by default `docs/**/*.md` and `README.md`);
3. proposes the structure (the areas, personas, tabs and the tour in one line per step) and waits for your OK;
4. writes `diagrams/index.html` and an `extraction-report.md` next to it (sources read, conflicts, gaps, assumptions);
5. checks the result (with Node or a browser tool if it has one) and reports what it made.

## 4. Present, edit, share

Open `diagrams/index.html` by double-click. It works offline and on phones.

- **Present:** start the guided tour and use <kbd class="kbd">←</kbd> <kbd class="kbd">→</kbd>; click boxes for their
  side panels; use the tabs to highlight parts of the map.
- **Fix small things yourself:** press <kbd class="kbd">E</kbd> to edit texts, colours and boxes in the browser.
- **Ask the agent for bigger changes:** "add a persona for the support team", "step 7 should explain the audit log",
  "use the paper theme". It edits the data block and re-checks the file.
- **Share it:** send the file, export a PDF deck with <kbd class="kbd">P</kbd>, or upload it to any static host.

More in [Editing & sharing](/docs/editing/).

## Keyboard

| key | action |
|---|---|
| <kbd class="kbd">←</kbd> <kbd class="kbd">→</kbd> <kbd class="kbd">Space</kbd> | previous / next tour step |
| <kbd class="kbd">Esc</kbd> | close the panel, leave the tour |
| <kbd class="kbd">F</kbd> | fit the map to the screen |
| <kbd class="kbd">+</kbd> <kbd class="kbd">-</kbd> | zoom |
| <kbd class="kbd">E</kbd> | open the editor |
| <kbd class="kbd">P</kbd> | export a PDF deck |
| <kbd class="kbd">1</kbd>–<kbd class="kbd">9</kbd> | switch diagram (when the file has several) |
