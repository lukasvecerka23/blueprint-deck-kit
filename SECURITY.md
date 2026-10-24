# Security

Blueprint Deck files are static HTML. The engine makes no network requests and runs entirely in the browser that opens
the file; the agent skill runs inside your own coding agent, on your computer, with your subscription. Nothing is sent to
the authors of this project.

Things to keep in mind:
- A diagram file contains whatever text the agent or the editor put into it. Treat a file from someone else like any
  HTML page from them: it can contain markup and links.
- The editor stores unsaved edits in your browser's local storage for that file path, and (in Chrome/Edge) a file handle
  you granted, so it can keep saving into the file.

## Reporting a vulnerability

Please report security problems privately through GitHub: **Security → Report a vulnerability** on
https://github.com/lukasvecerka23/blueprint-deck-kit. Don't open a public issue. You'll get an answer within a week.
