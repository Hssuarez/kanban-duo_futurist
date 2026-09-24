'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, User } from '@/lib/types';
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Settings,
  Users,
  Check,
} from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: (project: Project) => void;
  currentUser: User;
  users: User[];
  isMobile?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateProject,
  onOpenEditProject,
  currentUser,
  users,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const canEditActive = Boolean(
    activeProject &&
      (activeProject.createdBy === currentUser.id ||
        (currentUser.role === 'admin' &&
          Array.isArray(activeProject.memberIds) &&
          activeProject.memberIds.includes(currentUser.id)))
  );

  // Resolve member user objects
  const projectMembers = activeProject
    ? users.filter(
        (u) =>
          activeProject.memberIds?.includes(u.id) || u.id === activeProject.createdBy
      )
    : [];

  return (
    <div className={`relative font-sans ${isMobile ? 'w-full' : ''}`} ref={dropdownRef}>
      <div className={`flex items-center gap-1.5 ${isMobile ? 'w-full' : ''}`}>
        {/* Main Project Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-zinc-900/85 hover:bg-zinc-800/95 border border-white/[0.08] hover:border-cyan-500/30 rounded-lg text-xs transition-all shadow-sm group active:scale-[0.98] ${
            isMobile ? 'flex-1 min-w-0 justify-between' : ''
          }`}
          title="Cambiar de Tablero / Proyecto"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Color Indicator */}
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110 ${
                !activeProject ? 'bg-zinc-500 animate-pulse' : ''
              }`}
              style={
                activeProject
                  ? {
                      backgroundColor: activeProject.color || '#06b6d4',
                      boxShadow: `0 0 8px ${activeProject.color || '#06b6d4'}80`,
                    }
                  : undefined
              }
            />

            {/* Project Title */}
            <div
              className={`flex items-center gap-1.5 text-left min-w-0 ${
                isMobile ? 'flex-1' : 'max-w-[100px] sm:max-w-[120px] md:max-w-[130px] lg:max-w-[140px]'
              }`}
            >
              <span className="font-medium text-zinc-100 truncate text-xs block">
                {activeProject ? activeProject.name : 'Sin proyectos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Badge count */}
            <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-1.5 py-0.5 rounded font-medium">
              <Users className="w-2.5 h-2.5 text-zinc-400" />
              {projectMembers.length}
            </span>

            <ChevronDown
              className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Quick Settings Button for Project Creator or Admin */}
        {canEditActive && activeProject && (
          <button
            onClick={() => onOpenEditProject(activeProject)}
            title="Configurar proyecto y miembros"
            className="hidden xl:flex items-center justify-center h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all shadow-sm shrink-0 active:scale-[0.98]"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Create Project Button */}
        <button
          onClick={onOpenCreateProject}
          title="Crear un nuevo tablero de proyecto"
          className="hidden xl:flex items-center justify-center h-8 w-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
        </button>
      </div>

      {/* Mobile Dimmer Backdrop */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            transformOrigin: 'top left',
            backgroundColor: 'rgba(8, 12, 20, 0.98)',
          }}
          className={`absolute mt-2 backdrop-blur-2xl border border-cyan-500/25 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_25px_rgba(6,182,212,0.12)] py-1.5 z-50 animate-modal-enter text-zinc-200 ring-1 ring-cyan-500/20 ${
            isMobile ? 'left-0 right-0 w-full' : 'left-0 w-72 sm:w-84'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between bg-zinc-900/40">
            <span className="text-xs text-zinc-300 font-semibold flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
              <span>Proyectos disponibles ({projects.length})</span>
            </span>
          </div>

          {/* List of projects */}
          <div className="max-h-64 overflow-y-auto py-1 space-y-1 custom-scrollbar">
            {projects.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-zinc-400 mb-3">No tienes proyectos asignados todavía.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCreateProject();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear mi primer proyecto</span>
                </button>
              </div>
            ) : (
              projects.map((proj) => {
                const isActive = activeProject ? proj.id === activeProject.id : false;
                const isCreator = proj.createdBy === currentUser.id;
              const memberCount =
                (proj.memberIds?.length || 0) +
                (proj.memberIds?.includes(proj.createdBy) ? 0 : 1);

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    setIsOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 mx-1.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                    isActive
                      ? 'bg-cyan-950/25 border-cyan-500/35 text-white shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                      : 'border-transparent hover:bg-[#0f172a]/80 hover:border-cyan-500/20 text-zinc-300 hover:text-white'
                  }`}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(proj.id);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Color dot with subtle cyan halo if active */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full transition-transform duration-150 group-hover:scale-110"
                        style={{
                          backgroundColor: proj.color || '#06b6d4',
                          boxShadow: isActive
                            ? `0 0 10px ${proj.color || '#06b6d4'}, 0 0 4px rgba(6,182,212,0.8)`
                            : `0 0 4px ${proj.color || '#06b6d4'}40`,
                        }}
                      />
                      {isActive && (
                        <div
                          className="absolute -inset-1 rounded-full animate-pulse pointer-events-none opacity-40"
                          style={{
                            border: `1px solid ${proj.color || '#06b6d4'}`,
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs truncate ${
                            isActive
                              ? 'font-semibold text-white'
                              : 'font-medium text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {proj.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center text-[10px] font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded-full shrink-0">
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        {isCreator ? (
                          <span className="text-amber-400/95 font-medium">Creador</span>
                        ) : (
                          <span className="text-zinc-400">Compartido</span>
                        )}
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Users className="w-2.5 h-2.5 text-zinc-500" />
                          {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Active checkmark */}
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5] shrink-0" />
                    )}

                    {/* Settings icon directly in row if authorized */}
                    {(isCreator ||
                      (currentUser.role === 'admin' &&
                        Array.isArray(proj.memberIds) &&
                        proj.memberIds.includes(currentUser.id))) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onOpenEditProject(proj);
                        }}
                        className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Editar proyecto"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>

          {/* Action Footer: Create new project */}
          <div className="p-2 border-t border-white/[0.08] bg-zinc-950/40 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateProject();
              }}
              className="w-full py-2 px-3 bg-zinc-900/90 hover:bg-[#0f172a] border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-xs font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all duration-150 shadow-sm active:scale-[0.98] group"
            >
              <div className="w-4 h-4 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-900/80 group-hover:text-cyan-300 transition-colors">
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="font-medium">Crear nuevo proyecto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
