'use client';

import React from 'react';
import { Layers, Flame, Target, Flag } from 'lucide-react';
import { HabitKpiSummary } from '@/lib/habitTypes';

interface HabitKpiRowProps {
  kpis: HabitKpiSummary;
}

export const HabitKpiRow: React.FC<HabitKpiRowProps> = ({ kpis }) => {
  // Cálculo de circunferencia para el Donut Gauge
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (kpis.monthCompliancePercentage / 100) * circumference;

  const pendingChecks = Math.max(0, kpis.totalExpectedChecks - kpis.totalCompletedChecks);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
      {/* 1. HÁBITOS ACTIVOS */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-4.5 shadow-sm transition-all relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 tracking-wider">
            Hábitos Activos
          </span>
          <div className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {kpis.activeHabitsCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            de <span className="text-zinc-200 font-semibold">{kpis.totalHabitsCount}</span> creados
          </div>
        </div>
      </div>

      {/* 2. RACHA ACTUAL */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/25 rounded-2xl p-4 sm:p-4.5 shadow-sm transition-all relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 tracking-wider">
            Racha Actual
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tracking-tight flex items-baseline gap-1.5">
            <span>{kpis.currentStreak}</span>
            <span className="text-xs font-medium text-amber-400/80">días</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            mejor racha <span className="text-amber-400 font-semibold">{kpis.bestStreak} días</span>
          </div>
        </div>
      </div>

      {/* 3. CUMPLIMIENTO DEL MES */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-4.5 shadow-sm transition-all relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 tracking-wider">
            Cumplimiento del Mes
          </span>
          <div className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 tracking-tight">
            {kpis.monthCompliancePercentage}%
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            <span className="text-zinc-200 font-semibold">{kpis.totalCompletedChecks}</span> / {kpis.totalExpectedChecks} registros
          </div>
        </div>
      </div>

      {/* 4. OBJETIVOS COMPLETOS */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/25 rounded-2xl p-4 sm:p-4.5 shadow-sm transition-all relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 tracking-wider">
            Objetivos Completos
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Flag className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300 tracking-tight">
            {kpis.completedGoalsCount} / {kpis.totalGoalsCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            este mes
          </div>
        </div>
      </div>

      {/* 5. PROGRESO GENERAL (CIRCULAR DONUT GAUGE) */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all sm:col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-zinc-800/80"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-cyan-400 transition-all duration-700 ease-out"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.6))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-bold font-mono text-white leading-none">
              {kpis.monthCompliancePercentage}%
            </span>
            <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
              {kpis.totalCompletedChecks}/{kpis.totalExpectedChecks}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1 text-[11px] font-mono">
          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-1">
            Progreso General
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              Completado
            </span>
            <span className="font-semibold text-white">{kpis.totalCompletedChecks}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Pendiente
            </span>
            <span>{pendingChecks}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700/60" />
              No aplica
            </span>
            <span>{kpis.notApplicableCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
