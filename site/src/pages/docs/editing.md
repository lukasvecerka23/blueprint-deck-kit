---
layout: ../../layouts/Docs.astro
title: Editing & sharing
description: Fix things in the browser with the built-in editor, export a PDF deck, and share the file or host it anywhere.
---

A Blueprint Deck is one HTML file: the engine plus a JSON data block at the top. Everything you change, in the
browser or through your agent, ends up in that data block. There is no build step and no server.

## The editor (press E)

Open the file and press <kbd class="kbd">E</kbd> (or use the ⋯ menu → *Edit this diagram*). You can:

- **edit texts:** click a box or an area to change its title, subtitle and panel texts (what it is, why, sources);
- **move boxes:** drag them on the map;
- **change the look:** theme (midnight, blueprint, graphite, forest, ember, light, paper), main and second colour, shape
  (rounded, square, pill), the logo (upload a PNG/SVG/JPG or pick an icon; it is stored inside the file);
- **edit the story:** tabs, tour steps and personas, the start screen (eyebrow, headline, lead, footnote);
- **tune behaviour:** legend, connections in the overview, moving dots, where the tour card sits;
- **check it:** the *Check* tab runs the same checks as the agent (text that doesn't fit, overlaps, highlighted
  boxes off screen, tour cards that scroll) across every tab and tour step.

If you want nobody to edit a file, set `behaviour.editor: false` in the config (`settings.editor: false` in the data).

## How saving works

Every edit is kept in your browser immediately. Whether it is also written into the file depends on the browser:

| browser | what happens |
|---|---|
| **Chrome, Edge** (and other Chromium browsers) | Click *Save to file…* once and pick the same HTML file. From then on every edit is written into the file automatically, about half a second after you make it. The browser remembers the file; after a restart it may ask for permission again (*Keep saving to …*). |
| **Firefox, Safari** | Edits are kept in this browser (local storage, per file path) and survive a reload, but the file on disk does not change. Use *Download* to save an updated copy and replace the old file with it. |

Edits kept only in the browser are visible only to you, on that computer. Share the downloaded (or saved) file so that
others see them. When you later ask your agent to change the file, it reads the data block first, so your browser
edits that are in the file are kept.

## Bigger changes: ask the agent

For anything more than a quick fix, ask your agent in plain words: "move the audit log into Governance", "add a
persona for the support team", "the docs changed, update the deck". It reads the data block first, so the edits you
saved into the file are kept. What you can ask, and what the agent does, is in
[Generating](/docs/generating/#keep-working-with-the-agent).

## PDF deck (press P)

Press <kbd class="kbd">P</kbd> (or ⋯ → *Export a PDF deck…*) and pick **Colour** or **Black & white**. The engine lays
out a landscape deck, one page each: a
cover, the overview, every tour step (or every tab, if there is no tour) and every sheet. Your browser's print dialog
opens; choose *Save as PDF*. Background graphics should be on (they are by default in most browsers).

**Black and white** puts the same deck on white paper with black text and grey boxes and connections, for printing or
for readers who prefer it. <kbd class="kbd">Shift</kbd>+<kbd class="kbd">P</kbd> exports it directly, without the dialog.

**If the PDF shows stripes, grey blocks or rough edges:** that comes from the browser's PDF engine, not the deck.
Chrome on any system gives the cleanest result; Safari's export and Windows' *Microsoft Print to PDF* render soft
effects less well. The black-and-white deck avoids them almost entirely.

## Sharing

- **A link from Claude.** In Claude Desktop or claude.ai, ask it to publish the deck as an artifact: you get a link
  anyone can open, without hosting. To change the deck, edit the file and publish it again.
- **Teams, SharePoint and mail previews** open the file in a protected frame. The deck works there (diagrams, tabs,
  tour, PDF), but the address bar doesn't follow your view and edits can't be kept in the browser; to edit, download
  the file and open it in a browser.
- **WhatsApp, Mail, Files and Quick Look previews** (iPhone and Mac) show the file without running it, so the deck
  can't start there; the file says so and asks to open it in a browser. On a computer, save the file and double-click
  it. For phones, send a link (Claude artifact or a hosted file) instead of the file.
- **Send a read-only copy.** In the file, open **⋯ → Download a copy to share** (or **Share…** in the editor bar),
  name it, and pick **Read-only**. The copy has the same diagram, tour, tabs and PDF export, but no editor at all:
  the editing code isn't in the file, so it can't be switched back on in the browser. Your own file stays editable;
  after changes, download a new copy. (Anyone can still open an HTML file in a text editor, so this stops casual
  edits, not determined ones.) Agents make one with `node tools/insert.mjs --read-only index.html`.
- **Send the file.** Email it, put it in a shared drive, attach it to a ticket. It opens offline by double-click and
  makes no network requests.
- **Host it.** Upload the file to any static host for a link that also works on phones: Cloudflare Pages, GitHub
  Pages, Netlify, Vercel, an S3 or GCS bucket, your intranet web server. Name it `index.html` in its own folder for a
  clean URL. Nothing to configure: it is a static page.
- **Keep it in the repo.** `diagrams/index.html` next to `diagrams/diagram.config.yaml` keeps the deck reviewable
  and lets the agent update it with the docs.

## Deep links

The part after `#` opens a specific view, so you can link straight to a slide:

| link | opens |
|---|---|
| `index.html#tour=5` | tour step 5 |
| `index.html#lens=gov` | the tab with id `gov` |
| `index.html#node=llm-gw` | the box `llm-gw` with its side panel |
| `index.html#zone=audit` | the area `audit` |
| `index.html#overlay=pilot` | the sheet `pilot` |
| `index.html#list=personas&item=2` | the second persona and its path |
| `index.html#status=off` | the map without status tags |
| `index.html#d=checkout&tour=2` | diagram `checkout`, step 2 (files with several diagrams) |

Combine them with `&`. They're useful when the file is hosted: a link can open the deck at the right step.
