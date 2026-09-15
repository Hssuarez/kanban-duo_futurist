'use client';

import React from 'react';
import { Task, User, TaskStatus } from '@/lib/types';
import { isTaskOverdue, isTaskDueToday, formatDueDateBadge } from '@/lib/dateUtils';
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
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const assignee = users.find((u) => u.id === task.assignedTo);
  const isAssignedToMe = task.assignedTo === currentUser.id;

  const priorityConfigs = {
    alta: {
      label: 'Alta',
      badge: 'bg-rose-950/40 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    media: {
      label: 'Media',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    baja: {
      label: 'Baja',
      badge: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
      dot: 'bg-zinc-400',
    },
  };

  const priorityKey = (task.priority in priorityConfigs ? task.priority : 'media') as keyof typeof priorityConfigs;
  const currentPriority = priorityConfigs[priorityKey];

  const overdue = isTaskOverdue(task.dueDate, task.status);
  const dueToday = isTaskDueToday(task.dueDate, task.status);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(e, task.id);
        (e.currentTarget as HTMLElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).classList.remove('dragging');
      }}
      className="group relative bg-zinc-900/70 hover:bg-zinc-900 border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-3.5 shadow-sm hover:shadow-lg transition-all duration-150 cursor-grab active:cursor-grabbing font-sans select-none"
    >
      {/* Top Meta: Priority & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${currentPriority.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot}`} />
          {currentPriority.label}
        </span>

        {/* Action icons or inline confirm */}
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-zinc-400">¿Eliminar?</span>
            <button
              onClick={() => onDelete(task.id)}
              className="text-rose-400 hover:text-rose-300 font-semibold px-1 py-0.5 rounded hover:bg-rose-950/40"
            >
              Sí
            </button>
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="text-zinc-400 hover:text-zinc-200 px-1 py-0.5 rounded hover:bg-zinc-800"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              title="Editar tarea"
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsConfirmingDelete(true)}
              title="Eliminar tarea"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h3 className="font-medium text-zinc-100 text-sm leading-snug mb-1 group-hover:text-white transition-colors">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Task Footer: Assignee & Due Date */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          {assignee?.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <UserIcon className="w-2.5 h-2.5" />
            </div>
          )}
          <span
            className={`text-[11px] ${
              isAssignedToMe ? 'text-zinc-200 font-medium' : 'text-zinc-400'
            }`}
          >
            {isAssignedToMe ? 'Tú' : assignee?.name?.split(' ')[0] || 'Sin asignar'}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
              overdue
                ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30'
                : dueToday
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
            }`}
            title={overdue ? 'Tarea vencida' : dueToday ? 'Vence hoy' : 'Fecha límite'}
          >
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{formatDueDateBadge(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Quick Move Status Shortcuts */}
      <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-800/80 flex items-center gap-1.5 justify-end">
        {task.status === 'iniciado' && (
          <button
            onClick={() => onMoveStatus(task.id, 'trabajando')}
            className="flex items-center gap-1 text-[11px] font-medium bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/30 px-2 py-0.5 rounded transition-all active:scale-[0.96]"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            Iniciar
          </button>
        )}

        {task.status === 'trabajando' && (
          <>
            <button
              onClick={() => onMoveStatus(task.id, 'iniciado')}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors active:scale-[0.96]"
              title="Volver a Por hacer"
            >
              <RotateCcw className="w-3 h-3" />
              Pausar
            </button>
            <button
              onClick={() => onMoveStatus(task.id, 'finalizado')}
              className="flex items-center gap-1 text-[11px] font-medium bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30 px-2 py-0.5 rounded transition-all active:scale-[0.96]"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Completar
            </button>
          </>
        )}

        {task.status === 'finalizado' && (
          <button
            onClick={() => onMoveStatus(task.id, 'trabajando')}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors active:scale-[0.96]"
          >
            <RotateCcw className="w-3 h-3" />
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
};
