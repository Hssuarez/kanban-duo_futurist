// ========================================================
// KANBAN//DUO — COMMAND CENTER BINARY SYSTEM CONFIGURATION
// Dual-Core Architecture: Workspace (Project) // Habit Core (User)
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

export type CommandCenterPole = 'workspace' | 'habits';

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
  pole: CommandCenterPole;
  color: string;
  secondaryColor: string;
  glowRgba: string;
  accentHex: string;
  // Geometría orbital elíptica
  orbitTrackIndex: 0 | 1 | 2;
  orbitRadiusX: number; // Radio horizontal en px (desktop base)
  orbitRadiusY: number; // Radio vertical en px (desktop base)
  baseAngleRad: number; // Posición angular inicial en radianes
  orbitSpeedRadPerSec: number; // Velocidad orbital zen (rad/seg)
  planetSizePx: number; // Diámetro visual del planeta (desktop)
  ringTiltDeg: number; // Inclinación del anillo giroscópico propio
  axialSpinSpeedDegPerSec: number; // Velocidad de rotación sobre su propio eje
  description: string;
}

// --------------------------------------------------------
// 1. POLO WORKSPACE: 3 Módulos subordinados al Proyecto Activo
// --------------------------------------------------------
export const WORKSPACE_MODULE_CONFIGS: CommandCenterModuleConfig[] = [
  {
    id: 'board',
    title: 'TABLERO',
    subtitle: 'Gestión ágil de tareas',
    targetView: 'board',
    pole: 'workspace',
    color: '#06b6d4', // Cyan Neón
    secondaryColor: '#3b82f6',
    glowRgba: 'rgba(6, 182, 212, 0.45)',
    accentHex: '#22d3ee',
    orbitTrackIndex: 0,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: -Math.PI / 2, // 270° (Arriba centrado, ~12h)
    orbitSpeedRadPerSec: 0.007,
    planetSizePx: 82,
    ringTiltDeg: 22,
    axialSpinSpeedDegPerSec: 18,
    description: 'Visualiza columnas Iniciado, Trabajando y Finalizado de este proyecto.',
  },
  {
    id: 'calendar',
    title: 'CALENDARIO',
    subtitle: 'Cronograma del proyecto',
    targetView: 'calendar',
    pole: 'workspace',
    color: '#a855f7', // Violeta / Púrpura
    secondaryColor: '#c084fc',
    glowRgba: 'rgba(168, 85, 247, 0.45)',
    accentHex: '#d8b4fe',
    orbitTrackIndex: 1,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: (150 * Math.PI) / 180, // Inferior izquierda (~7:30h)
    orbitSpeedRadPerSec: 0.0055,
    planetSizePx: 78,
    ringTiltDeg: -28,
    axialSpinSpeedDegPerSec: 14,
    description: 'Planificación temporal, fechas límite e hitos del proyecto.',
  },
  {
    id: 'dashboard',
    title: 'MÉTRICAS',
    subtitle: 'Rendimiento y velocidad',
    targetView: 'dashboard',
    pole: 'workspace',
    color: '#3b82f6', // Azul Eléctrico
    secondaryColor: '#60a5fa',
    glowRgba: 'rgba(59, 130, 246, 0.45)',
    accentHex: '#93c5fd',
    orbitTrackIndex: 1,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: (30 * Math.PI) / 180, // Inferior derecha (~4:30h)
    orbitSpeedRadPerSec: 0.0055,
    planetSizePx: 78,
    ringTiltDeg: 26,
    axialSpinSpeedDegPerSec: 16,
    description: 'Estadísticas de velocidad y porcentaje de avance de este proyecto.',
  },
];

// --------------------------------------------------------
// 2. POLO HABIT CORE: 4 Módulos vinculados a la Disciplina Personal
// --------------------------------------------------------
export const HABIT_MODULE_CONFIGS: CommandCenterModuleConfig[] = [
  {
    id: 'habits',
    title: 'MIS HÁBITOS',
    subtitle: 'Construye tu mejor versión',
    targetView: 'habits',
    targetSubView: 'habits',
    pole: 'habits',
    color: '#10b981', // Esmeralda Matrix
    secondaryColor: '#06b6d4',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
    accentHex: '#34d399',
    orbitTrackIndex: 0,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: 0, // Derecha (~3h)
    orbitSpeedRadPerSec: 0.005,
    planetSizePx: 82,
    ringTiltDeg: 30,
    axialSpinSpeedDegPerSec: 15,
    description: 'Matriz de consistencia mensual, rachas e indicadores personales.',
  },
  {
    id: 'challenges',
    title: 'RETOS',
    subtitle: 'Desafíos en equipo',
    targetView: 'challenges',
    targetSubView: 'challenges',
    pole: 'habits',
    color: '#eab308', // Dorado / Oro
    secondaryColor: '#f59e0b',
    glowRgba: 'rgba(234, 179, 8, 0.45)',
    accentHex: '#fde047',
    orbitTrackIndex: 1,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: Math.PI / 2, // Abajo (~6h)
    orbitSpeedRadPerSec: 0.0065,
    planetSizePx: 78,
    ringTiltDeg: -24,
    axialSpinSpeedDegPerSec: 14,
    description: 'Retos compartidos con tabla de posiciones y constancia grupal.',
  },
  {
    id: 'goals',
    title: 'OBJETIVOS',
    subtitle: 'Convierte planes en resultados',
    targetView: 'goals',
    targetSubView: 'goals',
    pole: 'habits',
    color: '#f97316', // Ámbar / Cobre
    secondaryColor: '#fb923c',
    glowRgba: 'rgba(249, 115, 22, 0.45)',
    accentHex: '#fdba74',
    orbitTrackIndex: 1,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: Math.PI, // Izquierda (~9h)
    orbitSpeedRadPerSec: 0.004,
    planetSizePx: 78,
    ringTiltDeg: -20,
    axialSpinSpeedDegPerSec: 12,
    description: 'Metas mensuales medibles y progreso cuantitativo personal.',
  },
  {
    id: 'pomodoro',
    title: 'POMODORO',
    subtitle: 'Enfócate y avanza',
    targetView: 'pomodoro_action',
    pole: 'habits',
    color: '#f43f5e', // Carmesí / Coral
    secondaryColor: '#fb7185',
    glowRgba: 'rgba(244, 63, 94, 0.45)',
    accentHex: '#fda4af',
    orbitTrackIndex: 0,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: -Math.PI / 2, // Arriba (~12h)
    orbitSpeedRadPerSec: 0.008,
    planetSizePx: 76,
    ringTiltDeg: 18,
    axialSpinSpeedDegPerSec: 20,
    description: 'Bloques de concentración profunda con temporizador inteligente.',
  },
];

// Los 7 módulos unificados
export const COMMAND_CENTER_MODULES: CommandCenterModuleConfig[] = [
  ...WORKSPACE_MODULE_CONFIGS,
  ...HABIT_MODULE_CONFIGS,
];

// Pistas orbitales elípticas locales para cada polo
export const POLE_ORBITAL_TRACKS = [
  { index: 0, radiusX: 195, radiusY: 130, strokeDash: '4 8', opacity: 0.25 },
  { index: 1, radiusX: 220, radiusY: 145, strokeDash: '6 12', opacity: 0.2 },
];

export interface BinaryOrbitParams {
  isMobile: boolean;
  layoutMode: 'panoramic' | 'focus';
  containerWidth: number;
  containerHeight: number;
  // Centros orbitales para cada polo relativos al centro del canvas (0,0)
  workspaceCenter: { x: number; y: number };
  habitsCenter: { x: number; y: number };
  // Radios orbitales elípticos escalados para cada polo
  workspaceRadiusX: number;
  workspaceRadiusY: number;
  habitsRadiusX: number;
  habitsRadiusY: number;
  // Escalas visuales
  planetScale: number;
  coreScale: number;
}

export function getBinarySystemLayout(
  containerWidth: number,
  containerHeight: number,
  activePole: CommandCenterPole = 'workspace'
): BinaryOrbitParams {
  // En pantallas con ancho menor a 1024px, activamos el modo Focus (un polo a la vez, 100% centrado y legible)
  const isMobile = containerWidth < 1024;
  const isSmallPhone = containerWidth < 640;

  if (isMobile) {
    const safeW = Math.max(300, containerWidth);
    const safeH = Math.max(500, containerHeight);

    // Radios seguros para móvil (ej. 375px de iPhone)
    const maxRadiusX = Math.min(140, Math.max(110, (safeW - 75) / 2));
    const maxRadiusY = Math.min(165, Math.max(120, (safeH - 180) / 2));

    const planetScale = isSmallPhone
      ? Math.min(0.68, Math.max(0.58, safeW / 580))
      : 0.78;
    const coreScale = isSmallPhone ? 0.65 : 0.8;

    return {
      isMobile: true,
      layoutMode: 'focus',
      containerWidth: safeW,
      containerHeight: safeH,
      // En modo Focus, el polo seleccionado se coloca exactamente en el centro (0,0)
      workspaceCenter: { x: 0, y: 0 },
      habitsCenter: { x: 0, y: 0 },
      workspaceRadiusX: maxRadiusX,
      workspaceRadiusY: maxRadiusY,
      habitsRadiusX: maxRadiusX,
      habitsRadiusY: maxRadiusY,
      planetScale,
      coreScale,
    };
  }

  // Modo Panorámico Binario (Desktop >= 1024px)
  const safeW = Math.max(1024, containerWidth);
  const safeH = Math.max(620, containerHeight);

  // Distancia del centro a cada polo (entre 270px y 330px)
  const poleOffset = Math.min(330, Math.max(260, safeW * 0.25));

  const baseScale = Math.min(1.0, Math.max(0.85, safeW / 1300));
  const planetScale = baseScale * 0.92;
  const coreScale = baseScale * 0.88;

  const radiusX = Math.round(200 * baseScale);
  const radiusY = Math.round(135 * baseScale);

  return {
    isMobile: false,
    layoutMode: 'panoramic',
    containerWidth: safeW,
    containerHeight: safeH,
    workspaceCenter: { x: -poleOffset, y: 0 },
    habitsCenter: { x: poleOffset, y: 0 },
    workspaceRadiusX: radiusX,
    workspaceRadiusY: radiusY,
    habitsRadiusX: radiusX,
    habitsRadiusY: radiusY,
    planetScale,
    coreScale,
  };
}
