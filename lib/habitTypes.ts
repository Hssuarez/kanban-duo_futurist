// ========================================================
// HABIT CORE - DOMAIN TYPES
// Dominio funcional independiente dentro de KANBAN//DUO
// ========================================================

export type TargetType = 'boolean' | 'count' | 'numeric' | 'duration';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type HabitLogStatus = 'completed' | 'skipped' | 'failed' | 'not_applicable';

export interface Habit {
  id: string;
  userId: string;          // Propietario del hábito (privado por defecto)
  challengeId?: string;    // Opcional: vinculado a un reto compartido
  title: string;
  description?: string;
  icon: string;            // Emoji o identificador de icono (e.g. '🏋️', '💧', '📖')
  color: string;           // Color hex para el acento
  category: string;        // 'salud', 'productividad', 'mente', 'finanzas', 'general'
  targetType: TargetType;  // 'boolean' | 'count' | 'numeric' | 'duration'
  targetValue: number;     // e.g. 1 para boolean, 8 para vasos de agua, 60 para minutos
  targetUnit?: string;     // e.g. 'vasos', 'páginas', 'min', 'km'
  frequency: HabitFrequency;
  frequencyDays?: number[]; // [1,2,3,4,5] para lun-vie (1=Lunes, 7=Domingo)
  isActive: boolean;       // Activo en la matriz principal
  isArchived: boolean;     // Archivado / en pausa
  displayOrder: number;    // Posición en la matriz
  createdAt: string;       // ISO string UTC
  updatedAt: string;       // ISO string UTC
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;          // Quién realizó el check-in (un miembro solo marca el suyo)
  dateKey: string;         // 'YYYY-MM-DD' en hora local Bogotá
  status: HabitLogStatus;  // 'completed' | 'skipped' | 'failed' | 'not_applicable'
  numericValue?: number;   // e.g. 8 vasos, 45 min
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeRole = 'owner' | 'member';

export interface Challenge {
  id: string;
  createdBy: string;       // User ID del creador/owner
  title: string;
  description?: string;
  icon: string;            // e.g. '🏆'
  color: string;
  startDate: string;       // 'YYYY-MM-DD'
  endDate: string;         // 'YYYY-MM-DD'
  targetGoal?: string;     // e.g. '20 sesiones'
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeMember {
  id: string;
  challengeId: string;
  userId: string;
  role: ChallengeRole;     // 'owner' | 'member'
  joinedAt: string;
}

export type GoalTargetType = 'boolean' | 'count' | 'percentage';

export interface Goal {
  id: string;
  userId: string;
  challengeId?: string;
  habitId?: string;
  title: string;
  description?: string;
  monthKey?: string;       // 'YYYY-MM' e.g. '2026-09'
  targetType: GoalTargetType;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitNote {
  id: string;
  userId: string;
  challengeId?: string;
  periodKey: string;       // 'YYYY-MM' e.g. '2026-09'
  content: string;
  updatedAt: string;
}

// Resumen analítico calculado para la vista HUD
export interface HabitKpiSummary {
  activeHabitsCount: number;
  totalHabitsCount: number;
  currentStreak: number;
  bestStreak: number;
  monthCompliancePercentage: number;
  totalCompletedChecks: number;
  totalExpectedChecks: number;
  completedGoalsCount: number;
  totalGoalsCount: number;
  notApplicableCount: number;
}

export interface HabitConsistencyRank {
  habit: Habit;
  completedDays: number;
  totalActiveDays: number;
  percentage: number;
  currentStreak: number;
}

export interface DayCompliance {
  dayNumber: number;
  dateKey: string;
  dayName: string;         // 'LUN', 'MAR', etc.
  completedCount: number;
  totalCount: number;
  percentage: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekCompliance {
  weekNumber: number;      // 1, 2, 3, 4, 5
  label: string;           // 'Semana 1 (1 - 7 Sep)'
  startDate: string;
  endDate: string;
  percentage: number;
}

export type HabitCoreSubView = 'habits' | 'challenges' | 'goals' | 'progress';
