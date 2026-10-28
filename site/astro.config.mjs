// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";

const examples = JSON.parse(readFileSync(new URL("./src/data/examples.json", import.meta.url), "utf8"));

// Dev only: serve public/<dir>/index.html for "/<dir>/" (e.g. /configurator/), like Cloudflare Pages does in production.
const publicDirIndex = {
  name: "public-dir-index",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url || "").split(/[?#]/)[0];
      if (path.endsWith("/") && path !== "/" && existsSync(new URL(`./public${decodeURI(path)}index.html`, import.meta.url))) {
        req.url = `${path}index.html${(req.url || "").slice(path.length)}`;
      }
      next();
    });
  },
};

export default defineConfig({
  site: "https://blueprintdeck.dev",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [
    sitemap({
      // the copied decks and the configurator aren't Astro pages, so they are listed by hand; the bare engine stays out
      customPages: [
        "https://blueprintdeck.dev/configurator/",
        ...examples.map(e => `https://blueprintdeck.dev/examples/${e.slug}/`),
      ],
      filter: page => !page.includes("/engine/"),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcss(), publicDirIndex],
    server: { fs: { allow: [".."] } },
  },
});
