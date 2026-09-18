'use client';

import React, { useState, useMemo } from 'react';
import { Challenge, ChallengeMemberCompliance } from '@/lib/challengeTypes';
import { Trophy, Flame, ChevronDown, Handshake, Check } from 'lucide-react';

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  leaderboard: ChallengeMemberCompliance[];
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challenge,
  leaderboard,
}) => {
  const isCompetitive = challenge.mode === 'competitive';
  const [sortBy, setSortBy] = useState<'compliance' | 'streak' | 'completed'>('compliance');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Ordenar lista según criterio seleccionado
  const sortedLeaderboard = useMemo(() => {
    const list = [...leaderboard];
    if (sortBy === 'compliance') {
      list.sort((a, b) => b.percentage - a.percentage || b.currentStreak - a.currentStreak);
    } else if (sortBy === 'streak') {
      list.sort((a, b) => b.currentStreak - a.currentStreak || b.percentage - a.percentage);
    } else if (sortBy === 'completed') {
      list.sort((a, b) => b.completedDays - a.completedDays || b.percentage - a.percentage);
    }

    return list.map((item, idx) => ({
      ...item,
      rankPosition: idx + 1,
    }));
  }, [leaderboard, sortBy]);

  const sortLabel =
    sortBy === 'compliance'
      ? 'Por cumplimiento'
      : sortBy === 'streak'
      ? 'Por racha'
      : 'Por check-ins';

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
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

        {/* Dropdown de ordenamiento interactivo */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-white/[0.08] transition-colors cursor-pointer"
          >
            <span>{sortLabel}</span>
            <ChevronDown className="w-3 h-3 text-cyan-400" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-950 border border-white/[0.1] rounded-xl shadow-xl z-30 p-1 font-mono text-xs animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setSortBy('compliance');
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  sortBy === 'compliance' ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>Cumplimiento (%)</span>
                {sortBy === 'compliance' && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('streak');
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  sortBy === 'streak' ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>Racha activa</span>
                {sortBy === 'streak' && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('completed');
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  sortBy === 'completed' ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>Check-ins totales</span>
                {sortBy === 'completed' && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2.5 flex-1">
        {sortedLeaderboard.map((item) => {
          // Medalla o posición
          let badgeColor = 'bg-zinc-800 text-zinc-400 border-white/[0.08]';
          let medalIcon = null;

          if (isCompetitive) {
            if (item.rankPosition === 1) {
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
              medalIcon = '🥇';
            } else if (item.rankPosition === 2) {
              badgeColor = 'bg-slate-400/20 text-slate-200 border-slate-400/40';
              medalIcon = '🥈';
            } else if (item.rankPosition === 3) {
              badgeColor = 'bg-amber-700/20 text-amber-400 border-amber-700/40';
              medalIcon = '🥉';
            }
          }

          // Gradiente de barra
          let barGradient = 'from-cyan-500 to-emerald-400';
          if (item.percentage < 75) barGradient = 'from-amber-500 to-cyan-400';
          if (item.percentage < 60) barGradient = 'from-rose-500 to-amber-400';

          return (
            <div
              key={item.member.id}
              className="p-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/50 border border-white/[0.04] transition-all flex items-center justify-between gap-3 group"
            >
              {/* Left: Rank/Badge + Avatar + Name */}
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
                    <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover" />
                  ) : (
                    item.user.name.slice(0, 1)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white truncate block">
                      {item.user.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 ml-2">
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Streak */}
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-300 shrink-0">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 animate-pulse" />
                <span>{item.currentStreak}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
