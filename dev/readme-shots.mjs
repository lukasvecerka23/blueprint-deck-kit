// Dev only: the README pictures in docs/images/ (needs playwright; serve the repo on :8790 first).
//   python3 -m http.server 8790 & BD_BROWSER_CHANNEL=chrome node dev/readme-shots.mjs
import { chromium } from "playwright";
import { execSync } from "node:child_process";
const B = "http://localhost:8790/", OUT = "docs/images/";
const browser = await chromium.launch(process.env.BD_BROWSER_CHANNEL ? { channel: process.env.BD_BROWSER_CHANNEL } : {});
async function shot(name, url, prep, size = { width: 1600, height: 900 }) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1.5 });
  await page.goto(B + url);
  await page.waitForTimeout(1600);
  if (prep) await prep(page);
  await page.screenshot({ path: OUT + name + ".png" });
  execSync(`sips -s format jpeg -s formatOptions 82 ${OUT}${name}.png --out ${OUT}${name}.jpg >/dev/null && rm ${OUT}${name}.png`);
  await page.close();
  console.log("shot", name);
}
const wait = p => p.waitForFunction(() => window.__diagramReady === true, null, { timeout: 8000 }).catch(() => {});
await shot("overview", "examples/blueprint-deck/index.html#lens=overview", wait);
await shot("persona-path", "examples/acme/index.html#d=platform&list=personas&item=1", wait);
await shot("tour-light", "examples/postgresql/index.html#tour=7", wait);
await shot("editor", "examples/acme/index.html#d=platform&lens=overview", async p => {
  await wait(p);
  await p.evaluate(() => localStorage.clear());
  await p.keyboard.press("e");
  await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById("toast").classList.remove("open"));
  await p.click('.node[data-id="payments"]');
  await p.waitForTimeout(1500);
});
await shot("configurator", "configurator/index.html", async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2500); });
await browser.close();
