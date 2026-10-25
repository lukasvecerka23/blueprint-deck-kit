// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { existsSync } from "node:fs";

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
      // the copied deck files, configurator and engine are not Astro pages; keep the sitemap to the site's own pages
      filter: page => !page.includes("/examples/") && !page.includes("/engine/"),
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
