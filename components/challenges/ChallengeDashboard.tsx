'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Task } from '@/lib/types';
import {
  Challenge,
  ChallengeMember,
  ChallengeHabit,
  ChallengeLog,
  ChallengeActivity,
  ChallengeGoal,
  ChallengeSubTab,
} from '@/lib/challengeTypes';
import {
  getLocalChallenges,
  saveChallenge,
  getLocalChallengeMembers,
  addChallengeMember,
  removeChallengeMember,
  getLocalChallengeHabits,
  getLocalChallengeLogs,
  toggleChallengeLog,
  getLocalChallengeActivities,
  addChallengeActivity,
  getLocalChallengeGoals,
  toggleChallengeGoal,
  saveChallengeGoal,
  saveChallengeHabit,
  deleteChallenge,
} from '@/lib/challengeStorage';
import {
  getChallengeDays,
  calculateChallengeLeaderboard,
  calculateChallengeSummaryKpis,
} from '@/lib/challengeCalculations';
import { getBogotaToday, getBogotaYearMonth, MONTH_NAMES_ES } from '@/lib/habitCalculations';
import { subscribeToSync } from '@/lib/storage';

import { ChallengeCardsRow } from './ChallengeCardsRow';
import { ChallengeHeroHeader } from './ChallengeHeroHeader';
import { ChallengeMatrix } from './ChallengeMatrix';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';
import { ChallengeActivityFeed } from './ChallengeActivityFeed';
import { ChallengeTeamChart, ChallengeWeeklyProgressCard } from './ChallengeTeamChart';
import { ChallengeTasksCard } from './ChallengeTasksCard';
import { ChallengeGoalsCard } from './ChallengeGoalsCard';
import { ChallengeModal } from './ChallengeModal';
import { ChallengeMembersModal } from './ChallengeMembersModal';
import { Plus } from 'lucide-react';

interface ChallengeDashboardProps {
  currentUser: User;
  users?: User[];
  tasks?: Task[];
  onOpenNewTaskModal?: (challengeId?: string) => void;
  onToggleTaskStatus?: (task: Task) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onBackToHabits?: () => void;
}

export const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({
  currentUser,
  users = [],
  tasks = [],
  onOpenNewTaskModal,
  onToggleTaskStatus,
  onOpenTaskDetail,
  onBackToHabits,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('ch-gym-30d');
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [habits, setHabits] = useState<ChallengeHabit[]>([]);
  const [logs, setLogs] = useState<ChallengeLog[]>([]);
  const [activities, setActivities] = useState<ChallengeActivity[]>([]);
  const [goals, setGoals] = useState<ChallengeGoal[]>([]);

  // Navigation and UI state
  const [currentSubTab, setCurrentSubTab] = useState<ChallengeSubTab>('matrix');
  const [currentMonth, setCurrentMonth] = useState<number>(() => getBogotaYearMonth()[1]);
  const [currentYear, setCurrentYear] = useState<number>(() => getBogotaYearMonth()[0]);

  // Modals state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const todayKey = useMemo(() => getBogotaToday(), []);

  // Cargar datos del almacenamiento local y cloud
  const loadChallengeData = useCallback(() => {
    const loadedChallenges = getLocalChallenges();
    const loadedMembers = getLocalChallengeMembers();
    const loadedHabits = getLocalChallengeHabits();
    const loadedLogs = getLocalChallengeLogs();
    const loadedActivities = getLocalChallengeActivities();
    const loadedGoals = getLocalChallengeGoals();

    setChallenges(loadedChallenges);
    setMembers(loadedMembers);
    setHabits(loadedHabits);
    setLogs(loadedLogs);
    setActivities(loadedActivities);
    setGoals(loadedGoals);

    // Asegurar que haya un reto seleccionado válido
    if (loadedChallenges.length > 0) {
      if (!loadedChallenges.some((c) => c.id === selectedChallengeId)) {
        setSelectedChallengeId(loadedChallenges[0].id);
      }
    }
  }, [selectedChallengeId]);

  useEffect(() => {
    loadChallengeData();
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'challenges') {
        loadChallengeData();
      }
    });
    return () => unsubscribe();
  }, [loadChallengeData]);

  // Reto seleccionado actual
  const currentChallenge = useMemo(() => {
    return (
      challenges.find((c) => c.id === selectedChallengeId) ||
      challenges[0] || {
        id: 'ch-gym-30d',
        createdBy: currentUser.id,
        title: '30 DÍAS GYM',
        description: 'Entrenar al menos 5 veces por semana y mantener la consistencia.',
        icon: '🏋️',
        color: '#06b6d4',
        startDate: '2026-10-01',
        endDate: '2026-10-30',
        durationDays: 30,
        mode: 'competitive' as const,
        status: 'active' as const,
        createdAt: '',
        updatedAt: '',
      }
    );
  }, [challenges, selectedChallengeId, currentUser.id]);

  // Miembros del reto seleccionado
  const challengeMembers = useMemo(() => {
    return members.filter((m) => m.challengeId === currentChallenge.id);
  }, [members, currentChallenge.id]);

  // Hábitos del reto seleccionado
  const challengeHabits = useMemo(() => {
    return habits.filter((h) => h.challengeId === currentChallenge.id);
  }, [habits, currentChallenge.id]);

  // Logs del reto seleccionado
  const challengeLogs = useMemo(() => {
    return logs.filter((l) => l.challengeId === currentChallenge.id);
  }, [logs, currentChallenge.id]);

  // Actividades del reto seleccionado
  const challengeActivities = useMemo(() => {
    return activities.filter((a) => a.challengeId === currentChallenge.id);
  }, [activities, currentChallenge.id]);

  // Objetivos del reto seleccionado
  const challengeGoals = useMemo(() => {
    return goals.filter((g) => g.challengeId === currentChallenge.id);
  }, [goals, currentChallenge.id]);

  // Días del reto sincronizados con el mes del calendario
  const challengeDays = useMemo(() => {
    return getChallengeDays(currentChallenge, todayKey, currentYear, currentMonth);
  }, [currentChallenge, todayKey, currentYear, currentMonth]);

  // Leaderboard calculado con resolución determinística de empates y fechas de ingreso
  const leaderboard = useMemo(() => {
    return calculateChallengeLeaderboard(
      currentChallenge,
      challengeMembers,
      users,
      challengeLogs,
      challengeHabits,
      todayKey
    );
  }, [currentChallenge, challengeMembers, users, challengeLogs, challengeHabits, todayKey]);

  // KPIs de cabecera
  const kpis = useMemo(() => {
    return calculateChallengeSummaryKpis(
      currentChallenge,
      challengeMembers,
      users,
      challengeLogs,
      challengeHabits,
      todayKey
    );
  }, [currentChallenge, challengeMembers, users, challengeLogs, challengeHabits, todayKey]);

  // Tareas vinculadas al reto desde Kanban
  const challengeTasks = useMemo(() => {
    return tasks.filter((t) => (t as any).challengeId === currentChallenge.id);
  }, [tasks, currentChallenge.id]);

  // Manejo de Check-in en la matriz: estrictamente protegido por userId
  const handleToggleLog = async (
    challengeId: string,
    challengeHabitId: string,
    userId: string,
    dateKey: string
  ) => {
    // Protección estricta en frontend (capa 1)
    if (userId !== currentUser.id) {
      console.warn('Acceso denegado: Un usuario solo puede marcar sus propios check-ins.');
      return;
    }

    // Bloqueo de días futuros: no se permite marcar hábitos antes de que ocurran
    if (dateKey > todayKey) {
      console.warn('Acceso denegado: No es posible marcar check-ins en fechas futuras.');
      return;
    }

    const res = await toggleChallengeLog(challengeId, challengeHabitId, userId, dateKey);
    loadChallengeData();

    // Emisión discreta de actividad realtime
    if (res.newStatus === 'completed') {
      const habitObj = challengeHabits.find((h) => h.id === challengeHabitId);
      addChallengeActivity(
        challengeId,
        userId,
        `${currentUser.name.split(' ')[0]} cumplió su meta diaria (${habitObj?.title || currentChallenge.title})`,
        'check_in',
        habitObj?.title
      );
    }
  };

  // Guardar nuevo reto o actualizar existente
  const handleSaveChallenge = async (
    challengeData: Partial<Challenge>,
    initialHabitTitle?: string,
    invitedUserIds?: string[]
  ) => {
    const isNew = !challengeData.id;
    const challengeId = challengeData.id || `ch-${Date.now()}`;

    const newChallenge: Challenge = {
      id: challengeId,
      createdBy: challengeData.createdBy || currentUser.id,
      title: challengeData.title || 'Nuevo Reto',
      description: challengeData.description || '',
      icon: challengeData.icon || '🏆',
      color: challengeData.color || '#06b6d4',
      startDate: challengeData.startDate || todayKey,
      endDate: challengeData.endDate || todayKey,
      durationDays: challengeData.durationDays || 30,
      mode: challengeData.mode || 'competitive',
      status: challengeData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveChallenge(newChallenge);

    // Si es nuevo, añadir al creador como owner y a los invitados desde startDate
    if (isNew) {
      await addChallengeMember(challengeId, currentUser.id, 'owner', newChallenge.startDate);
      if (invitedUserIds) {
        for (const uId of invitedUserIds) {
          if (uId !== currentUser.id) {
            await addChallengeMember(challengeId, uId, 'member', newChallenge.startDate);
          }
        }
      }
      // Asegurar que el nuevo reto tenga al menos un hábito para la matriz
      await saveChallengeHabit({
        id: `chab-${Date.now()}`,
        challengeId,
        title: initialHabitTitle || 'Hábito Principal',
        icon: '🎯',
        displayOrder: 1,
        createdAt: new Date().toISOString(),
      });
    }

    setSelectedChallengeId(challengeId);
    loadChallengeData();
  };

  // Invitar miembro
  const handleAddMember = async (userId: string) => {
    await addChallengeMember(currentChallenge.id, userId, 'member');
    addChallengeActivity(
      currentChallenge.id,
      userId,
      `${users.find((u) => u.id === userId)?.name || 'Un nuevo miembro'} se unió al reto`,
      'joined'
    );
    loadChallengeData();
  };

  // Quitar miembro
  const handleRemoveMember = async (userId: string) => {
    await removeChallengeMember(currentChallenge.id, userId);
    loadChallengeData();
  };

  // Eliminar reto
  const handleDeleteChallenge = async (challengeId: string) => {
    await deleteChallenge(challengeId);
    const updated = getLocalChallenges();
    setChallenges(updated);
    if (updated.length > 0) {
      setSelectedChallengeId(updated[0].id);
    }
    loadChallengeData();
  };

  // Asegurar que el usuario activo sea miembro del reto seleccionado para que tenga su propia fila
  useEffect(() => {
    if (currentChallenge?.id && currentUser?.id) {
      const isMember = challengeMembers.some((m) => m.userId === currentUser.id);
      if (!isMember) {
        addChallengeMember(currentChallenge.id, currentUser.id, 'member', currentChallenge.startDate).then(() => {
          loadChallengeData();
        });
      }
    }
  }, [currentChallenge?.id, currentUser?.id, challengeMembers, loadChallengeData]);

  const monthName = MONTH_NAMES_ES[currentMonth - 1] || 'Septiembre';

  return (
    <div className="space-y-5 font-sans animate-view-fade pb-10 w-full">
      {/* 1. Top Carousel of Active Challenges Cards */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Tus Retos Activos
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditingChallenge(null);
            setIsChallengeModalOpen(true);
          }}
          className="text-xs font-mono font-medium text-cyan-300 hover:text-white flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-3 py-1 rounded-xl transition-colors cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo reto</span>
        </button>
      </div>

      <ChallengeCardsRow
        challenges={challenges}
        selectedChallengeId={selectedChallengeId}
        members={members}
        onSelectChallenge={(id) => setSelectedChallengeId(id)}
      />

      {/* 2. Selected Challenge Hero Banner & 5 KPI Cards */}
      <ChallengeHeroHeader
        challenge={currentChallenge}
        kpis={kpis}
        members={challengeMembers}
        users={users}
        habits={challengeHabits}
        currentSubTab={currentSubTab}
        onChangeSubTab={setCurrentSubTab}
        onOpenEditChallenge={() => {
          setEditingChallenge(currentChallenge);
          setIsChallengeModalOpen(true);
        }}
        onDeleteChallenge={handleDeleteChallenge}
        onOpenInviteMembers={() => setIsMembersModalOpen(true)}
        monthName={monthName}
        year={currentYear}
        onPrevMonth={() => setCurrentMonth((prev) => (prev === 1 ? 12 : prev - 1))}
        onNextMonth={() => setCurrentMonth((prev) => (prev === 12 ? 1 : prev + 1))}
        onGoToday={() => {
          const [y, m] = getBogotaYearMonth();
          setCurrentMonth(m);
          setCurrentYear(y);
        }}
        onBackToHabits={onBackToHabits}
      />

      {/* 3. Main Workspace Grid: Matrix (Protagonist) + Leaderboard & Feed */}
      {currentSubTab === 'matrix' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-start">
          {/* Left Column (3/4): Consistency Matrix + Daily Progress + Goals & Tasks */}
          <div className="xl:col-span-3 space-y-5 min-w-0">
            {/* HERO PROTAGONIST: Matriz de Consistencia Multi-Usuario */}
            <ChallengeMatrix
              challenge={currentChallenge}
              members={challengeMembers}
              users={users}
              habits={challengeHabits}
              logs={challengeLogs}
              days={challengeDays}
              todayKey={todayKey}
              currentUser={currentUser}
              onToggleLog={handleToggleLog}
              memberCompliances={leaderboard}
            />

            {/* Progreso Diario del Reto (Suma de hábitos) */}
            <ChallengeTeamChart
              challenge={currentChallenge}
              days={challengeDays}
              members={challengeMembers}
              logs={challengeLogs}
            />

            {/* Bottom Row: Objetivos del Reto + Tareas Vinculadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChallengeGoalsCard
                goals={challengeGoals}
                onToggleGoal={(gId) => {
                  toggleChallengeGoal(gId);
                  loadChallengeData();
                }}
                onOpenNewGoal={() => {
                  const newGoal: ChallengeGoal = {
                    id: `cg-${Date.now()}`,
                    challengeId: currentChallenge.id,
                    title: 'Nuevo objetivo del reto',
                    targetValue: 20,
                    currentValue: 0,
                    isCompleted: false,
                    createdAt: new Date().toISOString(),
                  };
                  saveChallengeGoal(newGoal);
                  loadChallengeData();
                }}
              />

              <ChallengeTasksCard
                tasks={challengeTasks}
                users={users}
                onOpenNewTask={() => onOpenNewTaskModal?.(currentChallenge.id)}
                onToggleTaskStatus={(task) => onToggleTaskStatus?.(task)}
                onOpenTaskDetail={(task) => onOpenTaskDetail?.(task)}
              />
            </div>
          </div>

          {/* Right Column (1/4): Leaderboard + Live Feed + Weekly Progress */}
          <div className="xl:col-span-1 space-y-5 min-w-0">
            {/* Leaderboard Configurable (Competitivo / Colaborativo) */}
            <ChallengeLeaderboard
              challenge={currentChallenge}
              leaderboard={leaderboard}
            />

            {/* Actividad Reciente en Tiempo Real */}
            <ChallengeActivityFeed
              activities={challengeActivities}
              users={users}
            />

            {/* Progreso del Equipo Semanal */}
            <ChallengeWeeklyProgressCard challenge={currentChallenge} />
          </div>
        </div>
      )}

      {/* Otras sub-pestañas: Progreso, Hábitos, Objetivos, Tareas */}
      {currentSubTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <ChallengeTeamChart
            challenge={currentChallenge}
            days={challengeDays}
            members={challengeMembers}
            logs={challengeLogs}
          />
          <ChallengeWeeklyProgressCard challenge={currentChallenge} />
        </div>
      )}

      {currentSubTab === 'tasks' && (
        <div className="animate-fade-in">
          <ChallengeTasksCard
            tasks={challengeTasks}
            users={users}
            onOpenNewTask={() => onOpenNewTaskModal?.(currentChallenge.id)}
            onToggleTaskStatus={(task) => onToggleTaskStatus?.(task)}
            onOpenTaskDetail={(task) => onOpenTaskDetail?.(task)}
          />
        </div>
      )}

      {currentSubTab === 'goals' && (
        <div className="animate-fade-in max-w-2xl">
          <ChallengeGoalsCard
            goals={challengeGoals}
            onToggleGoal={(gId) => {
              toggleChallengeGoal(gId);
              loadChallengeData();
            }}
            onOpenNewGoal={() => {
              const newGoal: ChallengeGoal = {
                id: `cg-${Date.now()}`,
                challengeId: currentChallenge.id,
                title: 'Nuevo objetivo del reto',
                targetValue: 20,
                currentValue: 0,
                isCompleted: false,
                createdAt: new Date().toISOString(),
              };
              saveChallengeGoal(newGoal);
              loadChallengeData();
            }}
          />
        </div>
      )}

      {/* Modal para Crear / Editar Reto */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onSave={handleSaveChallenge}
        onDelete={handleDeleteChallenge}
        editingChallenge={editingChallenge}
        users={users}
        currentUser={currentUser}
      />

      {/* Modal para Gestionar Participantes */}
      <ChallengeMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        challenge={currentChallenge}
        members={challengeMembers}
        users={users}
        currentUser={currentUser}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};
