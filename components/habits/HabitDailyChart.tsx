'use client';

import React, { useState } from 'react';
import { DayCompliance } from '@/lib/habitTypes';
import { BarChart3 } from 'lucide-react';

interface HabitDailyChartProps {
  dailyData: DayCompliance[];
}

export const HabitDailyChart: React.FC<HabitDailyChartProps> = ({ dailyData }) => {
  const [hoveredDay, setHoveredDay] = useState<DayCompliance | null>(null);

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans relative">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Progreso Diario del Mes
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06]">
          Porcentaje
        </span>
      </div>

      {/* Interactive Tooltip Display */}
      <div className="h-6 flex items-center mb-2">
        {hoveredDay ? (
          <div className="inline-flex items-center gap-2 text-xs font-mono animate-fade-in">
            <span className="text-zinc-300 font-semibold">{hoveredDay.dateKey} ({hoveredDay.dayName})</span>
            <span className="text-cyan-400 font-bold">{hoveredDay.percentage}%</span>
            <span className="text-zinc-500 text-[10px]">
              ({hoveredDay.completedCount}/{hoveredDay.totalCount} hábitos)
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500">
            Pasa el cursor sobre un día para inspeccionar el rendimiento diario.
          </div>
        )}
      </div>

      {/* Bars Container */}
      <div className="flex items-end gap-1 sm:gap-1.5 h-36 pt-2 pb-1 border-b border-white/[0.06] overflow-x-auto custom-scrollbar">
        {dailyData.map((day) => {
          const heightPct = Math.max(4, day.percentage); // Mínimo 4% para visibilidad
          const isHovered = hoveredDay?.dateKey === day.dateKey;

          let barColor = 'bg-cyan-500/30 hover:bg-cyan-400';
          if (day.percentage >= 80) {
            barColor = 'bg-gradient-to-t from-cyan-500 to-emerald-400';
          } else if (day.percentage >= 50) {
            barColor = 'bg-gradient-to-t from-cyan-600 to-cyan-400';
          } else if (day.percentage > 0) {
            barColor = 'bg-gradient-to-t from-amber-600 to-amber-400';
          } else if (day.isFuture) {
            barColor = 'bg-zinc-800/40 opacity-30';
          } else {
            barColor = 'bg-rose-950/40 border border-rose-500/20';
          }

          return (
            <div
              key={day.dateKey}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className="flex-1 min-w-[14px] sm:min-w-[18px] flex flex-col items-center justify-end h-full group cursor-pointer"
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-200 ${barColor} ${
                  day.isToday ? 'ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]' : ''
                } ${isHovered ? 'scale-y-105 brightness-125' : ''}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-center gap-1 sm:gap-1.5 pt-1.5 overflow-x-auto custom-scrollbar text-[9px] font-mono text-zinc-500">
        {dailyData.map((day) => (
          <div
            key={day.dateKey}
            className={`flex-1 min-w-[14px] sm:min-w-[18px] text-center ${
              day.isToday ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            {day.dayNumber % 2 !== 0 || dailyData.length <= 15 ? day.dayNumber : ''}
          </div>
        ))}
      </div>
    </div>
  );
};
