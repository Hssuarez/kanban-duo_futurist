'use client';

import React, { useState, useEffect } from 'react';
import { Project, User } from '@/lib/types';
import {
  X,
  FolderKanban,
  Check,
  Users,
  Shield,
  Trash2,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

const COLOR_PALETTE = [
  { hex: '#06b6d4', name: 'Cyan Neón', glow: 'shadow-[0_0_12px_#06b6d4]' },
  { hex: '#6366f1', name: 'Índigo Cibernético', glow: 'shadow-[0_0_12px_#6366f1]' },
  { hex: '#d946ef', name: 'Fucsia Synthwave', glow: 'shadow-[0_0_12px_#d946ef]' },
  { hex: '#10b981', name: 'Esmeralda Matrix', glow: 'shadow-[0_0_12px_#10b981]' },
  { hex: '#f59e0b', name: 'Ámbar Terminal', glow: 'shadow-[0_0_12px_#f59e0b]' },
  { hex: '#f43f5e', name: 'Rosa Neón', glow: 'shadow-[0_0_12px_#f43f5e]' },
];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  editingProject?: Project | null;
  onSaveProject: (data: {
    name: string;
    description?: string;
    color: string;
    memberIds: string[];
  }) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  editingProject,
  onSaveProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberFilter, setMemberFilter] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setColor(editingProject.color || '#06b6d4');
      // Asegurar que el creador y miembros previos estén seleccionados
      const initialMembers = new Set(editingProject.memberIds || []);
      if (editingProject.createdBy) {
        initialMembers.add(editingProject.createdBy);
      }
      setSelectedMembers(Array.from(initialMembers));
    } else {
      setName('');
      setDescription('');
      setColor('#06b6d4');
      // Para nuevo proyecto, preseleccionar al usuario actual y opcionalmente a todos los activos
      setSelectedMembers([currentUser.id]);
    }
    setError('');
    setShowDeleteConfirm(false);
    setMemberFilter('');
  }, [editingProject, currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEditing = Boolean(editingProject);
  const isDefaultProject = editingProject?.id === 'proj-default';
  const canDelete =
    isEditing &&
    !isDefaultProject &&
    (currentUser.role === 'admin' || editingProject?.createdBy === currentUser.id);

  const toggleMember = (userId: string) => {
    // Si es el creador del proyecto, no se puede desmarcar
    const creatorId = editingProject ? editingProject.createdBy : currentUser.id;
    if (userId === creatorId) return;

    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    const allActiveIds = users.filter((u) => u.isActive).map((u) => u.id);
    setSelectedMembers(allActiveIds);
  };

  const handleSelectOnlyCreator = () => {
    const creatorId = editingProject ? editingProject.createdBy : currentUser.id;
    setSelectedMembers([creatorId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }

    const creatorId = editingProject ? editingProject.createdBy : currentUser.id;
    const finalMembers = new Set(selectedMembers);
    finalMembers.add(creatorId);

    setIsSubmitting(true);
    setError('');
    try {
      await onSaveProject({
        name: name.trim(),
        description: description.trim(),
        color,
        memberIds: Array.from(finalMembers),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject || !onDeleteProject) return;
    setIsSubmitting(true);
    try {
      await onDeleteProject(editingProject.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const creatorId = editingProject ? editingProject.createdBy : currentUser.id;

  const filteredUsers = users.filter((u) => {
    if (!memberFilter.trim()) return true;
    const q = memberFilter.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans"
    >
      <div
        className="relative w-full max-w-xl my-auto bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky Top */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
              }}
            >
              <FolderKanban className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isEditing ? 'Configurar proyecto' : 'Crear nuevo proyecto'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Administra miembros y atributos de este tablero' : 'Define el alcance y el equipo con quien compartirlo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre del proyecto <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Infraestructura Q4"
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 placeholder:text-zinc-500 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Descripción o propósito (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivos, hitos o contexto del equipo..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 placeholder:text-zinc-500 transition-all resize-none"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Color identificador
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => {
                const isSelected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-white bg-zinc-800 text-white'
                        : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member Selection */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Miembros del equipo
              </label>
              <span className="text-[11px] text-zinc-500">
                {selectedMembers.length} seleccionados
              </span>
            </div>

            <input
              type="text"
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              placeholder="Filtrar por nombre o email..."
              className="w-full px-3 py-1.5 text-xs bg-zinc-950/70 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 mb-2 focus:outline-none focus:border-zinc-500"
            />

            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5 divide-y divide-white/[0.04]">
              {filteredUsers.map((user) => {
                const isChecked = selectedMembers.includes(user.id);
                const isCreator = user.id === creatorId;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-zinc-800/40 text-zinc-100'
                        : 'hover:bg-zinc-800/20 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">{user.name}</span>
                          {isCreator && (
                            <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                              Creador
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="text-xs">
                      {isChecked ? (
                        <Check className="w-4 h-4 text-zinc-200 stroke-[2.5]" />
                      ) : (
                        <span className="w-4 h-4 rounded border border-zinc-700 block" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Danger Zone */}
          {canDelete && (
            <div className="pt-3 border-t border-rose-950/50">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar este proyecto y sus tareas</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>¿Confirmar eliminación del proyecto?</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Esta acción eliminará el tablero y sus tareas permanentemente.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-medium active:scale-[0.98]"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isDefaultProject && (
            <div className="flex items-center gap-2 p-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-xs text-zinc-400">
              <Info className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>
                Este es el proyecto principal por defecto del sistema. Su eliminación está restringida.
              </span>
            </div>
          )}
        </div>

        {/* Submit buttons - Sticky Footer */}
          <div className="shrink-0 sticky bottom-0 z-10 flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
