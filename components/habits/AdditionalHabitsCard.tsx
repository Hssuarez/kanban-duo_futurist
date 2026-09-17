'use client';

import React from 'react';
import { Habit } from '@/lib/habitTypes';
import { Sparkles, Plus, Check } from 'lucide-react';

interface AdditionalHabitsCardProps {
  inactiveHabits: Habit[];
  onActivateHabit: (habitId: string) => void;
  onOpenNewHabit: () => void;
}

export const AdditionalHabitsCard: React.FC<AdditionalHabitsCardProps> = ({
  inactiveHabits,
  onActivateHabit,
  onOpenNewHabit,
}) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Hábitos Adicionales
          </h4>
        </div>
        <button
          type="button"
          onClick={onOpenNewHabit}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar</span>
        </button>
      </div>

      {inactiveHabits.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">
          Todos tus hábitos están activos en la matriz.{' '}
          <span
            onClick={onOpenNewHabit}
            className="text-cyan-400 underline cursor-pointer hover:text-cyan-300"
          >
            Crear otro
          </span>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[260px]">
          {inactiveHabits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between p-2 rounded-xl border border-white/[0.05] bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-base shrink-0">{habit.icon}</span>
                <span className="text-xs font-medium text-zinc-300 truncate" title={habit.title}>
                  {habit.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onActivateHabit(habit.id)}
                className="text-[10px] font-mono text-cyan-400 hover:text-zinc-950 bg-cyan-950/40 hover:bg-cyan-400 border border-cyan-500/30 px-2 py-1 rounded-lg transition-all active:scale-95 shrink-0"
                title="Activar en la matriz"
              >
                + Activar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
