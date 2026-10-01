'use client';

import React, { useState, useMemo } from 'react';
import { ChallengeActivity, ChallengeLog } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import {
  Activity,
  Dumbbell,
  Droplet,
  UserPlus,
  CheckCircle2,
  Camera,
  Flame,
  ChevronDown,
} from 'lucide-react';

interface ChallengeActivityFeedProps {
  activities: ChallengeActivity[];
  users: User[];
  logs?: ChallengeLog[];
  currentUserId?: string;
  onOpenEvidence?: (log: ChallengeLog, user: User, habitTitle?: string) => void;
}

export const ChallengeActivityFeed: React.FC<ChallengeActivityFeedProps> = ({
  activities,
  users,
  logs = [],
  currentUserId,
  onOpenEvidence,
}) => {
  const [filter, setFilter] = useState<'all' | 'evidence' | 'mine'>('all');
  const [showAll, setShowAll] = useState(false);

  // Mapeo rápido de logs con evidencia para optimizar búsqueda O(1)
  const evidenceLogsMap = useMemo(() => {
    const map = new Map<string, ChallengeLog>();
    logs.forEach((l) => {
      if (l.evidenceUrl || l.evidenceFileId) {
        // Clave compuesta: challengeId_userId_dateKey_habitId
        const key = `${l.challengeId}_${l.userId}_${l.dateKey}_${l.challengeHabitId}`;
        map.set(key, l);
        // Fallback sin habitId
        const fallbackKey = `${l.challengeId}_${l.userId}_${l.dateKey}`;
        if (!map.has(fallbackKey)) map.set(fallbackKey, l);
      }
    });
    return map;
  }, [logs]);

  // Filtrado de actividades
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filter === 'mine' && currentUserId) {
        if (act.userId !== currentUserId) return false;
      }
      if (filter === 'evidence') {
        const key = `${act.challengeId}_${act.userId}_${act.dateKey}_${act.challengeHabitId || ''}`;
        const fallbackKey = `${act.challengeId}_${act.userId}_${act.dateKey}`;
        const hasEv = evidenceLogsMap.has(key) || evidenceLogsMap.has(fallbackKey);
        if (!hasEv) return false;
      }
      return true;
    });
  }, [activities, filter, currentUserId, evidenceLogsMap]);

  const displayedActivities = showAll
    ? filteredActivities.slice(0, 30)
    : filteredActivities.slice(0, 6);

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Actividad Reciente
          </h4>
        </div>

        {filteredActivities.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-[11px] font-mono text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer select-none"
          >
            {showAll ? 'Ver menos' : `Ver todas (${filteredActivities.length})`}
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 pb-3 text-[10px] font-mono">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-zinc-800 text-cyan-300 font-bold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setFilter('evidence')}
          className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
            filter === 'evidence'
              ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.15)]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Camera className="w-2.5 h-2.5" />
          <span>Con foto</span>
        </button>
        {currentUserId && (
          <button
            type="button"
            onClick={() => setFilter('mine')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              filter === 'mine'
                ? 'bg-zinc-800 text-cyan-300 font-bold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Mías
          </button>
        )}
      </div>

      {/* Activity Items List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72 custom-scrollbar">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs font-mono">
            No hay actividades registradas en esta vista.
          </div>
        ) : (
          displayedActivities.map((act) => {
            const user =
              users.find((u) => u.id === act.userId) || {
                id: act.userId,
                name: 'Usuario',
                username: 'user',
                role: 'user',
                avatarUrl: '',
              };

            // Detectar si esta actividad tiene foto de evidencia
            const key = `${act.challengeId}_${act.userId}_${act.dateKey}_${act.challengeHabitId || ''}`;
            const fallbackKey = `${act.challengeId}_${act.userId}_${act.dateKey}`;
            const matchingLog = evidenceLogsMap.get(key) || evidenceLogsMap.get(fallbackKey);
            const hasEvidence = !!matchingLog;

            // Ícono contextual de actividad
            let actionIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
            if (
              act.habitTitle?.toLowerCase().includes('entrenar') ||
              act.habitTitle?.toLowerCase().includes('gym')
            ) {
              actionIcon = <Dumbbell className="w-3.5 h-3.5 text-orange-400" />;
            } else if (
              act.habitTitle?.toLowerCase().includes('agua') ||
              act.habitTitle?.toLowerCase().includes('hidrata')
            ) {
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
                className="flex items-center justify-between gap-2 text-xs font-sans group hover:bg-zinc-900/40 p-1.5 rounded-xl border border-transparent hover:border-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                      {act.dateKey ? act.dateKey : 'Hoy'} • {timeFormatted}
                    </span>
                  </div>
                </div>

                {/* Evidence Photo Button */}
                {hasEvidence && matchingLog && onOpenEvidence && (
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(matchingLog, user as User, act.habitTitle)}
                    className="px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(6,182,212,0.15)] active:scale-95 cursor-pointer shrink-0"
                    title="Ver foto de evidencia en Google Drive"
                  >
                    <Camera className="w-3 h-3 text-cyan-400" />
                    <span>Foto</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
