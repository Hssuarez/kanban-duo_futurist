'use client';

import React, { useState } from 'react';
import { Task, User, TaskStatus } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { Plus, ListTodo, Clock, CheckCircle2 } from 'lucide-react';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  users: User[];
  currentUser: User;
  onAddNew: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  users,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onMoveStatus,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const columnConfig = {
    iniciado: {
      accentColor: 'bg-zinc-500',
      icon: ListTodo,
      iconColor: 'text-zinc-400',
      titleColor: 'text-zinc-200',
    },
    trabajando: {
      accentColor: 'bg-amber-500',
      icon: Clock,
      iconColor: 'text-amber-400',
      titleColor: 'text-zinc-200',
    },
    finalizado: {
      accentColor: 'bg-emerald-500',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      titleColor: 'text-zinc-200',
    },
  }[status] || {
    accentColor: 'bg-zinc-500',
    icon: ListTodo,
    iconColor: 'text-zinc-400',
    titleColor: 'text-zinc-200',
  };

  const IconComponent = columnConfig.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only remove highlight if actually leaving the column, not entering child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-zinc-900/40 rounded-xl p-3 sm:p-3.5 border border-white/[0.06] transition-colors duration-150 min-h-[520px] font-sans ${
        isDragOver ? 'drop-target bg-zinc-900/70 border-white/20' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-zinc-800 text-zinc-300">
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-medium text-sm text-zinc-200">
            {title}
          </h2>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddNew(status)}
          title={`Agregar tarea a ${title}`}
          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-[0.95]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            currentUser={currentUser}
            onEdit={onEdit}
            onDelete={onDelete}
            onMoveStatus={onMoveStatus}
            onDragStart={handleDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800/80 rounded-lg p-6 text-center text-zinc-500 text-xs min-h-[140px]">
            <p className="text-zinc-500">Sin tareas pendientes</p>
            <button
              onClick={() => onAddNew(status)}
              className="mt-2 text-zinc-300 hover:text-white font-medium inline-flex items-center gap-1 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir tarea
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
