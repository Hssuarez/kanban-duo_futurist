/**
 * Advanced Notification System for KanbanDuo
 * Handles in-app notifications, toasts, procedural audio, browser push, and smart analytics.
 */

import { Task, User } from './types';
import { isTaskOverdue, isTaskDueToday, getBogotaDayKey } from './dateUtils';
import { notifySync } from './storage';
import { playChimeSound, playSuccessSound, playAlertSound } from './soundEffects';
import { showBrowserNotification } from './browserNotifications';

export type NotificationType =
  | 'task_created'
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_completed'
  | 'daily_briefing'
  | 'task_stagnant'
  | 'project_invitation'
  | 'project_invitation_accepted'
  | 'project_invitation_declined'
  | 'challenge_invitation'
  | 'challenge_invitation_accepted'
  | 'challenge_invitation_declined';

export interface AppNotification {
  id: string;
  userId: string; // Target user ID or 'all' for team broadcast
  projectId: string;
  challengeId?: string;
  invitationStatus?: 'pending' | 'accepted' | 'declined';
  taskId?: string;
  taskTitle?: string;
  type: NotificationType;
  title: string;
  message: string;
  actorName?: string;
  actorAvatar?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  browserNotifsEnabled: boolean;
  dndUntil: string | null; // ISO string expiration, or null
  notifyAssigned: boolean;
  notifyCreated: boolean;
  notifyCompleted: boolean;
  notifyDue: boolean;
  notifyStagnant: boolean;
  notifyBriefing: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  browserNotifsEnabled: false,
  dndUntil: null,
  notifyAssigned: true,
  notifyCreated: true,
  notifyCompleted: true,
  notifyDue: true,
  notifyStagnant: true,
  notifyBriefing: true,
};

const NOTIFICATIONS_STORAGE_KEY = 'kanban_duo_notifications_v1';
const PREFERENCES_STORAGE_KEY = 'kanban_notification_preferences_v1';

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  notifySync('notifications');
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!stored) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  notifySync('notifications');
}

export function isDndActive(): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.dndUntil) return false;
  const expireTime = new Date(prefs.dndUntil).getTime();
  if (Date.now() < expireTime) return true;
  // DND expired: reset and persist
  saveNotificationPreferences({ ...prefs, dndUntil: null });
  return false;
}

export function addNotification(
  data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): AppNotification {
  const current = getNotifications();
  const newNotif: AppNotification = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Keep last 100 notifications to prevent unbounded growth (FIFO)
  const updated = [newNotif, ...current].slice(0, 100);
  saveNotifications(updated);

  // Check preferences and DND mode
  const prefs = getNotificationPreferences();
  const inDnd = isDndActive();

  // If not in DND mode, trigger real-time audio, toast & browser alert
  if (!inDnd) {
    // 1. Play procedural sound effect if enabled
    if (prefs.soundEnabled) {
      if (newNotif.type === 'task_completed') {
        playSuccessSound();
      } else if (newNotif.type === 'task_overdue' || newNotif.type === 'task_stagnant') {
        playAlertSound();
      } else {
        playChimeSound();
      }
    }

    // 2. Dispatch real-time HUD in-app toast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kanban_toast', { detail: newNotif }));
    }

    // 3. Dispatch native browser notification if enabled
    if (prefs.browserNotifsEnabled) {
      showBrowserNotification(newNotif.title, {
        body: newNotif.message,
        tag: newNotif.id,
      });
    }
  }

  return newNotif;
}

export function markAsRead(notificationId: string) {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function markAllAsRead(userId: string, projectId?: string) {
  const current = getNotifications();
  const updated = current.map((n) => {
    const belongsToUser = n.userId === userId || n.userId === 'all';
    const belongsToProj = !projectId || n.projectId === projectId;
    if (belongsToUser && belongsToProj) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotifications(updated);
}

export function clearNotifications(userId: string, projectId?: string) {
  const current = getNotifications();
  const updated = current.filter((n) => {
    const belongsToUser = n.userId === userId || n.userId === 'all';
    const belongsToProj = !projectId || n.projectId === projectId;
    return !(belongsToUser && belongsToProj);
  });
  saveNotifications(updated);
}

/**
 * Evaluates active tasks and automatically generates notifications for
 * items due today or overdue with daily deduplication.
 */
export function evaluateAutomaticNotifications(
  tasks: Task[],
  currentUser: User,
  activeProjectId: string
): AppNotification[] {
  if (typeof window === 'undefined' || !currentUser) return [];

  const notifications = getNotifications();
  const todayKey = getBogotaDayKey(new Date().toISOString());
  let hasNew = false;
  const updatedNotifications = [...notifications];

  // Filter tasks belonging to the active project
  const projTasks = tasks.filter((t) => (t.projectId || 'proj-default') === activeProjectId);

  for (const task of projTasks) {
    if (task.status === 'finalizado') continue;

    // Check if assigned to current user or if current user created it
    const isRelevantToUser = task.assignedTo === currentUser.id || task.createdBy === currentUser.id;
    if (!isRelevantToUser) continue;

    // 1. Due Today notification
    if (isTaskDueToday(task.dueDate, task.status)) {
      const alreadyNotifiedToday = notifications.some(
        (n) =>
          n.taskId === task.id &&
          n.type === 'task_due_soon' &&
          getBogotaDayKey(n.createdAt) === todayKey
      );

      if (!alreadyNotifiedToday) {
        const notif: AppNotification = {
          id: `notif-due-${task.id}-${todayKey}`,
          userId: task.assignedTo || currentUser.id,
          projectId: activeProjectId,
          taskId: task.id,
          taskTitle: task.title,
          type: 'task_due_soon',
          title: '¡Tarea vence hoy!',
          message: `"${task.title}" tiene fecha límite programada para hoy.`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        updatedNotifications.unshift(notif);
        hasNew = true;
      }
    }

    // 2. Overdue notification
    if (isTaskOverdue(task.dueDate, task.status)) {
      const alreadyNotifiedToday = notifications.some(
        (n) =>
          n.taskId === task.id &&
          n.type === 'task_overdue' &&
          getBogotaDayKey(n.createdAt) === todayKey
      );

      if (!alreadyNotifiedToday) {
        const notif: AppNotification = {
          id: `notif-overdue-${task.id}-${todayKey}`,
          userId: task.assignedTo || currentUser.id,
          projectId: activeProjectId,
          taskId: task.id,
          taskTitle: task.title,
          type: 'task_overdue',
          title: 'Tarea vencida',
          message: `"${task.title}" superó su fecha límite (${task.dueDate}) y requiere atención.`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        updatedNotifications.unshift(notif);
        hasNew = true;
      }
    }

    // 3. Stagnant Task notification (in progress for > 5 days)
    if (task.status === 'trabajando') {
      const startTime = new Date(task.startedAt || task.createdAt).getTime();
      const elapsedDays = (Date.now() - startTime) / (1000 * 60 * 60 * 24);
      if (elapsedDays >= 5) {
        const alreadyNotifiedToday = notifications.some(
          (n) =>
            n.taskId === task.id &&
            n.type === 'task_stagnant' &&
            getBogotaDayKey(n.createdAt) === todayKey
        );

        if (!alreadyNotifiedToday) {
          const notif: AppNotification = {
            id: `notif-stagnant-${task.id}-${todayKey}`,
            userId: task.assignedTo || currentUser.id,
            projectId: activeProjectId,
            taskId: task.id,
            taskTitle: task.title,
            type: 'task_stagnant',
            title: '⚠️ Tarea estancada (>5d)',
            message: `"${task.title}" lleva más de 5 días en progreso. ¿Requiere apoyo o revisión?`,
            createdAt: new Date().toISOString(),
            read: false,
          };
          updatedNotifications.unshift(notif);
          hasNew = true;
        }
      }
    }
  }

  if (hasNew) {
    saveNotifications(updatedNotifications.slice(0, 100));
    return updatedNotifications.slice(0, 100);
  }

  return notifications;
}

export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'night';

export interface TimeOfDayGreeting {
  greeting: string;
  emoji: string;
  period: TimeOfDayPeriod;
  fullTitle: string;
}

/**
 * Returns a culturally natural Spanish greeting according to the time of day (Bogotá / Local):
 * - 06:00 - 11:59: ¡Buenos días! ☀️
 * - 12:00 - 18:59: ¡Buenas tardes! 🌤️
 * - 19:00 - 05:59: ¡Buenas noches! 🌙
 */
export function getTimeOfDayGreeting(name: string = '', date: Date = new Date()): TimeOfDayGreeting {
  let hour: number;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      hour: 'numeric',
      hour12: false,
    });
    hour = parseInt(formatter.format(date), 10);
    if (isNaN(hour)) {
      hour = date.getHours();
    }
  } catch {
    hour = date.getHours();
  }

  const cleanName = (name || '').trim();

  if (hour >= 6 && hour < 12) {
    const greeting = cleanName ? `¡Buenos días, ${cleanName}!` : '¡Buenos días!';
    return {
      greeting,
      emoji: '☀️',
      period: 'morning',
      fullTitle: `☀️ ${greeting}`,
    };
  } else if (hour >= 12 && hour < 19) {
    const greeting = cleanName ? `¡Buenas tardes, ${cleanName}!` : '¡Buenas tardes!';
    return {
      greeting,
      emoji: '🌤️',
      period: 'afternoon',
      fullTitle: `🌤️ ${greeting}`,
    };
  } else {
    const greeting = cleanName ? `¡Buenas noches, ${cleanName}!` : '¡Buenas noches!';
    return {
      greeting,
      emoji: '🌙',
      period: 'night',
      fullTitle: `🌙 ${greeting}`,
    };
  }
}

/**
 * Ensures any daily briefing notification title dynamically reflects the current time of day,
 * preserving the recipient's name seamlessly even for existing notifications.
 */
export function getDynamicNotificationTitle(notif: { type: string; title: string }): string {
  if (
    notif.type === 'daily_briefing' ||
    /¡?(?:buenos días|buenas tardes|buenas noches)/i.test(notif.title)
  ) {
    // Extract recipient's name if present (e.g. from "☀️ ¡Buenos días, Stephan!")
    const match = notif.title.match(/¡?(?:buenos días|buenas tardes|buenas noches)[,\s]+([^!.]+)/i);
    const name = match ? match[1].trim() : '';
    const { fullTitle } = getTimeOfDayGreeting(name);
    return fullTitle;
  }
  return notif.title;
}

/**
 * Evaluates and delivers a single Daily Briefing notification per calendar day
 * with a friendly summary of tasks due today and pending items.
 */
export function evaluateDailyBriefing(
  tasks: Task[],
  currentUser: User,
  activeProjectId: string
) {
  if (typeof window === 'undefined' || !currentUser) return;
  const prefs = getNotificationPreferences();
  if (!prefs.notifyBriefing) return;

  const todayKey = getBogotaDayKey(new Date().toISOString());
  const storageKey = `kanban_daily_briefing_${currentUser.id}_${todayKey}`;
  if (localStorage.getItem(storageKey)) return; // Already briefed today

  // Filter tasks assigned to current user
  const userTasks = tasks.filter(
    (t) =>
      (t.projectId || 'proj-default') === activeProjectId &&
      t.assignedTo === currentUser.id &&
      t.status !== 'finalizado'
  );

  if (userTasks.length === 0) {
    localStorage.setItem(storageKey, 'true');
    return;
  }

  const dueToday = userTasks.filter((t) => isTaskDueToday(t.dueDate, t.status)).length;
  const highPriority = userTasks.filter((t) => t.priority === 'alta').length;

  const firstName = currentUser.name.split(' ')[0] || 'compañero';
  let message = `Tienes ${userTasks.length} ${userTasks.length === 1 ? 'tarea asignada' : 'tareas asignadas'}.`;
  if (dueToday > 0) {
    message += ` ¡Atención: ${dueToday} ${dueToday === 1 ? 'vence hoy' : 'vencen hoy'}!`;
  } else if (highPriority > 0) {
    message += ` (${highPriority} de alta prioridad).`;
  }

  const greetingInfo = getTimeOfDayGreeting(firstName);

  addNotification({
    type: 'daily_briefing',
    title: greetingInfo.fullTitle,
    message,
    projectId: activeProjectId,
    userId: currentUser.id,
  });

  localStorage.setItem(storageKey, 'true');
}
