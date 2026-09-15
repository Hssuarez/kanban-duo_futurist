'use client';

import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, TaskPriority, Project } from '@/lib/types';
import { X, Calendar, AlertCircle, Terminal, FolderKanban } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: string;
    dueDate?: string;
    projectId?: string;
  }) => void;
  editingTask?: Task | null;
  defaultStatus?: TaskStatus;
  users: User[];
  currentUser: User;
  activeProject?: Project | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  defaultStatus = 'iniciado',
  users,
  currentUser,
  activeProject,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [assignedTo, setAssignedTo] = useState(currentUser?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const eligibleUsers = React.useMemo(() => {
    if (!activeProject) return users;
    const memberIds = Array.isArray(activeProject.memberIds) ? activeProject.memberIds : [];
    const list = users.filter(
      (u) =>
        memberIds.includes(u.id) ||
        u.id === activeProject.createdBy ||
        u.id === editingTask?.assignedTo
    );
    return list.length > 0 ? list : users;
  }, [users, activeProject, editingTask]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setAssignedTo(editingTask.assignedTo);
      setDueDate(editingTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('media');
      const isCurrentEligible = eligibleUsers.some((u) => u.id === currentUser?.id);
      setAssignedTo(isCurrentEligible ? currentUser.id : eligibleUsers[0]?.id || currentUser?.id || '');
      setDueDate('');
    }
    setError('');
  }, [editingTask, defaultStatus, currentUser, isOpen, eligibleUsers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }
    const finalAssignee = assignedTo || eligibleUsers[0]?.id || currentUser?.id || '';
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedTo: finalAssignee,
      dueDate: dueDate || undefined,
      projectId: activeProject?.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity font-sans">
      <div
        className="bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl border border-white/[0.08] overflow-hidden text-zinc-100 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              {editingTask ? 'Editar tarea' : 'Nueva tarea'}
            </h3>
            {activeProject && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium"
                style={{
                  backgroundColor: `${activeProject.color || '#3b82f6'}15`,
                  borderColor: `${activeProject.color || '#3b82f6'}40`,
                  color: activeProject.color || '#3b82f6',
                }}
              >
                <FolderKanban className="w-3 h-3" />
                {activeProject.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Título de la tarea <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Optimizar red de microservicios..."
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all font-sans"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Descripción o detalles
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificaciones, criterios de aceptación o notas..."
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all resize-none font-sans"
            />
          </div>

          {/* Column Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              >
                <option value="iniciado">Por hacer</option>
                <option value="trabajando">En curso</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Asignado a
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              >
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === currentUser.id ? '(Tú)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Fecha límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06] mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              {editingTask ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
