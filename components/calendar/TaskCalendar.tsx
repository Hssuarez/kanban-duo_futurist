'use client';

import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, TaskPriority, SpaceFilter } from '@/lib/types';
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
  Flame,
  LayoutGrid,
  Columns,
  List,
  Sparkles,
} from 'lucide-react';

interface TaskCalendarProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onOpenNewTask?: () => void;
  onOpenEditTask?: (task: Task) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  users,
  currentUser,
  onOpenNewTask,
  onOpenEditTask,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  // Current today key in Bogota
  const todayKey = getBogotaDayKey(new Date().toISOString());

  // Date navigation handlers
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
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Month grid calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based day of week (0 = Monday, 6 = Sunday)
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const k = getBogotaDayKey(d.toISOString());
      days.push({
        date: d,
        dateKey: k,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: k === todayKey,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const k = getBogotaDayKey(d.toISOString());
      days.push({
        date: d,
        dateKey: k,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: k === todayKey,
      });
    }

    // Next month padding to complete full 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const k = getBogotaDayKey(d.toISOString());
      days.push({
        date: d,
        dateKey: k,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: k === todayKey,
      });
    }

    return days;
  }, [currentDate, todayKey]);

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
    }[] = [];

    const names = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(d);
      dayDate.setDate(d.getDate() + i);
      const k = getBogotaDayKey(dayDate.toISOString());
      days.push({
        date: dayDate,
        dateKey: k,
        dayName: names[i],
        dayNumber: dayDate.getDate(),
        isToday: k === todayKey,
      });
    }

    return days;
  }, [currentDate, todayKey]);

  // Status visual styles
  const statusColors: Record<TaskStatus, { bg: string; border: string; text: string; dot: string }> = {
    iniciado: {
      bg: 'bg-zinc-800/80 hover:bg-zinc-800',
      border: 'border-zinc-700/60',
      text: 'text-zinc-200',
      dot: 'bg-zinc-400',
    },
    trabajando: {
      bg: 'bg-amber-950/40 hover:bg-amber-900/50',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    finalizado: {
      bg: 'bg-emerald-950/40 hover:bg-emerald-900/50',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
    },
  };

  // Header Title
  const getPeriodTitle = (): string => {
    if (viewMode === 'month') {
      return formatBogotaMonthYear(currentDate);
    }
    if (viewMode === 'week') {
      const first = weekData[0];
      const last = weekData[6];
      return `${first.dayNumber} - ${last.dayNumber} ${formatBogotaMonthYear(last.date)}`;
    }
    return formatBogotaDateTime(currentDate.toISOString()).split(',')[0] || 'Día seleccionado';
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans">
      {/* Calendar Top Control Bar */}
      <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3.5 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Month/Period Navigator */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-zinc-300">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-medium">
                  Calendario
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-medium">
                  {filteredTasks.length} tareas
                </span>
              </div>
              <h2 className="text-base font-semibold text-zinc-100">
                {getPeriodTitle()}
              </h2>
            </div>
          </div>

          {/* Center: Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all text-xs font-medium active:scale-[0.98]"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all text-xs font-medium active:scale-[0.98]"
            >
              Hoy
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all text-xs font-medium active:scale-[0.98]"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-zinc-950/60 rounded-lg border border-white/[0.06] ml-2">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-[0.98] ${
                  viewMode === 'month'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mes</span>
              </button>

              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-[0.98] ${
                  viewMode === 'week'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Semana</span>
              </button>

              <button
                onClick={() => setViewMode('day')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-[0.98] ${
                  viewMode === 'day'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Día</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Operator */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="all">Todos los miembros</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="iniciado">Por hacer</option>
              <option value="trabajando">En curso</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Legend status indicators */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex-wrap">
          <span className="uppercase tracking-widest font-bold text-slate-500">// ESTADO ACTUAL:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></span>
            <span className="text-cyan-300 font-semibold">INICIADO</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
            <span className="text-amber-300 font-semibold">TRABAJANDO</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
            <span className="text-emerald-300 font-semibold">FINALIZADO</span>
          </span>
          <span className="text-[10px] text-slate-500 ml-auto hidden md:inline">
            * Cada tarea se muestra exactamente una sola vez de acuerdo a su estado y fecha actual.
          </span>
        </div>
      </div>

      {/* VIEW: MONTH */}
      {viewMode === 'month' && (
        <div className="bg-[#0b0e17] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)]">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-[#0e121e] border-b border-cyan-500/20 text-center py-2.5 text-[11px] font-bold text-cyan-400/80 uppercase tracking-widest">
            <div>LUN</div>
            <div>MAR</div>
            <div>MIÉ</div>
            <div>JUE</div>
            <div>VIE</div>
            <div className="text-fuchsia-400/80">SÁB</div>
            <div className="text-rose-400/80">DOM</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-800/40">
            {monthData.map((day, idx) => {
              const dayTasks = tasksByDay.get(day.dateKey) || [];
              return (
                <div
                  key={idx}
                  className={`min-h-[115px] p-2 flex flex-col transition-colors ${
                    day.isCurrentMonth ? 'bg-[#0b0e17]' : 'bg-[#080a11]/80 text-slate-600'
                  } ${day.isToday ? 'ring-1 ring-inset ring-cyan-400 bg-cyan-950/20' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                        day.isToday
                          ? 'bg-cyan-500 text-black shadow-[0_0_8px_#06b6d4]'
                          : day.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                  </div>

                  {/* Tasks in Day */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                    {dayTasks.slice(0, 3).map((task) => {
                      const cfg = statusColors[task.status];
                      const assignedUser = users.find((u) => u.id === task.assignedTo);
                      const overdue = isTaskOverdue(task.dueDate, task.status);

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all active:scale-98 shadow-xs ${cfg.bg} ${cfg.border}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              <span className={`text-[11px] font-bold truncate ${cfg.text}`}>
                                {task.title}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                            <span className="truncate max-w-[90px]">
                              {assignedUser?.name.split(' ')[0] || 'Operador'}
                            </span>
                            {overdue && (
                              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> VENCE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <button
                        onClick={() => {
                          setCurrentDate(day.date);
                          setViewMode('day');
                        }}
                        className="w-full text-center text-[9px] font-bold text-cyan-400 hover:text-cyan-300 py-0.5 bg-cyan-950/40 rounded border border-cyan-500/30 tracking-wider"
                      >
                        +{dayTasks.length - 3} MÁS // VER DÍA
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekData.map((day, idx) => {
            const dayTasks = tasksByDay.get(day.dateKey) || [];
            return (
              <div
                key={idx}
                className={`bg-[#0b0e17] border rounded-2xl p-3 flex flex-col min-h-[350px] transition-all ${
                  day.isToday
                    ? 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-cyan-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Week Day Header */}
                <div className="border-b border-slate-800/80 pb-2.5 mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest block">
                      {day.dayName}
                    </span>
                    <span
                      className={`text-lg font-black ${
                        day.isToday ? 'text-cyan-300' : 'text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-[#121625] px-2 py-0.5 rounded-full border border-slate-700">
                    {dayTasks.length}
                  </span>
                </div>

                {/* Day Tasks */}
                <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                  {dayTasks.length === 0 ? (
                    <div className="text-[11px] text-slate-600 text-center py-8 italic">
                      // Sin tareas
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const cfg = statusColors[task.status];
                      const assignedUser = users.find((u) => u.id === task.assignedTo);
                      const overdue = isTaskOverdue(task.dueDate, task.status);

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${cfg.bg} ${cfg.border}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${cfg.text}`}
                            >
                              // {task.status}
                            </span>
                            {overdue && (
                              <span className="text-[9px] text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-white mb-1.5 line-clamp-2">
                            {task.title}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <div className="flex items-center gap-1.5 truncate">
                              <img
                                src={assignedUser?.avatar}
                                alt={assignedUser?.name}
                                className="w-4 h-4 rounded-full object-cover ring-1 ring-cyan-500/50"
                              />
                              <span className="truncate max-w-[80px]">
                                {assignedUser?.name.split(' ')[0]}
                              </span>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: DAY */}
      {viewMode === 'day' && (
        <div className="bg-[#0b0e17] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_35px_rgba(0,0,0,0.8)]">
          <div className="border-b border-cyan-500/20 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-cyan-300">
                {currentDate.getDate()}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AGENDA DEL DÍA // {formatBogotaDateTime(currentDate.toISOString()).split(',')[0]}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Consolidado de tareas programadas o activas para esta fecha en Colombia.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/40">
              {tasksByDay.get(getBogotaDayKey(currentDate.toISOString()))?.length || 0} TAREAS
            </span>
          </div>

          {/* List of Tasks for Single Day */}
          {(() => {
            const dayKey = getBogotaDayKey(currentDate.toISOString());
            const dayTasks = tasksByDay.get(dayKey) || [];

            if (dayTasks.length === 0) {
              return (
                <div className="py-16 text-center text-slate-500 text-xs">
                  // No hay tareas programadas para esta fecha.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayTasks.map((task) => {
                  const cfg = statusColors[task.status];
                  const assignedUser = users.find((u) => u.id === task.assignedTo);
                  const duration = calculateDuration(task.startedAt || task.createdAt, task.completedAt || undefined);

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] shadow-md ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.border} ${cfg.text}`}
                        >
                          // {task.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-[#090b12] px-2 py-0.5 rounded border border-slate-800">
                          PRIORIDAD: {task.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <img
                            src={assignedUser?.avatar}
                            alt={assignedUser?.name}
                            className="w-5 h-5 rounded-md object-cover ring-1 ring-cyan-500/50"
                          />
                          <span className="font-semibold text-white">
                            {assignedUser?.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-300">
                          ⏱ {duration}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Task Detail Modal with Complete Status History */}
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
