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
  laneScale?: number; // Escala del carril orbital para separación física
  speedModAmp?: number; // Amplitud de modulación de velocidad Kepleriana
  speedModPhase?: number; // Fase de modulación de velocidad
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
    laneScale: 0.975,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: -Math.PI / 2, // 270° (Arriba centrado, ~12h)
    orbitSpeedRadPerSec: 0.006,
    speedModAmp: 0.05,
    speedModPhase: 0,
    planetSizePx: 82,
    ringTiltDeg: 22,
    axialSpinSpeedDegPerSec: 36,
    description: 'Visualiza columnas Iniciado, Trabajando y Finalizado de este proyecto.',
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
    laneScale: 1.10,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: (30 * Math.PI) / 180, // Inferior derecha (~4:30h)
    orbitSpeedRadPerSec: 0.006,
    speedModAmp: 0.06,
    speedModPhase: 2.1,
    planetSizePx: 78,
    ringTiltDeg: 26,
    axialSpinSpeedDegPerSec: 33,
    description: 'Estadísticas de velocidad y porcentaje de avance de este proyecto.',
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
    orbitTrackIndex: 2,
    laneScale: 1.225,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: (150 * Math.PI) / 180, // Inferior izquierda (~7:30h)
    orbitSpeedRadPerSec: 0.006,
    speedModAmp: 0.05,
    speedModPhase: 4.2,
    planetSizePx: 78,
    ringTiltDeg: -28,
    axialSpinSpeedDegPerSec: 28,
    description: 'Planificación temporal, fechas límite e hitos del proyecto.',
  },
];

// --------------------------------------------------------
// 2. POLO HABIT CORE: 4 Módulos vinculados a la Disciplina Personal
// --------------------------------------------------------
export const HABIT_MODULE_CONFIGS: CommandCenterModuleConfig[] = [
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
    laneScale: 0.975,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: -Math.PI / 2, // Arriba (~12h)
    orbitSpeedRadPerSec: 0.0055,
    speedModAmp: 0.05,
    speedModPhase: 0.5,
    planetSizePx: 76,
    ringTiltDeg: 18,
    axialSpinSpeedDegPerSec: 45,
    description: 'Bloques de concentración profunda con temporizador inteligente.',
  },
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
    orbitTrackIndex: 1,
    laneScale: 1.10,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: 0, // Derecha (~3h)
    orbitSpeedRadPerSec: 0.0055,
    speedModAmp: 0.06,
    speedModPhase: 2.0,
    planetSizePx: 82,
    ringTiltDeg: 30,
    axialSpinSpeedDegPerSec: 40,
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
    orbitTrackIndex: 0,
    laneScale: 0.975,
    orbitRadiusX: 195,
    orbitRadiusY: 130,
    baseAngleRad: Math.PI / 2, // Abajo (~6h)
    orbitSpeedRadPerSec: 0.0055,
    speedModAmp: 0.05,
    speedModPhase: 3.5,
    planetSizePx: 78,
    ringTiltDeg: -24,
    axialSpinSpeedDegPerSec: 30,
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
    orbitTrackIndex: 2,
    laneScale: 1.225,
    orbitRadiusX: 215,
    orbitRadiusY: 145,
    baseAngleRad: Math.PI, // Izquierda (~9h)
    orbitSpeedRadPerSec: 0.0055,
    speedModAmp: 0.06,
    speedModPhase: 5.0,
    planetSizePx: 78,
    ringTiltDeg: -20,
    axialSpinSpeedDegPerSec: 26,
    description: 'Metas mensuales medibles y progreso cuantitativo personal.',
  },
];

// Los 7 módulos unificados
export const COMMAND_CENTER_MODULES: CommandCenterModuleConfig[] = [
  ...WORKSPACE_MODULE_CONFIGS,
  ...HABIT_MODULE_CONFIGS,
];

// Pistas orbitales elípticas locales para cada polo (Jerarquía de 3 niveles: Principal, Secundaria, Profunda)
export const POLE_ORBITAL_TRACKS = [
  { index: 0, radiusX: 195, radiusY: 130, strokeDash: 'none', opacity: 0.32, label: 'primary' },
  { index: 1, radiusX: 220, radiusY: 145, strokeDash: '5 9', opacity: 0.22, label: 'secondary' },
  { index: 2, radiusX: 245, radiusY: 160, strokeDash: '2 8', opacity: 0.12, label: 'deep' },
];

export interface OrbitDataPacketConfig {
  id: string;
  moduleId?: CommandCenterModuleId;
  pole?: CommandCenterPole;
  isBridge?: boolean;
  color: string;
  speed: number; // rad/s para órbitas, progresión normalizada/s para puente
  size: number;
  initialOffset: number; // 0 a 2*PI para órbitas, 0 a 1 para puente
  trackIndex?: number;
  direction?: 1 | -1;
}

export const ORBIT_DATA_PACKETS: OrbitDataPacketConfig[] = [
  // Polo Workspace
  { id: 'pkt-board-1', moduleId: 'board', pole: 'workspace', color: '#06b6d4', speed: 0.08, size: 2.2, initialOffset: 0.2, trackIndex: 0 },
  { id: 'pkt-board-2', moduleId: 'board', pole: 'workspace', color: '#22d3ee', speed: 0.055, size: 1.8, initialOffset: 3.4, trackIndex: 0 },
  { id: 'pkt-calendar-1', moduleId: 'calendar', pole: 'workspace', color: '#a855f7', speed: 0.065, size: 2.0, initialOffset: 2.1, trackIndex: 1 },
  { id: 'pkt-calendar-2', moduleId: 'calendar', pole: 'workspace', color: '#c084fc', speed: 0.095, size: 1.6, initialOffset: 5.0, trackIndex: 1 },
  { id: 'pkt-dashboard-1', moduleId: 'dashboard', pole: 'workspace', color: '#3b82f6', speed: 0.075, size: 2.2, initialOffset: 1.0, trackIndex: 1 },
  { id: 'pkt-dashboard-2', moduleId: 'dashboard', pole: 'workspace', color: '#60a5fa', speed: 0.11, size: 1.7, initialOffset: 4.2, trackIndex: 1 },

  // Polo Habit Core
  { id: 'pkt-habits-1', moduleId: 'habits', pole: 'habits', color: '#10b981', speed: 0.07, size: 2.2, initialOffset: 0.5, trackIndex: 0 },
  { id: 'pkt-habits-2', moduleId: 'habits', pole: 'habits', color: '#34d399', speed: 0.10, size: 1.8, initialOffset: 3.7, trackIndex: 0 },
  { id: 'pkt-challenges-1', moduleId: 'challenges', pole: 'habits', color: '#eab308', speed: 0.065, size: 2.0, initialOffset: 1.8, trackIndex: 1 },
  { id: 'pkt-challenges-2', moduleId: 'challenges', pole: 'habits', color: '#fde047', speed: 0.085, size: 1.7, initialOffset: 4.8, trackIndex: 1 },
  { id: 'pkt-goals-1', moduleId: 'goals', pole: 'habits', color: '#f97316', speed: 0.08, size: 2.0, initialOffset: 2.9, trackIndex: 1 },
  { id: 'pkt-goals-2', moduleId: 'goals', pole: 'habits', color: '#fb923c', speed: 0.06, size: 1.6, initialOffset: 5.8, trackIndex: 1 },
  { id: 'pkt-pomodoro-1', moduleId: 'pomodoro', pole: 'habits', color: '#f43f5e', speed: 0.11, size: 2.2, initialOffset: 4.5, trackIndex: 0 },
  { id: 'pkt-pomodoro-2', moduleId: 'pomodoro', pole: 'habits', color: '#fda4af', speed: 0.07, size: 1.8, initialOffset: 1.2, trackIndex: 0 },

  // Puente Gravitacional (flujo de energía entre Workspace y Habit Core)
  { id: 'pkt-bridge-1', isBridge: true, color: '#06b6d4', speed: 0.16, size: 2.4, initialOffset: 0.1, direction: 1 },
  { id: 'pkt-bridge-2', isBridge: true, color: '#10b981', speed: 0.14, size: 2.2, initialOffset: 0.55, direction: -1 },
  { id: 'pkt-bridge-3', isBridge: true, color: '#38bdf8', speed: 0.20, size: 1.9, initialOffset: 0.85, direction: 1 },
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

    // Radios seguros para móvil (considerando laneScale hasta 1.225 y diámetro de planetas de ~48px)
    // Dejamos un margen garantizado de al menos 52px en cada lateral para que NUNCA toquen ni salgan de la pantalla
    const availableHalfW = (safeW / 2) - 52;
    const maxRadiusX = Math.min(104, Math.max(76, Math.floor(availableHalfW / 1.225)));

    // En vertical, consideramos la cabecera HUD superior (~75px) y el footer (~40px)
    const availableHalfH = (safeH - 220) / 2;
    const maxRadiusY = Math.min(140, Math.max(95, Math.floor(availableHalfH / 1.225)));

    const planetScale = isSmallPhone
      ? Math.min(0.62, Math.max(0.52, safeW / 620))
      : 0.72;
    const coreScale = isSmallPhone ? 0.60 : 0.74;

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
