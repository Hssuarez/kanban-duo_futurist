'use client';

import React, { useState } from 'react';
import { Check, Minus } from 'lucide-react';
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
    if (isFuture) return; // No permitir check-in en días futuros

    // Háptico en móvil si está soportado
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

    // Menú rápido con clic derecho para alternar 'not_applicable' o 'completed'
    if (status === 'not_applicable') {
      onSetStatus(habit.id, dateKey, 'completed');
    } else {
      onSetStatus(habit.id, dateKey, 'not_applicable');
    }
  };

  const isCompleted = status === 'completed';
  const isNotApplicable = status === 'not_applicable' || status === 'skipped';

  // Configuración de estilo según estado
  let cellStyle = 'bg-zinc-950/70 border-white/[0.07] text-zinc-600 hover:border-cyan-500/40 hover:bg-zinc-900/80';

  if (isCompleted) {
    cellStyle = 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]';
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
      title={`${habit.title} · ${dateKey} (${isCompleted ? 'Completado' : isNotApplicable ? 'No aplica' : isFuture ? 'Día futuro' : 'Pendiente - Clic para marcar'})`}
      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all duration-150 select-none ${cellStyle} ${
        animating ? 'scale-110 ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]' : 'active:scale-95'
      } ${isToday && !isCompleted ? 'ring-1 ring-cyan-400/40' : ''}`}
    >
      {/* Indicador visual de estado */}
      {isCompleted ? (
        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 stroke-[3] animate-scale-in" />
      ) : isNotApplicable ? (
        <Minus className="w-3 h-3 text-zinc-500 stroke-[2.5]" />
      ) : (
        <span className="w-1 h-1 rounded-full bg-zinc-700 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
};
