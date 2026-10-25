# Blueprint Deck

Turn your docs or code into an interactive presentation diagram, a *Blueprint Deck*: one HTML file that works
offline, with a pan-and-zoom map of your product, process or system, clickable boxes with side panels, tabs, personas
with their paths, a guided tour you present like slides, a built-in editor (press E) and a PDF export (press P).

Install it in Claude Code, from your terminal:

```
claude plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit
```

or inside Claude Code: `/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit`.

Then ask for "a Blueprint Deck of these docs", type `/blueprint-deck`, or paste a prompt from the
[configurator](https://blueprintdeck.dev/configurator/). The skill reads your sources, proposes the
structure, writes the content as JSON into a copy of the bundled engine (`skills/blueprint-deck/blueprint-deck.html`)
and checks the result. Every box cites the file it came from, and an extraction report lists conflicts and gaps.

## What it runs, reads and sends

- **Reads** only the files and URLs your config or request names, and writes the deck and its report into your
  project (`diagrams/` by default).
- **Runs** nothing by itself. With Node 18+ it may run the bundled, readable checks in `skills/blueprint-deck/tools/`
  (`check.mjs`, `insert.mjs`); without Node it skips them.
- **Network:** once per run it may ask GitHub's public API for the latest release
  (`https://api.github.com/repos/lukasvecerka23/blueprint-deck-kit/releases/latest`) to tell you when a newer version is
  out; it never installs anything. With `branding.website` set, it reads that site for your logo and colours. Nothing
  else leaves your machine.
- **The decks it writes** make no network requests at all: every file carries a Content Security Policy that blocks
  them, and the engine sanitizes all content before showing it.

Docs: https://blueprintdeck.dev/docs/ · Source: https://github.com/lukasvecerka23/blueprint-deck-kit ·
License: MIT (`skills/blueprint-deck/LICENSE.md`).
