// Answers may contain inline HTML. `home: true` puts the question on the landing page as well.
export const FAQ: { q: string; a: string; home?: boolean }[] = [
  {
    q: "Do I need to install anything else?",
    a: "No. The skill is a folder of instructions, the engine and references; the installer only copies files. Your agent writes the diagram, and the result is a plain HTML file that opens in any browser. No runtime, build tool or account is needed. (If Node happens to be installed, the agent also runs an optional check script with it.)",
    home: true,
  },
  {
    q: "Where does my content go?",
    a: "Nowhere. Your agent runs locally in your repository with your own subscription, and it reads only the sources your config lists. The generated file makes no network requests: no CDN, no fonts, no analytics. It works offline and from <code>file://</code>.",
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
    a: "Any agent that supports Agent Skills (a folder with a <code>SKILL.md</code>), for example Claude Code and Codex. Agents without skill support can still follow <code>SKILL.md</code> as plain instructions: point them at the file.",
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
    q: "What does it cost?",
    a: "Nothing. Blueprint Deck Kit is open source under the MIT licence. Generating a diagram uses your agent, so it counts against your own agent subscription or API usage like any other task.",
  },
];
