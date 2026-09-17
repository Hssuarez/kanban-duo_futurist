'use client';

import React from 'react';
import { Habit, HabitLog, HabitLogStatus } from '@/lib/habitTypes';
import { HabitCell } from './HabitCell';
import {
  MonthDayInfo,
  calculateHabitStreak,
  isHabitScheduledForDay,
  MONTH_NAMES_ES,
} from '@/lib/habitCalculations';
import { Flame, Plus, Settings2 } from 'lucide-react';

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
  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);

  // Mapa rápido de logs del mes por habitId_dateKey
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  const monthName = MONTH_NAMES_ES[month - 1];

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl shadow-sm transition-colors overflow-hidden flex flex-col font-sans">
      {/* Matrix Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-mono">
            Matriz de Hábitos — {monthName} {year}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-mono text-zinc-400 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-white/[0.06]">
            Vista: Mensual
          </span>
          <button
            type="button"
            onClick={onOpenNewHabit}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.5)] flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Nuevo Hábito</span>
          </button>
        </div>
      </div>

      {/* Matrix Table with Local Horizontal Scroll */}
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full border-collapse text-left min-w-[840px]">
          {/* Table Header: Day Numbers and Column Titles */}
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] font-mono text-zinc-400">
              <th className="py-3 px-3 w-10 text-center font-semibold text-zinc-500 sticky left-0 z-20 bg-zinc-950/90 backdrop-blur-md">
                #
              </th>
              <th className="py-3 px-3 min-w-[160px] sm:min-w-[180px] font-semibold text-zinc-300 sticky left-10 z-20 bg-zinc-950/90 backdrop-blur-md">
                HÁBITO
              </th>

              {/* Días del mes (01..31) */}
              {days.map((day) => {
                return (
                  <th
                    key={day.dateKey}
                    className={`py-2 px-1 text-center font-mono font-medium transition-colors select-none ${
                      day.isToday
                        ? 'bg-cyan-950/30 text-cyan-300 ring-1 ring-cyan-500/30 font-bold'
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

              <th className="py-3 px-3 text-center font-semibold text-zinc-300 w-16 sticky right-14 z-20 bg-zinc-950/90 backdrop-blur-md">
                %
              </th>
              <th className="py-3 px-3 text-center font-semibold text-amber-300 w-16 sticky right-0 z-20 bg-zinc-950/90 backdrop-blur-md">
                RACHA
              </th>
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
                    {/* Index Column */}
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-zinc-500 sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                      {index + 1}
                    </td>

                    {/* Habit Title Column (clickable to edit) */}
                    <td
                      onClick={() => onEditHabit(habit)}
                      className="py-2.5 px-3 font-medium text-xs text-white truncate max-w-[180px] sticky left-10 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
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

                    {/* Day Check-in Cells */}
                    {days.map((day) => {
                      const log = logMap.get(`${habit.id}_${day.dateKey}`);
                      const isScheduled = isHabitScheduledForDay(habit, day.dayOfWeek);

                      return (
                        <td
                          key={day.dateKey}
                          className={`py-1 px-1 text-center transition-colors ${
                            day.isToday ? 'bg-cyan-950/15 ring-1 ring-cyan-500/20' : ''
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

                    {/* Percentage Column */}
                    <td className={`py-2.5 px-3 text-center font-mono font-bold text-xs sticky right-14 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors ${pctColor}`}>
                      {percentage}%
                    </td>

                    {/* Streak Column */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-amber-300 sticky right-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                      <div className="inline-flex items-center gap-1">
                        {streak > 0 && (
                          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 animate-pulse" />
                        )}
                        <span>{streak}</span>
                      </div>
                    </td>
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
