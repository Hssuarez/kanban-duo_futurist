'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const [hasJustDropped, setHasJustDropped] = useState(false);
  const [canMagnet, setCanMagnet] = useState(false);
  const emptyStateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setCanMagnet(hasFinePointer && !prefersReducedMotion);
    }
  }, []);

  const columnConfig = {
    iniciado: {
      accentColor: 'bg-zinc-400',
      icon: ListTodo,
      iconBg: 'bg-zinc-800 text-zinc-300 border-white/[0.08]',
      badgeBg: 'bg-zinc-800 text-zinc-400',
      dotColor: 'bg-zinc-400',
      columnBorder: 'border-white/[0.08] hover:border-white/[0.14]',
      headerGlow: 'from-zinc-800/20 to-transparent',
      dropHalo: 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.22)] ring-1 ring-cyan-500/40',
      cueColor: 'border-cyan-400/60 bg-cyan-950/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    },
    trabajando: {
      accentColor: 'bg-amber-400',
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-500/10 text-amber-300',
      dotColor: 'bg-amber-400',
      columnBorder: 'border-amber-500/15 hover:border-amber-500/30',
      headerGlow: 'from-amber-500/10 to-transparent',
      dropHalo: 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.22)] ring-1 ring-amber-500/40',
      cueColor: 'border-amber-400/60 bg-amber-950/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    },
    finalizado: {
      accentColor: 'bg-emerald-400',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-300',
      dotColor: 'bg-emerald-400',
      columnBorder: 'border-emerald-500/15 hover:border-emerald-500/30',
      headerGlow: 'from-emerald-500/10 to-transparent',
      dropHalo: 'bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/40',
      cueColor: 'border-emerald-400/60 bg-emerald-950/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    },
  }[status] || {
    accentColor: 'bg-zinc-400',
    icon: ListTodo,
    iconBg: 'bg-zinc-800 text-zinc-300 border-white/[0.08]',
    badgeBg: 'bg-zinc-800 text-zinc-400',
    dotColor: 'bg-zinc-400',
    columnBorder: 'border-white/[0.08] hover:border-white/[0.14]',
    headerGlow: 'from-zinc-800/20 to-transparent',
    dropHalo: 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.22)] ring-1 ring-cyan-500/40',
    cueColor: 'border-cyan-400/60 bg-cyan-950/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
  };

  const IconComponent = columnConfig.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      setHasJustDropped(true);
      setTimeout(() => setHasJustDropped(false), 400);
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEmptyMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canMagnet || !emptyStateRef.current) return;
    const rect = emptyStateRef.current.getBoundingClientRect();
    const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const pullX = Math.max(-3.5, Math.min(3.5, normX * 3.5));
    const pullY = Math.max(-3.5, Math.min(3.5, normY * 3.5));
    emptyStateRef.current.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px)`;
  };

  const handleEmptyMouseLeave = () => {
    if (emptyStateRef.current) {
      emptyStateRef.current.style.transform = 'translate(0px, 0px)';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-[#070c18]/60 backdrop-blur-md bg-gradient-to-b ${columnConfig.headerGlow} rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 min-h-[520px] font-sans relative ${
        isDragOver
          ? columnConfig.dropHalo
          : hasJustDropped
          ? 'animate-drop-confirm border-cyan-400/70'
          : columnConfig.columnBorder
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border relative ${columnConfig.iconBg}`}>
            <IconComponent className="w-3.5 h-3.5" />
            {status === 'trabajando' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-working-halo" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-zinc-200">
              {title}
            </h2>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full font-mono ${columnConfig.badgeBg}`}>
              {tasks.length}
            </span>
          </div>
        </div>

        <button
          onClick={() => onAddNew(status)}
          title={`Agregar tarea a ${title}`}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors active:scale-[0.95]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pt-2 pb-2 px-1 -mx-1 custom-scrollbar">
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

        {/* Drop Insertion Target Cue when dragging over */}
        {isDragOver && (
          <div className={`border-2 border-dashed rounded-xl p-3 text-center text-xs font-medium flex items-center justify-center gap-1.5 animate-pulse ${columnConfig.cueColor}`}>
            <span>Soltar tarea en {title}</span>
          </div>
        )}

        {/* Intentional, Context-Specific Empty State with Subtle Magnetic Hover */}
        {tasks.length === 0 && !isDragOver && (
          <div
            ref={emptyStateRef}
            onMouseMove={handleEmptyMouseMove}
            onMouseLeave={handleEmptyMouseLeave}
            onClick={() => onAddNew(status)}
            className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] hover:border-white/[0.18] hover:bg-zinc-900/30 rounded-xl p-6 text-center text-xs min-h-[160px] cursor-pointer transition-transform duration-150 ease-out group select-none"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 border transition-transform group-hover:scale-110 ${columnConfig.iconBg}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">
              {status === 'iniciado' && 'Sin tareas por iniciar'}
              {status === 'trabajando' && 'Sin tareas en curso'}
              {status === 'finalizado' && 'Sin tareas finalizadas'}
            </p>
            <p className="text-[11px] text-zinc-500 max-w-[200px] mt-1 leading-relaxed">
              {status === 'iniciado' && 'Crea tareas pendientes para comenzar a planificar'}
              {status === 'trabajando' && 'Inicia una tarea de la columna anterior para empezar'}
              {status === 'finalizado' && 'Las tareas completadas y su tiempo aparecerán aquí'}
            </p>
            {status !== 'finalizado' && (
              <span className="text-[11px] text-zinc-400 group-hover:text-cyan-400 mt-2.5 inline-flex items-center gap-1 font-medium transition-colors">
                <Plus className="w-3 h-3" /> Crear tarea aquí
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
