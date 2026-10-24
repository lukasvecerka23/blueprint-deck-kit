# Security

A Blueprint Deck is one static HTML file. The agent skill runs inside your own coding agent, on your computer, with
your subscription; nothing is sent to the authors of this project.

## What a diagram file can and can't do

- **No network.** Every file carries a Content Security Policy: it may run its own inline code and show images that are
  inside the file, nothing else. Loading scripts, images, fonts or frames from elsewhere, and any request to a server,
  is refused by the browser. So a deck can't phone home, track viewers or leak its content.
- **No code from the content.** Text fields may contain a little formatting (`<b>`, `<i>`, `<a href="https://…">` …).
  Before anything is shown, the engine removes everything else: `<script>`, event handlers (`onclick` …),
  `javascript:` links, frames and other tags; SVG icons and logos keep their drawing but lose scripts and handlers.
  This matters when an agent builds a deck from documents you don't control: a malicious sentence in a source can't
  turn into code in your viewers' browsers. `tools/check.mjs` and the editor's Check tab report what was removed.
- **What it stores.** The editor keeps unsaved edits in the browser's local storage for that file, and (Chrome, Edge)
  a handle to the file you allowed it to save into. A read-only copy has no editor and stores nothing.

A deck file is still HTML: treat a deck from a stranger like any web page from them. The policy above is part of the
file, so someone who edits the file by hand can remove it; the protections are for decks made with the kit.

## Sending decks by email

Many mail systems (Microsoft 365 / Outlook in particular, some company gateways) block or quarantine `.html`
attachments, because HTML attachments are a common phishing trick. That isn't about this file's content. Reliable ways
to share a deck:

1. **A link** (best): host it on any static host (Cloudflare Pages, GitHub Pages, Netlify, your intranet) or put it in
   SharePoint, OneDrive, Google Drive or Teams and share the link (recipients may need to download it to open it).
2. **A zip** of the file, if you must attach it. Some filters inspect zips too.
3. **A PDF** (press P) when people only need to read it.

## Reporting a vulnerability

Please report security problems privately through GitHub: **Security → Report a vulnerability** on
https://github.com/lukasvecerka23/blueprint-deck-kit. Don't open a public issue. You'll get an answer within a week.
