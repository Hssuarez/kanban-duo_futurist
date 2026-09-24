'use client';

import React from 'react';
import { User } from '@/lib/types';
import { Activity, Flame, Sparkles } from 'lucide-react';

interface CommandCenterUserCoreProps {
  currentUser: User;
  consistencyPct: number;
  activeHabitsCount: number;
  scale?: number;
  onCoreClick?: () => void;
}

export const CommandCenterUserCore: React.FC<CommandCenterUserCoreProps> = ({
  currentUser,
  consistencyPct,
  activeHabitsCount,
  scale = 1,
  onCoreClick,
}) => {
  const baseSize = 190 * scale;
  const themeColor = '#10b981'; // Esmeralda Matrix

  return (
    <div
      onClick={onCoreClick}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center select-none cursor-pointer group"
      style={{ width: baseSize * 1.5, height: baseSize * 1.5 }}
      title="Haz clic para abrir Habit Core"
    >
      {/* 1. Halo de atmósfera exterior esmeralda / violeta */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 animate-pulse"
        style={{
          width: baseSize * 1.35,
          height: baseSize * 1.35,
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 75%)',
          filter: 'blur(24px)',
        }}
      />

      {/* 2. Anillos orbitales concéntricos */}
      <div
        className="absolute rounded-full border border-emerald-500/30 border-dashed pointer-events-none animate-[spin_55s_linear_infinite]"
        style={{
          width: baseSize * 1.25,
          height: baseSize * 1.25,
        }}
      />
      <div
        className="absolute rounded-full border border-teal-500/20 border-dotted pointer-events-none animate-[spin_40s_linear_infinite_reverse]"
        style={{
          width: baseSize * 1.12,
          height: baseSize * 1.12,
        }}
      />

      {/* 3. Esfera central holográfica del Usuario & Hábitos */}
      <div
        className="relative rounded-full border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.35)] flex flex-col items-center justify-center text-center p-2 sm:p-4 backdrop-blur-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]"
        style={{
          width: baseSize,
          height: baseSize,
          background:
            'radial-gradient(circle at 35% 30%, rgba(16, 185, 129, 0.28) 0%, rgba(15, 23, 42, 0.9) 65%, #020617 100%)',
        }}
      >
        {/* Rejilla interior */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#34d399 1px, transparent 1px), radial-gradient(#34d399 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            backgroundPosition: '0 0, 7px 7px',
          }}
        />

        {/* Resplandor superior de cristal */}
        <div
          className="absolute -top-10 -left-10 rounded-full pointer-events-none"
          style={{
            width: baseSize * 0.8,
            height: baseSize * 0.6,
            background:
              'radial-gradient(ellipse at 40% 40%, rgba(255, 255, 255, 0.35) 0%, rgba(16, 185, 129, 0.15) 45%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1 max-w-[90%]">
          {/* Indicador de Polo */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[8px] sm:text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HABIT CORE</span>
          </div>

          {/* Avatar del Usuario con borde resplandeciente */}
          <div className="relative my-0.5">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-300 text-xs shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 shadow-[0_0_6px_#34d399]" />
          </div>

          {/* Nombre del Usuario */}
          <h3
            className="font-mono font-black tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] truncate max-w-[130px] sm:max-w-[160px] leading-tight"
            style={{ fontSize: scale < 0.7 ? '11px' : scale < 0.9 ? '13px' : '14px' }}
          >
            {currentUser.name}
          </h3>

          {/* Métrica de Consistencia */}
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-emerald-300">
            <Flame className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span className="font-bold">{consistencyPct}%</span>
            <span className="text-zinc-400 text-[8px] sm:text-[9px]">Constancia</span>
          </div>

          {/* Píldora de Hábitos */}
          <span className="text-[8px] sm:text-[9px] font-mono text-zinc-400">
            {activeHabitsCount} hábitos activos
          </span>
        </div>
      </div>
    </div>
  );
};
