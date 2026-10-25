// Answers may contain inline HTML. `home: true` puts the question on the landing page as well.
export const FAQ: { q: string; a: string; home?: boolean }[] = [
  {
    q: "Do I need to install anything else?",
    a: "No. The skill is a folder of instructions, the engine and references; installing it only copies files. Your agent writes the diagram, and the result is a plain HTML file that opens in any browser. No runtime, build tool or account is needed. (If Node happens to be installed, the agent also runs an optional check script with it.)",
    home: true,
  },
  {
    q: "Where does my content go?",
    a: "Nowhere. Your agent runs locally in your project folder with your own subscription, and it reads only the sources your config lists. The generated file makes no network requests: no CDN, no fonts, no analytics. It works offline and from <code>file://</code>.",
    home: true,
  },
  {
    q: "Can I edit the diagram without the agent?",
    a: "Yes. Open the file and press <kbd class=\"kbd\">E</kbd>: edit texts, colours, theme and logo, move boxes, and change tabs, tour steps and personas. In Chrome and Edge the changes are saved into the file itself; in other browsers they are kept in the browser and you download the updated file. For bigger changes, ask the agent (\"add a persona for the support team\").",
    home: true,
  },
  {
    q: "Can I share it?",
    a: "It's one HTML file: email it, put it in a shared drive or attach it to a ticket. For a phone-friendly link, upload it to any static host (Cloudflare Pages, GitHub Pages, Netlify, an S3 bucket). Press <kbd class=\"kbd\">P</kbd> for a PDF deck when someone needs slides.",
    home: true,
  },
  {
    q: "Which agents does it work with?",
    a: "Claude Code and Codex (as a plugin), Gemini CLI, the Claude, ChatGPT and Gemini apps (upload the skill as a zip; the ChatGPT desktop app takes the plugin), and any other agent that supports Agent Skills (a folder with a <code>SKILL.md</code>; the install script puts it into its skills folder). Agents without skill support can still follow <code>SKILL.md</code> as plain instructions: point them at the file.",
    home: true,
  },
  {
    q: "Will the agent make things up?",
    a: "The skill tells it not to: every box and area carries <code>sources</code> (file and section), <code>invent: never</code> is the default, and the agent writes an <code>extraction-report.md</code> next to the diagram listing the sources it read, conflicts between them and gaps (things you asked for that the sources don't say). Planned things are marked as planned.",
  },
  {
    q: "What kinds of diagrams can it make?",
    a: "Architecture and product blueprints, data flows, processes, customer journeys, ecosystems and org maps (plus a free-form <code>custom</code> type). Each can be written from a product viewpoint (what it does for whom) or a technical one (components, protocols, technology choices), and one file can hold several diagrams with a switcher.",
  },
  {
    q: "How do I update the diagram when the docs change?",
    a: "Ask the agent to update it (\"update the blueprint deck\"). In update mode it re-reads the sources and changes only what the sources changed; edits you made in the browser and boxes marked <code>\"locked\": true</code> stay as they are.",
  },
  {
    q: "How do I get a newer engine into an old file?",
    a: "Install the latest skill and ask the agent to upgrade the file. It copies the new engine and moves your data block into it; your content does not change.",
  },
  {
    q: "Can I lock a file so nobody edits it?",
    a: "Set <code>behaviour.editor: false</code> in the config (or <code>settings.editor: false</code> in the data). The ⋯ menu then only offers the PDF export and copying a link.",
  },
  {
    q: "Does it only work with a code repository?",
    a: "No. Point it at any folder with documentation: a repository, a folder of Markdown, text or PDF files, an export from Confluence or Notion, even web pages by URL. Run your agent in that folder and list the files (or URLs) as sources in the config.",
  },
  {
    q: "Can it build a diagram from code?",
    a: "Yes. Point it at a codebase and it draws the system: services, APIs, data stores, queues and external services, with connections taken from the code itself (RPC and HTTP clients, message topics, connection strings, deployment manifests), each box citing its files. The technical viewpoint suits it best; add the README or docs too for the purpose and the story. See the Online Boutique example in the gallery.",
    home: true,
  },
  {
    q: "Can I send a diagram that people can't change?",
    a: "Yes. Open it and choose <b>⋯ → Download a read-only copy</b>. You name the file, and the copy has the same diagram, tour and PDF export but no editor. Your own file stays editable; after changes, download a new copy.",
    home: true,
  },
  {
    q: "Is it safe to open a deck someone sent me?",
    a: "Decks made with the kit can't connect anywhere: a Content Security Policy in every file blocks all network requests, so a deck can't track you or send data. Formatting in the text is limited to simple tags, and the engine strips scripts and event handlers before showing anything. Still, it's an HTML file: treat one from a stranger like any web page from them.",
  },
  {
    q: "Will an email filter block the HTML file?",
    a: "It can. Many mail systems (Outlook / Microsoft 365 especially) block .html attachments in general, because they are a common phishing trick. Share a link instead: host the deck on any static host, or put it in SharePoint, OneDrive, Google Drive or Teams. A zipped file or a PDF (press P) also works.",
    home: true,
  },
  {
    q: "Who owns the diagrams I make?",
    a: "You do. The content of your diagrams is yours, and you can share, sell or keep them private. Only the engine inside each file is open source (MIT); its short licence notice stays in the file.",
  },
  {
    q: "Can I use it at work or for clients?",
    a: "Yes. The MIT License allows commercial use: generate decks for your company or your clients, keep them private, or build on the kit. Just keep the licence notice in the files.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. Blueprint Deck Kit is open source under the MIT License. Generating a diagram uses your agent, so it counts against your own agent subscription or API usage like any other task. If it saves you time, you can <a href=\"https://github.com/sponsors/lukasvecerka23\">sponsor the project on GitHub</a>, once or monthly.",
  },
];
