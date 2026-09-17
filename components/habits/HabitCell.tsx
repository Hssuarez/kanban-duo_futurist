'use client';

import React, { useState } from 'react';
import { Check, Slash, X } from 'lucide-react';
import { Habit, HabitLogStatus } from '@/lib/habitTypes';

interface HabitCellProps {
  habit: Habit;
  dateKey: string;
  dayNumber: number;
  status?: HabitLogStatus;
  isToday: boolean;
  isFuture: boolean;
  onToggle: (habitId: string, dateKey: string) => void;
  onSetStatus?: (habitId: string, dateKey: string, status: HabitLogStatus) => void;
}

export const HabitCell: React.FC<HabitCellProps> = ({
  habit,
  dateKey,
  dayNumber,
  status,
  isToday,
  isFuture,
  onToggle,
  onSetStatus,
}) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFuture) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {}
    }

    setAnimating(true);
    setTimeout(() => setAnimating(false), 260);

    onToggle(habit.id, dateKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFuture || !onSetStatus) return;

    // Clic derecho cicla entre: completed -> failed -> skipped -> not_applicable -> empty
    if (!status || status === 'completed') {
      onSetStatus(habit.id, dateKey, 'failed');
    } else if (status === 'failed') {
      onSetStatus(habit.id, dateKey, 'skipped');
    } else if (status === 'skipped') {
      onSetStatus(habit.id, dateKey, 'not_applicable');
    } else {
      onToggle(habit.id, dateKey); // vuelve al estado base
    }
  };

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isSkipped = status === 'skipped';
  const isNotApplicable = status === 'not_applicable';

  // Configuración de estilo de celda según el diseño HUD
  let cellStyle = 'bg-zinc-950/70 border-white/[0.08] text-zinc-600 hover:border-cyan-500/40 hover:bg-zinc-900/80';

  if (isCompleted) {
    cellStyle = 'bg-teal-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.35)]';
  } else if (isFailed) {
    cellStyle = 'bg-rose-500/30 border-rose-500/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
  } else if (isSkipped) {
    cellStyle = 'bg-amber-500/25 border-amber-500/70 text-amber-300';
  } else if (isNotApplicable) {
    cellStyle = 'bg-zinc-900/40 border-dashed border-white/[0.12] text-zinc-500';
  } else if (isFuture) {
    cellStyle = 'bg-zinc-950/30 border-white/[0.03] text-zinc-700 opacity-40 cursor-not-allowed';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isFuture}
      title={`${habit.title} · ${dateKey} (${
        isCompleted
          ? 'Completado'
          : isFailed
          ? 'Fallido'
          : isSkipped
          ? 'Omitido / Parcial'
          : isNotApplicable
          ? 'No aplica'
          : isFuture
          ? 'Día futuro'
          : 'Pendiente - Clic para marcar, clic derecho para opciones'
      })`}
      className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center transition-all duration-150 select-none ${cellStyle} ${
        animating ? 'scale-110 ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]' : 'active:scale-95'
      }`}
    >
      {isCompleted ? (
        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 stroke-[3] animate-scale-in" />
      ) : isFailed ? (
        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-300 stroke-[2.5]" />
      ) : isSkipped ? (
        <Slash className="w-3 h-3 text-amber-400 stroke-[2.5]" />
      ) : isNotApplicable ? (
        <span className="w-2 h-0.5 bg-zinc-600 rounded-full" />
      ) : (
        <span className="w-1 h-1 rounded-sm bg-zinc-800 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
};
