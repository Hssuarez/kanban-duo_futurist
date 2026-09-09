import { Task, User, ActivityLog, SecurityLog, TaskStatus, UserRole } from './types';
import { hashPassword, verifyPassword } from './auth';

// Hashes calculados para las contraseñas por defecto
// Admin123!, Alex123!, Beatriz123!
export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Diana Méndez (Admin)',
    email: 'admin@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#6366f1', // indigo
    role: 'admin',
    passwordHash: '', // se inicializa dinámicamente si falta
    isActive: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#3b82f6', // blue
    role: 'member',
    passwordHash: '',
    isActive: true,
    createdAt: '2026-09-02T10:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'user-beatriz',
    name: 'Beatriz Castro',
    email: 'beatriz@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: '#8b5cf6', // purple
    role: 'member',
    passwordHash: '',
    isActive: true,
    createdAt: '2026-09-03T10:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Configurar arquitectura inicial y Next.js',
    description: 'Estructurar proyecto, configurar Tailwind CSS y componentes base.',
    status: 'finalizado',
    priority: 'alta',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    dueDate: '2026-09-12',
  },
  {
    id: 'task-2',
    title: 'Diseñar interfaz del tablero Kanban con 3 columnas',
    description: 'Columnas: Iniciado, Trabajando y Finalizado con drag and drop fluido.',
    status: 'trabajando',
    priority: 'alta',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '2026-09-15',
  },
  {
    id: 'task-3',
    title: 'Integrar sistema de filtros por espacio de trabajo',
    description: 'Permitir alternar entre Mi Espacio, Espacio de Compañero y Vista de Equipo.',
    status: 'iniciado',
    priority: 'media',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '2026-09-18',
  },
  {
    id: 'task-4',
    title: 'Definir paleta de diseño y experiencia móvil',
    description: 'Asegurar diseño responsivo para móviles, tablets y monitores grandes.',
    status: 'finalizado',
    priority: 'media',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueDate: '2026-09-11',
  },
  {
    id: 'task-5',
    title: 'Implementar widget de estado activo del compañero',
    description: 'Mostrar claramente en el encabezado qué tarea está desarrollando el otro usuario.',
    status: 'trabajando',
    priority: 'alta',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '2026-09-14',
  },
  {
    id: 'task-6',
    title: 'Preparar configuración de despliegue en Vercel',
    description: 'Documentar variables de entorno y soporte de base de datos gratuita en la nube.',
    status: 'iniciado',
    priority: 'baja',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '2026-09-20',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'user-alex',
    userName: 'Alex Rivera',
    action: 'ha completado la tarea',
    taskTitle: 'Configurar arquitectura inicial y Next.js',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'log-2',
    userId: 'user-beatriz',
    userName: 'Beatriz Castro',
    action: 'está trabajando en',
    taskTitle: 'Implementar widget de estado activo del compañero',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'sec-1',
    adminId: 'user-admin',
    adminName: 'Diana Méndez (Admin)',
    action: 'Sistema inicializado',
    details: 'Se configuraron las credenciales y políticas de acceso de usuarios.',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const STORAGE_KEYS = {
  USERS: 'kanban_duo_users_v2',
  SESSION_USER_ID: 'kanban_duo_session_user_id_v2',
  TASKS: 'kanban_duo_tasks',
  LOGS: 'kanban_duo_activity_logs',
  SECURITY_LOGS: 'kanban_duo_security_logs_v2',
};

// Broadcast Channel for live multi-tab sync
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  syncChannel = new BroadcastChannel('kanban_duo_channel_v2');
}

export function notifySync(type: 'tasks' | 'users' | 'logs' | 'security' | 'session') {
  if (syncChannel) {
    syncChannel.postMessage({ type, timestamp: Date.now() });
  }
}

export function subscribeToSync(callback: (type: string) => void) {
  if (!syncChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type) {
      callback(event.data.type);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel?.removeEventListener('message', handler);
}

// -------------------------------------------------------------
// USERS & AUTHENTICATION API
// -------------------------------------------------------------

export function getUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    // Inicializar con hashes por defecto de forma asíncrona
    initializeDefaultUsers();
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_USERS;
  }
}

export async function initializeDefaultUsers() {
  if (typeof window === 'undefined') return;
  const adminHash = await hashPassword('Admin123!');
  const alexHash = await hashPassword('Alex123!');
  const beatrizHash = await hashPassword('Beatriz123!');

  const users: User[] = [
    { ...DEFAULT_USERS[0], passwordHash: adminHash },
    { ...DEFAULT_USERS[1], passwordHash: alexHash },
    { ...DEFAULT_USERS[2], passwordHash: beatrizHash },
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  notifySync('users');
}

export function saveUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  notifySync('users');
}

export function getSessionUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID);
  if (!userId) return null;
  const users = getUsers();
  const user = users.find((u) => u.id === userId && u.isActive);
  return user || null;
}

export async function loginWithCredentials(
  email: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  let users = getUsers();

  // Asegurar inicialización de hashes si es primera vez
  if (users.some((u) => !u.passwordHash)) {
    await initializeDefaultUsers();
    users = getUsers();
  }

  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return { success: false, error: 'Usuario no encontrado con este correo.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Tu cuenta ha sido suspendida por el administrador.' };
  }

  const matches = await verifyPassword(passwordPlain, user.passwordHash);
  if (!matches) {
    return { success: false, error: 'Contraseña incorrecta. Por favor verifica tus credenciales.' };
  }

  // Registrar login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, user.id);
  notifySync('session');

  logSecurityEvent({
    adminId: user.id,
    adminName: user.name,
    action: 'Inicio de Sesión',
    details: `${user.name} ha iniciado sesión con éxito.`,
  });

  return { success: true, user };
}

export function logout() {
  if (typeof window === 'undefined') return;
  const currentUser = getSessionUser();
  if (currentUser) {
    logSecurityEvent({
      adminId: currentUser.id,
      adminName: currentUser.name,
      action: 'Cierre de Sesión',
      details: `${currentUser.name} cerró sesión.`,
    });
  }
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
  notifySync('session');
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT ACTIONS (NOMBRES, CONTRASEÑAS, FOTOS, ROLES)
// -------------------------------------------------------------

export function adminUpdateUser(
  admin: User,
  targetUserId: string,
  updates: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: UserRole;
    isActive?: boolean;
  }
): { success: boolean; error?: string } {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === targetUserId);
  if (index === -1) return { success: false, error: 'Usuario no encontrado' };

  const target = users[index];

  // Regla de seguridad: no permitir suspender o quitar rol al último admin
  if (target.role === 'admin' && updates.role === 'member') {
    const adminCount = users.filter((u) => u.role === 'admin' && u.isActive).length;
    if (adminCount <= 1) {
      return { success: false, error: 'No puedes degradar al único administrador del sistema.' };
    }
  }

  const updated: User = {
    ...target,
    ...updates,
  };

  users[index] = updated;
  saveUsers(users);

  logSecurityEvent({
    adminId: admin.id,
    adminName: admin.name,
    targetUserId: target.id,
    targetUserName: target.name,
    action: 'Modificación de Usuario',
    details: `El administrador ${admin.name} actualizó los datos de ${target.name} (Nombre: "${updated.name}", Foto: "${updated.avatar ? 'Actualizada' : 'Sin cambio'}", Rol: "${updated.role}").`,
  });

  return { success: true };
}

export async function adminChangePassword(
  admin: User,
  targetUserId: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  if (newPasswordPlain.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const users = getUsers();
  const index = users.findIndex((u) => u.id === targetUserId);
  if (index === -1) return { success: false, error: 'Usuario no encontrado' };

  const target = users[index];
  const newHash = await hashPassword(newPasswordPlain);

  users[index] = {
    ...target,
    passwordHash: newHash,
  };
  saveUsers(users);

  logSecurityEvent({
    adminId: admin.id,
    adminName: admin.name,
    targetUserId: target.id,
    targetUserName: target.name,
    action: 'Cambio de Contraseña por Administrador',
    details: `El administrador ${admin.name} cambió la contraseña del usuario ${target.name}.`,
  });

  return { success: true };
}

export async function adminCreateUser(
  admin: User,
  data: {
    name: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    avatar?: string;
    color?: string;
  }
): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existing) {
    return { success: false, error: 'Ya existe un usuario con este correo electrónico.' };
  }

  if (data.passwordPlain.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const passwordHash = await hashPassword(data.passwordPlain);
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    avatar:
      data.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name.trim())}`,
    color: data.color || '#3b82f6',
    role: data.role,
    passwordHash,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  logSecurityEvent({
    adminId: admin.id,
    adminName: admin.name,
    targetUserId: newUser.id,
    targetUserName: newUser.name,
    action: 'Creación de Usuario',
    details: `El administrador ${admin.name} creó al usuario ${newUser.name} (${newUser.email}) con rol ${newUser.role}.`,
  });

  return { success: true, user: newUser };
}

export function adminDeleteUser(
  admin: User,
  targetUserId: string
): { success: boolean; error?: string } {
  const users = getUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target) return { success: false, error: 'Usuario no encontrado' };

  if (target.id === admin.id) {
    return { success: false, error: 'No puedes eliminar tu propia cuenta de administrador.' };
  }

  if (target.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return { success: false, error: 'No puedes eliminar al único administrador del sistema.' };
    }
  }

  const remaining = users.filter((u) => u.id !== targetUserId);
  saveUsers(remaining);

  logSecurityEvent({
    adminId: admin.id,
    adminName: admin.name,
    targetUserId: target.id,
    targetUserName: target.name,
    action: 'Eliminación de Usuario',
    details: `El administrador ${admin.name} eliminó al usuario ${target.name}.`,
  });

  return { success: true };
}

// Actualización de su propio perfil por el usuario
export async function updateSelfProfile(
  userId: string,
  updates: {
    name?: string;
    avatar?: string;
    newPasswordPlain?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { success: false, error: 'Usuario no encontrado' };

  const user = users[index];
  let newHash = user.passwordHash;

  if (updates.newPasswordPlain) {
    if (updates.newPasswordPlain.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    newHash = await hashPassword(updates.newPasswordPlain);
  }

  const updated: User = {
    ...user,
    name: updates.name ? updates.name.trim() : user.name,
    avatar: updates.avatar || user.avatar,
    passwordHash: newHash,
  };

  users[index] = updated;
  saveUsers(users);

  logSecurityEvent({
    adminId: user.id,
    adminName: user.name,
    action: 'Actualización de Perfil',
    details: `${user.name} actualizó sus datos de perfil (Nombre: "${updated.name}", Foto: "${updates.avatar ? 'Actualizada' : 'Sin cambios'}", Contraseña: "${updates.newPasswordPlain ? 'Modificada' : 'Sin cambios'}").`,
  });

  return { success: true };
}

// -------------------------------------------------------------
// TASKS API
// -------------------------------------------------------------

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  notifySync('tasks');
}

export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, actorUser: User): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...taskData,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.unshift(newTask);
  saveTasks(tasks);

  logActivity({
    userId: actorUser.id,
    userName: actorUser.name,
    action: 'ha creado la tarea',
    taskTitle: newTask.title,
  });

  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>, actorUser: User): Task | null {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const oldTask = tasks[index];
  const updatedTask: Task = {
    ...oldTask,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  saveTasks(tasks);

  if (updates.status && updates.status !== oldTask.status) {
    const statusNames: Record<TaskStatus, string> = {
      iniciado: 'Iniciado',
      trabajando: 'Trabajando',
      finalizado: 'Finalizado',
    };
    logActivity({
      userId: actorUser.id,
      userName: actorUser.name,
      action: `movió a ${statusNames[updates.status]} la tarea`,
      taskTitle: updatedTask.title,
    });
  }

  return updatedTask;
}

export function deleteTask(id: string, actorUser: User): boolean {
  const tasks = getTasks();
  const taskToDelete = tasks.find((t) => t.id === id);
  if (!taskToDelete) return false;

  const remaining = tasks.filter((t) => t.id !== id);
  saveTasks(remaining);

  logActivity({
    userId: actorUser.id,
    userName: actorUser.name,
    action: 'eliminó la tarea',
    taskTitle: taskToDelete.title,
  });

  return true;
}

// -------------------------------------------------------------
// ACTIVITY & SECURITY LOGS
// -------------------------------------------------------------

export function getActivityLogs(): ActivityLog[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_LOGS;
  }
}

export function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...logs].slice(0, 30);
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
  notifySync('logs');
}

export function getSecurityLogs(): SecurityLog[] {
  if (typeof window === 'undefined') return INITIAL_SECURITY_LOGS;
  const stored = localStorage.getItem(STORAGE_KEYS.SECURITY_LOGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(INITIAL_SECURITY_LOGS));
    return INITIAL_SECURITY_LOGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SECURITY_LOGS;
  }
}

export function logSecurityEvent(event: Omit<SecurityLog, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const logs = getSecurityLogs();
  const newLog: SecurityLog = {
    ...event,
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newLog, ...logs].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(updated));
  notifySync('security');
}
