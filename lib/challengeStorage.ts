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
  DELETED_IDS: 'kanban_duo_deleted_challenge_ids_v1',
  LAST_SELECTED: 'kanban_duo_last_selected_challenge_id_v1',
  PENDING_UPLOADS: 'kanban_duo_pending_upload_challenges_v1',
  PENDING_UPLOAD_LOG_IDS: 'kanban_duo_pending_upload_challenge_logs_v1',
};

// Limpieza proactiva de lápidas antiguas que pudieran causar interferencia en sesiones previas
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('kanban_duo_deleted_challenge_log_keys_v1');
  } catch {}
}

export const LEGACY_DELETED_DEMO_IDS = ['ch-lectura-30d', 'ch-hidrata-21d', 'ch-sueno-31d'];

// ========================================================
// ESTADO DE SINCRONIZACIÓN CLOUD (SUPABASE)
// ========================================================

export interface ChallengeCloudSyncStatus {
  isConfigured: boolean;
  isSynced: boolean;
  statusText: string;
  errorMessage?: string;
  errorCode?: string;
  lastSyncTime?: string;
}

let _challengeCloudSyncStatus: ChallengeCloudSyncStatus = {
  isConfigured: true,
  isSynced: false,
  statusText: 'Verificando nube...',
};

export function getChallengeCloudSyncStatus(): ChallengeCloudSyncStatus {
  return _challengeCloudSyncStatus;
}

// ========================================================
// PERSISTENCIA: LÁPIDAS DE ELIMINACIÓN Y RETO SELECCIONADO
// ========================================================

export function getDeletedChallengeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markChallengeAsDeleted(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedChallengeIds();
    if (!deleted.includes(challengeId)) {
      deleted.push(challengeId);
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(deleted));
    }
    removePendingUploadChallengeId(challengeId);
  } catch (e) {
    console.error('Error guardando deleted challenge id:', e);
  }
}

export function removeDeletedChallengeId(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedChallengeIds().filter((id) => id !== challengeId);
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch (e) {
    console.error('Error removiendo deleted challenge id:', e);
  }
}

export function getPendingUploadChallengeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markChallengeAsPendingUpload(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingUploadChallengeIds();
    if (!list.includes(challengeId)) {
      list.push(challengeId);
      localStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Error guardando pending upload challenge id:', e);
  }
}

export function removePendingUploadChallengeId(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingUploadChallengeIds().filter((id) => id !== challengeId);
    localStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(list));
  } catch (e) {
    console.warn('Error removiendo pending upload challenge id:', e);
  }
}

export function getLastSelectedChallengeId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SELECTED);
  } catch {
    return null;
  }
}

export function saveLastSelectedChallengeId(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SELECTED, challengeId);
  } catch (e) {
    console.error('Error guardando last selected challenge id:', e);
  }
}

// Eliminación en cascada provocada por un evento remoto en Realtime (otra pestaña o dispositivo)
export function handleRemoteChallengeDeleted(challengeId: string): void {
  markChallengeAsDeleted(challengeId);

  const updatedChallenges = getLocalChallenges().filter((c) => c.id !== challengeId);
  saveLocalChallenges(updatedChallenges);

  const updatedMembers = getLocalChallengeMembers().filter((m) => m.challengeId !== challengeId);
  saveLocalChallengeMembers(updatedMembers);

  const updatedHabits = getLocalChallengeHabits().filter((h) => h.challengeId !== challengeId);
  saveLocalChallengeHabits(updatedHabits);

  const updatedLogs = getLocalChallengeLogs().filter((l) => l.challengeId !== challengeId);
  saveLocalChallengeLogs(updatedLogs);

  const updatedGoals = getLocalChallengeGoals().filter((g) => g.challengeId !== challengeId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
  }

  const updatedActivities = getLocalChallengeActivities().filter((a) => a.challengeId !== challengeId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updatedActivities));
  }

  if (getLastSelectedChallengeId() === challengeId) {
    if (updatedChallenges.length > 0) {
      saveLastSelectedChallengeId(updatedChallenges[0].id);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED);
      }
    }
  }

  notifySync('challenges');
}

// --------------------------------------------------------
// SINCRONIZACIÓN REALTIME Y COLA OFFLINE DE LOGS / CHECK-INS
// --------------------------------------------------------

export function getPendingUploadLogIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_UPLOAD_LOG_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markLogAsPendingUpload(logId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingUploadLogIds();
    if (!list.includes(logId)) {
      list.push(logId);
      localStorage.setItem(STORAGE_KEYS.PENDING_UPLOAD_LOG_IDS, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Error guardando pending upload log id:', e);
  }
}

export function removePendingUploadLogId(logId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingUploadLogIds().filter((id) => id !== logId);
    localStorage.setItem(STORAGE_KEYS.PENDING_UPLOAD_LOG_IDS, JSON.stringify(list));
  } catch (e) {
    console.warn('Error removiendo pending upload log id:', e);
  }
}

// Manejador centralizado de eventos Realtime de Postgres para check-ins
export function handleRemoteChallengeLogRealtime(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}): void {
  if (!payload || !payload.eventType) return;

  const currentLogs = getLocalChallengeLogs();

  if (payload.eventType === 'DELETE') {
    const oldLog = payload.old;
    if (!oldLog) return;
    const deletedId = oldLog.id;
    const chId = oldLog.challenge_id;
    const uId = oldLog.user_id;
    const dKey = oldLog.date_key;

    const updated = currentLogs.filter((l) => {
      if (deletedId && l.id === deletedId) return false;
      if (chId && uId && dKey && l.challengeId === chId && l.userId === uId && l.dateKey === dKey) {
        return false;
      }
      return true;
    });

    saveLocalChallengeLogs(updated);
    return;
  }

  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    const raw = payload.new;
    if (!raw || !raw.id || !raw.challenge_id) return;

    const incomingLog: ChallengeLog = {
      id: raw.id,
      challengeId: raw.challenge_id,
      challengeHabitId: raw.challenge_habit_id,
      userId: raw.user_id,
      dateKey: raw.date_key,
      status: raw.status || 'completed',
      numericValue: raw.numeric_value,
      notes: raw.notes,
      createdAt: raw.created_at || new Date().toISOString(),
      updatedAt: raw.updated_at || new Date().toISOString(),
    };

    const index = currentLogs.findIndex(
      (l) =>
        l.id === incomingLog.id ||
        (l.challengeId === incomingLog.challengeId &&
          l.userId === incomingLog.userId &&
          l.dateKey === incomingLog.dateKey)
    );

    let updated: ChallengeLog[];
    if (index >= 0) {
      updated = [...currentLogs];
      updated[index] = incomingLog;
    } else {
      updated = [...currentLogs, incomingLog];
    }

    saveLocalChallengeLogs(updated);
  }
}

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
];

export const DEFAULT_CHALLENGE_MEMBERS: ChallengeMember[] = [
  // Miembros de 'ch-gym-30d' (incluyendo usuarios reales del sistema)
  { id: 'cm-1', challengeId: 'ch-gym-30d', userId: 'user-admin', role: 'owner', joinedAt: '2026-09-01' },
  { id: 'cm-2', challengeId: 'ch-gym-30d', userId: 'user-alex', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-3', challengeId: 'ch-gym-30d', userId: 'user-beatriz', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-4', challengeId: 'ch-gym-30d', userId: 'user-2', role: 'member', joinedAt: '2026-09-01' },
  { id: 'cm-5', challengeId: 'ch-gym-30d', userId: 'user-3', role: 'member', joinedAt: '2026-09-03' },
];

export const DEFAULT_CHALLENGE_HABITS: ChallengeHabit[] = [
  { id: 'chab-1', challengeId: 'ch-gym-30d', title: 'Entrenar', icon: '🏋️', targetValue: 1, displayOrder: 1, createdAt: '2026-09-01' },
  { id: 'chab-2', challengeId: 'ch-gym-30d', title: 'Tomar agua', icon: '💧', targetValue: 8, displayOrder: 2, createdAt: '2026-09-01' },
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
  const deletedIds = getDeletedChallengeIds();
  if (typeof window === 'undefined') {
    return DEFAULT_CHALLENGES.filter((c) => !deletedIds.includes(c.id));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    let challenges: Challenge[] = raw ? JSON.parse(raw) : [];

    // Auto-migración desde claves legacy (v1 o sin sufijo de versión)
    const legacyRaw =
      localStorage.getItem('kanban_duo_challenges') ||
      localStorage.getItem('kanban_duo_challenges_v1');
    if (legacyRaw) {
      try {
        const legacy: Challenge[] = JSON.parse(legacyRaw);
        if (Array.isArray(legacy) && legacy.length > 0) {
          const idSet = new Set(challenges.map((c) => c.id));
          let hasNewLegacy = false;
          legacy.forEach((legCh) => {
            if (
              !idSet.has(legCh.id) &&
              !deletedIds.includes(legCh.id) &&
              !LEGACY_DELETED_DEMO_IDS.includes(legCh.id)
            ) {
              challenges.push(legCh);
              idSet.add(legCh.id);
              hasNewLegacy = true;
            }
          });
          if (hasNewLegacy) {
            localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
          }
        }
      } catch (e) {
        console.warn('Error migrando retos legacy:', e);
      }
    }

    // Si no hay datos iniciales en localStorage, cargar los defaults excluyendo los eliminados
    if (!raw && challenges.length === 0) {
      const initial = DEFAULT_CHALLENGES.filter(
        (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
      );
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(initial));
      return initial;
    }

    // Filtrar siempre y permanentemente cualquier reto eliminado o demo legacy
    challenges = challenges.filter(
      (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
    );

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
    return DEFAULT_CHALLENGES.filter(
      (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
    );
  }
}

export function saveLocalChallenges(challenges: Challenge[]): void {
  if (typeof window === 'undefined') return;
  const deletedIds = getDeletedChallengeIds();
  try {
    // Asegurar que ningún reto en la lista esté en deletedIds
    const filtered = challenges.filter((c) => !deletedIds.includes(c.id));
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(filtered));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenges:', e);
  }
}

export async function saveChallenge(challenge: Challenge): Promise<Challenge> {
  // Si fue marcado como eliminado en el pasado, reactivarlo
  removeDeletedChallengeId(challenge.id);
  saveLastSelectedChallengeId(challenge.id);

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
      const { error } = await client.from('challenges').upsert({
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
      if (error) {
        console.error('❌ Error al sincronizar reto con Supabase:', error);
        markChallengeAsPendingUpload(challenge.id);
        _challengeCloudSyncStatus = {
          isConfigured: true,
          isSynced: false,
          statusText: 'Error al sincronizar reto con Supabase',
          errorMessage: error.message,
          errorCode: error.code,
          lastSyncTime: new Date().toISOString(),
        };
      } else {
        console.log('✅ Reto sincronizado exitosamente con Supabase:', challenge.title);
        removePendingUploadChallengeId(challenge.id);
        _challengeCloudSyncStatus = {
          isConfigured: true,
          isSynced: true,
          statusText: 'Sincronizado con Supabase',
          lastSyncTime: new Date().toISOString(),
        };
      }
    } catch (e: any) {
      console.warn('Sync saveChallenge Supabase exception:', e);
      markChallengeAsPendingUpload(challenge.id);
      _challengeCloudSyncStatus = {
        isConfigured: true,
        isSynced: false,
        statusText: 'Excepción al conectar con Supabase',
        errorMessage: e?.message,
        lastSyncTime: new Date().toISOString(),
      };
    }
  } else {
    markChallengeAsPendingUpload(challenge.id);
  }

  return challenge;
}

// Eliminar Reto permanentemente y en cascada (Local-First + Supabase + Lápida persistente)
export async function deleteChallenge(challengeId: string): Promise<boolean> {
  // 1. Marcar el ID como eliminado permanentemente para evitar cualquier resurrección
  markChallengeAsDeleted(challengeId);

  // Si era el seleccionado, limpiar la memoria del último seleccionado
  if (getLastSelectedChallengeId() === challengeId) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED);
    }
  }

  // 2. Actualizar LocalStorage
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

  // 3. Sincronización en la Nube Supabase (eliminación en cascada en todas las tablas)
  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('challenge_logs').delete().eq('challenge_id', challengeId);
      await client.from('challenge_habits').delete().eq('challenge_id', challengeId);
      await client.from('challenge_members').delete().eq('challenge_id', challengeId);
      await client.from('challenge_goals').delete().eq('challenge_id', challengeId);
      await client.from('challenge_activities').delete().eq('challenge_id', challengeId);
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
    // Deduplicación estricta por (challengeId, userId, dateKey)
    const uniqueMap = new Map<string, ChallengeLog>();
    logs.forEach((l) => {
      const dedupeKey = `${l.challengeId}_${l.userId}_${l.dateKey}`;
      const existing = uniqueMap.get(dedupeKey);
      if (!existing || l.status === 'completed') {
        uniqueMap.set(dedupeKey, l);
      }
    });

    const deduplicated = Array.from(uniqueMap.values());
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(deduplicated));
    notifySync('challenges');
  } catch (e) {
    console.error('Error guardando challenge logs:', e);
  }
}

// Toggle Check-in: Protegido por ID de usuario con eliminación garantizada y sincronización limpia
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

  // Búsqueda exhaustiva por reto, usuario y fecha para eliminar duplicados o discrepancias de habitId
  const matchingLogs = currentLogs.filter(
    (l) => l.challengeId === challengeId && l.userId === userId && l.dateKey === dateKey
  );
  const isCurrentlyCompleted = matchingLogs.some((l) => l.status === 'completed') || matchingLogs.length > 0;

  let resultingLog: ChallengeLog | null = null;
  let newStatus: HabitLogStatus | 'removed';

  if (isCurrentlyCompleted) {
    // ACCIÓN: DESMARCAR (Eliminación definitiva)
    newStatus = 'removed';
    const removedIds = matchingLogs.map((l) => l.id);

    // 1. Filtrar localmente de inmediato
    const remainingLogs = currentLogs.filter(
      (l) => !(l.challengeId === challengeId && l.userId === userId && l.dateKey === dateKey)
    );
    saveLocalChallengeLogs(remainingLogs);

    // 2. Limpiar de la cola pendiente si estaba
    removedIds.forEach((id) => removePendingUploadLogId(id));

    // 3. Purgar de Supabase (por ID exacto y por combinación reto/usuario/fecha)
    const client = await getOrInitSupabase();
    if (client) {
      try {
        if (removedIds.length > 0) {
          await client.from('challenge_logs').delete().in('id', removedIds);
        }
        await client
          .from('challenge_logs')
          .delete()
          .eq('challenge_id', challengeId)
          .eq('user_id', userId)
          .eq('date_key', dateKey);
      } catch (e) {
        console.warn('Sync toggleChallengeLog delete Supabase error:', e);
      }
    }
  } else {
    // ACCIÓN: MARCAR (Nuevo check-in)
    newStatus = 'completed';

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

    markLogAsPendingUpload(resultingLog.id);
    const updatedLogs = [...currentLogs, resultingLog];
    saveLocalChallengeLogs(updatedLogs);

    // Sincronizar creación en Supabase
    const client = await getOrInitSupabase();
    if (client) {
      try {
        const { error: upErr } = await client.from('challenge_logs').upsert({
          id: resultingLog.id,
          challenge_id: resultingLog.challengeId,
          challenge_habit_id: resultingLog.challengeHabitId,
          user_id: resultingLog.userId,
          date_key: resultingLog.dateKey,
          status: resultingLog.status,
          created_at: resultingLog.createdAt,
          updated_at: resultingLog.updatedAt,
        });
        if (!upErr) {
          removePendingUploadLogId(resultingLog.id);
        } else {
          console.warn('Sync toggleChallengeLog upsert error:', upErr);
        }
      } catch (e) {
        console.warn('Sync toggleChallengeLog Supabase upsert exception:', e);
      }
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

    // Sanitización retroactiva: eliminar duplicados de check-in que compartan mismo usuario, reto, mensaje/hábito y fecha
    let changed = false;
    const seenCheckInKeys = new Set<string>();
    const deduplicatedList: ChallengeActivity[] = [];

    for (const act of list) {
      if (act.actionType === 'check_in') {
        const datePart = act.dateKey || (act.createdAt ? act.createdAt.slice(0, 10) : '');
        const habitPart = act.challengeHabitId || act.habitTitle || act.message;
        const dedupKey = `${act.challengeId}_${act.userId}_${habitPart}_${datePart}`;
        if (seenCheckInKeys.has(dedupKey)) {
          changed = true;
          continue; // Omitir duplicado previo
        }
        seenCheckInKeys.add(dedupKey);
        deduplicatedList.push(act);
      } else {
        deduplicatedList.push(act);
      }
    }

    if (changed) {
      list = deduplicatedList;
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

export function recordChallengeCheckInActivity(
  challengeId: string,
  userId: string,
  message: string,
  habitTitle?: string,
  challengeHabitId?: string,
  dateKey?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalChallengeActivities();
    const effectiveDateKey = dateKey || getBogotaToday();
    const deterministicId = `ca-${challengeId}-${userId}-${challengeHabitId || 'h'}-${effectiveDateKey}`;

    // Filtrar cualquier actividad previa de check-in para el mismo hábito y fecha
    const filtered = current.filter((a) => {
      if (a.id === deterministicId) return false;
      if (
        a.actionType === 'check_in' &&
        a.challengeId === challengeId &&
        a.userId === userId &&
        ((challengeHabitId && a.challengeHabitId === challengeHabitId) || (habitTitle && a.habitTitle === habitTitle)) &&
        (a.dateKey === effectiveDateKey || (a.createdAt && a.createdAt.slice(0, 10) === effectiveDateKey))
      ) {
        return false;
      }
      return true;
    });

    const newActivity: ChallengeActivity = {
      id: deterministicId,
      challengeId,
      userId,
      actionType: 'check_in',
      message,
      habitTitle,
      challengeHabitId,
      dateKey: effectiveDateKey,
      createdAt: new Date().toISOString(),
    };

    const updated = [newActivity, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    notifySync('challenges');
  } catch (e) {
    console.error('Error registrando check-in activity:', e);
  }
}

export function removeChallengeCheckInActivity(
  challengeId: string,
  userId: string,
  challengeHabitId?: string,
  dateKey?: string,
  habitTitle?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalChallengeActivities();
    const effectiveDateKey = dateKey || getBogotaToday();
    const deterministicId = `ca-${challengeId}-${userId}-${challengeHabitId || 'h'}-${effectiveDateKey}`;

    const filtered = current.filter((a) => {
      if (a.id === deterministicId) return false;
      if (
        a.actionType === 'check_in' &&
        a.challengeId === challengeId &&
        a.userId === userId &&
        ((challengeHabitId && a.challengeHabitId === challengeHabitId) || (habitTitle && a.habitTitle === habitTitle)) &&
        (a.dateKey === effectiveDateKey || (a.createdAt && a.createdAt.slice(0, 10) === effectiveDateKey))
      ) {
        return false;
      }
      return true;
    });

    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(filtered));
    notifySync('challenges');
  } catch (e) {
    console.error('Error removiendo check-in activity:', e);
  }
}

export function addChallengeActivity(
  challengeId: string,
  userId: string,
  message: string,
  actionType: 'check_in' | 'joined' | 'milestone' = 'check_in',
  habitTitle?: string,
  challengeHabitId?: string,
  dateKey?: string
): void {
  if (actionType === 'check_in') {
    recordChallengeCheckInActivity(challengeId, userId, message, habitTitle, challengeHabitId, dateKey);
    return;
  }

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
      challengeHabitId,
      dateKey,
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

    // Auto-migración desde claves legacy
    const legacyRaw =
      localStorage.getItem('kanban_duo_challenge_goals') ||
      localStorage.getItem('kanban_duo_challenge_goals_v1');
    if (legacyRaw) {
      try {
        const legacy: ChallengeGoal[] = JSON.parse(legacyRaw);
        if (Array.isArray(legacy) && legacy.length > 0) {
          const idSet = new Set(goals.map((g) => g.id));
          let hasNewLegacy = false;
          legacy.forEach((legG) => {
            if (!idSet.has(legG.id)) {
              goals.push(legG);
              idSet.add(legG.id);
              hasNewLegacy = true;
            }
          });
          if (hasNewLegacy) {
            localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
          }
        }
      } catch (e) {
        console.warn('Error migrando goals legacy:', e);
      }
    }

    if (!raw && goals.length === 0) {
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

  getOrInitSupabase().then((client) => {
    if (client) {
      (client.from('challenge_goals') as any)
        .update({ is_completed: target.isCompleted })
        .eq('id', goalId)
        .catch((e: any) => console.warn('Sync toggle challenge goal Supabase:', e));
    }
  });
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

  getOrInitSupabase().then((client) => {
    if (client) {
      (client.from('challenge_goals') as any)
        .upsert({
          id: goal.id,
          challenge_id: goal.challengeId,
          title: goal.title,
          target_value: goal.targetValue,
          current_value: goal.currentValue,
          unit: goal.unit || null,
          is_completed: goal.isCompleted,
          created_at: goal.createdAt,
        })
        .catch((e: any) => console.warn('Sync save challenge goal Supabase:', e));
    }
  });
}

export function deleteChallengeGoal(goalId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getLocalChallengeGoals();
  const filtered = current.filter((g) => g.id !== goalId);
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
  notifySync('challenges');

  getOrInitSupabase().then((client) => {
    if (client) {
      (client.from('challenge_goals') as any)
        .delete()
        .eq('id', goalId)
        .catch((e: any) => console.warn('Sync delete challenge goal Supabase:', e));
    }
  });

  return true;
}

// ========================================================
// SUPABASE REALTIME CLOUD INTEGRATION (BIDIRECTIONAL)
// ========================================================

export async function syncCloudChallenges(): Promise<Challenge[]> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') {
    _challengeCloudSyncStatus = {
      isConfigured: false,
      isSynced: false,
      statusText: 'Supabase no configurado en este entorno',
    };
    return getLocalChallenges();
  }

  const deletedIds = getDeletedChallengeIds();
  const pendingUploadIds = getPendingUploadChallengeIds();

  try {
    // 1. Sincronizar retos principales (challenges)
    const { data: cloudChallenges, error: chErr } = await client.from('challenges').select('*');
    if (chErr) {
      console.warn('❌ Error al consultar challenges en Supabase:', chErr);
      _challengeCloudSyncStatus = {
        isConfigured: true,
        isSynced: false,
        statusText:
          chErr.code === '42P01'
            ? 'Falta ejecutar migración SQL en Supabase'
            : chErr.code === '42501'
            ? 'Políticas RLS bloqueadas en Supabase'
            : 'Error consultando retos en Supabase',
        errorMessage: chErr.message,
        errorCode: chErr.code,
        lastSyncTime: new Date().toISOString(),
      };
      notifySync('challenges');
      return getLocalChallenges();
    }

    _challengeCloudSyncStatus = {
      isConfigured: true,
      isSynced: true,
      statusText: 'Nube conectada y sincronizada',
      lastSyncTime: new Date().toISOString(),
    };

    if (cloudChallenges) {
      // 1.1. Si Supabase tiene algún reto que fue eliminado en este dispositivo o es un demo legacy eliminado, purgarlo de la base de datos
      const idsToPurgeFromCloud = Array.from(new Set([...deletedIds, ...LEGACY_DELETED_DEMO_IDS]));
      for (const delId of idsToPurgeFromCloud) {
        if (cloudChallenges.some((c: any) => c.id === delId)) {
          console.log('🗑️ Purgando de Supabase reto eliminado:', delId);
          try {
            await client.from('challenge_logs').delete().eq('challenge_id', delId);
            await client.from('challenge_habits').delete().eq('challenge_id', delId);
            await client.from('challenge_members').delete().eq('challenge_id', delId);
            await client.from('challenge_goals').delete().eq('challenge_id', delId);
            await client.from('challenge_activities').delete().eq('challenge_id', delId);
            await client.from('challenges').delete().eq('id', delId);
          } catch (e) {
            console.warn('Error purgando reto eliminado de Supabase:', e);
          }
        }
      }

      // 1.2. Mapear los retos válidos que existen en Supabase
      const validCloud = cloudChallenges.filter(
        (c: any) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
      );

      const mappedCloud: Challenge[] = validCloud.map((c: any) => ({
        id: c.id,
        createdBy: c.created_by,
        title: c.title,
        description: c.description || '',
        icon: c.icon || '🏆',
        color: c.color || '#06b6d4',
        startDate: c.start_date,
        endDate: c.end_date,
        durationDays: c.duration_days || 30,
        mode: c.mode || 'competitive',
        status: c.status || 'active',
        targetGoal: c.target_goal || undefined,
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString(),
      }));

      const mergedMap = new Map<string, Challenge>();
      mappedCloud.forEach((c) => mergedMap.set(c.id, c));

      // 1.3. Subir ÚNICAMENTE retos locales que estén pendientes de sincronización (o creados por el usuario que no sean demos)
      const currentLocal = getLocalChallenges();
      const isCloudEmpty = mappedCloud.length === 0;

      for (const c of currentLocal) {
        if (deletedIds.includes(c.id) || LEGACY_DELETED_DEMO_IDS.includes(c.id)) {
          continue;
        }

        const isPending = pendingUploadIds.includes(c.id);
        const isUserCreated =
          !c.id.startsWith('ch-gym-') &&
          !c.id.startsWith('ch-lectura-') &&
          !c.id.startsWith('ch-hidrata-') &&
          !c.id.startsWith('ch-sueno-');

        // Solo subir si está pendiente o es un reto creado por el usuario que aún no existe en la nube
        if (!mergedMap.has(c.id) && (isCloudEmpty || isPending || isUserCreated)) {
          mergedMap.set(c.id, c);
          try {
            const { error: upErr } = await (client.from('challenges') as any).upsert({
              id: c.id,
              created_by: c.createdBy,
              title: c.title,
              description: c.description || null,
              icon: c.icon,
              color: c.color,
              start_date: c.startDate,
              end_date: c.endDate,
              duration_days: c.durationDays,
              mode: c.mode,
              status: c.status,
              target_goal: c.targetGoal || null,
              updated_at: c.updatedAt,
            });
            if (upErr) {
              console.error('Error subiendo reto local a Supabase:', upErr);
            } else {
              console.log('☁️ Reto local subido exitosamente a Supabase:', c.title);
              removePendingUploadChallengeId(c.id);
            }
          } catch (e) {
            console.warn('Excepción subiendo reto local:', e);
          }
        }
      }

      // Si la nube ya contiene retos autoritativos, los retos locales obsoletos que no estén en la nube
      // se descartan para reflejar la eliminación remota.
      const finalChallenges = Array.from(mergedMap.values()).filter(
        (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
      );

      saveLocalChallenges(finalChallenges);

      // Si el reto activo fue eliminado remotamente, reasignar
      const activeChallengeIds = new Set(finalChallenges.map((c) => c.id));
      const currentSelected = getLastSelectedChallengeId();
      if (currentSelected && !activeChallengeIds.has(currentSelected)) {
        if (finalChallenges.length > 0) {
          saveLastSelectedChallengeId(finalChallenges[0].id);
        } else {
          localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED);
        }
      }
    }

    // 2. Sincronizar miembros (challenge_members)
    const { data: cloudMembers, error: mErr } = await client.from('challenge_members').select('*');
    if (!mErr && cloudMembers) {
      const activeChallengeIds = new Set(getLocalChallenges().map((c) => c.id));
      const mappedMembers: ChallengeMember[] = cloudMembers
        .filter((m: any) => activeChallengeIds.has(m.challenge_id))
        .map((m: any) => ({
          id: m.id,
          challengeId: m.challenge_id,
          userId: m.user_id,
          role: m.role || 'member',
          joinedAt: m.joined_at || new Date().toISOString().slice(0, 10),
        }));

      const memberMap = new Map<string, ChallengeMember>();
      mappedMembers.forEach((m) => memberMap.set(m.id, m));
      const currentMembers = getLocalChallengeMembers();
      for (const m of currentMembers) {
        if (activeChallengeIds.has(m.challengeId) && !memberMap.has(m.id)) {
          memberMap.set(m.id, m);
          try {
            await (client.from('challenge_members') as any).upsert({
              id: m.id,
              challenge_id: m.challengeId,
              user_id: m.userId,
              role: m.role,
              joined_at: m.joinedAt,
            });
          } catch (e) {
            console.warn('Sync pending member exception:', e);
          }
        }
      }
      saveLocalChallengeMembers(Array.from(memberMap.values()).filter((m) => activeChallengeIds.has(m.challengeId)));
    }

    // 3. Sincronizar hábitos (challenge_habits)
    const { data: cloudHabits, error: hErr } = await client.from('challenge_habits').select('*');
    if (!hErr && cloudHabits) {
      const activeChallengeIds = new Set(getLocalChallenges().map((c) => c.id));
      const mappedHabits: ChallengeHabit[] = cloudHabits
        .filter((h: any) => activeChallengeIds.has(h.challenge_id))
        .map((h: any) => ({
          id: h.id,
          challengeId: h.challenge_id,
          title: h.title,
          icon: h.icon || '🎯',
          targetValue: h.target_value || 1,
          displayOrder: h.display_order || 1,
          createdAt: h.created_at || new Date().toISOString(),
        }));

      const habitMap = new Map<string, ChallengeHabit>();
      mappedHabits.forEach((h) => habitMap.set(h.id, h));
      const currentHabits = getLocalChallengeHabits();
      for (const h of currentHabits) {
        if (activeChallengeIds.has(h.challengeId) && !habitMap.has(h.id)) {
          habitMap.set(h.id, h);
          try {
            await (client.from('challenge_habits') as any).upsert({
              id: h.id,
              challenge_id: h.challengeId,
              title: h.title,
              icon: h.icon,
              target_value: h.targetValue,
              display_order: h.displayOrder,
              created_at: h.createdAt,
            });
          } catch (e) {
            console.warn('Sync pending habit exception:', e);
          }
        }
      }
      saveLocalChallengeHabits(Array.from(habitMap.values()).filter((h) => activeChallengeIds.has(h.challengeId)));
    }

    // 4. Sincronizar logs / check-ins (challenge_logs)
    const { data: cloudLogs, error: lErr } = await client.from('challenge_logs').select('*');
    if (!lErr && cloudLogs) {
      const activeChallengeIds = new Set(getLocalChallenges().map((c) => c.id));
      const pendingLogIds = new Set(getPendingUploadLogIds());

      const mappedLogs: ChallengeLog[] = cloudLogs
        .filter((l: any) => activeChallengeIds.has(l.challenge_id))
        .map((l: any) => ({
          id: l.id,
          challengeId: l.challenge_id,
          challengeHabitId: l.challenge_habit_id,
          userId: l.user_id,
          dateKey: l.date_key,
          status: l.status || 'completed',
          numericValue: l.numeric_value,
          notes: l.notes,
          createdAt: l.created_at || new Date().toISOString(),
          updatedAt: l.updated_at || new Date().toISOString(),
        }));

      const logMap = new Map<string, ChallengeLog>();
      mappedLogs.forEach((l) => logMap.set(l.id, l));

      // Solo subir logs locales que estén explícitamente en pendingLogIds (creados offline)
      const currentLogs = getLocalChallengeLogs();
      for (const l of currentLogs) {
        if (activeChallengeIds.has(l.challengeId) && pendingLogIds.has(l.id) && !logMap.has(l.id)) {
          logMap.set(l.id, l);
          try {
            const { error: upErr } = await (client.from('challenge_logs') as any).upsert({
              id: l.id,
              challenge_id: l.challengeId,
              challenge_habit_id: l.challengeHabitId,
              user_id: l.userId,
              date_key: l.dateKey,
              status: l.status,
              numeric_value: l.numericValue || null,
              notes: l.notes || null,
              updated_at: l.updatedAt,
            });
            if (!upErr) {
              removePendingUploadLogId(l.id);
            }
          } catch (e) {
            console.warn('Sync pending log exception:', e);
          }
        }
      }
      saveLocalChallengeLogs(Array.from(logMap.values()).filter((l) => activeChallengeIds.has(l.challengeId)));
    }

    // 5. Sincronizar objetivos de reto (challenge_goals)
    const { data: cloudGoals, error: gErr } = await client.from('challenge_goals').select('*');
    if (!gErr && cloudGoals) {
      const activeChallengeIds = new Set(getLocalChallenges().map((c) => c.id));
      const mappedGoals: ChallengeGoal[] = cloudGoals
        .filter((g: any) => activeChallengeIds.has(g.challenge_id))
        .map((g: any) => ({
          id: g.id,
          challengeId: g.challenge_id,
          title: g.title,
          targetValue: g.target_value || 0,
          currentValue: g.current_value || 0,
          unit: g.unit || undefined,
          isCompleted: !!g.is_completed,
          createdAt: g.created_at || new Date().toISOString(),
        }));

      const goalMap = new Map<string, ChallengeGoal>();
      mappedGoals.forEach((g) => goalMap.set(g.id, g));
      const currentGoals = getLocalChallengeGoals();
      for (const g of currentGoals) {
        if (activeChallengeIds.has(g.challengeId) && !goalMap.has(g.id)) {
          goalMap.set(g.id, g);
          try {
            await (client.from('challenge_goals') as any).upsert({
              id: g.id,
              challenge_id: g.challengeId,
              title: g.title,
              target_value: g.targetValue,
              current_value: g.currentValue,
              unit: g.unit || null,
              is_completed: g.isCompleted,
              created_at: g.createdAt,
            });
          } catch (e) {
            console.warn('Sync pending goal exception:', e);
          }
        }
      }
      const finalGoals = Array.from(goalMap.values()).filter((g) => activeChallengeIds.has(g.challengeId));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(finalGoals));
      }
    }

    notifySync('challenges');
    return getLocalChallenges();
  } catch (err) {
    console.warn('Fallo de red en syncCloudChallenges:', err);
    _challengeCloudSyncStatus = {
      isConfigured: true,
      isSynced: false,
      statusText: 'Fallo de red al conectar con Supabase',
      lastSyncTime: new Date().toISOString(),
    };
    return getLocalChallenges();
  }
}

