'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Challenge, ChallengeMode } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { X, Trophy, Handshake, Calendar, Check, Sparkles, Trash2, AlertTriangle, Search, UserPlus, Users } from 'lucide-react';
import { getBogotaToday } from '@/lib/habitCalculations';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challengeData: Partial<Challenge>, initialHabitTitle?: string, invitedUserIds?: string[]) => void;
  onDelete?: (challengeId: string) => void;
  editingChallenge?: Challenge | null;
  users: User[];
  currentUser: User;
}

const EMOJI_OPTIONS = ['🏋️', '📚', '💧', '🏃', '🧘', '🎸', '🌙', '💻', '🧠', '🎯', '🥑', '⚡'];

// Cálculo seguro de días entre dos fechas inclusive (en UTC para evitar desajustes horarios)
const calculateDaysBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const start = new Date(`${startStr}T12:00:00Z`);
  const end = new Date(`${endStr}T12:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

// Proyección de fecha de finalización a partir de fecha de inicio y días
const calculateEndDate = (startStr: string, days: number): string => {
  if (!startStr) return '';
  const d = new Date(`${startStr}T12:00:00Z`);
  if (isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + Math.max(1, days) - 1);
  return d.toISOString().slice(0, 10);
};

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingChallenge,
  users,
  currentUser,
}) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏆');
  const [mode, setMode] = useState<ChallengeMode>('competitive');
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(getBogotaToday());
  const [endDate, setEndDate] = useState(() => calculateEndDate(getBogotaToday(), 30));
  const [habitTitle, setHabitTitle] = useState('Entrenar');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (editingChallenge) {
      setTitle(editingChallenge.title);
      setDescription(editingChallenge.description || '');
      setIcon(editingChallenge.icon || '🏆');
      setMode(editingChallenge.mode || 'competitive');
      const sDate = editingChallenge.startDate || getBogotaToday();
      const eDate =
        editingChallenge.endDate ||
        calculateEndDate(sDate, editingChallenge.durationDays || 30);
      setStartDate(sDate);
      setEndDate(eDate);
      const computedDuration =
        editingChallenge.durationDays || calculateDaysBetween(sDate, eDate);
      setDurationDays(computedDuration > 0 ? computedDuration : 30);
    } else {
      const today = getBogotaToday();
      setTitle('');
      setDescription('');
      setIcon('🏆');
      setMode('competitive');
      setStartDate(today);
      setEndDate(calculateEndDate(today, 30));
      setDurationDays(30);
      setHabitTitle('Entrenar');
      setSelectedUserIds([]); // No seleccionados por defecto a petición del usuario
      setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingChallenge, isOpen]);

  // Lista de usuarios disponibles para invitar (excluye al creador actual ya que es añadido automáticamente como owner)
  const availableUsers = useMemo(() => {
    return users.filter((u) => u.id !== currentUser.id && u.isActive !== false);
  }, [users, currentUser.id]);

  // Filtrado reactivo por nombre o correo
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter((u) => {
      const matchName = u.name ? u.name.toLowerCase().includes(q) : false;
      const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false;
      return matchName || matchEmail;
    });
  }, [availableUsers, searchQuery]);

  if (!isOpen || !mounted) return null;

  // Validación de fechas
  const isDateRangeInvalid = !startDate || !endDate || endDate < startDate;
  const isCustomDuration = ![7, 14, 21, 30].includes(durationDays);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;
    // Si la fecha fin queda anterior a la nueva fecha de inicio, la proyectamos con la duración actual
    if (!endDate || endDate < newStart) {
      setEndDate(calculateEndDate(newStart, durationDays || 30));
    } else {
      const newDays = calculateDaysBetween(newStart, endDate);
      if (newDays > 0) {
        setDurationDays(newDays);
      }
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (!newEnd || !startDate) return;
    if (newEnd >= startDate) {
      const newDays = calculateDaysBetween(startDate, newEnd);
      if (newDays > 0) {
        setDurationDays(newDays);
      }
    }
  };

  const handleSelectDuration = (days: number) => {
    setDurationDays(days);
    if (startDate) {
      setEndDate(calculateEndDate(startDate, days));
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isDateRangeInvalid) return;

    onSave(
      {
        id: editingChallenge?.id,
        title: title.trim(),
        description: description.trim(),
        icon,
        mode,
        durationDays: Math.max(1, durationDays),
        startDate,
        endDate,
        status: 'active',
        createdBy: editingChallenge?.createdBy || currentUser.id,
      },
      habitTitle.trim(),
      selectedUserIds
    );
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="font-mono font-bold text-white text-base">
              {editingChallenge ? 'Editar Reto' : 'Crear Nuevo Reto'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Title and Emoji */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Nombre del Reto *
            </label>
            <div className="flex items-center gap-2">
              <div className="text-2xl p-2 rounded-xl bg-zinc-900 border border-white/[0.08] shrink-0">
                {icon}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. 30 DÍAS GYM, Lectura Matriz..."
                required
                className="flex-1 bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Emoji Picker Row */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-400">Seleccionar icono</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                    icon === e
                      ? 'bg-cyan-500/30 border border-cyan-400 scale-110'
                      : 'bg-zinc-900/70 border border-white/[0.06] hover:bg-zinc-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Descripción / Reglas del Reto
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Entrenar al menos 5 veces por semana y registrar el progreso..."
              rows={2}
              className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl p-2.5 text-xs focus:outline-none transition-colors"
            />
          </div>

          {/* Mode Selector: Competitivo vs Colaborativo */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Modo del Reto *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('competitive')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'competitive'
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                    : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">Competitivo</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Leaderboard activo con ranking, medallas y posiciones.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('collaborative')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'collaborative'
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/30'
                    : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Handshake className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono">Colaborativo</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Enfocado en el progreso grupal sin enfatizar posiciones.
                </p>
              </button>
            </div>
          </div>

          {/* Duración y Fechas Personalizables */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-zinc-300">
                Duración y Fechas del Reto *
              </label>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {isDateRangeInvalid
                  ? '⚠️ Rango inválido'
                  : `${durationDays} ${durationDays === 1 ? 'día' : 'días'} de reto`}
              </span>
            </div>

            {/* Atajos Rápidos de Duración */}
            <div className="flex flex-wrap gap-1.5">
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSelectDuration(days)}
                  className={`flex-1 min-w-[60px] py-1.5 text-xs font-mono font-bold rounded-xl border transition-all ${
                    durationDays === days
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {days}d
                </button>
              ))}
              {isCustomDuration && (
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl border bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Personalizado ({durationDays}d)</span>
                </button>
              )}
            </div>

            {/* Selectores de Fechas en 2 Columnas Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 block">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 block">
                  Fecha de Finalización *
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  required
                  className={`w-full bg-zinc-900/90 border text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors ${
                    isDateRangeInvalid
                      ? 'border-rose-500/70 text-rose-300 focus:border-rose-500'
                      : 'border-white/[0.08] focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Alerta de Validación o Resumen del Rango */}
            {isDateRangeInvalid ? (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>La fecha de finalización debe ser igual o posterior a la fecha de inicio.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-white/[0.04] text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Período:</span>
                </div>
                <span className="text-zinc-300 font-medium">
                  {startDate} al {endDate}
                </span>
              </div>
            )}
          </div>

          {/* Primary Activity / Commitment Title (if new) */}
          {!editingChallenge && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-zinc-300 block">
                Compromiso / Actividad Diaria del Reto *
              </label>
              <input
                type="text"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                placeholder="Ej. Entrenar en el Gym, 10k pasos, Lectura técnica..."
                required
                className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          )}

          {/* Invite Members (Only on new challenge creation) */}
          {!editingChallenge && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-medium text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invitar Participantes</span>
                  {selectedUserIds.length > 0 && (
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      ({selectedUserIds.length} {selectedUserIds.length === 1 ? 'invitado' : 'invitados'})
                    </span>
                  )}
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  Tú ({currentUser.name}) ya estás incluido
                </span>
              </div>

              {/* Chips de usuarios seleccionados */}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 max-h-24 overflow-y-auto custom-scrollbar">
                  {selectedUserIds.map((userId) => {
                    const u = users.find((user) => user.id === userId);
                    if (!u) return null;
                    return (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono"
                      >
                        <span className="w-4 h-4 rounded-full bg-cyan-800 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                          {u.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="truncate max-w-[130px]">{u.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleUserSelection(u.id)}
                          className="text-cyan-400 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                          title={`Quitar a ${u.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Buscador de usuarios por nombre o correo */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo (ej. pepe, nancy@...)"
                  className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl pl-8 pr-8 py-2 text-xs focus:outline-none transition-colors font-mono placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lista filtrada de compañeros disponibles */}
              <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-3 text-xs font-mono text-zinc-500 bg-zinc-900/30 rounded-xl border border-white/[0.04]">
                    {searchQuery ? `No se encontraron participantes con "${searchQuery}"` : 'No hay otros compañeros disponibles para invitar.'}
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUserSelection(u.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                            : 'bg-zinc-900/40 hover:bg-zinc-900/90 border-white/[0.04] text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? 'bg-cyan-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 text-zinc-300 border border-white/[0.08]'
                            }`}
                          >
                            {u.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="font-medium truncate leading-tight">{u.name}</span>
                            {u.email && (
                              <span className="text-[10px] font-mono text-zinc-500 truncate leading-tight">
                                {u.email}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 ml-2">
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1">
                              <Check className="w-3 h-3 text-cyan-400" />
                              <span>Invitado</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 text-[10px] font-mono flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              <span>Invitar</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
            {editingChallenge && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Estás seguro de que deseas eliminar el reto "${editingChallenge.title}"?`
                    )
                  ) {
                    onDelete(editingChallenge.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Eliminar Reto</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isDateRangeInvalid || !title.trim()}
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isDateRangeInvalid || !title.trim()
                    ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border border-white/[0.06]'
                    : 'text-zinc-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer'
                }`}
              >
                {editingChallenge ? 'Guardar Cambios' : 'Crear Reto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
