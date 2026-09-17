/**
 * HUD Theme Management for KanbanDuo
 * Controls dynamic Sci-Fi visual palettes:
 * - Cyber Cyan (Default)
 * - Synthwave Violet
 * - Matrix Green
 * - Solar Amber
 */

import { HudTheme } from './types';
export type { HudTheme };

const THEME_STORAGE_KEY = 'kanban_hud_theme_v1';

export interface ThemeMeta {
  id: HudTheme;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  badgeClass: string;
}

export const HUD_THEMES: ThemeMeta[] = [
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    tagline: 'Cuántico / Sci-Fi Clásico',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'violet',
    name: 'Synthwave Violet',
    tagline: 'Neón Retro / Púrpura Profundo',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'matrix',
    name: 'Matrix Green',
    tagline: 'Bio-Digital / Esmeralda Terminal',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'amber',
    name: 'Solar Amber',
    tagline: 'Aeroespacial / Naranja Caliente',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
];

export function getHudTheme(): HudTheme {
  if (typeof window === 'undefined') return 'cyan';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as HudTheme | null;
    if (stored && ['cyan', 'violet', 'matrix', 'amber'].includes(stored)) {
      return stored;
    }
  } catch {}
  return 'cyan';
}

export function setHudTheme(theme: HudTheme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-hud-theme', theme);
    window.dispatchEvent(new CustomEvent('kanban_theme_update', { detail: theme }));
  } catch (err) {
    console.warn('Error saving HUD theme:', err);
  }
}

export function initHudTheme() {
  if (typeof window === 'undefined') return;
  const theme = getHudTheme();
  document.documentElement.setAttribute('data-hud-theme', theme);
}
