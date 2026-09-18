'use client';

import React, { useState, useMemo } from 'react';
import { Challenge, ChallengeDayInfo, ChallengeLog, ChallengeMember } from '@/lib/challengeTypes';
import { BarChart3, ChevronDown, Sparkles } from 'lucide-react';
import { getBogotaToday } from '@/lib/habitCalculations';

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

export interface ChallengeWeeklyProgressCardProps {
  challenge: Challenge;
  members?: ChallengeMember[];
  logs?: ChallengeLog[];
  todayKey?: string;
}

// Componente lateral de Progreso Semanal del Equipo (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
export const ChallengeWeeklyProgressCard: React.FC<ChallengeWeeklyProgressCardProps> = ({
  challenge,
  members = [],
  logs = [],
  todayKey,
}) => {
  const [viewMode, setViewMode] = useState<'this_week' | 'overall_avg'>('this_week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const effectiveToday = todayKey || getBogotaToday();
  const totalMembers = Math.max(members.length, 1);

  // 1. Datos para "Esta Semana" (Lunes a Domingo que contiene effectiveToday)
  const thisWeekDays = useMemo(() => {
    const [refY, refM, refD] = effectiveToday.split('-').map(Number);
    const refDate = new Date(refY, refM - 1, refD, 12, 0, 0);
    const dayOfWeek = refDate.getDay(); // 0 es Dom, 1 es Lun...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(refY, refM - 1, refD + distanceToMonday, 12, 0, 0);

    const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return weekLabels.map((label, idx) => {
      const cur = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + idx, 12, 0, 0);
      const curY = cur.getFullYear();
      const curM = String(cur.getMonth() + 1).padStart(2, '0');
      const curD = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${curY}-${curM}-${curD}`;

      const isToday = dateKey === effectiveToday;
      const isFuture = dateKey > effectiveToday;
      const isOutsideChallenge =
        (challenge.startDate && dateKey < challenge.startDate) ||
        (challenge.endDate && dateKey > challenge.endDate);

      // Miembros únicos que completaron al menos un check en ese día
      const completedUserIds = new Set(
        logs
          .filter((l) => l.challengeId === challenge.id && l.dateKey === dateKey && l.status === 'completed')
          .map((l) => l.userId)
      );

      const completedCount = completedUserIds.size;
      const pct = !isFuture && !isOutsideChallenge
        ? Math.round((completedCount / totalMembers) * 100)
        : 0;

      let color = 'from-zinc-800 to-zinc-700';
      if (!isFuture && !isOutsideChallenge) {
        if (pct >= 80) color = 'from-cyan-500 to-emerald-400';
        else if (pct >= 50) color = 'from-cyan-500 to-blue-400';
        else if (pct > 0) color = 'from-amber-500 to-orange-400';
      }

      return {
        day: label,
        dayNumber: cur.getDate(),
        dateKey,
        pct,
        completedCount,
        totalMembers,
        isToday,
        isFuture,
        isOutsideChallenge,
        color,
      };
    });
  }, [effectiveToday, challenge.id, challenge.startDate, challenge.endDate, logs, totalMembers]);

  // 2. Datos para "Promedio Reto" (Promedio general por día de la semana a lo largo del reto)
  const overallAvgDays = useMemo(() => {
    const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const jsDayMap = [1, 2, 3, 4, 5, 6, 0];

    const startYmd = challenge.startDate || effectiveToday;
    const [sY, sM, sD] = startYmd.split('-').map(Number);
    const startDate = new Date(sY, sM - 1, sD, 12, 0, 0);

    const endYmd = challenge.endDate && challenge.endDate < effectiveToday ? challenge.endDate : effectiveToday;
    const [eY, eM, eD] = endYmd.split('-').map(Number);
    const endDate = new Date(eY, eM - 1, eD, 12, 0, 0);

    return weekLabels.map((label, idx) => {
      const targetJsDay = jsDayMap[idx];
      let occurrences = 0;
      let sumPcts = 0;
      let totalCompleted = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === targetJsDay) {
          occurrences++;
          const curY = d.getFullYear();
          const curM = String(d.getMonth() + 1).padStart(2, '0');
          const curD = String(d.getDate()).padStart(2, '0');
          const dateKey = `${curY}-${curM}-${curD}`;

          const count = new Set(
            logs
              .filter((l) => l.challengeId === challenge.id && l.dateKey === dateKey && l.status === 'completed')
              .map((l) => l.userId)
          ).size;

          totalCompleted += count;
          sumPcts += (count / totalMembers) * 100;
        }
      }

      const avgPct = occurrences > 0 ? Math.round(sumPcts / occurrences) : 0;
      let color = 'from-zinc-800 to-zinc-700';
      if (avgPct >= 80) color = 'from-cyan-500 to-emerald-400';
      else if (avgPct >= 50) color = 'from-cyan-500 to-blue-400';
      else if (avgPct > 0) color = 'from-amber-500 to-orange-400';

      return {
        day: label,
        dayNumber: undefined,
        dateKey: '',
        pct: avgPct,
        completedCount: totalCompleted,
        totalMembers,
        isToday: false,
        isFuture: occurrences === 0,
        isOutsideChallenge: false,
        color,
        occurrences,
      };
    });
  }, [effectiveToday, challenge.id, challenge.startDate, challenge.endDate, logs, totalMembers]);

  const activeDays = viewMode === 'this_week' ? thisWeekDays : overallAvgDays;

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
          Progreso del Equipo
        </h4>

        {/* Dropdown de modo de visualización */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-white/[0.08] transition-colors cursor-pointer"
          >
            <span>{viewMode === 'this_week' ? 'Esta Semana' : 'Promedio Reto'}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#0a101f] border border-white/10 rounded-xl shadow-xl z-30 py-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setViewMode('this_week');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 transition-colors cursor-pointer ${
                  viewMode === 'this_week'
                    ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('overall_avg');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 transition-colors cursor-pointer ${
                  viewMode === 'overall_avg'
                    ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                Promedio Reto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Week Bars Container */}
      <div className="flex items-end justify-between gap-2 h-36 pt-2 pb-1 relative">
        {activeDays.map((w, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={w.day}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group relative cursor-default"
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 bg-zinc-950 border border-white/10 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-white shadow-xl whitespace-nowrap z-30 pointer-events-none">
                  <p className="font-semibold text-cyan-300">
                    {w.day} {w.dayNumber ? `(${w.dayNumber})` : ''}
                  </p>
                  <p className="text-zinc-300">
                    {w.isFuture
                      ? 'Día futuro'
                      : w.isOutsideChallenge
                      ? 'Fuera del reto'
                      : `${w.completedCount}/${w.totalMembers} participantes (${w.pct}%)`}
                  </p>
                </div>
              )}

              {/* Percentage label */}
              <span
                className={`text-[10px] font-mono transition-colors ${
                  w.isToday
                    ? 'text-cyan-300 font-bold'
                    : w.isFuture || w.isOutsideChallenge
                    ? 'text-zinc-600'
                    : w.pct > 0
                    ? 'text-zinc-300 group-hover:text-cyan-300'
                    : 'text-zinc-500'
                }`}
              >
                {w.isFuture || w.isOutsideChallenge ? '--' : `${w.pct}%`}
              </span>

              {/* Bar track and fill */}
              <div className="w-full max-w-[28px] rounded-t-md bg-zinc-900/90 h-full flex items-end overflow-hidden border-b border-white/[0.06]">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    w.pct > 0
                      ? `bg-gradient-to-t ${w.color} group-hover:brightness-125`
                      : 'bg-zinc-800/40'
                  }`}
                  style={{ height: w.pct > 0 ? `${Math.max(w.pct, 6)}%` : '3px' }}
                />
              </div>

              {/* Day label */}
              <span
                className={`text-[10px] font-mono font-semibold transition-colors ${
                  w.isToday
                    ? 'text-cyan-400 font-bold'
                    : w.isFuture
                    ? 'text-zinc-600'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              >
                {w.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
