import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// The reference docs are rendered straight from the skill folder, so the site never drifts from what the agent reads.
const reference = defineCollection({
  loader: glob({ pattern: ["spec.md", "style-guide.md"], base: "../skill/blueprint-deck/reference" }),
});

export const collections = { reference };
