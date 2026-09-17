'use client';

import React from 'react';
import { ChallengeActivity } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { Activity, Dumbbell, Droplet, UserPlus, CheckCircle2 } from 'lucide-react';

interface ChallengeActivityFeedProps {
  activities: ChallengeActivity[];
  users: User[];
}

export const ChallengeActivityFeed: React.FC<ChallengeActivityFeedProps> = ({
  activities,
  users,
}) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Actividad Reciente
          </h4>
        </div>

        <button
          type="button"
          className="text-[11px] font-mono text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Ver todas
        </button>
      </div>

      {/* Activity Items List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-64 custom-scrollbar">
        {activities.slice(0, 6).map((act) => {
          const user =
            users.find((u) => u.id === act.userId) || {
              id: act.userId,
              name: 'Usuario',
              username: 'user',
              role: 'user',
              avatarUrl: '',
            };

          // Ícono contextual de actividad
          let actionIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
          if (act.habitTitle?.toLowerCase().includes('entrenar') || act.habitTitle?.toLowerCase().includes('gym')) {
            actionIcon = <Dumbbell className="w-3.5 h-3.5 text-orange-400" />;
          } else if (act.habitTitle?.toLowerCase().includes('agua') || act.habitTitle?.toLowerCase().includes('hidrata')) {
            actionIcon = <Droplet className="w-3.5 h-3.5 text-cyan-400" />;
          } else if (act.actionType === 'joined') {
            actionIcon = <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
          }

          // Formateo de fecha/hora simplificado
          const timeFormatted = act.createdAt
            ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Reciente';

          return (
            <div
              key={act.id}
              className="flex items-center gap-2.5 text-xs font-sans group hover:bg-zinc-900/30 p-1 rounded-lg transition-colors"
            >
              {/* Avatar con mini-badge del ícono */}
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-300">
                  {'avatar' in user && user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.slice(0, 1)
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 border border-white/[0.08]">
                  {actionIcon}
                </div>
              </div>

              {/* Message & Time */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-200 truncate leading-snug">
                  {act.message}
                </p>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Hoy {timeFormatted}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
