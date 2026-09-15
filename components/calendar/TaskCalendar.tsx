'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.day-task-popover') && !target.closest('.day-task-badge')) {
        setOpenTasksDayKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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

  // Navigation handlers with Day View synchronization
  const handlePrev = () => {
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
    const nowIso = new Date().toISOString();
    const todayStr = getBogotaDayKey(nowIso);
    const [y, m, d] = todayStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d, 12, 0, 0));
    setSelectedDateKey(todayStr);
    setJustClickedToday(true);
    setTimeout(() => setJustClickedToday(false), 1500);
  };

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
    <div className="space-y-4 font-sans animate-view-fade">
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
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Hoy</span>
          </button>

          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight ml-1">
            {formatBogotaMonthYear(currentDate)}
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
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl overflow-hidden shadow-sm transition-colors">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06] bg-zinc-900/80 text-[11px] font-medium text-zinc-400 text-center py-2.5">
            {weekDayHeaders.map((dayName, idx) => (
              <div key={idx} className="uppercase tracking-wider">
                {dayName}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.04]">
            {monthData.map((day) => {
              const dayTasks = tasksByDay.get(day.dateKey) || [];
              const isOver = dragOverDayKey === day.dateKey;

              return (
                <div
                  key={day.dateKey}
                  onClick={() => setSelectedDateKey(day.dateKey)}
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
                  className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-all relative group cursor-pointer ${
                    !day.isCurrentMonth
                      ? 'bg-zinc-950/40 text-zinc-600'
                      : 'bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-cyan-500/30'
                  } ${
                    day.isSelected
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
                  <div className="flex items-center justify-between mb-1.5 z-10">
                    <span
                      className={`text-xs font-mono font-medium inline-flex items-center justify-center ${
                        day.isToday
                          ? `w-6 h-6 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.5)] ${justClickedToday ? 'ring-4 ring-cyan-400/50 animate-pulse' : ''}`
                          : day.isSelected
                          ? 'text-cyan-300 font-bold'
                          : day.isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Contextual "+" Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        title={`Crear tarea para el ${day.dateKey}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {dayTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTasksDayKey(openTasksDayKey === day.dateKey ? null : day.dateKey);
                          }}
                          title={`Ver las ${dayTasks.length} tareas de este día`}
                          className={`day-task-badge text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full transition-all cursor-pointer ${
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
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate transition-all cursor-pointer hover:border-cyan-400/60 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1.5 ${cfg.bg} ${cfg.border} ${cfg.text} ${
                            overdue ? 'ring-1 ring-rose-500/40' : ''
                          }`}
                          title={`${task.title} (${task.status}) - Clic para ver`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
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

                  {/* Interactive Solid Obsidian Task Selector Popover */}
                  {openTasksDayKey === day.dateKey && dayTasks.length > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="day-task-popover absolute top-1 left-0 right-0 sm:-left-2 sm:-right-2 bg-[#090e1c] border border-cyan-500/40 shadow-[0_20px_45px_rgba(0,0,0,0.98),0_0_24px_rgba(6,182,212,0.25)] rounded-2xl p-3 z-50 animate-modal-enter pointer-events-auto min-w-[220px]"
                    >
                      {/* Popover Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-mono">
                            {day.dayNumber} {formatBogotaMonthYear(currentDate).split(' ')[0]}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.2 rounded-full">
                            {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTasksDayKey(null);
                          }}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Cerrar lista"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Clickable Tasks List */}
                      <div className="space-y-1.5 max-h-[190px] overflow-y-auto custom-scrollbar pr-0.5">
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
                              className="w-full text-left p-2 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 border border-white/[0.06] hover:border-cyan-500/40 transition-all cursor-pointer group/item flex flex-col gap-1 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-semibold text-zinc-100 group-hover/item:text-cyan-300 truncate">
                                  {t.title}
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border capitalize shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                                >
                                  {t.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                <span className="capitalize">{t.priority} prioridad</span>
                                <span className="text-zinc-300 font-medium">
                                  {assignee?.name?.split(' ')[0] || 'Sin asignar'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add new task shortcut */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          setOpenTasksDayKey(null);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        className="w-full mt-2.5 py-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/25 hover:border-cyan-400/50 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm transition-colors">
          <div className="grid grid-cols-7 divide-x divide-white/[0.04] min-w-[720px]">
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
                  className={`min-h-[380px] p-2.5 flex flex-col transition-colors relative group ${
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

                  <div className="text-center pb-2.5 mb-2 border-b border-white/[0.06] relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-medium block uppercase tracking-wider text-left">
                        {day.dayName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(day.dateKey);
                          if (onOpenNewTask) onOpenNewTask();
                        }}
                        title={`Crear tarea para el ${day.dateKey}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      className={`text-sm font-mono font-medium inline-flex items-center justify-center mt-1 ${
                        day.isToday
                          ? `w-7 h-7 rounded-md bg-cyan-400 text-zinc-950 font-bold ${justClickedToday ? 'ring-4 ring-cyan-400/50 animate-pulse' : ''}`
                          : 'text-zinc-200'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {dayTasks.map((task) => {
                      const cfg = statusColors[task.status] || statusColors.iniciado;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', task.id);
                          }}
                          onClick={() => handleTaskClick(task)}
                          className={`p-2 rounded-lg text-xs font-medium border cursor-pointer hover:scale-[1.01] transition-all ${cfg.bg} ${cfg.border} ${cfg.text}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            <span className="text-[10px] uppercase font-semibold text-zinc-400">
                              {task.status}
                            </span>
                          </div>
                          <p className="font-semibold text-white line-clamp-2">{task.title}</p>
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
      {viewMode === 'day' && (
        <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <div>
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider block">
                Tareas programadas para
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {formatBogotaDate(selectedDateKey)}
                {selectedDateKey === realTodayKey && (
                  <span className="ml-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                    Hoy
                  </span>
                )}
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {(tasksByDay.get(selectedDateKey) || []).length} tareas registradas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar">
            {(tasksByDay.get(selectedDateKey) || []).length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No hay tareas programadas para este día.
              </div>
            ) : (
              (tasksByDay.get(selectedDateKey) || []).map((task) => {
                const cfg = statusColors[task.status] || statusColors.iniciado;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-all ${cfg.border} bg-zinc-900/60`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {task.status}
                        </span>
                        <span className="text-xs text-zinc-400 capitalize">
                          Prioridad: {task.priority}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm">{task.title}</h4>
                    </div>

                    <div className="text-right text-xs text-zinc-400 font-mono">
                      {task.startedAt && <div>Inicio: {formatBogotaDateTime(task.startedAt)}</div>}
                      {task.completedAt && <div className="text-emerald-400">Fin: {formatBogotaDateTime(task.completedAt)}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        task={selectedTask}
        users={users}
        onOpenEdit={onOpenEditTask}
      />
    </div>
  );
};
