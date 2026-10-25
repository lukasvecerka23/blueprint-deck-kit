// Renders out/poster.jpg (1920x1080) for the landing page. Usage: node scripts/poster.mjs [quality=82]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { statSync } from 'node:fs';
import path from 'node:path';

const quality = Number(process.argv[2] || 82);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Poster' });
await renderStill({ serveUrl, composition, frame: 0, output: 'out/poster.jpg', imageFormat: 'jpeg', jpegQuality: quality });
console.log('out/poster.jpg', Math.round(statSync('out/poster.jpg').size / 1024), 'KB');
