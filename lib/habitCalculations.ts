// ========================================================
// HABIT CORE - CALCULATIONS & DATE UTILS
// Timezone America/Bogota & Streak Algorithms
// ========================================================

import {
  Habit,
  HabitLog,
  Goal,
  HabitKpiSummary,
  HabitConsistencyRank,
  DayCompliance,
  WeekCompliance,
} from './habitTypes';

// Formato YYYY-MM-DD en zona horaria America/Bogota
export function getBogotaToday(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

// Obtener año y mes actual en Bogotá [YYYY, MM (1-12)]
export function getBogotaYearMonth(): [number, number] {
  const today = getBogotaToday();
  const [y, m] = today.split('-').map(Number);
  return [y, m];
}

// Obtener nombre del mes en español
export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DAY_NAMES_ES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Información de los días de un mes
export interface MonthDayInfo {
  dayNumber: number;
  dateKey: string;      // 'YYYY-MM-DD'
  dayName: string;      // 'LUN', 'MAR', etc.
  dayOfWeek: number;    // 0 = Dom, 1 = Lun, ... 6 = Sáb
  isToday: boolean;
  isPastOrToday: boolean;
  isFuture: boolean;
}

export function getDaysInMonthInfo(year: number, month: number, todayKey = getBogotaToday()): MonthDayInfo[] {
  // En JS, month es 0-11 si usamos constructor Date(year, monthIndex, day)
  const daysCount = new Date(year, month, 0).getDate();
  const result: MonthDayInfo[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    // Determinar día de la semana para la fecha UTC/Local consistente
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const dayName = DAY_NAMES_ES[dayOfWeek];

    result.push({
      dayNumber: d,
      dateKey,
      dayName,
      dayOfWeek,
      isToday: dateKey === todayKey,
      isPastOrToday: dateKey <= todayKey,
      isFuture: dateKey > todayKey,
    });
  }

  return result;
}

// Verificar si un hábito aplica en un día específico de la semana (1=Lun, 7=Dom)
export function isHabitScheduledForDay(habit: Habit, dayOfWeek: number): boolean {
  if (!habit.isActive || habit.isArchived) return false;
  // dayOfWeek: 0 es Domingo en JS, normalizamos a 1..7 (1=Lun, 7=Dom)
  const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return normalizedDay >= 1 && normalizedDay <= 5;
    case 'weekends':
      return normalizedDay === 6 || normalizedDay === 7;
    case 'custom':
      return habit.frequencyDays ? habit.frequencyDays.includes(normalizedDay) : true;
    default:
      return true;
  }
}

// Calcular racha actual de un hábito
export function calculateHabitStreak(
  habit: Habit,
  logs: HabitLog[],
  todayKey = getBogotaToday()
): number {
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    if (l.habitId === habit.id) {
      logMap.set(l.dateKey, l);
    }
  });

  const [tY, tM, tD] = todayKey.split('-').map(Number);
  let streak = 0;
  let currentDate = new Date(tY, tM - 1, tD);

  // Si hoy ya se completó, arrancamos a contar desde hoy.
  // Si hoy aún no se completó, arrancamos a evaluar desde ayer para no romper la racha prematuramente.
  const todayLog = logMap.get(todayKey);
  const todayCompleted = todayLog?.status === 'completed';

  if (!todayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Iterar hacia atrás hasta romper racha o alcanzar límite de 365 días
  for (let i = 0; i < 365; i++) {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const dayOfWeek = currentDate.getDay();

    // Si el hábito no aplicaba en este día (e.g. fin de semana en weekdays), no rompe la racha
    if (!isHabitScheduledForDay(habit, dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    const log = logMap.get(key);
    if (log && log.status === 'completed') {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Calcular mejor racha histórica de un hábito
export function calculateHabitBestStreak(habit: Habit, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habitId === habit.id && l.status === 'completed')
    .map((l) => l.dateKey)
    .sort();

  if (habitLogs.length === 0) return 0;

  const dateSet = new Set(habitLogs);
  let maxStreak = 0;
  let currentStreak = 0;

  // Analizar secuencia de fechas ordenadas
  const [firstY, firstM, firstD] = habitLogs[0].split('-').map(Number);
  const [lastY, lastM, lastD] = habitLogs[habitLogs.length - 1].split('-').map(Number);
  const iterDate = new Date(firstY, firstM - 1, firstD);
  const endDate = new Date(lastY, lastM - 1, lastD);

  while (iterDate <= endDate) {
    const y = iterDate.getFullYear();
    const m = String(iterDate.getMonth() + 1).padStart(2, '0');
    const d = String(iterDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const dayOfWeek = iterDate.getDay();

    if (!isHabitScheduledForDay(habit, dayOfWeek)) {
      iterDate.setDate(iterDate.getDate() + 1);
      continue;
    }

    if (dateSet.has(key)) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }

    iterDate.setDate(iterDate.getDate() + 1);
  }

  return maxStreak;
}

// Resumen general de KPIs para la vista HUD
export function calculateMonthlyKpis(
  habits: Habit[],
  logs: HabitLog[],
  goals: Goal[],
  year: number,
  month: number,
  todayKey = getBogotaToday()
): HabitKpiSummary {
  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);
  const days = getDaysInMonthInfo(year, month, todayKey);
  const pastOrTodayDays = days.filter((d) => d.isPastOrToday);

  // Mapa rápido de logs del mes
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  let totalExpected = 0;
  let totalCompleted = 0;
  let notApplicable = 0;

  activeHabits.forEach((habit) => {
    pastOrTodayDays.forEach((day) => {
      if (isHabitScheduledForDay(habit, day.dayOfWeek)) {
        totalExpected++;
        const log = logMap.get(`${habit.id}_${day.dateKey}`);
        if (log?.status === 'completed') {
          totalCompleted++;
        } else if (log?.status === 'not_applicable' || log?.status === 'skipped') {
          notApplicable++;
        }
      }
    });
  });

  // Streaks combinados o promedio
  let totalStreak = 0;
  let highestStreak = 0;
  let highestBestStreak = 0;

  activeHabits.forEach((h) => {
    const streak = calculateHabitStreak(h, logs, todayKey);
    const best = calculateHabitBestStreak(h, logs);
    if (streak > highestStreak) highestStreak = streak;
    if (best > highestBestStreak) highestBestStreak = best;
    totalStreak += streak;
  });

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthGoals = goals.filter((g) => !g.monthKey || g.monthKey === monthKey);
  const completedGoals = monthGoals.filter((g) => g.isCompleted).length;

  const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  return {
    activeHabitsCount: activeHabits.length,
    totalHabitsCount: habits.length,
    currentStreak: highestStreak,
    bestStreak: Math.max(highestStreak, highestBestStreak),
    monthCompliancePercentage: percentage,
    totalCompletedChecks: totalCompleted,
    totalExpectedChecks: totalExpected,
    completedGoalsCount: completedGoals,
    totalGoalsCount: monthGoals.length,
    notApplicableCount: notApplicable,
  };
}

// Top hábitos más consistentes del mes
export function calculateTopHabits(
  habits: Habit[],
  logs: HabitLog[],
  year: number,
  month: number,
  todayKey = getBogotaToday()
): HabitConsistencyRank[] {
  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);
  const days = getDaysInMonthInfo(year, month, todayKey);
  const pastOrTodayDays = days.filter((d) => d.isPastOrToday);

  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  const ranks: HabitConsistencyRank[] = activeHabits.map((habit) => {
    let expected = 0;
    let completed = 0;

    pastOrTodayDays.forEach((d) => {
      if (isHabitScheduledForDay(habit, d.dayOfWeek)) {
        expected++;
        const log = logMap.get(`${habit.id}_${d.dateKey}`);
        if (log?.status === 'completed') {
          completed++;
        }
      }
    });

    const percentage = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    const streak = calculateHabitStreak(habit, logs, todayKey);

    return {
      habit,
      completedDays: completed,
      totalActiveDays: expected,
      percentage,
      currentStreak: streak,
    };
  });

  // Ordenar de mayor a menor porcentaje, y como desempate por racha
  return ranks.sort((a, b) => b.percentage - a.percentage || b.currentStreak - a.currentStreak);
}

// Progreso diario para el gráfico de barras (días 1..31)
export function calculateDailyCompliance(
  habits: Habit[],
  logs: HabitLog[],
  year: number,
  month: number,
  todayKey = getBogotaToday()
): DayCompliance[] {
  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);
  const days = getDaysInMonthInfo(year, month, todayKey);

  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });

  return days.map((day) => {
    let expected = 0;
    let completed = 0;

    activeHabits.forEach((habit) => {
      if (isHabitScheduledForDay(habit, day.dayOfWeek)) {
        expected++;
        const log = logMap.get(`${habit.id}_${day.dateKey}`);
        if (log?.status === 'completed') {
          completed++;
        }
      }
    });

    const percentage = expected > 0 ? Math.round((completed / expected) * 100) : 0;

    return {
      dayNumber: day.dayNumber,
      dateKey: day.dateKey,
      dayName: day.dayName,
      completedCount: completed,
      totalCount: expected,
      percentage,
      isToday: day.isToday,
      isFuture: day.isFuture,
    };
  });
}

// Progreso semanal para las barras de Semanas 1 a 5
export function calculateWeeklyCompliance(
  habits: Habit[],
  logs: HabitLog[],
  year: number,
  month: number,
  todayKey = getBogotaToday()
): WeekCompliance[] {
  const days = getDaysInMonthInfo(year, month, todayKey);
  const totalDays = days.length;

  const weekRanges = [
    { num: 1, start: 1, end: 7 },
    { num: 2, start: 8, end: 14 },
    { num: 3, start: 15, end: 21 },
    { num: 4, start: 22, end: 28 },
    { num: 5, start: 29, end: totalDays },
  ];

  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => {
    logMap.set(`${l.habitId}_${l.dateKey}`, l);
  });
  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);

  return weekRanges
    .filter((w) => w.start <= totalDays)
    .map((w) => {
      const endDay = Math.min(w.end, totalDays);
      let expected = 0;
      let completed = 0;

      for (let d = w.start; d <= endDay; d++) {
        const dayInfo = days[d - 1];
        activeHabits.forEach((habit) => {
          if (isHabitScheduledForDay(habit, dayInfo.dayOfWeek)) {
            expected++;
            const log = logMap.get(`${habit.id}_${dayInfo.dateKey}`);
            if (log?.status === 'completed') {
              completed++;
            }
          }
        });
      }

      const percentage = expected > 0 ? Math.round((completed / expected) * 100) : 0;
      const monthShort = MONTH_NAMES_ES[month - 1].slice(0, 3);

      return {
        weekNumber: w.num,
        label: `Semana ${w.num}  (${w.start} - ${endDay} ${monthShort})`,
        startDate: `${year}-${String(month).padStart(2, '0')}-${String(w.start).padStart(2, '0')}`,
        endDate: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
        percentage,
      };
    });
}

// Resumen del Período para la tarjeta HUD
export interface PeriodSummary {
  totalCheckIns: number;
  dailyAverage: number;
  bestDay: {
    dayNumber: number;
    count: number;
    label: string;
  };
  lowestDay: {
    dayNumber: number;
    count: number;
    label: string;
  };
}

export function calculatePeriodSummary(
  dailyData: DayCompliance[],
  month: number
): PeriodSummary {
  const pastDays = dailyData.filter((d) => !d.isFuture);
  const totalCheckIns = pastDays.reduce((acc, d) => acc + d.completedCount, 0);
  const countDays = pastDays.length > 0 ? pastDays.length : 1;
  const dailyAverage = Math.round((totalCheckIns / countDays) * 10) / 10;

  const monthShort = MONTH_NAMES_ES[month - 1] ? MONTH_NAMES_ES[month - 1].slice(0, 3) : '';

  let best = pastDays[0] || dailyData[0];
  let lowest = pastDays[0] || dailyData[0];

  pastDays.forEach((d) => {
    if (d.completedCount > (best?.completedCount ?? -1)) {
      best = d;
    }
    if (d.completedCount < (lowest?.completedCount ?? 999)) {
      lowest = d;
    }
  });

  const formatDayLabel = (d?: DayCompliance) => {
    if (!d) return '';
    const dayNameCapitalized = d.dayName.charAt(0) + d.dayName.slice(1).toLowerCase();
    return `${dayNameCapitalized} ${d.dayNumber} ${monthShort}`;
  };

  return {
    totalCheckIns,
    dailyAverage,
    bestDay: {
      dayNumber: best ? best.dayNumber : 1,
      count: best ? best.completedCount : 0,
      label: formatDayLabel(best),
    },
    lowestDay: {
      dayNumber: lowest ? lowest.dayNumber : 1,
      count: lowest ? lowest.completedCount : 0,
      label: formatDayLabel(lowest),
    },
  };
}

