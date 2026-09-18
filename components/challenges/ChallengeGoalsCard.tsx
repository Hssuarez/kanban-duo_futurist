'use client';

import React from 'react';
import { ChallengeGoal } from '@/lib/challengeTypes';
import { Flag, Plus, Check, Pencil, Trash2 } from 'lucide-react';

interface ChallengeGoalsCardProps {
  goals: ChallengeGoal[];
  onToggleGoal: (goalId: string) => void;
  onOpenNewGoal: () => void;
  onEditGoal?: (goal: ChallengeGoal) => void;
  onDeleteGoal?: (goalId: string) => void;
}

export const ChallengeGoalsCard: React.FC<ChallengeGoalsCardProps> = ({
  goals,
  onToggleGoal,
  onOpenNewGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Objetivos del Reto
          </h4>
        </div>

        <button
          type="button"
          onClick={onOpenNewGoal}
          className="text-xs font-mono font-medium text-cyan-300 hover:text-white flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer active:scale-95"
        >
          <Plus className="w-3 h-3" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56 custom-scrollbar">
        {goals.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl border border-dashed border-white/[0.08] bg-zinc-950/20">
            <Flag className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
            <p className="text-xs text-zinc-400 font-mono">No hay objetivos definidos</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Haz clic en &ldquo;Agregar&rdquo; para crear metas cuantificables.
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const isDone = goal.isCompleted || goal.currentValue >= goal.targetValue;
            const progressPct =
              goal.targetValue > 0
                ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                : 0;

            return (
              <div
                key={goal.id}
                className="p-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/50 border border-white/[0.04] transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleGoal(goal.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isDone
                          ? 'bg-cyan-500 border-cyan-400 text-zinc-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          : 'border-white/[0.2] hover:border-cyan-400 bg-zinc-900'
                      }`}
                      title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <span
                      className={`text-xs truncate font-medium ${
                        isDone ? 'text-zinc-500 line-through' : 'text-zinc-200'
                      }`}
                    >
                      {goal.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-cyan-300">
                      {goal.unit === '%'
                        ? `${goal.currentValue}%`
                        : `${goal.currentValue} / ${goal.targetValue} ${goal.unit || ''}`}
                    </span>

                    {onEditGoal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGoal(goal);
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Personalizar objetivo"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}

                    {onDeleteGoal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Eliminar objetivo "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar objetivo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

