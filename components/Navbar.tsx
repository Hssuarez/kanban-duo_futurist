'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, SpaceFilter, AppView, Project } from '@/lib/types';
import { subscribeToPresence } from '@/lib/presence';
import { ProjectSelector } from './project/ProjectSelector';
import {
  Kanban,
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  User as UserIcon,
  Users,
  Shield,
  LogOut,
  Settings,
  Calendar,
  LayoutDashboard,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  activeProject: Project;
  onSelectProject: (projectId: string) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: (project: Project) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  spaceFilter: SpaceFilter;
  setSpaceFilter: (filter: SpaceFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenAdminPanel: () => void;
  onOpenProfileModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateProject,
  onOpenEditProject,
  currentView,
  setCurrentView,
  spaceFilter,
  setSpaceFilter,
  searchQuery,
  setSearchQuery,
  onOpenNewTaskModal,
  onOpenAdminPanel,
  onOpenProfileModal,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPeerDropdown, setShowPeerDropdown] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const peerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToPresence((ids) => setOnlineUserIds(ids));
    return () => unsub();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (peerMenuRef.current && !peerMenuRef.current.contains(e.target as Node)) {
        setShowPeerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Project members
  const projectMembers = users.filter(
    (u) =>
      activeProject.memberIds?.includes(u.id) ||
      u.id === activeProject.createdBy
  );
  const otherMembers = projectMembers.filter((u) => u.id !== currentUser.id);

  // Selected teammate if spaceFilter is a specific user ID or 'peer'
  const selectedTeammate = otherMembers.find(
    (u) => u.id === spaceFilter || (spaceFilter === 'peer' && u.id === otherMembers[0]?.id)
  ) || otherMembers[0];

  const isPeerActive = spaceFilter !== 'mine' && spaceFilter !== 'all';

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.08] shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-900 border border-white/[0.12] flex items-center justify-center text-zinc-100 shadow-sm">
              <Kanban className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-zinc-100 text-sm sm:text-base tracking-tight">
                  Kanban<span className="text-zinc-400 font-normal">Duo</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Project Selector Switcher (Desktop only) */}
          <div className="hidden md:block shrink-0">
            <ProjectSelector
              projects={projects}
              activeProject={activeProject}
              onSelectProject={onSelectProject}
              onOpenCreateProject={onOpenCreateProject}
              onOpenEditProject={onOpenEditProject}
              currentUser={currentUser}
              users={users}
            />
          </div>

          {/* Search Bar (center, desktop only) */}
          <div className="flex-1 max-w-xs hidden lg:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tareas..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/80 border border-white/[0.08] text-zinc-200 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Admin Panel Button */}
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenAdminPanel}
                title="Abrir Panel de Administración"
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98]"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* New Task Button */}
            <button
              onClick={onOpenNewTaskModal}
              title="Nueva Tarea"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium px-3 py-1.5 rounded-lg text-xs shadow-sm hover:shadow active:scale-[0.98] transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </button>

            {/* Current User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 bg-zinc-900/70 hover:bg-zinc-900 border border-white/[0.08] rounded-lg text-xs font-medium text-zinc-200 transition-all active:scale-[0.98]"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                />
                <span className="hidden sm:inline font-medium text-zinc-200">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div
                  style={{ transformOrigin: 'top right' }}
                  className="absolute right-0 mt-2 w-60 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl py-1.5 z-50 animate-modal-enter text-zinc-200 text-xs"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Cuenta activa
                      </span>
                      {currentUser.role === 'admin' && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-300 font-medium px-1.5 py-0.2 rounded border border-purple-500/20">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-zinc-100 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={onOpenProfileModal}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Mi perfil</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={onOpenAdminPanel}
                        className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-medium flex items-center gap-2 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Panel de administración</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-1 mt-1">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 font-medium flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Project Selector Bar (Visible only on mobile < md) */}
        <div className="block md:hidden border-t border-white/[0.06] py-2">
          <ProjectSelector
            projects={projects}
            activeProject={activeProject}
            onSelectProject={onSelectProject}
            onOpenCreateProject={onOpenCreateProject}
            onOpenEditProject={onOpenEditProject}
            currentUser={currentUser}
            users={users}
            isMobile={true}
          />
        </div>

        {/* Navigation Bar: Section Tabs & Space Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/[0.06] py-2 overflow-x-auto no-scrollbar gap-2 sm:gap-3">
          {/* Main App Section Tabs (Board / Calendar / Dashboard) */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-900/90 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setCurrentView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                currentView === 'board'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tablero</span>
            </button>

            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                currentView === 'calendar'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                currentView === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Métricas</span>
            </button>
          </div>

          {/* Space Navigation Tabs (Mine / Teammate(s) / All) */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-900/90 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
            {/* Mis tareas */}
            <button
              onClick={() => setSpaceFilter('mine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                spaceFilter === 'mine'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Mis tareas</span>
            </button>

            {/* Teammate(s) selector */}
            {otherMembers.length <= 1 ? (
              <button
                onClick={() => {
                  if (otherMembers[0]) {
                    setSpaceFilter(otherMembers[0].id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                  isPeerActive
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1.5">
                  <span>{otherMembers[0]?.name?.split(' ')[0] || 'Compañero'}</span>
                  {Boolean(otherMembers[0] && onlineUserIds.includes(otherMembers[0].id)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="En línea" />
                  )}
                </span>
              </button>
            ) : (
              /* Multiple teammates: interactive dropdown */
              <div className="relative" ref={peerMenuRef}>
                <button
                  onClick={() => setShowPeerDropdown(!showPeerDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                    isPeerActive
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {isPeerActive && selectedTeammate
                      ? selectedTeammate.name.split(' ')[0]
                      : 'Compañeros'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {showPeerDropdown && (
                  <div
                    style={{ transformOrigin: 'top left' }}
                    className="absolute left-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl py-1 z-50 animate-modal-enter text-zinc-200 text-xs"
                  >
                    <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] uppercase font-semibold text-zinc-500">
                      Filtrar por compañero
                    </div>
                    <div className="py-1 max-h-48 overflow-y-auto custom-scrollbar">
                      {otherMembers.map((member) => {
                        const isSelected = spaceFilter === member.id;
                        const isOnline = onlineUserIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => {
                              setSpaceFilter(member.id);
                              setShowPeerDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-zinc-800/60 flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                              />
                              <span className="truncate font-medium text-zinc-200">
                                {member.name}
                              </span>
                              {isOnline && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="En línea" />
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Todo el equipo */}
            <button
              onClick={() => setSpaceFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                spaceFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Todo el equipo</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 hidden xl:flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>En tiempo real</span>
          </div>
        </div>
      </div>
    </header>
  );
};
