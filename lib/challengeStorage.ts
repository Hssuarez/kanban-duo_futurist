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
    startDate: '2026-10-01',
    endDate: '2026-10-30',
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
    createdBy: 'user-2',
    title: 'Hidratación 21 días',
    description: 'Tomar al menos 2.5 litros de agua diarios.',
    icon: '💧',
    color: '#0284c7',
    startDate: '2026-10-05',
    endDate: '2026-10-25',
    durationDays: 21,
    mode: 'collaborative',
    status: 'upcoming',
    targetGoal: '21 días seguidos',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
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
  // Miembros de 'ch-gym-30d'
  { id: 'cm-1', challengeId: 'ch-gym-30d', userId: 'user-admin', role: 'owner', joinedAt: '2026-10-01' },
  { id: 'cm-2', challengeId: 'ch-gym-30d', userId: 'user-2', role: 'member', joinedAt: '2026-10-01' },
  { id: 'cm-3', challengeId: 'ch-gym-30d', userId: 'user-3', role: 'member', joinedAt: '2026-10-01' },
  { id: 'cm-4', challengeId: 'ch-gym-30d', userId: 'user-4', role: 'member', joinedAt: '2026-10-01' },
  { id: 'cm-5', challengeId: 'ch-gym-30d', userId: 'user-5', role: 'member', joinedAt: '2026-10-03' }, // Participación tardía

  // Miembros de 'ch-lectura-30d'
  { id: 'cm-6', challengeId: 'ch-lectura-30d', userId: 'user-admin', role: 'owner', joinedAt: '2026-09-01' },
  { id: 'cm-7', challengeId: 'ch-lectura-30d', userId: 'user-2', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-8', challengeId: 'ch-lectura-30d', userId: 'user-3', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-9', challengeId: 'ch-lectura-30d', userId: 'user-4', role: 'member', joinedAt: '2026-09-01' },
];

export const DEFAULT_CHALLENGE_HABITS: ChallengeHabit[] = [
  { id: 'chab-1', challengeId: 'ch-gym-30d', title: 'Entrenar', icon: '🏋️', targetValue: 1, displayOrder: 1, createdAt: '2026-09-01' },
  { id: 'chab-2', challengeId: 'ch-gym-30d', title: 'Tomar agua', icon: '💧', targetValue: 8, displayOrder: 2, createdAt: '2026-09-01' },
  { id: 'chab-3', challengeId: 'ch-lectura-30d', title: 'Leer 20 min', icon: '📖', targetValue: 20, displayOrder: 1, createdAt: '2026-09-01' },
];

export const DEFAULT_CHALLENGE_GOALS: ChallengeGoal[] = [
  { id: 'cg-1', challengeId: 'ch-gym-30d', title: 'Completar 20 sesiones de gym', targetValue: 20, currentValue: 18, unit: 'sesiones', isCompleted: false, createdAt: '2026-10-01' },
  { id: 'cg-2', challengeId: 'ch-gym-30d', title: 'Mantener 7 días consecutivos', targetValue: 7, currentValue: 7, unit: 'días', isCompleted: true, createdAt: '2026-10-01' },
  { id: 'cg-3', challengeId: 'ch-gym-30d', title: 'Alcanzar 80% de consistencia', targetValue: 80, currentValue: 86, unit: '%', isCompleted: true, createdAt: '2026-10-01' },
  { id: 'cg-4', challengeId: 'ch-gym-30d', title: 'Completar los 30 días', targetValue: 30, currentValue: 20, unit: 'días', isCompleted: false, createdAt: '2026-10-01' },
];

export const DEFAULT_CHALLENGE_ACTIVITIES: ChallengeActivity[] = [
  { id: 'ca-1', challengeId: 'ch-gym-30d', userId: 'user-2', actionType: 'check_in', message: 'Jesús completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-10-17T20:24:00.000Z' },
  { id: 'ca-2', challengeId: 'ch-gym-30d', userId: 'user-3', actionType: 'check_in', message: 'Mariana completó Tomar agua', habitTitle: 'Tomar agua', createdAt: '2026-10-17T19:15:00.000Z' },
  { id: 'ca-3', challengeId: 'ch-gym-30d', userId: 'user-4', actionType: 'check_in', message: 'Carlos completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-10-17T18:42:00.000Z' },
  { id: 'ca-4', challengeId: 'ch-gym-30d', userId: 'user-admin', actionType: 'check_in', message: 'Stephan completó Entrenar', habitTitle: 'Entrenar', createdAt: '2026-10-17T18:10:00.000Z' },
  { id: 'ca-5', challengeId: 'ch-gym-30d', userId: 'user-5', actionType: 'joined', message: 'Andrés se unió al reto', createdAt: '2026-10-03T10:30:00.000Z' },
];

// Genera logs realistas para los 5 miembros en ch-gym-30d (días 1 al 17)
export function generateSeedChallengeLogs(): ChallengeLog[] {
  const logs: ChallengeLog[] = [];
  const members = ['user-admin', 'user-2', 'user-3', 'user-4', 'user-5'];

  // Probabilidades de cumplimiento que producen los porcentajes de la referencia:
  // Stephan: 92%, Jesús: 88%, Mariana: 84%, Carlos: 76%, Andrés: 70%
  const memberProbabilities: Record<string, number> = {
    'user-admin': 94,
    'user-2': 88,
    'user-3': 84,
    'user-4': 76,
    'user-5': 72,
  };

  for (let d = 1; d <= 17; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `2026-10-${dayStr}`;

    members.forEach((userId, mIdx) => {
      // Andrés se unió el día 3
      if (userId === 'user-5' && d < 3) return;

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
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    }
    return JSON.parse(raw);
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
  joinedAt = new Date().toISOString().slice(0, 10)
): Promise<ChallengeMember> {
  const current = getLocalChallengeMembers();
  const exists = current.find((m) => m.challengeId === challengeId && m.userId === userId);
  if (exists) return exists;

  const newMember: ChallengeMember = {
    id: `cm-${challengeId}-${userId}`,
    challengeId,
    userId,
    role,
    joinedAt,
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
