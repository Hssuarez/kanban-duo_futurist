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
    const list = users.filter((u) => u.id !== currentUser.id);
    return list.length > 0 ? list : users;
  }, [users, currentUser]);

  const peerUser = peers.find((p) => p.id === selectedPeerId) || peers[0] || users[0];
  const isOnline = Boolean(peerUser && onlineUserIds.includes(peerUser.id));

  const peerWorkingTasks = tasks.filter(
    (t) => t.assignedTo === peerUser?.id && t.status === 'trabajando'
  );

  const activeTask = peerWorkingTasks[0];

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
    <div className="bg-[#0b0e18]/90 border border-cyan-500/30 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.6)] overflow-hidden mb-6 font-mono">
      {/* Main Focus Strip */}
      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0b0e18] via-[#101424] to-[#0d1527]">
        <div className="flex items-center gap-3">
          {/* Peer Avatar with real active pulse or offline indicator */}
          <div className="relative shrink-0">
            <img
              src={peerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={peerUser?.name}
              className={`w-11 h-11 rounded-xl object-cover ring-2 transition-all ${
                isOnline
                  ? 'ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'ring-slate-700/80 grayscale-[30%] opacity-80'
              }`}
            />
            {isOnline ? (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0b0e18] rounded-full shadow-[0_0_8px_#10b981]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </span>
            ) : (
              <span
                title="Usuario desconectado"
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-600 border-2 border-[#0b0e18] rounded-full"
              ></span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                <Radio className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>TELEMETRÍA //</span>
                {peers.length > 1 ? (
                  <select
                    value={peerUser?.id}
                    onChange={(e) => setSelectedPeerId(e.target.value)}
                    className="bg-[#0e121e] border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase rounded px-1.5 py-0.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {peers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0e121e] text-white">
                        {p.name.toUpperCase()} {onlineUserIds.includes(p.id) ? '● EN LÍNEA' : '○ OFFLINE'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{peerUser?.name?.toUpperCase()}</span>
                )}
              </div>

              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LINK_STABLE // EN LÍNEA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900/80 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> OFFLINE // DESCONECTADO
                </span>
              )}
            </div>

            {activeTask ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0">
                  <Clock className="w-3 h-3 animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
                  EJECUTANDO AHORA:
                </span>
                <span className="text-xs font-bold text-slate-200 line-clamp-1 tracking-wide">
                  "{activeTask.title}"
                </span>
                {peerWorkingTasks.length > 1 && (
                  <span className="text-[10px] text-cyan-400/80 font-normal shrink-0">
                    (+{peerWorkingTasks.length - 1} en cola)
                  </span>
                )}
              </div>
            ) : isOnline ? (
              <p className="text-xs text-slate-400 mt-1 italic flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                En línea pero sin tareas en estado activo actualmente.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1 italic flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                Operador desconectado.{peerUser?.lastLogin ? ` Última sesión: ${formatTimeAgo(peerUser.lastLogin)}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Activity feed toggle button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] uppercase tracking-wider"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>LOGS ({logs.length})</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Collapsible Activity Logs */}
      {showLogs && (
        <div className="border-t border-cyan-500/20 bg-[#080b14]/90 p-4 max-h-56 overflow-y-auto">
          <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            HISTORIAL DE ACCIONES EN TIEMPO REAL
          </h4>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay registros de actividad aún.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#0e1220] border border-slate-800 hover:border-cyan-500/30 transition-colors gap-1 sm:gap-2"
                >
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4] shrink-0"></span>
                    <span className="font-bold text-cyan-300">{log.userName}</span>
                    <span className="text-slate-400">{log.action}</span>
                    <span className="font-bold text-white bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-xs">
                      "{log.taskTitle}"
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 self-end sm:self-auto">
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
