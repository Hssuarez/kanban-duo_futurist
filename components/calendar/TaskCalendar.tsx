'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, User, TaskStatus, TaskPriority } from '@/lib/types';
import {
  BOGOTA_TZ,
  getBogotaDayKey,
  formatBogotaDate,
  formatBogotaDateTime,
  formatBogotaMonthYear,
  calculateDuration,
  isTaskOverdue,
} from '@/lib/dateUtils';
import { TaskDetailModal } from './TaskDetailModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Columns,
  List,
  Plus,
  X,
} from 'lucide-react';

interface TaskCalendarProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onOpenNewTask?: () => void;
  onOpenEditTask?: (task: Task) => void;
  onUpdateTaskDueDate?: (taskId: string, newDueDate: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  users,
  currentUser,
  onOpenNewTask,
  onOpenEditTask,
  onUpdateTaskDueDate,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Real today key in America/Bogota
  const realTodayKey = useMemo(() => getBogotaDayKey(new Date().toISOString()), []);
  const initialTodayParts = useMemo(() => realTodayKey.split('-').map(Number), [realTodayKey]);

  // Current viewed date and selected day key
  const [currentDate, setCurrentDate] = useState<Date>(
    () => new Date(initialTodayParts[0], initialTodayParts[1] - 1, initialTodayParts[2], 12, 0, 0)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(realTodayKey);
  const [justClickedToday, setJustClickedToday] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Drag over target for calendar drag-and-drop
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null);
  const [openTasksDayKey, setOpenTasksDayKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.day-task-popover') && !target.closest('.day-task-badge')) {
        setOpenTasksDayKey(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenTasksDayKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sanitize filterUser if selected user is not in current project members
  useEffect(() => {
    if (filterUser !== 'all') {
      const exists = users.some((u) => u.id === filterUser);
      if (!exists) {
        setFilterUser('all');
      }
    }
  }, [users, filterUser]);

  const handleCellMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Helper to get deterministic single date key (YYYY-MM-DD) in Bogota for a task
  const getTaskDateKey = (task: Task): string => {
    if (task.dueDate) return task.dueDate;
    return getBogotaDayKey(task.startedAt || task.createdAt);
  };

  // Filter tasks based on controls
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterUser !== 'all' && t.assignedTo !== filterUser) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterUser, filterPriority, filterStatus]);

  // Group tasks by their single deterministic date key
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      const key = getTaskDateKey(task);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
    return map;
  }, [filteredTasks]);

  // Selected day object & tasks for mobile bottom sheet
  const activeDayObj = useMemo(() => {
    if (!openTasksDayKey) return null;
    const [y, m, d] = openTasksDayKey.split('-').map(Number);
    return {
      dateKey: openTasksDayKey,
      dayNumber: d,
      date: new Date(y, m - 1, d, 12, 0, 0),
    };
  }, [openTasksDayKey]);

  const activeDayTasks = useMemo(() => {
    if (!openTasksDayKey) return [];
    return tasksByDay.get(openTasksDayKey) || [];
  }, [openTasksDayKey, tasksByDay]);

  // Navigation handlers with Day View synchronization
  const handlePrev = () => {
    setOpenTasksDayKey(null);
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
    if (viewMode === 'day') {
      setSelectedDateKey(formatDayKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  };

  const handleNext = () => {
    setOpenTasksDayKey(null);
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
    if (viewMode === 'day') {
      setSelectedDateKey(formatDayKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  };

  // 100% Reliable "Hoy" handler with instant Bogota real-time calculation and visual focus pulse
  const handleToday = () => {
    setOpenTasksDayKey(null);
    const nowIso = new Date().toISOString();
    const todayStr = getBogotaDayKey(nowIso);
    const [y, m, d] = todayStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d, 12, 0, 0));
    setSelectedDateKey(todayStr);
    setJustClickedToday(true);
    setTimeout(() => setJustClickedToday(false), 1500);
  };

  // Keyboard shortcut: 'T' jumps to today when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (isDetailModalOpen) return;
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Deterministic date string builder: YYYY-MM-DD
  const formatDayKey = (year: number, monthZeroIndexed: number, day: number): string => {
    const mStr = String(monthZeroIndexed + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Month grid calculation without timezone offset shifting
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0);

    // Monday-based day of week (0 = Monday, 6 = Sunday)
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthDate = new Date(year, month, 0, 12, 0, 0);
    const prevMonthLastDay = prevMonthDate.getDate();
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonthIndex = prevMonthDate.getMonth();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const k = formatDayKey(prevMonthYear, prevMonthIndex, dayNum);
      days.push({
        date: new Date(prevMonthYear, prevMonthIndex, dayNum, 12, 0, 0),
        dateKey: k,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: k === realTodayKey,
        isSelected: k === selectedDateKey,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const k = formatDayKey(year, month, i);
      days.push({
        date: new Date(year, month, i, 12, 0, 0),
        dateKey: k,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: k === realTodayKey,
        isSelected: k === selectedDateKey,
      });
    }

    // Next month padding to complete standard grid (35 or 42 cells)
    const totalGridCells = days.length <= 35 ? 35 : 42;
    const remaining = totalGridCells - days.length;
    const nextMonthDate = new Date(year, month + 1, 1, 12, 0, 0);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthIndex = nextMonthDate.getMonth();

    for (let i = 1; i <= remaining; i++) {
      const k = formatDayKey(nextMonthYear, nextMonthIndex, i);
      days.push({
        date: new Date(nextMonthYear, nextMonthIndex, i, 12, 0, 0),
        dateKey: k,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: k === realTodayKey,
        isSelected: k === selectedDateKey,
      });
    }

    return days;
  }, [currentDate, realTodayKey, selectedDateKey]);

  // Week days calculation
  const weekData = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - dayOfWeek); // Go to Monday

    const days: {
      date: Date;
      dateKey: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    const names = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(d);
      dayDate.setDate(d.getDate() + i);
      const k = formatDayKey(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      days.push({
        date: dayDate,
        dateKey: k,
        dayName: names[i],
        dayNumber: dayDate.getDate(),
        isToday: k === realTodayKey,
        isSelected: k === selectedDateKey,
      });
    }

    return days;
  }, [currentDate, realTodayKey, selectedDateKey]);

  // Status visual styles
  const statusColors: Record<TaskStatus, { bg: string; border: string; text: string; dot: string }> = {
    iniciado: {
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      border: 'border-cyan-500/20',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
    },
    trabajando: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      border: 'border-amber-500/20',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    finalizado: {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      border: 'border-emerald-500/20',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
    },
  };

  const weekDayHeaders = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  return (
    <div className="space-y-4 font-sans animate-view-fade flex-1 flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 p-3 sm:p-4 rounded-2xl shadow-sm transition-colors">
        {/* Navigation & Month */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-white/[0.08]">
            <button
              onClick={handlePrev}
              title="Periodo anterior"
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors active:scale-[0.95]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              title="Periodo siguiente"
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors active:scale-[0.95]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-[0.96] flex items-center gap-1.5 shadow-sm ${
              justClickedToday
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-cyan-500/22 hover:border-cyan-400/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.12)]'
            }`}
            title="Ir a hoy (Atajo: presiona la tecla 'T')"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Hoy</span>
          </button>

          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight ml-1 capitalize">
            {viewMode === 'day' ? formatBogotaDate(selectedDateKey) : formatBogotaMonthYear(currentDate)}
          </h2>
        </div>

        {/* View Mode & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="text-xs bg-zinc-900 border border-white/[0.08] text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/30"
          >
            <option value="all">Todos los miembros</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-zinc-900 border border-white/[0.08] text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/30"
          >
            <option value="all">Todos los estados</option>
            <option value="iniciado">Iniciado</option>
            <option value="trabajando">En progreso</option>
            <option value="finalizado">Finalizado</option>
          </select>

          {/* View mode segmented tabs */}
          <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all active:scale-[0.98] ${
                viewMode === 'month'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all active:scale-[0.98] ${
                viewMode === 'week'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all active:scale-[0.98] ${
                viewMode === 'day'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: MONTH GRID */}
      {viewMode === 'month' && (
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl relative shadow-sm transition-colors flex-1 flex flex-col">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06] bg-zinc-900/80 text-[11px] font-medium text-zinc-400 text-center py-2.5 rounded-t-2xl">
            {weekDayHeaders.map((dayName, idx) => (
              <div key={idx} className="uppercase tracking-wider">
                {dayName}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.04] rounded-b-2xl">
            {monthData.map((day, dayIndex) => {
              const dayTasks = tasksByDay.get(day.dateKey) || [];
              const isOver = dragOverDayKey === day.dateKey;
              const colIndex = dayIndex % 7;
              const rowIndex = Math.floor(dayIndex / 7);
              const isRightCol = colIndex >= 4;
              const isBottomRow = rowIndex >= 3;
              const isOpen = openTasksDayKey === day.dateKey;

              return (
                <div
                  key={day.dateKey}
                  onClick={() => {
                    setSelectedDateKey(day.dateKey);
                    setOpenTasksDayKey(isOpen ? null : day.dateKey);
                  }}
                  onMouseMove={handleCellMouseMove}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverDayKey !== day.dateKey) setDragOverDayKey(day.dateKey);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverDayKey(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDayKey(null);
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId && onUpdateTaskDueDate) {
                      onUpdateTaskDueDate(taskId, day.dateKey);
                    }
                  }}
                  className={`min-h-[105px] sm:min-h-[120px] p-1 sm:p-2 flex flex-col justify-between transition-all relative group cursor-pointer ${
                    isOpen ? 'z-40 ring-1 ring-cyan-400/60 bg-zinc-900/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'z-10'
                  } ${
                    !day.isCurrentMonth
                      ? 'bg-zinc-950/40 text-zinc-600'
                      : 'bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-cyan-500/30'
                  } ${
                    day.isSelected && !isOpen
                      ? 'ring-1 ring-cyan-500/40 bg-zinc-900/60'
                      : ''
                  } ${
                    isOver ? 'bg-cyan-950/30 ring-2 ring-cyan-400/50' : ''
                  }`}
                >
                  {/* Radial Cell Spotlight */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"
                    style={{
                      background: 'radial-gradient(140px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(6, 182, 212, 0.08), transparent 70%)',
                    }}
                  />

                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5 z-10 w-full min-w-0">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-medium inline-flex items-center justify-center shrink-0 ${
                        day.isToday
                          ? `w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.5)] ${justClickedToday ? 'ring-2 sm:ring-4 ring-cyan-400/50 animate-pulse' : ''}`
                          : day.isSelected
                          ? 'text-cyan-300 font-bold'
                          : day.isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {/* Contextual "+" Button - desktop only */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        title={`Crear tarea para el ${day.dateKey}`}
                        className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Status cluster density dots */}
                      {dayTasks.length > 0 && (
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          {dayTasks.some((t) => isTaskOverdue(t.dueDate, t.status)) && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.8)]"
                              title="Hay tareas vencidas este día"
                            />
                          )}
                          {dayTasks.some((t) => t.status === 'trabajando') && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.8)]"
                              title="Hay tareas en curso este día"
                            />
                          )}
                          {dayTasks.some((t) => t.status === 'finalizado') && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                              title="Hay tareas completadas este día"
                            />
                          )}
                        </div>
                      )}

                      {/* Task count badge on desktop only */}
                      {dayTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTasksDayKey(openTasksDayKey === day.dateKey ? null : day.dateKey);
                          }}
                          title={`Ver las ${dayTasks.length} tareas de este día`}
                          className={`hidden sm:inline-flex day-task-badge text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full transition-all cursor-pointer ${
                            openTasksDayKey === day.dateKey
                              ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] font-bold'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08]'
                          }`}
                        >
                          {dayTasks.length}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Pills directly clickable in cell */}
                  <div className="flex-1 space-y-1 overflow-hidden z-10">
                    {dayTasks.slice(0, 3).map((task) => {
                      const cfg = statusColors[task.status] || statusColors.iniciado;
                      const overdue = isTaskOverdue(task.dueDate, task.status);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          className={`px-1 py-0.5 sm:px-1.5 rounded text-[9px] sm:text-[10px] font-medium border truncate transition-all cursor-pointer hover:border-cyan-400/60 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1 sm:gap-1.5 ${cfg.bg} ${cfg.border} ${cfg.text} ${
                            overdue ? 'ring-1 ring-rose-500/40' : ''
                          }`}
                          title={`${task.title} (${task.status}) - Clic para ver`}
                        >
                          <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTasksDayKey(day.dateKey);
                        }}
                        className="day-task-badge text-[9px] text-cyan-400 hover:text-cyan-300 font-mono font-medium block pl-1 text-left cursor-pointer hover:underline"
                      >
                        +{dayTasks.length - 3} más...
                      </button>
                    )}
                  </div>

                  {/* Interactive Solid Obsidian Task Selector Popover - Desktop Anchored */}
                  {isOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`hidden sm:block day-task-popover absolute z-50 w-80 sm:w-96 md:w-[420px] bg-[#070c18] border border-cyan-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_35px_rgba(6,182,212,0.3)] rounded-2xl p-4 sm:p-5 animate-modal-enter pointer-events-auto ${
                        isRightCol ? 'right-1 left-auto' : 'left-1 right-auto'
                      } ${
                        isBottomRow ? 'bottom-1 top-auto' : 'top-1 bottom-auto'
                      }`}
                    >
                      {/* Popover Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white font-mono capitalize truncate">
                            {formatBogotaDate(day.dateKey)}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                            {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTasksDayKey(null);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Cerrar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Clickable Tasks List or Empty state */}
                      {dayTasks.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                          <p className="font-medium text-zinc-400">No hay tareas programadas para este día.</p>
                          <p className="text-[11px] text-zinc-600 mt-1">Crea una nueva tarea para comenzar.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar pr-0.5">
                          {dayTasks.map((t) => {
                            const cfg = statusColors[t.status] || statusColors.iniciado;
                            const assignee = users.find((u) => u.id === t.assignedTo);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(t);
                                  setOpenTasksDayKey(null);
                                }}
                                className="w-full text-left p-3 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 border border-white/[0.08] hover:border-cyan-500/40 transition-all cursor-pointer group/item flex flex-col gap-1.5 shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-zinc-100 group-hover/item:text-cyan-300 truncate">
                                    {t.title}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-2 py-0.5 rounded border capitalize shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                                  >
                                    {t.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                                  <span className="capitalize">{t.priority} prioridad</span>
                                  <span className="text-zinc-300 font-medium">
                                    {assignee?.name?.split(' ')[0] || 'Sin asignar'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Add new task shortcut */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          setOpenTasksDayKey(null);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        className="w-full mt-3.5 py-2.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva tarea en este día</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK GRID */}
      {viewMode === 'week' && (
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl overflow-x-auto sm:overflow-x-visible custom-scrollbar shadow-sm transition-colors flex-1 flex flex-col min-h-[640px] lg:min-h-[calc(100vh-230px)]">
          <div className="grid grid-cols-7 divide-x divide-white/[0.04] min-w-[700px] sm:min-w-0 flex-1">
            {weekData.map((day) => {
              const dayTasks = tasksByDay.get(day.dateKey) || [];
              const isOver = dragOverDayKey === day.dateKey;

              return (
                <div
                  key={day.dateKey}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverDayKey !== day.dateKey) setDragOverDayKey(day.dateKey);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverDayKey(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDayKey(null);
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId && onUpdateTaskDueDate) {
                      onUpdateTaskDueDate(taskId, day.dateKey);
                    }
                  }}
                  onMouseMove={handleCellMouseMove}
                  className={`min-h-[580px] lg:min-h-[calc(100vh-250px)] p-2.5 sm:p-3.5 flex flex-col transition-colors relative group flex-1 ${
                    day.isSelected ? 'bg-zinc-900/60' : 'bg-zinc-900/20 hover:bg-zinc-900/40'
                  } ${isOver ? 'bg-cyan-950/30 ring-2 ring-cyan-400/50' : ''}`}
                >
                  {/* Radial Spotlight */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"
                    style={{
                      background: 'radial-gradient(180px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(6, 182, 212, 0.07), transparent 75%)',
                    }}
                  />

                  <div className="text-center pb-2.5 mb-2.5 border-b border-white/[0.06] relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-medium block uppercase tracking-wider text-left">
                        {day.dayName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        title={`Crear tarea para el ${day.dateKey}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      className={`text-sm sm:text-base font-mono font-medium inline-flex items-center justify-center mt-1 ${
                        day.isToday
                          ? `w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-400 text-zinc-950 font-bold ${justClickedToday ? 'ring-4 ring-cyan-400/50 animate-pulse' : ''}`
                          : 'text-zinc-200'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
                    {dayTasks.map((task) => {
                      const cfg = statusColors[task.status] || statusColors.iniciado;
                      const assignee = users.find((u) => u.id === task.assignedTo);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', task.id);
                          }}
                          onClick={() => handleTaskClick(task)}
                          className={`p-2.5 rounded-xl text-xs font-medium border cursor-pointer hover:scale-[1.01] transition-all shadow-sm ${cfg.bg} ${cfg.border} ${cfg.text}`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              <span className="text-[10px] uppercase font-semibold text-zinc-400 truncate">
                                {task.status}
                              </span>
                            </div>
                            {task.priority && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-white/5 capitalize shrink-0">
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white line-clamp-2 mb-2 leading-snug">{task.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-white/[0.04]">
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <span className="font-mono text-cyan-400 font-medium">
                                ✓ {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                              </span>
                            ) : (
                              <span />
                            )}
                            {assignee && (
                              <span className="text-zinc-400 truncate max-w-[85px]">
                                {assignee.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DAY VIEW */}
      {viewMode === 'day' && (() => {
        const dayTasks = tasksByDay.get(selectedDateKey) || [];
        const completedCount = dayTasks.filter((t) => t.status === 'finalizado').length;
        const inProgressCount = dayTasks.filter((t) => t.status === 'trabajando').length;
        const pendingCount = dayTasks.filter((t) => t.status === 'iniciado').length;

        return (
          <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors min-h-[580px] lg:min-h-[calc(100vh-230px)] flex flex-col">
            {/* Day View Subheader with Quick Day Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                    Vista Diaria
                  </span>
                  {selectedDateKey === realTodayKey && (
                    <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight capitalize">
                  {formatBogotaDate(selectedDateKey)}
                </h3>
              </div>

              {/* Day Navigation Controls & Quick Add */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-zinc-900/90 rounded-xl border border-white/[0.08] p-0.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Día anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <div className="w-px h-4 bg-white/[0.08]" />
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Día siguiente"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenNewTask) onOpenNewTask();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva tarea</span>
                </button>
              </div>
            </div>

            {/* Quick Day Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/[0.06] flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                  Total Tareas
                </span>
                <span className="text-base font-bold text-white font-mono mt-0.5">
                  {dayTasks.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                  Por Iniciar
                </span>
                <span className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                  {pendingCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">
                  En Progreso
                </span>
                <span className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  {inProgressCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                  Completadas
                </span>
                <span className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                  {completedCount}
                </span>
              </div>
            </div>

            {/* Tasks Stream or Generous Empty State */}
            <div className="flex-1 flex flex-col min-h-0">
              {dayTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                    <CalendarIcon className="w-7 h-7 text-cyan-400/60" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                    No hay tareas programadas para este día
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mb-4">
                    Organiza tu jornada programando tareas con fecha límite o inicio para esta fecha.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenNewTask) onOpenNewTask();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir tarea para el {formatBogotaDate(selectedDateKey)}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[460px] pr-1">
                  {dayTasks.map((task) => {
                    const cfg = statusColors[task.status] || statusColors.iniciado;
                    const assignee = users.find((u) => u.id === task.assignedTo);
                    const overdue = isTaskOverdue(task.dueDate, task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-850/60 hover:border-cyan-500/40 transition-all ${cfg.border} bg-zinc-900/60 group shadow-sm`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {task.status}
                            </span>
                            <span className="text-[11px] text-zinc-400 capitalize">
                              Prioridad: {task.priority}
                            </span>
                            {overdue && (
                              <span className="text-[10px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.2 rounded-full">
                                Vencida
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-zinc-400">
                              <span className="text-cyan-400 font-medium">
                                Subtareas: {task.subtasks.filter((s) => s.completed).length}/
                                {task.subtasks.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Assignee and Times */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-zinc-400 font-mono gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-zinc-300 text-[11px]">
                                {assignee.name.split(' ')[0]}
                              </span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="text-[11px] text-zinc-400">
                              Límite: {formatBogotaDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        task={selectedTask}
        users={users}
        onOpenEdit={onOpenEditTask}
      />

      {/* Mobile Day Card Bottom Sheet - Portaled to document.body */}
      {mounted && openTasksDayKey && activeDayObj && typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto font-sans">
          {/* Fullscreen Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpenTasksDayKey(null)}
          />

          {/* Bottom Sheet Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="day-task-popover relative z-10 w-full max-h-[82vh] bg-[#070c18] border-t border-cyan-500/40 rounded-t-3xl p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.98),0_0_30px_rgba(6,182,212,0.25)] flex flex-col animate-slide-up pb-8"
          >
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">
                  {activeDayObj.dayNumber} {formatBogotaMonthYear(currentDate).split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {activeDayTasks.length} {activeDayTasks.length === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenTasksDayKey(null)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task list or Empty state */}
            {activeDayTasks.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                <p>No hay tareas programadas para este día.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-0.5 my-1">
                {activeDayTasks.map((t) => {
                  const cfg = statusColors[t.status] || statusColors.iniciado;
                  const assignee = users.find((u) => u.id === t.assignedTo);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(t);
                        setOpenTasksDayKey(null);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 border border-white/[0.06] hover:border-cyan-500/40 transition-all cursor-pointer group/item flex flex-col gap-1.5 shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-100 group-hover/item:text-cyan-300 truncate">
                          {t.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="capitalize">{t.priority} prioridad</span>
                        <span className="text-zinc-300 font-medium">
                          {assignee?.name?.split(' ')[0] || 'Sin asignar'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add new task shortcut */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDateKey(activeDayObj.dateKey);
                setOpenTasksDayKey(null);
                if (onOpenNewTask) onOpenNewTask();
              }}
              className="w-full mt-3 py-2.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva tarea en este día</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
