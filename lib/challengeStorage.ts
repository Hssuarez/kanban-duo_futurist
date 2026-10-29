// ========================================================
// HABIT CORE — PHASE C: CHALLENGES STORAGE & SYNC LAYER
// Local-First + Supabase Sync + Realtime Activity
// ========================================================

import {
  Challenge,
  ChallengeType,
  ChallengeMember,
  ChallengeHabit,
  ChallengeLog,
  ChallengeActivity,
  ChallengeGoal,
  ChallengeMemberStatus,
  EvidenceStatus,
} from './challengeTypes';
import { getOrInitSupabase } from './supabaseClient';
import { notifySync } from './storage';
import { HabitLogStatus } from './habitTypes';
import { getBogotaToday } from './habitCalculations';
import { validateCaloriesInput } from './challengeCalculations';

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
  DELETED_LOG_IDS: 'kanban_duo_deleted_challenge_log_ids_v2',
};

export const LEGACY_DELETED_DEMO_IDS = [
  'ch-lectura-30d',
  'ch-hidrata-21d',
  'ch-sueno-31d',
  'ch-gym-30d',
];

// Limpieza segura de claves transitorias de versiones anteriores
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('kanban_duo_deleted_challenge_log_keys_v1');
    localStorage.removeItem('kanban_duo_challenges');
    localStorage.removeItem('kanban_duo_challenges_v1');
  } catch {}
}

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
// SINCRONIZACIÓN REALTIME, TOMBSTONES Y COLA OFFLINE DE LOGS
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

export function getDeletedChallengeLogIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_LOG_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markChallengeLogAsDeleted(logId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedChallengeLogIds();
    if (!list.includes(logId)) {
      list.push(logId);
      localStorage.setItem(STORAGE_KEYS.DELETED_LOG_IDS, JSON.stringify(list));
    }
    removePendingUploadLogId(logId);
  } catch (e) {
    console.warn('Error guardando deleted challenge log id:', e);
  }
}

export function removeDeletedChallengeLogId(logId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedChallengeLogIds().filter((id) => id !== logId);
    localStorage.setItem(STORAGE_KEYS.DELETED_LOG_IDS, JSON.stringify(list));
  } catch (e) {
    console.warn('Error removiendo deleted challenge log id:', e);
  }
}

export function normalizeCloudNumericValue(rawVal: unknown): number | null | undefined {
  if (rawVal === undefined) return undefined;
  if (rawVal === null) return null;
  const num = Number(rawVal);
  return Number.isFinite(num) ? Math.round(num) : undefined;
}

/**
 * Reconcilia de forma determinística e idempotente un registro local y uno de la nube:
 * - Compara updatedAt para resolver cuál versión de calorías/notas prevalece.
 * - Evita que una actualización independiente de calorías sobrescriba o elimine
 *   campos de evidencia fotográfica válidos existentes en el otro lado.
 */
export function mergeChallengeLogRecords(
  localLog: ChallengeLog,
  cloudLog: ChallengeLog,
  isLocalPending: boolean = false
): { merged: ChallengeLog; needsCloudPush: boolean } {
  const localTime = localLog.updatedAt ? new Date(localLog.updatedAt).getTime() : 0;
  const cloudTime = cloudLog.updatedAt ? new Date(cloudLog.updatedAt).getTime() : 0;

  const localIsNewer = isLocalPending && localTime >= cloudTime ? true : localTime > cloudTime;

  const base = localIsNewer ? { ...localLog } : { ...cloudLog };
  const other = localIsNewer ? cloudLog : localLog;

  // Preservar evidencia fotográfica si la versión ganadora no tenía evidencia adjunta
  // pero la otra versión sí tenía evidencia subida (y la versión ganadora no fue un borrado explícito de evidencia)
  const baseHasEvidence = Boolean(base.evidenceFileId || base.evidenceUrl);
  const otherHasEvidence = Boolean(other.evidenceFileId || other.evidenceUrl);
  const baseExplicitlyClearedEvidence =
    base.evidenceStatus === 'none' &&
    base.evidenceFileId === null &&
    base.evidenceUrl === null &&
    localIsNewer;

  if (!baseHasEvidence && otherHasEvidence && !baseExplicitlyClearedEvidence) {
    base.evidenceUrl = other.evidenceUrl;
    base.evidenceFileId = other.evidenceFileId;
    base.evidenceUploadedAt = other.evidenceUploadedAt;
    base.evidenceUploadedBy = other.evidenceUploadedBy;
    base.evidenceStatus = other.evidenceStatus || 'uploaded';
  }

  // Si la versión ganadora fue una subida de evidencia en el servidor que no incluía numericValue,
  // preservar el numericValue existente del otro lado.
  if (
    (base.numericValue === undefined || base.numericValue === null) &&
    other.numericValue !== undefined &&
    other.numericValue !== null &&
    !localIsNewer
  ) {
    // Si en nube es más reciente por subida de foto pero local tenía pendiente calorías, respetar si no fue puesto a null intencionalmente
    if (isLocalPending) {
      base.numericValue = other.numericValue;
    }
  }

  const needsCloudPush =
    localIsNewer &&
    (localLog.numericValue !== cloudLog.numericValue ||
      localLog.notes !== cloudLog.notes ||
      localLog.status !== cloudLog.status);

  return { merged: base, needsCloudPush };
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
    const hId = oldLog.challenge_habit_id;
    const uId = oldLog.user_id;
    const dKey = oldLog.date_key;

    const updated = currentLogs.filter((l) => {
      if (deletedId && l.id === deletedId) return false;
      if (
        chId &&
        uId &&
        dKey &&
        l.challengeId === chId &&
        (!hId || l.challengeHabitId === hId) &&
        l.userId === uId &&
        l.dateKey === dKey
      ) {
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

    removeDeletedChallengeLogId(raw.id);

    const incomingLog: ChallengeLog = {
      id: raw.id,
      challengeId: raw.challenge_id,
      challengeHabitId: raw.challenge_habit_id,
      userId: raw.user_id,
      dateKey: raw.date_key,
      status: raw.status || 'completed',
      numericValue: normalizeCloudNumericValue(raw.numeric_value),
      notes: raw.notes,
      evidenceUrl: raw.evidence_url || null,
      evidenceFileId: raw.evidence_file_id || null,
      evidenceUploadedAt: raw.evidence_uploaded_at || null,
      evidenceUploadedBy: raw.evidence_uploaded_by || null,
      evidenceStatus: raw.evidence_status || (raw.evidence_file_id ? 'uploaded' : 'none'),
      createdAt: raw.created_at || new Date().toISOString(),
      updatedAt: raw.updated_at || new Date().toISOString(),
    };

    const index = currentLogs.findIndex(
      (l) =>
        l.id === incomingLog.id ||
        (l.challengeId === incomingLog.challengeId &&
          (l.challengeHabitId === incomingLog.challengeHabitId ||
            (!l.challengeHabitId && !incomingLog.challengeHabitId)) &&
          l.userId === incomingLog.userId &&
          l.dateKey === incomingLog.dateKey)
    );

    let updated: ChallengeLog[];
    if (index >= 0) {
      const pendingIds = getPendingUploadLogIds();
      const { merged } = mergeChallengeLogRecords(
        currentLogs[index],
        incomingLog,
        pendingIds.includes(currentLogs[index].id)
      );
      updated = [...currentLogs];
      updated[index] = merged;
    } else {
      updated = [...currentLogs, incomingLog];
    }

    saveLocalChallengeLogs(updated);
  }
}

// ========================================================
// SEMILLAS INICIALES (Vacías por defecto en producción)
// ========================================================

export const DEFAULT_CHALLENGES: Challenge[] = [];
export const DEFAULT_CHALLENGE_MEMBERS: ChallengeMember[] = [];
export const DEFAULT_CHALLENGE_HABITS: ChallengeHabit[] = [];
export const DEFAULT_CHALLENGE_GOALS: ChallengeGoal[] = [];
export const DEFAULT_CHALLENGE_ACTIVITIES: ChallengeActivity[] = [];

export function generateSeedChallengeLogs(): ChallengeLog[] {
  return [];
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
        localStorage.removeItem('kanban_duo_challenges');
        localStorage.removeItem('kanban_duo_challenges_v1');
      } catch (e) {
        console.warn('Error migrando retos legacy:', e);
      }
    }

    // Si no hay datos iniciales en localStorage, retornar vacío para permitir que syncCloudChallenges cargue la nube
    if (!raw && challenges.length === 0) {
      return [];
    }

    // Filtrar siempre y permanentemente cualquier reto eliminado o demo legacy
    challenges = challenges.filter(
      (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
    );

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
    // Asegurar que ningún reto en la lista esté en deletedIds o demo legacy
    const filtered = challenges.filter(
      (c) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
    );
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

  const nowIso = new Date().toISOString();
  const current = getLocalChallenges();
  const index = current.findIndex((c) => c.id === challenge.id);

  const normalizedChallenge: Challenge = {
    ...challenge,
    challengeType:
      challenge.challengeType === 'physical' || challenge.challengeType === 'general'
        ? challenge.challengeType
        : index >= 0
        ? current[index].challengeType
        : undefined,
    updatedAt: nowIso,
  };

  let updatedList: Challenge[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = normalizedChallenge;
  } else {
    updatedList = [
      ...current,
      { ...normalizedChallenge, createdAt: challenge.createdAt || nowIso },
    ];
  }

  saveLocalChallenges(updatedList);

  // Cloud Sync Supabase
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const payload: Record<string, any> = {
        id: normalizedChallenge.id,
        created_by: normalizedChallenge.createdBy,
        title: normalizedChallenge.title,
        description: normalizedChallenge.description || null,
        icon: normalizedChallenge.icon || '🏆',
        color: normalizedChallenge.color || '#06b6d4',
        start_date: normalizedChallenge.startDate,
        end_date: normalizedChallenge.endDate,
        duration_days: normalizedChallenge.durationDays,
        mode: normalizedChallenge.mode,
        status: normalizedChallenge.status,
        target_goal: normalizedChallenge.targetGoal || null,
        updated_at: nowIso,
      };

      if (normalizedChallenge.challengeType) {
        payload.challenge_type = normalizedChallenge.challengeType;
      }

      let { error } = await (client.from('challenges') as any).upsert(payload);

      // Fallback compatible si la columna aditiva challenge_type aún no se ha ejecutado en Supabase
      if (
        error &&
        payload.challenge_type !== undefined &&
        (error.code === '42703' ||
          error.code === 'PGRST204' ||
          String(error.message || '').includes('challenge_type'))
      ) {
        delete payload.challenge_type;
        const retry = await (client.from('challenges') as any).upsert(payload);
        error = retry.error;
      }

      if (error) {
        console.error('❌ Error al sincronizar reto con Supabase:', error);
        markChallengeAsPendingUpload(normalizedChallenge.id);
        _challengeCloudSyncStatus = {
          isConfigured: true,
          isSynced: false,
          statusText: 'Error al sincronizar reto con Supabase',
          errorMessage: error.message,
          errorCode: error.code,
          lastSyncTime: nowIso,
        };
      } else {
        console.log('✅ Reto sincronizado exitosamente con Supabase:', normalizedChallenge.title);
        removePendingUploadChallengeId(normalizedChallenge.id);
        _challengeCloudSyncStatus = {
          isConfigured: true,
          isSynced: true,
          statusText: 'Sincronizado con Supabase',
          lastSyncTime: nowIso,
        };
      }
    } catch (e: any) {
      console.warn('Sync saveChallenge Supabase exception:', e);
      markChallengeAsPendingUpload(normalizedChallenge.id);
      _challengeCloudSyncStatus = {
        isConfigured: true,
        isSynced: false,
        statusText: 'Excepción al conectar con Supabase',
        errorMessage: e?.message,
        lastSyncTime: nowIso,
      };
    }
  } else {
    markChallengeAsPendingUpload(normalizedChallenge.id);
  }

  return normalizedChallenge;
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

    // Filtrar permanentemente miembros de retos eliminados o demo legacy
    members = members.filter((m) => !LEGACY_DELETED_DEMO_IDS.includes(m.challengeId));

    // Auto-migración para todos los retos: si un miembro tiene joinedAt > challenge.startDate,
    // normalizar a startDate para no bloquear check-ins previos
    const allChallenges = getLocalChallenges();
    let migrated = false;
    members = members.map((m) => {
      const ch = allChallenges.find((c) => c.id === m.challengeId);
      if (ch && m.joinedAt && m.joinedAt > ch.startDate) {
        migrated = true;
        return { ...m, joinedAt: ch.startDate };
      }
      return m;
    });

    // Auto-migración y resolución rigurosa de estados de invitación en retos de usuarios:
    // - Creador/Owner: siempre 'accepted'
    // - Invitados (role === 'member'):
    //   - Si ya tiene acceptedAt: 'accepted'
    //   - Si ya tiene status 'declined': 'declined'
    //   - Si ya tiene logs completados en challenge_logs: mantener 'accepted'
    //   - Si NO tiene logs ni acceptedAt: debe ser 'pending' para requerir confirmación explícita
    const rawLogs = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LOGS) : null;
    const allLogs: any[] = rawLogs ? JSON.parse(rawLogs) : [];

    members = members.map((m) => {
      const ch = allChallenges.find((c) => c.id === m.challengeId);
      const isCreator = ch?.createdBy === m.userId || m.role === 'owner';

      if (isCreator) {
        if (m.status !== 'accepted') {
          migrated = true;
          return { ...m, status: 'accepted' as ChallengeMemberStatus };
        }
        return m;
      }

      // Si es un miembro invitado a un reto personalizado
      if (m.status === 'declined') {
        return m;
      }

      if (m.status === 'accepted') {
        return m;
      }

      if (m.acceptedAt) {
        migrated = true;
        return { ...m, status: 'accepted' as ChallengeMemberStatus };
      }

      const hasCompletedLogs = allLogs.some(
        (l) => l.challengeId === m.challengeId && l.userId === m.userId && l.status === 'completed'
      );

      if (hasCompletedLogs) {
        migrated = true;
        return { ...m, status: 'accepted' as ChallengeMemberStatus };
      }

      return m;
    });

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
  joinedAt?: string,
  status: ChallengeMemberStatus = role === 'owner' ? 'accepted' : 'pending'
): Promise<ChallengeMember> {
  const current = getLocalChallengeMembers();
  const exists = current.find((m) => m.challengeId === challengeId && m.userId === userId);
  if (exists) {
    if (status !== exists.status && exists.status === 'pending') {
      exists.status = status;
      saveLocalChallengeMembers(current);
    }
    return exists;
  }

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
    status,
    joinedAt: effectiveJoinedAt,
  };

  const updated = [...current, newMember];
  saveLocalChallengeMembers(updated);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      const payload: any = {
        id: newMember.id,
        challenge_id: challengeId,
        user_id: userId,
        role: newMember.role,
        joined_at: newMember.joinedAt,
      };
      const { error } = await client.from('challenge_members').upsert({
        ...payload,
        status: newMember.status,
      });
      if (error) {
        await client.from('challenge_members').upsert(payload);
      }
    } catch (e) {
      console.warn('Sync addChallengeMember Supabase:', e);
    }
  }

  // Notificación de invitación si queda en estado pendiente
  if (status === 'pending') {
    try {
      const { addNotification } = await import('./notifications');
      const challenge = getLocalChallenges().find((c) => c.id === challengeId);
      const allUsers = (await import('./storage')).getUsers();
      const creator = allUsers.find((u) => u.id === challenge?.createdBy);

      addNotification({
        type: 'challenge_invitation',
        title: 'Invitación a Reto',
        message: `${creator?.name || 'Un compañero'} te ha invitado a participar en el reto "${challenge?.title || 'Reto'}"`,
        userId,
        projectId: 'habits',
        challengeId,
        invitationStatus: 'pending',
        actorName: creator?.name,
        actorAvatar: creator?.avatar,
      });
    } catch (e) {
      console.warn('Error enviando notificación de reto:', e);
    }
  }

  return newMember;
}

export async function acceptChallengeInvitation(challengeId: string, userId: string): Promise<boolean> {
  const members = getLocalChallengeMembers();
  let index = members.findIndex((m) => m.challengeId === challengeId && m.userId === userId);

  const today = getBogotaToday();
  const acceptedAt = new Date().toISOString();

  let updatedMember: ChallengeMember;

  if (index === -1) {
    updatedMember = {
      id: `cm-${challengeId}-${userId}`,
      challengeId,
      userId,
      role: 'member',
      status: 'accepted',
      joinedAt: today,
      acceptedAt,
    };
    members.push(updatedMember);
  } else {
    updatedMember = {
      ...members[index],
      status: 'accepted',
      joinedAt: members[index].joinedAt || today,
      acceptedAt,
    };
    members[index] = updatedMember;
  }

  saveLocalChallengeMembers(members);

  // 1. Sincronizar en Supabase mediante match por challenge_id y user_id
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { data: updData, error: updErr } = await client
        .from('challenge_members')
        .update({
          status: 'accepted',
          accepted_at: acceptedAt,
        })
        .match({ challenge_id: challengeId, user_id: userId })
        .select();

      if (updErr || !updData || updData.length === 0) {
        await client.from('challenge_members').upsert(
          {
            id: updatedMember.id,
            challenge_id: challengeId,
            user_id: userId,
            role: updatedMember.role || 'member',
            status: 'accepted',
            joined_at: updatedMember.joinedAt,
            accepted_at: acceptedAt,
          },
          { onConflict: 'challenge_id,user_id' }
        );
      }
    } catch (e) {
      console.warn('Sync acceptChallengeInvitation Supabase:', e);
    }
  }

  // 2. Respaldo por API Server (service_role) para garantizar persistencia
  try {
    fetch('/api/challenges/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, userId, acceptedAt }),
    }).catch(() => {});
  } catch (e) {
    // Silencioso
  }

  // Actualizar notificaciones asociadas para marcarlas como aceptadas y leídas
  try {
    const { updateNotificationInvitationStatus } = await import('./notifications');
    updateNotificationInvitationStatus(challengeId, userId, 'accepted');
  } catch (e) {
    console.warn('Error actualizando estado de notificación en aceptación:', e);
  }

  try {
    const allUsers = (await import('./storage')).getUsers();
    const user = allUsers.find((u) => u.id === userId);
    addChallengeActivity(
      challengeId,
      userId,
      `${user?.name || 'Un nuevo miembro'} aceptó el reto y comenzó a participar`,
      'joined'
    );

    const ch = getLocalChallenges().find((c) => c.id === challengeId);
    if (ch && ch.createdBy && ch.createdBy !== userId) {
      const { addNotification } = await import('./notifications');
      addNotification({
        type: 'challenge_invitation_accepted',
        title: 'Reto Aceptado',
        message: `${user?.name || 'Un compañero'} aceptó la invitación al reto "${ch.title}"`,
        userId: ch.createdBy,
        projectId: 'habits',
        challengeId,
        actorName: user?.name,
        actorAvatar: user?.avatar,
      });
    }
  } catch (e) {
    console.warn('Error registrando actividad de aceptación de reto:', e);
  }

  notifySync('challenges');
  notifySync('notifications');
  return true;
}

export async function declineChallengeInvitation(challengeId: string, userId: string): Promise<boolean> {
  const members = getLocalChallengeMembers();
  const target = members.find((m) => m.challengeId === challengeId && m.userId === userId);
  if (!target) return false;

  const filtered = members.filter((m) => !(m.challengeId === challengeId && m.userId === userId));
  saveLocalChallengeMembers(filtered);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client
        .from('challenge_members')
        .delete()
        .match({ challenge_id: challengeId, user_id: userId });
    } catch (e) {
      console.warn('Sync declineChallengeInvitation Supabase:', e);
    }
  }

  // Actualizar notificaciones asociadas para marcarlas como declinadas y leídas
  try {
    const { updateNotificationInvitationStatus } = await import('./notifications');
    updateNotificationInvitationStatus(challengeId, userId, 'declined');
  } catch (e) {
    console.warn('Error actualizando estado de notificación en declinación:', e);
  }

  try {
    const allUsers = (await import('./storage')).getUsers();
    const user = allUsers.find((u) => u.id === userId);
    const ch = getLocalChallenges().find((c) => c.id === challengeId);
    if (ch && ch.createdBy && ch.createdBy !== userId) {
      const { addNotification } = await import('./notifications');
      addNotification({
        type: 'challenge_invitation_declined',
        title: 'Invitación a Reto Declinada',
        message: `${user?.name || 'Un compañero'} declinó participar en el reto "${ch.title}"`,
        userId: ch.createdBy,
        projectId: 'habits',
        challengeId,
        actorName: user?.name,
        actorAvatar: user?.avatar,
      });
    }
  } catch {}

  return true;
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

    habits = habits.filter((h) => !LEGACY_DELETED_DEMO_IDS.includes(h.challengeId));

    if (challengeId) {
      return habits.filter((h) => h.challengeId === challengeId);
    }
    return habits;
  } catch {
    return [];
  }
}

export function saveLocalChallengeHabits(habits: ChallengeHabit[]): void {
  if (typeof window === 'undefined') return;
  try {
    const filtered = habits.filter((h) => !LEGACY_DELETED_DEMO_IDS.includes(h.challengeId));
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(filtered));
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

    logs = logs.filter((l) => !LEGACY_DELETED_DEMO_IDS.includes(l.challengeId));

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
    const deletedLogIds = new Set(getDeletedChallengeLogIds());
    // Deduplicación estricta por (challengeId, challengeHabitId, userId, dateKey)
    const uniqueMap = new Map<string, ChallengeLog>();
    logs.forEach((l) => {
      if (LEGACY_DELETED_DEMO_IDS.includes(l.challengeId)) return;
      if (deletedLogIds.has(l.id)) return;
      const dedupeKey = `${l.challengeId}_${l.challengeHabitId || 'h'}_${l.userId}_${l.dateKey}`;
      const existing = uniqueMap.get(dedupeKey);
      if (!existing) {
        uniqueMap.set(dedupeKey, l);
      } else {
        const { merged } = mergeChallengeLogRecords(existing, l, false);
        uniqueMap.set(dedupeKey, merged);
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
  const canonicalId = `clog-${challengeId}-${challengeHabitId}-${userId}-${dateKey}`;

  // Búsqueda específica por reto, hábito concreto, usuario y fecha
  const matchingLogs = currentLogs.filter(
    (l) =>
      l.challengeId === challengeId &&
      (l.challengeHabitId === challengeHabitId || (!l.challengeHabitId && !challengeHabitId)) &&
      l.userId === userId &&
      l.dateKey === dateKey
  );
  const isCurrentlyCompleted = matchingLogs.some((l) => l.status === 'completed') || matchingLogs.length > 0;

  let resultingLog: ChallengeLog | null = null;
  let newStatus: HabitLogStatus | 'removed';

  if (isCurrentlyCompleted) {
    // ACCIÓN: DESMARCAR (Eliminación definitiva de este hábito específico y sus calorías asociadas)
    newStatus = 'removed';
    const removedIds = Array.from(new Set([...matchingLogs.map((l) => l.id), canonicalId]));

    // Registrar tombstones para impedir resurrecciones durante sincronizaciones en vuelo
    removedIds.forEach((id) => {
      markChallengeLogAsDeleted(id);
      removePendingUploadLogId(id);
    });

    // 1. Filtrar localmente de inmediato conservando los demás hábitos del mismo día
    const remainingLogs = currentLogs.filter(
      (l) =>
        !(
          l.challengeId === challengeId &&
          (l.challengeHabitId === challengeHabitId || (!l.challengeHabitId && !challengeHabitId)) &&
          l.userId === userId &&
          l.dateKey === dateKey
        )
    );
    saveLocalChallengeLogs(remainingLogs);

    // 3. Purgar de Supabase solo este hábito específico
    const client = await getOrInitSupabase();
    if (client) {
      try {
        if (removedIds.length > 0) {
          await client.from('challenge_logs').delete().in('id', removedIds);
        }
        const { error: delErr } = await client
          .from('challenge_logs')
          .delete()
          .eq('challenge_id', challengeId)
          .eq('challenge_habit_id', challengeHabitId)
          .eq('user_id', userId)
          .eq('date_key', dateKey);

        if (!delErr) {
          removedIds.forEach((id) => removeDeletedChallengeLogId(id));
        }
      } catch (e) {
        console.warn('Sync toggleChallengeLog delete Supabase error:', e);
      }
    }
  } else {
    // ACCIÓN: MARCAR (Nuevo check-in)
    newStatus = 'completed';
    removeDeletedChallengeLogId(canonicalId);

    resultingLog = {
      id: canonicalId,
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

/**
 * Actualiza de forma atómica y local el estado de la evidencia en un log de reto,
 * preservando las calorías (numericValue) salvo que se especifique explícitamente.
 */
export function updateLocalChallengeLogEvidence(
  challengeId: string,
  challengeHabitId: string,
  userId: string,
  dateKey: string,
  evidence: {
    evidenceUrl?: string | null;
    evidenceFileId?: string | null;
    evidenceUploadedAt?: string | null;
    evidenceUploadedBy?: string | null;
    evidenceStatus: EvidenceStatus;
    numericValue?: number | null;
  }
): ChallengeLog | null {
  const canonicalId = `clog-${challengeId}-${challengeHabitId}-${userId}-${dateKey}`;
  removeDeletedChallengeLogId(canonicalId);

  const currentLogs = getLocalChallengeLogs();
  const logIndex = currentLogs.findIndex(
    (l) =>
      l.challengeId === challengeId &&
      l.userId === userId &&
      l.dateKey === dateKey &&
      (!challengeHabitId || l.challengeHabitId === challengeHabitId)
  );

  let updatedLog: ChallengeLog;

  if (logIndex >= 0) {
    const existing = currentLogs[logIndex];
    updatedLog = {
      ...existing,
      evidenceUrl: evidence.evidenceUrl !== undefined ? evidence.evidenceUrl : existing.evidenceUrl,
      evidenceFileId: evidence.evidenceFileId !== undefined ? evidence.evidenceFileId : existing.evidenceFileId,
      evidenceUploadedAt:
        evidence.evidenceUploadedAt !== undefined ? evidence.evidenceUploadedAt : existing.evidenceUploadedAt,
      evidenceUploadedBy:
        evidence.evidenceUploadedBy !== undefined ? evidence.evidenceUploadedBy : existing.evidenceUploadedBy,
      evidenceStatus: evidence.evidenceStatus,
      numericValue: evidence.numericValue !== undefined ? evidence.numericValue : existing.numericValue,
      updatedAt: new Date().toISOString(),
    };
    currentLogs[logIndex] = updatedLog;
  } else {
    // Si no existía el log pero se subió evidencia, crearlo como completado
    updatedLog = {
      id: canonicalId,
      challengeId,
      challengeHabitId,
      userId,
      dateKey,
      status: 'completed',
      numericValue: evidence.numericValue !== undefined ? evidence.numericValue : undefined,
      evidenceUrl: evidence.evidenceUrl || null,
      evidenceFileId: evidence.evidenceFileId || null,
      evidenceUploadedAt: evidence.evidenceUploadedAt || new Date().toISOString(),
      evidenceUploadedBy: evidence.evidenceUploadedBy || userId,
      evidenceStatus: evidence.evidenceStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentLogs.push(updatedLog);
  }

  saveLocalChallengeLogs(currentLogs);
  return updatedLog;
}

/**
 * Registra, edita o pone en cero las calorías (numericValue) de un día/hábito/participante
 * de forma determinística e idempotente, sin sobrescribir la evidencia fotográfica existente.
 */
export async function updateChallengeLogCalories(
  challengeId: string,
  challengeHabitId: string,
  userId: string,
  dateKey: string,
  rawCalories: unknown,
  requestingUserId?: string
): Promise<{ ok: boolean; log: ChallengeLog | null; error?: string }> {
  // Protección de autoría: solo el propietario del registro puede modificar sus calorías
  if (requestingUserId && requestingUserId !== userId) {
    return {
      ok: false,
      log: null,
      error: 'No tienes permisos para modificar las calorías de otro participante.',
    };
  }

  if (dateKey > getBogotaToday()) {
    return {
      ok: false,
      log: null,
      error: 'No se permite registrar calorías en fechas futuras.',
    };
  }

  const validation = validateCaloriesInput(rawCalories);
  if (!validation.valid) {
    return {
      ok: false,
      log: null,
      error: validation.error,
    };
  }

  const canonicalId = `clog-${challengeId}-${challengeHabitId}-${userId}-${dateKey}`;
  removeDeletedChallengeLogId(canonicalId);

  const currentLogs = getLocalChallengeLogs();
  const logIndex = currentLogs.findIndex(
    (l) =>
      l.challengeId === challengeId &&
      l.userId === userId &&
      l.dateKey === dateKey &&
      (l.challengeHabitId === challengeHabitId || (!l.challengeHabitId && !challengeHabitId))
  );

  const nowIso = new Date().toISOString();
  let updatedLog: ChallengeLog;

  if (logIndex >= 0) {
    const existing = currentLogs[logIndex];
    updatedLog = {
      ...existing,
      status: 'completed',
      numericValue: validation.value,
      updatedAt: nowIso,
    };
    currentLogs[logIndex] = updatedLog;
  } else {
    updatedLog = {
      id: canonicalId,
      challengeId,
      challengeHabitId,
      userId,
      dateKey,
      status: 'completed',
      numericValue: validation.value,
      evidenceStatus: 'none',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    currentLogs.push(updatedLog);
  }

  markLogAsPendingUpload(updatedLog.id);
  saveLocalChallengeLogs(currentLogs);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      // 1. Intentar actualización selectiva de numeric_value para no pisar cambios concurrentes de evidencia
      const { data: updatedRows, error: updErr } = await (client.from('challenge_logs') as any)
        .update({
          numeric_value: validation.value,
          status: 'completed',
          updated_at: nowIso,
        })
        .eq('id', updatedLog.id)
        .eq('user_id', userId)
        .select('id');

      if (!updErr && Array.isArray(updatedRows) && updatedRows.length > 0) {
        removePendingUploadLogId(updatedLog.id);
      } else {
        // 2. Si el registro aún no existía en Supabase, hacer upsert completo incluyendo evidencia local si la hubiera
        const { error: upErr } = await (client.from('challenge_logs') as any).upsert({
          id: updatedLog.id,
          challenge_id: updatedLog.challengeId,
          challenge_habit_id: updatedLog.challengeHabitId,
          user_id: updatedLog.userId,
          date_key: updatedLog.dateKey,
          status: updatedLog.status,
          numeric_value: validation.value,
          notes: updatedLog.notes || null,
          evidence_url: updatedLog.evidenceUrl || null,
          evidence_file_id: updatedLog.evidenceFileId || null,
          evidence_uploaded_at: updatedLog.evidenceUploadedAt || null,
          evidence_uploaded_by: updatedLog.evidenceUploadedBy || null,
          evidence_status: updatedLog.evidenceStatus || 'none',
          created_at: updatedLog.createdAt || nowIso,
          updated_at: nowIso,
        });
        if (!upErr) {
          removePendingUploadLogId(updatedLog.id);
        } else {
          console.warn('Sync updateChallengeLogCalories upsert error:', upErr);
        }
      }
    } catch (e) {
      console.warn('Sync updateChallengeLogCalories exception:', e);
    }
  }

  return { ok: true, log: updatedLog };
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
      const currentLocal = getLocalChallenges();
      const localChallengeById = new Map<string, Challenge>(currentLocal.map((lc) => [lc.id, lc]));

      // 1.2. Mapear los retos válidos que existen en Supabase
      const validCloud = cloudChallenges.filter(
        (c: any) => !deletedIds.includes(c.id) && !LEGACY_DELETED_DEMO_IDS.includes(c.id)
      );

      const mappedCloud: Challenge[] = validCloud.map((c: any) => {
        const localMatch = localChallengeById.get(c.id);
        const cloudType: ChallengeType | undefined =
          c.challenge_type === 'physical' || c.challenge_type === 'general' ? c.challenge_type : undefined;

        return {
          id: c.id,
          createdBy: c.created_by,
          title: c.title,
          description: c.description || '',
          icon: c.icon || '🏆',
          color: c.color || '#06b6d4',
          challengeType: cloudType ?? localMatch?.challengeType,
          startDate: c.start_date,
          endDate: c.end_date,
          durationDays: c.duration_days || 30,
          mode: c.mode || 'competitive',
          status: c.status || 'active',
          targetGoal: c.target_goal || undefined,
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.updated_at || new Date().toISOString(),
        };
      });

      const mergedMap = new Map<string, Challenge>();
      mappedCloud.forEach((c) => mergedMap.set(c.id, c));

      // 1.3. Subir ÚNICAMENTE retos locales que estén explícitamente marcados como pendientes de subida
      for (const c of currentLocal) {
        if (deletedIds.includes(c.id) || LEGACY_DELETED_DEMO_IDS.includes(c.id)) {
          continue;
        }

        const isPending = pendingUploadIds.includes(c.id);

        // NUNCA resucitar retos ausentes en la nube que no estén pendientes de subida
        if (isPending) {
          mergedMap.set(c.id, c);
          try {
            const payload: Record<string, any> = {
              id: c.id,
              created_by: c.createdBy,
              title: c.title,
              description: c.description || null,
              icon: c.icon,
              color: c.color,
              challenge_type: c.challengeType || null,
              start_date: c.startDate,
              end_date: c.endDate,
              duration_days: c.durationDays,
              mode: c.mode,
              status: c.status,
              target_goal: c.targetGoal || null,
              updated_at: c.updatedAt,
            };
            let { error: upErr } = await (client.from('challenges') as any).upsert(payload);
            if (upErr && (upErr.code === '42703' || String(upErr.message || '').includes('challenge_type'))) {
              const fallbackPayload = { ...payload };
              delete fallbackPayload.challenge_type;
              const retryRes = await (client.from('challenges') as any).upsert(fallbackPayload);
              upErr = retryRes.error;
            }
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
      const allLocalChallenges = getLocalChallenges();
      const activeChallengeIds = new Set(allLocalChallenges.map((c) => c.id));
      const localChallengesMap = new Map(allLocalChallenges.map((c) => [c.id, c]));
      const localMembers = getLocalChallengeMembers();
      const localMap = new Map(localMembers.map((lm) => [lm.id, lm]));

      const rawLogs = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LOGS) : null;
      const allLogs: any[] = rawLogs ? JSON.parse(rawLogs) : [];

      const mappedMembers: ChallengeMember[] = cloudMembers
        .filter((m: any) => activeChallengeIds.has(m.challenge_id))
        .map((m: any) => {
          const local = localMap.get(m.id);
          const ch = localChallengesMap.get(m.challenge_id);
          const isCreator = ch?.createdBy === m.user_id || m.role === 'owner';
          const hasCompletedLogs = allLogs.some(
            (l) => l.challengeId === m.challenge_id && l.userId === m.user_id && l.status === 'completed'
          );

          let resolvedStatus: ChallengeMemberStatus;
          if (isCreator) {
            resolvedStatus = 'accepted';
          } else if (m.status === 'accepted' || local?.status === 'accepted' || hasCompletedLogs) {
            resolvedStatus = 'accepted';
          } else if (m.status === 'declined' || local?.status === 'declined') {
            resolvedStatus = 'declined';
          } else {
            resolvedStatus = 'pending';
          }

          // Auto-curación en Supabase si el estado local o calculado es accepted pero la nube tenía pending
          if (resolvedStatus === 'accepted' && m.status !== 'accepted') {
            client
              .from('challenge_members')
              .update({ status: 'accepted', accepted_at: m.accepted_at || new Date().toISOString() })
              .eq('id', m.id)
              .then(() => {});
          }

          return {
            id: m.id,
            challengeId: m.challenge_id,
            userId: m.user_id,
            role: isCreator ? 'owner' : (m.role || 'member'),
            status: resolvedStatus,
            joinedAt: m.joined_at || new Date().toISOString().slice(0, 10),
            acceptedAt: m.accepted_at || local?.acceptedAt || (resolvedStatus === 'accepted' ? new Date().toISOString() : undefined),
          };
        });

      // Siempre fusionar miembros de la nube con los miembros locales pendientes
      const memberMap = new Map<string, ChallengeMember>();
      mappedMembers.forEach((m) => memberMap.set(m.id, m));
      const currentMembers = getLocalChallengeMembers();
      for (const m of currentMembers) {
        if (activeChallengeIds.has(m.challengeId) && !memberMap.has(m.id)) {
          memberMap.set(m.id, m);
          try {
            const payload: any = {
              id: m.id,
              challenge_id: m.challengeId,
              user_id: m.userId,
              role: m.role,
              joined_at: m.joinedAt,
              status: m.status || (m.role === 'owner' ? 'accepted' : 'pending'),
            };
            const { error } = await (client.from('challenge_members') as any).upsert(payload);
            if (error) {
              delete payload.status;
              await (client.from('challenge_members') as any).upsert(payload);
            }
          } catch (e) {
            console.warn('Sync pending member exception:', e);
          }
        }
      }
      saveLocalChallengeMembers(Array.from(memberMap.values()).filter((m) => activeChallengeIds.has(m.challengeId)));

      // Sintetizar notificación para invitaciones pendientes en este cliente (para que la campana y HUD se enteren)
      try {
        const { getNotifications, addNotification } = await import('./notifications');
        const notifs = getNotifications();
        const allUsers = (await import('./storage')).getUsers();

        for (const pm of mappedMembers) {
          if (pm.status === 'pending') {
            const exists = notifs.some(
              (n) => n.type === 'challenge_invitation' && n.challengeId === pm.challengeId && n.userId === pm.userId
            );
            if (!exists) {
              const ch = localChallengesMap.get(pm.challengeId);
              const creator = allUsers.find((u) => u.id === ch?.createdBy);
              addNotification({
                type: 'challenge_invitation',
                title: 'Invitación a Reto',
                message: `${creator?.name || 'Un compañero'} te ha invitado a participar en el reto "${ch?.title || 'Reto'}"`,
                userId: pm.userId,
                projectId: 'habits',
                challengeId: pm.challengeId,
                invitationStatus: 'pending',
                actorName: creator?.name,
                actorAvatar: creator?.avatar,
              });
            }
          }
        }
      } catch (e) {
        // non-blocking
      }
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
      const deletedLogIds = new Set(getDeletedChallengeLogIds());

      // Si hay logs marcados como eliminados localmente que aún están en la nube, purgarlos de Supabase
      const zombieCloudIds = cloudLogs
        .filter((l: any) => deletedLogIds.has(l.id))
        .map((l: any) => l.id as string);

      if (zombieCloudIds.length > 0) {
        try {
          const { error: purgeErr } = await client.from('challenge_logs').delete().in('id', zombieCloudIds);
          if (!purgeErr) {
            zombieCloudIds.forEach((id) => removeDeletedChallengeLogId(id));
          }
        } catch (e) {
          console.warn('Sync purge deleted logs error:', e);
        }
      }

      const mappedLogs: ChallengeLog[] = cloudLogs
        .filter((l: any) => activeChallengeIds.has(l.challenge_id) && !deletedLogIds.has(l.id))
        .map((l: any) => ({
          id: l.id,
          challengeId: l.challenge_id,
          challengeHabitId: l.challenge_habit_id,
          userId: l.user_id,
          dateKey: l.date_key,
          status: l.status || 'completed',
          numericValue: normalizeCloudNumericValue(l.numeric_value),
          notes: l.notes,
          evidenceUrl: l.evidence_url || null,
          evidenceFileId: l.evidence_file_id || null,
          evidenceUploadedAt: l.evidence_uploaded_at || null,
          evidenceUploadedBy: l.evidence_uploaded_by || null,
          evidenceStatus: l.evidence_status || (l.evidence_file_id ? 'uploaded' : 'none'),
          createdAt: l.created_at || new Date().toISOString(),
          updatedAt: l.updated_at || new Date().toISOString(),
        }));

      const logMap = new Map<string, ChallengeLog>();
      mappedLogs.forEach((l) => logMap.set(l.id, l));

      // Reconciliar logs locales pendientes o más recientes sin pisar evidencia/calorías independientes
      const currentLogs = getLocalChallengeLogs();
      for (const l of currentLogs) {
        if (!activeChallengeIds.has(l.challengeId) || deletedLogIds.has(l.id)) continue;

        const isPending = pendingLogIds.has(l.id);
        const cloudExisting = logMap.get(l.id);

        if (!cloudExisting && isPending) {
          logMap.set(l.id, l);
          try {
            const { error: upErr } = await (client.from('challenge_logs') as any).upsert({
              id: l.id,
              challenge_id: l.challengeId,
              challenge_habit_id: l.challengeHabitId,
              user_id: l.userId,
              date_key: l.dateKey,
              status: l.status,
              numeric_value: l.numericValue !== undefined ? l.numericValue : null,
              notes: l.notes || null,
              evidence_url: l.evidenceUrl || null,
              evidence_file_id: l.evidenceFileId || null,
              evidence_uploaded_at: l.evidenceUploadedAt || null,
              evidence_uploaded_by: l.evidenceUploadedBy || null,
              evidence_status: l.evidenceStatus || 'none',
              updated_at: l.updatedAt,
            });
            if (!upErr) {
              removePendingUploadLogId(l.id);
            }
          } catch (e) {
            console.warn('Sync pending log exception:', e);
          }
        } else if (cloudExisting) {
          const { merged, needsCloudPush } = mergeChallengeLogRecords(l, cloudExisting, isPending);
          logMap.set(l.id, merged);
          if (needsCloudPush) {
            try {
              const { error: upErr } = await (client.from('challenge_logs') as any).upsert({
                id: merged.id,
                challenge_id: merged.challengeId,
                challenge_habit_id: merged.challengeHabitId,
                user_id: merged.userId,
                date_key: merged.dateKey,
                status: merged.status,
                numeric_value: merged.numericValue !== undefined ? merged.numericValue : null,
                notes: merged.notes || null,
                evidence_url: merged.evidenceUrl || null,
                evidence_file_id: merged.evidenceFileId || null,
                evidence_uploaded_at: merged.evidenceUploadedAt || null,
                evidence_uploaded_by: merged.evidenceUploadedBy || null,
                evidence_status: merged.evidenceStatus || 'none',
                updated_at: merged.updatedAt,
              });
              if (!upErr) {
                removePendingUploadLogId(merged.id);
              }
            } catch (e) {
              console.warn('Sync merged log push exception:', e);
            }
          } else if (isPending) {
            removePendingUploadLogId(l.id);
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

