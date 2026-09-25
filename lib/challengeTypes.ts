// ========================================================
// HABIT CORE — PHASE C: SHARED CHALLENGES DOMAIN TYPES
// ========================================================

import { User } from './types';
import { HabitLogStatus } from './habitTypes';

export type ChallengeMode = 'collaborative' | 'competitive';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type ChallengeRole = 'owner' | 'member';
export type ChallengeMemberStatus = 'pending' | 'accepted' | 'declined';

export interface Challenge {
  id: string;
  createdBy: string;           // User ID del creador
  title: string;               // e.g. '30 DÍAS GYM'
  description?: string;        // e.g. 'Entrenar al menos 5 veces por semana y mantener la consistencia.'
  icon: string;                // e.g. '🏋️', '📚', '💧'
  coverImage?: string;         // Optional cover image URL or theme
  color: string;               // Hex or cyan/teal theme
  startDate: string;           // 'YYYY-MM-DD'
  endDate: string;             // 'YYYY-MM-DD'
  durationDays: number;        // 7, 14, 21, 30, o personalizado
  mode: ChallengeMode;         // 'collaborative' | 'competitive'
  status: ChallengeStatus;     // 'upcoming' | 'active' | 'completed' | 'archived'
  targetGoal?: string;         // e.g. '20 sesiones de entrenamiento'
  createdAt: string;           // ISO UTC
  updatedAt: string;           // ISO UTC
}

export interface ChallengeMember {
  id: string;
  challengeId: string;
  userId: string;
  role: ChallengeRole;                 // 'owner' | 'member'
  status?: ChallengeMemberStatus;      // 'accepted' | 'pending' | 'declined' (default 'accepted' para retrocompatibilidad)
  joinedAt: string;                    // 'YYYY-MM-DD' o ISO UTC
}

export interface ChallengeHabit {
  id: string;
  challengeId: string;
  title: string;               // e.g. 'Entrenar', 'Tomar agua'
  icon: string;                // e.g. '🏋️', '💧'
  targetValue?: number;
  displayOrder: number;
  createdAt: string;
}

export interface ChallengeLog {
  id: string;                  // `clog-{challengeId}-{challengeHabitId}-{userId}-{dateKey}`
  challengeId: string;
  challengeHabitId: string;
  userId: string;
  dateKey: string;             // 'YYYY-MM-DD' en hora Bogotá
  status: HabitLogStatus;      // 'completed' | 'empty' | 'not_applicable'
  numericValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeActivity {
  id: string;
  challengeId: string;
  userId: string;
  actionType: 'check_in' | 'joined' | 'milestone' | 'goal_completed';
  message: string;             // e.g. 'Jesús completó Entrenar'
  habitTitle?: string;
  challengeHabitId?: string;   // ID del hábito asociado (si es check_in)
  dateKey?: string;            // Fecha del check-in (YYYY-MM-DD en hora Bogotá)
  createdAt: string;           // ISO UTC
}

export interface ChallengeGoal {
  id: string;
  challengeId: string;
  title: string;               // e.g. 'Completar 20 sesiones de gym'
  targetValue: number;
  currentValue: number;
  unit?: string;               // e.g. 'días', 'sesiones'
  isCompleted: boolean;
  createdAt: string;
}

// Estructura de cumplimiento individual de un miembro en el reto
export interface ChallengeMemberCompliance {
  member: ChallengeMember;
  user: User;
  completedDays: number;       // Días en los que cumplió los hábitos del reto
  expectedDays: number;        // Días transcurridos desde max(startDate, joinedAt) hasta today
  percentage: number;          // 0..100%
  currentStreak: number;       // Racha ininterrumpida
  bestStreak: number;          // Mejor racha en el reto
  rankPosition: number;        // 1, 2, 3... (empates reciben el mismo número)
  isTied: boolean;             // True si comparte la posición con otro participante
}

// Resumen analítico global del reto (KPIs para cabecera HUD)
export interface ChallengeSummaryKpis {
  completionRate: number;              // Porcentaje global del equipo (0..100%)
  totalChecksCompleted: number;        // e.g. 206
  totalChecksExpected: number;         // e.g. 240
  daysRemaining: number;               // Días que faltan para endDate
  currentTeamStreak: number;           // Racha colectiva activa
  bestTeamStreak: number;              // Mejor racha colectiva
  totalMembersCount: number;
  activeMembersCount: number;
  mostConsistentMember: ChallengeMemberCompliance | null;
}

// Día dentro de la matriz de un reto
export interface ChallengeDayInfo {
  dayNumber: number;           // 1..31
  dateKey: string;             // 'YYYY-MM-DD'
  dayName: string;             // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  dayIndexInChallenge: number; // Día 1 del reto, Día 2, etc.
  isOutsideChallenge?: boolean;// True si la fecha está fuera del rango del reto
}

// Sub-pestañas internas dentro de la vista de detalle del reto
export type ChallengeSubTab =
  | 'matrix'
  | 'progress'
  | 'habits'
  | 'goals'
  | 'tasks'
  | 'notes';
