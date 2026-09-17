/**
 * Pomodoro Focus Engine for KanbanDuo
 * Handles focus sprints (25m), short breaks (5m), procedural audio,
 * concentration mode integration, and inter-tab/component sync.
 */

import { playFocusStartSound, playFocusCompleteSound } from './soundEffects';
import { getNotificationPreferences, saveNotificationPreferences } from './notifications';

export interface PomodoroState {
  taskId: string | null;
  taskTitle: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  startedAt: number | null;
}

const STORAGE_KEY = 'kanban_pomodoro_state_v1';

const DEFAULT_STATE: PomodoroState = {
  taskId: null,
  taskTitle: '',
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  isRunning: false,
  mode: 'work',
  startedAt: null,
};

let tickerInterval: NodeJS.Timeout | null = null;
const listeners = new Set<(state: PomodoroState) => void>();

export function getPomodoroState(): PomodoroState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as PomodoroState;

    // Recalculate remaining seconds based on real timestamp if it was running
    if (parsed.isRunning && parsed.startedAt) {
      const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
      const remaining = Math.max(0, parsed.remainingSeconds - elapsed);
      return {
        ...parsed,
        remainingSeconds: remaining,
        startedAt: Date.now(),
      };
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveAndNotify(state: PomodoroState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((cb) => cb(state));
  window.dispatchEvent(new CustomEvent('kanban_pomodoro_update', { detail: state }));
}

function startTicker() {
  if (tickerInterval) clearInterval(tickerInterval);
  tickerInterval = setInterval(() => {
    const current = getPomodoroState();
    if (!current.isRunning) {
      if (tickerInterval) clearInterval(tickerInterval);
      return;
    }

    if (current.remainingSeconds <= 1) {
      // Completed!
      playFocusCompleteSound();
      const nextMode: 'work' | 'break' = current.mode === 'work' ? 'break' : 'work';
      const nextDuration = nextMode === 'break' ? 5 * 60 : 25 * 60;
      
      const finishedState: PomodoroState = {
        taskId: current.taskId,
        taskTitle: current.taskTitle,
        totalSeconds: nextDuration,
        remainingSeconds: nextDuration,
        isRunning: false,
        mode: nextMode,
        startedAt: null,
      };

      saveAndNotify(finishedState);
      if (tickerInterval) clearInterval(tickerInterval);

      // Trigger completion notification toast
      window.dispatchEvent(
        new CustomEvent('kanban_toast', {
          detail: {
            id: `pomodoro-done-${Date.now()}`,
            title: current.mode === 'work' ? '🎯 ¡Enfoque completado!' : '☕ ¡Descanso terminado!',
            message:
              current.mode === 'work'
                ? `Gran sesión en "${current.taskTitle || 'tu tarea'}". Tómate un respiro de 5 minutos.`
                : '¿Listo para volver al flujo de trabajo?',
            type: current.mode === 'work' ? 'task_completed' : 'daily_briefing',
            createdAt: new Date().toISOString(),
            read: false,
          },
        })
      );
      return;
    }

    const updated: PomodoroState = {
      ...current,
      remainingSeconds: current.remainingSeconds - 1,
      startedAt: Date.now(),
    };
    saveAndNotify(updated);
  }, 1000);
}

export function startPomodoro(taskId: string, taskTitle: string, durationMinutes: number = 25) {
  const durationSec = durationMinutes * 60;
  const newState: PomodoroState = {
    taskId,
    taskTitle,
    totalSeconds: durationSec,
    remainingSeconds: durationSec,
    isRunning: true,
    mode: 'work',
    startedAt: Date.now(),
  };

  playFocusStartSound();

  // Auto-activate DND Concentration mode for the duration of the sprint
  try {
    const prefs = getNotificationPreferences();
    const dndExpire = new Date(Date.now() + (durationMinutes + 5) * 60 * 1000).toISOString();
    saveNotificationPreferences({ ...prefs, dndUntil: dndExpire });
  } catch {}

  saveAndNotify(newState);
  startTicker();
}

export function pausePomodoro() {
  const current = getPomodoroState();
  const updated: PomodoroState = {
    ...current,
    isRunning: false,
    startedAt: null,
  };
  if (tickerInterval) clearInterval(tickerInterval);
  saveAndNotify(updated);
}

export function resumePomodoro() {
  const current = getPomodoroState();
  if (current.remainingSeconds <= 0) return;
  const updated: PomodoroState = {
    ...current,
    isRunning: true,
    startedAt: Date.now(),
  };
  saveAndNotify(updated);
  startTicker();
}

export function stopPomodoro() {
  if (tickerInterval) clearInterval(tickerInterval);
  saveAndNotify(DEFAULT_STATE);
}

export function subscribePomodoro(cb: (state: PomodoroState) => void): () => void {
  listeners.add(cb);
  cb(getPomodoroState());

  const handleCustomEvent = (e: CustomEvent<PomodoroState>) => {
    if (e.detail) cb(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kanban_pomodoro_update', handleCustomEvent as EventListener);
  }

  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') {
      window.removeEventListener('kanban_pomodoro_update', handleCustomEvent as EventListener);
    }
  };
}
