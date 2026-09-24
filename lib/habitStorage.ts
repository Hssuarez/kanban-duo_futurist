// ========================================================
// HABIT CORE - STORAGE & CLOUD SYNC
// Local-First + Supabase Sync + Multi-Tab Reactivity
// ========================================================

import { Habit, HabitLog, Goal, HabitNote, HabitLogStatus } from './habitTypes';
import { getOrInitSupabase } from './supabaseClient';
import { notifySync } from './storage';

export const HABIT_STORAGE_KEYS = {
  HABITS: 'kanban_duo_habits_v1',
  LOGS: 'kanban_duo_habit_logs_v1',
  CHALLENGES: 'kanban_duo_challenges_v1',
  CHALLENGE_MEMBERS: 'kanban_duo_challenge_members_v1',
  GOALS: 'kanban_duo_goals_v1',
  NOTES: 'kanban_duo_habit_notes_v1',
  INITIALIZED: 'kanban_duo_habits_initialized_v1',
  BACKUPS: 'kanban_duo_habits_backups_v1',
};

// Hábitos iniciales por defecto inspirados en el diseño HUD
export const DEFAULT_INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    userId: 'user-admin',
    title: 'Ir al Gym',
    description: 'Entrenamiento de fuerza y acondicionamiento',
    icon: '🏋️',
    color: '#06b6d4',
    category: 'salud',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 1,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-3',
    userId: 'user-admin',
    title: 'Tomar agua',
    description: 'Mínimo 8 vasos de agua al día',
    icon: '💧',
    color: '#38bdf8',
    category: 'salud',
    targetType: 'count',
    targetValue: 8,
    targetUnit: 'vasos',
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 2,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-4',
    userId: 'user-admin',
    title: 'Correr 5 km',
    description: 'Cardio matutino al aire libre',
    icon: '🏃',
    color: '#f97316',
    category: 'salud',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 3,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-5',
    userId: 'user-admin',
    title: 'Agradecer a Dios',
    description: 'Oración y gratitud al iniciar el día',
    icon: '🙏',
    color: '#eab308',
    category: 'mente',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 4,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-6',
    userId: 'user-admin',
    title: 'Levantarme 6 AM',
    description: 'Despertar a primera hora sin posponer alarma',
    icon: '⏰',
    color: '#a855f7',
    category: 'productividad',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'weekdays',
    isActive: true,
    isArchived: false,
    displayOrder: 5,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-7',
    userId: 'user-admin',
    title: 'Leer 10 Páginas',
    description: 'Lectura de libros formativos o técnicos',
    icon: '📖',
    color: '#10b981',
    category: 'mente',
    targetType: 'count',
    targetValue: 10,
    targetUnit: 'págs',
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 6,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-8',
    userId: 'user-admin',
    title: 'Dormir 8:30 PM',
    description: 'Descanso reparador y desconexión digital',
    icon: '😴',
    color: '#64748b',
    category: 'salud',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 7,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  // Hábitos adicionales sugeridos (en pausa / listos para activar)
  {
    id: 'habit-extra-1',
    userId: 'user-admin',
    title: 'Estirar 15 min',
    description: 'Movilidad articular y estiramiento muscular',
    icon: '🧘',
    color: '#14b8a6',
    category: 'salud',
    targetType: 'duration',
    targetValue: 15,
    targetUnit: 'min',
    frequency: 'daily',
    isActive: false,
    isArchived: false,
    displayOrder: 9,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-extra-2',
    userId: 'user-admin',
    title: 'Tomar vitaminas',
    description: 'Suplementación matutina y omega 3',
    icon: '💊',
    color: '#f43f5e',
    category: 'salud',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: false,
    isArchived: false,
    displayOrder: 10,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-extra-3',
    userId: 'user-admin',
    title: 'Limpiar escritorio',
    description: 'Despejar área de trabajo antes de dormir',
    icon: '🧹',
    color: '#84cc16',
    category: 'productividad',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'weekdays',
    isActive: false,
    isArchived: false,
    displayOrder: 11,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-extra-4',
    userId: 'user-admin',
    title: 'Practicar guitarra',
    description: 'Práctica musical recreativa',
    icon: '🎸',
    color: '#f59e0b',
    category: 'mente',
    targetType: 'duration',
    targetValue: 20,
    targetUnit: 'min',
    frequency: 'weekends',
    isActive: false,
    isArchived: false,
    displayOrder: 12,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-extra-5',
    userId: 'user-admin',
    title: 'Aprender algo nuevo',
    description: 'Artículo técnico, tutorial o podcast',
    icon: '💡',
    color: '#06b6d4',
    category: 'mente',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: false,
    isArchived: false,
    displayOrder: 13,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'habit-extra-6',
    userId: 'user-admin',
    title: 'Limitar redes sociales',
    description: 'Menos de 30 minutos de ocio en pantalla',
    icon: '📱',
    color: '#ef4444',
    category: 'productividad',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: false,
    isArchived: false,
    displayOrder: 14,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

// Semilla de logs para Septiembre 2026 (días 1 al 17) para que la pantalla cobre vida inmediatamente
export function generateSeedLogsForUser(userId: string): HabitLog[] {
  const seedLogs: HabitLog[] = [];
  const activeIds =
    userId === 'user-admin'
      ? ['habit-1', 'habit-3', 'habit-4', 'habit-5', 'habit-6', 'habit-7', 'habit-8']
      : Array.from({ length: 7 }, (_, i) => `habit-${userId}-${i + 1}`);

  // Generamos un patrón realista de cumplimiento para los días 1 al 17 de Septiembre 2026
  for (let d = 1; d <= 17; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `2026-09-${dayStr}`;

    activeIds.forEach((hId, index) => {
      // Determinamos si el día se cumplió con alta probabilidad (70%-95%)
      const pseudoRandom = ((d * 37 + index * 19) % 100);
      const isCompleted = pseudoRandom < (index === 0 ? 86 : index === 3 ? 96 : 80);

      if (isCompleted) {
        seedLogs.push({
          id: `log-${userId}-${hId}-${dateKey}`,
          habitId: hId,
          userId,
          dateKey,
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (pseudoRandom > 92) {
        // En algunos casos no aplica
        seedLogs.push({
          id: `log-${userId}-${hId}-${dateKey}`,
          habitId: hId,
          userId,
          dateKey,
          status: 'not_applicable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  return seedLogs;
}

// Objetivos iniciales del mes
export const DEFAULT_INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    userId: 'user-admin',
    title: 'Terminar la lectura de un libro 📚',
    monthKey: '2026-09',
    targetType: 'boolean',
    targetValue: 1,
    currentValue: 1,
    isCompleted: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'goal-2',
    userId: 'user-admin',
    title: 'Mantener constancia diaria ✨',
    monthKey: '2026-09',
    targetType: 'boolean',
    targetValue: 1,
    currentValue: 1,
    isCompleted: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'goal-3',
    userId: 'user-admin',
    title: 'Contabilizar mis macros 🥗',
    monthKey: '2026-09',
    targetType: 'boolean',
    targetValue: 1,
    currentValue: 1,
    isCompleted: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'goal-4',
    userId: 'user-admin',
    title: 'Correr 80 km este mes 🏃‍♂️',
    monthKey: '2026-09',
    targetType: 'count',
    targetValue: 80,
    currentValue: 56,
    isCompleted: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'goal-5',
    userId: 'user-admin',
    title: 'Dormir mínimo a las 8:30 PM 😴',
    monthKey: '2026-09',
    targetType: 'boolean',
    targetValue: 1,
    currentValue: 0,
    isCompleted: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'goal-6',
    userId: 'user-admin',
    title: 'Ahorrar para las vacaciones 🏖️',
    monthKey: '2026-09',
    targetType: 'boolean',
    targetValue: 1,
    currentValue: 0,
    isCompleted: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

export const DEFAULT_NOTE_CONTENT = `Subir al siguiente nivel 💪

- Aumentar intensidad en el gym
- Mantener la consistencia de lectura
- Mejorar calidad del sueño
- Revisar progreso cada semana`;

// ========================================================
// PERSISTENCIA, RESPALDOS Y ZERO DATA LOSS
// ========================================================

export interface HabitDataSnapshot {
  id: string;
  timestamp: string;
  reason: string;
  habitsCount: number;
  logsCount: number;
  goalsCount: number;
  habits: Habit[];
  logs: HabitLog[];
  goals: Goal[];
  notes?: Record<string, string>;
}

export function isHabitsInitialized(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(HABIT_STORAGE_KEYS.INITIALIZED) === 'true';
  } catch {
    return true;
  }
}

export function markHabitsInitialized(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.INITIALIZED, 'true');
  } catch {}
}

export function getHabitsBackups(): HabitDataSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.BACKUPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function createHabitsBackupSnapshot(reason: string = 'Automático'): HabitDataSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawHabits = localStorage.getItem(HABIT_STORAGE_KEYS.HABITS);
    const habits: Habit[] = rawHabits ? JSON.parse(rawHabits) : [];
    const rawLogs = localStorage.getItem(HABIT_STORAGE_KEYS.LOGS);
    const logs: HabitLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    const rawGoals = localStorage.getItem(HABIT_STORAGE_KEYS.GOALS);
    const goals: Goal[] = rawGoals ? JSON.parse(rawGoals) : [];

    // Recolectar notas
    const notes: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HABIT_STORAGE_KEYS.NOTES)) {
        notes[key] = localStorage.getItem(key) || '';
      }
    }

    if (habits.length === 0 && logs.length === 0 && goals.length === 0) {
      return null;
    }

    const snapshot: HabitDataSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      reason,
      habitsCount: habits.length,
      logsCount: logs.length,
      goalsCount: goals.length,
      habits,
      logs,
      goals,
      notes,
    };

    const existing = getHabitsBackups();
    const updated = [snapshot, ...existing.slice(0, 9)];
    localStorage.setItem(HABIT_STORAGE_KEYS.BACKUPS, JSON.stringify(updated));
    return snapshot;
  } catch (e) {
    console.error('Error creando snapshot de hábitos:', e);
    return null;
  }
}

// ========================================================
// HÁBITOS CRUD & STORAGE
// ========================================================

export function getLocalHabits(userId?: string): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.HABITS);
    if (!raw) {
      return [];
    }
    const parsed: Habit[] = JSON.parse(raw);
    if (userId) {
      return parsed.filter((h) => h.userId === userId || (userId === 'user-admin' && h.userId === 'user-admin'));
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.HABITS, JSON.stringify(habits));
    markHabitsInitialized();
    notifySync('habits');
  } catch (e) {
    console.error('Error guardando hábitos en LocalStorage:', e);
  }
}

export async function saveHabit(habit: Habit): Promise<Habit> {
  const current = getLocalHabits();
  const index = current.findIndex((h) => h.id === habit.id);

  let updatedList: Habit[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...habit, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [...current, { ...habit, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }

  saveLocalHabits(updatedList);

  // Sync Supabase asíncrono no bloqueante
  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('habits').upsert({
        id: habit.id,
        user_id: habit.userId,
        challenge_id: habit.challengeId || null,
        title: habit.title,
        description: habit.description || null,
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        target_type: habit.targetType,
        target_value: habit.targetValue,
        target_unit: habit.targetUnit || null,
        frequency: habit.frequency,
        frequency_days: habit.frequencyDays || null,
        is_active: habit.isActive,
        is_archived: habit.isArchived,
        display_order: habit.displayOrder,
        created_at: habit.createdAt,
        updated_at: habit.updatedAt,
      });
    } catch (e) {
      console.warn('Sync asíncrono con Supabase habits pendiente:', e);
    }
  }

  return habit;
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
  const current = getLocalHabits();
  const index = current.findIndex((h) => h.id === habitId);
  if (index === -1) return null;

  const updated: Habit = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalHabits(current);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('habits').update({
        title: updated.title,
        description: updated.description,
        icon: updated.icon,
        color: updated.color,
        category: updated.category,
        target_type: updated.targetType,
        target_value: updated.targetValue,
        target_unit: updated.targetUnit,
        frequency: updated.frequency,
        is_active: updated.isActive,
        is_archived: updated.isArchived,
        display_order: updated.displayOrder,
        updated_at: updated.updatedAt,
      }).eq('id', habitId);
    } catch (e) {
      console.warn('Sync asíncrono updateHabit Supabase:', e);
    }
  }

  return updated;
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  createHabitsBackupSnapshot(`Pre-eliminación hábito ${habitId}`);
  const current = getLocalHabits();
  const filtered = current.filter((h) => h.id !== habitId);
  saveLocalHabits(filtered);

  // Limpiar también los logs asociados a este hábito
  const allLogs = getLocalHabitLogs();
  const remainingLogs = allLogs.filter((l) => l.habitId !== habitId);
  saveLocalHabitLogs(remainingLogs);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('habit_logs').delete().eq('habit_id', habitId);
      await client.from('habits').delete().eq('id', habitId);
    } catch (e) {
      console.warn('Sync deleteHabit Supabase:', e);
    }
  }

  return true;
}

// ========================================================
// CHECK-INS / HABIT LOGS STORAGE
// ========================================================

const SEEDED_USERS_KEY = 'kanban_duo_habits_seeded_users_v1';

function getSeededUsers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEDED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUserSeeded(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const users = getSeededUsers();
    if (!users.includes(userId)) {
      users.push(userId);
      localStorage.setItem(SEEDED_USERS_KEY, JSON.stringify(users));
    }
  } catch {}
}

export function getLocalHabitLogs(userId?: string): HabitLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.LOGS);
    if (!raw) {
      return [];
    }
    const parsed: HabitLog[] = JSON.parse(raw);
    if (userId) {
      return parsed.filter((l) => l.userId === userId);
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalHabitLogs(logs: HabitLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.LOGS, JSON.stringify(logs));
    markHabitsInitialized();
    notifySync('habits');
  } catch (e) {
    console.error('Error guardando habit logs:', e);
  }
}

// Check-in rápido e interactivo: Toggle completed <-> empty
export async function toggleHabitLog(
  habitId: string,
  userId: string,
  dateKey: string
): Promise<{ log: HabitLog | null; newStatus: HabitLogStatus | 'removed' }> {
  const currentLogs = getLocalHabitLogs();
  const existingIndex = currentLogs.findIndex(
    (l) => l.habitId === habitId && l.userId === userId && l.dateKey === dateKey
  );

  let newStatus: HabitLogStatus | 'removed';
  let resultingLog: HabitLog | null = null;

  if (existingIndex >= 0) {
    const currentStatus = currentLogs[existingIndex].status;
    if (currentStatus === 'completed') {
      // Si estaba completado, lo eliminamos o desmarcamos
      currentLogs.splice(existingIndex, 1);
      newStatus = 'removed';
    } else {
      currentLogs[existingIndex] = {
        ...currentLogs[existingIndex],
        status: 'completed',
        updatedAt: new Date().toISOString(),
      };
      resultingLog = currentLogs[existingIndex];
      newStatus = 'completed';
    }
  } else {
    // Si no existía, creamos registro 'completed'
    resultingLog = {
      id: `log-${userId}-${habitId}-${dateKey}`,
      habitId,
      userId,
      dateKey,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentLogs.push(resultingLog);
    newStatus = 'completed';
  }

  saveLocalHabitLogs(currentLogs);

  // Cloud sync
  const client = await getOrInitSupabase();
  if (client) {
    try {
      if (newStatus === 'removed') {
        await client
          .from('habit_logs')
          .delete()
          .match({ habit_id: habitId, user_id: userId, date_key: dateKey });
      } else if (resultingLog) {
        await client.from('habit_logs').upsert({
          id: resultingLog.id,
          habit_id: resultingLog.habitId,
          user_id: resultingLog.userId,
          date_key: resultingLog.dateKey,
          status: resultingLog.status,
          numeric_value: resultingLog.numericValue || null,
          notes: resultingLog.notes || null,
          created_at: resultingLog.createdAt,
          updated_at: resultingLog.updatedAt,
        });
      }
    } catch (e) {
      console.warn('Sync toggleHabitLog Supabase:', e);
    }
  }

  return { log: resultingLog, newStatus };
}

// Establecer estado específico (e.g. 'not_applicable', 'skipped')
export async function setHabitLogStatus(
  habitId: string,
  userId: string,
  dateKey: string,
  status: HabitLogStatus,
  numericValue?: number,
  notes?: string
): Promise<HabitLog> {
  const currentLogs = getLocalHabitLogs();
  const index = currentLogs.findIndex(
    (l) => l.habitId === habitId && l.userId === userId && l.dateKey === dateKey
  );

  let updatedLog: HabitLog;
  if (index >= 0) {
    updatedLog = {
      ...currentLogs[index],
      status,
      numericValue,
      notes,
      updatedAt: new Date().toISOString(),
    };
    currentLogs[index] = updatedLog;
  } else {
    updatedLog = {
      id: `log-${userId}-${habitId}-${dateKey}`,
      habitId,
      userId,
      dateKey,
      status,
      numericValue,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentLogs.push(updatedLog);
  }

  saveLocalHabitLogs(currentLogs);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('habit_logs').upsert({
        id: updatedLog.id,
        habit_id: updatedLog.habitId,
        user_id: updatedLog.userId,
        date_key: updatedLog.dateKey,
        status: updatedLog.status,
        numeric_value: updatedLog.numericValue || null,
        notes: updatedLog.notes || null,
        created_at: updatedLog.createdAt,
        updated_at: updatedLog.updatedAt,
      });
    } catch (e) {
      console.warn('Sync setHabitLogStatus Supabase:', e);
    }
  }

  return updatedLog;
}

// Limpiar / resetear todos los checks de un mes específico para un usuario
export async function clearMonthHabitLogs(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  createHabitsBackupSnapshot(`Pre-limpieza checks mes ${monthPrefix}`);

  markUserSeeded(userId);
  markHabitsInitialized();
  const currentLogs = getLocalHabitLogs();

  // Conservar registros de otros usuarios o de otros meses
  const remainingLogs = currentLogs.filter(
    (l) => !(l.userId === userId && l.dateKey.startsWith(monthPrefix))
  );
  const removedCount = currentLogs.length - remainingLogs.length;

  saveLocalHabitLogs(remainingLogs);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      const startDate = `${monthPrefix}01`;
      const endDate = `${monthPrefix}31`;
      await client
        .from('habit_logs')
        .delete()
        .eq('user_id', userId)
        .gte('date_key', startDate)
        .lte('date_key', endDate);
    } catch (e) {
      console.warn('Sync asíncrono clearMonthHabitLogs Supabase:', e);
    }
  }

  return removedCount;
}

// ========================================================
// RESTAURACIÓN, EXPORTACIÓN / IMPORTACIÓN Y CLOUD SYNC
// ========================================================

export async function restoreHabitsBackup(
  backupId?: string
): Promise<{ success: boolean; message: string; restored?: HabitDataSnapshot }> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Entorno no disponible' };
  }
  try {
    const backups = getHabitsBackups();
    if (backups.length === 0) {
      return { success: false, message: 'No existen copias de seguridad disponibles' };
    }

    const target = backupId ? backups.find((b) => b.id === backupId) : backups[0];
    if (!target) {
      return { success: false, message: 'Copia de seguridad no encontrada' };
    }

    // Tomar snapshot de seguridad del estado actual antes de restaurar
    createHabitsBackupSnapshot('Estado previo a restauración de ' + target.id);

    // Restaurar datos
    saveLocalHabits(target.habits);
    saveLocalHabitLogs(target.logs);
    saveLocalGoals(target.goals);

    if (target.notes) {
      Object.entries(target.notes).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    }

    markHabitsInitialized();
    notifySync('habits');

    // Sincronizar con Supabase si está disponible
    const client = await getOrInitSupabase();
    if (client) {
      try {
        if (target.habits && target.habits.length > 0) {
          const habitRows = target.habits.map((h) => ({
            id: h.id,
            user_id: h.userId,
            challenge_id: h.challengeId || null,
            title: h.title,
            description: h.description || null,
            icon: h.icon,
            color: h.color,
            category: h.category,
            target_type: h.targetType,
            target_value: h.targetValue,
            target_unit: h.targetUnit || null,
            frequency: h.frequency,
            frequency_days: h.frequencyDays || [1, 2, 3, 4, 5, 6, 7],
            is_active: h.isActive,
            is_archived: h.isArchived,
            display_order: h.displayOrder,
            updated_at: h.updatedAt,
          }));
          await client.from('habits').upsert(habitRows);
        }

        if (target.logs && target.logs.length > 0) {
          const logRows = target.logs.map((l) => ({
            id: l.id,
            habit_id: l.habitId,
            user_id: l.userId,
            date_key: l.dateKey,
            status: l.status,
            numeric_value: l.numericValue || null,
            notes: l.notes || null,
            created_at: l.createdAt,
            updated_at: l.updatedAt,
          }));
          await client.from('habit_logs').upsert(logRows);
        }
      } catch (e) {
        console.warn('Sync restoreHabitsBackup to Supabase:', e);
      }
    }

    return {
      success: true,
      message: `Copia restaurada con éxito (${target.logs.length} checks, ${target.habits.length} hábitos).`,
      restored: target,
    };
  } catch (e: any) {
    console.error('Error restaurando copia de seguridad:', e);
    return { success: false, message: e.message || 'Error al restaurar copia de seguridad' };
  }
}

export function exportHabitsDataJSON(userId?: string): string {
  const habits = getLocalHabits(userId);
  const logs = getLocalHabitLogs(userId);
  const goals = getLocalGoals(userId);

  const notes: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HABIT_STORAGE_KEYS.NOTES)) {
        if (!userId || key.includes(`_${userId}_`)) {
          notes[key] = localStorage.getItem(key) || '';
        }
      }
    }
  }

  const exportPayload = {
    schemaVersion: 'kanban_duo_habits_v1',
    exportDate: new Date().toISOString(),
    userId: userId || 'all',
    habits,
    logs,
    goals,
    notes,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importHabitsDataJSON(
  jsonStr: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || (!Array.isArray(data.habits) && !Array.isArray(data.logs))) {
      return {
        success: false,
        message: 'El archivo JSON no contiene una estructura válida de hábitos o logs.',
      };
    }

    markHabitsInitialized();
    createHabitsBackupSnapshot('Pre-importación de archivo JSON');
    let restoredCount = 0;

    if (Array.isArray(data.habits) && data.habits.length > 0) {
      const rawHabits = typeof window !== 'undefined' ? localStorage.getItem(HABIT_STORAGE_KEYS.HABITS) : null;
      const currentHabits: Habit[] = rawHabits ? JSON.parse(rawHabits) : [];
      const habitMap = new Map(currentHabits.map((h) => [h.id, h]));
      data.habits.forEach((h: Habit) => {
        if (h.id && h.title) {
          habitMap.set(h.id, h);
        }
      });
      saveLocalHabits(Array.from(habitMap.values()));
    }

    if (Array.isArray(data.logs) && data.logs.length > 0) {
      const rawLogs = typeof window !== 'undefined' ? localStorage.getItem(HABIT_STORAGE_KEYS.LOGS) : null;
      const currentLogs: HabitLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const logKey = (l: HabitLog) => `${l.userId}_${l.habitId}_${l.dateKey}`;
      const logMap = new Map(currentLogs.map((l) => [logKey(l), l]));
      data.logs.forEach((l: HabitLog) => {
        if (l.habitId && l.userId && l.dateKey) {
          logMap.set(logKey(l), l);
          restoredCount++;
        }
      });
      saveLocalHabitLogs(Array.from(logMap.values()));
    }

    if (Array.isArray(data.goals) && data.goals.length > 0) {
      const rawGoals = typeof window !== 'undefined' ? localStorage.getItem(HABIT_STORAGE_KEYS.GOALS) : null;
      const currentGoals: Goal[] = rawGoals ? JSON.parse(rawGoals) : [];
      const goalMap = new Map(currentGoals.map((g) => [g.id, g]));
      data.goals.forEach((g: Goal) => {
        if (g.id && g.title) {
          goalMap.set(g.id, g);
        }
      });
      saveLocalGoals(Array.from(goalMap.values()));
    }

    if (data.notes && typeof data.notes === 'object') {
      Object.entries(data.notes).forEach(([k, v]) => {
        if (typeof v === 'string') {
          localStorage.setItem(k, v);
        }
      });
    }

    notifySync('habits');

    // Sincronizar a Supabase
    await syncCloudHabits();

    return {
      success: true,
      message: `Importación completada: ${restoredCount} checks procesados y guardados.`,
      count: restoredCount,
    };
  } catch (e: any) {
    return { success: false, message: `Error importando JSON: ${e.message}` };
  }
}

export async function syncCloudHabits(userId?: string): Promise<boolean> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') return false;

  try {
    // 1. Hábitos
    let habitsQuery = client.from('habits').select('*');
    if (userId) {
      habitsQuery = habitsQuery.or(`user_id.eq.${userId},user_id.eq.user-admin`);
    }
    const { data: cloudHabits, error: hErr } = await habitsQuery;

    // Auto-setup de tablas en Supabase si aún no existen (código PGRST205)
    if (hErr && (hErr.code === 'PGRST205' || hErr.message?.includes('schema cache'))) {
      console.log('⚠️ Tablas de habit core ausentes en Supabase. Intentando auto-creación vía /api/setup-db...');
      try {
        const setupRes = await fetch('/api/setup-db', { method: 'POST' });
        const setupData = await setupRes.json();
        if (setupData.success) {
          console.log('✅ Tablas creadas con éxito en Supabase. Reintentando sincronización...');
          return syncCloudHabits(userId);
        }
      } catch (err) {
        console.warn('Auto-setup error:', err);
      }
    }

    // 2. Logs
    let logsQuery = client.from('habit_logs').select('*');
    if (userId) {
      logsQuery = logsQuery.eq('user_id', userId);
    }
    const { data: cloudLogs, error: lErr } = await logsQuery;

    // 3. Goals
    let goalsQuery = client.from('goals').select('*');
    if (userId) {
      goalsQuery = goalsQuery.eq('user_id', userId);
    }
    const { data: cloudGoals, error: gErr } = await goalsQuery;

    // 4. Notes
    let notesQuery = client.from('habit_notes').select('*');
    if (userId) {
      notesQuery = notesQuery.eq('user_id', userId);
    }
    const { data: cloudNotes, error: nErr } = await notesQuery;

    let hasChanges = false;

    // Subir hábitos locales a Supabase si existen localmente pero aún no en la nube
    if (!hErr) {
      const currentLocalHabits = getLocalHabits(userId);
      const cloudHabitIds = new Set((cloudHabits || []).map((h: any) => h.id));
      const habitsToUpload = currentLocalHabits.filter((h) => !cloudHabitIds.has(h.id));

      for (const h of habitsToUpload) {
        try {
          await client.from('habits').upsert({
            id: h.id,
            user_id: h.userId,
            challenge_id: h.challengeId || null,
            title: h.title,
            description: h.description || null,
            icon: h.icon,
            color: h.color,
            category: h.category,
            target_type: h.targetType,
            target_value: h.targetValue,
            target_unit: h.targetUnit || null,
            frequency: h.frequency,
            frequency_days: h.frequencyDays || null,
            is_active: h.isActive,
            is_archived: h.isArchived,
            display_order: h.displayOrder,
            created_at: h.createdAt,
            updated_at: h.updatedAt,
          });
          console.log('☁️ Hábito local sincronizado a Supabase:', h.title);
        } catch (e) {
          console.warn('Error subiendo hábito a Supabase:', e);
        }
      }
    }

    // Subir logs locales a Supabase si no existen en la nube
    if (!lErr) {
      const rawLogs = localStorage.getItem(HABIT_STORAGE_KEYS.LOGS);
      const currentLocalLogs: HabitLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const cloudLogIds = new Set((cloudLogs || []).map((l: any) => l.id));
      const logsToUpload = currentLocalLogs.filter((l) => !cloudLogIds.has(l.id));

      for (const l of logsToUpload) {
        try {
          await client.from('habit_logs').upsert({
            id: l.id,
            habit_id: l.habitId,
            user_id: l.userId,
            date_key: l.dateKey,
            status: l.status,
            numeric_value: l.numericValue || null,
            notes: l.notes || null,
            created_at: l.createdAt,
            updated_at: l.updatedAt,
          });
        } catch (e) {
          console.warn('Error subiendo log a Supabase:', e);
        }
      }
    }

    // Fusionar Hábitos
    if (!hErr && cloudHabits && cloudHabits.length > 0) {
      const localHabits = getLocalHabits();
      const habitMap = new Map(localHabits.map((h) => [h.id, h]));

      cloudHabits.forEach((r: any) => {
        const mappedHabit: Habit = {
          id: r.id,
          userId: r.user_id,
          challengeId: r.challenge_id || undefined,
          title: r.title,
          description: r.description || undefined,
          icon: r.icon || '🎯',
          color: r.color || '#06b6d4',
          category: r.category || 'general',
          targetType: r.target_type || 'boolean',
          targetValue: Number(r.target_value) || 1,
          targetUnit: r.target_unit || undefined,
          frequency: r.frequency || 'daily',
          frequencyDays: r.frequency_days || undefined,
          isActive: r.is_active !== false,
          isArchived: Boolean(r.is_archived),
          displayOrder: r.display_order ?? 0,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        };

        const existing = habitMap.get(mappedHabit.id);
        if (!existing) {
          habitMap.set(mappedHabit.id, mappedHabit);
          hasChanges = true;
        } else {
          const remoteTime = new Date(mappedHabit.updatedAt).getTime();
          const localTime = new Date(existing.updatedAt).getTime();
          if (remoteTime > localTime) {
            habitMap.set(mappedHabit.id, mappedHabit);
            hasChanges = true;
          }
        }
      });

      if (hasChanges || localHabits.length === 0) {
        saveLocalHabits(Array.from(habitMap.values()));
        hasChanges = true;
      }
    }

    // Fusionar Logs
    if (!lErr && cloudLogs && cloudLogs.length > 0) {
      const raw = localStorage.getItem(HABIT_STORAGE_KEYS.LOGS);
      const localLogs: HabitLog[] = raw ? JSON.parse(raw) : [];
      const logKey = (l: { userId: string; habitId: string; dateKey: string }) =>
        `${l.userId}_${l.habitId}_${l.dateKey}`;
      const logMap = new Map(localLogs.map((l) => [logKey(l), l]));

      let logsChanged = false;
      cloudLogs.forEach((r: any) => {
        const mappedLog: HabitLog = {
          id: r.id,
          habitId: r.habit_id,
          userId: r.user_id,
          dateKey: r.date_key,
          status: r.status,
          numericValue: r.numeric_value ? Number(r.numeric_value) : undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        };

        const k = logKey(mappedLog);
        const existing = logMap.get(k);
        if (!existing) {
          logMap.set(k, mappedLog);
          logsChanged = true;
        } else {
          const remoteTime = new Date(mappedLog.updatedAt).getTime();
          const localTime = new Date(existing.updatedAt).getTime();
          if (remoteTime >= localTime) {
            logMap.set(k, mappedLog);
            logsChanged = true;
          }
        }
      });

      if (logsChanged || !raw || localLogs.length === 0) {
        saveLocalHabitLogs(Array.from(logMap.values()));
        hasChanges = true;
      }
      markHabitsInitialized();
    }

    // Fusionar Goals
    if (!gErr && cloudGoals && cloudGoals.length > 0) {
      const localGoals = getLocalGoals();
      const goalMap = new Map(localGoals.map((g) => [g.id, g]));
      let goalsChanged = false;

      cloudGoals.forEach((r: any) => {
        const mappedGoal: Goal = {
          id: r.id,
          userId: r.user_id,
          challengeId: r.challenge_id || undefined,
          habitId: r.habit_id || undefined,
          title: r.title,
          description: r.description || undefined,
          monthKey: r.month_key || undefined,
          targetType: r.target_type || 'boolean',
          targetValue: Number(r.target_value) || 1,
          currentValue: Number(r.current_value) || 0,
          isCompleted: Boolean(r.is_completed),
          dueDate: r.due_date || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        };

        const existing = goalMap.get(mappedGoal.id);
        if (!existing || new Date(mappedGoal.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          goalMap.set(mappedGoal.id, mappedGoal);
          goalsChanged = true;
        }
      });

      if (goalsChanged || localGoals.length === 0) {
        saveLocalGoals(Array.from(goalMap.values()));
        hasChanges = true;
      }
    }

    // Fusionar Notes
    if (!nErr && cloudNotes && cloudNotes.length > 0) {
      cloudNotes.forEach((r: any) => {
        if (r.user_id && r.period_key) {
          const key = `${HABIT_STORAGE_KEYS.NOTES}_${r.user_id}_${r.period_key}`;
          const currentLocal = localStorage.getItem(key);
          if (currentLocal === null && r.content) {
            localStorage.setItem(key, r.content);
            hasChanges = true;
          }
        }
      });
    }

    if (hasChanges) {
      notifySync('habits');
    }

    return true;
  } catch (e) {
    console.warn('Error en syncCloudHabits:', e);
    return false;
  }
}

// ========================================================
// GOALS STORAGE
// ========================================================

export function getLocalGoals(userId?: string, monthKey?: string): Goal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.GOALS);
    if (!raw) {
      return [];
    }
    const parsed: Goal[] = JSON.parse(raw);

    if (userId) {
      const userGoals = parsed.filter((g) => g.userId === userId);
      if (monthKey) {
        return userGoals.filter((g) => !g.monthKey || g.monthKey === monthKey);
      }
      return userGoals;
    }

    if (monthKey) {
      return parsed.filter((g) => !g.monthKey || g.monthKey === monthKey);
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.GOALS, JSON.stringify(goals));
    markHabitsInitialized();
    notifySync('habits');
  } catch (e) {
    console.error('Error guardando goals:', e);
  }
}

export async function saveGoal(goal: Goal): Promise<Goal> {
  const current = getLocalGoals();
  const index = current.findIndex((g) => g.id === goal.id);

  let updatedList: Goal[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...goal, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [...current, { ...goal, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }

  saveLocalGoals(updatedList);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('goals').upsert({
        id: goal.id,
        user_id: goal.userId,
        challenge_id: goal.challengeId || null,
        habit_id: goal.habitId || null,
        title: goal.title,
        description: goal.description || null,
        month_key: goal.monthKey || null,
        target_type: goal.targetType,
        target_value: goal.targetValue,
        current_value: goal.currentValue,
        is_completed: goal.isCompleted,
        due_date: goal.dueDate || null,
        created_at: goal.createdAt,
        updated_at: goal.updatedAt,
      });
    } catch (e) {
      console.warn('Sync saveGoal Supabase:', e);
    }
  }

  return goal;
}

export async function toggleGoal(goalId: string): Promise<Goal | null> {
  const current = getLocalGoals();
  const index = current.findIndex((g) => g.id === goalId);
  if (index === -1) return null;

  const goal = current[index];
  const newCompleted = !goal.isCompleted;
  const updated: Goal = {
    ...goal,
    isCompleted: newCompleted,
    currentValue: newCompleted ? goal.targetValue : 0,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveLocalGoals(current);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('goals').update({
        is_completed: updated.isCompleted,
        current_value: updated.currentValue,
        updated_at: updated.updatedAt,
      }).eq('id', goalId);
    } catch (e) {
      console.warn('Sync toggleGoal Supabase:', e);
    }
  }

  return updated;
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  const current = getLocalGoals();
  const filtered = current.filter((g) => g.id !== goalId);
  saveLocalGoals(filtered);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('goals').delete().eq('id', goalId);
    } catch (e) {
      console.warn('Sync deleteGoal Supabase:', e);
    }
  }

  return true;
}

// ========================================================
// HABIT NOTES STORAGE
// ========================================================

export function getLocalHabitNote(userId: string, periodKey: string): string {
  if (typeof window === 'undefined') return DEFAULT_NOTE_CONTENT;
  try {
    const raw = localStorage.getItem(`${HABIT_STORAGE_KEYS.NOTES}_${userId}_${periodKey}`);
    return raw !== null ? raw : DEFAULT_NOTE_CONTENT;
  } catch {
    return DEFAULT_NOTE_CONTENT;
  }
}

export async function saveHabitNote(
  userId: string,
  periodKey: string,
  content: string
): Promise<HabitNote> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${HABIT_STORAGE_KEYS.NOTES}_${userId}_${periodKey}`, content);
    notifySync('habits');
  }

  const noteObj: HabitNote = {
    id: `note-${userId}-${periodKey}`,
    userId,
    periodKey,
    content,
    updatedAt: new Date().toISOString(),
  };

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('habit_notes').upsert({
        id: noteObj.id,
        user_id: noteObj.userId,
        period_key: noteObj.periodKey,
        content: noteObj.content,
        updated_at: noteObj.updatedAt,
      });
    } catch (e) {
      console.warn('Sync saveHabitNote Supabase:', e);
    }
  }

  return noteObj;
}
