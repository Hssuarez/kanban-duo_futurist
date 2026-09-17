'use client';

import React from 'react';
import { HabitConsistencyRank } from '@/lib/habitTypes';
import { Trophy } from 'lucide-react';

interface HabitTopListProps {
  ranks: HabitConsistencyRank[];
}

export const HabitTopList: React.FC<HabitTopListProps> = ({ ranks }) => {
  const top10 = ranks.slice(0, 10);

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Top 10 Hábitos más Consistentes
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">Clasificación Personal</span>
      </div>

      {top10.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">
          No hay datos de hábitos suficientes para calcular el ranking.
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[380px]">
          {top10.map((item, idx) => {
            let barGradient = 'from-emerald-500 to-teal-400';
            let textColor = 'text-emerald-300';

            if (item.percentage < 50) {
              barGradient = 'from-rose-500 to-red-400';
              textColor = 'text-rose-300';
            } else if (item.percentage < 70) {
              barGradient = 'from-amber-500 to-orange-400';
              textColor = 'text-amber-300';
            } else if (item.percentage < 85) {
              barGradient = 'from-cyan-500 to-blue-400';
              textColor = 'text-cyan-300';
            }

            return (
              <div
                key={item.habit.id}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/40 transition-colors"
              >
                {/* Ranking Index */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : idx === 1
                      ? 'bg-zinc-300 text-zinc-950'
                      : idx === 2
                      ? 'bg-amber-700/80 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Habit Title & Icon */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm shrink-0">{item.habit.icon}</span>
                  <span className="text-xs font-medium text-zinc-200 truncate" title={item.habit.title}>
                    {item.habit.title}
                  </span>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="flex items-center gap-2 shrink-0 w-32 sm:w-36">
                  <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold w-9 text-right ${textColor}`}>
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
