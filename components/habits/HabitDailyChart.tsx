'use client';

import React, { useState, useMemo } from 'react';
import { DayCompliance } from '@/lib/habitTypes';
import { BarChart3, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';

interface HabitDailyChartProps {
  dailyData: DayCompliance[];
  totalHabits?: number;
}

type MetricType = 'count' | 'percentage' | 'cumulative';

export const HabitDailyChart: React.FC<HabitDailyChartProps> = ({
  dailyData,
  totalHabits = 8,
}) => {
  const [metric, setMetric] = useState<MetricType>('count');
  const [hoveredDay, setHoveredDay] = useState<DayCompliance | null>(null);

  // Determinar el máximo para la escala cuantitativa
  const maxDailyPossible = useMemo(() => {
    const dataMax = Math.max(...dailyData.map((d) => d.totalCount), 0);
    return Math.max(totalHabits, dataMax, 5);
  }, [dailyData, totalHabits]);

  // Serie acumulada para el mes
  const cumulativeData = useMemo(() => {
    let runningSum = 0;
    return dailyData.map((d) => {
      if (!d.isFuture) {
        runningSum += d.completedCount;
      }
      return {
        ...d,
        cumulativeSum: runningSum,
      };
    });
  }, [dailyData]);

  const maxCumulative = useMemo(() => {
    const maxVal = cumulativeData[cumulativeData.length - 1]?.cumulativeSum || 1;
    return Math.max(maxVal, 20);
  }, [cumulativeData]);

  // Total acumulado del mes
  const totalCompletedInMonth = useMemo(() => {
    return dailyData.reduce((acc, d) => acc + d.completedCount, 0);
  }, [dailyData]);

  // Valores del eje Y según métrica
  const yTicks = useMemo(() => {
    if (metric === 'percentage') {
      return ['100%', '80%', '60%', '40%', '20%', '0%'];
    }
    if (metric === 'count') {
      const step = Math.ceil(maxDailyPossible / 4);
      return [
        String(step * 4),
        String(step * 3),
        String(step * 2),
        String(step * 1),
        '0',
      ];
    }
    // cumulative
    const step = Math.ceil(maxCumulative / 4);
    return [
      String(step * 4),
      String(step * 3),
      String(step * 2),
      String(step * 1),
      '0',
    ];
  }, [metric, maxDailyPossible, maxCumulative]);

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans relative">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {metric === 'cumulative' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              Progreso Diario del Mes
            </h4>
            <p className="text-[11px] text-zinc-400">
              {metric === 'count' && 'Suma de hábitos cumplidos por día'}
              {metric === 'percentage' && 'Tasa de cumplimiento porcentual diario'}
              {metric === 'cumulative' && 'Serie temporal acumulada a lo largo del mes'}
            </p>
          </div>
        </div>

        {/* Metric Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="text-xs font-mono bg-zinc-900/90 text-cyan-300 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              <option value="count">Suma de Hábitos (Cantidad)</option>
              <option value="percentage">Porcentaje (%)</option>
              <option value="cumulative">Serie Acumulada</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="hidden md:inline-flex text-[10px] font-mono text-zinc-400 px-2 py-1 rounded bg-zinc-900 border border-white/[0.06]">
            Total: <strong className="text-white ml-1">{totalCompletedInMonth}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Tooltip HUD Display */}
      <div className="h-7 flex items-center mb-2 px-1">
        {hoveredDay ? (
          <div className="inline-flex items-center gap-2 text-xs font-mono animate-fade-in bg-zinc-900/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
            <span className="text-white font-semibold">
              Día {hoveredDay.dayNumber} ({hoveredDay.dayName})
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-cyan-300 font-bold">
              {hoveredDay.completedCount}{' '}
              {hoveredDay.completedCount === 1 ? 'hábito cumplido' : 'hábitos cumplidos'}
            </span>
            <span className="text-zinc-400 text-[11px]">
              de {hoveredDay.totalCount} ({hoveredDay.percentage}%)
            </span>
            {hoveredDay.completedCount === hoveredDay.totalCount && hoveredDay.totalCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                <Sparkles className="w-2.5 h-2.5" /> Perfecto
              </span>
            )}
            {metric === 'cumulative' && (
              <span className="text-purple-300 text-[11px] font-semibold">
                (Acumulado:{' '}
                {cumulativeData.find((c) => c.dateKey === hoveredDay.dateKey)?.cumulativeSum || 0}
                )
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2">
            <span>
              💡 Cada hábito marcado como cumplido eleva la barra del día en tiempo real.
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas: Y-Axis + Plot Area */}
      <div className="flex gap-2 h-44 sm:h-48 pt-2 pb-1 relative">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between items-end pr-1 text-[9px] font-mono text-zinc-500 select-none shrink-0 w-8 sm:w-10">
          {yTicks.map((tick, i) => (
            <span key={i} className="leading-none">
              {tick}
            </span>
          ))}
        </div>

        {/* Plot Area with Grid Lines */}
        <div className="relative flex-1 flex flex-col justify-between">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-b border-white/[0.06]" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.04] border-dashed" />
            <div className="w-full border-b border-white/[0.08]" />
          </div>

          {/* Bars Flex Container */}
          <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar z-10 px-0.5">
            {dailyData.map((day) => {
              const isHovered = hoveredDay?.dateKey === day.dateKey;

              // Calcular altura porcentual según la métrica seleccionada
              let heightPct = 0;
              if (metric === 'count') {
                const maxVal = Math.ceil(maxDailyPossible / 4) * 4;
                heightPct = maxVal > 0 ? (day.completedCount / maxVal) * 100 : 0;
              } else if (metric === 'percentage') {
                heightPct = day.percentage;
              } else if (metric === 'cumulative') {
                const item = cumulativeData.find((c) => c.dateKey === day.dateKey);
                const maxVal = Math.ceil(maxCumulative / 4) * 4;
                heightPct = maxVal > 0 ? ((item?.cumulativeSum || 0) / maxVal) * 100 : 0;
              }

              // Altura mínima visual para interacción si hay valor o es el día actual
              const visualHeight = day.completedCount > 0 ? Math.max(6, heightPct) : 0;

              // Paleta de colores HUD dinámica
              let barGradient = 'bg-cyan-500/30';
              if (metric === 'cumulative') {
                barGradient = 'bg-gradient-to-t from-purple-600 via-cyan-500 to-emerald-400';
              } else if (day.completedCount === day.totalCount && day.totalCount > 0) {
                barGradient =
                  'bg-gradient-to-t from-cyan-600 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]';
              } else if (day.completedCount > 0) {
                barGradient =
                  'bg-gradient-to-t from-cyan-700 via-cyan-500 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]';
              } else if (day.isFuture) {
                barGradient = 'bg-zinc-800/30 opacity-20';
              } else {
                barGradient = 'bg-zinc-800/40';
              }

              return (
                <div
                  key={day.dateKey}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 min-w-[13px] sm:min-w-[18px] flex flex-col items-center justify-end h-full group cursor-pointer relative"
                >
                  {/* Subtle Base Marker for empty past/today days */}
                  {visualHeight === 0 && !day.isFuture && (
                    <div
                      className={`w-full h-1 rounded-full mb-0.5 transition-colors ${
                        day.isToday ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-800'
                      }`}
                    />
                  )}

                  {/* Main Animated Bar */}
                  {visualHeight > 0 && (
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ease-out ${barGradient} ${
                        day.isToday
                          ? 'ring-1 ring-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.7)]'
                          : ''
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

      {/* X-Axis Labels (Day Numbers 1..31) */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] select-none">
        <div className="w-8 sm:w-10 shrink-0" />
        <div className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar text-[9px] font-mono text-zinc-500 px-0.5">
          {dailyData.map((day) => (
            <div
              key={day.dateKey}
              className={`flex-1 min-w-[13px] sm:min-w-[18px] text-center ${
                day.isToday ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              {day.dayNumber % 2 !== 0 || dailyData.length <= 15 ? day.dayNumber : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
