'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Project, AppView, TaskStatus } from '@/lib/types';
import {
  Search,
  Kanban,
  Calendar,
  LayoutDashboard,
  Plus,
  Settings,
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  ArrowRight,
  X,
  Orbit,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onChangeView: (view: AppView) => void;
  onOpenNewTask: () => void;
  onOpenProfile: () => void;
  onSelectTask: (task: Task) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  activeProject,
  onSelectProject,
  onChangeView,
  onOpenNewTask,
  onOpenProfile,
  onSelectTask,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Actions list
  const systemActions = useMemo(() => {
    return [
      {
        id: 'action-new-task',
        category: 'Acciones',
        title: 'Crear nueva tarea',
        subtitle: activeProject ? `En ${activeProject.name}` : 'Crear en nuevo proyecto',
        icon: Plus,
        run: () => {
          onClose();
          onOpenNewTask();
        },
      },
      {
        id: 'action-view-command-center',
        category: 'Navegación',
        title: 'Ir a Command Center (HOME)',
        subtitle: 'Sistema solar interactivo y mapa 3D de módulos',
        icon: Orbit,
        run: () => {
          onClose();
          onChangeView('command_center');
        },
      },
      {
        id: 'action-view-board',
        category: 'Navegación',
        title: 'Ir al Tablero Kanban',
        subtitle: 'Columnas Iniciado, Trabajando y Finalizado',
        icon: Kanban,
        run: () => {
          onClose();
          onChangeView('board');
        },
      },
      {
        id: 'action-view-calendar',
        category: 'Navegación',
        title: 'Ir al Calendario',
        subtitle: 'Vistas de mes, semana y día',
        icon: Calendar,
        run: () => {
          onClose();
          onChangeView('calendar');
        },
      },
      {
        id: 'action-view-dashboard',
        category: 'Navegación',
        title: 'Ir a Métricas',
        subtitle: 'KPIs, rendimiento y distribución',
        icon: LayoutDashboard,
        run: () => {
          onClose();
          onChangeView('dashboard');
        },
      },
      {
        id: 'action-view-profile',
        category: 'Acciones',
        title: 'Mi perfil y cuenta',
        subtitle: 'Configuración personal y avatar',
        icon: Settings,
        run: () => {
          onClose();
          onOpenProfile();
        },
      },
    ];
  }, [activeProject?.name, onClose, onOpenNewTask, onChangeView, onOpenProfile]);

  // Filtered lists
  const filteredActions = useMemo(() => {
    if (!query.trim()) return systemActions;
    const q = query.toLowerCase();
    return systemActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
  }, [systemActions, query]);

  const filteredProjects = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, query]);

  const filteredTasks = useMemo(() => {
    if (!query.trim()) {
      return tasks.slice(0, 5); // show recent 5 tasks if empty query
    }
    const q = query.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.priority.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [tasks, query]);

  // Combined flat items for keyboard indexing
  const allItems = useMemo(() => {
    const list: {
      type: 'action' | 'project' | 'task';
      id: string;
      title: string;
      subtitle?: string;
      icon?: React.ElementType;
      status?: TaskStatus;
      data?: any;
    }[] = [];

    filteredActions.forEach((a) => {
      list.push({ type: 'action', id: a.id, title: a.title, subtitle: a.subtitle, icon: a.icon, data: a });
    });

    filteredProjects.forEach((p) => {
      list.push({
        type: 'project',
        id: `proj-${p.id}`,
        title: `Cambiar a: ${p.name}`,
        subtitle: p.description || 'Proyecto disponible',
        icon: FolderKanban,
        data: p,
      });
    });

    filteredTasks.forEach((t) => {
      list.push({
        type: 'task',
        id: `task-${t.id}`,
        title: t.title,
        subtitle: t.description ? t.description.slice(0, 65) + '...' : `Estado: ${t.status}`,
        status: t.status,
        data: t,
      });
    });

    return list;
  }, [filteredActions, filteredProjects, filteredTasks]);

  // Adjust selection if out of range
  useEffect(() => {
    if (selectedIndex >= allItems.length) {
      setSelectedIndex(Math.max(0, allItems.length - 1));
    }
  }, [allItems.length, selectedIndex]);

  // Handle arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, allItems.length)) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'action') {
          current.data.run();
        } else if (current.type === 'project') {
          onSelectProject(current.data.id);
          onClose();
        } else if (current.type === 'task') {
          onSelectTask(current.data);
          onClose();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#090e1c] border border-cyan-500/35 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.98),0_0_35px_rgba(6,182,212,0.18)] overflow-hidden animate-modal-enter font-sans ring-1 ring-cyan-500/25"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-zinc-950/60">
          <Search className="w-4 h-4 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar tareas, proyectos o escribir comandos..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-white/[0.08] rounded">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 space-y-1 divide-y divide-white/[0.03]"
        >
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No se encontraron tareas ni comandos que coincidan con "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon || (item.status === 'finalizado' ? CheckCircle2 : item.status === 'trabajando' ? Clock : ListTodo);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'action') item.data.run();
                    else if (item.type === 'project') {
                      onSelectProject(item.data.id);
                      onClose();
                    } else if (item.type === 'task') {
                      onSelectTask(item.data);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 text-white border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                      : 'text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                          : 'bg-zinc-900 border-white/[0.06] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate text-zinc-100">{item.title}</span>
                        {item.status && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                              item.status === 'finalizado'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : item.status === 'trabajando'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                        <span>Enter</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ seleccionar</span>
            <span>esc cerrar</span>
          </div>
          <span className="text-zinc-400 text-[10px]">
            {activeProject ? activeProject.name : 'Sin proyecto'}
          </span>
        </div>
      </div>
    </div>
  );
};
