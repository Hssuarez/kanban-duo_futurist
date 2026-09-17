'use client';

import React, { useEffect, useState } from 'react';
import { Task, User, TaskStatusHistory, TaskStatus } from '@/lib/types';
import { getTaskStatusHistory } from '@/lib/storage';
import {
  formatBogotaDateTime,
  formatBogotaDate,
  calculateDuration,
  isTaskOverdue,
  isTaskDueToday,
} from '@/lib/dateUtils';
import {
  X,
  Clock,
  AlertTriangle,
  History,
  User as UserIcon,
  Activity,
  ArrowRight,
  Edit2,
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  onOpenEdit?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  onOpenEdit,
}) => {
  const [history, setHistory] = useState<TaskStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen || !task) return;
    setLoadingHistory(true);
    getTaskStatusHistory(task.id)
      .then((data) => {
        setHistory(data);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const assignedUser = users.find((u) => u.id === task.assignedTo);
  const createdByUser = users.find((u) => u.id === task.createdBy);
  const overdue = isTaskOverdue(task.dueDate, task.status);
  const dueToday = isTaskDueToday(task.dueDate, task.status);

  const statusConfig: Record<
    TaskStatus,
    { label: string; dot: string; border: string; bg: string; text: string }
  > = {
    iniciado: {
      label: 'Iniciado',
      dot: 'bg-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-300',
    },
    trabajando: {
      label: 'En progreso',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
    },
    finalizado: {
      label: 'Finalizado',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
    },
  };

  const priorityConfig = {
    alta: { label: 'Alta', dot: 'bg-rose-400', text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    media: { label: 'Media', dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    baja: { label: 'Baja', dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  };

  const currentStatusCfg = statusConfig[task.status] || statusConfig.iniciado;
  const priorityCfg = priorityConfig[task.priority] || priorityConfig.media;

  const totalDuration = calculateDuration(
    task.startedAt || task.createdAt,
    task.completedAt || undefined
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans"
    >
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl my-auto bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky Top */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-mono">
                  ID: {task.id.slice(0, 10)}
                </span>
                {overdue && (
                  <span className="text-[10px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Detalle de tarea
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5 sm:space-y-6 text-zinc-300 text-xs custom-scrollbar">
          {/* Title & Status Pills */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${currentStatusCfg.bg} ${currentStatusCfg.border} ${currentStatusCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatusCfg.dot}`} />
                {currentStatusCfg.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                Prioridad {priorityCfg.label}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {task.title}
            </h2>
            {task.description ? (
              <p className="mt-3 text-xs text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-white/[0.06] leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500 italic">Sin descripción adicional.</p>
            )}
          </div>

          {/* People Assigned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/40 p-3.5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <img
                src={assignedUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={assignedUser?.name || 'Usuario'}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">
                  Asignado a
                </span>
                <span className="text-xs font-semibold text-zinc-200">
                  {assignedUser?.name || 'No asignado'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-zinc-400 text-xs sm:border-l sm:border-white/[0.06] sm:pl-3">
              <UserIcon className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">
                  Creado por
                </span>
                <span className="text-zinc-300 font-medium">
                  {createdByUser?.name || 'Sistema'}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline & Durations */}
          <div className="bg-zinc-900/40 rounded-xl border border-white/[0.06] p-4 space-y-3">
            <h4 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Cronología y tiempos
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Creada
                </span>
                <span className="text-xs font-medium text-zinc-200 font-mono">
                  {formatBogotaDateTime(task.createdAt)}
                </span>
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-white/[0.04]">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block mb-0.5">
                  Iniciada
                </span>
                <span className="text-xs font-medium text-cyan-300 font-mono">
                  {formatBogotaDateTime(task.startedAt)}
                </span>
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-white/[0.04]">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-0.5">
                  Finalizada
                </span>
                <span className="text-xs font-medium text-emerald-300 font-mono">
                  {formatBogotaDateTime(task.completedAt)}
                </span>
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-white/[0.04]">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block mb-0.5">
                  Vencimiento
                </span>
                <span
                  className={`text-xs font-medium font-mono ${
                    overdue
                      ? 'text-rose-400'
                      : dueToday
                      ? 'text-amber-300'
                      : 'text-zinc-300'
                  }`}
                >
                  {formatBogotaDate(task.dueDate)} {dueToday ? '(Hoy)' : overdue ? '(Vencida)' : ''}
                </span>
              </div>
            </div>

            {/* Total Duration */}
            <div className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2 rounded-lg border border-white/[0.06] text-xs">
              <span className="text-zinc-400 font-medium">
                Duración total:
              </span>
              <span className="font-mono font-semibold text-zinc-200">
                {totalDuration}
              </span>
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              Historial de estados ({history.length})
            </h4>

            {loadingHistory ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                Cargando historial...
              </div>
            ) : history.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-white/[0.04] text-xs">
                No hay cambios de estado registrados para esta tarea.
              </div>
            ) : (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {history.map((h, idx) => {
                  const toCfg = statusConfig[h.newStatus] || statusConfig.iniciado;
                  return (
                    <div key={h.id || idx} className="relative group">
                      <span
                        className={`absolute -left-[27px] top-2 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950 ${toCfg.dot}`}
                      />

                      <div className="bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-xl transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {h.previousStatus ? (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                <span className="capitalize">{h.previousStatus}</span>
                                <ArrowRight className="w-3 h-3 text-zinc-500" />
                                <span className={`font-semibold capitalize ${toCfg.text}`}>{h.newStatus}</span>
                              </div>
                            ) : (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded border ${toCfg.bg} ${toCfg.border} ${toCfg.text}`}
                              >
                                {toCfg.label} (Inicial)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {formatBogotaDateTime(h.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                          <span>
                            Por: <strong className="text-zinc-300 font-medium">{h.changedByName}</strong>
                          </span>
                          {h.observations && (
                            <span className="text-zinc-500 italic truncate max-w-[240px]">
                              "{h.observations}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Sticky Bottom */}
        <div className="shrink-0 sticky bottom-0 z-10 px-5 sm:px-6 py-3.5 bg-zinc-950/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-end gap-2">
          {onOpenEdit && (
            <button
              onClick={() => {
                onClose();
                onOpenEdit(task);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-colors active:scale-[0.98]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar tarea
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white text-zinc-950 hover:bg-zinc-200 transition-colors active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
