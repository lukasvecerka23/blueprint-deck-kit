// Renders check stills into out/. Usage: node scripts/stills.mjs [Promo|PromoSquare|ReadmeGif] [frame,frame,...]
// With no arguments renders the default set for all three compositions.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';

const DEFAULTS = {
  Promo: [60, 178, 248, 290, 376, 489, 589, 689, 789, 889, 959, 1039, 1089, 1179, 1299, 1377, 1470, 1640, 1758],
  PromoSquare: [60, 178, 248, 290, 376, 489, 589, 689, 789, 889, 959, 1039, 1089, 1179, 1299, 1377, 1470, 1640, 1758],
  PromoShort: [60, 178, 268, 358, 418, 538, 641, 764],
  PromoShortWide: [178, 418, 538, 641],
  ReadmeGif: [0, 60, 140, 190, 239],
};
const [only, framesArg] = process.argv.slice(2);
const jobs = only ? { [only]: framesArg ? framesArg.split(',').map(Number) : DEFAULTS[only] } : DEFAULTS;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
for (const [id, frames] of Object.entries(jobs)) {
  const composition = await selectComposition({ serveUrl, id });
  const tag = { Promo: 'promo', PromoSquare: 'square', PromoShort: 'short', PromoShortWide: 'short-wide', ReadmeGif: 'gif' }[id];
  for (const frame of frames) {
    const output = `out/still-${tag}-${String(frame).padStart(4, '0')}.png`;
    await renderStill({ serveUrl, composition, frame, output, imageFormat: 'png' });
    console.log(output);
  }
}
