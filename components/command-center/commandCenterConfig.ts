// ========================================================
// KANBAN//DUO — COMMAND CENTER CONFIGURATION & ARCHITECTURE
// Declarative definitions for orbits, planets, colors & metrics
// ========================================================

import { AppView } from '@/lib/types';

export type CommandCenterModuleId =
  | 'board'
  | 'calendar'
  | 'dashboard'
  | 'habits'
  | 'challenges'
  | 'goals'
  | 'pomodoro';

export interface ModuleStatItem {
  label: string;
  value: string | number;
  highlight?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface CommandCenterModuleConfig {
  id: CommandCenterModuleId;
  title: string;
  subtitle: string;
  targetView: AppView | 'pomodoro_action';
  targetSubView?: string;
  category: 'workspace' | 'habits' | 'tools';
  color: string;
  secondaryColor: string;
  glowRgba: string;
  accentHex: string;
  // Geometría orbital elíptica
  orbitTrackIndex: 0 | 1 | 2; // 0 = interior, 1 = medio, 2 = exterior
  orbitRadiusX: number; // Radio horizontal en px (desktop base)
  orbitRadiusY: number; // Radio vertical en px (desktop base)
  baseAngleRad: number; // Posición angular inicial en radianes
  orbitSpeedRadPerSec: number; // Velocidad orbital zen (rad/seg)
  planetSizePx: number; // Diámetro visual del planeta (desktop)
  ringTiltDeg: number; // Inclinación del anillo giroscópico propio
  axialSpinSpeedDegPerSec: number; // Velocidad de rotación sobre su propio eje
  description: string;
}

// Configuración de los 7 planetas / módulos del sistema
export const COMMAND_CENTER_MODULES: CommandCenterModuleConfig[] = [
  {
    id: 'board',
    title: 'TABLERO',
    subtitle: 'Gestión ágil de tareas',
    targetView: 'board',
    category: 'workspace',
    color: '#06b6d4', // Cyan Neón
    secondaryColor: '#3b82f6',
    glowRgba: 'rgba(6, 182, 212, 0.45)',
    accentHex: '#22d3ee',
    orbitTrackIndex: 0,
    orbitRadiusX: 300,
    orbitRadiusY: 185,
    baseAngleRad: -Math.PI / 2, // 270° (Arriba centrado)
    orbitSpeedRadPerSec: 0.007,
    planetSizePx: 84,
    ringTiltDeg: 22,
    axialSpinSpeedDegPerSec: 18,
    description: 'Visualiza columnas Iniciado, Trabajando y Finalizado con fluidez.',
  },
  {
    id: 'calendar',
    title: 'CALENDARIO',
    subtitle: 'Visualiza tu tiempo',
    targetView: 'calendar',
    category: 'workspace',
    color: '#a855f7', // Violeta / Púrpura
    secondaryColor: '#c084fc',
    glowRgba: 'rgba(168, 85, 247, 0.45)',
    accentHex: '#d8b4fe',
    orbitTrackIndex: 1,
    orbitRadiusX: 375,
    orbitRadiusY: 225,
    baseAngleRad: (215 * Math.PI) / 180, // Superior izquierda (~10h)
    orbitSpeedRadPerSec: 0.0055,
    planetSizePx: 80,
    ringTiltDeg: -28,
    axialSpinSpeedDegPerSec: 14,
    description: 'Planificación temporal, fechas límite e hitos organizados.',
  },
  {
    id: 'dashboard',
    title: 'MÉTRICAS',
    subtitle: 'Analiza tu progreso',
    targetView: 'dashboard',
    category: 'workspace',
    color: '#3b82f6', // Azul Eléctrico
    secondaryColor: '#60a5fa',
    glowRgba: 'rgba(59, 130, 246, 0.45)',
    accentHex: '#93c5fd',
    orbitTrackIndex: 1,
    orbitRadiusX: 375,
    orbitRadiusY: 225,
    baseAngleRad: (325 * Math.PI) / 180, // Superior derecha (~2h)
    orbitSpeedRadPerSec: 0.0055,
    planetSizePx: 80,
    ringTiltDeg: 26,
    axialSpinSpeedDegPerSec: 16,
    description: 'Estadísticas de rendimiento, velocidad y cumplimiento del equipo.',
  },
  {
    id: 'goals',
    title: 'OBJETIVOS',
    subtitle: 'Convierte planes en resultados',
    targetView: 'goals',
    targetSubView: 'goals',
    category: 'habits',
    color: '#f97316', // Ámbar / Cobre
    secondaryColor: '#fb923c',
    glowRgba: 'rgba(249, 115, 22, 0.45)',
    accentHex: '#fdba74',
    orbitTrackIndex: 2,
    orbitRadiusX: 450,
    orbitRadiusY: 260,
    baseAngleRad: (175 * Math.PI) / 180, // Centro izquierda (~8:30h)
    orbitSpeedRadPerSec: 0.004,
    planetSizePx: 82,
    ringTiltDeg: -20,
    axialSpinSpeedDegPerSec: 12,
    description: 'Metas mensuales medibles y progreso cuantitativo.',
  },
  {
    id: 'habits',
    title: 'MIS HÁBITOS',
    subtitle: 'Construye tu mejor versión',
    targetView: 'habits',
    targetSubView: 'habits',
    category: 'habits',
    color: '#10b981', // Esmeralda Matrix
    secondaryColor: '#06b6d4',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
    accentHex: '#34d399',
    orbitTrackIndex: 2,
    orbitRadiusX: 450,
    orbitRadiusY: 260,
    baseAngleRad: (5 * Math.PI) / 180, // Centro derecha (~3:30h)
    orbitSpeedRadPerSec: 0.004,
    planetSizePx: 86,
    ringTiltDeg: 30, // Anillo prominente estilo Saturno
    axialSpinSpeedDegPerSec: 15,
    description: 'Matriz de consistencia mensual, rachas e indicadores personales.',
  },
  {
    id: 'challenges',
    title: 'RETOS',
    subtitle: 'Desafíos en equipo',
    targetView: 'challenges',
    targetSubView: 'challenges',
    category: 'habits',
    color: '#eab308', // Dorado / Oro
    secondaryColor: '#f59e0b',
    glowRgba: 'rgba(234, 179, 8, 0.45)',
    accentHex: '#fde047',
    orbitTrackIndex: 0,
    orbitRadiusX: 320,
    orbitRadiusY: 195,
    baseAngleRad: (125 * Math.PI) / 180, // Inferior izquierda (~7h)
    orbitSpeedRadPerSec: 0.0065,
    planetSizePx: 82,
    ringTiltDeg: -24,
    axialSpinSpeedDegPerSec: 14,
    description: 'Retos compartidos con tabla de posiciones y constancia grupal.',
  },
  {
    id: 'pomodoro',
    title: 'POMODORO',
    subtitle: 'Enfócate y avanza',
    targetView: 'pomodoro_action',
    category: 'tools',
    color: '#f43f5e', // Carmesí / Coral
    secondaryColor: '#fb7185',
    glowRgba: 'rgba(244, 63, 94, 0.45)',
    accentHex: '#fda4af',
    orbitTrackIndex: 0,
    orbitRadiusX: 320,
    orbitRadiusY: 195,
    baseAngleRad: (55 * Math.PI) / 180, // Inferior derecha (~5h)
    orbitSpeedRadPerSec: 0.0065,
    planetSizePx: 80,
    ringTiltDeg: 25,
    axialSpinSpeedDegPerSec: 20,
    description: 'Bloques de concentración profunda con temporizador inteligente.',
  },
];

// Pistas orbitales elípticas de fondo
export const ORBITAL_TRACKS = [
  { index: 0, radiusX: 310, radiusY: 190, strokeDash: '4 8', opacity: 0.22 },
  { index: 1, radiusX: 375, radiusY: 225, strokeDash: '6 12', opacity: 0.28 },
  { index: 2, radiusX: 450, radiusY: 260, strokeDash: '3 9', opacity: 0.2 },
];

export interface ResponsiveOrbitParams {
  scaleX: number;
  scaleY: number;
  planetScale: number;
  coreScale: number;
  isMobile: boolean;
  containerHeightPx: number;
}

export function getResponsiveOrbitParams(
  containerWidth: number,
  containerHeight: number
): ResponsiveOrbitParams {
  const isMobile = containerWidth < 640;

  if (isMobile) {
    // Para móviles (pantallas de 320px a 430px de ancho típico):
    // El radio horizontal máximo no debe exceder el ancho seguro del viewport
    const safeW = Math.max(300, containerWidth);
    const maxRadiusX = Math.min(145, Math.max(115, (safeW - 70) / 2));
    // En móviles verticales, otorgar un radio vertical proporcionado para usar la altura de pantalla
    const safeH = Math.max(480, containerHeight);
    const maxRadiusY = Math.min(175, Math.max(130, (safeH - 170) / 2));

    const scaleX = maxRadiusX / 450;
    const scaleY = maxRadiusY / 260;
    const planetScale = Math.min(0.68, Math.max(0.55, safeW / 580));
    const coreScale = Math.min(0.62, Math.max(0.50, safeW / 580));

    return {
      scaleX,
      scaleY,
      planetScale,
      coreScale,
      isMobile: true,
      containerHeightPx: safeH,
    };
  }

  // Tablet & Desktop
  const isTablet = containerWidth < 1024;
  const baseScale = isTablet
    ? Math.min(0.85, Math.max(0.68, (containerWidth - 40) / 1100))
    : Math.min(1.0, Math.max(0.80, (containerWidth - 60) / 1280));

  return {
    scaleX: baseScale,
    scaleY: baseScale,
    planetScale: isTablet ? Math.max(0.8, baseScale) : baseScale,
    coreScale: baseScale,
    isMobile: false,
    containerHeightPx: Math.max(620, containerHeight),
  };
}
