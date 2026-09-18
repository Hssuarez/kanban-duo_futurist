'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Challenge,
  ChallengeMember,
  ChallengeHabit,
  ChallengeLog,
  ChallengeDayInfo,
  ChallengeMemberCompliance,
} from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { HabitCell } from '../habits/HabitCell';
import { Habit, HabitLogStatus } from '@/lib/habitTypes';
import {
  Flame,
  Settings2,
  Calendar,
  Columns,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ChallengeMatrixProps {
  challenge: Challenge;
  members: ChallengeMember[];
  users: User[];
  habits: ChallengeHabit[];
  logs: ChallengeLog[];
  days: ChallengeDayInfo[];
  todayKey: string;
  currentUser: User;
  onToggleLog: (challengeId: string, challengeHabitId: string, userId: string, dateKey: string) => void;
  memberCompliances: ChallengeMemberCompliance[];
}

type MatrixViewMode = 'standard' | 'focused' | 'calendar_only';

export const ChallengeMatrix: React.FC<ChallengeMatrixProps> = ({
  challenge,
  members,
  users,
  habits,
  logs,
  days,
  todayKey,
  currentUser,
  onToggleLog,
  memberCompliances,
}) => {
  const [viewMode, setViewMode] = useState<MatrixViewMode>('standard');
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [memberColStyle, setMemberColStyle] = useState<'full' | 'avatar' | 'hidden'>('full');

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Auto-adapt for small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('focused');
      setMemberColStyle('avatar');
      setShowMetrics(false);
    }
  }, []);

  const handleSelectMode = (mode: MatrixViewMode) => {
    setViewMode(mode);
    if (mode === 'standard') {
      setMemberColStyle('full');
      setShowMetrics(true);
    } else if (mode === 'focused') {
      setMemberColStyle('avatar');
      setShowMetrics(false);
    } else if (mode === 'calendar_only') {
      setMemberColStyle('hidden');
      setShowMetrics(false);
    }
  };

  const scrollToDay = (dayNum: number) => {
    if (!tableContainerRef.current) return;
    let dayElement = tableContainerRef.current.querySelector(
      `[data-day-col="${dayNum}"]`
    ) as HTMLElement | null;

    // Si el día exacto no está (ej. inicio de mes o rango acotado), buscar el más cercano
    if (!dayElement) {
      const allCols = Array.from(
        tableContainerRef.current.querySelectorAll('[data-day-col]')
      ) as HTMLElement[];
      if (allCols.length > 0) {
        dayElement =
          allCols.find((el) => Number(el.getAttribute('data-day-col')) >= dayNum) ||
          allCols[allCols.length - 1];
      }
    }

    if (dayElement) {
      const containerLeft = tableContainerRef.current.getBoundingClientRect().left;
      const elementLeft = dayElement.getBoundingClientRect().left;
      const scrollOffset = elementLeft - containerLeft + tableContainerRef.current.scrollLeft - 80;
      tableContainerRef.current.scrollTo({
        left: Math.max(0, scrollOffset),
        behavior: 'smooth',
      });
    }
  };

  const handleScrollStep = (direction: 'left' | 'right') => {
    if (!tableContainerRef.current) return;
    const step = 220;
    tableContainerRef.current.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  const handleScrollToToday = () => {
    const todayDay = days.find((d) => d.isToday);
    if (todayDay) {
      scrollToDay(todayDay.dayNumber);
    } else {
      // Si hoy no está en el mes actual mostrado, ir al primer día activo del reto
      const activeDay = days.find((d) => !d.isOutsideChallenge) || days[0];
      if (activeDay) {
        scrollToDay(activeDay.dayNumber);
      }
    }
  };

  // Map de logs por userId_habitId_dateKey y por userId_dateKey para matching consistente
  const logMap = new Map<string, ChallengeLog>();
  logs.forEach((l) => {
    logMap.set(`${l.userId}_${l.challengeHabitId}_${l.dateKey}`, l);
    if (!logMap.has(`${l.userId}_${l.dateKey}`) || l.status === 'completed') {
      logMap.set(`${l.userId}_${l.dateKey}`, l);
    }
  });

  const primaryHabit = habits[0] || {
    id: 'chab-1',
    challengeId: challenge.id,
    title: 'Compromiso Principal',
    icon: '🏋️',
    displayOrder: 1,
    createdAt: '',
  };

  // Pseudo-Habit para alimentar HabitCell
  const virtualHabit: Habit = {
    id: primaryHabit.id,
    userId: currentUser.id,
    title: primaryHabit.title,
    icon: primaryHabit.icon,
    color: '#06b6d4',
    category: 'salud',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 1,
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl shadow-sm transition-colors overflow-hidden flex flex-col font-sans">
      {/* 1. Matrix Header Controls */}
      <div className="flex flex-col gap-2.5 p-4 sm:p-5 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-mono">
              Matriz de Consistencia
            </h3>
          </div>

          {/* Preset View Modes */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-white/[0.08] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSelectMode('standard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'standard'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Completo
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('focused')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'focused'
                  ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Días (Móvil)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('calendar_only')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'calendar_only'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Solo Días</span>
            </button>
          </div>
        </div>

        {/* Quick Navigation and Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {/* Controles de deslizamiento horizontal */}
            <div className="flex items-center bg-zinc-950 border border-white/[0.08] rounded-lg p-0.5 mr-1">
              <button
                type="button"
                onClick={() => handleScrollStep('left')}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Desplazar a la izquierda"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollStep('right')}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Desplazar a la derecha"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleScrollToToday}
              className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToDay(1)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              1-7
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(8)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              8-14
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(15)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              15-21
            </button>
            <button
              type="button"
              onClick={() => scrollToDay(22)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition-colors"
            >
              22-30
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setShowMetrics((prev) => !prev)}
              className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                showMetrics
                  ? 'bg-zinc-900 border-white/[0.08] text-amber-300'
                  : 'bg-zinc-950 border-white/[0.06] text-zinc-500 line-through'
              }`}
            >
              {showMetrics ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Racha / %</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Matrix Table with Local Horizontal Scroll */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto custom-scrollbar flex-1 relative scroll-smooth"
      >
        <table className="w-full border-collapse text-left min-w-max">
          {/* Table Header: Participant & Day Numbers */}
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/70 text-[11px] font-mono text-zinc-400">
              {/* Participant Column */}
              {memberColStyle === 'full' && (
                <th className="py-3 px-3 min-w-[140px] sm:min-w-[160px] font-semibold text-zinc-300 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  Participante
                </th>
              )}

              {memberColStyle === 'avatar' && (
                <th className="py-3 px-2 w-12 text-center font-semibold text-zinc-300 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  👥
                </th>
              )}

              {/* Días del Reto (01..30) */}
              {days.map((day) => (
                <th
                  key={day.dateKey}
                  data-day-col={day.dayNumber}
                  className={`py-2 px-1 text-center font-mono font-medium transition-colors select-none min-w-[32px] sm:min-w-[35px] ${
                    day.isToday
                      ? 'bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : day.isOutsideChallenge
                      ? 'opacity-35 text-zinc-600'
                      : 'hover:bg-zinc-900/40 text-zinc-400'
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-tighter text-zinc-500 mb-0.5">
                    {day.dayName}
                  </div>
                  <div
                    className={`text-xs inline-flex items-center justify-center ${
                      day.isToday
                        ? 'w-5 h-5 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : ''
                    }`}
                  >
                    {String(day.dayNumber).padStart(2, '0')}
                  </div>
                </th>
              ))}

              {/* Metrics Columns */}
              {showMetrics && (
                <th className="py-3 px-2 text-center font-semibold text-zinc-300 w-14 md:sticky md:right-14 z-20 bg-zinc-950/95 backdrop-blur-md">
                  %
                </th>
              )}

              {showMetrics && (
                <th className="py-3 px-2 text-center font-semibold text-amber-300 w-14 md:sticky md:right-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  Racha
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body: Member Rows */}
          <tbody className="divide-y divide-white/[0.04]">
            {members.map((member) => {
              const user =
                users.find((u) => u.id === member.userId) || {
                  id: member.userId,
                  name: 'Participante',
                  username: 'user',
                  role: 'user',
                  avatar: '',
                };

              const compliance = memberCompliances.find((c) => c.member.id === member.id);
              const isCurrentUser = member.userId === currentUser.id;

              // Color de porcentaje
              const pct = compliance?.percentage || 0;
              let pctColor = 'text-rose-400';
              if (pct >= 85) pctColor = 'text-emerald-400';
              else if (pct >= 75) pctColor = 'text-cyan-400';
              else if (pct >= 60) pctColor = 'text-amber-400';

              return (
                <tr
                  key={member.id}
                  className={`hover:bg-zinc-900/30 transition-colors group ${
                    isCurrentUser ? 'bg-cyan-950/10' : ''
                  }`}
                >
                  {/* Full Participant Column */}
                  {memberColStyle === 'full' && (
                    <td className="py-2.5 px-3 sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.slice(0, 1)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-medium truncate block ${
                              isCurrentUser ? 'text-cyan-300 font-bold' : 'text-white'
                            }`}
                          >
                            {user.name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-mono text-cyan-400/80 block">Tú</span>
                          )}
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Avatar Only Column (Mobile Compact) */}
                  {memberColStyle === 'avatar' && (
                    <td
                      className="py-2 px-2 text-center sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                      title={`${user.name} (${pct}%)`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full border mx-auto overflow-hidden flex items-center justify-center text-xs font-bold ${
                          isCurrentUser
                            ? 'border-cyan-400 ring-2 ring-cyan-500/30'
                            : 'border-white/[0.1] bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.slice(0, 1)
                        )}
                      </div>
                    </td>
                  )}

                  {/* Day Check-in Cells */}
                  {days.map((day) => {
                    const log =
                      logMap.get(`${member.userId}_${primaryHabit.id}_${day.dateKey}`) ||
                      logMap.get(`${member.userId}_${day.dateKey}`);
                    const joinedKey = (member.joinedAt ? member.joinedAt.slice(0, 10) : challenge.startDate) || challenge.startDate;
                    const isOutside = !!day.isOutsideChallenge;
                    const isBeforeJoin = joinedKey ? day.dateKey < joinedKey : false;

                    // PRIORIDAD TOTAL: si existe un check-in completado, se visualiza siempre como completado
                    let cellStatus: HabitLogStatus | undefined = undefined;
                    if (log && log.status === 'completed') {
                      cellStatus = 'completed';
                    } else if (isOutside || isBeforeJoin) {
                      cellStatus = 'not_applicable';
                    } else if (log) {
                      cellStatus = log.status;
                    }

                    return (
                      <td
                        key={day.dateKey}
                        data-day-col={day.dayNumber}
                        className={`py-1 px-0.5 sm:px-1 text-center transition-colors min-w-[32px] sm:min-w-[35px] ${
                          day.isToday ? 'bg-cyan-950/20 ring-1 ring-cyan-500/20' : ''
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center ${
                            !isCurrentUser || isOutside
                              ? 'pointer-events-none cursor-default opacity-90'
                              : ''
                          }`}
                          title={
                            isOutside
                              ? 'Fecha fuera del período del reto'
                              : !isCurrentUser
                              ? `${user.name}: Solo lectura (protegido por RLS)`
                              : undefined
                          }
                        >
                          <HabitCell
                            habit={virtualHabit}
                            dateKey={day.dateKey}
                            dayNumber={day.dayNumber}
                            status={cellStatus}
                            isToday={day.isToday}
                            isFuture={day.isFuture}
                            onToggle={(hId, dKey) => {
                              if (isCurrentUser && !isOutside && !day.isFuture) {
                                onToggleLog(challenge.id, primaryHabit.id, currentUser.id, dKey);
                              }
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}

                  {/* Percentage Column */}
                  {showMetrics && (
                    <td
                      className={`py-2.5 px-2 text-center font-mono font-bold text-xs md:sticky md:right-14 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors ${pctColor}`}
                    >
                      {pct}%
                    </td>
                  )}

                  {/* Streak Column */}
                  {showMetrics && (
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-xs text-amber-300 md:sticky md:right-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                      <div className="inline-flex items-center gap-0.5 justify-center">
                        {(compliance?.currentStreak || 0) > 0 && (
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30 animate-pulse" />
                        )}
                        <span>{compliance?.currentStreak || 0}</span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
