'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, SpaceFilter, AppView, Project, Task } from '@/lib/types';
import { subscribeToPresence } from '@/lib/presence';
import { ProjectSelector } from './project/ProjectSelector';
import { NotificationCenter } from './notifications/NotificationCenter';
import {
  subscribePomodoro,
  pausePomodoro,
  resumePomodoro,
  stopPomodoro,
  getPomodoroState,
  PomodoroState,
} from '@/lib/pomodoro';
import { getHudTheme, setHudTheme, HUD_THEMES, HudTheme, initHudTheme } from '@/lib/hudTheme';
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
  Zap,
  Pause,
  Play,
  Square,
  FileBarChart,
  Palette,
  Menu,
  Target,
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
  onOpenProjectReport?: () => void;
  onToggleSidebar?: () => void;
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
  onOpenProjectReport,
  onToggleSidebar,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPeerDropdown, setShowPeerDropdown] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [pomodoro, setPomodoro] = useState<PomodoroState>(getPomodoroState());
  const [activeTheme, setActiveTheme] = useState<HudTheme>('cyan');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const peerMenuRef = useRef<HTMLDivElement>(null);

  const isWorkspace = currentView === 'board' || currentView === 'calendar' || currentView === 'dashboard';

  useEffect(() => {
    initHudTheme();
    setActiveTheme(getHudTheme());
    const unsubPomodoro = subscribePomodoro(setPomodoro);

    const handleThemeChange = (e: CustomEvent<HudTheme>) => {
      if (e.detail) setActiveTheme(e.detail);
    };

    window.addEventListener('kanban_theme_update', handleThemeChange as EventListener);
    return () => {
      unsubPomodoro();
      window.removeEventListener('kanban_theme_update', handleThemeChange as EventListener);
    };
  }, []);

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
      const parentRect = spaceTabsRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setSpaceIndicator({
        left: elRect.left - parentRect.left,
        width: elRect.width,
        ready: true,
      });
    }
  }, [spaceFilter, otherMembers, selectedTeammate]);

  // Re-measure on window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewTabsRef.current) {
        const activeEl = viewTabsRef.current.querySelector(`[data-view="${currentView}"]`) as HTMLElement;
        if (activeEl) {
          const parentRect = viewTabsRef.current.getBoundingClientRect();
          const elRect = activeEl.getBoundingClientRect();
          setViewIndicator({ left: elRect.left - parentRect.left, width: elRect.width, ready: true });
        }
      }
      if (spaceTabsRef.current) {
        const spaceKey = spaceFilter === 'mine' ? 'mine' : spaceFilter === 'all' ? 'all' : 'peer';
        const activeEl = spaceTabsRef.current.querySelector(`[data-space="${spaceKey}"]`) as HTMLElement;
        if (activeEl) {
          const parentRect = spaceTabsRef.current.getBoundingClientRect();
          const elRect = activeEl.getBoundingClientRect();
          setSpaceIndicator({ left: elRect.left - parentRect.left, width: elRect.width, ready: true });
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentView, spaceFilter]);

  return (
    <header className="w-full bg-[#070c18]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-sm font-sans relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 relative ${showUserDropdown ? 'z-50' : 'z-40'}`}>
          {/* Brand Logo & Sidebar Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors mr-0.5"
                title="Abrir menú lateral (Workspace / Habit Core)"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-zinc-100 shadow-[0_0_15px_rgba(6,182,212,0.18)]">
              <div className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
                <div className="w-0.5 h-3.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                <div className="w-0.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                <div className="w-0.5 h-3 bg-white/80 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="hidden sm:block font-bold text-white text-sm sm:text-base tracking-tight font-mono">
                  Kanban<span className="text-cyan-400 font-semibold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Duo</span>
                </h1>
              </div>
            </div>

            {/* Global Domain Switcher: Workspace vs Habit Core */}
            <div className="hidden xl:flex items-center p-0.5 bg-zinc-900/90 rounded-xl border border-white/[0.08] shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setCurrentView('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'board' || currentView === 'calendar' || currentView === 'dashboard'
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm ring-1 ring-white/10'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Kanban className="w-3 h-3" />
                <span>Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('habits')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'habits' || currentView === 'challenges' || currentView === 'goals' || currentView === 'progress'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Target className="w-3 h-3 text-cyan-400" />
                <span>Habit Core</span>
                <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 font-bold">
                  NEW
                </span>
              </button>
            </div>
          </div>

          {/* Project Selector Switcher (Desktop only, only for Workspace) */}
          {(currentView === 'board' || currentView === 'calendar' || currentView === 'dashboard') && (
            <div className="hidden lg:block shrink-0 relative z-30">
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
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Command & Search Button (Ctrl+K) */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Comandos y búsqueda rápida (Ctrl+K)"
              className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Active Pomodoro HUD Countdown Widget */}
            {(pomodoro.isRunning || (pomodoro.taskId && pomodoro.remainingSeconds < pomodoro.totalSeconds)) && (
              <div
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-[#090f1f] border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-xs font-mono animate-modal-enter"
                title={`Sesión de enfoque: ${pomodoro.taskTitle || 'Tarea'}`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-amber-300">
                  {Math.floor(pomodoro.remainingSeconds / 60)}:
                  {(pomodoro.remainingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="hidden xl:inline text-zinc-400 max-w-[90px] truncate text-[10px]">
                  {pomodoro.taskTitle}
                </span>
                <div className="flex items-center gap-0.5 ml-0.5">
                  {pomodoro.isRunning ? (
                    <button
                      type="button"
                      onClick={pausePomodoro}
                      title="Pausar enfoque"
                      className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Pause className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumePomodoro}
                      title="Reanudar enfoque"
                      className="p-1 hover:text-white text-amber-400 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Play className="w-2.5 h-2.5 fill-amber-400" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopPomodoro}
                    title="Detener sesión"
                    className="p-1 hover:text-rose-400 text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Square className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Project Report Button */}
            {onOpenProjectReport && (
              <button
                type="button"
                onClick={onOpenProjectReport}
                title="Generar y Exportar Reporte Ejecutivo de Proyecto (PDF, CSV, Markdown)"
                className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-cyan-300 bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-cyan-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <FileBarChart className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Unified HUD Action Dock: Campana, Admin, Nueva tarea, Stephan */}
            <div className="flex items-center p-1 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-sm gap-1 sm:gap-1.5 shrink-0">
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
                  type="button"
                  onClick={onOpenAdminPanel}
                  title="Abrir Panel de Administración"
                  className="h-8 inline-flex items-center gap-1.5 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="hidden xl:inline">Admin</span>
                </button>
              )}

              {/* Subtle vertical divider */}
              <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

              {/* New Task Button */}
              <button
                type="button"
                onClick={onOpenNewTaskModal}
                title="Nueva Tarea"
                className="h-8 inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-bold px-2.5 sm:px-3 rounded-lg text-xs shadow-[0_0_14px_rgba(6,182,212,0.28)] hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] shrink-0" />
                <span className="hidden sm:inline">Nueva tarea</span>
              </button>

              {/* Subtle vertical divider */}
              <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

              {/* Current User Dropdown */}
              <div className={`relative ${showUserDropdown ? 'z-50' : 'z-30'}`} ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  title={`Usuario: ${currentUser.name}`}
                  className="h-8 flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-cyan-500/30 flex items-center justify-center bg-zinc-800">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover shrink-0"
                      style={{ width: 24, height: 24 }}
                    />
                  </div>
                  <span className="hidden md:inline font-medium text-zinc-200 max-w-[80px] md:max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 shrink-0 transition-transform duration-150 hidden sm:block ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

              {/* Mobile Dimmer Backdrop for User Menu */}
              {showUserDropdown && (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(false);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(false);
                  }}
                />
              )}

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

                  {/* HUD Theme Selector */}
                  <div className="px-3 py-2 border-t border-white/[0.06] bg-zinc-950/40">
                    <span className="text-[10px] text-zinc-400 font-medium block mb-1.5 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-cyan-400" />
                      Tema Visual HUD
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {HUD_THEMES.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHudTheme(th.id);
                          }}
                          className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            activeTheme === th.id
                              ? 'bg-zinc-800 border-white/40 ring-1 ring-white/30'
                              : 'bg-zinc-950/60 border-white/[0.06] hover:bg-zinc-900'
                          }`}
                          title={`${th.name} (${th.tagline})`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: th.primaryColor }}
                          />
                          <span className="text-[9px] font-mono text-zinc-400">
                            {th.id}
                          </span>
                        </button>
                      ))}
                    </div>
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
        </div>

        {isWorkspace && (
          <>
            {/* Mobile/Tablet Project Selector Bar (Visible only on < lg) */}
            <div className="block lg:hidden border-t border-white/[0.06] py-2 relative z-20">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/[0.06] py-2 overflow-visible gap-2 sm:gap-3 relative z-10">
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
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
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
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
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
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
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
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
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
                className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                  isPeerActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1.5">
                  <span className="max-w-[75px] sm:max-w-none truncate">{otherMembers[0].name.split(' ')[0]}</span>
                  {Boolean(onlineUserIds.includes(otherMembers[0].id)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-living-signal shrink-0" title="En línea" />
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
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                    isPeerActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="max-w-[70px] sm:max-w-none truncate">
                    {isPeerActive && selectedTeammate
                      ? selectedTeammate.name.split(' ')[0]
                      : 'Compañeros'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${showPeerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Dimmer Backdrop for Peer Dropdown */}
                {showPeerDropdown && (
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPeerDropdown(false);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setShowPeerDropdown(false);
                    }}
                  />
                )}

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
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap active:scale-[0.98] ${
                spaceFilter === 'all'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>
                <span className="sm:hidden">Equipo</span>
                <span className="hidden sm:inline">Todo el equipo</span>
              </span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 hidden xl:flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>En tiempo real</span>
          </div>
        </div>
      </>
    )}
    </div>
  </header>
  );
};
