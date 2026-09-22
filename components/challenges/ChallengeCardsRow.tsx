'use client';

import React from 'react';
import { Challenge, ChallengeMember } from '@/lib/challengeTypes';
import { Users, ChevronRight, Sparkles } from 'lucide-react';

interface ChallengeCardsRowProps {
  challenges: Challenge[];
  selectedChallengeId: string;
  members: ChallengeMember[];
  onSelectChallenge: (challengeId: string) => void;
}

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return '';
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  if (startYear === endYear) {
    return `${start.slice(5)} – ${end.slice(5)}`;
  }
  return `${start} – ${end}`;
};

export const ChallengeCardsRow: React.FC<ChallengeCardsRowProps> = ({
  challenges,
  selectedChallengeId,
  members,
  onSelectChallenge,
}) => {
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1 font-sans">
      {challenges.map((ch) => {
        const isSelected = ch.id === selectedChallengeId;
        const chMembers = members.filter((m) => m.challengeId === ch.id);

        // Estado badge
        let statusBadge = {
          label: 'En curso',
          bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
        };
        if (ch.status === 'upcoming') {
          statusBadge = {
            label: 'Próximo',
            bg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30',
          };
        } else if (ch.status === 'completed') {
          statusBadge = {
            label: 'Finalizado',
            bg: 'bg-zinc-900 text-zinc-400 border-white/[0.08]',
          };
        }

        // Porcentaje aproximado según status
        let progressPct = 86;
        if (ch.id === 'ch-lectura-30d') progressPct = 72;
        if (ch.id === 'ch-hidrata-21d') progressPct = 0;
        if (ch.id === 'ch-sueno-31d') progressPct = 100;

        return (
          <div
            key={ch.id}
            onClick={() => onSelectChallenge(ch.id)}
            className={`min-w-[260px] sm:min-w-[280px] rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between relative group select-none ${
              isSelected
                ? 'bg-[#070c18] border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/40'
                : 'bg-[#070c18]/70 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#070c18]/90'
            }`}
          >
            {/* Top Row: Icon/Thumbnail + Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  {ch.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                    {ch.title}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    {formatDateRange(ch.startDate, ch.endDate)}
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 font-medium ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </div>

            {/* Middle: Progress Bar */}
            <div className="space-y-1 mb-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Progreso</span>
                <span className="text-cyan-300 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Bottom: Members avatars count & Next Arrow */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>{chMembers.length || 4} participantes</span>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-600 group-hover:text-zinc-300'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
