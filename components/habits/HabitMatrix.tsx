'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Habit, HabitLog, HabitLogStatus } from '@/lib/habitTypes';
import { HabitCell } from './HabitCell';
import {
  MonthDayInfo,
  calculateHabitStreak,
  isHabitScheduledForDay,
  MONTH_NAMES_ES,
} from '@/lib/habitCalculations';
import {
  Grid,
  ChevronRight,
  ChevronDown,
  Calendar,
  Sparkles,
  Columns,
  Eye,
  EyeOff,
  Navigation,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';

interface HabitMatrixProps {
  habits: Habit[];
  logs: HabitLog[];
  days: MonthDayInfo[];
  year: number;
  month: number;
  todayKey: string;
  onToggleCell: (habitId: string, dateKey: string) => void;
  onSetCellStatus?: (habitId: string, dateKey: string, status: HabitLogStatus) => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onResetMonthChecks?: () => void;
}

type MatrixViewMode = 'standard' | 'focused' | 'calendar_only';
type HabitColStyle = 'full' | 'icon' | 'hidden';

export const HabitMatrix: React.FC<HabitMatrixProps> = ({
  habits,
  logs,
  days,
  year,
  month,
  todayKey,
  onToggleCell,
  onSetCellStatus,
  onOpenNewHabit,
  onEditHabit,
  onResetMonthChecks,
}) => {
  const [viewMode, setViewMode] = useState<MatrixViewMode>('standard');
  const [habitColStyle, setHabitColStyle] = useState<HabitColStyle>('full');
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Detección automática para móviles
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('focused');
      setHabitColStyle('icon');
      setShowMetrics(false);
    }
  }, []);

  const handleSelectMode = (mode: MatrixViewMode) => {
    setViewMode(mode);
    setShowViewDropdown(false);
    if (mode === 'standard') {
      setHabitColStyle('full');
      setShowMetrics(true);
    } else if (mode === 'focused') {
      setHabitColStyle('icon');
      setShowMetrics(false);
    } else if (mode === 'calendar_only') {
      setHabitColStyle('hidden');
      setShowMetrics(false);
    }
  };

  const handleToggleHabitColumn = () => {
    if (habitColStyle === 'full') {
      setHabitColStyle('icon');
      setViewMode('focused');
    } else if (habitColStyle === 'icon') {
      setHabitColStyle('hidden');
      setViewMode('calendar_only');
    } else {
      setHabitColStyle('full');
      setViewMode('standard');
    }
  };

  const handleToggleMetrics = () => {
    setShowMetrics((prev) => !prev);
  };

  const scrollToDay = (dayNum: number) => {
    if (!tableContainerRef.current) return;
    const dayElement = tableContainerRef.current.querySelector(
      `[data-day-col="${dayNum}"]`
    ) as HTMLElement | null;

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

  const handleScrollToToday = () => {
    const todayDay = days.find((d) => d.isToday);
    if (todayDay) {
      scrollToDay(todayDay.dayNumber);
    }
  };

  // Cerrar modal de confirmación con tecla Escape
  useEffect(() => {
    if (!showResetModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResetModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResetModal]);

  const handleConfirmReset = async () => {
    if (!onResetMonthChecks) return;
    setIsResetting(true);
    try {
      await onResetMonthChecks();
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);

  // Mapa rápido de logs
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  const monthName = MONTH_NAMES_ES[month - 1];

  return (
    <div className="bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl shadow-sm transition-colors overflow-hidden flex flex-col font-sans">
      {/* 1. Matrix Header matching exact mockup */}
      <div className="flex items-center justify-between p-4 sm:p-4.5 border-b border-white/[0.06]">
        {/* Título de la Matriz */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-mono truncate">
            Matriz de Hábitos — {monthName} {year}
          </h3>
        </div>

        {/* Right Controls: Reset Button, Arrow and Vista: Mensual */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0">
          {/* Botón de Limpiar / Resetear Checks del Mes */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            title={`Reiniciar checks de ${monthName} ${year}`}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900/80 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/35 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 group shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-400 transition-transform group-hover:-rotate-45" />
            <span className="hidden lg:inline">Limpiar mes</span>
          </button>

          <button
            type="button"
            onClick={handleScrollToToday}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
            title="Deslizar a Hoy"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Vista */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowViewDropdown((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-white/[0.1] hover:border-cyan-500/30 text-xs font-mono text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                Vista:{' '}
                {viewMode === 'standard'
                  ? 'Mensual'
                  : viewMode === 'focused'
                  ? 'Enfoque'
                  : 'Calendario'}
              </span>
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            </button>

            {showViewDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#090e1d] border border-cyan-500/30 shadow-2xl p-1 z-30 font-mono text-xs animate-scale-in">
                <button
                  type="button"
                  onClick={() => handleSelectMode('standard')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                    viewMode === 'standard'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Mensual (Completo)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('focused')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === 'focused'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Enfoque Días (Móvil)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('calendar_only')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === 'calendar_only'
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Solo Calendario</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Responsive View Controls Toolbar (Botones solicitados por el usuario) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-zinc-950/40 border-b border-white/[0.04]">
        {/* Preset View Modes */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-white/[0.08]">
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
            <span>Enfoque Días (Móvil)</span>
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
            <span>Solo Calendario</span>
          </button>
        </div>

        {/* Quick Individual Toggles: Hábito & Racha / % */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={handleToggleHabitColumn}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              habitColStyle === 'full'
                ? 'bg-zinc-900 border-white/[0.08] text-zinc-300'
                : habitColStyle === 'icon'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 font-semibold'
                : 'bg-zinc-950 border-white/[0.06] text-zinc-500 line-through'
            }`}
            title="Alternar columna de hábitos: Nombre / Solo Icono / Oculto"
          >
            <Columns className="w-3 h-3 text-cyan-400" />
            <span>
              Hábito:{' '}
              {habitColStyle === 'full'
                ? 'Nombre'
                : habitColStyle === 'icon'
                ? 'Solo Icono'
                : 'Oculto'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleMetrics}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showMetrics
                ? 'bg-zinc-900 border-white/[0.08] text-amber-300 font-semibold'
                : 'bg-zinc-950 border-white/[0.06] text-zinc-500 line-through'
            }`}
            title="Mostrar u ocultar columnas de Racha y Porcentaje"
          >
            {showMetrics ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3" />}
            <span>Racha / %</span>
          </button>
        </div>

        {/* Quick Day Jump Shortcuts */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 overflow-x-auto custom-scrollbar">
          <span className="text-zinc-500 hidden md:inline">Saltar a:</span>
          <button
            type="button"
            onClick={handleScrollToToday}
            className="px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Navigation className="w-2.5 h-2.5" />
            <span>Hoy</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToDay(1)}
            className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] cursor-pointer"
          >
            1-7
          </button>
          <button
            type="button"
            onClick={() => scrollToDay(8)}
            className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] cursor-pointer"
          >
            8-14
          </button>
          <button
            type="button"
            onClick={() => scrollToDay(15)}
            className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] cursor-pointer"
          >
            15-21
          </button>
          <button
            type="button"
            onClick={() => scrollToDay(22)}
            className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] cursor-pointer"
          >
            22-28
          </button>
          {days.length > 28 && (
            <button
              type="button"
              onClick={() => scrollToDay(29)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] cursor-pointer"
            >
              29-{days.length}
            </button>
          )}
        </div>
      </div>

      {/* 3. Table Container with Horizontal Scroll */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto custom-scrollbar flex-1 relative scroll-smooth"
      >
        <table className="w-full border-collapse text-left min-w-max">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/70 text-[10px] sm:text-[11px] font-mono text-zinc-400">
              {/* # Index Column */}
              {habitColStyle === 'full' && (
                <th className="py-2.5 px-2 w-8 text-center font-semibold text-zinc-500 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  #
                </th>
              )}

              {/* Habit Name Column */}
              {habitColStyle === 'full' && (
                <th className="py-2.5 px-3 min-w-[140px] sm:min-w-[160px] font-semibold text-zinc-300 sticky left-8 z-20 bg-zinc-950/95 backdrop-blur-md">
                  HÁBITO
                </th>
              )}

              {habitColStyle === 'icon' && (
                <th className="py-2.5 px-2 w-10 text-center font-semibold text-zinc-300 sticky left-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  🎯
                </th>
              )}

              {/* Días del mes (01..30) con corredor vertical continuo para el día actual */}
              {days.map((day) => {
                const isToday = day.isToday;

                return (
                  <th
                    key={day.dateKey}
                    data-day-col={day.dayNumber}
                    className={`py-2 px-1 text-center font-mono font-medium transition-colors select-none min-w-[28px] sm:min-w-[32px] ${
                      isToday
                        ? 'border-x border-cyan-500/60 bg-cyan-950/30 text-cyan-300 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div
                      className={`text-xs inline-flex items-center justify-center mx-auto ${
                        isToday
                          ? 'w-5 h-5 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                          : ''
                      }`}
                    >
                      {String(day.dayNumber).padStart(2, '0')}
                    </div>
                  </th>
                );
              })}

              {/* % Column */}
              {showMetrics && (
                <th className="py-2.5 px-2 text-center font-semibold text-zinc-400 w-12 md:sticky md:right-12 z-20 bg-zinc-950/95 backdrop-blur-md">
                  %
                </th>
              )}

              {/* RACHA Column */}
              {showMetrics && (
                <th className="py-2.5 px-2 text-center font-semibold text-amber-300 w-14 md:sticky md:right-0 z-20 bg-zinc-950/95 backdrop-blur-md">
                  RACHA
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {activeHabits.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 4}
                  className="py-12 text-center text-zinc-500 font-mono text-xs"
                >
                  No tienes hábitos activos este mes.{' '}
                  <span
                    onClick={onOpenNewHabit}
                    className="text-cyan-400 underline cursor-pointer hover:text-cyan-300"
                  >
                    + Nuevo Hábito
                  </span>
                </td>
              </tr>
            ) : (
              activeHabits.map((habit, index) => {
                const streak = calculateHabitStreak(habit, logs, todayKey);

                let expectedDays = 0;
                let completedDays = 0;

                days.forEach((d) => {
                  if (d.isPastOrToday && isHabitScheduledForDay(habit, d.dayOfWeek)) {
                    expectedDays++;
                    const log = logMap.get(`${habit.id}_${d.dateKey}`);
                    if (log?.status === 'completed') completedDays++;
                  }
                });

                const percentage =
                  expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

                let pctColor = 'text-rose-400';
                if (percentage >= 80) pctColor = 'text-emerald-400';
                else if (percentage >= 60) pctColor = 'text-cyan-400';
                else if (percentage >= 50) pctColor = 'text-amber-400';

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-zinc-900/30 transition-colors group"
                  >
                    {/* Index (#) */}
                    {habitColStyle === 'full' && (
                      <td className="py-2 px-2 text-center font-mono text-xs text-zinc-500 sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        {index + 1}
                      </td>
                    )}

                    {/* Hábito Full */}
                    {habitColStyle === 'full' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        className="py-2 px-3 font-medium text-xs text-white truncate max-w-[160px] sticky left-8 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                        title={`${habit.title} · Clic para editar`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{habit.icon}</span>
                          <span className="truncate group-hover:text-cyan-300 transition-colors">
                            {habit.title}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Hábito Icon Only */}
                    {habitColStyle === 'icon' && (
                      <td
                        onClick={() => onEditHabit(habit)}
                        className="py-2 px-2 text-center text-sm sticky left-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors cursor-pointer"
                        title={`${habit.title} · Clic para editar`}
                      >
                        {habit.icon}
                      </td>
                    )}

                    {/* Check-in Cells for each Day */}
                    {days.map((day) => {
                      const log = logMap.get(`${habit.id}_${day.dateKey}`);
                      const isToday = day.isToday;

                      return (
                        <td
                          key={day.dateKey}
                          data-day-col={day.dayNumber}
                          className={`py-1.5 px-0.5 text-center transition-colors ${
                            isToday
                              ? 'border-x border-cyan-500/50 bg-cyan-950/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.06)]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <HabitCell
                              habit={habit}
                              dateKey={day.dateKey}
                              dayNumber={day.dayNumber}
                              status={log?.status}
                              isToday={isToday}
                              isFuture={day.isFuture}
                              onToggle={onToggleCell}
                              onSetStatus={onSetCellStatus}
                            />
                          </div>
                        </td>
                      );
                    })}

                    {/* % Column */}
                    {showMetrics && (
                      <td className="py-2 px-2 text-center font-mono text-xs md:sticky md:right-12 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        <span className={`font-bold ${pctColor}`}>{percentage}%</span>
                      </td>
                    )}

                    {/* RACHA Column */}
                    {showMetrics && (
                      <td className="py-2 px-2 text-center font-mono text-xs md:sticky md:right-0 z-10 bg-[#070c18] group-hover:bg-zinc-900/90 transition-colors">
                        <span className="font-bold text-amber-300">{streak}</span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Modal de Confirmación para Reiniciar Checks del Mes */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isResetting && setShowResetModal(false)}
        >
          <div
            className="bg-[#0b1329] border border-rose-500/30 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.25)] max-w-md w-full p-5 sm:p-6 space-y-4 animate-modal-enter font-sans relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4
                  id="reset-modal-title"
                  className="text-base font-bold text-white font-mono tracking-tight"
                >
                  ¿Reiniciar checks de {monthName} {year}?
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Esta acción desmarcará todos los hábitos completados únicamente para el mes de{' '}
                  <span className="text-rose-300 font-semibold">{monthName} {year}</span> de tu usuario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setShowResetModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Cerrar"
                disabled={isResetting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Details Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="text-sm">✓</span>
                <span>Tus hábitos creados se conservan al 100%.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="text-sm">✓</span>
                <span>El historial de otros meses permanecerá intacto.</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400 font-medium">
                <span className="text-sm">⚠</span>
                <span>Los checks de {monthName} volverán a cero.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Limpiando...' : 'Sí, limpiar checks'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
