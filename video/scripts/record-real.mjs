// Records a real clip of the Acme example with Playwright recordVideo -> public/real/acme-clip.mp4
// 1) python3 -m http.server 8765 --directory ..   2) npm run record
// Flow: start screen -> start the guided tour -> 2 steps -> switcher -> "Checkout process".
import { chromium } from 'playwright';
import { globSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const base = process.env.BASE || 'http://localhost:8765/examples';
const exe = process.env.CHROME || globSync(process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell')[0];
const tmp = path.resolve('public/real/.rec');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const size = { width: 1920, height: 1080 };
const context = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size } });
const page = await context.newPage();
const t0 = Date.now();
await page.goto(`${base}/acme/index.html`);
await page.waitForTimeout(600);
const start = (Date.now() - t0) / 1000; // trim everything before the page is ready
const marks = [];
const mark = (name) => marks.push([name, +((Date.now() - t0) / 1000 - start).toFixed(2)]);
mark('start screen');
await page.waitForTimeout(1100);
await page.click('#heroTour'); mark('tour starts');
await page.waitForTimeout(1900);
await page.keyboard.press('ArrowRight'); mark('step 2');
await page.waitForTimeout(1900);
await page.keyboard.press('ArrowRight'); mark('step 3');
await page.waitForTimeout(1700);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.click('#brand'); mark('switcher open');
await page.waitForTimeout(900);
await page.getByText('Checkout process', { exact: true }).first().click(); mark('second diagram');
await page.waitForTimeout(700);
await page.mouse.click(1000, 1040); // close the switcher menu
await page.waitForTimeout(2300);
const video = page.video();
await context.close();
await browser.close();
const webm = await video.path();
const out = path.resolve('public/real/acme-clip.mp4');
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-ss', String(start), '-i', webm, '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
writeFileSync(path.resolve('public/real/acme-clip.json'), JSON.stringify({ marks }, null, 2));
console.log(out, marks);
