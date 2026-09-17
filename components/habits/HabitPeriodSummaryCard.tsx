'use client';

import React from 'react';
import { Calendar, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PeriodSummary } from '@/lib/habitCalculations';

interface HabitPeriodSummaryCardProps {
  summary: PeriodSummary;
}

export const HabitPeriodSummaryCard: React.FC<HabitPeriodSummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col justify-between font-sans h-full">
      {/* Header */}
      <div className="pb-3 mb-2 border-b border-white/[0.06]">
        <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Resumen del Período
        </h4>
      </div>

      {/* Metrics List */}
      <div className="space-y-4 flex-1 flex flex-col justify-around py-1">
        {/* Metric 1: Total de check-ins */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-xs text-zinc-300 font-medium truncate">
              Total de check-ins
            </span>
          </div>
          <span className="text-sm sm:text-base font-bold font-mono text-white shrink-0">
            {summary.totalCheckIns}
          </span>
        </div>

        {/* Metric 2: Promedio diario */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-xs text-zinc-300 font-medium truncate">
              Promedio diario
            </span>
          </div>
          <span className="text-sm sm:text-base font-bold font-mono text-white shrink-0">
            {summary.dailyAverage}
          </span>
        </div>

        {/* Metric 3: Mejor día */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs text-zinc-300 font-medium truncate">
              Mejor día
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs sm:text-sm font-bold text-white font-mono">
              {summary.bestDay.count} check-ins
            </div>
            {summary.bestDay.label && (
              <div className="text-[10px] font-mono text-zinc-400">
                {summary.bestDay.label}
              </div>
            )}
          </div>
        </div>

        {/* Metric 4: Día más bajo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs text-zinc-300 font-medium truncate">
              Día más bajo
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs sm:text-sm font-bold text-white font-mono">
              {summary.lowestDay.count} check-ins
            </div>
            {summary.lowestDay.label && (
              <div className="text-[10px] font-mono text-zinc-400">
                {summary.lowestDay.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
