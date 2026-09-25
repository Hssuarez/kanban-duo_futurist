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
  ChallengeSummaryKpis,
} from '@/lib/challengeTypes';
import {
  getLocalChallenges,
  saveChallenge,
  getLocalChallengeMembers,
  addChallengeMember,
  removeChallengeMember,
  acceptChallengeInvitation,
  declineChallengeInvitation,
  getLocalChallengeHabits,
  getLocalChallengeLogs,
  toggleChallengeLog,
  getLocalChallengeActivities,
  addChallengeActivity,
  recordChallengeCheckInActivity,
  removeChallengeCheckInActivity,
  getLocalChallengeGoals,
  toggleChallengeGoal,
  saveChallengeGoal,
  deleteChallengeGoal,
  saveChallengeHabit,
  deleteChallenge,
  getLastSelectedChallengeId,
  saveLastSelectedChallengeId,
  syncCloudChallenges,
  getChallengeCloudSyncStatus,
  ChallengeCloudSyncStatus,
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
import { ChallengeGoalModal } from './ChallengeGoalModal';
import { ChallengeModal } from './ChallengeModal';
import { ChallengeMembersModal } from './ChallengeMembersModal';
import { ChallengeMigrationModal } from './ChallengeMigrationModal';
import { Plus, Trophy, Check, X } from 'lucide-react';

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
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = getLastSelectedChallengeId();
      if (saved) return saved;
    }
    return 'ch-gym-30d';
  });
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
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ChallengeGoal | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<ChallengeCloudSyncStatus>(() => getChallengeCloudSyncStatus());

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
    setCloudStatus(getChallengeCloudSyncStatus());

    // Asegurar que haya un reto seleccionado válido y priorizar el guardado por el usuario
    if (loadedChallenges.length > 0) {
      const savedId = getLastSelectedChallengeId();
      if (savedId && loadedChallenges.some((c) => c.id === savedId)) {
        if (selectedChallengeId !== savedId) {
          setSelectedChallengeId(savedId);
        }
      } else if (!loadedChallenges.some((c) => c.id === selectedChallengeId)) {
        const validId = loadedChallenges[0].id;
        setSelectedChallengeId(validId);
        saveLastSelectedChallengeId(validId);
      }
    }
  }, [selectedChallengeId]);

  useEffect(() => {
    loadChallengeData();
    syncCloudChallenges().then((cloudList) => {
      loadChallengeData();
      // Si el usuario en este navegador nuevo / incógnito no tenía selección previa guardada,
      // y la nube trajo retos personalizados (distintos al placeholder default), seleccionar el más reciente.
      const saved = getLastSelectedChallengeId();
      if (!saved && cloudList && cloudList.length > 0) {
        const customChallenge = cloudList.find((c) => c.id !== 'ch-gym-30d') || cloudList[0];
        if (customChallenge) {
          setSelectedChallengeId(customChallenge.id);
          saveLastSelectedChallengeId(customChallenge.id);
        }
      }
    });
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'challenges') {
        loadChallengeData();
      }
    });
    return () => unsubscribe();
  }, [loadChallengeData]);

  // Retos accesibles para el usuario conectado (Privacidad Estricta - Solo miembros aceptados)
  const accessibleChallenges = useMemo(() => {
    if (!currentUser) return [];
    return challenges.filter((c) => {
      if (c.status !== 'active') return false;
      // Admin tiene supervisión transversal
      if (currentUser.role === 'admin') return true;
      // El creador siempre tiene acceso
      if (c.createdBy === currentUser.id) return true;
      // Miembros con aceptación confirmada (o retrocompatibles) tienen acceso
      return members.some(
        (m) =>
          m.challengeId === c.id &&
          m.userId === currentUser.id &&
          (!m.status || m.status === 'accepted')
      );
    });
  }, [challenges, members, currentUser]);

  // Invitaciones a retos pendientes para el usuario actual
  const pendingChallengeInvitations = useMemo(() => {
    if (!currentUser) return [];
    return members
      .filter((m) => m.userId === currentUser.id && m.status === 'pending')
      .map((m) => {
        const ch = challenges.find((c) => c.id === m.challengeId);
        return {
          member: m,
          challenge: ch,
        };
      })
      .filter((item): item is { member: ChallengeMember; challenge: Challenge } => Boolean(item.challenge));
  }, [members, challenges, currentUser]);

  // Reto seleccionado actual dentro de los retos accesibles (null si no tiene retos)
  const currentChallenge = useMemo(() => {
    if (accessibleChallenges.length === 0) return null;
    const found = accessibleChallenges.find((c) => c.id === selectedChallengeId);
    return found || accessibleChallenges[0] || null;
  }, [accessibleChallenges, selectedChallengeId]);

  // Miembros del reto seleccionado
  const challengeMembers = useMemo(() => {
    if (!currentChallenge) return [];
    return members.filter((m) => m.challengeId === currentChallenge.id);
  }, [members, currentChallenge?.id]);

  // Hábitos del reto seleccionado
  const challengeHabits = useMemo(() => {
    if (!currentChallenge) return [];
    return habits.filter((h) => h.challengeId === currentChallenge.id);
  }, [habits, currentChallenge?.id]);

  // Logs del reto seleccionado
  const challengeLogs = useMemo(() => {
    if (!currentChallenge) return [];
    return logs.filter((l) => l.challengeId === currentChallenge.id);
  }, [logs, currentChallenge?.id]);

  // Actividades del reto seleccionado
  const challengeActivities = useMemo(() => {
    if (!currentChallenge) return [];
    return activities.filter((a) => a.challengeId === currentChallenge.id);
  }, [activities, currentChallenge?.id]);

  // Objetivos del reto seleccionado
  const challengeGoals = useMemo(() => {
    if (!currentChallenge) return [];
    return goals.filter((g) => g.challengeId === currentChallenge.id);
  }, [goals, currentChallenge?.id]);

  // Días del reto sincronizados con el mes del calendario
  const challengeDays = useMemo(() => {
    if (!currentChallenge) return [];
    return getChallengeDays(currentChallenge, todayKey, currentYear, currentMonth);
  }, [currentChallenge, todayKey, currentYear, currentMonth]);

  // Leaderboard calculado con resolución determinística de empates y fechas de ingreso
  const leaderboard = useMemo(() => {
    if (!currentChallenge) return [];
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
  const kpis: ChallengeSummaryKpis = useMemo(() => {
    if (!currentChallenge) {
      return {
        completionRate: 0,
        totalChecksCompleted: 0,
        totalChecksExpected: 0,
        daysRemaining: 0,
        currentTeamStreak: 0,
        bestTeamStreak: 0,
        totalMembersCount: 0,
        activeMembersCount: 0,
        mostConsistentMember: null,
      };
    }
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
    if (!currentChallenge) return [];
    return tasks.filter((t) => (t as any).challengeId === currentChallenge.id);
  }, [tasks, currentChallenge?.id]);

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

    // Actualización optimista inmediata en la UI local
    const existingLogs = logs.filter(
      (l) => l.challengeId === challengeId && l.userId === userId && l.dateKey === dateKey
    );
    const isCurrentlyChecked = existingLogs.some((l) => l.status === 'completed') || existingLogs.length > 0;

    if (isCurrentlyChecked) {
      setLogs((prev) =>
        prev.filter(
          (l) => !(l.challengeId === challengeId && l.userId === userId && l.dateKey === dateKey)
        )
      );
    } else {
      const optimisticLog: ChallengeLog = {
        id: `clog-${challengeId}-${challengeHabitId}-${userId}-${dateKey}`,
        challengeId,
        challengeHabitId,
        userId,
        dateKey,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, optimisticLog]);
    }

    const res = await toggleChallengeLog(challengeId, challengeHabitId, userId, dateKey);
    loadChallengeData();

    // Emisión discreta y deduplicada de actividad realtime
    const habitObj = challengeHabits.find((h) => h.id === challengeHabitId);
    if (res.newStatus === 'completed') {
      recordChallengeCheckInActivity(
        challengeId,
        userId,
        `${currentUser.name.split(' ')[0]} cumplió su meta diaria (${habitObj?.title || currentChallenge?.title || 'Reto'})`,
        habitObj?.title,
        challengeHabitId,
        dateKey
      );
    } else {
      removeChallengeCheckInActivity(
        challengeId,
        userId,
        challengeHabitId,
        dateKey,
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
    saveLastSelectedChallengeId(challengeId);
    loadChallengeData();
  };

  // Invitar miembro
  const handleAddMember = async (userId: string) => {
    if (!currentChallenge) return;
    await addChallengeMember(currentChallenge.id, userId, 'member', undefined, 'pending');
    loadChallengeData();
  };

  // Aceptar invitación al reto
  const handleAcceptChallengeInvitation = async (challengeId: string) => {
    await acceptChallengeInvitation(challengeId, currentUser.id);
    setSelectedChallengeId(challengeId);
    saveLastSelectedChallengeId(challengeId);
    loadChallengeData();
  };

  // Rechazar invitación al reto
  const handleDeclineChallengeInvitation = async (challengeId: string) => {
    await declineChallengeInvitation(challengeId, currentUser.id);
    loadChallengeData();
  };

  // Quitar miembro
  const handleRemoveMember = async (userId: string) => {
    if (!currentChallenge) return;
    await removeChallengeMember(currentChallenge.id, userId);
    loadChallengeData();
  };

  // Eliminar reto
  const handleDeleteChallenge = async (challengeId: string) => {
    await deleteChallenge(challengeId);
    const updated = getLocalChallenges();
    setChallenges(updated);
    if (updated.length > 0) {
      const nextId = updated[0].id;
      setSelectedChallengeId(nextId);
      saveLastSelectedChallengeId(nextId);
    }
    loadChallengeData();
  };

  // Gestión de Objetivos del Reto
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: ChallengeGoal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (goalData: Partial<ChallengeGoal>) => {
    if (!currentChallenge) return;
    const goalId = goalData.id || `cg-${Date.now()}`;
    const newGoal: ChallengeGoal = {
      id: goalId,
      challengeId: goalData.challengeId || currentChallenge.id,
      title: goalData.title || 'Nuevo objetivo',
      targetValue: goalData.targetValue ?? 20,
      currentValue: goalData.currentValue ?? 0,
      unit: goalData.unit || 'sesiones',
      isCompleted: goalData.isCompleted ?? false,
      createdAt: goalData.createdAt || new Date().toISOString(),
    };
    await saveChallengeGoal(newGoal);
    loadChallengeData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteChallengeGoal(goalId);
    loadChallengeData();
  };

  const monthName = MONTH_NAMES_ES[currentMonth - 1] || 'Septiembre';

  return (
    <div className="space-y-5 font-sans animate-view-fade pb-10 w-full">
      {/* 1. Top Bar of Active Challenges */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Tus Retos Activos
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-semibold">
            {accessibleChallenges.length}
          </span>
        </div>
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

      {/* Invitaciones pendientes de Retos */}
      {pendingChallengeInvitations.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Invitaciones Pendientes ({pendingChallengeInvitations.length})
              </h4>
            </div>
            <span className="text-[11px] font-mono text-amber-400/80">
              Debes confirmar tu participación
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingChallengeInvitations.map(({ challenge }) => {
              const creator = users.find((u) => u.id === challenge.createdBy);
              return (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-amber-500/20 hover:border-amber-500/40 transition-all gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{challenge.icon || '🏆'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-zinc-100 truncate">
                        {challenge.title}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 truncate">
                        Invitado por <span className="text-amber-300 font-semibold">{creator?.name || 'Compañero'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptChallengeInvitation(challenge.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineChallengeInvitation(challenge.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-mono transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Rechazar invitación"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rechazar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pantalla de Onboarding / Empty State si el usuario no tiene retos asignados */}
      {!currentChallenge ? (
        <div className="py-6 sm:py-10">
          <div className="rounded-2xl bg-[#070c18] border border-cyan-500/20 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] relative z-10">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-lg sm:text-xl font-bold font-mono text-zinc-100">
                Sin retos asignados
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Hola <span className="text-cyan-300 font-semibold">{currentUser.name}</span>, actualmente no formas parte de ningún reto colaborativo activo. Puedes crear un nuevo reto e invitar a tu equipo, o esperar a ser invitado por un compañero.
              </p>
            </div>

            <div className="pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingChallenge(null);
                  setIsChallengeModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear mi primer reto</span>
              </button>
              {onBackToHabits && (
                <button
                  type="button"
                  onClick={onBackToHabits}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-xs border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Volver a mis hábitos
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChallengeCardsRow
            challenges={accessibleChallenges}
            selectedChallengeId={selectedChallengeId}
            members={members}
            onSelectChallenge={(id) => {
              setSelectedChallengeId(id);
              saveLastSelectedChallengeId(id);
            }}
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
            cloudStatus={cloudStatus}
            onOpenMigrationModal={() => setIsMigrationModalOpen(true)}
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
                    onOpenNewGoal={handleOpenNewGoal}
                    onEditGoal={handleOpenEditGoal}
                    onDeleteGoal={handleDeleteGoal}
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
                <ChallengeWeeklyProgressCard
                  challenge={currentChallenge}
                  members={challengeMembers}
                  logs={challengeLogs}
                  todayKey={todayKey}
                />
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
              <ChallengeWeeklyProgressCard
                challenge={currentChallenge}
                members={challengeMembers}
                logs={challengeLogs}
                todayKey={todayKey}
              />
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
                onOpenNewGoal={handleOpenNewGoal}
                onEditGoal={handleOpenEditGoal}
                onDeleteGoal={handleDeleteGoal}
              />
            </div>
          )}
        </>
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
      {currentChallenge && (
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
      )}

      {/* Modal para Crear / Personalizar Objetivo del Reto */}
      {currentChallenge && (
        <ChallengeGoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
          editingGoal={editingGoal}
          challengeId={currentChallenge.id}
        />
      )}

      {/* Modal de Sincronización y Migración SQL de Supabase */}
      <ChallengeMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onSyncSuccess={loadChallengeData}
      />
    </div>
  );
};
