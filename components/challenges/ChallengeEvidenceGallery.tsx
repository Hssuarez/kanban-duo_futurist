'use client';

import React, { useState, useMemo } from 'react';
import { Challenge, ChallengeMember, ChallengeHabit, ChallengeLog } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import {
  Camera,
  Filter,
  ArrowUpDown,
  Calendar,
  Sparkles,
  Maximize2,
  ExternalLink,
  MessageSquare,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

interface ChallengeEvidenceGalleryProps {
  challenge: Challenge;
  members: ChallengeMember[];
  users: User[];
  habits: ChallengeHabit[];
  logs: ChallengeLog[];
  currentUser: User;
  onOpenEvidence: (log: ChallengeLog, user: User, habitTitle?: string) => void;
  onGoToMatrix?: () => void;
}

export const ChallengeEvidenceGallery: React.FC<ChallengeEvidenceGalleryProps> = ({
  challenge,
  members,
  users,
  habits,
  logs,
  currentUser,
  onOpenEvidence,
  onGoToMatrix,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filtrar solo los logs de este reto que tengan evidencia fotográfica
  const evidenceLogs = useMemo(() => {
    return logs.filter(
      (l) => l.challengeId === challenge.id && (Boolean(l.evidenceUrl) || Boolean(l.evidenceFileId))
    );
  }, [logs, challenge.id]);

  // Lista de usuarios participantes mapeados
  const memberUsers = useMemo(() => {
    const userMap = new Map<string, User>();
    members.forEach((m) => {
      const u = users.find((user) => user.id === m.userId);
      if (u) {
        userMap.set(u.id, u);
      } else {
        userMap.set(m.userId, {
          id: m.userId,
          name: 'Compañero',
          email: '',
          avatar: '',
          color: '#06b6d4',
          role: 'member',
          passwordHash: '',
          isActive: true,
          createdAt: '',
        });
      }
    });
    return Array.from(userMap.values());
  }, [members, users]);

  // Logs filtrados y ordenados
  const filteredAndSortedLogs = useMemo(() => {
    let list = evidenceLogs.filter((l) => {
      if (selectedUserId !== 'all' && l.userId !== selectedUserId) return false;
      if (selectedHabitId !== 'all' && l.challengeHabitId !== selectedHabitId) return false;
      return true;
    });

    list.sort((a, b) => {
      const dateA = a.evidenceUploadedAt || a.dateKey;
      const dateB = b.evidenceUploadedAt || b.dateKey;
      if (sortOrder === 'newest') {
        return dateB.localeCompare(dateA);
      }
      return dateA.localeCompare(dateB);
    });

    return list;
  }, [evidenceLogs, selectedUserId, selectedHabitId, sortOrder]);

  return (
    <div className="space-y-5 font-sans animate-fade-in">
      {/* 1. Barra de Herramientas y Filtros HUD */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wider">
                  Muro de Evidencias
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                  {filteredAndSortedLogs.length}{' '}
                  {filteredAndSortedLogs.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Registro fotográfico de hábitos almacenado en Google Drive
              </p>
            </div>
          </div>

          {/* Selector de Orden */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-cyan-400" />
              <span>Orden:</span>
            </span>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="text-xs font-mono px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              {sortOrder === 'newest' ? 'Más recientes primero' : 'Más antiguas primero'}
            </button>
          </div>
        </div>

        {/* Filtros por Participante y Hábito */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs font-mono">
          {/* Filtro por Miembro */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Filtrar por participante
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-zinc-950 border border-white/[0.1] rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="all">Todos los participantes ({evidenceLogs.length})</option>
              {memberUsers.map((u) => {
                const count = evidenceLogs.filter((l) => l.userId === u.id).length;
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({count} {count === 1 ? 'foto' : 'fotos'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtro por Hábito */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Filtrar por hábito
            </label>
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="w-full bg-zinc-950 border border-white/[0.1] rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="all">Todos los hábitos</option>
              {habits.map((h) => {
                const count = evidenceLogs.filter((l) => l.challengeHabitId === h.id).length;
                return (
                  <option key={h.id} value={h.id}>
                    {h.icon || '🎯'} {h.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedUserId !== 'all' || selectedHabitId !== 'all') && (
            <div className="sm:col-span-2 flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId('all');
                  setSelectedHabitId('all');
                }}
                className="text-xs font-mono text-cyan-300 hover:text-white px-3 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Cuadrícula de Evidencias */}
      {filteredAndSortedLogs.length === 0 ? (
        <div className="rounded-2xl bg-[#070c18]/80 border border-white/[0.08] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold font-mono text-white">
              {evidenceLogs.length === 0
                ? 'Aún no hay fotos en este reto'
                : 'No se encontraron fotos con los filtros seleccionados'}
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              {evidenceLogs.length === 0
                ? 'Los miembros del reto pueden subir fotos de sus hábitos haciendo clic en el icono de cámara 📷 dentro de las celdas de la Matriz de Consistencia.'
                : 'Prueba cambiando el participante o hábito seleccionado para ver más evidencias.'}
            </p>
          </div>

          {evidenceLogs.length === 0 && onGoToMatrix && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToMatrix}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
              >
                Ir a la Matriz de Consistencia
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedLogs.map((log) => {
            const author =
              users.find((u) => u.id === log.userId) || {
                id: log.userId,
                name: 'Compañero',
                username: 'user',
                role: 'user',
                avatar: '',
              };
            const habit = habits.find((h) => h.id === log.challengeHabitId);
            const imageUrl =
              log.evidenceUrl ||
              (log.evidenceFileId
                ? `/api/drive/file/${encodeURIComponent(log.evidenceFileId)}`
                : null);

            return (
              <div
                key={log.id}
                onClick={() => onOpenEvidence(log, author as User, habit?.title)}
                className="group bg-[#070c18]/90 border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col cursor-pointer select-none relative hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
              >
                {/* Header de Tarjeta: Autor + Hábito */}
                <div className="p-3 flex items-center justify-between gap-2 border-b border-white/[0.04] bg-zinc-950/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/[0.1] overflow-hidden flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                      {'avatar' in author && author.avatar ? (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        author.name.slice(0, 1)
                      )}
                    </div>
                    <span className="text-xs font-mono font-medium text-zinc-200 truncate">
                      {author.name}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/[0.06] text-cyan-300 shrink-0 flex items-center gap-1">
                    <span>{habit?.icon || '🎯'}</span>
                    <span className="truncate max-w-[80px]">{habit?.title || 'Hábito'}</span>
                  </span>
                </div>

                {/* Contenedor de Imagen */}
                <div className="aspect-[4/3] w-full bg-black/80 relative overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Evidencia ${habit?.title || 'Reto'}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center p-4 text-zinc-600 font-mono text-xs">
                      Sin archivo disponible
                    </div>
                  )}

                  {/* Overlay en Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm border border-cyan-500/30">
                      <Maximize2 className="w-3 h-3" />
                      <span>Inspeccionar</span>
                    </span>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Drive</span>
                    </span>
                  </div>
                </div>

                {/* Footer de Tarjeta: Fecha y Notas */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between bg-zinc-950/40">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>{log.dateKey}</span>
                    </span>
                    {log.evidenceUploadedAt && (
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.evidenceUploadedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-xs text-zinc-300 font-sans line-clamp-2 italic bg-black/30 p-1.5 rounded-lg border border-white/[0.04]">
                      &ldquo;{log.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
