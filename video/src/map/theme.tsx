// Diagram themes (values from the engine presets in the kit). The map scenes read the active
// theme from context, so the configurator's pick changes how the map looks.
import React, { createContext, useContext } from 'react';

export type MapTheme = {
  id: string;
  bg: string;
  nodeA: string;
  nodeB: string;
  glass: string;
  glow1: string;
  glow2: string;
  dot: string;
  primary: string;
  secondary: string;
  muted: string;
};

export const MAP_THEMES: Record<string, MapTheme> = {
  midnight: {
    id: 'midnight', bg: '#050914', nodeA: 'rgba(24, 33, 66, 0.96)', nodeB: 'rgba(12, 18, 40, 0.96)', glass: '#0d1120',
    glow1: 'rgba(37, 99, 235, 0.30)', glow2: 'rgba(167, 139, 250, 0.16)', dot: 'rgba(150, 170, 230, 0.12)',
    primary: '#3b82f6', secondary: '#7c3aed', muted: '#8f9ab8',
  },
  blueprint: {
    id: 'blueprint', bg: '#06132a', nodeA: 'rgba(20, 40, 80, 0.96)', nodeB: 'rgba(10, 24, 52, 0.96)', glass: '#0a1834',
    glow1: 'rgba(31, 111, 235, 0.34)', glow2: 'rgba(34, 184, 230, 0.14)', dot: 'rgba(120, 170, 240, 0.16)',
    primary: '#1f6feb', secondary: '#22b8e6', muted: '#8ea3c4',
  },
};

const Ctx = createContext<MapTheme>(MAP_THEMES.midnight);
export const MapThemeProvider: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <Ctx.Provider value={MAP_THEMES[id] ?? MAP_THEMES.midnight}>{children}</Ctx.Provider>
);
export const useMapTheme = () => useContext(Ctx);

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
