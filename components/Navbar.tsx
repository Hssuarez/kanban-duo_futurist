'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, SpaceFilter, AppView, Project, Task } from '@/lib/types';
import { subscribeToPresence } from '@/lib/presence';
import { ProjectSelector } from './project/ProjectSelector';
import { NotificationCenter } from './notifications/NotificationCenter';
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
  tasks?: Task[];
  onOpenTaskDetail?: (taskId: string) => void;
  onOpenCommandPalette?: () => void;
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
  tasks = [],
  onOpenTaskDetail,
  onOpenCommandPalette,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPeerDropdown, setShowPeerDropdown] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const peerMenuRef = useRef<HTMLDivElement>(null);

  // Aceternity Animated Tabs sliding pill indicators
  const viewTabsRef = useRef<HTMLDivElement>(null);
  const [viewIndicator, setViewIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  const spaceTabsRef = useRef<HTMLDivElement>(null);
  const [spaceIndicator, setSpaceIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  // Update View Tabs sliding pill position
  useEffect(() => {
    if (!viewTabsRef.current) return;
    const activeEl = viewTabsRef.current.querySelector(`[data-view="${currentView}"]`) as HTMLElement;
    if (activeEl) {
      setViewIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [currentView]);



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

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserDropdown(false);
        setShowPeerDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Project members strictly belonging to activeProject
  const otherMembers = useMemo(() => {
    const memberIds = Array.isArray(activeProject?.memberIds) ? activeProject.memberIds : [];
    return users.filter(
      (u) =>
        (memberIds.includes(u.id) || u.id === activeProject?.createdBy) &&
        u.id !== currentUser.id &&
        u.isActive !== false
    );
  }, [users, activeProject, currentUser.id]);

  // If filtered teammate is not in active project, sanitize back to 'all'
  useEffect(() => {
    if (spaceFilter !== 'mine' && spaceFilter !== 'all') {
      const exists = otherMembers.some((m) => m.id === spaceFilter);
      if (!exists) {
        setSpaceFilter('all');
      }
    }
  }, [otherMembers, spaceFilter, setSpaceFilter]);

  // Selected teammate if spaceFilter is a specific user ID or 'peer'
  const selectedTeammate = useMemo(() => {
    return (
      otherMembers.find(
        (u) => u.id === spaceFilter || (spaceFilter === 'peer' && u.id === otherMembers[0]?.id)
      ) || otherMembers[0]
    );
  }, [otherMembers, spaceFilter]);

  const isPeerActive = spaceFilter !== 'mine' && spaceFilter !== 'all';

  // Update Space Tabs sliding pill position
  useEffect(() => {
    if (!spaceTabsRef.current) return;
    const spaceKey = spaceFilter === 'mine' ? 'mine' : spaceFilter === 'all' ? 'all' : 'peer';
    const activeEl = spaceTabsRef.current.querySelector(`[data-space="${spaceKey}"]`) as HTMLElement;
    if (activeEl) {
      setSpaceIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [spaceFilter, otherMembers, selectedTeammate]);

  // Re-measure on window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewTabsRef.current) {
        const activeEl = viewTabsRef.current.querySelector(`[data-view="${currentView}"]`) as HTMLElement;
        if (activeEl) setViewIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, ready: true });
      }
      if (spaceTabsRef.current) {
        const spaceKey = spaceFilter === 'mine' ? 'mine' : spaceFilter === 'all' ? 'all' : 'peer';
        const activeEl = spaceTabsRef.current.querySelector(`[data-space="${spaceKey}"]`) as HTMLElement;
        if (activeEl) setSpaceIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, ready: true });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentView, spaceFilter]);

  return (
    <header className="w-full bg-[#070c18]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-sm font-sans relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 relative z-30">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-zinc-100 shadow-[0_0_15px_rgba(6,182,212,0.18)]">
              <div className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
                <div className="w-0.5 h-3.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                <div className="w-0.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                <div className="w-0.5 h-3 bg-white/80 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-sm sm:text-base tracking-tight">
                  Kanban<span className="text-cyan-400 font-semibold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Duo</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Project Selector Switcher (Desktop only) */}
          <div className="hidden md:block shrink-0 relative z-30">
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

          {/* Search Bar / Command Palette Trigger (center, desktop only) */}
          <div className="flex-1 max-w-xs hidden lg:block">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 text-xs bg-zinc-900/80 hover:bg-zinc-900 border border-white/[0.08] hover:border-cyan-500/30 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all group cursor-pointer text-left shadow-sm"
              title="Buscar tareas, proyectos o ejecutar acciones rápidas (Ctrl+K)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                <span className="truncate">{searchQuery ? `Filtro: "${searchQuery}"` : 'Buscar o pulsar Ctrl+K...'}</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 group-hover:text-cyan-300 bg-zinc-800/90 rounded border border-white/[0.08] shrink-0">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Command Button for mobile / tablet */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Comandos y búsqueda rápida (Ctrl+K)"
              className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-900 border border-white/[0.08] rounded-lg transition-colors active:scale-95"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell Center */}
            <NotificationCenter
              currentUser={currentUser}
              activeProject={activeProject}
              tasks={tasks}
              onOpenTaskDetail={onOpenTaskDetail}
            />

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
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-[0_0_14px_rgba(6,182,212,0.28)] hover:shadow-[0_0_22px_rgba(6,182,212,0.48)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </button>

            {/* Current User Dropdown */}
            <div className="relative z-30" ref={userMenuRef}>
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
                  style={{
                    transformOrigin: 'top right',
                    backgroundColor: 'rgba(8, 12, 20, 0.98)',
                  }}
                  className="absolute right-0 mt-2 w-60 backdrop-blur-2xl border border-cyan-500/25 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_25px_rgba(6,182,212,0.1)] py-1.5 z-50 animate-modal-enter text-zinc-200 text-xs ring-1 ring-cyan-500/20"
                  onClick={() => setShowUserDropdown(false)}
                  role="menu"
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
        <div className="block md:hidden border-t border-white/[0.06] py-2 relative z-30">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/[0.06] py-2 overflow-visible gap-2 sm:gap-3 relative z-20">
          {/* Main App Section Tabs with Aceternity Animated Sliding Pill */}
          <div
            ref={viewTabsRef}
            className="flex items-center gap-1 p-0.5 bg-zinc-900/90 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-auto max-w-full relative"
          >
            {/* Sliding Pill Indicator */}
            {viewIndicator.ready && (
              <div
                className="absolute top-0.5 bottom-0.5 rounded-lg bg-zinc-800/95 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all duration-200 pointer-events-none"
                style={{
                  transform: `translateX(${viewIndicator.left}px)`,
                  width: `${viewIndicator.width}px`,
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              />
            )}

            <button
              data-view="board"
              onClick={() => setCurrentView('board')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                currentView === 'board'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tablero</span>
            </button>

            <button
              data-view="calendar"
              onClick={() => setCurrentView('calendar')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                currentView === 'calendar'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>

            <button
              data-view="dashboard"
              onClick={() => setCurrentView('dashboard')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                currentView === 'dashboard'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Métricas</span>
            </button>
          </div>

          {/* Space Navigation Tabs with Aceternity Animated Sliding Pill */}
          <div
            ref={spaceTabsRef}
            className="flex items-center gap-1 p-0.5 bg-zinc-900/90 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-auto max-w-full relative overflow-visible"
          >
            {/* Sliding Pill Indicator */}
            {spaceIndicator.ready && (
              <div
                className="absolute top-0.5 bottom-0.5 rounded-lg bg-zinc-800/95 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all duration-200 pointer-events-none"
                style={{
                  transform: `translateX(${spaceIndicator.left}px)`,
                  width: `${spaceIndicator.width}px`,
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              />
            )}

            {/* Mis tareas */}
            <button
              data-space="mine"
              onClick={() => setSpaceFilter('mine')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                spaceFilter === 'mine'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Mis tareas</span>
            </button>

            {/* Teammate(s) selector */}
            {otherMembers.length === 1 && (
              <button
                data-space="peer"
                onClick={() => {
                  setSpaceFilter(otherMembers[0].id);
                }}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                  isPeerActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1.5">
                  <span>{otherMembers[0].name.split(' ')[0]}</span>
                  {Boolean(onlineUserIds.includes(otherMembers[0].id)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-living-signal" title="En línea" />
                  )}
                </span>
              </button>
            )}

            {otherMembers.length > 1 && (
              /* Multiple teammates: interactive dropdown */
              <div className="relative z-20" ref={peerMenuRef}>
                <button
                  data-space="peer"
                  onClick={() => setShowPeerDropdown(!showPeerDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                    isPeerActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {isPeerActive && selectedTeammate
                      ? selectedTeammate.name.split(' ')[0]
                      : 'Compañeros'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${showPeerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPeerDropdown && (
                  <div
                    style={{
                      transformOrigin: 'top left',
                      backgroundColor: 'rgba(8, 12, 20, 0.98)',
                    }}
                    className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 backdrop-blur-2xl border border-cyan-500/25 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_25px_rgba(6,182,212,0.12)] py-1.5 z-50 animate-modal-enter text-zinc-200 text-xs ring-1 ring-cyan-500/20"
                    role="menu"
                  >
                    <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                      Filtrar por compañero
                    </div>
                    <div className="py-1 max-h-56 overflow-y-auto custom-scrollbar">
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
                            className={`w-full text-left px-3 py-2 hover:bg-zinc-800/70 flex items-center justify-between text-xs transition-colors ${
                              isSelected ? 'bg-zinc-800/50 text-white' : 'text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={member.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                                alt={member.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                              />
                              <div className="min-w-0">
                                <span className="truncate font-medium text-zinc-200 block text-xs">
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-zinc-500 capitalize block">
                                  {member.role === 'admin' ? 'Admin' : 'Miembro'}
                                </span>
                              </div>
                              {isOnline && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-living-signal shrink-0" title="En línea" />
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
              data-space="all"
              onClick={() => setSpaceFilter('all')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                spaceFilter === 'all'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
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
