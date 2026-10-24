// Optional (maintainers): screenshots of the examples' overviews for the gallery cards → public/shots/<slug>.png.
// Needs playwright (npm install --no-save playwright) and a running copy of the site or repo on SHOTS_BASE.
//   SHOTS_BASE=http://localhost:4321 node scripts/shots.mjs acme blueprint-deck saas-onboarding postgresql online-boutique meetbuddy
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.env.SHOTS_BASE || "http://localhost:4321";
mkdirSync("public/shots", { recursive: true });
const browser = await chromium.launch(process.env.BD_BROWSER_CHANNEL ? { channel: process.env.BD_BROWSER_CHANNEL } : {});
const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
for (const slug of process.argv.slice(2)) {
  await page.goto(`${base}/examples/${slug}/index.html#lens=overview`);
  await page.waitForFunction(() => window.__diagramReady === true, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `public/shots/${slug}.png` });
  console.log("shot", slug);
}
await browser.close();
