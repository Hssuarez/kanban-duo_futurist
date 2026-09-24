export type TaskStatus = 'iniciado' | 'trabajando' | 'finalizado';

export type TaskPriority = 'baja' | 'media' | 'alta';

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  lastLoginCity?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  title: string;
  url: string;
  type?: 'link' | 'github' | 'figma' | 'doc';
}

export type HudTheme = 'cyan' | 'violet' | 'matrix' | 'amber';

export interface Task {
  id: string;
  projectId?: string; // ID del Proyecto al que pertenece
  challengeId?: string; // Opcional: vinculado a un reto de Habit Core
  habitId?: string;     // Opcional: vinculado a un hábito de Habit Core
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string; // User ID
  createdBy: string;  // User ID
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
  dueDate?: string;
  startedAt?: string;   // Primera fecha en que la tarea pasó a iniciado
  completedAt?: string; // Fecha en que la tarea pasó a finalizado
  subtasks?: Subtask[];
  tags?: string[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  timeSpentSeconds?: number;
}

export interface TaskStatusHistory {
  id: string;
  taskId: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  changedBy?: string;
  changedByName: string;
  createdAt: string; // ISO string UTC
  observations?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  taskTitle: string;
  timestamp: string;
}

export interface SecurityLog {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId?: string;
  targetUserName?: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
  city?: string;
  country?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  deviceName?: string;
  os?: string;
  browser?: string;
}

export type SpaceFilter = 'all' | 'mine' | 'peer' | string;

export type AppDomain = 'workspace' | 'habits';

export type AppView =
  | 'command_center'
  | 'board'
  | 'calendar'
  | 'dashboard'
  | 'admin'
  | 'habits'
  | 'challenges'
  | 'goals'
  | 'progress';
