import { Task, User, ActivityLog, SecurityLog, TaskStatus, UserRole, TaskStatusHistory, Project } from './types';
import { hashPassword, verifyPassword } from './auth';
import { getOrInitSupabase, getCachedSupabase } from './supabaseClient';


export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-default',
    name: 'Protocolo Alpha (Proyecto Principal)',
    description: 'Tablero central del sistema con el equipo inicial.',
    color: '#06b6d4',
    createdBy: 'user-admin',
    memberIds: ['user-admin', 'user-alex', 'user-beatriz'],
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Diana Méndez (Admin)',
    email: 'admin@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#6366f1',
    role: 'admin',
    passwordHash: '',
    isActive: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#3b82f6',
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
    color: '#8b5cf6',
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
    projectId: 'proj-default',
    title: 'Configurar arquitectura inicial y Next.js',
    description: 'Estructurar proyecto, configurar Tailwind CSS y componentes base.',
    status: 'finalizado',
    priority: 'alta',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    dueDate: '2026-09-12',
  },
  {
    id: 'task-2',
    projectId: 'proj-default',
    title: 'Diseñar interfaz del tablero Kanban con 3 columnas',
    description: 'Columnas: Iniciado, Trabajando y Finalizado con drag and drop fluido.',
    status: 'trabajando',
    priority: 'alta',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    dueDate: '2026-09-15',
  },
  {
    id: 'task-3',
    projectId: 'proj-default',
    title: 'Integrar sistema de filtros por espacio de trabajo',
    description: 'Permitir alternar entre Mi Espacio, Espacio de Compañero y Vista de Equipo.',
    status: 'iniciado',
    priority: 'media',
    assignedTo: 'user-alex',
    createdBy: 'user-alex',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    dueDate: '2026-09-18',
  },
  {
    id: 'task-4',
    projectId: 'proj-default',
    title: 'Definir paleta de diseño y experiencia móvil',
    description: 'Asegurar diseño responsivo para móviles, tablets y monitores grandes.',
    status: 'finalizado',
    priority: 'media',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueDate: '2026-09-11',
  },
  {
    id: 'task-5',
    projectId: 'proj-default',
    title: 'Implementar widget de estado activo del compañero',
    description: 'Mostrar claramente en el encabezado qué tarea está desarrollando el otro usuario.',
    status: 'trabajando',
    priority: 'alta',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    dueDate: '2026-09-14',
  },
  {
    id: 'task-6',
    projectId: 'proj-default',
    title: 'Preparar configuración de despliegue en Vercel',
    description: 'Documentar variables de entorno y soporte de base de datos gratuita en la nube.',
    status: 'iniciado',
    priority: 'baja',
    assignedTo: 'user-beatriz',
    createdBy: 'user-beatriz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
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


const INITIAL_TASK_HISTORY: TaskStatusHistory[] = [
  {
    id: 'hist-task-1-1',
    taskId: 'task-1',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    observations: 'Creación e inicio de tarea en el sistema.',
  },
  {
    id: 'hist-task-1-2',
    taskId: 'task-1',
    previousStatus: 'iniciado',
    newStatus: 'trabajando',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
    observations: 'Comenzando desarrollo y configuración base.',
  },
  {
    id: 'hist-task-1-3',
    taskId: 'task-1',
    previousStatus: 'trabajando',
    newStatus: 'finalizado',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    observations: 'Arquitectura configurada con éxito.',
  },
  {
    id: 'hist-task-2-1',
    taskId: 'task-2',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    observations: 'Creación de tarea.',
  },
  {
    id: 'hist-task-2-2',
    taskId: 'task-2',
    previousStatus: 'iniciado',
    newStatus: 'trabajando',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    observations: 'En progreso activo de diseño de columnas.',
  },
  {
    id: 'hist-task-3-1',
    taskId: 'task-3',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-alex',
    changedByName: 'Alex Rivera',
    createdAt: new Date().toISOString(),
    observations: 'Tarea iniciada en el espacio de trabajo.',
  },
  {
    id: 'hist-task-4-1',
    taskId: 'task-4',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    observations: 'Inicio de definición de estilos.',
  },
  {
    id: 'hist-task-4-2',
    taskId: 'task-4',
    previousStatus: 'iniciado',
    newStatus: 'trabajando',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    observations: 'Maquetando paleta Cyberpunk y responsivo.',
  },
  {
    id: 'hist-task-4-3',
    taskId: 'task-4',
    previousStatus: 'trabajando',
    newStatus: 'finalizado',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    observations: 'Diseño móvil verificado y optimizado.',
  },
  {
    id: 'hist-task-5-1',
    taskId: 'task-5',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    observations: 'Creación de tarea.',
  },
  {
    id: 'hist-task-5-2',
    taskId: 'task-5',
    previousStatus: 'iniciado',
    newStatus: 'trabajando',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    observations: 'Implementando componente PeerActivityBar.',
  },
  {
    id: 'hist-task-6-1',
    taskId: 'task-6',
    previousStatus: null,
    newStatus: 'iniciado',
    changedBy: 'user-beatriz',
    changedByName: 'Beatriz Castro',
    createdAt: new Date().toISOString(),
    observations: 'Preparando configuración cloud.',
  },
];

const STORAGE_KEYS = {
  USERS: 'kanban_duo_users_v2',
  SESSION_USER_ID: 'kanban_duo_session_user_id_v2',
  TASKS: 'kanban_duo_tasks',
  LOGS: 'kanban_duo_activity_logs',
  SECURITY_LOGS: 'kanban_duo_security_logs_v2',
  TASK_HISTORY: 'kanban_duo_task_history_v3',
  PROJECTS: 'kanban_duo_projects_v4',
  ACTIVE_PROJECT_ID: 'kanban_duo_active_project_id_v4',
};

// Broadcast Channel for live multi-tab and local in-tab sync
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  syncChannel = new BroadcastChannel('kanban_duo_channel_v2');
}

const localListeners = new Set<(type: string) => void>();

export function notifySync(type: 'tasks' | 'users' | 'logs' | 'security' | 'session' | 'history' | 'projects' | 'active_project' | 'notifications' | 'habits' | 'challenges') {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, timestamp: Date.now() });
    } catch {}
  }
  localListeners.forEach((cb) => {
    try {
      cb(type);
    } catch {}
  });
}

export function subscribeToSync(callback: (type: string) => void) {
  localListeners.add(callback);
  const handler = (event: MessageEvent) => {
    if (event.data?.type) {
      callback(event.data.type);
    }
  };
  if (syncChannel) {
    syncChannel.addEventListener('message', handler);
  }
  return () => {
    localListeners.delete(callback);
    syncChannel?.removeEventListener('message', handler);
  };
}

// -------------------------------------------------------------
// SUPABASE REALTIME CLOUD INTEGRATION (BIDIRECTIONAL)
// -------------------------------------------------------------

let realtimeSubscribed = false;

export async function syncCloudUsers(): Promise<User[]> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') return getUsers();

  try {
    const { data, error } = await client.from('users').select('*');
    if (error) {
      console.warn('Error al consultar usuarios en Supabase:', error);
      return getUsers();
    }
    if (data && data.length > 0) {
      const currentUsers = getUsers();
      const mapped: User[] = data.map((u) => {
        const local = currentUsers.find((lu) => lu.id === u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || '',
          color: u.color || '#3b82f6',
          role: u.role as UserRole,
          passwordHash: u.password_hash || '',
          isActive: u.is_active ?? true,
          createdAt: u.created_at || new Date().toISOString(),
          lastLogin: u.last_login || local?.lastLogin,
          lastLoginIp: u.last_login_ip || local?.lastLoginIp,
          lastLoginDevice: u.last_login_device || local?.lastLoginDevice,
          lastLoginCity: u.last_login_city || local?.lastLoginCity,
        };
      });

      // Cross-reference with security logs to backfill IP and device if not in users table
      const secLogs = getSecurityLogs();
      mapped.forEach((user) => {
        if (!user.lastLoginIp || !user.lastLoginDevice) {
          const userLog = secLogs.find(
            (l) =>
              (l.adminId === user.id ||
                l.targetUserId === user.id ||
                (l.adminName && l.adminName.toLowerCase().includes(user.name.toLowerCase()))) &&
              (l.ip || l.deviceName) &&
              l.action.toLowerCase().includes('inicio')
          );
          if (userLog) {
            if (!user.lastLoginIp && userLog.ip) user.lastLoginIp = userLog.ip;
            if (!user.lastLoginDevice && userLog.deviceName) {
              user.lastLoginDevice = `${userLog.deviceName}${userLog.os ? ` (${userLog.os} · ${userLog.browser || ''})` : ''}`;
            }
            if (!user.lastLoginCity && userLog.city) user.lastLoginCity = userLog.city;
            if (!user.lastLogin && userLog.timestamp) user.lastLogin = userLog.timestamp;
          }
        }
      });

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mapped));
      notifySync('users');
      return mapped;
    }
  } catch (err) {
    console.warn('Fallo de red con Supabase Users:', err);
  }
  return getUsers();
}

export async function syncCloudTasks(): Promise<Task[]> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') return getTasks();

  try {
    const { data, error } = await client.from('tasks').select('*');
    if (error) {
      console.warn('Error al consultar tareas en Supabase:', error);
      return getTasks();
    }
    if (data) {
      const currentTasks = getTasks();
      const mapped: Task[] = data.map((t) => {
        const local = currentTasks.find((lt) => lt.id === t.id);
        return {
          id: t.id,
          projectId: t.project_id || 'proj-default',
          title: t.title,
          description: t.description || '',
          status: t.status as TaskStatus,
          priority: t.priority,
          assignedTo: t.assigned_to,
          createdBy: t.created_by,
          dueDate: t.due_date,
          startedAt: t.started_at || undefined,
          completedAt: t.completed_at || undefined,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          subtasks: t.subtasks || local?.subtasks,
          tags: t.tags || local?.tags,
          comments: t.comments || local?.comments,
          attachments: t.attachments || local?.attachments,
          timeSpentSeconds: t.time_spent_seconds || local?.timeSpentSeconds,
        };
      });
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mapped));
      notifySync('tasks');
      return mapped;
    }
  } catch (err) {
    console.warn('Fallo de red con Supabase Tasks:', err);
  }
  return getTasks();
}


export function getLocalStatusHistory(): TaskStatusHistory[] {
  if (typeof window === 'undefined') return INITIAL_TASK_HISTORY;
  const stored = localStorage.getItem(STORAGE_KEYS.TASK_HISTORY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(INITIAL_TASK_HISTORY));
    return INITIAL_TASK_HISTORY;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_TASK_HISTORY;
  }
}

export function saveLocalStatusHistory(history: TaskStatusHistory[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(history));
  notifySync('history');
}

export async function recordStatusHistory(
  event: Omit<TaskStatusHistory, 'id'>
): Promise<TaskStatusHistory> {
  const history = getLocalStatusHistory();
  const newRecord: TaskStatusHistory = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...event,
  };
  history.push(newRecord);
  saveLocalStatusHistory(history);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      await client.from('task_status_history').insert({
        id: newRecord.id,
        task_id: newRecord.taskId,
        previous_status: newRecord.previousStatus,
        new_status: newRecord.newStatus,
        changed_by: newRecord.changedBy || null,
        changed_by_name: newRecord.changedByName,
        created_at: newRecord.createdAt,
        observations: newRecord.observations || null,
      });
    } catch (e) {
      console.warn('Error guardando histórico en Supabase:', e);
    }
  }

  return newRecord;
}

export async function getTaskStatusHistory(taskId: string): Promise<TaskStatusHistory[]> {
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('task_status_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          taskId: d.task_id,
          previousStatus: d.previous_status,
          newStatus: d.new_status,
          changedBy: d.changed_by,
          changedByName: d.changed_by_name,
          createdAt: d.created_at,
          observations: d.observations,
        }));
      }
    } catch (e) {
      console.warn('Error consultando histórico en Supabase:', e);
    }
  }

  const allLocal = getLocalStatusHistory();
  return allLocal
    .filter((h) => h.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getAllStatusHistory(): Promise<TaskStatusHistory[]> {
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('task_status_history')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((d) => ({
          id: d.id,
          taskId: d.task_id,
          previousStatus: d.previous_status,
          newStatus: d.new_status,
          changedBy: d.changed_by,
          changedByName: d.changed_by_name,
          createdAt: d.created_at,
          observations: d.observations,
        }));
        saveLocalStatusHistory(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error consultando todo el histórico en Supabase:', e);
    }
  }

  return getLocalStatusHistory();
}

export async function syncCloudStatusHistory(): Promise<TaskStatusHistory[]> {
  return getAllStatusHistory();
}

export async function initCloudSync() {
  if (typeof window === 'undefined') return;

  const client = await getOrInitSupabase();
  if (!client) return;

  // Initial cloud sync
  await syncCloudProjects();
  await syncCloudSecurityLogs();
  await syncCloudUsers();
  await syncCloudTasks();
  await syncCloudStatusHistory();

  // Sincronizar retos compartidos (challenges) en el arranque global
  try {
    const { syncCloudChallenges } = await import('./challengeStorage');
    await syncCloudChallenges();
  } catch (e) {
    console.warn('Error inicializando retos en initCloudSync:', e);
  }

  // Setup WebSocket listener once
  if (!realtimeSubscribed) {
    realtimeSubscribed = true;
    try {
      client
        .channel('kanban-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          syncCloudProjects();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          syncCloudUsers();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          syncCloudTasks();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_status_history' }, () => {
          syncCloudStatusHistory();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'security_logs' }, () => {
          syncCloudSecurityLogs();
          syncCloudUsers();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as any).id) {
            import('./challengeStorage').then((m) => m.handleRemoteChallengeDeleted((payload.old as any).id));
          } else {
            import('./challengeStorage').then((m) => m.syncCloudChallenges());
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_members' }, () => {
          import('./challengeStorage').then((m) => m.syncCloudChallenges());
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_habits' }, () => {
          import('./challengeStorage').then((m) => m.syncCloudChallenges());
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_logs' }, (payload: any) => {
          if (payload?.eventType === 'DELETE' && payload.old) {
            import('./challengeStorage').then((m) => m.handleRemoteChallengeLogDeleted(payload.old));
          } else {
            import('./challengeStorage').then((m) => m.syncCloudChallenges());
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_goals' }, () => {
          import('./challengeStorage').then((m) => m.syncCloudChallenges());
        })
        .subscribe();
    } catch (e) {
      console.warn('Error conectando canal Realtime:', e);
    }
  }
}

// -------------------------------------------------------------
// USERS & AUTHENTICATION API
// -------------------------------------------------------------

export function getUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
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

  // Initialize password hashes locally
  const adminHash = await hashPassword('Admin123!');
  const alexHash = await hashPassword('Alex123!');
  const beatrizHash = await hashPassword('Beatriz123!');

  const users: User[] = [
    { ...DEFAULT_USERS[0], passwordHash: adminHash },
    { ...DEFAULT_USERS[1], passwordHash: alexHash },
    { ...DEFAULT_USERS[2], passwordHash: beatrizHash },
  ];

  const existing = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existing) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifySync('users');
  }

  // Attempt sync with Cloud
  await initCloudSync();
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
  // Sync first to make sure we have the latest user list and passwords
  let users = await syncCloudUsers();

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

  // Capture Connection and Device Audit Info
  let auditInfo: {
    ip: string;
    city?: string;
    country?: string;
    region?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    deviceName: string;
    os: string;
    browser: string;
  } = {
    ip: '127.0.0.1',
    city: '',
    country: '',
    deviceType: 'desktop',
    deviceName: 'PC',
    os: 'Desconocido',
    browser: 'Web',
  };

  try {
    const { getClientConnectionInfo } = await import('./deviceDetector');
    auditInfo = await getClientConnectionInfo();
  } catch (err) {
    console.warn('Error capturando información de conexión:', err);
  }

  user.lastLogin = new Date().toISOString();
  user.lastLoginIp = auditInfo.ip;
  user.lastLoginDevice = `${auditInfo.deviceName} (${auditInfo.os} · ${auditInfo.browser})`;
  user.lastLoginCity = auditInfo.city ? `${auditInfo.city}${auditInfo.country ? `, ${auditInfo.country}` : ''}` : undefined;
  saveUsers(users);

  // Update Supabase
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { error } = await client.from('users').update({
        last_login: user.lastLogin,
        last_login_ip: user.lastLoginIp,
        last_login_device: user.lastLoginDevice,
        last_login_city: user.lastLoginCity,
      }).eq('id', user.id);

      if (error) {
        // Fallback to update only last_login if audit columns don't exist yet in Supabase
        await client.from('users').update({
          last_login: user.lastLogin,
        }).eq('id', user.id);
      }
    } catch {}
  }

  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, user.id);
  notifySync('session');

  logSecurityEvent({
    adminId: user.id,
    adminName: user.name,
    action: 'Inicio de Sesión',
    details: `${user.name} ha iniciado sesión con éxito desde ${auditInfo.deviceName} (${auditInfo.os} · ${auditInfo.browser}).`,
    ip: auditInfo.ip,
    city: auditInfo.city,
    country: auditInfo.country,
    deviceType: auditInfo.deviceType,
    deviceName: auditInfo.deviceName,
    os: auditInfo.os,
    browser: auditInfo.browser,
  });

  return { success: true, user };
}

/**
 * Automatically audits the current active session if IP or device has changed
 */
export async function auditSessionIfChanged(user: User) {
  if (typeof window === 'undefined') return;
  try {
    const { getClientConnectionInfo } = await import('./deviceDetector');
    const auditInfo = await getClientConnectionInfo();
    const formattedDevice = `${auditInfo.deviceName} (${auditInfo.os} · ${auditInfo.browser})`;

    if (
      !user.lastLoginDevice ||
      user.lastLoginDevice !== formattedDevice ||
      !user.lastLoginIp ||
      user.lastLoginIp !== auditInfo.ip
    ) {
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx].lastLoginIp = auditInfo.ip;
        users[idx].lastLoginDevice = formattedDevice;
        users[idx].lastLoginCity = auditInfo.city ? `${auditInfo.city}${auditInfo.country ? `, ${auditInfo.country}` : ''}` : undefined;
        if (!users[idx].lastLogin) users[idx].lastLogin = new Date().toISOString();
        saveUsers(users);

        const client = await getOrInitSupabase();
        if (client) {
          try {
            const { error } = await client.from('users').update({
              last_login: users[idx].lastLogin,
              last_login_ip: users[idx].lastLoginIp,
              last_login_device: users[idx].lastLoginDevice,
              last_login_city: users[idx].lastLoginCity,
            }).eq('id', user.id);
            if (error) {
              await client.from('users').update({
                last_login: users[idx].lastLogin,
              }).eq('id', user.id);
            }
          } catch {}
        }

        logSecurityEvent({
          adminId: user.id,
          adminName: user.name,
          action: 'Inicio de Sesión',
          details: `${user.name} conectado desde ${auditInfo.deviceName} (${auditInfo.os} · ${auditInfo.browser}).`,
          ip: auditInfo.ip,
          city: auditInfo.city,
          country: auditInfo.country,
          deviceType: auditInfo.deviceType,
          deviceName: auditInfo.deviceName,
          os: auditInfo.os,
          browser: auditInfo.browser,
        });
      }
    }
  } catch {}
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
      ip: currentUser.lastLoginIp,
      deviceName: currentUser.lastLoginDevice,
    });
  }
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
  notifySync('session');
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT ACTIONS (NOMBRES, CONTRASEÑAS, FOTOS, ROLES)
// -------------------------------------------------------------

export async function adminUpdateUser(
  admin: User,
  targetUserId: string,
  updates: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: UserRole;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === targetUserId);
  if (index === -1) return { success: false, error: 'Usuario no encontrado' };

  const target = users[index];

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

  // Guardar en Supabase y esperar resultado
  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client
      .from('users')
      .update({
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        role: updated.role,
        is_active: updated.isActive,
      })
      .eq('id', targetUserId);

    if (error) {
      console.error('Error guardando usuario en Supabase:', error);
    }
  }

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

  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', targetUserId);

    if (error) {
      console.error('Error cambiando clave en Supabase:', error);
    }
  }

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

  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client.from('users').insert({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      color: newUser.color,
      role: newUser.role,
      password_hash: passwordHash,
      is_active: true,
    });
    if (error) {
      console.error('Error creando usuario en Supabase:', error);
    }
  }

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

export async function adminDeleteUser(
  admin: User,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
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

  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client.from('users').delete().eq('id', targetUserId);
    if (error) {
      console.error('Error eliminando usuario en Supabase:', error);
    }
  }

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

  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client
      .from('users')
      .update({
        name: updated.name,
        avatar: updated.avatar,
        password_hash: newHash,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error actualizando perfil en Supabase:', error);
    }
  }

  logSecurityEvent({
    adminId: user.id,
    adminName: user.name,
    action: 'Actualización de Perfil',
    details: `${user.name} actualizó sus datos de perfil (Nombre: "${updated.name}", Foto: "${updates.avatar ? 'Actualizada' : 'Sin cambios'}", Contraseña: "${updates.newPasswordPlain ? 'Modificada' : 'Sin cambios'}").`,
  });

  return { success: true };
}


// -------------------------------------------------------------
// PROJECTS API & CLOUD SYNC
// -------------------------------------------------------------

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return DEFAULT_PROJECTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS;
  }
  try {
    const list: Project[] = JSON.parse(stored);
    if (!list.some((p) => p.id === 'proj-default')) {
      list.unshift(DEFAULT_PROJECTS[0]);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    }
    return list;
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  if (!projects.some((p) => p.id === 'proj-default')) {
    projects.unshift(DEFAULT_PROJECTS[0]);
  }
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  notifySync('projects');
}

export function getActiveProjectId(): string {
  if (typeof window === 'undefined') return 'proj-default';
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  if (!stored) return 'proj-default';
  return stored;
}

export function setActiveProjectId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  notifySync('active_project');
}

export async function syncCloudProjects(): Promise<Project[]> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') return getProjects();

  try {
    const { data, error } = await client.from('projects').select('*');
    if (error) {
      console.warn('Error al consultar proyectos en Supabase:', error);
      return getProjects();
    }
    if (data && data.length > 0) {
      const mapped: Project[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        color: p.color || '#06b6d4',
        createdBy: p.created_by,
        memberIds: Array.isArray(p.member_ids) ? p.member_ids : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      if (!mapped.some((p) => p.id === 'proj-default')) {
        mapped.unshift(DEFAULT_PROJECTS[0]);
      }

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(mapped));
      notifySync('projects');
      return mapped;
    }
  } catch (err) {
    console.warn('Fallo de red con Supabase Projects:', err);
  }
  return getProjects();
}

export async function createProject(
  data: {
    name: string;
    description?: string;
    color?: string;
    memberIds: string[];
  },
  actorUser: User
): Promise<Project> {
  const projects = getProjects();
  const nowIso = new Date().toISOString();

  const memberSet = new Set(data.memberIds);
  memberSet.add(actorUser.id);

  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    description: data.description ? data.description.trim() : '',
    color: data.color || '#06b6d4',
    createdBy: actorUser.id,
    memberIds: Array.from(memberSet),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  projects.push(newProject);
  saveProjects(projects);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { error } = await client.from('projects').insert({
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || null,
        color: newProject.color,
        created_by: newProject.createdBy,
        member_ids: newProject.memberIds,
        created_at: newProject.createdAt,
        updated_at: newProject.updatedAt,
      });
      if (error) {
        console.error('Error insertando proyecto en Supabase:', error);
      }
    } catch (e) {
      console.warn('Error de red al crear proyecto en Supabase:', e);
    }
  }

  logActivity({
    userId: actorUser.id,
    userName: actorUser.name,
    action: 'ha creado el proyecto',
    taskTitle: newProject.name,
  });

  return newProject;
}

export async function updateProject(
  id: string,
  updates: {
    name?: string;
    description?: string;
    color?: string;
    memberIds?: string[];
  },
  actorUser: User
): Promise<Project | null> {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = projects[index];

  if (actorUser.role !== 'admin' && current.createdBy !== actorUser.id) {
    throw new Error('Solo el creador del proyecto o un administrador pueden editar este proyecto.');
  }

  const nowIso = new Date().toISOString();
  let updatedMembers = updates.memberIds ? [...updates.memberIds] : current.memberIds;
  if (current.createdBy && !updatedMembers.includes(current.createdBy)) {
    updatedMembers.push(current.createdBy);
  }

  const updated: Project = {
    ...current,
    name: updates.name ? updates.name.trim() : current.name,
    description: updates.description !== undefined ? updates.description.trim() : current.description,
    color: updates.color || current.color,
    memberIds: updatedMembers,
    updatedAt: nowIso,
  };

  projects[index] = updated;
  saveProjects(projects);

  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { error } = await client
        .from('projects')
        .update({
          name: updated.name,
          description: updated.description || null,
          color: updated.color,
          member_ids: updated.memberIds,
          updated_at: updated.updatedAt,
        })
        .eq('id', id);
      if (error) {
        console.error('Error actualizando proyecto en Supabase:', error);
      }
    } catch (e) {
      console.warn('Error de red actualizando proyecto en Supabase:', e);
    }
  }

  logActivity({
    userId: actorUser.id,
    userName: actorUser.name,
    action: 'actualizó la configuración del proyecto',
    taskTitle: updated.name,
  });

  return updated;
}

export async function deleteProject(id: string, actorUser: User): Promise<{ success: boolean; error?: string }> {
  if (id === 'proj-default') {
    return { success: false, error: 'El proyecto principal por defecto no puede ser eliminado.' };
  }

  const projects = getProjects();
  const target = projects.find((p) => p.id === id);
  if (!target) return { success: false, error: 'Proyecto no encontrado.' };

  if (actorUser.role !== 'admin' && target.createdBy !== actorUser.id) {
    return { success: false, error: 'Solo el creador del proyecto o un administrador pueden eliminar este proyecto.' };
  }

  const tasks = getTasks().filter((t) => (t.projectId || 'proj-default') !== id);
  saveTasks(tasks);

  const remaining = projects.filter((p) => p.id !== id);
  saveProjects(remaining);

  if (getActiveProjectId() === id) {
    setActiveProjectId('proj-default');
  }

  const client = await getOrInitSupabase();
  if (client) {
    try {
      const { error } = await client.from('projects').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando proyecto en Supabase:', error);
      }
    } catch (e) {
      console.warn('Error de red eliminando proyecto en Supabase:', e);
    }
  }

  logActivity({
    userId: actorUser.id,
    userName: actorUser.name,
    action: 'eliminó el proyecto',
    taskTitle: target.name,
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
    const parsed: Task[] = JSON.parse(stored);
    let updated = false;
    const sanitized = parsed.map((t) => {
      if (!t.projectId) {
        updated = true;
        return { ...t, projectId: 'proj-default' };
      }
      return t;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  notifySync('tasks');
}

export async function createTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { observations?: string },
  actorUser: User
): Promise<Task> {
  const tasks = getTasks();
  const nowIso = new Date().toISOString();

  // started_at debe conservar la primera fecha de inicio
  const startedAt =
    taskData.status === 'iniciado' || taskData.status === 'trabajando'
      ? taskData.startedAt || nowIso
      : taskData.startedAt || undefined;

  const completedAt =
    taskData.status === 'finalizado'
      ? taskData.completedAt || nowIso
      : undefined;

  const projectId = taskData.projectId || getActiveProjectId();
  const newTask: Task = {
    ...taskData,
    projectId,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    startedAt,
    completedAt,
  };
  tasks.unshift(newTask);
  saveTasks(tasks);

  // 1. Guardar primero la tarea en Supabase (para cumplir clave foránea)
  const client = await getOrInitSupabase();
  if (client) {
    try {
      const payload: Record<string, unknown> = {
        id: newTask.id,
        project_id: newTask.projectId || 'proj-default',
        title: newTask.title,
        description: newTask.description || '',
        status: newTask.status,
        priority: newTask.priority,
        assigned_to: newTask.assignedTo,
        created_by: newTask.createdBy,
        due_date: newTask.dueDate || null,
        created_at: newTask.createdAt,
        updated_at: newTask.updatedAt,
        started_at: newTask.startedAt || null,
        completed_at: newTask.completedAt || null,
      };
      const { error } = await client.from('tasks').insert(payload);
      if (error) {
        console.warn('Error creando tarea en Supabase:', error);
      }
    } catch (err) {
      console.warn('Fallo de red creando tarea en Supabase:', err);
    }
  }

  // 2. Registrar histórico inicial inmutable (ahora que la tarea ya existe en Supabase y localmente)
  try {
    await recordStatusHistory({
      taskId: newTask.id,
      previousStatus: null,
      newStatus: newTask.status,
      changedBy: actorUser.id,
      changedByName: actorUser.name,
      createdAt: nowIso,
      observations: taskData.observations || 'Creación de la tarea en el sistema.',
    });
  } catch (err) {
    console.warn('Error registrando histórico inicial:', err);
  }

  try {
    logActivity({
      userId: actorUser.id,
      userName: actorUser.name,
      action: 'ha creado la tarea',
      taskTitle: newTask.title,
    });
  } catch (err) {
    console.warn('Error registrando log de actividad:', err);
  }

  return newTask;
}

export async function updateTask(
  id: string,
  updates: Partial<Task> & { observations?: string },
  actorUser: User
): Promise<Task | null> {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const oldTask = tasks[index];
  const nowIso = new Date().toISOString();

  let startedAt = oldTask.startedAt;
  let completedAt = oldTask.completedAt;

  // started_at debe conservar la PRIMERA fecha de inicio
  if (
    !startedAt &&
    (updates.status === 'iniciado' ||
      updates.status === 'trabajando' ||
      oldTask.status === 'iniciado')
  ) {
    startedAt = nowIso;
  }

  // completed_at debe representar la última finalización de la tarea
  if (updates.status === 'finalizado') {
    completedAt = nowIso;
  }

  const updatedTask: Task = {
    ...oldTask,
    ...updates,
    startedAt,
    completedAt,
    updatedAt: nowIso,
  };

  tasks[index] = updatedTask;
  saveTasks(tasks);

  // Si hubo cambio de estado, registrar en task_status_history
  if (updates.status && updates.status !== oldTask.status) {
    await recordStatusHistory({
      taskId: id,
      previousStatus: oldTask.status,
      newStatus: updates.status,
      changedBy: actorUser.id,
      changedByName: actorUser.name,
      createdAt: nowIso,
      observations:
        updates.observations ||
        `Cambio de estado: ${oldTask.status.toUpperCase()} -> ${updates.status.toUpperCase()}`,
    });
  }

  const client = await getOrInitSupabase();
  if (client) {
    const payload: Record<string, unknown> = {
      updated_at: updatedTask.updatedAt,
    };
    if (updates.projectId !== undefined) payload.project_id = updates.projectId;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (startedAt !== undefined) payload.started_at = startedAt || null;
    if (completedAt !== undefined) payload.completed_at = completedAt || null;

    const { error } = await client.from('tasks').update(payload).eq('id', id);
    if (error) {
      console.warn('Error actualizando tarea en Supabase:', error);
    }
  }

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

export async function deleteTask(id: string, actorUser: User): Promise<boolean> {
  const tasks = getTasks();
  const taskToDelete = tasks.find((t) => t.id === id);
  if (!taskToDelete) return false;

  const remaining = tasks.filter((t) => t.id !== id);
  saveTasks(remaining);

  const client = await getOrInitSupabase();
  if (client) {
    const { error } = await client.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando tarea en Supabase:', error);
    }
  }

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

export async function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
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

  const client = await getOrInitSupabase();
  if (client) {
    client
      .from('activity_logs')
      .insert({
        id: newLog.id,
        user_id: newLog.userId,
        user_name: newLog.userName,
        action: newLog.action,
        task_title: newLog.taskTitle,
        timestamp: newLog.timestamp,
      })
      .then();
  }
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

export async function syncCloudSecurityLogs(): Promise<SecurityLog[]> {
  const client = await getOrInitSupabase();
  if (!client || typeof window === 'undefined') return getSecurityLogs();

  try {
    const { data, error } = await client
      .from('security_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Error al consultar logs de seguridad en Supabase:', error);
      return getSecurityLogs();
    }

    if (data && data.length > 0) {
      const mapped: SecurityLog[] = data.map((l: any) => {
        let ip = l.ip;
        let city = l.city;
        let country = l.country;
        let deviceType = l.device_type;
        let deviceName = l.device_name;
        let os = l.os;
        let browser = l.browser;

        // Extract IP & device if embedded in details text
        if (l.details) {
          if (!ip) {
            const ipMatch = l.details.match(/\[IP:\s*([^·\]]+)(?:\s*·\s*([^\]]+))?\]/i) || l.details.match(/IP:\s*([\d\.:a-fA-F]+)/);
            if (ipMatch) {
              ip = ipMatch[1].trim();
              if (ipMatch[2]) city = ipMatch[2].trim();
            }
          }
          if (!deviceName) {
            const devMatch = l.details.match(/\[Dispositivo:\s*([^·\]]+)(?:\s*·\s*([^\(\]]+))?(?:\s*\(([^\)]+)\))?\]/i) || l.details.match(/desde\s+([^\(\n]+)\s*\(([^\·\)]+)[\s·]*([^\)]*)\)/i);
            if (devMatch) {
              deviceName = devMatch[1].trim();
              if (devMatch[2]) os = devMatch[2].trim();
              if (devMatch[3]) browser = devMatch[3].trim();
            }
          }
        }

        if (!deviceType && deviceName) {
          if (/phone|móvil|galaxy|pixel|redmi|iphone|android/i.test(deviceName)) {
            deviceType = 'mobile';
          } else if (/tablet|ipad/i.test(deviceName)) {
            deviceType = 'tablet';
          } else {
            deviceType = 'desktop';
          }
        }

        return {
          id: l.id,
          adminId: l.admin_id,
          adminName: l.admin_name,
          targetUserId: l.target_user_id || undefined,
          targetUserName: l.target_user_name || undefined,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp,
          ip: ip || undefined,
          city: city || undefined,
          country: country || undefined,
          deviceType: deviceType || undefined,
          deviceName: deviceName || undefined,
          os: os || undefined,
          browser: browser || undefined,
        };
      });

      const localLogs = getSecurityLogs();
      const mergedMap = new Map<string, SecurityLog>();
      mapped.forEach((l) => mergedMap.set(l.id, l));
      localLogs.forEach((l) => {
        if (!mergedMap.has(l.id)) mergedMap.set(l.id, l);
      });

      const sorted = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(sorted.slice(0, 100)));
      notifySync('security');
      return sorted;
    }
  } catch (err) {
    console.warn('Fallo de red al sincronizar security logs:', err);
  }
  return getSecurityLogs();
}

export async function logSecurityEvent(event: Omit<SecurityLog, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const logs = getSecurityLogs();
  const newLog: SecurityLog = {
    ...event,
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Embed structured audit info in details for seamless cross-device compatibility
  let enrichedDetails = newLog.details;
  if (newLog.ip && !enrichedDetails.includes('[IP:')) {
    enrichedDetails += ` [IP: ${newLog.ip}${newLog.city ? ` · ${newLog.city}` : ''}]`;
  }
  if (newLog.deviceName && !enrichedDetails.includes('[Dispositivo:')) {
    enrichedDetails += ` [Dispositivo: ${newLog.deviceName}${newLog.os ? ` · ${newLog.os}` : ''}${newLog.browser ? ` (${newLog.browser})` : ''}]`;
  }
  newLog.details = enrichedDetails;

  const updated = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(updated));
  notifySync('security');

  const client = await getOrInitSupabase();
  if (client) {
    try {
      // 1. Try insert with dedicated audit columns
      const { error } = await client
        .from('security_logs')
        .insert({
          id: newLog.id,
          admin_id: newLog.adminId,
          admin_name: newLog.adminName,
          target_user_id: newLog.targetUserId || null,
          target_user_name: newLog.targetUserName || null,
          action: newLog.action,
          details: newLog.details,
          timestamp: newLog.timestamp,
          ip: newLog.ip || null,
          city: newLog.city || null,
          country: newLog.country || null,
          device_type: newLog.deviceType || null,
          device_name: newLog.deviceName || null,
          os: newLog.os || null,
          browser: newLog.browser || null,
        });

      if (error) {
        // 2. Fallback to base schema columns with enriched details
        await client
          .from('security_logs')
          .insert({
            id: newLog.id,
            admin_id: newLog.adminId,
            admin_name: newLog.adminName,
            target_user_id: newLog.targetUserId || null,
            target_user_name: newLog.targetUserName || null,
            action: newLog.action,
            details: newLog.details,
            timestamp: newLog.timestamp,
          });
      }
    } catch (err) {
      console.warn('Error enviando security_log a Supabase:', err);
    }
  }
}
