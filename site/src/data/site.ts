export const SITE = {
  name: "Blueprint Deck Kit",
  short: "Blueprint Deck",
  url: "https://blueprint-deck.lukasvecerka.dev",
  repo: "https://github.com/lukasvecerka23/blueprint-deck-kit",
  sponsor: "https://github.com/sponsors/lukasvecerka23",
  author: "Lukas Vecerka",
  authorUrl: "https://github.com/lukasvecerka23",
  coAuthor: "Pavel Sládek",
  coAuthorUrl: "https://www.linkedin.com/in/sladek/",
  description:
    "An agent skill that turns your docs or code into an interactive presentation diagram: one offline HTML file with a pan-and-zoom map, guided tour, personas, tabs, a built-in editor and PDF export.",
};

export const INSTALL = {
  sh: `curl -fsSL ${SITE.url}/install.sh | sh`,
  ps: `irm ${SITE.url}/install.ps1 | iex`,
  shAgent: (a: string) => `curl -fsSL ${SITE.url}/install.sh | sh -s -- --agent ${a}`,
  psAgent: (a: string) => `& ([scriptblock]::Create((irm ${SITE.url}/install.ps1))) -Agent ${a}`,
  claudePlugin: "/plugin install blueprint-deck --marketplace lukasvecerka23/blueprint-deck-kit",
  codexSkill: "$skill-installer install https://github.com/lukasvecerka23/blueprint-deck-kit/tree/main/plugins/blueprint-deck/skills/blueprint-deck",
  codexMarketplace: "codex plugin marketplace add lukasvecerka23/blueprint-deck-kit",
  geminiSkill: "gemini skills install https://github.com/lukasvecerka23/blueprint-deck-kit --path plugins/blueprint-deck/skills/blueprint-deck",
};

export const DOCS_NAV = [
  { title: "Getting started", href: "/docs/" },
  { title: "Configuring", href: "/docs/configuring/" },
  { title: "Editing & sharing", href: "/docs/editing/" },
  { title: "Agents", href: "/docs/agents/" },
  { title: "Diagram format", href: "/docs/format/", group: "Reference" },
  { title: "Style guide", href: "/docs/style-guide/", group: "Reference" },
  { title: "FAQ", href: "/docs/faq/", group: "Reference" },
  { title: "Changelog", href: "/changelog/", group: "Reference" },
];
