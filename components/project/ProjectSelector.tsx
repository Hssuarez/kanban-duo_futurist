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
    <div className={`relative font-mono ${isMobile ? 'w-full' : ''}`} ref={dropdownRef}>
      <div className={`flex items-center gap-1.5 ${isMobile ? 'w-full' : ''}`}>
        {/* Main Project Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#0e1322] hover:bg-[#141b2e] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)] group ${
            isMobile ? 'flex-1 min-w-0 justify-between' : ''
          }`}
          title="Cambiar de Tablero / Proyecto"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Color Indicator */}
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: activeProject.color || '#06b6d4',
                boxShadow: `0 0 8px ${activeProject.color || '#06b6d4'}`,
              }}
            />

            {/* Project Title */}
            <div className={`flex items-center gap-1.5 text-left min-w-0 ${
              isMobile ? 'flex-1' : 'max-w-[130px] sm:max-w-[190px] md:max-w-[220px]'
            }`}>
              <span className="text-[10px] text-cyan-400/70 uppercase hidden sm:inline shrink-0">TABLERO:</span>
              <span className="font-bold text-white truncate tracking-wider text-xs block">
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
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-black"
                  />
                ))}
                {projectMembers.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[9px] text-slate-300 flex items-center justify-center font-bold ring-1 ring-black">
                    +{projectMembers.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Badge count */}
            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-900/90 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded font-bold">
              <Users className="w-2.5 h-2.5 text-cyan-400" />
              {projectMembers.length}
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 ${
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
            className="p-1.5 sm:p-2 bg-[#0e1322] hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400/70 text-slate-400 hover:text-cyan-300 rounded-xl transition-all shadow-sm shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Create Project Button */}
        <button
          onClick={onOpenCreateProject}
          title="Crear un nuevo tablero de proyecto"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-cyan-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-98 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
          <span className="uppercase tracking-wider text-[11px] inline">+ PROYECTO</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 bg-[#0c101c]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200 ${
            isMobile ? 'left-0 right-0 w-full' : 'left-0 w-72 sm:w-80'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-cyan-500/20 flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>// TABLEROS DISPONIBLES ({projects.length})</span>
            </span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase">ACCESO CONCEDIDO</span>
          </div>

          {/* List of projects */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-800/40 custom-scrollbar">
            {projects.map((proj) => {
              const isActive = proj.id === activeProject.id;
              const isCreator = proj.createdBy === currentUser.id;
              const memberCount = (proj.memberIds?.length || 0) + (proj.memberIds?.includes(proj.createdBy) ? 0 : 1);

              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 hover:bg-[#141b2e] cursor-pointer transition-colors group ${
                    isActive ? 'bg-cyan-950/30' : ''
                  }`}
                  onClick={() => {
                    onSelectProject(proj.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Glowing color dot */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: proj.color || '#06b6d4',
                        boxShadow: isActive ? `0 0 10px ${proj.color || '#06b6d4'}` : undefined,
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                          }`}
                        >
                          {proj.name}
                        </span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3] shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {isCreator ? (
                          <span className="text-amber-400 font-semibold">TÚ ERES CREADOR</span>
                        ) : (
                          <span>COMPARTIDO</span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5 text-slate-400" />
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
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-cyan-300 text-slate-400 rounded transition-opacity"
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
          <div className="p-2 border-t border-cyan-500/20">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateProject();
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-fuchsia-600/20 hover:from-cyan-600/50 hover:to-indigo-600/50 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-200 flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] uppercase tracking-wider active:scale-98"
            >
              <Plus className="w-4 h-4 text-cyan-400 stroke-[3]" />
              <span>CREAR NUEVO PROYECTO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
