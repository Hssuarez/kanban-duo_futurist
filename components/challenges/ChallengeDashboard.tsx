'use client';

import React from 'react';
import { User } from '@/lib/types';
import { Trophy, Users, Plus, Shield, ArrowRight } from 'lucide-react';

interface ChallengeDashboardProps {
  currentUser: User;
  onOpenNewChallenge?: () => void;
  onBackToHabits?: () => void;
}

export const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({
  currentUser,
  onOpenNewChallenge,
  onBackToHabits,
}) => {
  return (
    <div className="space-y-5 font-sans animate-view-fade pb-10 w-full">
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 p-6 sm:p-8 rounded-2xl shadow-sm transition-colors text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] mx-auto mb-4">
          <Trophy className="w-8 h-8 stroke-[2]" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight mb-2">
          Retos Colaborativos — Shared Challenges
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 font-sans">
          Crea retos compartidos con tu equipo, invita a participantes de Kanban//Duo y compitan de manera sana con la matriz de consistencia multi-usuario (Filas = Miembros, Columnas = Días).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold mb-1">
              <Users className="w-4 h-4" />
              <span>Matriz de Equipo</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Cada usuario registra exclusivamente sus propios check-ins con permisos estrictos de miembro.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold mb-1">
              <Shield className="w-4 h-4" />
              <span>Integración con Kanban</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Crea tareas reales en Kanban//Duo vinculadas opcionalmente al reto sin acoplar los dominios.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onBackToHabits && (
            <button
              type="button"
              onClick={onBackToHabits}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Volver a Mis Hábitos
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewChallenge}
            className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 active:scale-95 cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Primer Reto (Fase C)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
