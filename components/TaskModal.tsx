'use client';

import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '@/lib/types';
import { X, Calendar, AlertCircle, Terminal } from 'lucide-react';

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
  }) => void;
  editingTask?: Task | null;
  defaultStatus?: TaskStatus;
  users: User[];
  currentUser: User;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  defaultStatus = 'iniciado',
  users,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

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
      setAssignedTo(currentUser.id);
      setDueDate('');
    }
    setError('');
  }, [editingTask, defaultStatus, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedTo,
      dueDate: dueDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity font-mono">
      <div
        className="bg-[#0e121e] w-full max-w-lg rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.2)] border border-cyan-500/40 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#090c15]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingTask ? '// EDITAR TAREA' : '// REGISTRAR NUEVA TAREA'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-cyan-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
              TÍTULO DE LA TAREA <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Optimizar red de microservicios..."
              className="w-full px-3.5 py-2.5 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
              DESCRIPCIÓN O DETALLES
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificaciones, criterios de despliegue o notas técnicas..."
              className="w-full px-3.5 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400 transition-colors resize-none placeholder:text-slate-600 font-sans"
            />
          </div>

          {/* Column Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                COLUMNA DE ESTADO
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors uppercase tracking-wider"
              >
                <option value="iniciado">🟦 INICIADO</option>
                <option value="trabajando">🟧 TRABAJANDO</option>
                <option value="finalizado">🟩 FINALIZADO</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                PRIORIDAD
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors uppercase tracking-wider"
              >
                <option value="baja">BAJA</option>
                <option value="media">MEDIA</option>
                <option value="alta">ALTA</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                ASIGNADO A
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors uppercase tracking-wider"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === currentUser.id ? '(TÚ)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                FECHA LÍMITE
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider"
            >
              {editingTask ? 'GUARDAR CAMBIOS' : 'CREAR TAREA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
