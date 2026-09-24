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
import { CommandCenterConnections } from './CommandCenterConnections';
import { CommandCenterPlanet } from './CommandCenterPlanet';
import { CommandCenterProjectCore } from './CommandCenterProjectCore';
import { CommandCenterUserCore } from './CommandCenterUserCore';
import { CommandCenterBarycenter } from './CommandCenterBarycenter';
import { CommandCenterFooter } from './CommandCenterFooter';
import { X, ArrowRight } from 'lucide-react';

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

  // Estado angular de cada planeta (imperativo en refs para evitar re-renders por frame a 60 FPS)
  const anglesRef = useRef<Record<string, number>>({});
  const [planetPositions, setPlanetPositions] = useState<
    Array<{ id: string; x: number; y: number; originX: number; originY: number; color: string }>
  >([]);

  // Detección de gestos Swipe en móvil
  const touchStartXRef = useRef<number | null>(null);

  // 1. Inicializar ángulos orbitales base
  useEffect(() => {
    const initialAngles: Record<string, number> = {};
    COMMAND_CENTER_MODULES.forEach((m) => {
      initialAngles[m.id] = m.baseAngleRad;
    });
    anglesRef.current = initialAngles;
  }, []);

  // 2. Suscribirse a Pomodoro
  useEffect(() => {
    const unsub = subscribePomodoro((state) => {
      setPomodoroState(state);
    });
    return () => unsub();
  }, []);

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

  // 6. Bucle de Traslación Orbital Ambiental (60 FPS, imperativo)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const orbitLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const positions: Array<{
        id: string;
        x: number;
        y: number;
        originX: number;
        originY: number;
        color: string;
      }> = [];

      visibleModules.forEach((m) => {
        let currentAngle = anglesRef.current[m.id] ?? m.baseAngleRad;

        const isDraggingThis = draggingModuleId === m.id;
        const isHoveringThis = hoveredModuleId === m.id;

        if (!prefersReducedMotion && !isDraggingThis) {
          const speedMultiplier = isHoveringThis ? 0.25 : 1.0;
          currentAngle += m.orbitSpeedRadPerSec * speedMultiplier * dt;
          anglesRef.current[m.id] = currentAngle;
        }

        // Obtener el centro orbital del polo y radio
        const isWorkspace = m.pole === 'workspace';
        const center =
          binaryParams.layoutMode === 'panoramic'
            ? isWorkspace
              ? binaryParams.workspaceCenter
              : binaryParams.habitsCenter
            : { x: 0, y: 0 };

        const rx = isWorkspace ? binaryParams.workspaceRadiusX : binaryParams.habitsRadiusX;
        const ry = isWorkspace ? binaryParams.workspaceRadiusY : binaryParams.habitsRadiusY;

        const posX = center.x + rx * Math.cos(currentAngle);
        const posY = center.y + ry * Math.sin(currentAngle);

        positions.push({
          id: m.id,
          x: posX,
          y: posY,
          originX: center.x,
          originY: center.y,
          color: m.accentHex,
        });
      });

      setPlanetPositions(positions);
      animId = requestAnimationFrame(orbitLoop);
    };

    animId = requestAnimationFrame(orbitLoop);
    return () => cancelAnimationFrame(animId);
  }, [binaryParams, visibleModules, hoveredModuleId, draggingModuleId]);

  // Navegación al módulo
  const handleNavigateModule = (moduleConfig: CommandCenterModuleConfig) => {
    if (moduleConfig.targetView === 'pomodoro_action') {
      onOpenPomodoro();
    } else {
      onNavigate(moduleConfig.targetView as AppView, moduleConfig.targetSubView);
    }
  };

  const handleDragStateChange = (moduleId: string, isDragging: boolean) => {
    if (isDragging) {
      setDraggingModuleId(moduleId);
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
      setActivePole('habits');
      setHoveredModuleId(null);
    }
    // Deslizar derecha -> ir a Workspace
    else if (diff > 50 && activePole === 'habits') {
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
      {/* 1. Malla estelar de fondo ambiental */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#38bdf8 0.75px, transparent 0.75px), radial-gradient(#10b981 0.75px, transparent 0.75px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* 2. Selector HUD Superior / Baricentro de Conexión */}
      <CommandCenterBarycenter
        activeProject={activeProject}
        currentUser={currentUser}
        projectTaskCount={effectiveProjectTasks.length}
        consistencyPct={userConsistencyPct}
        activePole={activePole}
        onSelectPole={(pole) => {
          setActivePole(pole);
          setHoveredModuleId(null);
        }}
        isMobile={binaryParams.isMobile}
        layoutMode={binaryParams.layoutMode}
      />

      {/* 3. Escenario Orbital Central */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Pistas orbitales elípticas */}
        <CommandCenterOrbit
          binaryParams={binaryParams}
          activePole={activePole}
          activeProjectColor={activeProject?.color || '#06b6d4'}
        />

        {/* Haces de conexión holográficos hacia cada polo */}
        <CommandCenterConnections
          planetPositions={planetPositions}
          hoveredModuleId={hoveredModuleId}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
        />

        {/* NÚCLEOS CENTRALES */}
        {binaryParams.layoutMode === 'panoramic' ? (
          <>
            {/* Polo WORKSPACE (Izquierda) */}
            <div
              className="absolute top-1/2 left-1/2"
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
              />
            </div>

            {/* Polo HABIT CORE (Derecha) */}
            <div
              className="absolute top-1/2 left-1/2"
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {activePole === 'workspace' ? (
              <CommandCenterProjectCore
                activeProject={activeProject}
                accessibleProjects={accessibleProjects}
                taskCount={effectiveProjectTasks.length}
                onSelectProject={onSelectProject}
                onOpenCreateProject={onOpenCreateProject}
                scale={binaryParams.coreScale}
                onCoreClick={() => onNavigate('board')}
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

        {/* PLANETAS EN ÓRBITA */}
        {visibleModules.map((module) => {
          const isWs = module.pole === 'workspace';
          const center =
            binaryParams.layoutMode === 'panoramic'
              ? isWs
                ? binaryParams.workspaceCenter
                : binaryParams.habitsCenter
              : { x: 0, y: 0 };

          const rx = isWs ? binaryParams.workspaceRadiusX : binaryParams.habitsRadiusX;
          const ry = isWs ? binaryParams.workspaceRadiusY : binaryParams.habitsRadiusY;

          const pos = planetPositions.find((p) => p.id === module.id) || {
            x: center.x + rx * Math.cos(module.baseAngleRad),
            y: center.y + ry * Math.sin(module.baseAngleRad),
          };

          const isHovered = hoveredModuleId === module.id;
          const stats = moduleStats[module.id] || [];

          // Decidir posición de la tarjeta: apunta hacia el núcleo de su propio polo
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
              module={module}
              stats={stats}
              x={pos.x}
              y={pos.y}
              size={Math.round(module.planetSizePx * binaryParams.planetScale)}
              isHovered={isHovered}
              onHover={setHoveredModuleId}
              onNavigate={handleNavigateModule}
              onDragStateChange={handleDragStateChange}
              isMobile={binaryParams.isMobile}
              positionPreference={positionPref}
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
