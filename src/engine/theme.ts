import type { ArcadeTheme } from './types';

export interface ThemePalette {
  casing: string;
  screen: string;
  canvasBg: string;
  surface: string;
  surfaceHover: string;
  borderLcd: string;
  borderBright: string;
  inkPrimary: string;
  inkMuted: string;
  accent: string;
  accentMid: string;
  accentInk: string;
  gridLine: string;
}

export const THEME_PALETTES: Record<ArcadeTheme, ThemePalette> = {
  green: {
    casing: '#081208',
    screen: '#0e220e',
    canvasBg: '#0b1c0b',
    surface: '#163316',
    surfaceHover: '#1e421e',
    borderLcd: '#386b28',
    borderBright: '#6f9e36',
    inkPrimary: '#d9f2a6',
    inkMuted: '#96bf65',
    accent: '#a8e016',
    accentMid: '#9bbc0f',
    accentInk: '#081208',
    gridLine: 'rgba(56, 107, 40, 0.28)',
  },
  mono: {
    casing: '#050505',
    screen: '#101010',
    canvasBg: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceHover: '#262626',
    borderLcd: '#525252',
    borderBright: '#a3a3a3',
    inkPrimary: '#fafafa',
    inkMuted: '#b3b3b3',
    accent: '#ffffff',
    accentMid: '#d4d4d4',
    accentInk: '#050505',
    gridLine: 'rgba(163, 163, 163, 0.22)',
  },
};

export function getThemePalette(theme: ArcadeTheme): ThemePalette {
  return THEME_PALETTES[theme] ?? THEME_PALETTES.green;
}
