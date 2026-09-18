'use client';

import React from 'react';
import {
  Challenge,
  ChallengeMember,
  ChallengeHabit,
  ChallengeSummaryKpis,
  ChallengeSubTab,
} from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import {
  Trophy,
  Users,
  Flame,
  Layers,
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Handshake,
  CheckCircle2,
  Trash2,
  Target,
} from 'lucide-react';

interface ChallengeHeroHeaderProps {
  challenge: Challenge;
  kpis: ChallengeSummaryKpis;
  members: ChallengeMember[];
  users: User[];
  habits: ChallengeHabit[];
  currentSubTab: ChallengeSubTab;
  onChangeSubTab: (tab: ChallengeSubTab) => void;
  onOpenEditChallenge: () => void;
  onDeleteChallenge?: (challengeId: string) => void;
  onOpenInviteMembers: () => void;
  monthName: string;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  onBackToHabits?: () => void;
}

export const ChallengeHeroHeader: React.FC<ChallengeHeroHeaderProps> = ({
  challenge,
  kpis,
  members,
  users,
  habits,
  currentSubTab,
  onChangeSubTab,
  onOpenEditChallenge,
  onDeleteChallenge,
  onOpenInviteMembers,
  monthName,
  year,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onBackToHabits,
}) => {
  // SVG circular gauge properties
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, kpis.completionRate)) / 100) * circumference;

  // Participantes usuarios mapeados
  const memberUsers = members.map(
    (m) =>
      users.find((u) => u.id === m.userId) || {
        id: m.userId,
        name: 'Usuario',
        username: 'user',
        role: 'user',
        avatar: '',
      }
  );

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Main Hero Banner Card */}
      <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 p-5 sm:p-6 rounded-2xl shadow-sm transition-colors relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-zinc-900/90 border border-white/[0.1] flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              {challenge.icon}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-semibold">
                  En curso
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {challenge.durationDays} días de reto
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {challenge.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {challenge.description || 'Entrenar al menos 5 veces por semana y mantener la consistencia.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {challenge.startDate} – {challenge.endDate}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{kpis.daysRemaining} días restantes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Volver a Mis Hábitos & Edit Challenge */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-start shrink-0">
            {onBackToHabits && (
              <button
                type="button"
                onClick={onBackToHabits}
                className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              >
                <span>← Volver a Mis Hábitos</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenEditChallenge}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] hover:border-cyan-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Editar reto</span>
            </button>

            {onDeleteChallenge && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Estás seguro de que deseas eliminar el reto "${challenge.title}"? Se borrarán sus datos y check-ins asociados.`
                    )
                  ) {
                    onDeleteChallenge(challenge.id);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Eliminar reto permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Challenge KPI Row (5 HUD Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {/* KPI 1: Progreso General Circular Donut */}
        <div className="col-span-2 sm:col-span-1 bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3 relative overflow-hidden">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-zinc-800/60"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-cyan-400 transition-all duration-700 ease-out"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold font-mono text-white">
                {kpis.completionRate}%
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Progreso General
            </span>
            <span className="text-xs font-mono font-semibold text-white">
              {kpis.totalChecksCompleted} / {kpis.totalChecksExpected}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 block truncate">
              cumplimientos
            </span>
          </div>
        </div>

        {/* KPI 2: Racha del Reto */}
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Flame className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Racha del Reto
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-white">
              {kpis.currentTeamStreak} días
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block truncate">
              Mejor racha: {kpis.bestTeamStreak}d
            </span>
          </div>
        </div>

        {/* KPI 3: Participantes con Avatares */}
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                Participantes
              </span>
              <span className="text-[11px] font-mono font-bold text-white">
                {members.length}/{members.length}
              </span>
            </div>

            {/* Avatar Stack + Add Button */}
            <div className="flex items-center -space-x-1.5 pt-1.5">
              {memberUsers.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  className="w-5 h-5 rounded-full border border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden text-[9px] font-bold text-zinc-300 shrink-0"
                  title={u.name}
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    u.name ? u.name.slice(0, 1) : '?'
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={onOpenInviteMembers}
                className="w-5 h-5 rounded-full border border-dashed border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 flex items-center justify-center text-[10px] shrink-0 transition-colors"
                title="Invitar participante"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 4: Modo del Reto (Competitivo vs Colaborativo) */}
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              challenge.mode === 'competitive'
                ? 'bg-amber-950/40 border border-amber-500/30 text-amber-400'
                : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {challenge.mode === 'competitive' ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Handshake className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Modo del Reto
            </span>
            <div className="text-xs sm:text-sm font-bold font-mono text-white capitalize">
              {challenge.mode === 'competitive' ? 'Competitivo' : 'Colaborativo'}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block truncate">
              {challenge.mode === 'competitive' ? 'Leaderboard activo' : 'Progreso en equipo'}
            </span>
          </div>
        </div>

        {/* KPI 5: Compromiso / Meta Diaria del Reto */}
        <div className="col-span-2 md:col-span-1 bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Compromiso Diario
            </span>
            <div className="text-xs sm:text-sm font-bold font-mono text-white truncate" title={challenge.targetGoal || habits[0]?.title || 'Meta Diaria'}>
              {challenge.targetGoal || habits[0]?.title || 'Meta Diaria'}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block truncate">
              Actividad del reto
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-tabs Navigation Bar & Date Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-2">
        {/* Navigation Tabs (Strict Challenge Domain) */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950/90 rounded-xl border border-white/[0.08] overflow-x-auto custom-scrollbar">
          {(
            [
              { id: 'matrix', label: 'Matriz' },
              { id: 'progress', label: 'Progreso' },
              { id: 'goals', label: 'Objetivos' },
              { id: 'tasks', label: 'Tareas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all whitespace-nowrap ${
                currentSubTab === tab.id
                  ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-950/90 border border-white/[0.08] rounded-xl p-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              title="Mes anterior"
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 text-xs font-mono font-semibold text-white min-w-[110px] text-center capitalize">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              title="Mes siguiente"
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onGoToday}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-all active:scale-95"
          >
            Hoy
          </button>
        </div>
      </div>
    </div>
  );
};
