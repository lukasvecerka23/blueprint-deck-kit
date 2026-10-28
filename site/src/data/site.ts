export const SITE = {
  name: "Blueprint Deck Kit",
  short: "Blueprint Deck",
  url: "https://blueprintdeck.dev",
  repo: "https://github.com/lukasvecerka23/blueprint-deck-kit",
  sponsor: "https://github.com/sponsors/lukasvecerka23",
  author: "Lukáš Večerka",
  authorUrl: "https://github.com/lukasvecerka23",
  coAuthor: "Pavel Sládek",
  coAuthorUrl: "https://www.linkedin.com/in/sladek/",
  // the landing page's title and meta description (search results show about 60 and 155 characters)
  title: "Blueprint Deck Kit: interactive diagram decks from your docs or code",
  description:
    "Free, open-source agent skill for Claude Code, Codex, Copilot and more: turns your docs or code into one offline HTML deck with a map, tour and editor.",
  // the longer one for structured data and llms.txt
  summary:
    "Blueprint Deck Kit is a free, open-source agent skill (MIT) for Claude Code, Codex, GitHub Copilot, Gemini CLI, Cursor and other agents. Your agent reads your docs or code and writes one self-contained, offline HTML file: an interactive pan-and-zoom map with clickable boxes and their sources, tabs, personas with their paths, a guided tour you present like slides, a built-in editor and a PDF export.",
};

export const INSTALL = {
  sh: `curl -fsSL ${SITE.url}/install.sh | sh`,
  ps: `irm ${SITE.url}/install.ps1 | iex`,
  shAgent: (a: string) => `curl -fsSL ${SITE.url}/install.sh | sh -s -- --agent ${a}`,
  psAgent: (a: string) => `$installer = irm "${SITE.url}/install.ps1"; & ([scriptblock]::Create($installer)) -Agent ${a}`,
  claudeCli: "claude plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit",
  claudePlugin: "/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit",
  codexSkill: "$skill-installer install https://github.com/lukasvecerka23/blueprint-deck-kit/tree/main/plugins/blueprint-deck/skills/blueprint-deck",
  codexMarketplace: "codex plugin marketplace add lukasvecerka23/blueprint-deck-kit",
  codexPlugin: "codex plugin marketplace add lukasvecerka23/blueprint-deck-kit && codex plugin add blueprint-deck@blueprint-deck-kit",
  copilotPlugin: "copilot plugin marketplace add lukasvecerka23/blueprint-deck-kit && copilot plugin install blueprint-deck@blueprint-deck-kit",
  copilotGh: "gh skill install lukasvecerka23/blueprint-deck-kit blueprint-deck --agent github-copilot --scope user",
  geminiSkill: "gemini skills install https://github.com/lukasvecerka23/blueprint-deck-kit --path plugins/blueprint-deck/skills/blueprint-deck",
};

export const DOCS_NAV = [
  { title: "Getting started", href: "/docs/" },
  { title: "Configuring", href: "/docs/configuring/" },
  { title: "Generating", href: "/docs/generating/" },
  { title: "Editing & sharing", href: "/docs/editing/" },
  { title: "Agents", href: "/docs/agents/" },
  { title: "Diagram format", href: "/docs/format/", group: "Reference" },
  { title: "Style guide", href: "/docs/style-guide/", group: "Reference" },
  { title: "FAQ", href: "/docs/faq/", group: "Reference" },
  { title: "Changelog", href: "/changelog/", group: "Reference" },
];
