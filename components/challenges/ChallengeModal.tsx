'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Challenge, ChallengeMode } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { X, Trophy, Handshake, Calendar, Check, Sparkles, Trash2 } from 'lucide-react';
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
  const [habitTitle, setHabitTitle] = useState('Entrenar');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingChallenge) {
      setTitle(editingChallenge.title);
      setDescription(editingChallenge.description || '');
      setIcon(editingChallenge.icon || '🏆');
      setMode(editingChallenge.mode || 'competitive');
      setDurationDays(editingChallenge.durationDays || 30);
      setStartDate(editingChallenge.startDate || getBogotaToday());
    } else {
      setTitle('');
      setDescription('');
      setIcon('🏆');
      setMode('competitive');
      setDurationDays(30);
      setStartDate(getBogotaToday());
      setHabitTitle('Entrenar');
      setSelectedUserIds(users.map((u) => u.id));
    }
  }, [editingChallenge, isOpen, users]);

  if (!isOpen || !mounted) return null;

  // Calcular fecha de fin según duración
  const calculateEndDate = (start: string, days: number) => {
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days - 1);
    return d.toISOString().slice(0, 10);
  };

  const handleSelectDuration = (days: number) => {
    setDurationDays(days);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const endDate = calculateEndDate(startDate, durationDays);

    onSave(
      {
        id: editingChallenge?.id,
        title: title.trim(),
        description: description.trim(),
        icon,
        mode,
        durationDays,
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

          {/* Duration Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Duración del Reto
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSelectDuration(days)}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                    durationDays === days
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {days} días
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
            />
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

          {/* Invite Members */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Participantes Iniciales
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUserSelection(u.id)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                        : 'bg-zinc-900/40 border-white/[0.06] text-zinc-500 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold">
                      {u.name.slice(0, 1)}
                    </div>
                    <span>{u.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

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
                className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
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
