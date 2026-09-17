'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Task,
  User,
  TaskStatus,
  TaskPriority,
  Project,
  Subtask,
  TaskComment,
  TaskAttachment,
} from '@/lib/types';
import {
  X,
  AlertCircle,
  FolderKanban,
  CheckSquare,
  Tag,
  Paperclip,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Github,
  Figma,
  FileText,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

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
    subtasks?: Subtask[];
    tags?: string[];
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
  }) => void;
  editingTask?: Task | null;
  defaultStatus?: TaskStatus;
  users: User[];
  currentUser: User;
  activeProject?: Project | null;
}

type ModalTab = 'general' | 'subtasks' | 'tags' | 'attachments' | 'comments';

const PREDEFINED_TAGS = [
  { label: '#Bug', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { label: '#Feature', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { label: '#Diseño', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { label: '#Frontend', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { label: '#Backend', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { label: '#Urgente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
];

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
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [assignedTo, setAssignedTo] = useState(currentUser?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachTitle, setAttachTitle] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  // Comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const eligibleUsers = useMemo(() => {
    if (!activeProject) return users;
    const memberIdSet = new Set<string>(
      Array.isArray(activeProject.memberIds) ? activeProject.memberIds : []
    );
    if (activeProject.createdBy) memberIdSet.add(activeProject.createdBy);
    if (editingTask?.assignedTo) memberIdSet.add(editingTask.assignedTo);
    if (currentUser) memberIdSet.add(currentUser.id);

    const list = users.filter((u) => memberIdSet.has(u.id) && u.isActive !== false);
    if (list.length > 0) return list;
    return currentUser ? [currentUser] : users;
  }, [users, activeProject, editingTask, currentUser]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setAssignedTo(editingTask.assignedTo);
      setDueDate(editingTask.dueDate || '');
      setSubtasks(Array.isArray(editingTask.subtasks) ? [...editingTask.subtasks] : []);
      setTags(Array.isArray(editingTask.tags) ? [...editingTask.tags] : []);
      setAttachments(Array.isArray(editingTask.attachments) ? [...editingTask.attachments] : []);
      setComments(Array.isArray(editingTask.comments) ? [...editingTask.comments] : []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('media');
      const isCurrentEligible = eligibleUsers.some((u) => u.id === currentUser?.id);
      setAssignedTo(isCurrentEligible ? currentUser.id : eligibleUsers[0]?.id || currentUser?.id || '');
      setDueDate('');
      setSubtasks([]);
      setTags([]);
      setAttachments([]);
      setComments([]);
    }
    setActiveTab('general');
    setError('');
  }, [editingTask, defaultStatus, currentUser, isOpen, eligibleUsers]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Subtask handlers
  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newItem: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newItem]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // Tag handlers
  const handleTogglePredefinedTag = (label: string) => {
    if (tags.includes(label)) {
      setTags((prev) => prev.filter((t) => t !== label));
    } else {
      setTags((prev) => [...prev, label]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!tags.includes(formatted)) {
      setTags((prev) => [...prev, formatted]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Attachment handlers
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachTitle.trim() || !attachUrl.trim()) return;
    let type: 'link' | 'github' | 'figma' | 'doc' = 'link';
    const low = attachUrl.toLowerCase();
    if (low.includes('github.com')) type = 'github';
    else if (low.includes('figma.com')) type = 'figma';
    else if (low.includes('docs.google.com') || low.includes('drive.google.com')) type = 'doc';

    const newAttach: TaskAttachment = {
      id: `att-${Date.now()}`,
      title: attachTitle.trim(),
      url: attachUrl.trim().startsWith('http') ? attachUrl.trim() : `https://${attachUrl.trim()}`,
      type,
    };
    setAttachments((prev) => [...prev, newAttach]);
    setAttachTitle('');
    setAttachUrl('');
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Comment handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;
    const comment: TaskComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setNewCommentText('');
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      setActiveTab('general');
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
      subtasks,
      tags,
      attachments,
      comments,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans"
    >
      <div
        className="relative w-full max-w-lg my-auto bg-[#070c18]/95 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.1)] overflow-hidden text-zinc-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky Top */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#070c18]/95 backdrop-blur-md">
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

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-4 pt-2 pb-1 border-b border-white/[0.06] bg-[#050811] overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subtasks')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subtasks'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Subtareas
            {subtasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 rounded-full font-mono">
                {subtasks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tags'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Etiquetas
            {tags.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-950/80 border border-purple-500/30 text-purple-300 rounded-full font-mono">
                {tags.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Recursos
            {attachments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-950/80 border border-blue-500/30 text-blue-300 rounded-full font-mono">
                {attachments.length}
              </span>
            )}
          </button>
          {editingTask && (
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comentarios
              {comments.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-950/80 border border-amber-500/30 text-amber-300 rounded-full font-mono">
                  {comments.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
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
                    className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
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
                    className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none font-sans"
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
                      className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-200 rounded-lg focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SUBTASKS */}
            {activeTab === 'subtasks' && (
              <div className="space-y-4 animate-fade-in">
                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="p-3 bg-[#090f1f] border border-cyan-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Progreso de subtareas</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {completedSubtasksCount} de {subtasks.length} ({subtaskProgress}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Escribe una subtarea y presiona Enter..."
                    className="flex-1 px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-2 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>

                {/* Subtask list */}
                {subtasks.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    No hay subtareas añadidas todavía. Escribe arriba para dividir tu misión.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.05] transition-colors group"
                      >
                        <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4 shrink-0"
                          />
                          <span
                            className={`text-xs truncate ${
                              st.completed
                                ? 'line-through text-zinc-500'
                                : 'text-zinc-200'
                            }`}
                          >
                            {st.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors opacity-80 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TAGS */}
            {activeTab === 'tags' && (
              <div className="space-y-4 animate-fade-in">
                {/* Active Tags */}
                <div>
                  <span className="block text-xs font-medium text-zinc-300 mb-2">
                    Etiquetas asignadas
                  </span>
                  {tags.length === 0 ? (
                    <p className="text-xs text-zinc-500">Sin etiquetas todavía.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/50 border border-cyan-500/40 text-cyan-300"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-rose-400 text-cyan-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Predefined Quick Tags */}
                <div>
                  <span className="block text-xs font-medium text-zinc-400 mb-2">
                    Etiquetas sugeridas (toca para alternar)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PREDEFINED_TAGS.map((pt) => {
                      const isSelected = tags.includes(pt.label);
                      return (
                        <button
                          key={pt.label}
                          type="button"
                          onClick={() => handleTogglePredefinedTag(pt.label)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? `${pt.color} ring-1 ring-white/20 font-bold scale-105`
                              : 'bg-zinc-900/80 text-zinc-400 border-white/[0.08] hover:text-zinc-200'
                          }`}
                        >
                          {pt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div>
                  <span className="block text-xs font-medium text-zinc-400 mb-1">
                    Crear etiqueta personalizada
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCustomTag(e);
                        }
                      }}
                      placeholder="#NuevaEtiqueta..."
                      className="flex-1 px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3 py-2 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div className="space-y-4 animate-fade-in">
                {/* Add Attachment */}
                <div className="p-3 bg-[#090f1f] border border-cyan-500/20 rounded-xl space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Vincular Recurso Externo
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={attachTitle}
                      onChange={(e) => setAttachTitle(e.target.value)}
                      placeholder="Título (ej: Figma Mockup / PR GitHub)"
                      className="px-3 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:border-cyan-500/50"
                    />
                    <input
                      type="text"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="URL (https://...)"
                      className="px-3 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-1.5 bg-cyan-500 text-zinc-950 hover:bg-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Vincular Enlace
                  </button>
                </div>

                {/* List of Attachments */}
                {attachments.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    Sin enlaces vinculados todavía. Agrega tus links de Figma, GitHub o Docs.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.05] transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {att.type === 'github' && <Github className="w-4 h-4 text-zinc-300 shrink-0" />}
                          {att.type === 'figma' && <Figma className="w-4 h-4 text-purple-400 shrink-0" />}
                          {att.type === 'doc' && <FileText className="w-4 h-4 text-blue-400 shrink-0" />}
                          {att.type === 'link' && <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-cyan-300 hover:underline truncate block"
                            >
                              {att.title}
                            </a>
                            <span className="text-[10px] text-zinc-500 truncate block">
                              {att.url}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: COMMENTS */}
            {activeTab === 'comments' && editingTask && (
              <div className="space-y-4 animate-fade-in">
                {/* Comments Stream */}
                {comments.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No hay comentarios en esta tarea todavía. Escribe la primera nota abajo.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 rounded-xl bg-[#090f1f] border border-white/[0.06] space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {comm.userAvatar ? (
                              <img
                                src={comm.userAvatar}
                                alt={comm.userName}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-300 flex items-center justify-center text-[9px] font-bold">
                                {comm.userName[0]}
                              </div>
                            )}
                            <span className="font-semibold text-zinc-200">{comm.userName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(comm.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed pl-6 break-words">
                          {comm.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-start gap-2 pt-2 border-t border-white/[0.06]">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Escribe una nota interna para el equipo..."
                    className="flex-1 px-3 py-2 text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="px-3 py-2 bg-cyan-500 text-zinc-950 hover:bg-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 mt-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer - Sticky Bottom */}
          <div className="shrink-0 sticky bottom-0 z-10 flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-md">
            <span className="text-[11px] text-zinc-500 font-mono">
              {activeProject?.name || 'KanbanDuo'}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_22px_rgba(6,182,212,0.55)] transition-all active:scale-[0.98] cursor-pointer"
              >
                {editingTask ? 'Guardar cambios' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
