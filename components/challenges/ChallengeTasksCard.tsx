'use client';

import React from 'react';
import { Task, User } from '@/lib/types';
import { CheckSquare, Plus, Check } from 'lucide-react';

interface ChallengeTasksCardProps {
  tasks: Task[];
  users: User[];
  onOpenNewTask: () => void;
  onToggleTaskStatus: (task: Task) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export const ChallengeTasksCard: React.FC<ChallengeTasksCardProps> = ({
  tasks,
  users,
  onOpenNewTask,
  onToggleTaskStatus,
  onOpenTaskDetail,
}) => {
  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Tareas del Reto
          </h4>
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="text-xs font-mono font-medium text-cyan-300 hover:text-white flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Nueva tarea</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-56 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500 font-mono">
            No hay tareas de Kanban vinculadas a este reto aún.
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'finalizado';
            const assignedUser = users.find((u) => u.id === task.assignedTo);

            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/50 border border-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleTaskStatus(task)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-cyan-500 border-cyan-400 text-zinc-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'border-white/[0.2] hover:border-cyan-400 bg-zinc-900'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <span
                    onClick={() => onOpenTaskDetail(task)}
                    className={`text-xs truncate cursor-pointer transition-colors ${
                      isCompleted
                        ? 'text-zinc-500 line-through'
                        : 'text-zinc-200 group-hover:text-cyan-300 font-medium'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Assigned User Avatar */}
                {assignedUser && (
                  <div
                    className="w-5 h-5 rounded-full border border-white/[0.08] bg-zinc-800 overflow-hidden shrink-0"
                    title={assignedUser.name}
                  >
                    {assignedUser.avatar ? (
                      <img
                        src={assignedUser.avatar}
                        alt={assignedUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-zinc-400 flex items-center justify-center h-full">
                        {assignedUser.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
