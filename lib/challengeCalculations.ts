// ========================================================
// HABIT CORE — PHASE C: CHALLENGE CALCULATIONS ENGINE
// Pure Algorithms: Leaderboard, Deterministic Ties,
// Late Participation & Timezone (America/Bogota)
// ========================================================

import { User } from './types';
import {
  Challenge,
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

  // Mapa rápido de logs del miembro para este reto
  const memberLogSet = new Set<string>();
  logs.forEach((l) => {
    if (l.challengeId === challenge.id && l.userId === member.userId && l.status === 'completed') {
      memberLogSet.add(`${l.challengeHabitId}_${l.dateKey}`);
      // Indexar también por dateKey para matching infalible de check-ins del reto
      memberLogSet.add(l.dateKey);
    }
  });

  const habitsToTrack = challengeHabits.length > 0 ? challengeHabits : [{ id: 'default', challengeId: challenge.id, title: 'Hábito', icon: '🎯', displayOrder: 1, createdAt: '' }];

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
  // 2º Racha activa desc
  // 3º Mejor racha desc
  complianceList.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
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

  leaderboard.forEach((m) => {
    totalCompleted += m.completedDays;
    totalExpected += m.expectedDays;
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
  };
}
