export const SITE = {
  name: "Blueprint Deck Kit",
  short: "Blueprint Deck",
  url: "https://blueprint-deck.lukasvecerka.dev",
  repo: "https://github.com/lukasvecerka23/blueprint-deck-kit",
  author: "Lukas Vecerka",
  description:
    "An agent skill that turns your repository's docs into an interactive presentation diagram: one offline HTML file with a pan-and-zoom map, guided tour, personas, tabs, a built-in editor and PDF export.",
};

export const INSTALL = {
  sh: `curl -fsSL ${SITE.url}/install.sh | sh`,
  ps: `irm ${SITE.url}/install.ps1 | iex`,
  shAgent: (a: string) => `curl -fsSL ${SITE.url}/install.sh | sh -s -- --agent ${a}`,
  psAgent: (a: string) => `& ([scriptblock]::Create((irm ${SITE.url}/install.ps1))) -Agent ${a}`,
};

export const DOCS_NAV = [
  { title: "Getting started", href: "/docs/" },
  { title: "Configuring", href: "/docs/configuring/" },
  { title: "Editing & sharing", href: "/docs/editing/" },
  { title: "Agents", href: "/docs/agents/" },
  { title: "Diagram format", href: "/docs/format/", group: "Reference" },
  { title: "Style guide", href: "/docs/style-guide/", group: "Reference" },
  { title: "FAQ", href: "/docs/faq/", group: "Reference" },
];
