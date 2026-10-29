// ========================================================
// HABIT CORE — PHASE C: CHALLENGE CALCULATIONS ENGINE
// Pure Algorithms: Leaderboard, Deterministic Ties,
// Late Participation & Timezone (America/Bogota)
// ========================================================

import { User } from './types';
import {
  Challenge,
  ChallengeType,
  ChallengeMember,
  ChallengeHabit,
  ChallengeLog,
  ChallengeMemberCompliance,
  ChallengeSummaryKpis,
  ChallengeDayInfo,
} from './challengeTypes';
import { getBogotaToday } from './habitCalculations';

// Iniciales de días en español
const DAY_LETTERS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

// ========================================================
// CLASIFICACIÓN DE RETOS (FÍSICO / DEPORTIVO VS. GENERAL)
// ========================================================

export const PHYSICAL_CHALLENGE_ICONS = new Set([
  '🏋️',
  '🏃',
  '🧘',
  '⚡',
  '🚴',
  '🏊',
  '🥊',
  '⚽',
  '🏀',
  '💪',
  '🔥',
]);

const PHYSICAL_KEYWORDS_REGEX =
  /\b(gym|gimnasio|entrenar|entrenamiento|fitness|cardio|correr|running|crossfit|pesas|fuerza|calor[ií]as|kcal|deporte|ejercicio|workout|trotar|ciclismo|bicicleta|nataci[oó]n|hiit|boxeo|yoga|pilates|marat[oó]n)\b/i;

/**
 * Sugiere un tipo inicial ('physical' | 'general') a partir de título, icono o descripción.
 * Se utiliza únicamente como sugerencia inicial al crear un reto o como fallback no destructivo
 * para retos históricos que aún no tienen `challengeType` persistido.
 */
export function inferChallengeTypeFromMetadata(
  title?: string,
  icon?: string,
  description?: string
): ChallengeType {
  if (icon && PHYSICAL_CHALLENGE_ICONS.has(icon.trim())) {
    return 'physical';
  }
  const combinedText = `${title || ''} ${description || ''}`.trim();
  if (combinedText && PHYSICAL_KEYWORDS_REGEX.test(combinedText)) {
    return 'physical';
  }
  return 'general';
}

/**
 * Resuelve el tipo efectivo del reto:
 * 1. Si `challengeType` está definido ('physical' | 'general'), es la fuente única de verdad.
 * 2. Si es un reto anterior sin `challengeType`, aplica inferencia no destructiva.
 */
export function resolveChallengeType(
  challenge?: Pick<Challenge, 'challengeType' | 'title' | 'icon' | 'description'> | null
): ChallengeType {
  if (!challenge) return 'general';
  if (challenge.challengeType === 'physical' || challenge.challengeType === 'general') {
    return challenge.challengeType;
  }
  return inferChallengeTypeFromMetadata(challenge.title, challenge.icon, challenge.description);
}

/**
 * Determina si el reto tiene habilitadas las funciones y métricas de calorías.
 */
export function isPhysicalChallenge(
  challenge?: Pick<Challenge, 'challengeType' | 'title' | 'icon' | 'description'> | null
): boolean {
  return resolveChallengeType(challenge) === 'physical';
}

// ========================================================
// VALIDACIÓN Y EXTRACCIÓN DETERMINÍSTICA DE CALORÍAS
// ========================================================

export const MAX_CALORIES_PER_LOG = 10000;
export const MIN_CALORIES_PER_LOG = 0;

export interface CaloriesValidationResult {
  valid: boolean;
  value: number | null; // null = ausente / sin registro, 0..10000 = entero válido
  error?: string;
}

/**
 * Valida la entrada de calorías distinguiendo estrictamente entre:
 * - Valor ausente ('' | null | undefined) -> { valid: true, value: null }
 * - Cero explícito ('0' | 0) -> { valid: true, value: 0 }
 * - Entero positivo [1..10000] -> { valid: true, value: n }
 * Rechaza negativos, decimales, NaN y valores > 10000.
 */
export function validateCaloriesInput(raw: unknown): CaloriesValidationResult {
  if (raw === null || raw === undefined) {
    return { valid: true, value: null };
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return { valid: true, value: null };
    }
    // Rechazar notación decimal o caracteres no numéricos (excepto signo para dar mensaje claro)
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return {
        valid: false,
        value: null,
        error: 'Ingresa un número entero válido de calorías (0 a 10.000 kcal).',
      };
    }
    if (trimmed.includes('.')) {
      return {
        valid: false,
        value: null,
        error: 'No se permiten decimales. Ingresa calorías enteras (0 a 10.000 kcal).',
      };
    }
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed)) {
      return {
        valid: false,
        value: null,
        error: 'Valor numérico inválido.',
      };
    }
    if (parsed < MIN_CALORIES_PER_LOG) {
      return {
        valid: false,
        value: null,
        error: 'No se permiten calorías negativas (mínimo 0 kcal).',
      };
    }
    if (parsed > MAX_CALORIES_PER_LOG) {
      return {
        valid: false,
        value: null,
        error: 'El límite máximo por registro es de 10.000 kcal.',
      };
    }
    return { valid: true, value: parsed };
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return { valid: false, value: null, error: 'Valor numérico inválido.' };
    }
    if (!Number.isInteger(raw)) {
      return {
        valid: false,
        value: null,
        error: 'No se permiten decimales. Ingresa calorías enteras (0 a 10.000 kcal).',
      };
    }
    if (raw < MIN_CALORIES_PER_LOG) {
      return {
        valid: false,
        value: null,
        error: 'No se permiten calorías negativas (mínimo 0 kcal).',
      };
    }
    if (raw > MAX_CALORIES_PER_LOG) {
      return {
        valid: false,
        value: null,
        error: 'El límite máximo por registro es de 10.000 kcal.',
      };
    }
    return { valid: true, value: raw };
  }

  return { valid: false, value: null, error: 'Formato de calorías no válido.' };
}

/**
 * Extrae las calorías válidas de un ChallengeLog.
 * Retorna null si el registro no está completado, si numericValue está ausente o fuera de rango.
 * Retorna 0 si fue puesto explícitamente en 0, o el entero [1..10000].
 */
export function getValidLogCalories(
  log?: Pick<ChallengeLog, 'status' | 'numericValue'> | null
): number | null {
  if (!log || log.status !== 'completed') return null;
  if (log.numericValue === null || log.numericValue === undefined) return null;
  const num = Number(log.numericValue);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return null;
  if (num < MIN_CALORIES_PER_LOG || num > MAX_CALORIES_PER_LOG) return null;
  return num;
}

export interface CalorieThermalRank {
  id: 'spark' | 'reactor' | 'supernova' | 'fusion';
  label: string;
  shortLabel: string;
  icon: string;
  badgeClass: string;
}

/**
 * Determina el rango visual gamificado según el total de calorías registradas en el reto.
 */
export function getCalorieThermalRank(totalCalories: number): CalorieThermalRank | null {
  if (!Number.isFinite(totalCalories) || totalCalories <= 0) return null;
  if (totalCalories >= 15000) {
    return {
      id: 'fusion',
      label: 'Fusión Nuclear (15.000+ kcal)',
      shortLabel: 'Fusión',
      icon: '💎',
      badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    };
  }
  if (totalCalories >= 7500) {
    return {
      id: 'supernova',
      label: 'Modo Supernova (7.500+ kcal)',
      shortLabel: 'Supernova',
      icon: '☄️',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    };
  }
  if (totalCalories >= 2500) {
    return {
      id: 'reactor',
      label: 'Reactor Térmico (2.500+ kcal)',
      shortLabel: 'Reactor',
      icon: '⚡',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    };
  }
  return {
    id: 'spark',
    label: 'Chispa Activa (1+ kcal)',
    shortLabel: 'Chispa',
    icon: '🔥',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
}

// Genera los días del reto o del mes del calendario con respecto al reto
export function getChallengeDays(
  challenge: Challenge,
  todayKey = getBogotaToday(),
  year?: number,
  month?: number
): ChallengeDayInfo[] {
  const days: ChallengeDayInfo[] = [];

  // Si se especifica año y mes, generamos los días del mes en el calendario para navegación fluida
  if (year && month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dayName = DAY_LETTERS_ES[dayOfWeek];

      const isToday = dateKey === todayKey;
      const isPast = dateKey < todayKey;
      const isFuture = dateKey > todayKey;

      const isOutsideChallenge =
        (challenge.startDate && dateKey < challenge.startDate) ||
        (challenge.endDate && dateKey > challenge.endDate);

      let dayIndexInChallenge = 0;
      if (!isOutsideChallenge && challenge.startDate) {
        const start = new Date(`${challenge.startDate}T12:00:00Z`);
        const cur = new Date(`${dateKey}T12:00:00Z`);
        dayIndexInChallenge = Math.max(1, Math.round((cur.getTime() - start.getTime()) / 86400000) + 1);
      }

      days.push({
        dayNumber: d,
        dateKey,
        dayName,
        isToday,
        isPast,
        isFuture,
        dayIndexInChallenge,
        isOutsideChallenge: !!isOutsideChallenge,
      });
    }
    return days;
  }

  // Fallback: Si no se provee mes y año, genera el rango exacto de fechas del reto
  const sDate = challenge?.startDate || todayKey;
  const eDate = challenge?.endDate || sDate;

  const start = new Date(`${sDate}T12:00:00Z`);
  const end = new Date(`${eDate}T12:00:00Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    const duration = challenge?.durationDays || 30;
    const [y, m, d] = todayKey.split('-').map(Number);
    for (let i = 0; i < duration; i++) {
      const cur = new Date(Date.UTC(y, m - 1, d + i, 12));
      const curY = cur.getUTCFullYear();
      const curM = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const curD = String(cur.getUTCDate()).padStart(2, '0');
      const dateKey = `${curY}-${curM}-${curD}`;
      days.push({
        dayNumber: cur.getUTCDate(),
        dateKey,
        dayName: DAY_LETTERS_ES[cur.getUTCDay()],
        isToday: dateKey === todayKey,
        isPast: dateKey < todayKey,
        isFuture: dateKey > todayKey,
        dayIndexInChallenge: i + 1,
        isOutsideChallenge: false,
      });
    }
    return days;
  }

  let current = new Date(start);
  let index = 1;

  while (current <= end && index <= 730) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const isToday = dateKey === todayKey;
    const isPast = dateKey < todayKey;
    const isFuture = dateKey > todayKey;

    days.push({
      dayNumber: current.getUTCDate(),
      dateKey,
      dayName: DAY_LETTERS_ES[current.getUTCDay()],
      isToday,
      isPast,
      isFuture,
      dayIndexInChallenge: index,
      isOutsideChallenge: false,
    });

    current.setUTCDate(current.getUTCDate() + 1);
    index++;
  }

  return days;
}

// Calcula el cumplimiento de un miembro individual considerando fecha de ingreso y logs reales
export function calculateMemberCompliance(
  member: ChallengeMember,
  user: User,
  challenge: Challenge,
  logs: ChallengeLog[],
  challengeHabits: ChallengeHabit[],
  todayKey = getBogotaToday()
): ChallengeMemberCompliance {
  // Generamos los días dentro del reto activo
  const sDate = challenge?.startDate || todayKey;
  const eDate = challenge?.endDate || sDate;
  const start = new Date(`${sDate}T12:00:00Z`);
  const end = new Date(`${eDate}T12:00:00Z`);

  const challengeDays: { dateKey: string; isToday: boolean }[] = [];
  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
    let cur = new Date(start);
    while (cur <= end) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cur.getUTCDate()).padStart(2, '0');
      challengeDays.push({ dateKey: `${y}-${m}-${d}`, isToday: `${y}-${m}-${d}` === todayKey });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  } else {
    challengeDays.push({ dateKey: todayKey, isToday: true });
  }

  // Deduplicación determinística de logs completados del miembro por (challengeHabitId, dateKey)
  // Si existen duplicados en memoria, prevalece el que tenga updatedAt más reciente.
  const memberLogSet = new Set<string>();
  const completedHabitCheckMap = new Map<string, ChallengeLog>();

  logs.forEach((l) => {
    if (l.challengeId === challenge.id && l.userId === member.userId && l.status === 'completed') {
      // No contabilizar fechas futuras
      if (l.dateKey > todayKey) return;

      memberLogSet.add(`${l.challengeHabitId}_${l.dateKey}`);
      memberLogSet.add(l.dateKey);

      const dedupeKey = `${l.challengeHabitId || 'h'}_${l.dateKey}`;
      const existing = completedHabitCheckMap.get(dedupeKey);
      if (!existing) {
        completedHabitCheckMap.set(dedupeKey, l);
      } else {
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const incomingTime = l.updatedAt ? new Date(l.updatedAt).getTime() : 0;
        if (incomingTime >= existingTime) {
          completedHabitCheckMap.set(dedupeKey, l);
        }
      }
    }
  });

  const points = completedHabitCheckMap.size;

  // Cálculo determinístico de calorías (sin doble conteo, solo en retos físicos)
  const isPhysical = isPhysicalChallenge(challenge);
  let totalCalories = 0;
  let bestCalorieDay = 0;
  let calorieLogsCount = 0;

  if (isPhysical) {
    completedHabitCheckMap.forEach((log) => {
      const cal = getValidLogCalories(log);
      if (cal !== null && cal > 0) {
        totalCalories += cal;
        calorieLogsCount += 1;
        if (cal > bestCalorieDay) {
          bestCalorieDay = cal;
        }
      }
    });
  }

  const avgCaloriesPerSession =
    isPhysical && calorieLogsCount > 0 ? Math.round(totalCalories / calorieLogsCount) : 0;

  const habitsToTrack =
    challengeHabits.length > 0
      ? challengeHabits
      : [{ id: 'default', challengeId: challenge.id, title: 'Hábito', icon: '🎯', displayOrder: 1, createdAt: '' }];

  let completedDays = 0;
  let expectedDays = 0;
  const completedDateKeys = new Set<string>();

  // Fecha de ingreso normalizada
  const joinedDateKey = (member.joinedAt ? member.joinedAt.slice(0, 10) : challenge.startDate) || challenge.startDate;

  challengeDays.forEach((day) => {
    // Si completó cualquier hábito del reto o tiene check en la fecha, el día es COMPLETADO
    const isCompleted = habitsToTrack.some((h) => memberLogSet.has(`${h.id}_${day.dateKey}`)) || memberLogSet.has(day.dateKey);

    // Si el día es anterior a joinedDateKey y NO tiene log completado, no se le exige
    if (day.dateKey < joinedDateKey && !isCompleted) return;

    // Solo cuentan días pasados o el día de hoy
    if (day.dateKey <= todayKey) {
      expectedDays++;
      if (isCompleted) {
        completedDays++;
        completedDateKeys.add(day.dateKey);
      }
    }
  });

  const percentage =
    expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

  // Cálculo de racha activa hacia atrás desde hoy o ayer
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  challengeDays.forEach((day) => {
    if (completedDateKeys.has(day.dateKey)) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (day.dateKey <= todayKey) {
      tempStreak = 0;
    }
  });

  // Racha actual activa
  const pastDaysDesc = challengeDays
    .filter((d) => d.dateKey <= todayKey)
    .reverse();

  for (let i = 0; i < pastDaysDesc.length; i++) {
    const d = pastDaysDesc[i];
    if (completedDateKeys.has(d.dateKey)) {
      currentStreak++;
    } else {
      // Si hoy aún no se ha marcado pero ayer sí, permitimos mantener la racha activa
      if (i === 0 && d.isToday) {
        continue;
      }
      break;
    }
  }

  return {
    member,
    user,
    completedDays,
    expectedDays,
    percentage,
    currentStreak,
    bestStreak,
    rankPosition: 1,
    isTied: false,
    points,
    totalCalories,
    avgCaloriesPerSession,
    bestCalorieDay,
    calorieLogsCount,
  };
}

export const MOCK_TEAM_MEMBERS: Record<string, Partial<User>> = {
  'user-2': {
    id: 'user-2',
    name: 'Jesús Morales',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
  },
  'user-3': {
    id: 'user-3',
    name: 'Mariana Gómez',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'member',
  },
  'user-4': {
    id: 'user-4',
    name: 'Carlos Mendoza',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'member',
  },
  'user-5': {
    id: 'user-5',
    name: 'Andrés Silva',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'member',
  },
};

export function getResolvedMemberUser(userId: string, users: User[]): User {
  const existing = users.find((u) => u.id === userId);
  if (existing) return existing;

  const mock = MOCK_TEAM_MEMBERS[userId];
  if (mock) {
    return {
      id: userId,
      name: mock.name || 'Compañero',
      email: `${userId}@kanbanduo.com`,
      avatar: mock.avatar || '',
      color: '#06b6d4',
      role: 'member',
      passwordHash: '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: userId,
    name: 'Compañero',
    email: `${userId}@kanbanduo.com`,
    avatar: '',
    color: '#06b6d4',
    role: 'member',
    passwordHash: '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

// Genera el Leaderboard con resolución determinística de empates
export function calculateChallengeLeaderboard(
  challenge: Challenge,
  members: ChallengeMember[],
  users: User[],
  logs: ChallengeLog[],
  challengeHabits: ChallengeHabit[],
  todayKey = getBogotaToday()
): ChallengeMemberCompliance[] {
  // Solo miembros activos confirmados (o retrocompatibles sin campo status) participan en métricas
  const activeMembers = members.filter((m) => !m.status || m.status === 'accepted');

  const complianceList: ChallengeMemberCompliance[] = activeMembers.map((member) => {
    const user: User = getResolvedMemberUser(member.userId, users);
    return calculateMemberCompliance(member, user, challenge, logs, challengeHabits, todayKey);
  });

  // Ordenamiento determinístico:
  // 1º Porcentaje desc
  // 2º Puntos desc
  // 3º Racha activa desc
  // 4º Mejor racha desc
  complianceList.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (b.points !== a.points) return b.points - a.points;
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    return b.bestStreak - a.bestStreak;
  });

  // Asignar posiciones y marcar empates reales
  for (let i = 0; i < complianceList.length; i++) {
    if (i === 0) {
      complianceList[0].rankPosition = 1;
      complianceList[0].isTied = false;
    } else {
      const prev = complianceList[i - 1];
      const curr = complianceList[i];
      const isExactTie =
        prev.percentage === curr.percentage &&
        prev.points === curr.points &&
        prev.currentStreak === curr.currentStreak &&
        prev.bestStreak === curr.bestStreak;

      if (isExactTie) {
        curr.rankPosition = prev.rankPosition;
        curr.isTied = true;
        prev.isTied = true;
      } else {
        // En ranking estándar de competición, si hay empate en el 1er lugar (1, 1), el siguiente es 3
        curr.rankPosition = i + 1;
        curr.isTied = false;
      }
    }
  }

  return complianceList;
}

// Calcula los KPIs consolidados de la cabecera del reto
export function calculateChallengeSummaryKpis(
  challenge: Challenge,
  members: ChallengeMember[],
  users: User[],
  logs: ChallengeLog[],
  challengeHabits: ChallengeHabit[],
  todayKey = getBogotaToday()
): ChallengeSummaryKpis {
  const activeMembers = members.filter((m) => !m.status || m.status === 'accepted');

  const leaderboard = calculateChallengeLeaderboard(
    challenge,
    activeMembers,
    users,
    logs,
    challengeHabits,
    todayKey
  );

  let totalCompleted = 0;
  let totalExpected = 0;
  let totalTeamCalories = 0;

  leaderboard.forEach((m) => {
    totalCompleted += m.completedDays;
    totalExpected += m.expectedDays;
    totalTeamCalories += m.totalCalories || 0;
  });

  const completionRate =
    totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  // Días restantes
  const end = new Date(`${challenge.endDate}T23:59:59Z`);
  const today = new Date(`${todayKey}T00:00:00Z`);
  const diffTime = end.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Racha de equipo (días en que al menos el 80% del equipo completó sus hábitos)
  const days = getChallengeDays(challenge, todayKey);
  const habitsToTrack = challengeHabits.length > 0 ? challengeHabits : [{ id: 'default', challengeId: challenge.id, title: 'Hábito', icon: '🎯', displayOrder: 1, createdAt: '' }];

  let currentTeamStreak = 0;
  let bestTeamStreak = 0;
  let tempTeamStreak = 0;

  days.forEach((day) => {
    if (day.dateKey <= todayKey && activeMembers.length > 0) {
      let membersCompletedOnDay = 0;

      activeMembers.forEach((member) => {
        const completedHabits = habitsToTrack.filter((h) =>
          logs.some(
            (l) =>
              l.challengeId === challenge.id &&
              l.challengeHabitId === h.id &&
              l.userId === member.userId &&
              l.dateKey === day.dateKey &&
              l.status === 'completed'
          )
        ).length;

        if (completedHabits >= habitsToTrack.length) {
          membersCompletedOnDay++;
        }
      });

      const dayTeamRate = membersCompletedOnDay / activeMembers.length;
      if (dayTeamRate >= 0.7) {
        tempTeamStreak++;
        if (tempTeamStreak > bestTeamStreak) bestTeamStreak = tempTeamStreak;
      } else {
        tempTeamStreak = 0;
      }
    }
  });

  currentTeamStreak = tempTeamStreak;

  // El miembro más consistente (el 1er lugar del leaderboard si tiene actividad)
  const mostConsistentMember =
    leaderboard.length > 0 && leaderboard[0].percentage > 0
      ? leaderboard[0]
      : null;

  return {
    completionRate,
    totalChecksCompleted: totalCompleted,
    totalChecksExpected: totalExpected,
    daysRemaining,
    currentTeamStreak,
    bestTeamStreak,
    totalMembersCount: members.length,
    activeMembersCount: members.length,
    mostConsistentMember,
    totalTeamCalories,
  };
}
