---
layout: ../../layouts/Docs.astro
title: Install the skill in Claude Code, Codex, Copilot, Gemini CLI and ChatGPT
description: How to install, start and update the Blueprint Deck skill in Claude Code, Codex, GitHub Copilot, Gemini CLI, Cursor, Grok Build and the Claude, ChatGPT and Gemini apps.
---

How to install the skill in each agent, start it, and keep it up to date. Install it one way per agent: two copies
make the agent list the skill twice. What happens once it runs, where the files go and how to keep working with the
agent is in [Generating](/docs/generating/).

## Claude Code

Install the plugin from your terminal, in one command (Claude Code 2.1.275 or later):

```bash
claude plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit
```

Or from inside Claude Code:

```text
/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit
```

On older versions: `/plugin marketplace add lukasvecerka23/blueprint-deck-kit`, then
`/plugin install blueprint-deck@blueprint-deck-kit`. The command is `/blueprint-deck` (the full name
`/blueprint-deck:blueprint-deck` works too). To get updates automatically, turn on auto-update for the `blueprint-deck-kit`
marketplace under `/plugin` → Marketplaces, or run `claude plugin update blueprint-deck@blueprint-deck-kit`.
Install it one way only (plugin or script), otherwise Claude Code lists the skill twice.

Or with the script, for Claude Code only (the default command also finds Claude Code by itself):

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent claude
```

The skill lands in `~/.claude/skills/blueprint-deck`; use
`--project` to put it into the repository's `.claude/skills/` so the whole team gets it.

Start a new session in your project folder (a codebase or a folder of docs), then either paste the prompt from the [configurator](/configurator/) or use
the slash command:

```text
/blueprint-deck
/blueprint-deck diagrams/diagram.config.yaml
```

Claude Code also picks the skill on its own when you ask for "an interactive diagram of this repo" or "a blueprint of
the platform for the board meeting".

## Codex

This repository is a plugin marketplace for Codex. In your terminal, add it and install the plugin:

```bash
codex plugin marketplace add lukasvecerka23/blueprint-deck-kit && codex plugin add blueprint-deck@blueprint-deck-kit
```

Updates come through the marketplace: `codex plugin marketplace upgrade`. Codex shares its plugins with the ChatGPT
desktop app, so Blueprint Deck shows up there too (see [Chat apps](#chat-apps-claude-chatgpt-gemini)).

Without plugins, Codex's own skill installer installs the skill from inside Codex:

```text
$skill-installer install https://github.com/lukasvecerka23/blueprint-deck-kit/tree/main/plugins/blueprint-deck/skills/blueprint-deck
```

It installs the skill as it is on `main` into `~/.codex/skills/blueprint-deck` and doesn't update it later; the install
script does both (`--agent codex`).

Start a new Codex session in your project folder and paste the prompt from the configurator, or ask:

```text
Use the blueprint-deck skill to make a diagram of this repo from diagrams/diagram.config.yaml.
```

## Gemini CLI

Gemini CLI has its own skill installer:

```bash
gemini skills install https://github.com/lukasvecerka23/blueprint-deck-kit --path plugins/blueprint-deck/skills/blueprint-deck
```

Or the script, into `~/.gemini/skills` (Gemini CLI also reads `~/.agents/skills`):

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent gemini
```

Check with `/skills list` in a Gemini CLI session, then ask for a Blueprint Deck in your project folder.

## GitHub Copilot

GitHub Copilot reads Agent Skills in the Copilot CLI, agent mode in VS Code and Visual Studio, and the Copilot cloud
agent. The Copilot CLI takes this repository as a plugin marketplace:

```bash
copilot plugin marketplace add lukasvecerka23/blueprint-deck-kit && copilot plugin install blueprint-deck@blueprint-deck-kit
```

Updates: `copilot plugin update blueprint-deck`. For VS Code or Visual Studio (or without the Copilot CLI), install
the skill with the GitHub CLI (2.90 or later) into `~/.copilot/skills`, which every Copilot reads:

```bash
gh skill install lukasvecerka23/blueprint-deck-kit blueprint-deck --agent github-copilot --scope user
```

Updates: `gh skill update blueprint-deck`. The install script works too (`--agent copilot`; with `--project` it
installs into the repository's `.github/skills`, which also the Copilot cloud agent reads):

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent copilot
```

Then open Copilot Chat in agent mode (or a Copilot CLI session) in your project folder and paste the prompt from the
configurator.

## Cursor

Cursor reads Agent Skills in the editor's agent and in the Cursor CLI, and it also reads the Claude Code and Codex
skill folders and `~/.agents/skills`. **If you installed the skill for Claude Code or Codex, Cursor already has it.**
Otherwise, use the install script, which puts it into `~/.cursor/skills` (with `--project`, the repository's
`.cursor/skills`):

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent cursor
```

When the script finds Cursor next to Claude Code, Codex or `~/.agents`, it doesn't make a second copy for it. Then ask
the agent in your project folder for a Blueprint Deck, or type `/blueprint-deck`. Updates: run the script again.

## Grok Build

Grok Build, xAI's coding agent, reads Claude Code skills without any setup, and also `~/.grok/skills` and
`~/.agents/skills`. **If you installed the skill for Claude Code, Grok Build already has it.** Otherwise, the install
script puts it into `~/.grok/skills` (with `--project`, the repository's `.grok/skills`):

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --agent grok
```

Check with `/skills` in a Grok Build session, then ask for a Blueprint Deck in your project folder. Updates: run the
script again.

## Chat apps: Claude, ChatGPT, Gemini

The chat apps and Claude's desktop app need no terminal and no repository: you attach your docs to a chat. Most take
the skill as a zip upload, once:

| app | how |
|---|---|
| **Claude** (web and desktop app; paid plans) | **Customize → Skills**, upload [blueprint-deck-skill.zip](https://github.com/lukasvecerka23/blueprint-deck-kit/releases/latest/download/blueprint-deck-skill.zip), turn it on. Code execution must be on (Settings → Capabilities), because the skill works with files. |
| **ChatGPT on the web** (paid plans) | **Plugins → Skills → Create → Upload from your computer**, the same zip. ChatGPT scans it before you can use it. |
| **ChatGPT desktop app** | It takes plugins, not uploads: install the [Codex plugin](#codex) (the app shares Codex's plugins), or in the app **Plugins** → add the marketplace `lukasvecerka23/blueprint-deck-kit`, then install **Blueprint Deck**. |
| **Gemini** (web and desktop app) | **Customize → Skills** (some accounts: Settings → Skills), upload [blueprint-deck-skill-gemini.zip](https://github.com/lukasvecerka23/blueprint-deck-kit/releases/latest/download/blueprint-deck-skill-gemini.zip): the same skill without the optional Node tools, which the Gemini app doesn't accept. |

Don't unzip the files: they already have the shape the apps expect (one `blueprint-deck/` folder with `SKILL.md`
inside). Then start a chat, attach your docs (Markdown, PDF, text) or paste links, and ask: "Make a Blueprint Deck of
these docs for our executives". The skill asks for what it can't tell from the files, then gives you the HTML file to
download.

**Share it as a link (Claude):** after the deck is made, ask *"Publish the deck as an artifact so I can share a
link."* Claude puts it into an artifact and gives you a link anyone can open, without hosting anything. The deck
works inside the artifact (tour, tabs, panels, switching diagrams, the PDF); your browser just can't keep edits there,
so edit the downloaded file and publish it again. Publishing makes the deck public to anyone with the link.

Differences from a coding agent: it only sees what you attach, not a whole repository, so it suits a handful of
documents better than a large codebase. To change a deck later, attach the HTML file again and say what to change, or
press **E** in the file. To update the skill, delete it and upload the newer zip.

## Other agents (the install script)

Besides the install script, there is the open [skills CLI](https://skills.sh/lukasvecerka23/blueprint-deck-kit/blueprint-deck)
(needs Node; it installs from `main` and asks which agents to install for):

```bash
npx skills add lukasvecerka23/blueprint-deck-kit
```

Agents that support Agent Skills find the skill in their skills folder: `--agent agents` installs into the shared
`~/.agents/skills`, and `--dir <path>` into any folder. For an agent without skill support, put the folder somewhere
it can read and start with:

```text
Read blueprint-deck/SKILL.md and follow it. SKILL_DIR is the folder that file is in.
Then make a Blueprint Deck from diagrams/diagram.config.yaml.
```

## Updating

When the skill runs, it asks GitHub for the latest release and tells you when a newer version is out (it never
updates anything by itself). Ask the agent to *update the Blueprint Deck skill* and it runs the right command for you;
or run it yourself. It depends on how you installed it:

| installed with | to update |
|---|---|
| the Claude Code plugin | `claude plugin update blueprint-deck@blueprint-deck-kit`, or auto-update under `/plugin` → Marketplaces |
| the Codex / ChatGPT desktop plugin | `codex plugin marketplace upgrade`, or update it in the Plugins Directory |
| a zip upload (Claude, ChatGPT on the web, Gemini) | delete the skill and upload the newer zip |
| the GitHub Copilot CLI plugin | `copilot plugin update blueprint-deck` |
| `gh skill install` | `gh skill update blueprint-deck` |
| `npx skills add` | `npx skills update` |
| the install script (also for Cursor and Grok Build), Codex's skill installer or Gemini CLI | run the install script again: it replaces the skill and says which version it replaced |

What changed is in the [changelog](/changelog/). To install a specific release with the script:

```bash
curl -fsSL https://blueprintdeck.dev/install.sh | sh -s -- --version 0.5.1
```

In PowerShell:

```powershell
$installer = irm "https://blueprintdeck.dev/install.ps1"
& ([scriptblock]::Create($installer)) -Version 0.5.1
```

Every release and its files are on [GitHub Releases](https://github.com/lukasvecerka23/blueprint-deck-kit/releases).

Diagrams you already made keep working: each file carries its own engine. To give a file the new features, ask your
agent to *upgrade* it (see [Generating](/docs/generating/#keep-working-with-the-agent)), or run `node tools/insert.mjs --upgrade diagrams/index.html`. The content stays as it is.
The editor shows a file's engine version under **E → Diagram → This file**.

