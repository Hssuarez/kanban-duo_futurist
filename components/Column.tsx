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
      borderColor: 'border-t-cyan-400',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
      icon: ListTodo,
      iconColor: 'text-cyan-400',
      titleColor: 'text-cyan-300',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
    },
    trabajando: {
      borderColor: 'border-t-amber-400',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      icon: Clock,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
    },
    finalizado: {
      borderColor: 'border-t-emerald-400',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    },
  }[status] || {
    borderColor: 'border-t-cyan-400',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    icon: ListTodo,
    iconColor: 'text-cyan-400',
    titleColor: 'text-cyan-300',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
  };

  const IconComponent = columnConfig.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
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
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-[#0b0e18]/90 rounded-2xl p-3.5 sm:p-4 border border-slate-800 border-t-4 ${
        columnConfig.borderColor
      } ${columnConfig.glow} transition-all duration-200 min-h-[520px] font-mono ${
        isDragOver ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-[#111422] border border-slate-700/80 ${columnConfig.iconColor}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <h2 className={`font-black tracking-wider uppercase text-sm sm:text-base ${columnConfig.titleColor}`}>
            {title}
          </h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${columnConfig.badgeBg}`}>
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddNew(status)}
          title={`Agregar tarea a ${title}`}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#15192b] border border-transparent hover:border-cyan-500/40 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-0.5">
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
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800/90 rounded-xl p-6 text-center text-slate-500 text-xs">
            <p className="uppercase tracking-widest text-[11px]">// NINGUNA TAREA EN COLA</p>
            <button
              onClick={() => onAddNew(status)}
              className="mt-2 text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 uppercase tracking-wider text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" /> + CREAR NUEVA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
