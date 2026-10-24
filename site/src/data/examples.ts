// The gallery. Each entry links to /examples/<slug>/index.html, copied from ../examples/ by scripts/sync.mjs.
export interface Example {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  theme: "dark" | "light";
  accent: string;
  accent2: string;
  diagrams: number;
}

export const EXAMPLES: Example[] = [
  {
    slug: "acme",
    title: "Acme Commerce",
    description: "Two diagrams in one file: the platform architecture and the checkout process, with a switcher between them.",
    tags: ["Architecture", "Process", "2 diagrams"],
    theme: "dark",
    accent: "#3b82f6",
    accent2: "#a78bfa",
    diagrams: 2,
  },
  {
    slug: "blueprint-deck",
    title: "Blueprint Deck Kit",
    description: "The kit's own architecture: the skill, the engine, the configurator and how a deck is made, generated from this repository.",
    tags: ["Architecture", "Mixed viewpoint"],
    theme: "dark",
    accent: "#8b5cf6",
    accent2: "#22d3ee",
    diagrams: 1,
  },
  {
    slug: "saas-onboarding",
    title: "SaaS onboarding",
    description: "A fictional analytics SaaS: seven stages from first visit to expansion, three personas with their paths, pains and numbers to watch.",
    tags: ["Journey", "Product viewpoint", "Personas"],
    theme: "light",
    accent: "#2563eb",
    accent2: "#f97316",
    diagrams: 1,
  },
  {
    slug: "postgresql",
    title: "PostgreSQL internals",
    description: "How PostgreSQL works, from the official docs: one UPDATE from the client to disk and to a replica. Technical viewpoint, paper theme.",
    tags: ["Architecture", "Technical viewpoint", "Light theme"],
    theme: "light",
    accent: "#336791",
    accent2: "#0ea5e9",
    diagrams: 1,
  },
];

// Build-time check: examples are generated separately; a missing one renders as "coming soon" instead of a dead link.
import { existsSync } from "node:fs";
import { join } from "node:path";
export const exampleHref = (slug: string) => `/examples/${slug}/index.html`;
export const exampleExists = (slug: string) => existsSync(join(process.cwd(), "public", "examples", slug, "index.html"));
