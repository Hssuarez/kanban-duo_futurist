'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Task, ActivityLog } from '@/lib/types';
import { subscribeToPresence } from '@/lib/presence';
import { Activity, Clock, Sparkles, ChevronDown, ChevronUp, Radio, Users } from 'lucide-react';

interface PeerActivityBarProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  logs: ActivityLog[];
}

export const PeerActivityBar: React.FC<PeerActivityBarProps> = ({
  currentUser,
  users,
  tasks,
  logs,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPresence((ids) => {
      setOnlineUserIds(ids);
    });
    return () => unsubscribe();
  }, []);

  const peers = useMemo(() => {
    return users.filter((u) => u.id !== currentUser.id);
  }, [users, currentUser]);

  const isSoloMode = peers.length === 0;

  const peerUser = peers.find((p) => p.id === selectedPeerId) || peers[0];
  const isOnline = Boolean(peerUser && onlineUserIds.includes(peerUser.id));

  const peerWorkingTasks = useMemo(() => {
    if (!peerUser) return [];
    return tasks.filter((t) => t.assignedTo === peerUser.id && t.status === 'trabajando');
  }, [tasks, peerUser]);

  const activeTask = peerWorkingTasks[0];

  // Solo mode indicators
  const myWorkingTasks = useMemo(() => {
    return tasks.filter((t) => t.assignedTo === currentUser.id && t.status === 'trabajando');
  }, [tasks, currentUser.id]);
  const myActiveTask = myWorkingTasks[0];
  const myCompletedCount = useMemo(() => {
    return tasks.filter((t) => t.assignedTo === currentUser.id && t.status === 'finalizado').length;
  }, [tasks, currentUser.id]);

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'HACE UN MOMENTO';
    if (diffMins < 60) return `HACE ${diffMins}M`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `HACE ${diffHours}H`;
    return `HACE ${Math.floor(diffHours / 24)}D`;
  };

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl overflow-hidden mb-6 font-sans transition-colors shadow-sm">
      {/* Main Focus Strip */}
      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {isSoloMode ? (
          /* Solo Autonomous Focus Mode */
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-zinc-950 rounded-full bg-cyan-400 animate-living-signal"
                title="Modo Enfoque Activo"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-100 text-xs sm:text-sm">{currentUser.name}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                  Modo Enfoque Individual
                </span>
              </div>
              {myActiveTask ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
                    <Clock className="w-3 h-3 text-amber-400" />
                    En curso:
                  </span>
                  <span className="text-xs font-medium text-zinc-200 line-clamp-1">
                    "{myActiveTask.title}"
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <span>Inicia una tarea en el tablero para activar el modo de productividad.</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Collaborative Peer Bar */
          <div className="flex items-center gap-3">
            {/* Peer Avatar with quiet presence indicator */}
            <div className="relative shrink-0">
              <img
                src={peerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={peerUser?.name}
                className={`w-10 h-10 rounded-full object-cover ring-1 transition-all ${
                  isOnline
                    ? 'ring-emerald-500/50'
                    : 'ring-zinc-700/80 opacity-70'
                }`}
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-zinc-950 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-living-signal' : 'bg-zinc-600'
                }`}
                title={isOnline ? 'En línea' : 'Desconectado'}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  {peers.length > 1 ? (
                    <select
                      value={peerUser?.id}
                      onChange={(e) => setSelectedPeerId(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-md px-2 py-0.5 focus:outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      {peers.map((p) => (
                        <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-100">
                          {p.name} {onlineUserIds.includes(p.id) ? '● En línea' : '○ Offline'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-zinc-200">{peerUser?.name || 'Compañero'}</span>
                  )}
                </div>

                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-living-signal"></span> En línea
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Desconectado
                  </span>
                )}
              </div>

              {activeTask ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Trabajando en:
                  </span>
                  <span className="text-xs font-medium text-zinc-200 line-clamp-1">
                    "{activeTask.title}"
                  </span>
                  {peerWorkingTasks.length > 1 && (
                    <span className="text-[11px] text-zinc-500 font-normal shrink-0">
                      (+{peerWorkingTasks.length - 1} en cola)
                    </span>
                  )}
                </div>
              ) : isOnline ? (
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                  Sin tareas en progreso en este momento.
                </p>
              ) : (
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <span>{peerUser?.lastLogin ? `Última sesión: ${formatTimeAgo(peerUser.lastLogin)}` : 'Desconectado'}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Activity feed toggle button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {isSoloMode && (
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block mr-1">
              <span className="text-emerald-400 font-semibold">{myCompletedCount}</span> finalizadas
            </span>
          )}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.98]"
          >
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span>Actividad ({logs.length})</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>

      {/* Collapsible Activity Logs */}
      {showLogs && (
        <div className="border-t border-white/[0.06] bg-zinc-950/40 p-3.5 max-h-56 overflow-y-auto">
          <h4 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Historial de actividad en tiempo real
          </h4>
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No hay registros de actividad aún.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] hover:border-white/[0.08] transition-colors gap-1 sm:gap-2"
                >
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-medium text-zinc-200">{log.userName}</span>
                    <span className="text-zinc-500">{log.action}</span>
                    <span className="font-medium text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-xs">
                      "{log.taskTitle}"
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0 self-end sm:self-auto">
                    {formatTimeAgo(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
