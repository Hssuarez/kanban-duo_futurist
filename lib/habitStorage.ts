// ========================================================
// HABIT CORE - STORAGE & CLOUD SYNC
// Local-First + Supabase Sync + Multi-Tab Reactivity
// ========================================================

import { Habit, HabitLog, Goal, HabitNote, HabitLogStatus } from './habitTypes';
import { getOrInitSupabase } from './supabaseClient';
import { notifySync } from './storage';

const HABIT_STORAGE_KEYS = {
  HABITS: 'kanban_duo_habits_v1',
  LOGS: 'kanban_duo_habit_logs_v1',
  CHALLENGES: 'kanban_duo_challenges_v1',
  CHALLENGE_MEMBERS: 'kanban_duo_challenge_members_v1',
  GOALS: 'kanban_duo_goals_v1',
  NOTES: 'kanban_duo_habit_notes_v1',
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
    id: 'habit-2',
    userId: 'user-admin',
    title: 'No Fap',
    description: 'Enfoque mental, disciplina y claridad',
    icon: '🚫',
    color: '#ec4899',
    category: 'mente',
    targetType: 'boolean',
    targetValue: 1,
    frequency: 'daily',
    isActive: true,
    isArchived: false,
    displayOrder: 2,
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
    displayOrder: 3,
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
    displayOrder: 4,
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
    displayOrder: 5,
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
    displayOrder: 6,
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
    displayOrder: 7,
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
    displayOrder: 8,
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
      ? ['habit-1', 'habit-2', 'habit-3', 'habit-4', 'habit-5', 'habit-6', 'habit-7', 'habit-8']
      : Array.from({ length: 8 }, (_, i) => `habit-${userId}-${i + 1}`);

  // Generamos un patrón realista de cumplimiento para los días 1 al 17 de Septiembre 2026
  for (let d = 1; d <= 17; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `2026-09-${dayStr}`;

    activeIds.forEach((hId, index) => {
      // Determinamos si el día se cumplió con alta probabilidad (70%-95%)
      const pseudoRandom = ((d * 37 + index * 19) % 100);
      const isCompleted = pseudoRandom < (index === 0 ? 86 : index === 4 ? 96 : 80);

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
    title: 'No ver más contenido FAP 🚫',
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
// HÁBITOS CRUD & STORAGE
// ========================================================

export function getLocalHabits(userId?: string): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.HABITS);
    let parsed: Habit[] = raw ? JSON.parse(raw) : [];

    if (!raw || parsed.length === 0) {
      parsed = [...DEFAULT_INITIAL_HABITS];
      localStorage.setItem(HABIT_STORAGE_KEYS.HABITS, JSON.stringify(parsed));
    }

    if (userId) {
      const userHabits = parsed.filter((h) => h.userId === userId);
      // Si este usuario específico no tiene ningún hábito registrado aún:
      if (userHabits.length === 0) {
        const userTemplate = DEFAULT_INITIAL_HABITS.map((h, idx) => ({
          ...h,
          id: `habit-${userId}-${idx + 1}`,
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        const combined = [...parsed, ...userTemplate];
        localStorage.setItem(HABIT_STORAGE_KEYS.HABITS, JSON.stringify(combined));
        return userTemplate;
      }
      return userHabits;
    }
    return parsed;
  } catch {
    return DEFAULT_INITIAL_HABITS;
  }
}

export function saveLocalHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.HABITS, JSON.stringify(habits));
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
  const current = getLocalHabits();
  const filtered = current.filter((h) => h.id !== habitId);
  saveLocalHabits(filtered);

  const client = await getOrInitSupabase();
  if (client) {
    try {
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
    let parsed: HabitLog[] = raw ? JSON.parse(raw) : [];
    const seededUsers = getSeededUsers();

    if (!raw) {
      const defaultUserId = userId || 'user-admin';
      const seed = generateSeedLogsForUser(defaultUserId);
      localStorage.setItem(HABIT_STORAGE_KEYS.LOGS, JSON.stringify(seed));
      markUserSeeded(defaultUserId);
      return seed;
    }

    if (userId) {
      const userLogs = parsed.filter((l) => l.userId === userId);
      // Solo generar semillas si el usuario NUNCA ha sido inicializado antes
      if (!seededUsers.includes(userId) && userLogs.length === 0) {
        const userSeed = generateSeedLogsForUser(userId);
        const combined = [...parsed, ...userSeed];
        localStorage.setItem(HABIT_STORAGE_KEYS.LOGS, JSON.stringify(combined));
        markUserSeeded(userId);
        return userSeed;
      }
      return userLogs;
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
  markUserSeeded(userId);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
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
// GOALS STORAGE
// ========================================================

export function getLocalGoals(userId?: string, monthKey?: string): Goal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEYS.GOALS);
    let parsed: Goal[] = raw ? JSON.parse(raw) : [];

    if (!raw || parsed.length === 0) {
      parsed = [...DEFAULT_INITIAL_GOALS];
      localStorage.setItem(HABIT_STORAGE_KEYS.GOALS, JSON.stringify(parsed));
    }

    if (userId) {
      let userGoals = parsed.filter((g) => g.userId === userId);
      if (userGoals.length === 0) {
        const initialUserGoals = DEFAULT_INITIAL_GOALS.map((g, idx) => ({
          ...g,
          id: `goal-${userId}-${idx + 1}`,
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        parsed = [...parsed, ...initialUserGoals];
        localStorage.setItem(HABIT_STORAGE_KEYS.GOALS, JSON.stringify(parsed));
        userGoals = initialUserGoals;
      }
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
    return DEFAULT_INITIAL_GOALS;
  }
}

export function saveLocalGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEYS.GOALS, JSON.stringify(goals));
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
