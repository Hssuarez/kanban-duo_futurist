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
  getNotificationPreferences,
  saveNotificationPreferences,
  isDndActive,
  NotificationPreferences,
  getDynamicNotificationTitle,
  getTimeOfDayGreeting,
} from '@/lib/notifications';
import { playChimeSound } from '@/lib/soundEffects';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  BrowserNotificationStatus,
} from '@/lib/browserNotifications';
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
  Sun,
  Settings,
  ArrowLeft,
  Volume2,
  VolumeX,
  Moon,
  Globe,
  Sliders,
  Check,
} from 'lucide-react';

interface NotificationCenterProps {
  currentUser: User;
  activeProject: Project | null;
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
  const [panelView, setPanelView] = useState<'list' | 'settings'>('list');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'urgent'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationStatus>('default');
  const [dndActive, setDndActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh notifications list and evaluate automatic due/overdue items
  const reloadNotifications = () => {
    if (activeProject && tasks.length > 0) {
      evaluateAutomaticNotifications(tasks, currentUser, activeProject.id);
    }
    setNotifications(getNotifications());
    setPreferences(getNotificationPreferences());
    setDndActive(isDndActive());
    setBrowserPermission(getBrowserNotificationPermission());
  };

  useEffect(() => {
    reloadNotifications();
    const unsub = subscribeToSync((type) => {
      if (type === 'notifications' || type === 'tasks' || type === 'notification_preferences') {
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
      const isForProj = !n.projectId || (activeProject && n.projectId === activeProject.id);
      return isForUser && isForProj;
    });
  }, [notifications, currentUser.id, activeProject?.id]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications]
  );

  const urgentCount = useMemo(
    () =>
      userNotifications.filter(
        (n) => n.type === 'task_overdue' || n.type === 'task_due_soon' || n.type === 'task_stagnant'
      ).length,
    [userNotifications]
  );

  const filteredList = useMemo(() => {
    switch (filterMode) {
      case 'unread':
        return userNotifications.filter((n) => !n.read);
      case 'urgent':
        return userNotifications.filter(
          (n) => n.type === 'task_overdue' || n.type === 'task_due_soon' || n.type === 'task_stagnant'
        );
      case 'all':
      default:
        return userNotifications;
    }
  }, [userNotifications, filterMode]);

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.taskId && onOpenTaskDetail) {
      setIsOpen(false);
      onOpenTaskDetail(notif.taskId);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead(currentUser.id, activeProject?.id);
    setNotifications((prev) =>
      prev.map((n) => {
        const forUser = n.userId === currentUser.id || n.userId === 'all';
        const forProj = !n.projectId || n.projectId === activeProject?.id;
        return forUser && forProj ? { ...n, read: true } : n;
      })
    );
  };

  const handleClearAll = () => {
    clearNotifications(currentUser.id, activeProject?.id);
    setNotifications((prev) =>
      prev.filter((n) => {
        const forUser = n.userId === currentUser.id || n.userId === 'all';
        const forProj = !n.projectId || n.projectId === activeProject?.id;
        return !(forUser && forProj);
      })
    );
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    setDndActive(isDndActive());
  };

  const handleSetDnd = (hours: number | null) => {
    if (hours === null) {
      updatePreference('dndUntil', null);
      setDndActive(false);
    } else {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      updatePreference('dndUntil', until);
      setDndActive(true);
    }
  };

  const handleRequestBrowserPerms = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      updatePreference('browserNotifsEnabled', true);
      showBrowserNotification('¡Notificaciones activadas!', {
        body: 'Las alertas de escritorio de KanbanDuo están funcionando correctamente.',
      });
    }
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
      case 'task_stagnant':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          dot: 'bg-amber-400',
          badgeText: 'Estancada',
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
      case 'daily_briefing': {
        const { period } = getTimeOfDayGreeting('');
        if (period === 'night') {
          return {
            icon: Moon,
            iconBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
            dot: 'bg-indigo-400',
            badgeText: 'Resumen nocturno',
          };
        }
        if (period === 'afternoon') {
          return {
            icon: Sun,
            iconBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
            dot: 'bg-amber-400',
            badgeText: 'Resumen de la tarde',
          };
        }
        return {
          icon: Sun,
          iconBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
          badgeText: 'Resumen matutino',
        };
      }
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setPanelView('list');
        }}
        title={dndActive ? 'Notificaciones (Modo Concentración activo)' : 'Centro de notificaciones'}
        className={`relative h-8 w-8 rounded-lg transition-all active:scale-[0.96] flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
        }`}
      >
        <Bell className="w-3.5 h-3.5" />

        {/* DND Moon Indicator Badge */}
        {dndActive && (
          <span
            className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-purple-950 border border-purple-400/60 rounded-full flex items-center justify-center text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            title="Modo Concentración activo"
          >
            <Moon className="w-2 h-2 fill-purple-300" />
          </span>
        )}

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
          {/* VIEW: NOTIFICATIONS LIST */}
          {panelView === 'list' && (
            <>
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#050811] flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded-full">
                      {unreadCount} nuevas
                    </span>
                  )}
                  {dndActive && (
                    <span className="text-[9px] font-mono font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <Moon className="w-2.5 h-2.5 fill-purple-300" /> DND
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      title="Marcar todas como leídas"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanelView('settings')}
                    title="Ajustes y Modo Concentración"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
                              {getDynamicNotificationTitle(notif)}
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
            </>
          )}

          {/* VIEW: SETTINGS & DND PREFERENCES */}
          {panelView === 'settings' && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#050811] flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelView('list')}
                    title="Volver al historial"
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Preferencias de Alertas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Cerrar"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Body */}
              <div className="max-h-[calc(100vh-220px)] sm:max-h-[360px] overflow-y-auto custom-scrollbar p-3.5 space-y-4 text-xs">
                {/* 1. Modo Concentración (DND) */}
                <div className="p-3 rounded-xl bg-[#090f1f] border border-purple-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
                      Modo Concentración (DND)
                    </span>
                    {dndActive ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                        Activo
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">Inactivo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2.5 leading-relaxed">
                    Silencia temporalmente los sonidos y avisos flotantes para trabajar enfocado.
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetDnd(null)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-medium border transition-all text-center cursor-pointer ${
                        !dndActive
                          ? 'bg-purple-950 text-purple-200 border-purple-400 font-bold'
                          : 'bg-zinc-900/90 text-zinc-400 border-white/[0.06] hover:text-white'
                      }`}
                    >
                      Off
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDnd(1)}
                      className="py-1 px-1 rounded-lg text-[10px] font-medium border bg-zinc-900/90 hover:bg-purple-950/60 text-zinc-300 hover:text-purple-200 border-white/[0.06] hover:border-purple-500/40 transition-all text-center cursor-pointer"
                    >
                      1 hora
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDnd(2)}
                      className="py-1 px-1 rounded-lg text-[10px] font-medium border bg-zinc-900/90 hover:bg-purple-950/60 text-zinc-300 hover:text-purple-200 border-white/[0.06] hover:border-purple-500/40 transition-all text-center cursor-pointer"
                    >
                      2 horas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDnd(12)}
                      className="py-1 px-1 rounded-lg text-[10px] font-medium border bg-zinc-900/90 hover:bg-purple-950/60 text-zinc-300 hover:text-purple-200 border-white/[0.06] hover:border-purple-500/40 transition-all text-center cursor-pointer"
                    >
                      Todo el día
                    </button>
                  </div>
                </div>

                {/* 2. Audio Sci-Fi & Hápticos */}
                <div className="p-3 rounded-xl bg-[#090f1f] border border-cyan-500/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {preferences.soundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        Efectos de Sonido Sci-Fi
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Tonos procedurales y vibración háptica en móvil
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => updatePreference('soundEnabled', !preferences.soundEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        preferences.soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-zinc-950 shadow-md block" />
                    </button>
                  </div>

                  {preferences.soundEnabled && (
                    <button
                      type="button"
                      onClick={playChimeSound}
                      className="mt-1 self-start px-2.5 py-1 text-[10px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-lg hover:bg-cyan-950/70 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" /> Probar sonido
                    </button>
                  )}
                </div>

                {/* 3. Notificaciones Nativas de Navegador */}
                <div className="p-3 rounded-xl bg-[#090f1f] border border-cyan-500/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        Notificaciones de Navegador
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Alertas nativas cuando la app está minimizada
                      </p>
                    </div>

                    {browserPermission === 'granted' ? (
                      <button
                        type="button"
                        onClick={() =>
                          updatePreference('browserNotifsEnabled', !preferences.browserNotifsEnabled)
                        }
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          preferences.browserNotifsEnabled ? 'bg-cyan-500 justify-end' : 'bg-zinc-800 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-zinc-950 shadow-md block" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestBrowserPerms}
                        className="px-2.5 py-1 text-[10px] font-semibold text-blue-300 bg-blue-950/50 border border-blue-500/40 rounded-lg hover:bg-blue-950 transition-colors cursor-pointer"
                      >
                        Habilitar
                      </button>
                    )}
                  </div>

                  {browserPermission === 'granted' && preferences.browserNotifsEnabled && (
                    <button
                      type="button"
                      onClick={() =>
                        showBrowserNotification('¡KanbanDuo Activo!', {
                          body: 'Las alertas de escritorio están funcionando al 100%.',
                        })
                      }
                      className="mt-1 self-start px-2.5 py-1 text-[10px] font-semibold text-blue-300 bg-blue-950/40 border border-blue-500/30 rounded-lg hover:bg-blue-950/70 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3 h-3" /> Probar alerta de escritorio
                    </button>
                  )}
                </div>

                {/* 4. Canales de Alerta */}
                <div className="p-3 rounded-xl bg-[#090f1f] border border-white/[0.06] space-y-2">
                  <span className="font-semibold text-white block mb-1">Alertas Automáticas</span>

                  <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3 h-3 text-amber-400" /> Resumen Matutino (Daily Briefing)
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.notifyBriefing}
                      onChange={(e) => updatePreference('notifyBriefing', e.target.checked)}
                      className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> Tareas Estancadas (&gt;5d)
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.notifyStagnant}
                      onChange={(e) => updatePreference('notifyStagnant', e.target.checked)}
                      className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 text-purple-400" /> Tareas Asignadas a mí
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.notifyAssigned}
                      onChange={(e) => updatePreference('notifyAssigned', e.target.checked)}
                      className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-[#050811] flex items-center justify-between text-[11px] rounded-b-xl">
                <span className="text-zinc-500 font-mono text-[10px]">Preferencias guardadas</span>
                <button
                  type="button"
                  onClick={() => setPanelView('list')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer py-0.5 px-2 rounded hover:bg-cyan-950/30"
                >
                  Volver al historial
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
