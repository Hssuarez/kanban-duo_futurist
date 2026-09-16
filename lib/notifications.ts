/**
 * Notification System for KanbanDuo
 * Handles in-app notifications for task creation, assignment, due dates, and status changes.
 */

import { Task, User } from './types';
import { isTaskOverdue, isTaskDueToday, getBogotaDayKey } from './dateUtils';
import { notifySync } from './storage';

export type NotificationType =
  | 'task_created'
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_completed';

export interface AppNotification {
  id: string;
  userId: string; // Target user ID or 'all' for team broadcast
  projectId: string;
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

const NOTIFICATIONS_STORAGE_KEY = 'kanban_duo_notifications_v1';

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

  // Keep last 100 notifications to prevent unbounded growth
  const updated = [newNotif, ...current].slice(0, 100);
  saveNotifications(updated);
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
  }

  if (hasNew) {
    saveNotifications(updatedNotifications.slice(0, 100));
    return updatedNotifications.slice(0, 100);
  }

  return notifications;
}
