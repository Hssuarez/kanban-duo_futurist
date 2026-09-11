'use client';

import React, { useEffect, useState } from 'react';
import { Task, User, TaskStatusHistory, TaskStatus } from '@/lib/types';
import { getTaskStatusHistory } from '@/lib/storage';
import {
  formatBogotaDateTime,
  formatBogotaDate,
  formatBogotaTime,
  calculateDuration,
  isTaskOverdue,
} from '@/lib/dateUtils';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  History,
  User as UserIcon,
  Tag,
  FileText,
  Activity,
  ArrowRight,
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

  if (!isOpen || !task) return null;

  const assignedUser = users.find((u) => u.id === task.assignedTo);
  const createdByUser = users.find((u) => u.id === task.createdBy);
  const overdue = isTaskOverdue(task.dueDate, task.status);

  const statusConfig: Record<
    TaskStatus,
    { label: string; color: string; border: string; bg: string; text: string }
  > = {
    iniciado: {
      label: 'INICIADO',
      color: '#06b6d4',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-950/40',
      text: 'text-cyan-300',
    },
    trabajando: {
      label: 'TRABAJANDO',
      color: '#f59e0b',
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
    },
    finalizado: {
      label: 'FINALIZADO',
      color: '#10b981',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
    },
  };

  const priorityConfig = {
    alta: { label: 'ALTA', text: 'text-rose-400', bg: 'bg-rose-950/50', border: 'border-rose-500/50' },
    media: { label: 'MEDIA', text: 'text-amber-400', bg: 'bg-amber-950/50', border: 'border-amber-500/50' },
    baja: { label: 'BAJA', text: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-500/50' },
  };

  const currentStatusCfg = statusConfig[task.status];
  const priorityCfg = priorityConfig[task.priority];

  const totalDuration = calculateDuration(
    task.startedAt || task.createdAt,
    task.completedAt || undefined
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div
        className="bg-[#0b0e17] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#0e121e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest">
                  TASK // ID: {task.id.slice(0, 14)}
                </span>
                {overdue && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> VENCIDA
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                DETALLE DE OPERACIÓN
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs custom-scrollbar">
          {/* Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wider uppercase ${currentStatusCfg.bg} ${currentStatusCfg.border} ${currentStatusCfg.text}`}
              >
                // ESTADO: {currentStatusCfg.label}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wider uppercase ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text}`}
              >
                // PRIORIDAD: {priorityCfg.label}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              {task.title}
            </h2>
            {task.description ? (
              <p className="mt-2 text-xs text-slate-300 bg-[#101422] p-3 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500 italic">// Sin descripción adicional.</p>
            )}
          </div>

          {/* Personnel Assigned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0d101b] p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <img
                src={assignedUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={assignedUser?.name || 'Operador'}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-cyan-500/50"
              />
              <div>
                <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider block">
                  // ASIGNADO A
                </span>
                <span className="text-xs font-bold text-white">
                  {assignedUser?.name || 'No asignado'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-400 text-[11px] sm:border-l sm:border-slate-800 sm:pl-3">
              <UserIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  // CREADO POR
                </span>
                <span className="text-slate-300 font-medium">
                  {createdByUser?.name || 'Sistema'}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Timeline Metrics */}
          <div className="bg-[#0e121e] rounded-xl border border-cyan-500/20 p-4 space-y-3">
            <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-cyan-500/10 pb-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              CRONOMETRÍA & TRAZABILIDAD TEMPORAL (AMERICA/BOGOTA)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
              <div className="bg-[#090b12] p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-0.5">
                  CREADA
                </span>
                <span className="text-[11px] font-bold text-white">
                  {formatBogotaDateTime(task.createdAt)}
                </span>
              </div>

              <div className="bg-[#090b12] p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-cyan-400 uppercase tracking-wider block mb-0.5">
                  INICIADA (STARTED_AT)
                </span>
                <span className="text-[11px] font-bold text-cyan-300">
                  {formatBogotaDateTime(task.startedAt)}
                </span>
              </div>

              <div className="bg-[#090b12] p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-emerald-400 uppercase tracking-wider block mb-0.5">
                  FINALIZADA (COMPLETED)
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  {formatBogotaDateTime(task.completedAt)}
                </span>
              </div>

              <div className="bg-[#090b12] p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-amber-400 uppercase tracking-wider block mb-0.5">
                  VENCIMIENTO (DUE)
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    overdue ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {formatBogotaDate(task.dueDate)}
                </span>
              </div>
            </div>

            {/* Total Duration calculation */}
            <div className="flex items-center justify-between bg-[#111625] px-3.5 py-2 rounded-lg border border-cyan-500/30 text-[11px]">
              <span className="text-slate-300 font-bold tracking-wider uppercase">
                DURACIÓN TOTAL DE RESOLUCIÓN:
              </span>
              <span className="font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                {totalDuration}
              </span>
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              HISTÓRICO DE ESTADOS ({history.length} REGISTROS)
            </h4>

            {loadingHistory ? (
              <div className="py-6 text-center text-cyan-400 text-xs animate-pulse">
                // CONSULTANDO HISTÓRICO DE ESTADOS...
              </div>
            ) : history.length === 0 ? (
              <div className="py-4 text-center text-slate-500 bg-[#0c0f1a] rounded-xl border border-slate-800 text-xs">
                // No se han registrado transiciones de estado para esta tarea.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-indigo-500 before:to-emerald-500">
                {history.map((h, idx) => {
                  const toCfg = statusConfig[h.newStatus] || statusConfig.iniciado;
                  return (
                    <div key={h.id || idx} className="relative group">
                      {/* Timeline Glowing Dot */}
                      <span
                        className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0b0e17]"
                        style={{ backgroundColor: toCfg.color, boxShadow: `0 0 8px ${toCfg.color}` }}
                      />

                      <div className="bg-[#0e121e] border border-slate-800/80 hover:border-cyan-500/40 p-3 rounded-xl transition-all shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {h.previousStatus ? (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                <span>{h.previousStatus}</span>
                                <ArrowRight className="w-3 h-3 text-cyan-400" />
                                <span className={toCfg.text}>{h.newStatus}</span>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${toCfg.bg} ${toCfg.border} ${toCfg.text}`}
                              >
                                {toCfg.label} (INICIAL)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatBogotaDateTime(h.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>
                            Operador:{' '}
                            <strong className="text-white font-semibold">
                              {h.changedByName}
                            </strong>
                          </span>
                          {h.observations && (
                            <span className="text-slate-400 italic truncate max-w-[240px]">
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

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#0e121e] border-t border-cyan-500/20 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
            // KANBAN-DUO PROTOCOL: AUDIT_VERIFIED
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {onOpenEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit(task);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider transition-colors"
              >
                EDITAR TAREA
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
