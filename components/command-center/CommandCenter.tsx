'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Task, AppView } from '@/lib/types';
import {
  COMMAND_CENTER_MODULES,
  CommandCenterModuleConfig,
  ModuleStatItem,
} from './commandCenterConfig';
import { CommandCenterOrbit } from './CommandCenterOrbit';
import { CommandCenterConnections } from './CommandCenterConnections';
import { CommandCenterPlanet } from './CommandCenterPlanet';
import { CommandCenterModuleCard } from './CommandCenterModuleCard';
import { CommandCenterCore } from './CommandCenterCore';
import { CommandCenterFooter } from './CommandCenterFooter';

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
  const [scale, setScale] = useState<number>(1);
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

    // Escala dimensional suave para que nunca se desborde el viewport
    if (w >= 1280) {
      setScale(1.0);
    } else if (w >= 1024) {
      setScale(0.85);
    } else if (w >= 768) {
      setScale(0.72);
    } else if (w >= 480) {
      setScale(0.55);
    } else {
      setScale(0.46);
    }
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
        const rx = m.orbitRadiusX * scale;
        const ry = m.orbitRadiusY * scale;

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
  }, [scale, hoveredModuleId, draggingModuleId]);

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

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full relative overflow-hidden select-none animate-view-fade min-h-[calc(100vh-4rem)]">
      {/* 1. Canvas Central del Sistema Solar / Command Center */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full flex items-center justify-center min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] overflow-visible"
      >
        {/* Pistas orbitales elípticas de fondo */}
        <CommandCenterOrbit scale={scale} />

        {/* Conexiones holográficas SVG con pulsos de energía */}
        <CommandCenterConnections
          planetPositions={planetPositions}
          hoveredModuleId={hoveredModuleId}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
        />

        {/* Núcleo Central KANBAN//DUO */}
        <CommandCenterCore scale={scale} onCoreClick={() => onNavigate('board')} />

        {/* Los 7 Mini-Planetas en sus órbitas */}
        {COMMAND_CENTER_MODULES.map((module) => {
          const pos = planetPositions.find((p) => p.id === module.id) || {
            x: module.orbitRadiusX * scale * Math.cos(module.baseAngleRad),
            y: module.orbitRadiusY * scale * Math.sin(module.baseAngleRad),
          };

          const isHovered = hoveredModuleId === module.id;
          const stats = moduleStats[module.id] || [];

          // Decidir la posición de la tarjeta contextual (izquierda o derecha según hemisferio)
          const positionPref = pos.x >= 0 ? 'right' : 'left';

          return (
            <React.Fragment key={module.id}>
              {/* Planeta 3D con rotación axial independiente y órbita separada */}
              <CommandCenterPlanet
                module={module}
                stats={stats}
                x={pos.x}
                y={pos.y}
                isHovered={isHovered}
                onHover={setHoveredModuleId}
                onNavigate={handleNavigateModule}
                onDragStateChange={handleDragStateChange}
              />

              {/* Tarjeta Contextual con KPIs Reales */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                  zIndex: isHovered ? 50 : 10,
                }}
              >
                <CommandCenterModuleCard
                  module={module}
                  stats={stats}
                  isHovered={isHovered}
                  onNavigate={() => handleNavigateModule(module)}
                  positionPreference={positionPref}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 2. Pie de Página HUD Inspiracional */}
      <CommandCenterFooter />
    </div>
  );
};
