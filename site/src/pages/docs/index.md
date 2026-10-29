---
layout: ../../layouts/Docs.astro
title: "Getting started: generate your first interactive diagram"
description: Install the AI agent skill, describe your diagram, let your agent generate it from your docs or code, then present, edit and share the file.
---

Blueprint Deck Kit is an **AI agent skill**. You install it once; afterwards your coding agent (Claude Code, Codex, GitHub Copilot, Cursor or any
agent that supports Agent Skills) can turn your docs or code (a codebase, a folder of Markdown, text or PDF files, notes, wiki exports or web pages) into a **Blueprint Deck**: an interactive diagram of a system, a process, a customer journey or a topic you are studying, as one self-contained HTML file
with a pan-and-zoom map, clickable boxes with side panels, tabs, personas with their paths, a guided tour, roadmap and
option sheets, a built-in editor and a PDF export.

The agent only writes the content, a JSON block at the top of the file. The engine underneath is fixed and ships with
the skill, so every deck behaves the same and anyone can fix a text later without the agent.

## 1. Install the skill

Install it where you work:

- **Claude Code**, as a plugin, from your terminal:

  ```bash
  claude plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit
  ```

  Or inside Claude Code: `/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit`. Then type `/blueprint-deck`. More (older versions, updates) on the [Agents](/docs/agents/) page.
- **Codex** (and the ChatGPT desktop app), as a plugin, in your terminal:

  ```bash
  codex plugin marketplace add lukasvecerka23/blueprint-deck-kit && codex plugin add blueprint-deck@blueprint-deck-kit
  ```

- **Gemini CLI**, with its own skill installer:

  ```text
  gemini skills install https://github.com/lukasvecerka23/blueprint-deck-kit --path plugins/blueprint-deck/skills/blueprint-deck
  ```

- **GitHub Copilot**: the Copilot CLI as a plugin (Copilot in VS Code: `gh skill install`, see [Agents](/docs/agents/#github-copilot)):

  ```text
  copilot plugin marketplace add lukasvecerka23/blueprint-deck-kit && copilot plugin install blueprint-deck@blueprint-deck-kit
  ```

- **Chat apps**: upload [blueprint-deck-skill.zip](https://github.com/lukasvecerka23/blueprint-deck-kit/releases/latest/download/blueprint-deck-skill.zip) as a skill in Claude or ChatGPT on the web,
  [blueprint-deck-skill-gemini.zip](https://github.com/lukasvecerka23/blueprint-deck-kit/releases/latest/download/blueprint-deck-skill-gemini.zip) in Gemini; the ChatGPT desktop app takes the Codex plugin
  ([how, per app](/docs/agents/#chat-apps-claude-chatgpt-gemini)).
- **Cursor and Grok Build** read the Claude Code skills folder, so a Claude Code install covers them; otherwise the install script below
  with `--agent cursor` or `--agent grok` ([Agents](/docs/agents/#cursor)).
- **Any other agent, or several at once**: the install script below, or with Node the open skills CLI:
  `npx skills add lukasvecerka23/blueprint-deck-kit` ([Agents](/docs/agents/#other-agents-the-install-script)).

### The install script

macOS and Linux:

```sh
curl -fsSL https://blueprintdeck.dev/install.sh | sh
```

Windows (PowerShell):

```powershell
irm https://blueprintdeck.dev/install.ps1 | iex
```

The installer downloads the latest [release](https://github.com/lukasvecerka23/blueprint-deck-kit/releases) from GitHub
and copies the `blueprint-deck` skill folder into the skills folder of the agents it finds (`~/.claude/skills`,
`~/.codex/skills`, `~/.gemini/skills`, `~/.copilot/skills`, `~/.cursor/skills`, `~/.grok/skills`, `~/.agents/skills`). When it finds more than one, it asks which (press Enter for all of them).
Cursor and Grok Build get no copy of their own when they can already read one of the others.
It installs nothing else. Run it again to update.

| option (sh) | option (PowerShell) | what it does |
|---|---|---|
| `--agent claude\|codex\|gemini\|copilot\|cursor\|grok\|agents\|all` | `-Agent …` | install for one agent only (or all) |
| `--project` | `-Project` | install into the current project (`./.claude/skills`, …) |
| `--dir <path>` | `-Dir <path>` | install into any skills folder |
| `--version <x.y.z>` | `-Version <x.y.z>` | a specific release (default: the latest) |
| `--ref <branch or tag>` | `-Ref …` | the skill as it is on a branch, e.g. unreleased work on `main` |
| `--uninstall` | `-Uninstall` | remove the skill again |
| `--yes` | `-Yes` | don't ask, install for every agent found |

Pass options to the piped script with `sh -s --`, for example to install for Codex only:

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent codex
```

In PowerShell, run the script as a script block to pass options:

```powershell
$installer = irm "https://blueprintdeck.dev/install.ps1"
& ([scriptblock]::Create($installer)) -Agent codex
```

Prefer to do it by hand? [Download the skill as a zip](https://github.com/lukasvecerka23/blueprint-deck-kit/releases/latest/download/blueprint-deck-skill.zip)
and unzip it into your agent's skills folder, so that you get `…/skills/blueprint-deck/SKILL.md`.

**No terminal?** In Claude (Desktop or claude.ai), ChatGPT on the web or Gemini, upload the skill as a zip, attach your
docs to a chat and ask for a Blueprint Deck; skip the configurator if you like, the skill asks what it needs. In
Claude you can then publish the deck as an artifact and share the link ([Chat apps](/docs/agents/#chat-apps-claude-chatgpt-gemini)).

## 2. Describe your diagram

Open the [configurator](/configurator/) (it also works offline from `configurator/index.html` in the repository).
Answer a few questions: the audience and their goal, the viewpoint (product or technical), how detailed the map
should be, whether to show personas, which tabs you want and what story the tour should tell. You can add several
diagrams to one file, for example a product view for executives and a technical view for engineers.

Then **copy the prompt**. It contains the whole config, so the agent needs nothing else. You can also save the config
as `diagrams/diagram.config.yaml` in your project folder; see [Configuring](/docs/configuring/) for every field.

## 3. Paste it into your agent

Start a new agent session in your project folder and paste the prompt. In Claude Code you can also type
`/blueprint-deck` (optionally followed by a config path). The agent then:

1. saves the config to `diagrams/diagram.config.yaml`;
2. reads the sources the config lists (by default `docs/**/*.md` and `README.md`);
3. proposes the structure (the areas, personas, tabs and the tour in one line per step) and waits for your OK;
4. writes `diagrams/index.html` and an `extraction-report.md` next to it (sources read, conflicts, gaps, assumptions);
5. checks the result (with Node or a browser tool if it has one) and reports what it made.

Afterwards you keep talking to it: ask for changes, an update when the docs change, or a newer engine. See
[Generating](/docs/generating/) for what you can ask and where the files go.

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
| <kbd class="kbd">P</kbd> | export a PDF deck, in colour or black and white (<kbd class="kbd">Shift</kbd>+<kbd class="kbd">P</kbd>: black and white directly) |
| <kbd class="kbd">1</kbd>–<kbd class="kbd">9</kbd> | switch diagram (when the file has several) |
