'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Task, AppView } from '@/lib/types';
import {
  COMMAND_CENTER_MODULES,
  CommandCenterModuleConfig,
  ModuleStatItem,
  getResponsiveOrbitParams,
  ResponsiveOrbitParams,
} from './commandCenterConfig';
import { CommandCenterOrbit } from './CommandCenterOrbit';
import { CommandCenterConnections } from './CommandCenterConnections';
import { CommandCenterPlanet } from './CommandCenterPlanet';
import { CommandCenterCore } from './CommandCenterCore';
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
  onNavigate: (view: AppView, subView?: string) => void;
  onOpenPomodoro: () => void;
  onOpenNewTaskModal?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  currentUser,
  users,
  tasks,
  onNavigate,
  onOpenPomodoro,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 750,
  });
  const [orbitParams, setOrbitParams] = useState<ResponsiveOrbitParams>(() =>
    getResponsiveOrbitParams(1200, 750)
  );
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(getPomodoroState());

  // Estado angular de cada planeta (independiente de React re-renders)
  const anglesRef = useRef<Record<string, number>>({});
  const [planetPositions, setPlanetPositions] = useState<
    Array<{ id: string; x: number; y: number; color: string }>
  >([]);

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

  // 3. Medición y escala responsiva de la composición orbital
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || 750;
    setContainerDimensions({ width: w, height: h });
    setOrbitParams(getResponsiveOrbitParams(w, h));
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // 4. Extracción de Métricas Reales del Sistema
  const moduleStats = useMemo<Record<string, ModuleStatItem[]>>(() => {
    const todayKey = getBogotaToday();

    // Tablero (Tareas)
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter((t) => t.status === 'trabajando').length;
    const pendingTasks = tasks.filter((t) => t.status === 'iniciado').length;
    const completedTasks = tasks.filter((t) => t.status === 'finalizado').length;

    // Calendario (Tareas por vencer)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const dueThisWeek = tasks.filter(
      (t) => t.dueDate && t.dueDate >= todayKey && t.dueDate <= sevenDaysFromNow && t.status !== 'finalizado'
    ).length;
    const upcomingTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate > sevenDaysFromNow && t.status !== 'finalizado'
    ).length;

    // Métricas (Cumplimiento)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Mis Hábitos
    const userHabits = getLocalHabits(currentUser.id).filter((h) => h.isActive);
    const activeHabitsCount = userHabits.length;
    const todayLogs = getLocalHabitLogs(currentUser.id).filter(
      (l) => l.dateKey === todayKey && l.status === 'completed'
    );
    const habitCompletionPct =
      activeHabitsCount > 0 ? Math.round((todayLogs.length / activeHabitsCount) * 100) : 0;

    // Retos Compartidos
    const allChallenges = getLocalChallenges().filter((c) => c.status === 'active');
    const allMembers = getLocalChallengeMembers();
    const accessibleChallenges = allChallenges.filter(
      (c) =>
        currentUser.role === 'admin' ||
        c.createdBy === currentUser.id ||
        allMembers.some((m) => m.challengeId === c.id && m.userId === currentUser.id)
    );

    // Objetivos
    const allGoals = getLocalGoals(currentUser.id);
    const activeGoalsCount = allGoals.filter((g) => !g.isCompleted).length;
    const completedGoalsCount = allGoals.filter((g) => g.isCompleted).length;

    // Pomodoro
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
        { label: 'Totales', value: totalTasks, highlight: true },
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
  }, [tasks, currentUser, pomodoroState]);

  // 5. Bucle de Traslación Orbital Ambiental (MUY LENTO, SEPARADO DEL DRAG)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const orbitLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const positions: Array<{ id: string; x: number; y: number; color: string }> = [];

      COMMAND_CENTER_MODULES.forEach((m) => {
        let currentAngle = anglesRef.current[m.id] ?? m.baseAngleRad;

        // Si este planeta está siendo arrastrado por el usuario, PAUSAR su órbita
        const isDraggingThis = draggingModuleId === m.id;
        const isHoveringThis = hoveredModuleId === m.id;

        if (!prefersReducedMotion && !isDraggingThis) {
          // Si está en hover, la órbita se desacelera suavemente un 75%
          const speedMultiplier = isHoveringThis ? 0.25 : 1.0;
          currentAngle += m.orbitSpeedRadPerSec * speedMultiplier * dt;
          anglesRef.current[m.id] = currentAngle;
        }

        // Posición elíptica (rx, ry escalados)
        const rx = m.orbitRadiusX * orbitParams.scaleX;
        const ry = m.orbitRadiusY * orbitParams.scaleY;

        const posX = rx * Math.cos(currentAngle);
        const posY = ry * Math.sin(currentAngle);

        positions.push({
          id: m.id,
          x: posX,
          y: posY,
          color: m.accentHex,
        });
      });

      setPlanetPositions(positions);
      animId = requestAnimationFrame(orbitLoop);
    };

    animId = requestAnimationFrame(orbitLoop);
    return () => cancelAnimationFrame(animId);
  }, [orbitParams, hoveredModuleId, draggingModuleId]);

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
  const activeMobileModule = COMMAND_CENTER_MODULES.find((m) => m.id === hoveredModuleId);
  const activeMobileStats = activeMobileModule ? moduleStats[activeMobileModule.id] || [] : [];

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full relative overflow-hidden select-none animate-view-fade min-h-[calc(100vh-4rem)]">
      {/* 1. Canvas Central del Sistema Solar / Command Center */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full flex items-center justify-center min-h-[460px] sm:min-h-[580px] lg:min-h-[680px] overflow-hidden"
      >
        {/* Pistas orbitales elípticas de fondo */}
        <CommandCenterOrbit scaleX={orbitParams.scaleX} scaleY={orbitParams.scaleY} />

        {/* Conexiones holográficas SVG con pulsos de energía */}
        <CommandCenterConnections
          planetPositions={planetPositions}
          hoveredModuleId={hoveredModuleId}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
        />

        {/* Núcleo Central KANBAN//DUO */}
        <CommandCenterCore scale={orbitParams.coreScale} onCoreClick={() => onNavigate('board')} />

        {/* Los 7 Mini-Planetas en sus órbitas */}
        {COMMAND_CENTER_MODULES.map((module) => {
          const pos = planetPositions.find((p) => p.id === module.id) || {
            x: module.orbitRadiusX * orbitParams.scaleX * Math.cos(module.baseAngleRad),
            y: module.orbitRadiusY * orbitParams.scaleY * Math.sin(module.baseAngleRad),
          };

          const isHovered = hoveredModuleId === module.id;
          const stats = moduleStats[module.id] || [];

          // Decidir la posición de la tarjeta contextual (apuntando siempre hacia el centro abierto)
          let positionPref: 'top' | 'bottom' | 'left' | 'right';
          if (pos.x > 35) {
            positionPref = 'left';
          } else if (pos.x < -35) {
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
              size={Math.round(module.planetSizePx * orbitParams.planetScale)}
              isHovered={isHovered}
              onHover={setHoveredModuleId}
              onNavigate={handleNavigateModule}
              onDragStateChange={handleDragStateChange}
              isMobile={orbitParams.isMobile}
              positionPreference={positionPref}
            />
          );
        })}

        {/* Tarjeta HUD Móvil (Dock inferior flotante cuando se selecciona un planeta en móvil) */}
        {orbitParams.isMobile && activeMobileModule && (
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

      {/* 2. Pie de Página HUD Inspiracional */}
      <CommandCenterFooter />
    </div>
  );
};
