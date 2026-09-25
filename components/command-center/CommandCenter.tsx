'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Task, Project, AppView } from '@/lib/types';
import {
  COMMAND_CENTER_MODULES,
  WORKSPACE_MODULE_CONFIGS,
  HABIT_MODULE_CONFIGS,
  CommandCenterModuleConfig,
  CommandCenterPole,
  ModuleStatItem,
  getBinarySystemLayout,
  BinaryOrbitParams,
} from './commandCenterConfig';
import { CommandCenterOrbit } from './CommandCenterOrbit';
import {
  CommandCenterConnections,
  CommandCenterConnectionsHandle,
  PlanetPosition,
} from './CommandCenterConnections';
import { CommandCenterPlanet } from './CommandCenterPlanet';
import { CommandCenterProjectCore } from './CommandCenterProjectCore';
import { CommandCenterUserCore } from './CommandCenterUserCore';
import { CommandCenterBarycenter } from './CommandCenterBarycenter';
import { CommandCenterFooter } from './CommandCenterFooter';
import { CommandCenterAudioHUD } from './CommandCenterAudioHUD';
import { X, ArrowRight } from 'lucide-react';

import {
  isSoundEnabled,
  hasWelcomedThisSession,
  markWelcomedThisSession,
  playSciFiBootSequence,
  playShipWelcomeVoice,
  startAmbientWarpDrone,
  stopAmbientWarpDrone,
  playPlanetTelemetrySound,
  playGiroDriftSound,
  playWarpJumpSound,
} from '@/lib/soundEffects';

// Data sources
import { getLocalHabits, getLocalHabitLogs, getLocalGoals } from '@/lib/habitStorage';
import { getLocalChallenges, getLocalChallengeMembers } from '@/lib/challengeStorage';
import { getPomodoroState, PomodoroState, subscribePomodoro } from '@/lib/pomodoro';
import { getBogotaToday } from '@/lib/habitCalculations';

interface CommandCenterProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  projectTasks?: Task[];
  activeProject?: Project | null;
  accessibleProjects?: Project[];
  onSelectProject?: (projectId: string) => void;
  onOpenCreateProject?: () => void;
  onNavigate: (view: AppView, subView?: string) => void;
  onOpenPomodoro: () => void;
  onOpenNewTaskModal?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  currentUser,
  users,
  tasks,
  projectTasks,
  activeProject = null,
  accessibleProjects = [],
  onSelectProject = () => {},
  onOpenCreateProject,
  onNavigate,
  onOpenPomodoro,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 750,
  });

  // Polo activo para modo móvil / focus
  const [activePole, setActivePole] = useState<CommandCenterPole>('workspace');

  const [binaryParams, setBinaryParams] = useState<BinaryOrbitParams>(() =>
    getBinarySystemLayout(1200, 750, 'workspace')
  );

  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(getPomodoroState());
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Relojes maestros armónicos de cada polo (invarianza de período y cero drift acumulativo)
  const workspaceClockRef = useRef<number>(0);
  const habitsClockRef = useRef<number>(0);
  const workspaceSpeedModRef = useRef<number>(1.0);
  const habitsSpeedModRef = useRef<number>(1.0);

  // Refs directos al DOM para animación a 60 FPS con CERO re-renders de React
  const planetContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const connectionsRef = useRef<CommandCenterConnectionsHandle>(null);

  // Detección de gestos Swipe en móvil
  const touchStartXRef = useRef<number | null>(null);

  // 2. Suscribirse a Pomodoro
  useEffect(() => {
    const unsub = subscribePomodoro((state) => {
      setPomodoroState(state);
    });
    return () => unsub();
  }, []);

  // 2b. Audio Ambient & Boot Lifecycle
  useEffect(() => {
    if (!isSoundEnabled()) return;

    let bootTimer: NodeJS.Timeout | null = null;
    let voiceTimer: NodeJS.Timeout | null = null;
    let droneTimer: NodeJS.Timeout | null = null;

    if (!hasWelcomedThisSession()) {
      // Primera visita de la sesión: Secuencia cinemática
      bootTimer = setTimeout(() => {
        playSciFiBootSequence();
      }, 400);

      voiceTimer = setTimeout(() => {
        playShipWelcomeVoice(currentUser.name);
        markWelcomedThisSession();
      }, 950);

      droneTimer = setTimeout(() => {
        startAmbientWarpDrone();
      }, 2500);
    } else {
      // Re-entrada en la sesión: solo iniciar motor espacial suavemente
      droneTimer = setTimeout(() => {
        startAmbientWarpDrone();
      }, 800);
    }

    // Pausar audio al cambiar de pestaña para no molestar
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAmbientWarpDrone();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } else if (isSoundEnabled()) {
        startAmbientWarpDrone();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bootTimer) clearTimeout(bootTimer);
      if (voiceTimer) clearTimeout(voiceTimer);
      if (droneTimer) clearTimeout(droneTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAmbientWarpDrone();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentUser.name]);

  // 3. Medición y escala responsiva de la composición orbital binaria
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || 750;
    setContainerDimensions({ width: w, height: h });
    setBinaryParams(getBinarySystemLayout(w, h, activePole));
  }, [activePole]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // 4. Extracción de Tareas del Proyecto Activo vs Tareas Generales
  const effectiveProjectTasks = useMemo(() => {
    if (projectTasks && projectTasks.length > 0) return projectTasks;
    if (activeProject) return tasks.filter((t) => t.projectId === activeProject.id);
    return [];
  }, [projectTasks, tasks, activeProject]);

  // 5. Extracción de Métricas Reales del Sistema
  const moduleStats = useMemo<Record<string, ModuleStatItem[]>>(() => {
    const todayKey = getBogotaToday();

    // A. Módulos de Proyecto (Workspace)
    const totalProjTasks = effectiveProjectTasks.length;
    const inProgressTasks = effectiveProjectTasks.filter((t) => t.status === 'trabajando').length;
    const pendingTasks = effectiveProjectTasks.filter((t) => t.status === 'iniciado').length;
    const completedTasks = effectiveProjectTasks.filter((t) => t.status === 'finalizado').length;

    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const dueThisWeek = effectiveProjectTasks.filter(
      (t) => t.dueDate && t.dueDate >= todayKey && t.dueDate <= sevenDaysFromNow && t.status !== 'finalizado'
    ).length;
    const upcomingTasks = effectiveProjectTasks.filter(
      (t) => t.dueDate && t.dueDate > sevenDaysFromNow && t.status !== 'finalizado'
    ).length;

    const completionRate = totalProjTasks > 0 ? Math.round((completedTasks / totalProjTasks) * 100) : 0;

    // B. Módulos de Usuario (Habit Core)
    const userHabits = getLocalHabits(currentUser.id).filter((h) => h.isActive);
    const activeHabitsCount = userHabits.length;
    const todayLogs = getLocalHabitLogs(currentUser.id).filter(
      (l) => l.dateKey === todayKey && l.status === 'completed'
    );
    const habitCompletionPct =
      activeHabitsCount > 0 ? Math.round((todayLogs.length / activeHabitsCount) * 100) : 0;

    const allChallenges = getLocalChallenges().filter((c) => c.status === 'active');
    const allMembers = getLocalChallengeMembers();
    const accessibleChallenges = allChallenges.filter(
      (c) =>
        currentUser.role === 'admin' ||
        c.createdBy === currentUser.id ||
        allMembers.some((m) => m.challengeId === c.id && m.userId === currentUser.id)
    );

    const allGoals = getLocalGoals(currentUser.id);
    const activeGoalsCount = allGoals.filter((g) => !g.isCompleted).length;
    const completedGoalsCount = allGoals.filter((g) => g.isCompleted).length;

    const minutes = Math.floor(pomodoroState.remainingSeconds / 60);
    const seconds = pomodoroState.remainingSeconds % 60;
    const timerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const pomodoroStatusText = pomodoroState.isRunning
      ? 'En foco'
      : pomodoroState.remainingSeconds === 0
      ? 'Completado'
      : 'Listo';

    return {
      board: [
        { label: 'Totales', value: totalProjTasks, highlight: true },
        { label: 'En proceso', value: inProgressTasks },
        { label: 'Pendientes', value: pendingTasks },
      ],
      calendar: [
        { label: 'Esta semana', value: dueThisWeek, highlight: true },
        { label: 'Próximas', value: upcomingTasks },
      ],
      dashboard: [
        { label: 'Cumplimiento', value: `${completionRate}%`, highlight: true },
        { label: 'Finalizadas', value: completedTasks },
      ],
      goals: [
        { label: 'Activos', value: activeGoalsCount, highlight: true },
        { label: 'Completados', value: completedGoalsCount },
      ],
      habits: [
        { label: 'Activos', value: activeHabitsCount },
        { label: 'Hoy', value: `${habitCompletionPct}%`, highlight: true },
        { label: 'Completados', value: todayLogs.length },
      ],
      challenges: [
        { label: 'Activos', value: accessibleChallenges.length, highlight: true },
        { label: 'En curso', value: accessibleChallenges.length > 0 ? 'Sí' : '0' },
      ],
      pomodoro: [
        { label: 'Tiempo', value: timerText, highlight: true },
        { label: 'Estado', value: pomodoroStatusText },
      ],
    };
  }, [effectiveProjectTasks, currentUser, pomodoroState]);

  // Constancia personal general del usuario (%)
  const userConsistencyPct = useMemo(() => {
    const userHabits = getLocalHabits(currentUser.id).filter((h) => h.isActive);
    if (userHabits.length === 0) return 85;
    const todayLogs = getLocalHabitLogs(currentUser.id).filter(
      (l) => l.dateKey === getBogotaToday() && l.status === 'completed'
    );
    return Math.round((todayLogs.length / userHabits.length) * 100);
  }, [currentUser.id]);

  // Módulos visibles según el modo de diseño
  const visibleModules = useMemo(() => {
    if (binaryParams.layoutMode === 'panoramic') {
      return COMMAND_CENTER_MODULES;
    }
    return activePole === 'workspace' ? WORKSPACE_MODULE_CONFIGS : HABIT_MODULE_CONFIGS;
  }, [binaryParams.layoutMode, activePole]);

  // 6. Cálculo posicional determinístico y armónico por módulo
  const computeModulePos = useCallback(
    (module: CommandCenterModuleConfig) => {
      const isWs = module.pole === 'workspace';
      const center =
        binaryParams.layoutMode === 'panoramic'
          ? isWs
            ? binaryParams.workspaceCenter
            : binaryParams.habitsCenter
          : { x: 0, y: 0 };

      const baseRx = isWs ? binaryParams.workspaceRadiusX : binaryParams.habitsRadiusX;
      const baseRy = isWs ? binaryParams.workspaceRadiusY : binaryParams.habitsRadiusY;
      const lane = module.laneScale ?? 1.0;
      const rx = baseRx * lane;
      const ry = baseRy * lane;

      const clock = isWs ? workspaceClockRef.current : habitsClockRef.current;
      const amp = module.speedModAmp ?? 0.05;
      const phase = module.speedModPhase ?? 0;
      const nominalAngle = clock + module.baseAngleRad;
      const currentAngle = nominalAngle + amp * Math.sin(nominalAngle + phase);

      const posX = center.x + rx * Math.cos(currentAngle);
      const posY = center.y + ry * Math.sin(currentAngle);
      const depthFactor = Math.max(-1, Math.min(1, (posY - center.y) / (ry || 1)));
      const dynamicZIndex = hoveredModuleId === module.id ? 60 : 26 + Math.round(depthFactor * 8);

      return {
        id: module.id,
        x: posX,
        y: posY,
        originX: center.x,
        originY: center.y,
        color: module.accentHex,
        zIndex: dynamicZIndex,
      };
    },
    [binaryParams, hoveredModuleId]
  );

  const initialPlanetPositions = useMemo(
    () => visibleModules.map(computeModulePos),
    [visibleModules, computeModulePos]
  );

  // 7. Bucle de Traslación Orbital Armónica (60 FPS, imperativo sin React re-renders)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const orbitLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // 1. Moduladores de velocidad según hover y drag
      let targetWsSpeed = 1.0;
      let targetHbSpeed = 1.0;

      if (draggingModuleId) {
        const mod = visibleModules.find((m) => m.id === draggingModuleId);
        if (mod?.pole === 'workspace') targetWsSpeed = 0.0;
        if (mod?.pole === 'habits') targetHbSpeed = 0.0;
      } else if (hoveredModuleId) {
        const mod = visibleModules.find((m) => m.id === hoveredModuleId);
        if (mod?.pole === 'workspace') targetWsSpeed = 0.35;
        if (mod?.pole === 'habits') targetHbSpeed = 0.35;
      }

      // Transición suave (lerp) para evitar tirones
      const lerpFactor = Math.min(1.0, dt * 5.0);
      workspaceSpeedModRef.current += (targetWsSpeed - workspaceSpeedModRef.current) * lerpFactor;
      habitsSpeedModRef.current += (targetHbSpeed - habitsSpeedModRef.current) * lerpFactor;

      // 2. Avance de relojes maestros orbitales
      if (!prefersReducedMotion) {
        workspaceClockRef.current += 0.006 * workspaceSpeedModRef.current * dt;
        habitsClockRef.current += 0.0055 * habitsSpeedModRef.current * dt;
      }

      // 3. Actualización directa de coordenadas DOM a 60 FPS (cero React setState)
      const positions: PlanetPosition[] = [];

      for (const m of visibleModules) {
        const pos = computeModulePos(m);
        positions.push(pos);

        const el = planetContainerRefs.current[m.id];
        if (el) {
          el.style.transform = `translate(-50%, -50%) translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
          if (hoveredModuleId !== m.id) {
            el.style.zIndex = `${pos.zIndex}`;
          }
        }
      }

      // 4. Actualización imperativa de los haces de conexión SVG
      connectionsRef.current?.updatePositions(
        positions,
        containerRef.current?.clientWidth || window.innerWidth,
        containerRef.current?.clientHeight || 750
      );

      animId = requestAnimationFrame(orbitLoop);
    };

    animId = requestAnimationFrame(orbitLoop);
    return () => cancelAnimationFrame(animId);
  }, [visibleModules, hoveredModuleId, draggingModuleId, computeModulePos]);

  // Navegación al módulo
  const handleNavigateModule = (moduleConfig: CommandCenterModuleConfig) => {
    if (moduleConfig.targetView === 'pomodoro_action') {
      onOpenPomodoro();
    } else {
      onNavigate(moduleConfig.targetView as AppView, moduleConfig.targetSubView);
    }
  };

  const handlePlanetHover = useCallback((moduleId: string | null) => {
    setHoveredModuleId(moduleId);
    if (moduleId) {
      playPlanetTelemetrySound(moduleId);
    }
  }, []);

  const handleDragStateChange = (moduleId: string, isDragging: boolean) => {
    if (isDragging) {
      setDraggingModuleId(moduleId);
      playGiroDriftSound();
    } else {
      setDraggingModuleId((prev) => (prev === moduleId ? null : prev));
    }
  };

  // Módulo seleccionado para vista móvil
  const activeMobileModule = hoveredModuleId
    ? COMMAND_CENTER_MODULES.find((m) => m.id === hoveredModuleId) || null
    : null;
  const activeMobileStats = activeMobileModule ? moduleStats[activeMobileModule.id] || [] : [];

  // Soporte de Swipe en Pantallas Táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    // Deslizar izquierda -> ir a Hábitos
    if (diff < -50 && activePole === 'workspace') {
      playWarpJumpSound();
      setActivePole('habits');
      setHoveredModuleId(null);
    }
    // Deslizar derecha -> ir a Workspace
    else if (diff > 50 && activePole === 'habits') {
      playWarpJumpSound();
      setActivePole('workspace');
      setHoveredModuleId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#020617] via-[#050b14] to-[#020617] overflow-hidden select-none shadow-[0_0_50px_rgba(6,182,212,0.12)] flex flex-col justify-between"
      style={{ minHeight: binaryParams.containerHeight, height: 'calc(100vh - 120px)' }}
    >
      {/* 1. Malla estelar de fondo ambiental con iluminación y viñeta cinematográfica */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente difuso atmosférico detrás de Workspace (Cyan / Azul) */}
        <div
          className="absolute -inset-10 opacity-70 transition-all duration-700 pointer-events-none"
          style={{
            background:
              binaryParams.layoutMode === 'panoramic'
                ? `radial-gradient(circle 380px at calc(50% + ${binaryParams.workspaceCenter.x}px) 50%, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.02) 45%, transparent 75%)`
                : activePole === 'workspace'
                ? 'radial-gradient(circle 320px at 50% 50%, rgba(6, 182, 212, 0.09) 0%, rgba(59, 130, 246, 0.02) 50%, transparent 75%)'
                : 'none',
          }}
        />

        {/* Gradiente difuso atmosférico detrás de Habit Core (Esmeralda / Menta) */}
        <div
          className="absolute -inset-10 opacity-70 transition-all duration-700 pointer-events-none"
          style={{
            background:
              binaryParams.layoutMode === 'panoramic'
                ? `radial-gradient(circle 380px at calc(50% + ${binaryParams.habitsCenter.x}px) 50%, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.02) 45%, transparent 75%)`
                : activePole === 'habits'
                ? 'radial-gradient(circle 320px at 50% 50%, rgba(16, 185, 129, 0.09) 0%, rgba(6, 182, 212, 0.02) 50%, transparent 75%)'
                : 'none',
          }}
        />

        {/* Malla estelar fina con sutil profundidad */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#38bdf8 0.75px, transparent 0.75px), radial-gradient(#10b981 0.75px, transparent 0.75px)',
            backgroundSize: '34px 34px',
            backgroundPosition: '0 0, 17px 17px',
          }}
        />

        {/* Viñeta perimetral obsidiana para concentrar la mirada en los núcleos */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(2, 6, 23, 0.75) 100%)',
          }}
        />
      </div>

      {/* HUD de Control de Audio de Cabina (Mute, Idioma, Com-Link) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-40">
        <CommandCenterAudioHUD
          currentUserName={currentUser.name}
          isMobile={binaryParams.isMobile}
        />
      </div>

      {/* 2. Selector HUD Superior / Baricentro de Conexión */}
      <CommandCenterBarycenter
        activeProject={activeProject}
        currentUser={currentUser}
        projectTaskCount={effectiveProjectTasks.length}
        consistencyPct={userConsistencyPct}
        activePole={activePole}
        onSelectPole={(pole) => {
          if (pole !== activePole) {
            playWarpJumpSound();
          }
          setActivePole(pole);
          setHoveredModuleId(null);
          setIsProjectDropdownOpen(false);
        }}
        isMobile={binaryParams.isMobile}
        layoutMode={binaryParams.layoutMode}
      />

      {/* 3. Escenario Orbital Central */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Backdrop tenue cuando el selector de proyectos está abierto */}
        {isProjectDropdownOpen && (
          <div
            className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setIsProjectDropdownOpen(false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsProjectDropdownOpen(false);
            }}
          />
        )}

        {/* Capa Trasera de Órbitas (arcos superiores Y <= 0 y puente posterior, detrás de los núcleos) */}
        <div className="absolute inset-0 z-[5] pointer-events-none">
          <CommandCenterOrbit
            layer="back"
            binaryParams={binaryParams}
            activePole={activePole}
            activeProjectColor={activeProject?.color || '#06b6d4'}
            hoveredModuleId={hoveredModuleId}
          />
        </div>

        {/* Haces de conexión holográficos hacia cada polo */}
        <div className="absolute inset-0 z-[7] pointer-events-none">
          <CommandCenterConnections
            ref={connectionsRef}
            planetPositions={initialPlanetPositions}
            hoveredModuleId={hoveredModuleId}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
          />
        </div>

        {/* NÚCLEOS CENTRALES */}
        {binaryParams.layoutMode === 'panoramic' ? (
          <>
            {/* Polo WORKSPACE (Izquierda) */}
            <div
              className={`absolute top-1/2 left-1/2 transition-[z-index] ${
                isProjectDropdownOpen ? 'z-[70]' : 'z-[15]'
              }`}
              style={{
                transform: `translate(calc(-50% + ${binaryParams.workspaceCenter.x}px), -50%)`,
              }}
            >
              <CommandCenterProjectCore
                activeProject={activeProject}
                accessibleProjects={accessibleProjects}
                taskCount={effectiveProjectTasks.length}
                onSelectProject={onSelectProject}
                onOpenCreateProject={onOpenCreateProject}
                scale={binaryParams.coreScale}
                onCoreClick={() => onNavigate('board')}
                isDropdownOpen={isProjectDropdownOpen}
                onDropdownOpenChange={setIsProjectDropdownOpen}
                isMobile={binaryParams.isMobile}
              />
            </div>

            {/* Polo HABIT CORE (Derecha) */}
            <div
              className="absolute top-1/2 left-1/2 z-[15]"
              style={{
                transform: `translate(calc(-50% + ${binaryParams.habitsCenter.x}px), -50%)`,
              }}
            >
              <CommandCenterUserCore
                currentUser={currentUser}
                consistencyPct={userConsistencyPct}
                activeHabitsCount={getLocalHabits(currentUser.id).filter((h) => h.isActive).length}
                scale={binaryParams.coreScale}
                onCoreClick={() => onNavigate('habits')}
              />
            </div>
          </>
        ) : (
          /* MODO FOCUS / MÓVIL (Centrado al 100% en el polo activo) */
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[z-index] ${
              isProjectDropdownOpen ? 'z-[70]' : 'z-[15]'
            }`}
          >
            {activePole === 'workspace' ? (
              <CommandCenterProjectCore
                activeProject={activeProject}
                accessibleProjects={accessibleProjects}
                taskCount={effectiveProjectTasks.length}
                onSelectProject={onSelectProject}
                onOpenCreateProject={onOpenCreateProject}
                scale={binaryParams.coreScale}
                onCoreClick={() => onNavigate('board')}
                isDropdownOpen={isProjectDropdownOpen}
                onDropdownOpenChange={setIsProjectDropdownOpen}
                isMobile={binaryParams.isMobile}
              />
            ) : (
              <CommandCenterUserCore
                currentUser={currentUser}
                consistencyPct={userConsistencyPct}
                activeHabitsCount={getLocalHabits(currentUser.id).filter((h) => h.isActive).length}
                scale={binaryParams.coreScale}
                onCoreClick={() => onNavigate('habits')}
              />
            )}
          </div>
        )}

        {/* Capa Delantera de Órbitas (arcos inferiores Y > 0 y puente frontal, delante de los núcleos pero detrás de planetas) */}
        <div className="absolute inset-0 z-[18] pointer-events-none">
          <CommandCenterOrbit
            layer="front"
            binaryParams={binaryParams}
            activePole={activePole}
            activeProjectColor={activeProject?.color || '#06b6d4'}
            hoveredModuleId={hoveredModuleId}
          />
        </div>

        {/* PLANETAS EN ÓRBITA */}
        {visibleModules.map((module) => {
          const pos = computeModulePos(module);
          const isHovered = hoveredModuleId === module.id;
          const stats = moduleStats[module.id] || [];

          // Decidir posición de la tarjeta: apunta hacia el núcleo de su propio polo
          const isWs = module.pole === 'workspace';
          const center =
            binaryParams.layoutMode === 'panoramic'
              ? isWs
                ? binaryParams.workspaceCenter
                : binaryParams.habitsCenter
              : { x: 0, y: 0 };

          const relX = pos.x - center.x;
          let positionPref: 'top' | 'bottom' | 'left' | 'right';
          if (relX > 25) {
            positionPref = 'left';
          } else if (relX < -25) {
            positionPref = 'right';
          } else {
            positionPref = pos.y < 0 ? 'bottom' : 'top';
          }

          return (
            <CommandCenterPlanet
              key={module.id}
              ref={(el) => {
                planetContainerRefs.current[module.id] = el;
              }}
              module={module}
              stats={stats}
              x={pos.x}
              y={pos.y}
              size={Math.round(module.planetSizePx * binaryParams.planetScale)}
              isHovered={isHovered}
              onHover={handlePlanetHover}
              onNavigate={handleNavigateModule}
              onDragStateChange={handleDragStateChange}
              isMobile={binaryParams.isMobile}
              positionPreference={positionPref}
              zIndex={pos.zIndex}
            />
          );
        })}

        {/* Tarjeta HUD Móvil (Dock inferior cuando se selecciona un planeta en móvil) */}
        {binaryParams.isMobile && activeMobileModule && (
          <div className="absolute bottom-3 left-3 right-3 z-50 animate-modal-enter pointer-events-auto">
            <div
              className="rounded-2xl p-3.5 border backdrop-blur-2xl shadow-2xl relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(7, 12, 24, 0.95)',
                borderColor: activeMobileModule.accentHex,
                boxShadow: `0 0 25px ${activeMobileModule.glowRgba}, 0 10px 40px rgba(0,0,0,0.9)`,
              }}
            >
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setHoveredModuleId(null)}
                className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeMobileModule.accentHex }}
                />
                <h3 className="font-mono text-xs font-bold text-white tracking-wide">
                  {activeMobileModule.title}
                </h3>
                <span className="text-[10px] text-zinc-400 font-sans truncate">
                  {activeMobileModule.subtitle}
                </span>
              </div>

              {/* Métricas en chips táctiles */}
              {activeMobileStats.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {activeMobileStats.map((st, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col"
                    >
                      <span className="text-[9px] text-zinc-400 font-sans">{st.label}</span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: st.highlight ? activeMobileModule.accentHex : '#ffffff' }}
                      >
                        {st.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón CTA táctil */}
              <button
                type="button"
                onClick={() => handleNavigateModule(activeMobileModule)}
                className="w-full py-2 px-3 rounded-xl font-mono text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                style={{
                  backgroundColor: activeMobileModule.accentHex,
                  boxShadow: `0 0 16px ${activeMobileModule.glowRgba}`,
                }}
              >
                <span>Abrir {activeMobileModule.title}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pie de Página HUD Inspiracional */}
      <CommandCenterFooter />
    </div>
  );
};
