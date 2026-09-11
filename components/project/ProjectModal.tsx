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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity font-mono">
      <div
        className="bg-[#0c101c] w-full max-w-xl rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] border border-cyan-500/40 overflow-hidden text-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#080b14] shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: `${color}20`,
                borderColor: color,
                boxShadow: `0 0 10px ${color}40`,
              }}
            >
              <FolderKanban className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? '// CONFIGURAR PROYECTO & EQUIPO' : '// CREAR NUEVO TABLERO DE PROYECTO'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isEditing ? 'Administra miembros y atributos de este tablero' : 'Define el alcance y el equipo con quien compartirlo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-cyan-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-500/60 rounded-xl text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              NOMBRE DEL PROYECTO / TABLERO <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Modernización Infraestructura Q4"
              className="w-full px-3.5 py-2 text-xs bg-[#101524] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 tracking-wider placeholder:text-slate-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              DESCRIPCIÓN / OBJETIVO (OPCIONAL)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Propósito del proyecto, entregables clave o contexto del equipo..."
              className="w-full px-3.5 py-2 text-xs bg-[#101524] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 tracking-wider placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Theme Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>COLOR IDENTIFICADOR NEÓN</span>
              <span className="text-[10px] font-normal text-cyan-400 flex items-center gap-1">
                <Layers className="w-3 h-3" /> IDENTIDAD VISUAL
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PALETTE.map((c) => {
                const isSelected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-white bg-[#161c30] ${c.glow}'
                        : 'border-slate-800 bg-[#0e1220] hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border border-white/20"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </div>
                    <span className="text-[9px] text-slate-300 truncate w-full text-center">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Members Sharing Checklist */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COMPARTIR CON (EQUIPO DEL TABLERO)</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Solo los usuarios seleccionados podrán ver y participar en este tablero.
                </p>
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 uppercase"
                >
                  TODOS
                </button>
                <button
                  type="button"
                  onClick={handleSelectOnlyCreator}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 uppercase"
                >
                  SOLO YO
                </button>
              </div>
            </div>

            {/* Quick search inside users list */}
            {users.length > 4 && (
              <input
                type="text"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                placeholder="Filtrar por nombre o email..."
                className="w-full px-3 py-1.5 mb-2 text-xs bg-[#101524] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-400 text-xs"
              />
            )}

            {/* Members List Box */}
            <div className="bg-[#090d18] border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
              {filteredUsers.map((user) => {
                const isChecked = selectedMembers.includes(user.id);
                const isCreator = user.id === creatorId;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center justify-between p-2.5 transition-colors cursor-pointer ${
                      isChecked ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox visual */}
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                          isChecked
                            ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                            : 'border-slate-700 bg-[#0d111e]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* User Avatar */}
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                      />

                      {/* User details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {user.name}
                          </span>
                          {isCreator && (
                            <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded font-bold uppercase">
                              CREADOR
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-500/50 px-1.5 py-0.2 rounded font-bold uppercase">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {isChecked ? (
                        <span className="text-cyan-400 font-bold">INCLUIDO</span>
                      ) : (
                        <span className="text-slate-600">SIN ACCESO</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>
                Total seleccionados: <strong className="text-cyan-300">{selectedMembers.length}</strong> de {users.length}
              </span>
              <span className="text-[10px] text-cyan-400/80 uppercase">
                // SEGURIDAD POR TABLERO
              </span>
            </div>
          </div>

          {/* Delete Danger Zone (only when editing & authorized) */}
          {canDelete && (
            <div className="pt-3 border-t border-rose-950/60">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ELIMINAR ESTE PROYECTO Y SUS TAREAS</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>¿CONFIRMAR ELIMINACIÓN DE ESTE PROYECTO?</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Esta acción eliminará el tablero y todas las tareas contenidas en él de forma permanente.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                    >
                      SÍ, ELIMINAR PROYECTO
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isDefaultProject && (
            <div className="flex items-center gap-2 p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-300">
              <Info className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>
                Este es el proyecto principal por defecto del sistema. Su eliminación está bloqueada para preservar la integridad operativa.
              </span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? 'GUARDANDO...' : isEditing ? 'ACTUALIZAR PROYECTO' : 'CREAR PROYECTO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
