'use client';

import React, { useState, useMemo } from 'react';
import { Challenge, ChallengeMemberCompliance } from '@/lib/challengeTypes';
import {
  Trophy,
  Flame,
  ChevronDown,
  ChevronUp,
  Handshake,
  Star,
  Zap,
  ShieldCheck,
  Target,
  Sparkles,
} from 'lucide-react';

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  leaderboard: ChallengeMemberCompliance[];
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challenge,
  leaderboard,
}) => {
  const isCompetitive = challenge.mode === 'competitive';
  const [sortBy, setSortBy] = useState<'compliance' | 'points' | 'streak'>('compliance');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Máximo puntaje y racha para normalizar barras de progreso visuales
  const maxPoints = useMemo(
    () => Math.max(...leaderboard.map((m) => m.points || 0), 1),
    [leaderboard]
  );
  const maxStreak = useMemo(
    () => Math.max(...leaderboard.map((m) => m.currentStreak || 0), 1),
    [leaderboard]
  );

  // Ordenar lista según criterio seleccionado con cálculo determinístico de posiciones
  const sortedLeaderboard = useMemo(() => {
    const list = [...leaderboard];
    if (sortBy === 'compliance') {
      list.sort(
        (a, b) =>
          b.percentage - a.percentage ||
          b.points - a.points ||
          b.currentStreak - a.currentStreak
      );
    } else if (sortBy === 'points') {
      list.sort(
        (a, b) =>
          b.points - a.points ||
          b.percentage - a.percentage ||
          b.currentStreak - a.currentStreak
      );
    } else if (sortBy === 'streak') {
      list.sort(
        (a, b) =>
          b.currentStreak - a.currentStreak ||
          b.points - a.points ||
          b.percentage - a.percentage
      );
    }

    let curRank = 1;
    return list.map((item, idx) => {
      if (idx > 0) {
        const prev = list[idx - 1];
        const isTied =
          sortBy === 'points'
            ? prev.points === item.points
            : sortBy === 'streak'
            ? prev.currentStreak === item.currentStreak
            : prev.percentage === item.percentage;
        if (!isTied) {
          curRank = idx + 1;
        }
      }
      return {
        ...item,
        rankPosition: curRank,
      };
    });
  }, [leaderboard, sortBy]);

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans relative">
      {/* Header con Pestañas Cyberpunk */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {isCompetitive ? (
            <Trophy className="w-4 h-4 text-amber-400" />
          ) : (
            <Handshake className="w-4 h-4 text-emerald-400" />
          )}
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            {isCompetitive ? 'Leaderboard' : 'Progreso de Miembros'}
          </h4>
        </div>

        {/* Pestañas de Ordenamiento Cyberpunk */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 sm:p-1 rounded-xl border border-white/[0.08] text-[11px] font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortBy('compliance')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'compliance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>% Éxito</span>
          </button>

          <button
            type="button"
            onClick={() => setSortBy('points')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'points'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Puntos</span>
          </button>

          <button
            type="button"
            onClick={() => setSortBy('streak')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'streak'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Racha</span>
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2 flex-1">
        {sortedLeaderboard.map((item) => {
          const isExpanded = expandedMemberId === item.member.id;

          // Medalla o posición
          let badgeColor = 'bg-zinc-800 text-zinc-400 border-white/[0.08]';
          let medalIcon = null;

          if (isCompetitive) {
            if (item.rankPosition === 1) {
              badgeColor =
                'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
              medalIcon = '🥇';
            } else if (item.rankPosition === 2) {
              badgeColor = 'bg-slate-400/20 text-slate-200 border-slate-400/40';
              medalIcon = '🥈';
            } else if (item.rankPosition === 3) {
              badgeColor = 'bg-amber-700/20 text-amber-400 border-amber-700/40';
              medalIcon = '🥉';
            }
          }

          // Normalización de barras según modo
          const pointsBarPercent = Math.min(100, Math.round(((item.points || 0) / maxPoints) * 100));
          const streakBarPercent = Math.min(100, Math.round(((item.currentStreak || 0) / maxStreak) * 100));

          // Gradiente de barra dinámico
          let barGradient = 'from-cyan-500 to-emerald-400';
          if (sortBy === 'points') {
            barGradient = 'from-amber-500 via-amber-400 to-yellow-300';
          } else if (sortBy === 'streak') {
            barGradient = 'from-rose-500 to-amber-400';
          } else {
            if (item.percentage < 75) barGradient = 'from-amber-500 to-cyan-400';
            if (item.percentage < 60) barGradient = 'from-rose-500 to-amber-400';
          }

          const currentBarPercent =
            sortBy === 'points'
              ? pointsBarPercent
              : sortBy === 'streak'
              ? streakBarPercent
              : item.percentage;

          return (
            <div
              key={item.member.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-zinc-900/70 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'bg-zinc-950/40 hover:bg-zinc-900/50 border-white/[0.04]'
              }`}
            >
              {/* Row Header (Clickable) */}
              <div
                onClick={() =>
                  setExpandedMemberId((prev) => (prev === item.member.id ? null : item.member.id))
                }
                className="p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Rank/Badge + Avatar + Name & Gamification Badges */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isCompetitive ? (
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${badgeColor}`}
                    >
                      {item.rankPosition}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  )}

                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                    {item.user.avatar ? (
                      <img
                        src={item.user.avatar}
                        alt={item.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.user.name.slice(0, 1)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-white truncate block">
                          {item.user.name}
                        </span>

                        {/* Cyberpunk Dynamic Badges */}
                        {item.rankPosition === 1 &&
                          (sortBy === 'points' ? item.points > 0 : item.percentage > 0) &&
                          isCompetitive && (
                            <span
                              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0"
                              title="Líder del Reto"
                            >
                              <Zap className="w-2.5 h-2.5 fill-amber-300" />
                              <span>Líder</span>
                            </span>
                          )}

                        {item.percentage === 100 && item.completedDays > 0 && (
                          <span
                            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0"
                            title="100% de Consistencia Impecable"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>100%</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {sortBy === 'points' ? (
                          <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {item.points} <span className="text-[10px] text-amber-500/80 font-normal">PTS</span>
                          </span>
                        ) : sortBy === 'streak' ? (
                          <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-400" />
                            {item.currentStreak} <span className="text-[10px] text-rose-500/80 font-normal">días</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            {item.percentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                        style={{ width: `${currentBarPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Métricas secundarias y Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {sortBy === 'points' ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-1.5 py-0.5 rounded-md"
                        title={`Efectividad: ${item.percentage}%`}
                      >
                        <span>{item.percentage}%</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-mono text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          item.currentStreak >= 7
                            ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            : 'text-zinc-400'
                        }`}
                        title={`Racha actual: ${item.currentStreak} días (Mejor: ${item.bestStreak}d)`}
                      >
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            item.currentStreak > 0
                              ? 'text-amber-400 fill-amber-400/30 animate-pulse'
                              : 'text-zinc-600'
                          }`}
                        />
                        <span>{item.currentStreak}</span>
                      </div>
                    </div>
                  ) : sortBy === 'streak' ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex items-center gap-1 font-mono text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded-md"
                        title={`Puntos acumulados: ${item.points} PTS`}
                      >
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{item.points}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 px-1.5 py-0.5 rounded-md"
                        title={`Puntos acumulados: ${item.points} PTS`}
                      >
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{item.points}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-mono text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          item.currentStreak >= 7
                            ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            : 'text-zinc-400'
                        }`}
                        title={`Racha actual: ${item.currentStreak} días (Mejor: ${item.bestStreak}d)`}
                      >
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            item.currentStreak > 0
                              ? 'text-amber-400 fill-amber-400/30 animate-pulse'
                              : 'text-zinc-600'
                          }`}
                        />
                        <span>{item.currentStreak}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-zinc-500 hover:text-cyan-300 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Member Stats Breakdown */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] bg-black/40 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[9px] uppercase">Puntos Totales</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {item.points} <span className="text-zinc-500 font-normal">pts</span>
                    </span>
                  </div>

                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[9px] uppercase">Días Cumplidos</span>
                    <span className="text-white font-bold">
                      {item.completedDays}{' '}
                      <span className="text-zinc-500 font-normal">/ {item.expectedDays}d</span>
                    </span>
                  </div>

                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[9px] uppercase">Mejor Racha</span>
                    <span className="text-amber-300 font-bold">{item.bestStreak} días</span>
                  </div>

                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[9px] uppercase">Efectividad</span>
                    <span
                      className={`font-bold ${
                        item.percentage >= 80
                          ? 'text-emerald-400'
                          : item.percentage >= 50
                          ? 'text-cyan-300'
                          : 'text-amber-400'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
