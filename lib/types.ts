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

export interface Task {
  id: string;
  projectId?: string; // ID del Proyecto al que pertenece
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
}

export type SpaceFilter = 'all' | 'mine' | 'peer' | string;

export type AppView = 'board' | 'calendar' | 'dashboard' | 'admin';
