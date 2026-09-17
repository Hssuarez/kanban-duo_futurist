'use client';

import confetti from 'canvas-confetti';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, User, TaskStatus } from '@/lib/types';
import { isTaskOverdue, isTaskDueToday, formatDueDateBadge } from '@/lib/dateUtils';
import {
  Calendar,
  CheckCircle2,
  Play,
  RotateCcw,
  Trash2,
  Edit3,
  User as UserIcon,
  Clock,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Zap,
  Tag as TagIcon,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  users: User[];
  currentUser: User;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onSelectTag?: (tag: string) => void;
  onStartFocus?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  currentUser,
  onEdit,
  onDelete,
  onMoveStatus,
  onDragStart,
  onSelectTag,
  onStartFocus,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canTilt, setCanTilt] = useState(false);
  const [completionWaveOrigin, setCompletionWaveOrigin] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const assignee = users.find((u) => u.id === task.assignedTo);
  const isAssignedToMe = task.assignedTo === currentUser.id;

  // Elapsed time calculation
  const elapsedBadge = useMemo(() => {
    if (!task.createdAt) return null;
    const created = new Date(task.createdAt).getTime();
    if (isNaN(created)) return null;
    const diffMs = Date.now() - created;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }, [task.createdAt]);

  // Stagnation visual cue: task in 'trabajando' for >= 5 days
  const isStagnant = useMemo(() => {
    if (task.status !== 'trabajando' || !task.createdAt) return false;
    const refDate = task.startedAt ? new Date(task.startedAt).getTime() : new Date(task.createdAt).getTime();
    if (isNaN(refDate)) return false;
    const diffDays = (Date.now() - refDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 5;
  }, [task.status, task.startedAt, task.createdAt]);

  // Subtask progress stats
  const subtaskStats = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((s) => s.completed).length;
    const total = task.subtasks.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent, isAllDone: completed === total };
  }, [task.subtasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setCanTilt(hasFinePointer && !prefersReducedMotion);
    }
  }, []);

  const priorityConfigs = {
    alta: {
      label: 'Alta',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    media: {
      label: 'Media',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    baja: {
      label: 'Baja',
      badge: 'bg-zinc-800 text-zinc-300 border-white/[0.06]',
      dot: 'bg-zinc-400',
    },
  };

  const priorityKey = (task.priority in priorityConfigs ? task.priority : 'media') as keyof typeof priorityConfigs;
  const currentPriority = priorityConfigs[priorityKey];

  const overdue = isTaskOverdue(task.dueDate, task.status);
  const dueToday = isTaskDueToday(task.dueDate, task.status);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    if (canTilt && !isDragging) {
      const normX = x / rect.width - 0.5;
      const normY = y / rect.height - 0.5;
      const tiltX = -normY * 2.4;
      const tiltY = normX * 2.4;
      card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;
    setIsCompleting(true);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCompletionWaveOrigin({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    confetti({
      particleCount: 28,
      spread: 50,
      origin: { y: 0.65 },
      colors: ['#10b981', '#34d399', '#06b6d4'],
    });

    setTimeout(() => {
      onMoveStatus(task.id, 'finalizado');
      setIsCompleting(false);
      setCompletionWaveOrigin(null);
    }, 380);
  };

  return (
    <div
      ref={cardRef}
      draggable
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDragStart={(e) => {
        setIsDragging(true);
        if (cardRef.current) {
          cardRef.current.style.setProperty('--tilt-x', '0deg');
          cardRef.current.style.setProperty('--tilt-y', '0deg');
        }
        onDragStart(e, task.id);
        (e.currentTarget as HTMLElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        (e.currentTarget as HTMLElement).classList.remove('dragging');
      }}
      className={`group relative bg-[#070c18]/85 hover:bg-[#0c1324]/95 border ${
        task.status === 'trabajando'
          ? 'border-amber-500/25 shadow-[0_4px_20px_rgba(245,158,11,0.06)]'
          : 'border-white/[0.08]'
      } hover:border-cyan-500/35 rounded-xl p-3.5 shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.08)] hover:-translate-y-0.5 hover:ring-1 hover:ring-cyan-500/25 hover:z-10 transition-[background-color,border-color,box-shadow] duration-150 cursor-grab active:cursor-grabbing font-sans select-none overflow-hidden card-micro-tilt ${
        isCompleting
          ? 'animate-card-complete bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
          : ''
      } ${isDragging ? 'shadow-2xl border-cyan-500/50' : ''}`}
    >
      {/* Aceternity Spotlight: Smooth Cursor-Tracking Radial Halo (GPU Accelerated) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: 'radial-gradient(220px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), rgba(255, 255, 255, 0.06), transparent 80%)',
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-cyan-400/25 z-0"
        style={{
          maskImage: 'radial-gradient(160px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(160px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 30%, transparent 80%)',
        }}
      />

      {/* Energy Completion Wave */}
      {isCompleting && completionWaveOrigin && (
        <span
          className="pointer-events-none absolute w-32 h-32 rounded-full bg-emerald-400/25 border border-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-completion-wave -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${completionWaveOrigin.x}px`, top: `${completionWaveOrigin.y}px` }}
        />
      )}

      {/* Activity Filament for TRABAJANDO (living subtle traveling point along 1px bottom border) */}
      {task.status === 'trabajando' && (
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500/10 via-amber-500/25 to-cyan-500/10 overflow-hidden pointer-events-none rounded-b-xl z-10">
          <div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-filament opacity-95 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
          <div
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-filament opacity-80 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            style={{ animationDelay: '1.9s' }}
          />
        </div>
      )}
      {/* Top Meta: Priority & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${currentPriority.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot}`} />
            {currentPriority.label}
          </span>
          {task.status === 'trabajando' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-working-halo" />
              En curso
            </span>
          )}
          {isStagnant ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-950/50 border border-rose-500/40 px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse"
              title="Esta tarea lleva más de 5 días en progreso sin completarse"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
              Estancada ({elapsedBadge})
            </span>
          ) : elapsedBadge && task.status !== 'finalizado' ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 border border-white/[0.06] px-1.5 py-0.2 rounded"
              title={`Antigüedad: ${elapsedBadge}`}
            >
              <Clock className="w-2.5 h-2.5 text-zinc-500" />
              {elapsedBadge}
            </span>
          ) : null}
        </div>

        {/* Action icons or inline confirm */}
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1 text-[11px] animate-fade-in">
            <span className="text-zinc-400">¿Eliminar?</span>
            <button
              onClick={() => onDelete(task.id)}
              className="text-rose-400 hover:text-rose-300 font-semibold px-1 py-0.5 rounded hover:bg-rose-950/40 transition-colors"
            >
              Sí
            </button>
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="text-zinc-400 hover:text-zinc-200 px-1 py-0.5 rounded hover:bg-zinc-800 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => onEdit(task)}
              title="Editar tarea"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors active:scale-[0.94]"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsConfirmingDelete(true)}
              title="Eliminar tarea"
              className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors active:scale-[0.94]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h3 className="font-semibold text-zinc-100 text-sm leading-snug mb-1 group-hover:text-white transition-colors">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags Chips */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.map((tg) => (
            <button
              key={tg}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag?.(tg);
              }}
              title={`Filtrar por ${tg}`}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/70 transition-all cursor-pointer"
            >
              <TagIcon className="w-2.5 h-2.5 text-cyan-400" />
              <span>{tg}</span>
            </button>
          ))}
        </div>
      )}

      {/* Subtasks Progress HUD Bar */}
      {subtaskStats && (
        <div className="mb-2.5 p-2 rounded-lg bg-zinc-950/60 border border-white/[0.05] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-400 flex items-center gap-1">
              <CheckSquare className="w-2.5 h-2.5 text-cyan-400" />
              Subtareas
            </span>
            <span
              className={
                subtaskStats.isAllDone
                  ? 'text-emerald-400 font-bold'
                  : 'text-zinc-300 font-semibold'
              }
            >
              {subtaskStats.completed}/{subtaskStats.total} ({subtaskStats.percent}%)
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                subtaskStats.isAllDone
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              }`}
              style={{ width: `${subtaskStats.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Task Footer: Assignee, Indicators & Due Date */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
        {/* Assignee & Indicators */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {assignee?.avatar ? (
              <img
                src={assignee.avatar}
                alt={assignee.name}
                className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <UserIcon className="w-2.5 h-2.5" />
              </div>
            )}
            <span
              className={`text-[11px] truncate max-w-[80px] ${
                isAssignedToMe ? 'text-zinc-200 font-medium' : 'text-zinc-400'
              }`}
            >
              {isAssignedToMe ? 'Tú' : assignee?.name?.split(' ')[0] || 'Sin asignar'}
            </span>
          </div>

          {/* Indicators: Comments & Attachments */}
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono shrink-0">
            {task.comments && task.comments.length > 0 && (
              <span
                className="flex items-center gap-0.5 text-amber-400/90"
                title={`${task.comments.length} notas internas`}
              >
                <MessageSquare className="w-2.5 h-2.5" />
                {task.comments.length}
              </span>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <span
                className="flex items-center gap-0.5 text-blue-400/90"
                title={`${task.attachments.length} recursos adjuntos`}
              >
                <Paperclip className="w-2.5 h-2.5" />
                {task.attachments.length}
              </span>
            )}
          </div>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors shrink-0 ${
              overdue
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                : dueToday
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-zinc-800/80 text-zinc-400 border border-white/[0.04]'
            }`}
            title={overdue ? 'Tarea vencida' : dueToday ? 'Vence hoy' : 'Fecha límite'}
          >
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{formatDueDateBadge(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Quick Move Status Shortcuts */}
      <div className="mt-2.5 pt-2 border-t border-dashed border-white/[0.06] flex items-center gap-1.5 justify-end">
        {task.status === 'iniciado' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onMoveStatus(task.id, 'trabajando')}
              className="flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-md transition-all active:scale-[0.96]"
              title="Mover a Trabajando"
            >
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              Iniciar
            </button>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-all active:scale-[0.95] ${
                isCompleting
                  ? 'bg-emerald-500 text-white font-semibold ring-2 ring-emerald-400/50 shadow-md scale-95'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40'
              }`}
              title="Marcar como finalizada directamente"
            >
              <CheckCircle2 className={`w-3 h-3 ${isCompleting ? 'text-white' : 'text-emerald-400'}`} />
              <span>{isCompleting ? '¡Lista!' : 'Completar'}</span>
            </button>
          </div>
        )}

        {task.status === 'trabajando' && (
          <>
            {onStartFocus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(task);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-md transition-all active:scale-[0.96] cursor-pointer"
                title="Iniciar sesión Pomodoro (25 min de enfoque puro)"
              >
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Enfocar
              </button>
            )}
            <button
              onClick={() => onMoveStatus(task.id, 'iniciado')}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded-md transition-colors active:scale-[0.96]"
              title="Pausar y volver a Iniciado"
            >
              <RotateCcw className="w-3 h-3" />
              Pausar
            </button>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md transition-all active:scale-[0.95] ${
                isCompleting
                  ? 'bg-emerald-500 text-white font-semibold ring-2 ring-emerald-400/50 shadow-md scale-95'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 transition-transform ${isCompleting ? 'text-white scale-110' : 'text-emerald-400'}`} />
              <span>{isCompleting ? '¡Completada!' : 'Completar'}</span>
            </button>
          </>
        )}

        {task.status === 'finalizado' && (
          <button
            onClick={() => onMoveStatus(task.id, 'trabajando')}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded-md transition-colors active:scale-[0.96]"
          >
            <RotateCcw className="w-3 h-3" />
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
};
