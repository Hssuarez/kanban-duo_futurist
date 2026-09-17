'use client';

import React from 'react';
import { HabitConsistencyRank } from '@/lib/habitTypes';
import { Trophy, X } from 'lucide-react';

interface HabitTopListProps {
  ranks: HabitConsistencyRank[];
  onClose?: () => void;
}

export const HabitTopList: React.FC<HabitTopListProps> = ({ ranks, onClose }) => {
  const top10 = ranks.slice(0, 10);

  return (
    <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-4.5 shadow-sm transition-colors flex flex-col font-sans h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Top 10 Hábitos más Consistentes
          </h4>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {top10.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">
          No hay datos de hábitos suficientes para calcular el ranking.
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
          {top10.map((item, idx) => {
            // Gradientes y brillos según porcentaje
            let barGradient = 'from-cyan-400 to-cyan-300';
            let barGlow = 'shadow-[0_0_10px_rgba(6,182,212,0.5)]';
            let textColor = 'text-cyan-300';

            if (item.percentage < 50) {
              barGradient = 'from-rose-500 to-red-400';
              barGlow = 'shadow-[0_0_8px_rgba(244,63,94,0.4)]';
              textColor = 'text-rose-400';
            } else if (item.percentage < 65) {
              barGradient = 'from-orange-400 to-amber-500';
              barGlow = 'shadow-[0_0_8px_rgba(249,115,22,0.4)]';
              textColor = 'text-orange-400';
            } else if (item.percentage < 80) {
              barGradient = 'from-amber-400 to-yellow-300';
              barGlow = 'shadow-[0_0_8px_rgba(251,191,36,0.4)]';
              textColor = 'text-amber-300';
            } else if (item.percentage < 85) {
              barGradient = 'from-teal-400 to-cyan-400';
              barGlow = 'shadow-[0_0_10px_rgba(45,212,191,0.5)]';
              textColor = 'text-teal-300';
            }

            return (
              <div
                key={item.habit.id}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-900/40 transition-colors"
              >
                {/* Ranking Index Badge */}
                <div className="w-5 h-5 rounded-md border border-white/[0.1] bg-zinc-950/80 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-300 shrink-0">
                  {idx + 1}
                </div>

                {/* Habit Title & Icon */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm shrink-0">{item.habit.icon}</span>
                  <span
                    className="text-xs font-medium text-white truncate"
                    title={item.habit.title}
                  >
                    {item.habit.title}
                  </span>
                </div>

                {/* Glowing Capsule Progress Bar & % */}
                <div className="flex items-center gap-2 shrink-0 w-28 sm:w-32">
                  <div className="flex-1 h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} ${barGlow} transition-all duration-500`}
                      style={{ width: `${Math.max(8, item.percentage)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold w-8 text-right shrink-0 ${textColor}`}>
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
