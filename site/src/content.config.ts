import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// The reference docs are rendered straight from the skill folder, so the site never drifts from what the agent reads.
const reference = defineCollection({
  loader: glob({ pattern: ["spec.md", "style-guide.md"], base: "../plugins/blueprint-deck/skills/blueprint-deck/reference" }),
});

// the changelog page renders the repository's CHANGELOG.md
const project = defineCollection({
  loader: glob({ pattern: ["CHANGELOG.md"], base: ".." }),
});

export const collections = { reference, project };
