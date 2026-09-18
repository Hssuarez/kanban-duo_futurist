// ========================================================
// HABIT CORE — PHASE C: CHALLENGES STORAGE & SYNC LAYER
// Local-First + Supabase Sync + Realtime Activity
// ========================================================

import {
  Challenge,
  ChallengeMember,
  ChallengeHabit,
  ChallengeLog,
  ChallengeActivity,
  ChallengeGoal,
} from './challengeTypes';
import { getOrInitSupabase } from './supabaseClient';
import { notifySync } from './storage';
import { HabitLogStatus } from './habitTypes';
import { getBogotaToday } from './habitCalculations';

const STORAGE_KEYS = {
  CHALLENGES: 'kanban_duo_challenges_v2',
  MEMBERS: 'kanban_duo_challenge_members_v2',
  HABITS: 'kanban_duo_challenge_habits_v2',
  LOGS: 'kanban_duo_challenge_logs_v2',
  ACTIVITIES: 'kanban_duo_challenge_activities_v2',
  GOALS: 'kanban_duo_challenge_goals_v2',
};

// ========================================================
// SEMILLAS INICIALES (Inspiradas en media_1789683755426.jpg)
// ========================================================

export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'ch-gym-30d',
    createdBy: 'user-admin',
    title: '30 DÍAS GYM',
    description: 'Entrenar al menos 5 veces por semana y mantener la consistencia.',
    icon: '🏋️',
    color: '#06b6d4',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    durationDays: 30,
    mode: 'competitive',
    status: 'active',
    targetGoal: '20 sesiones de entrenamiento',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'ch-lectura-30d',
    createdBy: 'user-admin',
    title: 'Lectura Matriz',
    description: 'Leer 20 minutos diarios antes de iniciar el trabajo.',
    icon: '📚',
    color: '#3b82f6',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    durationDays: 30,
    mode: 'collaborative',
    status: 'active',
    targetGoal: '1 libro completo',
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'ch-hidrata-21d',
    createdBy: 'user-alex',
    title: 'Hidratación 21 días',
    description: 'Tomar al menos 2.5 litros de agua diarios.',
    icon: '💧',
    color: '#0284c7',
    startDate: '2026-09-05',
    endDate: '2026-09-25',
    durationDays: 21,
    mode: 'collaborative',
    status: 'active',
    targetGoal: '21 días seguidos',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'ch-sueno-31d',
    createdBy: 'user-admin',
    title: 'Rutina de sueño',
    description: 'Dormir antes de las 10:30 PM durante todo el mes.',
    icon: '🌙',
    color: '#8b5cf6',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    durationDays: 31,
    mode: 'competitive',
    status: 'completed',
    targetGoal: 'Higiene del sueño',
    createdAt: '2026-07-25T10:00:00.000Z',
    updatedAt: '2026-08-31T10:00:00.000Z',
  },
];

export const DEFAULT_CHALLENGE_MEMBERS: ChallengeMember[] = [
  // Miembros de 'ch-gym-30d' (incluyendo usuarios reales del sistema)
  { id: 'cm-1', challengeId: 'ch-gym-30d', userId: 'user-admin', role: 'owner', joinedAt: '2026-09-01' },
  { id: 'cm-2', challengeId: 'ch-gym-30d', userId: 'user-alex', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-3', challengeId: 'ch-gym-30d', userId: 'user-beatriz', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-4', challengeId: 'ch-gym-30d', userId: 'user-2', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-5', challengeId: 'ch-gym-30d', userId: 'user-3', role: 'member', joinedAt: '2026-09-03' },

  // Miembros de 'ch-lectura-30d'
  { id: 'cm-6', challengeId: 'ch-lectura-30d', userId: 'user-admin', role: 'owner', joinedAt: '2026-09-01' },
  { id: 'cm-7', challengeId: 'ch-lectura-30d', userId: 'user-alex', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-8', challengeId: 'ch-lectura-30d', userId: 'user-beatriz', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-9', challengeId: 'ch-lectura-30d', userId: 'user-2', role: 'member', joinedAt: '2026-09-01' },
];

export const DEFAULT_CHALLENGE_HABITS: ChallengeHabit[] = [
  { id: 'chab-1', challengeId: 'ch-gym-30d', title: 'Entrenar', icon: '🏋️', targetValue: 1, displayOrder: 1, createdAt: '2026-09-01' },
  { id: 'chab-2', challengeId: 'ch-gym-30d', title: 'Tomar agua', icon: '💧', targetValue: 8, displayOrder: 2, createdAt: '2026-09-01' },
  { id: 'chab-3', challengeId: 'ch-lectura-30d', title: 'Leer 20 min', icon: '📖', targetValue: 20, displayOrder: 1, createdAt: '2026-09-01' },
];

export const DEFAULT_CHALLENGE_GOALS: ChallengeGoal[] = [
  { id: 'cg-1', challengeId: 'ch-gym-30d', title: 'Completar 20 sesiones de gym', targetValue: 20, currentValue: 18, unit: 'sesiones', isCompleted: false, createdAt: '2026-09-01' },
  { id: 'cg-2', challengeId: 'ch-gym-30d', title: 'Mantener 7 días consecutivos', targetValue: 7, currentValue: 7, unit: 'días', isCompleted: true, createdAt: '2026-09-01' },
  { id: 'cg-3', challengeId: 'ch-gym-30d', title: 'Alcanzar 80% de consistencia', targetValue: 80, currentValue: 86, unit: '%', isCompleted: true, createdAt: '2026-09-01' },
  { id: 'cg-4', challengeId: 'ch-gym-30d', title: 'Completar los 30 días', targetValue: 30, currentValue: 20, unit: 'días', isCompleted: false, createdAt: '2026-09-01' },
];

export const DEFAULT_CHALLENGE_ACTIVITIES: ChallengeActivity[] = [
  { id: 'ca-1', challengeId: 'ch-gym-30d', userId: 'user-alex', actionType: 'check_in', message: 'Alex completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-09-17T20:24:00.000Z' },
  { id: 'ca-2', challengeId: 'ch-gym-30d', userId: 'user-beatriz', actionType: 'check_in', message: 'Beatriz completó Tomar agua', habitTitle: 'Tomar agua', createdAt: '2026-09-17T19:15:00.000Z' },
  { id: 'ca-3', challengeId: 'ch-gym-30d', userId: 'user-2', actionType: 'check_in', message: 'Jesús completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-09-17T18:42:00.000Z' },
  { id: 'ca-4', challengeId: 'ch-gym-30d', userId: 'user-admin', actionType: 'check_in', message: 'Diana completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-09-17T18:10:00.000Z' },
  { id: 'ca-5', challengeId: 'ch-gym-30d', userId: 'user-3', actionType: 'joined', message: 'Mariana se unió al reto', createdAt: '2026-09-03T10:30:00.000Z' },
];

// Genera logs realistas para los miembros en ch-gym-30d (días 1 al 17 de Septiembre)
export function generateSeedChallengeLogs(): ChallengeLog[] {
  const logs: ChallengeLog[] = [];
  const members = ['user-admin', 'user-alex', 'user-beatriz', 'user-2', 'user-3'];

  // Probabilidades de cumplimiento que producen porcentajes realistas
  const memberProbabilities: Record<string, number> = {
    'user-admin': 94,
    'user-alex': 88,
    'user-beatriz': 84,
    'user-2': 76,
    'user-3': 72,
  };

  for (let d = 1; d <= 17; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `2026-09-${dayStr}`;

    members.forEach((userId, mIdx) => {
      // Mariana se unió el día 3
      if (userId === 'user-3' && d < 3) return;

      const prob = memberProbabilities[userId] || 80;
      const pseudo = (d * 23 + mIdx * 17) % 100;
      const isCompleted = pseudo < prob;

      // Hábito 1: Entrenar
      if (isCompleted) {
        logs.push({
          id: `clog-ch-gym-30d-chab-1-${userId}-${dateKey}`,
          challengeId: 'ch-gym-30d',
          challengeHabitId: 'chab-1',
          userId,
          dateKey,
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Hábito 2: Tomar agua
      if (pseudo < prob + 5) {
        logs.push({
          id: `clog-ch-gym-30d-chab-2-${userId}-${dateKey}`,
          challengeId: 'ch-gym-30d',
          challengeHabitId: 'chab-2',
          userId,
          dateKey,
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  return logs;
}

// ========================================================
// CRUD: CHALLENGES
// ========================================================

export function getLocalChallenges(): Challenge[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    let challenges: Challenge[] = raw ? JSON.parse(raw) : [];
    if (!raw || challenges.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    }

    // Auto-migración si existía fecha de octubre para ch-gym-30d
    let migrated = false;
    challenges = challenges.map((c) => {
      if (c.id === 'ch-gym-30d' && c.startDate === '2026-10-01') {
        migrated = true;
        return {
          ...c,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
        };
      }
      return c;
    });

    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    }

    return challenges;
  } catch {
    return DEFAULT_CHALLENGES;
  }
}

export function saveLocalChallenges(challenges: Challenge[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenges:', e);
  }
}

export async function saveChallenge(challenge: Challenge): Promise<Challenge> {
  const current = getLocalChallenges();
  const index = current.findIndex((c) => c.id === challenge.id);

  let updatedList: Challenge[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...challenge, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [
      ...current,
      { ...challenge, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  }

  saveLocalChallenges(updatedList);

  // Cloud Sync Supabase
  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('challenges').upsert({
        id: challenge.id,
        created_by: challenge.createdBy,
        title: challenge.title,
        description: challenge.description || null,
        icon: challenge.icon || '🏆',
        color: challenge.color || '#06b6d4',
        start_date: challenge.startDate,
        end_date: challenge.endDate,
        duration_days: challenge.durationDays,
        mode: challenge.mode,
        status: challenge.status,
        target_goal: challenge.targetGoal || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Sync saveChallenge Supabase:', e);
    }
  }

  return challenge;
}

// Eliminar Reto y todas sus entidades relacionadas (Local-First + Supabase)
export async function deleteChallenge(challengeId: string): Promise<boolean> {
  // 1. Actualizar LocalStorage
  const challenges = getLocalChallenges().filter((c) => c.id !== challengeId);
  saveLocalChallenges(challenges);

  const members = getLocalChallengeMembers().filter((m) => m.challengeId !== challengeId);
  saveLocalChallengeMembers(members);

  const habits = getLocalChallengeHabits().filter((h) => h.challengeId !== challengeId);
  saveLocalChallengeHabits(habits);

  const logs = getLocalChallengeLogs().filter((l) => l.challengeId !== challengeId);
  saveLocalChallengeLogs(logs);

  const goals = getLocalChallengeGoals().filter((g) => g.challengeId !== challengeId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  const activities = getLocalChallengeActivities().filter((a) => a.challengeId !== challengeId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  notifySync('challenges');

  // 2. Sincronización en la Nube Supabase (eliminación en cascada)
  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('challenge_logs').delete().eq('challenge_id', challengeId);
      await client.from('challenge_habits').delete().eq('challenge_id', challengeId);
      await client.from('challenge_members').delete().eq('challenge_id', challengeId);
      await client.from('challenges').delete().eq('id', challengeId);
    } catch (e) {
      console.warn('Sync deleteChallenge Supabase:', e);
    }
  }

  return true;
}

// ========================================================
// CRUD: MEMBERS
// ========================================================

export function getLocalChallengeMembers(challengeId?: string): ChallengeMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let members: ChallengeMember[] = raw ? JSON.parse(raw) : [];

    if (!raw || members.length === 0) {
      members = [...DEFAULT_CHALLENGE_MEMBERS];
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    // Auto-migración de joinedAt de octubre a septiembre si existían datos cacheados
    let migrated = false;
    members = members.map((m) => {
      if (m.challengeId === 'ch-gym-30d' && (m.joinedAt || '').startsWith('2026-10-')) {
        migrated = true;
        return {
          ...m,
          joinedAt: m.joinedAt.replace('2026-10-', '2026-09-'),
        };
      }
      return m;
    });

    // Auto-migración para todos los retos: si un miembro tiene joinedAt > challenge.startDate,
    // normalizar a startDate para no bloquear check-ins previos
    const allChallenges = getLocalChallenges();
    members = members.map((m) => {
      const ch = allChallenges.find((c) => c.id === m.challengeId);
      if (ch && m.joinedAt && m.joinedAt > ch.startDate) {
        migrated = true;
        return { ...m, joinedAt: ch.startDate };
      }
      return m;
    });

    // Asegurar que los miembros del sistema tengan su fila en ch-gym-30d
    if (!members.some((m) => m.challengeId === 'ch-gym-30d' && m.userId === 'user-alex')) {
      members.push({ id: 'cm-ch-gym-alex', challengeId: 'ch-gym-30d', userId: 'user-alex', role: 'member', joinedAt: '2026-09-01' });
      migrated = true;
    }
    if (!members.some((m) => m.challengeId === 'ch-gym-30d' && m.userId === 'user-beatriz')) {
      members.push({ id: 'cm-ch-gym-beatriz', challengeId: 'ch-gym-30d', userId: 'user-beatriz', role: 'member', joinedAt: '2026-09-01' });
      migrated = true;
    }

    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    if (challengeId) {
      return members.filter((m) => m.challengeId === challengeId);
    }
    return members;
  } catch {
    return DEFAULT_CHALLENGE_MEMBERS;
  }
}

export function saveLocalChallengeMembers(members: ChallengeMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenge members:', e);
  }
}

export async function addChallengeMember(
  challengeId: string,
  userId: string,
  role: 'owner' | 'member' = 'member',
  joinedAt?: string
): Promise<ChallengeMember> {
  const current = getLocalChallengeMembers();
  const exists = current.find((m) => m.challengeId === challengeId && m.userId === userId);
  if (exists) return exists;

  // Si no se especifica joinedAt, heredar startDate del reto o la fecha actual
  let effectiveJoinedAt = joinedAt;
  if (!effectiveJoinedAt) {
    const ch = getLocalChallenges().find((c) => c.id === challengeId);
    effectiveJoinedAt = ch?.startDate || new Date().toISOString().slice(0, 10);
  }

  const newMember: ChallengeMember = {
    id: `cm-${challengeId}-${userId}`,
    challengeId,
    userId,
    role,
    joinedAt: effectiveJoinedAt,
  };

  const updated = [...current, newMember];
  saveLocalChallengeMembers(updated);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('challenge_members').upsert({
        id: newMember.id,
        challenge_id: challengeId,
        user_id: userId,
        role: newMember.role,
        joined_at: newMember.joinedAt,
      });
    } catch (e) {
      console.warn('Sync addChallengeMember Supabase:', e);
    }
  }

  return newMember;
}

export async function removeChallengeMember(challengeId: string, userId: string): Promise<boolean> {
  const current = getLocalChallengeMembers();
  const filtered = current.filter((m) => !(m.challengeId === challengeId && m.userId === userId));
  saveLocalChallengeMembers(filtered);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client
        .from('challenge_members')
        .delete()
        .match({ challenge_id: challengeId, user_id: userId });
    } catch (e) {
      console.warn('Sync removeChallengeMember Supabase:', e);
    }
  }

  return true;
}

// ========================================================
// CRUD: HABITS OF CHALLENGE
// ========================================================

export function getLocalChallengeHabits(challengeId?: string): ChallengeHabit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    let habits: ChallengeHabit[] = raw ? JSON.parse(raw) : [];

    if (!raw || habits.length === 0) {
      habits = [...DEFAULT_CHALLENGE_HABITS];
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    }

    if (challengeId) {
      return habits.filter((h) => h.challengeId === challengeId);
    }
    return habits;
  } catch {
    return DEFAULT_CHALLENGE_HABITS;
  }
}

export function saveLocalChallengeHabits(habits: ChallengeHabit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenge habits:', e);
  }
}

export async function saveChallengeHabit(habit: ChallengeHabit): Promise<ChallengeHabit> {
  const current = getLocalChallengeHabits();
  const index = current.findIndex((h) => h.id === habit.id);
  let updatedList: ChallengeHabit[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = habit;
  } else {
    updatedList = [...current, habit];
  }
  saveLocalChallengeHabits(updatedList);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('challenge_habits').upsert({
        id: habit.id,
        challenge_id: habit.challengeId,
        title: habit.title,
        icon: habit.icon || '🎯',
        target_value: habit.targetValue || 1,
        display_order: habit.displayOrder || 1,
      });
    } catch (e) {
      console.warn('Sync saveChallengeHabit Supabase:', e);
    }
  }
  return habit;
}

// ========================================================
// CHECK-INS & LOGS OF CHALLENGE
// ========================================================

export function getLocalChallengeLogs(challengeId?: string): ChallengeLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    let logs: ChallengeLog[] = raw ? JSON.parse(raw) : [];

    if (!raw || logs.length === 0) {
      logs = generateSeedChallengeLogs();
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    }

    // Auto-migración de logs de octubre a septiembre
    let migrated = false;
    logs = logs.map((l) => {
      if (l.challengeId === 'ch-gym-30d' && l.dateKey.startsWith('2026-10-')) {
        migrated = true;
        return { ...l, dateKey: l.dateKey.replace('2026-10-', '2026-09-') };
      }
      return l;
    });

    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    }

    if (challengeId) {
      return logs.filter((l) => l.challengeId === challengeId);
    }
    return logs;
  } catch {
    return [];
  }
}

export function saveLocalChallengeLogs(logs: ChallengeLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenge logs:', e);
  }
}

// Toggle Check-in: Protegido por ID de usuario
export async function toggleChallengeLog(
  challengeId: string,
  challengeHabitId: string,
  userId: string,
  dateKey: string
): Promise<{ log: ChallengeLog | null; newStatus: HabitLogStatus | 'removed' }> {
  // No permitir check-ins en días futuros
  if (dateKey > getBogotaToday()) {
    console.warn('Bloqueado: No se permite registrar check-ins en fechas futuras.');
    return { log: null, newStatus: 'removed' };
  }

  const currentLogs = getLocalChallengeLogs();
  const index = currentLogs.findIndex(
    (l) =>
      l.challengeId === challengeId &&
      l.challengeHabitId === challengeHabitId &&
      l.userId === userId &&
      l.dateKey === dateKey
  );

  let resultingLog: ChallengeLog | null = null;
  let newStatus: HabitLogStatus | 'removed';

  if (index >= 0) {
    // Alternar: si estaba completado, se remueve
    currentLogs.splice(index, 1);
    newStatus = 'removed';
  } else {
    resultingLog = {
      id: `clog-${challengeId}-${challengeHabitId}-${userId}-${dateKey}`,
      challengeId,
      challengeHabitId,
      userId,
      dateKey,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentLogs.push(resultingLog);
    newStatus = 'completed';
  }

  saveLocalChallengeLogs(currentLogs);

  // Cloud Sync Supabase
  const client = await getOrInitSupabase();
  if (client) {
    try {
      if (newStatus === 'removed') {
        await client.from('challenge_logs').delete().match({
          challenge_id: challengeId,
          challenge_habit_id: challengeHabitId,
          user_id: userId,
          date_key: dateKey,
        });
      } else if (resultingLog) {
        await client.from('challenge_logs').upsert({
          id: resultingLog.id,
          challenge_id: resultingLog.challengeId,
          challenge_habit_id: resultingLog.challengeHabitId,
          user_id: resultingLog.userId,
          date_key: resultingLog.dateKey,
          status: resultingLog.status,
          created_at: resultingLog.createdAt,
          updated_at: resultingLog.updatedAt,
        });
      }
    } catch (e) {
      console.warn('Sync toggleChallengeLog Supabase:', e);
    }
  }

  return { log: resultingLog, newStatus };
}

// ========================================================
// RECENT ACTIVITIES (Discreto, anti-spam)
// ========================================================

export function getLocalChallengeActivities(challengeId?: string): ChallengeActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    let list: ChallengeActivity[] = raw ? JSON.parse(raw) : [];

    if (!raw || list.length === 0) {
      list = [...DEFAULT_CHALLENGE_ACTIVITIES];
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
    }

    if (challengeId) {
      return list.filter((a) => a.challengeId === challengeId);
    }
    return list;
  } catch {
    return DEFAULT_CHALLENGE_ACTIVITIES;
  }
}

export function addChallengeActivity(
  challengeId: string,
  userId: string,
  message: string,
  actionType: 'check_in' | 'joined' | 'milestone' = 'check_in',
  habitTitle?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalChallengeActivities();
    const newActivity: ChallengeActivity = {
      id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      challengeId,
      userId,
      actionType,
      message,
      habitTitle,
      createdAt: new Date().toISOString(),
    };

    // Mantener las últimas 20 actividades
    const updated = [newActivity, ...current].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenge activity:', e);
  }
}

// ========================================================
// CHALLENGE GOALS
// ========================================================

export function getLocalChallengeGoals(challengeId?: string): ChallengeGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    let goals: ChallengeGoal[] = raw ? JSON.parse(raw) : [];

    if (!raw || goals.length === 0) {
      goals = [...DEFAULT_CHALLENGE_GOALS];
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }

    if (challengeId) {
      return goals.filter((g) => g.challengeId === challengeId);
    }
    return goals;
  } catch {
    return DEFAULT_CHALLENGE_GOALS;
  }
}

export function toggleChallengeGoal(goalId: string): void {
  if (typeof window === 'undefined') return;
  const current = getLocalChallengeGoals();
  const target = current.find((g) => g.id === goalId);
  if (!target) return;

  target.isCompleted = !target.isCompleted;
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(current));
  notifySync('challenges');
}

export function saveChallengeGoal(goal: ChallengeGoal): void {
  if (typeof window === 'undefined') return;
  const current = getLocalChallengeGoals();
  const index = current.findIndex((g) => g.id === goal.id);

  if (index >= 0) {
    current[index] = goal;
  } else {
    current.push(goal);
  }

  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(current));
  notifySync('challenges');
}
