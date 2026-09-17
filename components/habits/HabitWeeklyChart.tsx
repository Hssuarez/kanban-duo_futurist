'use client';

import React from 'react';
import { WeekCompliance } from '@/lib/habitTypes';
import { CalendarRange } from 'lucide-react';

interface HabitWeeklyChartProps {
  weeklyData: WeekCompliance[];
}

export const HabitWeeklyChart: React.FC<HabitWeeklyChartProps> = ({ weeklyData }) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Progreso Semanal
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06]">
          Porcentaje
        </span>
      </div>

      <div className="space-y-3.5 flex-1 justify-center flex flex-col">
        {weeklyData.map((week) => {
          let barGradient = 'from-cyan-500 to-teal-400';
          let textColor = 'text-cyan-300';

          if (week.percentage >= 80) {
            barGradient = 'from-emerald-500 to-teal-400';
            textColor = 'text-emerald-300';
          } else if (week.percentage < 50 && week.percentage > 0) {
            barGradient = 'from-rose-500 to-amber-500';
            textColor = 'text-amber-300';
          } else if (week.percentage === 0) {
            barGradient = 'from-zinc-700 to-zinc-800';
            textColor = 'text-zinc-500';
          }

          return (
            <div key={week.weekNumber} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-medium">{week.label}</span>
                <span className={`font-bold ${textColor}`}>{week.percentage}%</span>
              </div>
              <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.05]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: `${Math.max(2, week.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
