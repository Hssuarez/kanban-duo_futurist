'use client';

import React from 'react';
import { Goal } from '@/lib/habitTypes';
import { Target, Plus, Check, Trash2 } from 'lucide-react';

interface HabitGoalsCardProps {
  goals: Goal[];
  onToggleGoal: (goalId: string) => void;
  onOpenNewGoal: () => void;
  onDeleteGoal?: (goalId: string) => void;
}

export const HabitGoalsCard: React.FC<HabitGoalsCardProps> = ({
  goals,
  onToggleGoal,
  onOpenNewGoal,
  onDeleteGoal,
}) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Objetivos del Mes en Curso
          </h4>
        </div>
        <button
          type="button"
          onClick={onOpenNewGoal}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo objetivo</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">
          No hay objetivos registrados este mes.{' '}
          <span
            onClick={onOpenNewGoal}
            className="text-cyan-400 underline cursor-pointer hover:text-cyan-300"
          >
            Crear el primero
          </span>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[260px]">
          {goals.map((goal) => {
            return (
              <div
                key={goal.id}
                onClick={() => onToggleGoal(goal.id)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer group select-none ${
                  goal.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                    : 'bg-zinc-900/40 border-white/[0.06] text-zinc-200 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      goal.isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                        : 'border-zinc-600 group-hover:border-cyan-400'
                    }`}
                  >
                    {goal.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      goal.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'
                    }`}
                  >
                    {goal.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold px-2 py-0.5 rounded bg-black/40 border border-white/5">
                    {goal.currentValue}/{goal.targetValue}
                  </span>

                  {onDeleteGoal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGoal(goal.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-rose-400 transition-opacity"
                      title="Eliminar objetivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
