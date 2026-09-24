'use client';

import React from 'react';
import { Project, User } from '@/lib/types';
import { CommandCenterPole } from './commandCenterConfig';
import { Layers, Activity, Sparkles, ArrowRightLeft } from 'lucide-react';

interface CommandCenterBarycenterProps {
  activeProject: Project | null;
  currentUser: User;
  projectTaskCount: number;
  consistencyPct: number;
  activePole: CommandCenterPole;
  onSelectPole: (pole: CommandCenterPole) => void;
  isMobile: boolean;
  layoutMode: 'panoramic' | 'focus';
}

export const CommandCenterBarycenter: React.FC<CommandCenterBarycenterProps> = ({
  activeProject,
  currentUser,
  projectTaskCount,
  consistencyPct,
  activePole,
  onSelectPole,
  isMobile,
  layoutMode,
}) => {
  // En modo móvil / Focus, renderizamos el Switcher HUD superior de alto contraste
  if (layoutMode === 'focus') {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center p-1 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
          {/* Tab 1: Workspace */}
          <button
            type="button"
            onClick={() => onSelectPole('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 ${
              activePole === 'workspace'
                ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeProject?.color || '#06b6d4' }}
            />
            <span className="truncate max-w-[100px] sm:max-w-[130px]">
              {activeProject?.name || 'WORKSPACE'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 font-mono">
              {projectTaskCount}
            </span>
          </button>

          {/* Icono de enlace binario */}
          <div className="px-1 text-zinc-600">
            <ArrowRightLeft className="w-3 h-3" />
          </div>

          {/* Tab 2: Habit Core */}
          <button
            type="button"
            onClick={() => onSelectPole('habits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 ${
              activePole === 'habits'
                ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#34d399]" />
            <span>HÁBITOS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 font-mono">
              {consistencyPct}%
            </span>
          </button>
        </div>
      </div>
    );
  }

  // En modo panorámico (Desktop), renderizamos el Baricentro central entre ambos polos
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none select-none flex flex-col items-center justify-center">
      {/* Resplandor central sutil del baricentro */}
      <div
        className="w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Cápsula de Balance Dúo */}
      <div className="relative px-3.5 py-2 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_25px_rgba(0,0,0,0.8)] flex flex-col items-center gap-1 pointer-events-auto">
        {/* Cabecera del Baricentro */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-zinc-400">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>PUENTE GRAVITACIONAL DUO</span>
          <Sparkles className="w-3 h-3 text-emerald-400" />
        </div>

        {/* Indicadores balanceados */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="truncate max-w-[90px] font-bold">
              {activeProject?.name || 'Workspace'}
            </span>
            <span className="text-zinc-500 font-sans text-[10px]">({projectTaskCount})</span>
          </div>

          <span className="text-zinc-600 font-sans">⮂</span>

          <div className="flex items-center gap-1 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-bold">{currentUser.name.split(' ')[0]}</span>
            <span className="text-zinc-500 font-sans text-[10px]">({consistencyPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
