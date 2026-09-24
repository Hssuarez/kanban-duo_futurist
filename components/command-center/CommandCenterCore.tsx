'use client';

import React from 'react';
import { Sparkles, Shield, Compass } from 'lucide-react';

interface CommandCenterCoreProps {
  scale?: number;
  onCoreClick?: () => void;
}

export const CommandCenterCore: React.FC<CommandCenterCoreProps> = ({
  scale = 1,
  onCoreClick,
}) => {
  const baseSize = 210 * scale;

  return (
    <div
      onClick={onCoreClick}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center select-none cursor-default group"
      style={{ width: baseSize * 1.6, height: baseSize * 1.6 }}
    >
      {/* 1. Halo de atmósfera exterior profunda */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 animate-pulse"
        style={{
          width: baseSize * 1.45,
          height: baseSize * 1.45,
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(59, 130, 246, 0.12) 50%, transparent 75%)',
          filter: 'blur(28px)',
        }}
      />

      {/* 2. Anillos orbitales giratorios concéntricos del núcleo */}
      <div
        className="absolute rounded-full border border-cyan-500/25 border-dashed pointer-events-none animate-[spin_60s_linear_infinite]"
        style={{
          width: baseSize * 1.35,
          height: baseSize * 1.35,
        }}
      />
      <div
        className="absolute rounded-full border border-indigo-500/20 border-dotted pointer-events-none animate-[spin_45s_linear_infinite_reverse]"
        style={{
          width: baseSize * 1.2,
          height: baseSize * 1.2,
        }}
      />

      {/* 3. Esfera central holográfica del Núcleo KANBAN//DUO */}
      <div
        className="relative rounded-full border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col items-center justify-center text-center p-2 sm:p-4 md:p-6 backdrop-blur-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          width: baseSize,
          height: baseSize,
          background:
            'radial-gradient(circle at 35% 30%, rgba(6, 182, 212, 0.3) 0%, rgba(15, 23, 42, 0.85) 65%, #020617 100%)',
        }}
      >
        {/* Rejilla de coordenadas de fondo en la esfera */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
        />

        {/* Resplandor superior tipo lente de cristal (Fresnel specular highlight) */}
        <div
          className="absolute -top-12 -left-12 rounded-full pointer-events-none"
          style={{
            width: baseSize * 0.9,
            height: baseSize * 0.7,
            background:
              'radial-gradient(ellipse at 40% 40%, rgba(255, 255, 255, 0.4) 0%, rgba(6, 182, 212, 0.2) 45%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Logotipo KANBAN//DUO Central */}
        <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1.5">
          {/* Icono central de tres barras cyan */}
          <div
            className="rounded-xl sm:rounded-2xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-zinc-100 shadow-[0_0_15px_rgba(6,182,212,0.4)] mb-0.5"
            style={{
              width: Math.max(22, Math.round(36 * Math.min(1, scale))),
              height: Math.max(22, Math.round(36 * Math.min(1, scale))),
            }}
          >
            <div className="flex items-end gap-0.5 h-3 sm:h-4" aria-hidden="true">
              <div className="w-0.5 h-3 sm:h-4 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
              <div className="w-0.5 h-2 sm:h-3 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
              <div className="w-0.5 h-2.5 sm:h-3.5 bg-white/80 rounded-full" />
            </div>
          </div>

          {/* Título de Marca */}
          <h2
            className="font-mono font-black tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] leading-none"
            style={{
              fontSize: scale < 0.65 ? '10px' : scale < 0.85 ? '12px' : '14px',
            }}
          >
            KANBAN<span className="text-cyan-400 font-bold">//DUO</span>
          </h2>

          {/* Píldora HUD COMMAND CENTER */}
          <div
            className="rounded-full bg-cyan-950/80 border border-cyan-400/40 font-mono font-bold tracking-widest text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)] mt-0.5"
            style={{
              fontSize: scale < 0.65 ? '7px' : '9px',
              padding: scale < 0.65 ? '1px 6px' : '2px 8px',
            }}
          >
            COMMAND CENTER
          </div>

          {/* Lema */}
          {scale >= 0.75 && (
            <p className="text-[9px] text-zinc-400 font-sans tracking-wide mt-0.5">
              Organiza · Enfócate · Avanza
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
