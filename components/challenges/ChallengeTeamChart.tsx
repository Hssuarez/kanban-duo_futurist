'use client';

import React, { useState } from 'react';
import { Challenge, ChallengeDayInfo, ChallengeLog, ChallengeMember } from '@/lib/challengeTypes';
import { BarChart3, ChevronDown, Sparkles } from 'lucide-react';

interface ChallengeTeamChartProps {
  challenge: Challenge;
  days: ChallengeDayInfo[];
  members: ChallengeMember[];
  logs: ChallengeLog[];
}

export const ChallengeTeamChart: React.FC<ChallengeTeamChartProps> = ({
  days,
  members,
  logs,
}) => {
  const [metric, setMetric] = useState<'count' | 'percentage' | 'cumulative'>('count');
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  const totalMembers = Math.max(members.length, 1);

  // Calcular cumplimiento de participantes por día
  let runningCumulative = 0;
  const dailyCompliance = days.map((day) => {
    // Miembros únicos que completaron su check-in en este día
    const completedUserIds = new Set(
      logs.filter((l) => l.dateKey === day.dateKey && l.status === 'completed').map((l) => l.userId)
    );
    const completedMembersCount = completedUserIds.size;
    const percentage = totalMembers > 0 ? Math.round((completedMembersCount / totalMembers) * 100) : 0;

    if (!day.isFuture) {
      runningCumulative += completedMembersCount;
    }

    return {
      dayNumber: day.dayNumber,
      dateKey: day.dateKey,
      dayName: day.dayName,
      completedMembersCount,
      totalMembers,
      percentage,
      cumulativeCount: runningCumulative,
      isToday: day.isToday,
      isPast: day.isPast,
      isFuture: day.isFuture,
    };
  });

  // Escala Y según la métrica seleccionada
  const yLabels =
    metric === 'percentage'
      ? ['100%', '75%', '50%', '25%', '0%']
      : metric === 'cumulative'
      ? ['100%', '75%', '50%', '25%', '0%']
      : [
          String(totalMembers),
          String(Math.max(1, Math.round(totalMembers * 0.75))),
          String(Math.max(1, Math.round(totalMembers * 0.5))),
          String(Math.max(1, Math.round(totalMembers * 0.25))),
          '0',
        ];

  // Máximo acumulado posible hasta la fecha para porcentaje acumulado
  const pastDaysCount = Math.max(1, days.filter((d) => !d.isFuture).length);
  const maxCumulativePossible = totalMembers * pastDaysCount;

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Progreso Diario del Reto{' '}
            <span className="text-zinc-500 font-normal text-[11px] normal-case">
              ({metric === 'count' ? 'Participantes que cumplieron' : metric === 'percentage' ? 'Tasa de cumplimiento' : 'Cumplimiento acumulado'})
            </span>
          </h4>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-white/[0.06] text-xs font-mono">
          <button
            type="button"
            onClick={() => setMetric('count')}
            className={`px-2 py-0.5 rounded transition-all ${
              metric === 'count'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Participantes
          </button>
          <button
            type="button"
            onClick={() => setMetric('percentage')}
            className={`px-2 py-0.5 rounded transition-all ${
              metric === 'percentage'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tasa (%)
          </button>
          <button
            type="button"
            onClick={() => setMetric('cumulative')}
            className={`px-2 py-0.5 rounded transition-all ${
              metric === 'cumulative'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Acumulado
          </button>
        </div>
      </div>

      {/* Tooltip display */}
      <div className="h-6 flex items-center mb-2 px-1">
        {hoveredDay ? (
          <div className="inline-flex items-center gap-2 text-xs font-mono animate-fade-in bg-zinc-900 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
            <span className="text-white font-semibold">{hoveredDay.dateKey}</span>
            <span className="text-cyan-400 font-bold">
              {hoveredDay.completedMembersCount} de {totalMembers} participantes cumplieron
            </span>
            <span className="text-zinc-400 text-[11px]">({hoveredDay.percentage}%)</span>
            {metric === 'cumulative' && (
              <span className="text-emerald-400 text-[11px] border-l border-white/[0.1] pl-2">
                Acumulado: {hoveredDay.cumulativeCount} check-ins
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500">
            Pasa el cursor sobre un día para ver los participantes que cumplieron el reto.
          </div>
        )}
      </div>

      {/* Plot Canvas: Y-Axis + Bars */}
      <div className="flex gap-2 h-40 pt-2 pb-1 relative">
        {/* Y-Axis scale */}
        <div className="flex flex-col justify-between items-end pr-1 text-[9px] font-mono text-zinc-500 select-none shrink-0 w-8">
          {yLabels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>

        {/* Bars Container with grid lines */}
        <div className="relative flex-1 flex flex-col justify-between">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-b border-white/[0.06]" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.08]" />
          </div>

          <div className="absolute inset-0 flex items-end gap-1 overflow-x-auto custom-scrollbar z-10 px-0.5">
            {dailyCompliance.map((d) => {
              const isHovered = hoveredDay?.dateKey === d.dateKey;

              let heightPct = 0;
              if (metric === 'count' || metric === 'percentage') {
                heightPct = d.percentage;
              } else if (metric === 'cumulative') {
                heightPct = maxCumulativePossible > 0 ? Math.round((d.cumulativeCount / maxCumulativePossible) * 100) : 0;
              }

              const visualHeight = d.completedMembersCount > 0 || (metric === 'cumulative' && d.cumulativeCount > 0)
                ? Math.max(6, Math.min(100, heightPct))
                : 0;

              return (
                <div
                  key={d.dateKey}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 min-w-[12px] sm:min-w-[16px] flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {visualHeight === 0 && !d.isFuture && (
                    <div
                      className={`w-full h-1 rounded-full mb-0.5 ${
                        d.isToday ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-800'
                      }`}
                    />
                  )}

                  {visualHeight > 0 && (
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 bg-gradient-to-t from-cyan-600 to-cyan-400 ${
                        d.isToday ? 'ring-1 ring-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : ''
                      } ${isHovered ? 'scale-y-105 brightness-125' : ''}`}
                      style={{ height: `${visualHeight}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis labels */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
        <div className="w-8 shrink-0" />
        <div className="flex-1 flex items-center gap-1 overflow-x-auto custom-scrollbar text-[9px] font-mono text-zinc-500">
          {dailyCompliance.map((d) => (
            <div
              key={d.dateKey}
              className={`flex-1 min-w-[12px] sm:min-w-[16px] text-center ${
                d.isToday ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              {d.dayNumber % 2 !== 0 || dailyCompliance.length <= 15 ? d.dayNumber : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente lateral de Progreso Semanal del Equipo (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
export const ChallengeWeeklyProgressCard: React.FC<{
  challenge: Challenge;
}> = () => {
  const weekDays = [
    { day: 'Lun', pct: 82, color: 'from-cyan-500 to-emerald-400' },
    { day: 'Mar', pct: 90, color: 'from-cyan-500 to-emerald-400' },
    { day: 'Mié', pct: 76, color: 'from-amber-500 to-cyan-400' },
    { day: 'Jue', pct: 88, color: 'from-cyan-500 to-emerald-400' },
    { day: 'Vie', pct: 92, color: 'from-cyan-500 to-emerald-400' },
    { day: 'Sáb', pct: 68, color: 'from-rose-500 to-amber-400' },
    { day: 'Dom', pct: 80, color: 'from-cyan-500 to-emerald-400' },
  ];

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
          Progreso del Equipo
        </h4>
        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-white/[0.06]">
          <span>Porcentaje</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </div>
      </div>

      {/* Week Bars Container */}
      <div className="flex items-end justify-between gap-2 h-36 pt-2 pb-1">
        {weekDays.map((w) => (
          <div key={w.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group">
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-cyan-300 transition-colors">
              {w.pct}%
            </span>
            <div className="w-full max-w-[28px] rounded-t-md bg-zinc-900 h-full flex items-end overflow-hidden">
              <div
                className={`w-full rounded-t-md bg-gradient-to-t ${w.color} transition-all duration-500 group-hover:brightness-125`}
                style={{ height: `${w.pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-semibold text-zinc-500">
              {w.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
