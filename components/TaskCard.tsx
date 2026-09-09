'use client';

import React from 'react';
import { Task, User, TaskStatus } from '@/lib/types';
import { Calendar, CheckCircle2, Play, RotateCcw, Trash2, Edit3, User as UserIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  users: User[];
  currentUser: User;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  currentUser,
  onEdit,
  onDelete,
  onMoveStatus,
  onDragStart,
}) => {
  const assignee = users.find((u) => u.id === task.assignedTo);
  const isAssignedToMe = task.assignedTo === currentUser.id;

  const priorityColors = {
    alta: 'bg-rose-950/70 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    media: 'bg-amber-950/70 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    baja: 'bg-slate-900 text-cyan-300 border-cyan-500/30',
  };

  const priorityLabels = {
    alta: 'PRIORIDAD // ALTA',
    media: 'PRIORIDAD // MEDIA',
    baja: 'PRIORIDAD // BAJA',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'finalizado';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative bg-[#101423]/95 border border-slate-800/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-2xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing font-mono"
    >
      {/* Top Meta: Priority & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            title="Editar tarea"
            className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Confirmas la eliminación de la tarea "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Eliminar tarea"
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3 className="font-bold text-slate-100 text-sm leading-snug mb-1.5 group-hover:text-cyan-300 transition-colors tracking-wide">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed font-sans">
          {task.description}
        </p>
      )}

      {/* Task Footer: Assignee & Due Date */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {assignee?.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-5 h-5 rounded-md object-cover ring-1 ring-cyan-400/50"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-cyan-400 text-[10px]">
              <UserIcon className="w-3 h-3" />
            </div>
          )}
          <span
            className={`text-[11px] font-semibold ${
              isAssignedToMe ? 'text-cyan-400 font-bold' : 'text-slate-300'
            }`}
          >
            {isAssignedToMe ? '// TÚ' : assignee?.name?.split(' ')[0]?.toUpperCase() || 'NO_ASIGNADO'}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isOverdue
                ? 'bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Quick Move Status Shortcuts */}
      <div className="mt-3 pt-2 border-t border-dashed border-slate-800 flex items-center gap-1.5 justify-end">
        {task.status === 'iniciado' && (
          <button
            onClick={() => onMoveStatus(task.id, 'trabajando')}
            className="flex items-center gap-1 text-[10px] font-bold bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 border border-amber-500/50 px-2 py-1 rounded-md transition-all shadow-[0_0_8px_rgba(245,158,11,0.2)] uppercase tracking-wider"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            EJECUTAR
          </button>
        )}

        {task.status === 'trabajando' && (
          <>
            <button
              onClick={() => onMoveStatus(task.id, 'iniciado')}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-md transition-colors uppercase tracking-wider"
              title="Volver a Iniciado"
            >
              <RotateCcw className="w-3 h-3" />
              PAUSAR
            </button>
            <button
              onClick={() => onMoveStatus(task.id, 'finalizado')}
              className="flex items-center gap-1 text-[10px] font-bold bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70 border border-emerald-500/60 px-2 py-1 rounded-md transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] uppercase tracking-wider"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              COMPLETAR
            </button>
          </>
        )}

        {task.status === 'finalizado' && (
          <button
            onClick={() => onMoveStatus(task.id, 'trabajando')}
            className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 px-2 py-1 rounded-md transition-colors uppercase tracking-wider"
          >
            <RotateCcw className="w-3 h-3" />
            REABRIR
          </button>
        )}
      </div>
    </div>
  );
};
