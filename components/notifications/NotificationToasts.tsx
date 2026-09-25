'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppNotification, NotificationType, getDynamicNotificationTitle, getTimeOfDayGreeting } from '@/lib/notifications';
import { User, Project } from '@/lib/types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  PlusCircle,
  Sun,
  Moon,
  X,
  Sparkles,
} from 'lucide-react';

interface ToastItem {
  id: string;
  notif: AppNotification;
  createdAt: number;
}

interface NotificationToastsProps {
  currentUser: User | null;
  activeProject: Project | null;
  onOpenTaskDetail?: (taskId: string) => void;
}

export const NotificationToasts: React.FC<NotificationToastsProps> = ({
  currentUser,
  activeProject,
  onOpenTaskDetail,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent<AppNotification>) => {
      const notif = e.detail;
      if (!notif || !currentUser) return;

      // Filter: only show if for current user or all, and for current project (or global invitations)
      const forUser = notif.userId === currentUser.id || notif.userId === 'all';
      const isInvitationType =
        notif.type.startsWith('project_invitation') || notif.type.startsWith('challenge_invitation');
      const forProj = isInvitationType || !notif.projectId || notif.projectId === activeProject?.id;
      if (!forUser || !forProj) return;

      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newItem: ToastItem = {
        id: toastId,
        notif,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newItem, ...prev].slice(0, 3));

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(toastId);
      }, 4500);
    };

    window.addEventListener('kanban_toast', handleToastEvent as EventListener);
    return () => {
      window.removeEventListener('kanban_toast', handleToastEvent as EventListener);
    };
  }, [currentUser, activeProject?.id, removeToast]);

  if (toasts.length === 0) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_created':
        return <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'task_assigned':
        return <UserCheck className="w-4 h-4 text-cyan-300 shrink-0" />;
      case 'task_due_soon':
        return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'daily_briefing': {
        const { period } = getTimeOfDayGreeting('');
        if (period === 'night') {
          return <Moon className="w-4 h-4 text-indigo-300 shrink-0" />;
        }
        if (period === 'afternoon') {
          return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
        }
        return <Sun className="w-4 h-4 text-amber-300 shrink-0" />;
      }
      case 'task_stagnant':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderGlow = (type: NotificationType) => {
    switch (type) {
      case 'task_completed':
        return 'border-emerald-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.2)]';
      case 'task_overdue':
      case 'task_stagnant':
        return 'border-rose-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(244,63,94,0.2)]';
      case 'task_due_soon':
        return 'border-amber-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.2)]';
      case 'daily_briefing': {
        const { period } = getTimeOfDayGreeting('');
        if (period === 'night') {
          return 'border-indigo-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(99,102,241,0.2)]';
        }
        return 'border-amber-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.2)]';
      }
      default:
        return 'border-cyan-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed z-[95] pointer-events-none flex flex-col gap-2.5 top-[64px] inset-x-3 sm:inset-x-auto sm:top-20 sm:right-5 sm:w-88 max-w-sm mx-auto sm:mx-0 font-sans"
    >
      {toasts.map((toast) => {
        const { notif } = toast;
        const glowClass = getBorderGlow(notif.type);

        return (
          <div
            key={toast.id}
            onClick={() => {
              if (notif.taskId && onOpenTaskDetail) {
                onOpenTaskDetail(notif.taskId);
                removeToast(toast.id);
              }
            }}
            className={`pointer-events-auto group relative overflow-hidden bg-[#070c18]/95 backdrop-blur-xl border rounded-2xl p-3.5 transition-all animate-modal-enter ${
              notif.taskId ? 'cursor-pointer hover:bg-[#0a1122]' : ''
            } ${glowClass}`}
          >
            {/* Header: Icon + Title + Close Button */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate tracking-wide">
                    {getDynamicNotificationTitle(notif)}
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed mt-0.5 break-words">
                    {notif.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0 cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Hint */}
            {notif.taskId && (
              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                <span className="text-cyan-400 font-semibold group-hover:underline">
                  Toca para ver tarea →
                </span>
                <span className="text-zinc-500 font-mono text-[9px]">
                  {notif.actorName || activeProject?.name}
                </span>
              </div>
            )}

            {/* Auto dismiss countdown progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500/20 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-[4500ms] ease-linear"
                style={{
                  width: '100%',
                  animation: 'toastProgress 4.5s linear forwards',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
