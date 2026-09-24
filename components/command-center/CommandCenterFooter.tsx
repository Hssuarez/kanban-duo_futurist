'use client';

import React from 'react';
import { Zap, Activity, ChevronsRight } from 'lucide-react';

export const CommandCenterFooter: React.FC = () => {
  return (
    <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 font-sans relative z-30 select-none">
      {/* Píldora Izquierda: Disciplina y Enfoque */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#070c18]/80 border border-white/[0.08] backdrop-blur-md shadow-lg w-full sm:w-auto">
        <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-300 italic truncate">
            &ldquo;Disciplina hoy, resultados mañana.&rdquo;
          </p>
          <div className="w-20 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full mt-1" />
        </div>
      </div>

      {/* Indicador Central: Brújula / Radar */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-cyan-400/80 bg-cyan-950/30 px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
        <ChevronsRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Tu productividad orbita aquí</span>
        <ChevronsRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
      </div>

      {/* Píldora Derecha: Progreso Continuo */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#070c18]/80 border border-white/[0.08] backdrop-blur-md shadow-lg w-full sm:w-auto">
        <div className="w-6 h-6 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-300 italic truncate">
            &ldquo;Seguimos construyendo algo increíble.&rdquo;
          </p>
          <div className="w-20 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent rounded-full mt-1" />
        </div>
      </div>
    </footer>
  );
};
