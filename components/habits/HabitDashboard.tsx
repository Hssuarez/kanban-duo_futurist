'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Task } from '@/lib/types';
import {
  Habit,
  HabitLog,
  Goal,
  HabitLogStatus,
  HabitCoreSubView,
} from '@/lib/habitTypes';
import {
  getLocalHabits,
  saveHabit,
  updateHabit,
  deleteHabit,
  getLocalHabitLogs,
  toggleHabitLog,
  setHabitLogStatus,
  clearMonthHabitLogs,
  getLocalGoals,
  saveGoal,
  toggleGoal,
  deleteGoal,
  getLocalHabitNote,
  saveHabitNote,
} from '@/lib/habitStorage';
import {
  getBogotaToday,
  getBogotaYearMonth,
  getDaysInMonthInfo,
  calculateMonthlyKpis,
  calculateTopHabits,
  calculateDailyCompliance,
  calculateWeeklyCompliance,
  calculatePeriodSummary,
  MONTH_NAMES_ES,
} from '@/lib/habitCalculations';
import { subscribeToSync } from '@/lib/storage';
import { HabitKpiRow } from './HabitKpiRow';
import { HabitMatrix } from './HabitMatrix';
import { HabitTopList } from './HabitTopList';
import { HabitDailyChart } from './HabitDailyChart';
import { HabitPeriodSummaryCard } from './HabitPeriodSummaryCard';
import { HabitWeeklyChart } from './HabitWeeklyChart';
import { HabitGoalsCard } from './HabitGoalsCard';
import { HabitNotesCard } from './HabitNotesCard';
import { AdditionalHabitsCard } from './AdditionalHabitsCard';
import { HabitModal } from './HabitModal';
import { GoalModal } from './GoalModal';
import { ChallengeDashboard } from '../challenges/ChallengeDashboard';
import { ChevronLeft, ChevronRight, Plus, Target, Trophy, Flag, Activity } from 'lucide-react';

interface HabitDashboardProps {
  currentUser: User;
  currentSubView?: HabitCoreSubView;
  onChangeSubView?: (view: HabitCoreSubView) => void;
  users?: User[];
  tasks?: Task[];
  onOpenNewTaskModal?: (challengeId?: string) => void;
  onToggleTaskStatus?: (task: Task) => void;
  onOpenTaskDetail?: (task: Task) => void;
}

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  currentUser,
  currentSubView = 'habits',
  onChangeSubView,
  users = [],
  tasks = [],
  onOpenNewTaskModal,
  onToggleTaskStatus,
  onOpenTaskDetail,
}) => {
  const [initialYear, initialMonth] = useMemo(() => getBogotaYearMonth(), []);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const todayKey = useMemo(() => getBogotaToday(), []);

  // Estado reactivo del módulo
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [noteContent, setNoteContent] = useState('');

  // Modales
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Recarga reactiva de datos
  const loadHabitData = useCallback(() => {
    const loadedHabits = getLocalHabits(currentUser.id);
    const loadedLogs = getLocalHabitLogs(currentUser.id);
    const loadedGoals = getLocalGoals(currentUser.id, monthKey);
    const loadedNote = getLocalHabitNote(currentUser.id, monthKey);

    setHabits(loadedHabits);
    setLogs(loadedLogs);
    setGoals(loadedGoals);
    setNoteContent(loadedNote);
  }, [currentUser.id, monthKey]);

  useEffect(() => {
    loadHabitData();
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'habits') {
        loadHabitData();
      }
    });
    return () => unsubscribe();
  }, [loadHabitData]);

  // Navegación de meses
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    const [y, m] = getBogotaYearMonth();
    setCurrentYear(y);
    setCurrentMonth(m);
  };

  // Acciones de Hábitos
  const handleToggleCell = async (habitId: string, dateKey: string) => {
    await toggleHabitLog(habitId, currentUser.id, dateKey);
    loadHabitData();
  };

  const handleSetCellStatus = async (habitId: string, dateKey: string, status: HabitLogStatus) => {
    await setHabitLogStatus(habitId, currentUser.id, dateKey, status);
    loadHabitData();
  };

  const handleResetMonthChecks = async () => {
    await clearMonthHabitLogs(currentUser.id, currentYear, currentMonth);
    loadHabitData();
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habitData);
    } else {
      await saveHabit({
        ...habitData,
        id: habitData.id || `habit-${Date.now()}`,
        userId: currentUser.id,
      } as Habit);
    }
    setEditingHabit(null);
    loadHabitData();
  };

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId);
    setEditingHabit(null);
    loadHabitData();
  };

  const handleActivateHabit = async (habitId: string) => {
    await updateHabit(habitId, { isActive: true });
    loadHabitData();
  };

  // Acciones de Objetivos y Notas
  const handleToggleGoal = async (goalId: string) => {
    await toggleGoal(goalId);
    loadHabitData();
  };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    await saveGoal({
      ...goalData,
      id: goalData.id || `goal-${Date.now()}`,
      userId: currentUser.id,
      monthKey,
    } as Goal);
    loadHabitData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    loadHabitData();
  };

  const handleSaveNote = async (content: string) => {
    await saveHabitNote(currentUser.id, monthKey, content);
    setNoteContent(content);
  };

  // Cálculos memorizados
  const daysInfo = useMemo(
    () => getDaysInMonthInfo(currentYear, currentMonth, todayKey),
    [currentYear, currentMonth, todayKey]
  );

  const kpiSummary = useMemo(
    () => calculateMonthlyKpis(habits, logs, goals, currentYear, currentMonth, todayKey),
    [habits, logs, goals, currentYear, currentMonth, todayKey]
  );

  const topRanks = useMemo(
    () => calculateTopHabits(habits, logs, currentYear, currentMonth, todayKey),
    [habits, logs, currentYear, currentMonth, todayKey]
  );

  const dailyData = useMemo(
    () => calculateDailyCompliance(habits, logs, currentYear, currentMonth, todayKey),
    [habits, logs, currentYear, currentMonth, todayKey]
  );

  const periodSummary = useMemo(
    () => calculatePeriodSummary(dailyData, currentMonth),
    [dailyData, currentMonth]
  );

  const weeklyData = useMemo(
    () => calculateWeeklyCompliance(habits, logs, currentYear, currentMonth, todayKey),
    [habits, logs, currentYear, currentMonth, todayKey]
  );

  const inactiveHabits = useMemo(
    () => habits.filter((h) => !h.isActive && !h.isArchived),
    [habits]
  );

  const activeHabitsCount = useMemo(
    () => habits.filter((h) => h.isActive && !h.isArchived).length,
    [habits]
  );

  const monthName = MONTH_NAMES_ES[currentMonth - 1];

  return (
    <div className="space-y-4 sm:space-y-5 font-sans animate-view-fade pb-10 w-full">
      {/* 1. Header unificado de HABIT CORE con Sub-navegación y Selector de Mes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 p-4 sm:p-5 rounded-2xl shadow-sm transition-colors relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Título & Sub-tabs */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              {currentSubView === 'challenges' ? (
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : currentSubView === 'goals' ? (
                <Flag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : currentSubView === 'progress' ? (
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Target className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-wider uppercase">
                  Habit Core
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-medium">
                  {currentSubView === 'habits'
                    ? 'Mis Hábitos'
                    : currentSubView === 'challenges'
                    ? 'Retos Colectivos'
                    : currentSubView === 'goals'
                    ? 'Objetivos'
                    : 'Progreso'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {currentSubView === 'habits' && 'Construye tu mejor versión día a día.'}
                {currentSubView === 'challenges' && 'Compite o colabora con tu equipo en retos colectivos.'}
                {currentSubView === 'goals' && 'Planifica y monitorea tus objetivos del período.'}
                {currentSubView === 'progress' && 'Analiza tus métricas históricas de constancia y cumplimiento.'}
              </p>
            </div>
          </div>

          {/* Sub-tabs del Dominio Habit Core */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-white/[0.08] w-fit">
            <button
              type="button"
              onClick={() => onChangeSubView?.('habits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSubView === 'habits'
                  ? 'bg-cyan-950/80 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Mis hábitos</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubView?.('challenges')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSubView === 'challenges'
                  ? 'bg-cyan-950/80 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Retos</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubView?.('goals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSubView === 'goals'
                  ? 'bg-cyan-950/80 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Objetivos</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubView?.('progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSubView === 'progress'
                  ? 'bg-cyan-950/80 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Progreso</span>
            </button>
          </div>
        </div>

        {/* Acciones de Cabecera contextuales por Subvista */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center relative z-10">
          {(currentSubView === 'habits' || currentSubView === 'progress') && (
            <div className="flex items-center bg-zinc-950/90 border border-white/[0.08] rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-mono font-semibold text-white min-w-[130px] text-center capitalize">
                {monthName} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {(currentSubView === 'habits' || currentSubView === 'progress') && (
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-all active:scale-95 cursor-pointer"
            >
              Hoy
            </button>
          )}

          {currentSubView === 'habits' && (
            <button
              type="button"
              onClick={() => {
                setEditingHabit(null);
                setIsHabitModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo hábito</span>
            </button>
          )}

          {currentSubView === 'goals' && (
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo objetivo</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA PRINCIPAL: MIS HÁBITOS (CON TODAS LAS ESTADÍSTICAS)*/}
      {/* ======================================================== */}
      {currentSubView === 'habits' && (
        <div className="space-y-4 sm:space-y-5 animate-view-fade">
          {/* FILA 1: Top 5 KPI Cards Row */}
          <HabitKpiRow kpis={kpiSummary} />

          {/* FILA 2: Matriz de Hábitos (75%) + Top 10 Consistentes (25%) */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
            <div className="xl:col-span-3 min-w-0">
              <HabitMatrix
                habits={habits}
                logs={logs}
                days={daysInfo}
                year={currentYear}
                month={currentMonth}
                todayKey={todayKey}
                onToggleCell={handleToggleCell}
                onSetCellStatus={handleSetCellStatus}
                onOpenNewHabit={() => {
                  setEditingHabit(null);
                  setIsHabitModalOpen(true);
                }}
                onEditHabit={(h) => {
                  setEditingHabit(h);
                  setIsHabitModalOpen(true);
                }}
                onResetMonthChecks={handleResetMonthChecks}
              />
            </div>

            <div className="xl:col-span-1 min-w-0 h-full">
              <HabitTopList ranks={topRanks} />
            </div>
          </div>

          {/* FILA 3: Progreso Diario con Curva Spline (75%) + Resumen del Período (25%) */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            <div className="xl:col-span-3 min-w-0">
              <HabitDailyChart
                dailyData={dailyData}
                totalHabits={activeHabitsCount}
                habits={habits}
                logs={logs}
                month={currentMonth}
              />
            </div>

            <div className="xl:col-span-1 min-w-0 h-full">
              <HabitPeriodSummaryCard summary={periodSummary} />
            </div>
          </div>

          {/* FILA 4: Progreso Semanal del Mes (Restaurado bajo la gráfica diaria) */}
          <div className="pt-1">
            <HabitWeeklyChart weeklyData={weeklyData} />
          </div>

          {/* FILA 5: Objetivos del Mes + Notas + Hábitos Adicionales (Restaurados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
            <HabitGoalsCard
              goals={goals}
              onToggleGoal={handleToggleGoal}
              onOpenNewGoal={() => setIsGoalModalOpen(true)}
              onDeleteGoal={handleDeleteGoal}
            />
            <HabitNotesCard
              initialContent={noteContent}
              onSave={handleSaveNote}
            />
            <AdditionalHabitsCard
              inactiveHabits={inactiveHabits}
              onActivateHabit={handleActivateHabit}
              onOpenNewHabit={() => {
                setEditingHabit(null);
                setIsHabitModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA DE RETOS COMPARTIDOS (FASE C INTEGRADA)            */}
      {/* ======================================================== */}
      {currentSubView === 'challenges' && (
        <div className="animate-view-fade">
          <ChallengeDashboard
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            onOpenNewTaskModal={onOpenNewTaskModal}
            onToggleTaskStatus={onToggleTaskStatus}
            onOpenTaskDetail={onOpenTaskDetail}
            onBackToHabits={() => onChangeSubView?.('habits')}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* OTRAS SUB-VISTAS: OBJETIVOS Y PROGRESO EXTENDIDO         */}
      {/* ======================================================== */}
      {currentSubView === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-view-fade">
          <HabitGoalsCard
            goals={goals}
            onToggleGoal={handleToggleGoal}
            onOpenNewGoal={() => setIsGoalModalOpen(true)}
            onDeleteGoal={handleDeleteGoal}
          />
          <HabitNotesCard
            initialContent={noteContent}
            onSave={handleSaveNote}
          />
          <AdditionalHabitsCard
            inactiveHabits={inactiveHabits}
            onActivateHabit={handleActivateHabit}
            onOpenNewHabit={() => {
              setEditingHabit(null);
              setIsHabitModalOpen(true);
            }}
          />
        </div>
      )}

      {currentSubView === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-view-fade">
          <HabitWeeklyChart weeklyData={weeklyData} />
          <HabitPeriodSummaryCard summary={periodSummary} />
        </div>
      )}

      {/* Modal de Hábito */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        editingHabit={editingHabit}
        userId={currentUser.id}
      />

      {/* Modal de Objetivo */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        userId={currentUser.id}
        monthKey={monthKey}
      />
    </div>
  );
};
