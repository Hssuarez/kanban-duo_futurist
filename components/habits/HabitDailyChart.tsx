'use client';

import React, { useState, useMemo } from 'react';
import { Habit, HabitLog, DayCompliance } from '@/lib/habitTypes';
import { MONTH_NAMES_ES } from '@/lib/habitCalculations';
import {
  CheckCircle2,
  BarChart3,
  Calendar as CalendarIcon,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

interface HabitDailyChartProps {
  dailyData: DayCompliance[];
  totalHabits?: number;
  habits?: Habit[];
  logs?: HabitLog[];
  month?: number;
}

export const HabitDailyChart: React.FC<HabitDailyChartProps> = ({
  dailyData,
  totalHabits = 8,
  habits = [],
  logs = [],
  month = 9,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [hoveredDayNumber, setHoveredDayNumber] = useState<number | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => h.isActive && !h.isArchived), [habits]);

  // Log map para filtros específicos por hábito
  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    logs.forEach((l) => map.set(`${l.habitId}_${l.dateKey}`, l));
    return map;
  }, [logs]);

  // Datos filtrados según el hábito seleccionado
  const computedData = useMemo(() => {
    if (selectedHabitId === 'all') {
      return dailyData;
    }
    const habit = activeHabits.find((h) => h.id === selectedHabitId);
    if (!habit) return dailyData;

    return dailyData.map((d) => {
      const log = logMap.get(`${habit.id}_${d.dateKey}`);
      const isCompleted = log?.status === 'completed';
      return {
        ...d,
        completedCount: isCompleted ? 1 : 0,
        totalCount: 1,
        percentage: isCompleted ? 100 : 0,
      };
    });
  }, [dailyData, selectedHabitId, activeHabits, logMap]);

  // Máximo para el eje Y
  const maxVal = useMemo(() => {
    if (selectedHabitId !== 'all') return 1;
    const maxData = Math.max(...computedData.map((d) => d.completedCount), 0);
    return Math.max(10, totalHabits, maxData);
  }, [computedData, selectedHabitId, totalHabits]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    if (selectedHabitId !== 'all') {
      return [1, 0];
    }
    const step = Math.ceil(maxVal / 5);
    return [step * 5, step * 4, step * 3, step * 2, step * 1, 0];
  }, [maxVal, selectedHabitId]);

  // Día activo (hover o por defecto Hoy)
  const todayDay = useMemo(() => computedData.find((d) => d.isToday), [computedData]);
  const activeDayNumber = hoveredDayNumber ?? todayDay?.dayNumber ?? computedData[0]?.dayNumber ?? 1;
  const activeDay = useMemo(
    () => computedData.find((d) => d.dayNumber === activeDayNumber) || computedData[0],
    [computedData, activeDayNumber]
  );

  // Dimensiones del canvas SVG
  const svgWidth = 1000;
  const svgHeight = 220;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 25;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Mapear cada día a coordenadas (x, y)
  const points = useMemo(() => {
    const totalDays = computedData.length;
    if (totalDays === 0) return [];

    return computedData.map((d, index) => {
      const x = paddingLeft + (index / (totalDays - 1 || 1)) * plotWidth;
      const count = d.isFuture ? 0 : d.completedCount;
      const yFraction = maxVal > 0 ? count / maxVal : 0;
      // Invertir Y (SVG 0 está arriba)
      const y = paddingTop + plotHeight - yFraction * plotHeight;
      return { x, y, day: d };
    });
  }, [computedData, maxVal, paddingLeft, paddingRight, paddingTop, plotWidth, plotHeight]);

  // Generador de curva Spline suave (Catmull-Rom to Cubic Bezier)
  const splinePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    const tension = 0.22;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [points]);

  // Área sombreada bajo la curva
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    const bottomY = paddingTop + plotHeight;
    return `${splinePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [splinePath, points, paddingTop, plotHeight]);

  // Punto del día activo
  const activePoint = useMemo(() => {
    return points.find((p) => p.day.dayNumber === activeDayNumber) || points[0];
  }, [points, activeDayNumber]);

  // Porcentaje X para posicionar el Tooltip flotante en el contenedor
  const tooltipLeftPct = useMemo(() => {
    if (!activePoint) return 50;
    return (activePoint.x / svgWidth) * 100;
  }, [activePoint, svgWidth]);

  const monthNameShort = MONTH_NAMES_ES[month - 1] ? MONTH_NAMES_ES[month - 1].slice(0, 3) : '';

  return (
    <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans relative">
      {/* 1. Header con Filtros por Hábito */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-2 border-b border-white/[0.06]">
        {/* Título */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-cyan-400 uppercase font-mono tracking-wider">
            Progreso Diario del Mes
          </h4>
        </div>

        {/* Controles y Píldoras de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown Todos los Hábitos */}
          <div className="relative">
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="text-xs font-mono bg-zinc-950 text-cyan-300 border border-white/[0.1] hover:border-cyan-500/30 rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none flex items-center gap-1"
            >
              <option value="all">Todos los hábitos (Total)</option>
              {activeHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Filter Pills */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedHabitId('all')}
              className={`px-3 py-1 text-xs font-medium rounded-xl transition-all ${
                selectedHabitId === 'all'
                  ? 'bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Todos
            </button>

            {activeHabits.slice(0, 3).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedHabitId === h.id
                    ? 'bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{h.icon}</span>
                <span className="truncate max-w-[80px]">{h.title}</span>
              </button>
            ))}

            {activeHabits.length > 3 && (
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (activeHabits.findIndex((h) => h.id === selectedHabitId) + 1) % activeHabits.length;
                  setSelectedHabitId(activeHabits[nextIdx]?.id || 'all');
                }}
                className="px-2 py-1 text-xs font-mono rounded-xl bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/[0.06]"
              >
                +{activeHabits.length - 3}
              </button>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2">
            <button
              type="button"
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
              title="Calendario"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
              title="Más opciones"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Área del Gráfico Spline con Ejes */}
      <div className="flex items-stretch gap-2 pt-2 relative">
        {/* Y-Axis Rotated Label & Ticks */}
        <div className="flex items-center gap-1 select-none shrink-0">
          {/* Rotated Axis Title */}
          <span className="-rotate-90 text-[9px] font-mono uppercase tracking-widest text-zinc-500 whitespace-nowrap -ml-7 w-4 text-center">
            Check-ins completados
          </span>

          {/* Numeric Ticks */}
          <div className="flex flex-col justify-between items-end h-44 text-[10px] font-mono text-zinc-500 pr-1 w-6">
            {yTicks.map((tick, i) => (
              <span key={i} className="leading-none">
                {tick}
              </span>
            ))}
          </div>
        </div>

        {/* SVG Plot Container */}
        <div className="flex-1 relative h-48 sm:h-52">
          {/* Floating Tooltip HUD Card positioned dynamically over active/hovered point */}
          {activePoint && (
            <div
              className="absolute pointer-events-none transition-all duration-150 z-30"
              style={{
                left: `${tooltipLeftPct}%`,
                top: `${Math.max(10, (activePoint.y / svgHeight) * 100 - 32)}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-[#050914]/95 backdrop-blur-md border border-cyan-500/50 rounded-xl px-3 py-1.5 shadow-[0_0_18px_rgba(6,182,212,0.35)] text-center whitespace-nowrap">
                <div className="text-[10px] font-mono text-zinc-400">
                  {activeDay.dayName} {activeDay.dayNumber} {monthNameShort}
                </div>
                <div className="text-xs font-bold font-mono text-white mt-0.5">
                  {activeDay.completedCount} check-ins
                </div>
                <div className="text-[10px] font-mono text-amber-400 font-semibold">
                  {activeDay.percentage}% del total
                </div>
              </div>
            </div>
          )}

          {/* SVG Vector Graphic */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Gradient for area fill under curve */}
              <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter for neon cyan line */}
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Horizontal Grid Lines */}
            {yTicks.map((_, i) => {
              const yPos = paddingTop + (i / (yTicks.length - 1 || 1)) * plotHeight;
              return (
                <line
                  key={i}
                  x1={paddingLeft}
                  y1={yPos}
                  x2={svgWidth - paddingRight}
                  y2={yPos}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray={i === yTicks.length - 1 ? '0' : '4 4'}
                  strokeWidth="1"
                />
              );
            })}

            {/* Vertical dashed line for active/hovered day */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={activePoint.y}
                x2={activePoint.x}
                y2={paddingTop + plotHeight}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="transition-all duration-150"
              />
            )}

            {/* Shaded Area Under Spline */}
            {areaPath && (
              <path d={areaPath} fill="url(#splineGradient)" className="transition-all duration-300" />
            )}

            {/* Spline Glowing Stroke Line */}
            {splinePath && (
              <path
                d={splinePath}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
                className="transition-all duration-300"
              />
            )}

            {/* Circular Data Dots on Curve */}
            {points.map((p) => {
              const isActive = p.day.dayNumber === activeDayNumber;
              return (
                <g key={p.day.dateKey}>
                  {/* Invisible broad hover target */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDayNumber(p.day.dayNumber)}
                  />

                  {/* Active Point Halo */}
                  {isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill="#06b6d4"
                      fillOpacity="0.35"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  )}

                  {/* Dot Point */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? '4' : '2.5'}
                    fill={isActive ? '#ffffff' : '#22d3ee'}
                    stroke="#06b6d4"
                    strokeWidth={isActive ? '2' : '1'}
                    className="transition-all duration-150 pointer-events-none"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. Eje X con Números de Días (1..30) y Resaltado de Hoy */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] select-none">
        {/* Espaciador del eje Y izquierdo */}
        <div className="w-10 sm:w-11 shrink-0" />

        {/* Fila de números de días interactivos */}
        <div className="flex-1 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-zinc-500">
          {computedData.map((d) => {
            const isToday = d.isToday;
            const isActive = d.dayNumber === activeDayNumber;

            return (
              <button
                key={d.dateKey}
                type="button"
                onClick={() => setHoveredDayNumber(d.dayNumber)}
                onMouseEnter={() => setHoveredDayNumber(d.dayNumber)}
                className={`flex-1 text-center py-0.5 transition-all rounded ${
                  isToday
                    ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : isActive
                    ? 'text-white font-bold'
                    : 'hover:text-zinc-300'
                }`}
              >
                {d.dayNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
