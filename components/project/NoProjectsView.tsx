'use client';

import React from 'react';
import { User } from '@/lib/types';
import {
  FolderPlus,
  Sparkles,
  Kanban,
  Calendar,
  ShieldCheck,
  Plus,
  Users,
} from 'lucide-react';

interface NoProjectsViewProps {
  currentUser: User;
  onOpenCreateProject: () => void;
  viewName?: 'board' | 'calendar' | 'dashboard';
}

export const NoProjectsView: React.FC<NoProjectsViewProps> = ({
  currentUser,
  onOpenCreateProject,
  viewName = 'board',
}) => {
  const firstName = currentUser?.name?.split(' ')[0] || 'Usuario';

  return (
    <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 font-sans">
      <div className="relative w-full max-w-2xl bg-[#090e1c]/90 border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.12)] p-6 sm:p-10 backdrop-blur-xl text-center overflow-hidden animate-modal-enter">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="tracking-widest uppercase text-[11px]">Primer Ingreso // Workspace Privado</span>
        </div>

        {/* Hero Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-indigo-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] mb-6 group transition-transform hover:scale-105">
          <FolderPlus className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
        </div>

        {/* Welcome Titles */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2">
          ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">{firstName}</span>!
        </h2>
        <h3 className="text-sm sm:text-base font-medium text-zinc-300 mb-4">
          Aún no tienes acceso a ningún proyecto asignado.
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed mb-8">
          En <span className="text-zinc-200 font-medium">KANBAN//DUO</span>, cada proyecto es un espacio aislado y privado. Para comenzar a registrar tus tareas, interactuar con el calendario y colaborar, necesitas fundar tu primer proyecto o ser invitado a uno existente.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-cyan-500/25 transition-all">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mb-2.5">
              <Kanban className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1">Tablero Ágil</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Organiza tus tareas en Iniciado, Trabajando y Finalizado con temporizador Pomodoro.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-cyan-500/25 transition-all">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center mb-2.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1">Calendario Dinámico</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Visualiza fechas de entrega y plazos clave en cuadrículas mensuales sincronizadas.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-cyan-500/25 transition-all">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1">Espacio 100% Privado</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Tus proyectos solo son visibles para ti y los compañeros que decidas invitar.
            </p>
          </div>
        </div>

        {/* Main Call to Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear mi primer proyecto</span>
          </button>
        </div>

        {/* Secondary Info / Invitation Note */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Users className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            ¿Esperabas ver un proyecto de equipo? Pídele a un administrador que te agregue a la lista de miembros.
          </span>
        </div>
      </div>
    </div>
  );
};
