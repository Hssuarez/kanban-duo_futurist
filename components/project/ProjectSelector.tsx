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
  Layers,
} from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project;
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

  const canEditActive =
    currentUser.role === 'admin' || activeProject.createdBy === currentUser.id;

  // Resolve member user objects
  const projectMembers = users.filter((u) =>
    activeProject.memberIds?.includes(u.id) || u.id === activeProject.createdBy
  );

  return (
    <div className={`relative font-sans ${isMobile ? 'w-full' : ''}`} ref={dropdownRef}>
      <div className={`flex items-center gap-1.5 ${isMobile ? 'w-full' : ''}`}>
        {/* Main Project Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs transition-all shadow-sm group active:scale-[0.98] ${
            isMobile ? 'flex-1 min-w-0 justify-between' : ''
          }`}
          title="Cambiar de Tablero / Proyecto"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Color Indicator */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: activeProject.color || '#3b82f6',
              }}
            />

            {/* Project Title */}
            <div className={`flex items-center gap-1.5 text-left min-w-0 ${
              isMobile ? 'flex-1' : 'max-w-[130px] sm:max-w-[190px] md:max-w-[220px]'
            }`}>
              <span className="font-medium text-zinc-100 truncate text-xs block">
                {activeProject.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Member Avatars Stack on larger screens */}
            {!isMobile && (
              <div className="hidden lg:flex items-center -space-x-1.5 ml-1">
                {projectMembers.slice(0, 3).map((m) => (
                  <img
                    key={m.id}
                    src={m.avatar}
                    alt={m.name}
                    title={m.name}
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-950"
                  />
                ))}
                {projectMembers.length > 3 && (
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-[8px] text-zinc-300 flex items-center justify-center font-medium ring-1 ring-zinc-950">
                    +{projectMembers.length - 3}
                  </span>
                )}
              </div>
            )}

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
        {canEditActive && (
          <button
            onClick={() => onOpenEditProject(activeProject)}
            title="Configurar proyecto y miembros"
            className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all shadow-sm shrink-0 active:scale-[0.98]"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Create Project Button */}
        <button
          onClick={onOpenCreateProject}
          title="Crear un nuevo tablero de proyecto"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] inline">Proyecto</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{ transformOrigin: 'top left' }}
          className={`absolute mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl py-1 z-50 animate-modal-enter text-zinc-200 ${
            isMobile ? 'left-0 right-0 w-full' : 'left-0 w-72 sm:w-80'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
              <span>Proyectos disponibles ({projects.length})</span>
            </span>
          </div>

          {/* List of projects */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-white/[0.04]">
            {projects.map((proj) => {
              const isActive = proj.id === activeProject.id;
              const isCreator = proj.createdBy === currentUser.id;
              const memberCount = (proj.memberIds?.length || 0) + (proj.memberIds?.includes(proj.createdBy) ? 0 : 1);

              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between px-3.5 py-2 hover:bg-zinc-800/60 cursor-pointer transition-colors group ${
                    isActive ? 'bg-zinc-800/40' : ''
                  }`}
                  onClick={() => {
                    onSelectProject(proj.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Color dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: proj.color || '#3b82f6',
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-medium truncate ${
                            isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {proj.name}
                        </span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-zinc-300 stroke-[2.5] shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        {isCreator ? (
                          <span className="text-amber-400/90 font-medium">Creador</span>
                        ) : (
                          <span>Compartido</span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {memberCount} miembros
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settings icon directly in row if authorized */}
                  {(currentUser.role === 'admin' || isCreator) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        onOpenEditProject(proj);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-white text-zinc-400 rounded transition-opacity"
                      title="Editar proyecto"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer: Create new project */}
          <div className="p-2 border-t border-white/[0.06]">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateProject();
              }}
              className="w-full py-1.5 px-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Crear nuevo proyecto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
