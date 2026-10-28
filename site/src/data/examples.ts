import { existsSync } from "node:fs";
import { join } from "node:path";
import data from "./examples.json";
// The gallery. Each entry links to /examples/<slug>/, copied from ../examples/ by scripts/sync.mjs.
export interface Example {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  theme: "dark" | "light";
  accent: string;
  accent2: string;
  diagrams: number;
  home?: boolean; // false: only in the gallery, not on the landing page (it shows the first one live and four cards)
}

// the list itself is in examples.json, so scripts/sync.mjs can read it too (it writes each deck's title and
// description into the copy the site serves)
export const EXAMPLES: Example[] = data as Example[];

// Build-time check: examples are generated separately; a missing one renders as "coming soon" instead of a dead link.
export const exampleHref = (slug: string) => `/examples/${slug}/`;
export const exampleExists = (slug: string) => existsSync(join(process.cwd(), "public", "examples", slug, "index.html"));
