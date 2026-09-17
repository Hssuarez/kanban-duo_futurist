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
  Grid,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Navigation,
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
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Detección para móviles
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('focused');
      setHabitColStyle('icon');
      setShowMetrics(false);
    }
  }, []);

  const handleSelectMode = (mode: MatrixViewMode) => {
    setViewMode(mode);
    setShowViewDropdown(false);
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

  const handleScrollToToday = () => {
    const todayDay = days.find((d) => d.isToday);
    if (todayDay) {
      scrollToDay(todayDay.dayNumber);
    }
  };

  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);

  // Mapa rápido de logs
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  const monthName = MONTH_NAMES_ES[month - 1];

  return (
    <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl shadow-sm transition-colors overflow-hidden flex flex-col font-sans">
      {/* 1. Matrix Header matching exact mockup */}
      <div className="flex items-center justify-between p-4 sm:p-4.5 border-b border-white/[0.06]">
        {/* Título de la Matriz */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-mono">
            Matriz de Hábitos — {monthName} {year}
          </h3>
        </div>

        {/* Right Controls: Arrow and Vista: Mensual */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={handleScrollToToday}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
            title="Deslizar a Hoy"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Vista */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowViewDropdown((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-white/[0.1] hover:border-cyan-500/30 text-xs font-mono text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                Vista:{' '}
                {viewMode === 'standard'
                  ? 'Mensual'
                  : viewMode === 'focused'
                  ? 'Enfoque'
                  : 'Calendario'}
              </span>
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            </button>

            {showViewDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#090e1d] border border-cyan-500/30 shadow-2xl p-1 z-30 font-mono text-xs animate-scale-in">
                <button
                  type="button"
                  onClick={() => handleSelectMode('standard')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                    viewMode === 'standard'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Mensual (Completo)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('focused')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === 'focused'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Enfoque Días (Móvil)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('calendar_only')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === 'calendar_only'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Solo Calendario</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Table Container with Horizontal Scroll */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto custom-scrollbar flex-1 relative scroll-smooth"
      >
        <table className="w-full border-collapse text-left min-w-max">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/70 text-[10px] sm:text-[11px] font-mono text-zinc-400">
              {/* # Index Column */}
              {habitColStyle === 'full' && (
                <th className="py-2.5 px-2 w-8 text-center font-semibold text-zinc-500 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  #
                </th>
              )}

              {/* Habit Name Column */}
              {habitColStyle === 'full' && (
                <th className="py-2.5 px-3 min-w-[140px] sm:min-w-[160px] font-semibold text-zinc-300 sticky left-8 z-20 bg-zinc-950/95 backdrop-blur-md">
                  HÁBITO
                </th>
              )}

              {habitColStyle === 'icon' && (
                <th className="py-2.5 px-2 w-10 text-center font-semibold text-zinc-300 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  🎯
                </th>
              )}

              {/* Días del mes (01..30) con corredor vertical continuo para el día actual */}
              {days.map((day) => {
                const isToday = day.isToday;

                return (
                  <th
                    key={day.dateKey}
                    data-day-col={day.dayNumber}
                    className={`py-2 px-1 text-center font-mono font-medium transition-colors select-none min-w-[28px] sm:min-w-[32px] ${
                      isToday
                        ? 'border-x border-cyan-500/60 bg-cyan-950/30 text-cyan-300 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div
                      className={`text-xs inline-flex items-center justify-center mx-auto ${
                        isToday
                          ? 'w-5 h-5 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                          : ''
                      }`}
                    >
                      {String(day.dayNumber).padStart(2, '0')}
                    </div>
                  </th>
                );
              })}

              {/* % Column */}
              {showMetrics && (
                <th className="py-2.5 px-2 text-center font-semibold text-zinc-400 w-12 md:sticky md:right-12 z-20 bg-zinc-950/95 backdrop-blur-md">
                  %
                </th>
              )}

              {/* RACHA Column */}
              {showMetrics && (
                <th className="py-2.5 px-2 text-center font-semibold text-amber-300 w-14 md:sticky md:right-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  RACHA
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {activeHabits.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 4}
                  className="py-12 text-center text-zinc-500 font-mono text-xs"
                >
                  No tienes hábitos activos este mes.{' '}
                  <span
                    onClick={onOpenNewHabit}
                    className="text-cyan-400 underline cursor-pointer hover:text-cyan-300"
                  >
                    + Nuevo Hábito
                  </span>
                </td>
              </tr>
            ) : (
              activeHabits.map((habit, index) => {
                const streak = calculateHabitStreak(habit, logs, todayKey);

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

                let pctColor = 'text-rose-400';
                if (percentage >= 80) pctColor = 'text-emerald-400';
                else if (percentage >= 60) pctColor = 'text-cyan-400';
                else if (percentage >= 50) pctColor = 'text-amber-400';

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-zinc-900/30 transition-colors group"
                  >
                    {/* Index (#) */}
                    {habitColStyle === 'full' && (
                      <td className="py-2 px-2 text-center font-mono text-xs text-zinc-500 sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        {index + 1}
                      </td>
                    )}

                    {/* Hábito Full */}
                    {habitColStyle === 'full' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        className="py-2 px-3 font-medium text-xs text-white truncate max-w-[160px] sticky left-8 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                        title={`${habit.title} · Clic para editar`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{habit.icon}</span>
                          <span className="truncate group-hover:text-cyan-300 transition-colors">
                            {habit.title}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Hábito Icon Only */}
                    {habitColStyle === 'icon' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        className="py-2 px-2 text-center text-sm sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                        title={`${habit.title} · Clic para editar`}
                      >
                        {habit.icon}
                      </td>
                    )}

                    {/* Check-in Cells for each Day */}
                    {days.map((day) => {
                      const log = logMap.get(`${habit.id}_${day.dateKey}`);
                      const isToday = day.isToday;

                      return (
                        <td
                          key={day.dateKey}
                          data-day-col={day.dayNumber}
                          className={`py-1.5 px-0.5 text-center transition-colors ${
                            isToday
                              ? 'border-x border-cyan-500/50 bg-cyan-950/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.06)]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <HabitCell
                              habit={habit}
                              dateKey={day.dateKey}
                              dayNumber={day.dayNumber}
                              status={log?.status}
                              isToday={isToday}
                              isFuture={day.isFuture}
                              onToggle={onToggleCell}
                              onSetStatus={onSetCellStatus}
                            />
                          </div>
                        </td>
                      );
                    })}

                    {/* % Column */}
                    {showMetrics && (
                      <td className="py-2 px-2 text-center font-mono text-xs md:sticky md:right-12 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        <span className={`font-bold ${pctColor}`}>{percentage}%</span>
                      </td>
                    )}

                    {/* RACHA Column */}
                    {showMetrics && (
                      <td className="py-2 px-2 text-center font-mono text-xs md:sticky md:right-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        <span className="font-bold text-amber-300">{streak}</span>
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
