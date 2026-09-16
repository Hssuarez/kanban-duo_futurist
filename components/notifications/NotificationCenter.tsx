'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Task, Project } from '@/lib/types';
import {
  AppNotification,
  NotificationType,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  evaluateAutomaticNotifications,
} from '@/lib/notifications';
import { subscribeToSync } from '@/lib/storage';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface NotificationCenterProps {
  currentUser: User;
  activeProject: Project;
  tasks: Task[];
  onOpenTaskDetail?: (taskId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  activeProject,
  tasks,
  onOpenTaskDetail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'urgent'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh notifications list and evaluate automatic due/overdue items
  const reloadNotifications = () => {
    evaluateAutomaticNotifications(tasks, currentUser, activeProject?.id || 'proj-default');
    setNotifications(getNotifications());
  };

  useEffect(() => {
    reloadNotifications();
    const unsub = subscribeToSync((type) => {
      if (type === 'notifications' || type === 'tasks') {
        reloadNotifications();
      }
    });
    return () => unsub();
  }, [tasks, currentUser, activeProject?.id]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter notifications relevant to current user and project
  const userNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const isForUser = n.userId === currentUser.id || n.userId === 'all';
      const isForProj = !n.projectId || n.projectId === activeProject?.id;
      return isForUser && isForProj;
    });
  }, [notifications, currentUser.id, activeProject?.id]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications]
  );

  const urgentCount = useMemo(
    () => userNotifications.filter((n) => n.type === 'task_overdue' || n.type === 'task_due_soon').length,
    [userNotifications]
  );

  const filteredList = useMemo(() => {
    if (filterMode === 'unread') return userNotifications.filter((n) => !n.read);
    if (filterMode === 'urgent')
      return userNotifications.filter((n) => n.type === 'task_overdue' || n.type === 'task_due_soon');
    return userNotifications;
  }, [userNotifications, filterMode]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
      setNotifications(getNotifications());
    }
    if (notif.taskId && onOpenTaskDetail) {
      onOpenTaskDetail(notif.taskId);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead(currentUser.id, activeProject?.id);
    setNotifications(getNotifications());
  };

  const handleClearAll = () => {
    clearNotifications(currentUser.id, activeProject?.id);
    setNotifications(getNotifications());
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return `${Math.floor(diffHours / 24)}d`;
    } catch {
      return '';
    }
  };

  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'task_overdue':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
          dot: 'bg-rose-400',
          badgeText: 'Vencida',
        };
      case 'task_due_soon':
        return {
          icon: Clock,
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          dot: 'bg-amber-400',
          badgeText: 'Vence hoy',
        };
      case 'task_assigned':
        return {
          icon: UserCheck,
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          dot: 'bg-purple-400',
          badgeText: 'Asignada',
        };
      case 'task_completed':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          dot: 'bg-emerald-400',
          badgeText: 'Completada',
        };
      case 'task_created':
      default:
        return {
          icon: PlusCircle,
          iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
          dot: 'bg-blue-400',
          badgeText: 'Nueva tarea',
        };
    }
  };

  return (
    <div className={`relative font-sans ${isOpen ? 'z-50' : 'z-20'}`} ref={containerRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Centro de notificaciones"
        className={`relative p-2 rounded-xl border transition-all active:scale-[0.96] flex items-center justify-center ${
          isOpen
            ? 'bg-zinc-800 text-white border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/[0.08] hover:border-cyan-500/30 text-zinc-300 hover:text-white shadow-sm'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-cyan-500 text-zinc-950 font-mono font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-zinc-950 shadow-[0_0_10px_rgba(6,182,212,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile Dimmer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 sm:hidden animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {/* Popover Menu: Solid Obsidian Surface */}
      {isOpen && (
        <div
          style={{
            transformOrigin: 'top center',
            backgroundColor: '#070c18',
          }}
          className="fixed left-3 right-3 top-[62px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-sm sm:max-w-md mx-auto sm:mx-0 bg-[#070c18] border border-cyan-500/35 shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_25px_rgba(6,182,212,0.2)] rounded-2xl py-2 z-50 animate-modal-enter ring-1 ring-cyan-500/20 backdrop-blur-2xl"
          role="menu"
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#050811] flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Marcar todas como leídas"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 border-b border-white/[0.04] bg-[#070c18] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'all'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todas ({userNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'unread'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              No leídas ({unreadCount})
            </button>
            {urgentCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                  filterMode === 'urgent'
                    ? 'bg-zinc-800 text-rose-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Urgentes ({urgentCount})
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[calc(100vh-220px)] sm:max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.04] px-1 py-1 bg-[#070c18]">
            {filteredList.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-zinc-200">Todo al día</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  No tienes notificaciones pendientes en este momento.
                </p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const cfg = getTypeConfig(notif.type);
                const Icon = cfg.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 my-0.5 group ${
                      notif.read
                        ? 'bg-[#090f1f] hover:bg-[#0d162b] border border-white/[0.05]'
                        : 'bg-[#0b1429] hover:bg-[#0f1c3a] border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-medium truncate ${
                            notif.read ? 'text-zinc-300' : 'text-zinc-100 font-semibold group-hover:text-cyan-300'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread blue dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-2 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          {userNotifications.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-white/[0.06] bg-[#050811] flex items-center justify-between text-[11px] rounded-b-xl">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-zinc-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-rose-950/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar todas</span>
              </button>

              <span className="text-[10px] text-zinc-500 font-mono">
                {activeProject?.name || 'Proyecto'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
