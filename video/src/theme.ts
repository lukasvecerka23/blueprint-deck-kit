// Colours and fonts. Brand: blue -> violet gradient, dark navy background (site dark mode).
import { loadFont } from '@remotion/google-fonts/Inter';

const inter = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

export const FONT = `${inter.fontFamily}, ui-sans-serif, system-ui, -apple-system, sans-serif`;
export const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

export const C = {
  bg: '#06070d',
  bg2: '#0a0e1c',
  card: 'rgba(16, 20, 36, 0.96)',
  cardSolid: '#10142a',
  border: 'rgba(148, 163, 184, 0.16)',
  text: '#eef1f8',
  muted: '#8e97ad',
  dim: '#5b6378',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  violet: '#6d28d9',
  violetLight: '#8b5cf6',
  green: '#34d399',
  amber: '#fbbf24',
};

export const GRADIENT = `linear-gradient(135deg, ${C.blue} 0%, ${C.violet} 100%)`;
export const GRADIENT_TEXT = `linear-gradient(90deg, #7fb0ff 0%, #a78bfa 100%)`;
