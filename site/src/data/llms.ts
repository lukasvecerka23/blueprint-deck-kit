// The texts behind /llms.txt and /llms-full.txt (https://llmstxt.org): a short map of the site for AI tools, and the
// whole documentation as one plain-text file. Built from the same sources as the docs pages, so they never drift.
import { SITE, INSTALL } from "./site";
import { EXAMPLES } from "./examples";
import { FAQ } from "./faq";
import VERSION from "../../../plugins/blueprint-deck/skills/blueprint-deck/VERSION.txt?raw";
import gettingStarted from "../pages/docs/index.md?raw";
import generating from "../pages/docs/generating.md?raw";
import editing from "../pages/docs/editing.md?raw";
import agents from "../pages/docs/agents.md?raw";
import spec from "../../../plugins/blueprint-deck/skills/blueprint-deck/reference/spec.md?raw";
import styleGuide from "../../../plugins/blueprint-deck/skills/blueprint-deck/reference/style-guide.md?raw";
import configTemplate from "../../../plugins/blueprint-deck/skills/blueprint-deck/templates/diagram.config.yaml?raw";

const U = SITE.url;
const PAGES = [
  { title: "Getting started", path: "/docs/", text: "Install the skill, describe your diagram, let your agent write it, then present, edit and share the file." },
  { title: "Configuring", path: "/docs/configuring/", text: "The diagram.config.yaml the agent follows: audience, viewpoint, sources, map, personas, tabs, tour, branding." },
  { title: "Generating", path: "/docs/generating/", text: "Starting a run, what the agent does, where the files go, and what to ask afterwards (changes, updates, upgrades)." },
  { title: "Editing & sharing", path: "/docs/editing/", text: "The built-in editor, how saving works, PDF export, read-only copies, hosting and sharing." },
  { title: "Agents", path: "/docs/agents/", text: "Installing and updating the skill in Claude Code, Codex, Gemini CLI, GitHub Copilot, Cursor, Grok Build and the chat apps." },
  { title: "Diagram format", path: "/docs/format/", text: "The JSON data block of a deck: meta, zones, nodes, edges, tabs, personas, tour, roadmap and sheets." },
  { title: "Style guide", path: "/docs/style-guide/", text: "The content, structure, viewpoint, layout and tour rules the agent follows." },
  { title: "FAQ", path: "/docs/faq/", text: "Installing, agents, privacy, editing and sharing, safety, licence and cost." },
];
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
// a docs Markdown file without its frontmatter, with site links made absolute
const body = (md: string) => md.replace(/^---[\s\S]*?\n---\n/, "").replace(/\]\(\//g, `](${U}/`).trim();

export function llmsTxt() {
  return `# ${SITE.name}

> ${SITE.summary}

- Current version: ${VERSION.trim()} (beta; 1.0.0 will be the first stable release). Free, MIT License, no account.
- The agent writes only the content (a JSON block); a fixed engine that ships with the skill renders it, so every deck
  behaves the same and anyone can fix a text later in the browser (press E).
- A deck makes no network requests and works offline. It reads your docs (Markdown, text, PDF, web pages) or a codebase;
  every box links to its source, and an extraction-report.md lists conflicts and gaps.
- Install in Claude Code: \`${INSTALL.claudeCli}\`. Other agents and the chat apps: ${U}/docs/agents/
- Describe a diagram without writing YAML: ${U}/configurator/ (runs in the browser, makes the prompt for the agent).

## Docs

${PAGES.map(p => `- [${p.title}](${U}${p.path}): ${p.text}`).join("\n")}

## Examples

${EXAMPLES.map(e => `- [${e.title}](${U}/examples/${e.slug}/): ${e.description}`).join("\n")}

## Optional

- [The whole documentation as one text file](${U}/llms-full.txt)
- [Changelog](${U}/changelog/)
- [Source code and issues on GitHub](${SITE.repo})
- [Privacy](${U}/privacy/)
`;
}

export function llmsFullTxt() {
  const part = (title: string, path: string, text: string) => `\n\n# ${title}\n\nSource: ${U}${path}\n\n${text}`;
  return `# ${SITE.name}: the documentation

> ${SITE.summary}

Version ${VERSION.trim()}. Website: ${U}/ · Code: ${SITE.repo}`
    + part("Getting started", "/docs/", body(gettingStarted))
    + part("Configuring", "/docs/configuring/", "The agent follows the config literally. The annotated template:\n\n```yaml\n" + configTemplate.trim() + "\n```")
    + part("Generating", "/docs/generating/", body(generating))
    + part("Editing & sharing", "/docs/editing/", body(editing))
    + part("Agents", "/docs/agents/", body(agents))
    + part("FAQ", "/docs/faq/", FAQ.map(f => `## ${f.q}\n\n${plain(f.a)}`).join("\n\n"))
    + part("Diagram format", "/docs/format/", body(spec))
    + part("Style guide", "/docs/style-guide/", body(styleGuide))
    + "\n";
}
