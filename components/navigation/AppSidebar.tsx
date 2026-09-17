'use client';

import React from 'react';
import { User, AppView } from '@/lib/types';
import { HabitCoreSubView } from '@/lib/habitTypes';
import {
  Kanban,
  Calendar,
  BarChart3,
  Target,
  Trophy,
  Flag,
  Activity,
  Timer,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface AppSidebarProps {
  currentUser: User;
  currentView: AppView;
  habitSubView: HabitCoreSubView;
  onSelectWorkspaceView: (view: 'board' | 'calendar' | 'dashboard') => void;
  onSelectHabitSubView: (subView: HabitCoreSubView) => void;
  onOpenPomodoro?: () => void;
  onOpenProfileModal?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  currentView,
  habitSubView,
  onSelectWorkspaceView,
  onSelectHabitSubView,
  onOpenPomodoro,
  onOpenProfileModal,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const isWorkspaceActive = currentView === 'board' || currentView === 'calendar' || currentView === 'dashboard';
  const isHabitsActive = currentView === 'habits' || currentView === 'challenges' || currentView === 'goals' || currentView === 'progress';

  return (
    <>
      {/* Off-canvas Backdrop Dimmer */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Off-canvas Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#070c18]/95 backdrop-blur-2xl border-r border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between transition-transform duration-300 ease-out font-sans ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Logo & Close Button */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-zinc-100 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
              <div className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
                <div className="w-0.5 h-3.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                <div className="w-0.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                <div className="w-0.5 h-3 bg-white/80 rounded-full" />
              </div>
            </div>
            <div className="truncate">
              <h1 className="font-bold text-white text-sm tracking-tight font-mono">
                KANBAN<span className="text-cyan-400 font-semibold">//DUO</span>
              </h1>
              <span className="text-[10px] text-cyan-400/70 font-mono tracking-widest block uppercase">HUD Explorer</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Navigation Groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          {/* SECTION 1: WORKSPACE */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Workspace
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectWorkspaceView('board');
                onCloseMobile();
              }}
              title="Tablero Kanban"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'board'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Kanban className={`w-4 h-4 shrink-0 ${currentView === 'board' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Tablero</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectWorkspaceView('calendar');
                onCloseMobile();
              }}
              title="Calendario"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'calendar'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Calendar className={`w-4 h-4 shrink-0 ${currentView === 'calendar' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Calendario</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectWorkspaceView('dashboard');
                onCloseMobile();
              }}
              title="Métricas"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'dashboard'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <BarChart3 className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Métricas</span>}
            </button>
          </div>

          {/* SECTION 2: HABIT CORE (NUEVO DOMINIO INDEPENDIENTE) */}
          <div className="space-y-1 pt-2 border-t border-white/[0.04]">
            {!isCollapsed && (
              <div className="px-3 py-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Habit Core
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                  NEW
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectHabitSubView('habits');
                onCloseMobile();
              }}
              title="Mis Hábitos"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'habits' || (isHabitsActive && habitSubView === 'habits')
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Target className={`w-4 h-4 shrink-0 ${currentView === 'habits' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Mis hábitos</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectHabitSubView('challenges');
                onCloseMobile();
              }}
              title="Retos Compartidos"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'challenges' || (isHabitsActive && habitSubView === 'challenges')
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Trophy className={`w-4 h-4 shrink-0 ${currentView === 'challenges' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Retos</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectHabitSubView('goals');
                onCloseMobile();
              }}
              title="Objetivos"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'goals' || (isHabitsActive && habitSubView === 'goals')
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Flag className={`w-4 h-4 shrink-0 ${currentView === 'goals' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Objetivos</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectHabitSubView('progress');
                onCloseMobile();
              }}
              title="Progreso y Heatmap"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                currentView === 'progress' || (isHabitsActive && habitSubView === 'progress')
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Activity className={`w-4 h-4 shrink-0 ${currentView === 'progress' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span>Progreso</span>}
            </button>
          </div>

          {/* SECTION 3: HERRAMIENTAS */}
          <div className="space-y-1 pt-2 border-t border-white/[0.04]">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Herramientas
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenPomodoro?.();
                onCloseMobile();
              }}
              title="Temporizador Pomodoro"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-amber-300 hover:bg-zinc-900/60 transition-all group"
            >
              <Timer className="w-4 h-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Pomodoro</span>}
            </button>
          </div>
        </div>

        {/* Bottom: User Profile Pill & Settings */}
        <div className="p-3 border-t border-white/[0.06] bg-zinc-950/40">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400 leading-tight">
                    Online
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                title="Ajustes de Perfil y Temas"
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
