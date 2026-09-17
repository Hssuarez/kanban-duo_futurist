'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Habit, HabitLog, HabitLogStatus } from '@/lib/habitTypes';
import { HabitCell } from './HabitCell';
import {
  MonthDayInfo,
  calculateHabitStreak,
  isHabitScheduledForDay,
  MONTH_NAMES_ES,
} from '@/lib/habitCalculations';
import {
  Flame,
  Plus,
  Settings2,
  Calendar,
  Columns,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface HabitMatrixProps {
  habits: Habit[];
  logs: HabitLog[];
  days: MonthDayInfo[];
  year: number;
  month: number;
  todayKey: string;
  onToggleCell: (habitId: string, dateKey: string) => void;
  onSetCellStatus?: (habitId: string, dateKey: string, status: HabitLogStatus) => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

type MatrixViewMode = 'standard' | 'focused' | 'calendar_only';
type HabitColStyle = 'full' | 'icon' | 'hidden';

export const HabitMatrix: React.FC<HabitMatrixProps> = ({
  habits,
  logs,
  days,
  year,
  month,
  todayKey,
  onToggleCell,
  onSetCellStatus,
  onOpenNewHabit,
  onEditHabit,
}) => {
  const [viewMode, setViewMode] = useState<MatrixViewMode>('standard');
  const [habitColStyle, setHabitColStyle] = useState<HabitColStyle>('full');
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [activeTooltipHabit, setActiveTooltipHabit] = useState<string | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Detección automática para iniciar en modo 'focused' en pantallas móviles
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('focused');
      setHabitColStyle('icon');
      setShowMetrics(false);
    }
  }, []);

  // Cambiar entre modos predefinidos
  const handleSelectMode = (mode: MatrixViewMode) => {
    setViewMode(mode);
    if (mode === 'standard') {
      setHabitColStyle('full');
      setShowMetrics(true);
    } else if (mode === 'focused') {
      setHabitColStyle('icon');
      setShowMetrics(false);
    } else if (mode === 'calendar_only') {
      setHabitColStyle('hidden');
      setShowMetrics(false);
    }
  };

  // Alternar el estilo de la columna de Hábito
  const handleToggleHabitColumn = () => {
    if (habitColStyle === 'full') {
      setHabitColStyle('icon');
      setViewMode('focused');
    } else if (habitColStyle === 'icon') {
      setHabitColStyle('hidden');
      setViewMode('calendar_only');
    } else {
      setHabitColStyle('full');
      setViewMode('standard');
    }
  };

  // Alternar columnas de métricas (% y Racha)
  const handleToggleMetrics = () => {
    setShowMetrics((prev) => !prev);
  };

  // Desplazamiento horizontal automático hacia un día específico
  const scrollToDay = (dayNum: number) => {
    if (!tableContainerRef.current) return;
    const dayElement = tableContainerRef.current.querySelector(
      `[data-day-col="${dayNum}"]`
    ) as HTMLElement | null;

    if (dayElement) {
      const containerLeft = tableContainerRef.current.getBoundingClientRect().left;
      const elementLeft = dayElement.getBoundingClientRect().left;
      const scrollOffset = elementLeft - containerLeft + tableContainerRef.current.scrollLeft - 80;
      tableContainerRef.current.scrollTo({
        left: Math.max(0, scrollOffset),
        behavior: 'smooth',
      });
    }
  };

  // Ir al día de hoy
  const handleScrollToToday = () => {
    const todayDay = days.find((d) => d.isToday);
    if (todayDay) {
      scrollToDay(todayDay.dayNumber);
    }
  };

  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);

  // Mapa rápido de logs del mes por habitId_dateKey
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  const monthName = MONTH_NAMES_ES[month - 1];

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl shadow-sm transition-colors overflow-hidden flex flex-col font-sans">
      {/* 1. Matrix Header Controls */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-mono">
              Matriz de Hábitos — {monthName} {year}
            </h3>
          </div>

          {/* Quick Action: New Habit */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onOpenNewHabit}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.5)] flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Hábito</span>
            </button>
          </div>
        </div>

        {/* 2. Responsive View Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
          {/* Preset View Modes */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleSelectMode('standard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'standard'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Mostrar todo: Hábitos, Días y Métricas"
            >
              Completo
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('focused')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'focused'
                  ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Colapsa Hábito a solo icono y oculta Racha/% para ver más días en móvil"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Enfoque Días (Móvil)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('calendar_only')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'calendar_only'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Oculta izquierda y derecha: 100% de la pantalla para el calendario"
            >
              <Calendar className="w-3 h-3" />
              <span>Solo Calendario</span>
            </button>
          </div>

          {/* Quick Individual Toggles */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {/* Toggle Hábito Column */}
            <button
              type="button"
              onClick={handleToggleHabitColumn}
              className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                habitColStyle === 'full'
                  ? 'bg-zinc-900 border-white/[0.08] text-zinc-300'
                  : habitColStyle === 'icon'
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-zinc-950 border-white/[0.06] text-zinc-500 line-through'
              }`}
              title="Alternar columna de hábitos: Completo / Solo Icono / Ocultar"
            >
              <Columns className="w-3 h-3" />
              <span>
                Hábito:{' '}
                {habitColStyle === 'full'
                  ? 'Nombre'
                  : habitColStyle === 'icon'
                  ? 'Solo Icono'
                  : 'Oculto'}
              </span>
            </button>

            {/* Toggle Metrics Column (% & Racha) */}
            <button
              type="button"
              onClick={handleToggleMetrics}
              className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                showMetrics
                  ? 'bg-zinc-900 border-white/[0.08] text-amber-300'
                  : 'bg-zinc-950 border-white/[0.06] text-zinc-500 line-through'
              }`}
              title="Mostrar u ocultar columnas de Porcentaje y Racha"
            >
              {showMetrics ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Racha / %</span>
            </button>
          </div>
        </div>

        {/* 3. Mobile Day Navigation Shortcut Bar */}
        <div className="flex items-center justify-between gap-1.5 pt-1 overflow-x-auto custom-scrollbar text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-zinc-500 hidden sm:inline">Saltar a:</span>
            <button
              type="button"
              onClick={handleScrollToToday}
              className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToDay(1)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              Días 1-7
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(8)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              8-14
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(15)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              15-21
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(22)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              22-28
            </button>
            {days.length > 28 && (
              <button
                type="button"
                onClick={() => scrollToDay(29)}
                className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
              >
                29-{days.length}
              </button>
            )}
          </div>

          <span className="text-[10px] text-zinc-500 hidden lg:inline">
            Desliza horizontalmente para navegar por todos los días del mes
          </span>
        </div>
      </div>

      {/* 4. Matrix Table with Local Horizontal Scroll */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto custom-scrollbar flex-1 relative scroll-smooth"
      >
        <table className="w-full border-collapse text-left min-w-max">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] font-mono text-zinc-400">
              {/* Left Column: Index (#) - Only in 'full' mode */}
              {habitColStyle === 'full' && (
                <th className="py-3 px-2 w-8 text-center font-semibold text-zinc-500 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  #
                </th>
              )}

              {/* Left Column: Habit (Full vs Icon vs Hidden) */}
              {habitColStyle === 'full' && (
                <th className="py-3 px-3 min-w-[150px] sm:min-w-[170px] font-semibold text-zinc-300 sticky left-8 z-20 bg-zinc-950/95 backdrop-blur-md">
                  HÁBITO
                </th>
              )}

              {habitColStyle === 'icon' && (
                <th
                  className="py-3 px-2 w-12 text-center font-semibold text-zinc-300 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md"
                  title="Hábitos (solo icono para despejar el calendario)"
                >
                  🎯
                </th>
              )}

              {/* Días del mes (01..31) */}
              {days.map((day) => {
                return (
                  <th
                    key={day.dateKey}
                    data-day-col={day.dayNumber}
                    className={`py-2 px-1 text-center font-mono font-medium transition-colors select-none min-w-[32px] sm:min-w-[35px] ${
                      day.isToday
                        ? 'bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'hover:bg-zinc-900/40 text-zinc-400'
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-tighter text-zinc-500 mb-0.5">
                      {day.dayName.slice(0, 1)}
                    </div>
                    <div
                      className={`text-xs inline-flex items-center justify-center ${
                        day.isToday
                          ? 'w-5 h-5 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                          : ''
                      }`}
                    >
                      {String(day.dayNumber).padStart(2, '0')}
                    </div>
                  </th>
                );
              })}

              {/* Right Column: % (Visible only if showMetrics is true) */}
              {showMetrics && (
                <th className="py-3 px-2 text-center font-semibold text-zinc-300 w-14 md:sticky md:right-14 z-20 bg-zinc-950/95 backdrop-blur-md">
                  %
                </th>
              )}

              {/* Right Column: RACHA (Visible only if showMetrics is true) */}
              {showMetrics && (
                <th className="py-3 px-2 text-center font-semibold text-amber-300 w-14 md:sticky md:right-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  RACHA
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body: Habit Rows */}
          <tbody className="divide-y divide-white/[0.04]">
            {activeHabits.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 4}
                  className="py-12 text-center text-zinc-500 font-mono text-xs"
                >
                  No tienes hábitos activos este mes. Haz clic en{' '}
                  <span
                    onClick={onOpenNewHabit}
                    className="text-cyan-400 underline cursor-pointer hover:text-cyan-300"
                  >
                    + Nuevo Hábito
                  </span>{' '}
                  para comenzar.
                </td>
              </tr>
            ) : (
              activeHabits.map((habit, index) => {
                // Cálculo de racha
                const streak = calculateHabitStreak(habit, logs, todayKey);

                // Cálculo de porcentaje de cumplimiento en el mes
                let expectedDays = 0;
                let completedDays = 0;

                days.forEach((d) => {
                  if (d.isPastOrToday && isHabitScheduledForDay(habit, d.dayOfWeek)) {
                    expectedDays++;
                    const log = logMap.get(`${habit.id}_${d.dateKey}`);
                    if (log?.status === 'completed') completedDays++;
                  }
                });

                const percentage =
                  expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

                // Color del porcentaje
                let pctColor = 'text-rose-400';
                if (percentage >= 80) pctColor = 'text-emerald-400';
                else if (percentage >= 60) pctColor = 'text-cyan-400';
                else if (percentage >= 40) pctColor = 'text-amber-400';

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-zinc-900/30 transition-colors group"
                  >
                    {/* Index Column (#) - Only in 'full' mode */}
                    {habitColStyle === 'full' && (
                      <td className="py-2.5 px-2 text-center font-mono text-xs text-zinc-500 sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        {index + 1}
                      </td>
                    )}

                    {/* Habit Column: FULL */}
                    {habitColStyle === 'full' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        className="py-2.5 px-3 font-medium text-xs text-white truncate max-w-[170px] sticky left-8 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                        title={`${habit.title} · Clic para editar`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{habit.icon}</span>
                          <span className="truncate group-hover:text-cyan-300 transition-colors">
                            {habit.title}
                          </span>
                          <Settings2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto" />
                        </div>
                      </td>
                    )}

                    {/* Habit Column: ICON ONLY (Compact for Mobile) */}
                    {habitColStyle === 'icon' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        onMouseEnter={() => setActiveTooltipHabit(habit.id)}
                        onMouseLeave={() => setActiveTooltipHabit(null)}
                        className="py-2 px-2 text-center sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer relative"
                        title={`${habit.title} (${percentage}% · Racha: ${streak})`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-white/[0.08] hover:border-cyan-500/50 flex items-center justify-center text-lg mx-auto shadow-sm">
                          {habit.icon}
                        </div>

                        {/* Floating Tooltip preview on hover */}
                        {activeTooltipHabit === habit.id && (
                          <div className="absolute left-11 top-1/2 -translate-y-1/2 z-30 bg-zinc-950 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-white shadow-xl whitespace-nowrap animate-fade-in pointer-events-none">
                            <span className="font-semibold text-cyan-300">{habit.title}</span>
                            <span className="text-zinc-500 ml-1">· {percentage}%</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Day Check-in Cells (01..31) */}
                    {days.map((day) => {
                      const log = logMap.get(`${habit.id}_${day.dateKey}`);
                      const isScheduled = isHabitScheduledForDay(habit, day.dayOfWeek);

                      return (
                        <td
                          key={day.dateKey}
                          data-day-col={day.dayNumber}
                          className={`py-1 px-0.5 sm:px-1 text-center transition-colors min-w-[32px] sm:min-w-[35px] ${
                            day.isToday ? 'bg-cyan-950/20 ring-1 ring-cyan-500/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <HabitCell
                              habit={habit}
                              dateKey={day.dateKey}
                              dayNumber={day.dayNumber}
                              status={
                                log ? log.status : !isScheduled ? 'not_applicable' : undefined
                              }
                              isToday={day.isToday}
                              isFuture={day.isFuture}
                              onToggle={onToggleCell}
                              onSetStatus={onSetCellStatus}
                            />
                          </div>
                        </td>
                      );
                    })}

                    {/* Right Column: % */}
                    {showMetrics && (
                      <td
                        className={`py-2.5 px-2 text-center font-mono font-bold text-xs md:sticky md:right-14 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors ${pctColor}`}
                      >
                        {percentage}%
                      </td>
                    )}

                    {/* Right Column: RACHA */}
                    {showMetrics && (
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-xs text-amber-300 md:sticky md:right-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        <div className="inline-flex items-center gap-0.5 justify-center">
                          {streak > 0 && (
                            <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30 animate-pulse" />
                          )}
                          <span>{streak}</span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
