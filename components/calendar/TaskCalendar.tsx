'use client';

import React, { useState, useMemo } from 'react';
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

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Drag over target for calendar drag-and-drop
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null);

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

  // Navigation handlers
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

  // 100% Reliable "Hoy" handler
  const handleToday = () => {
    const nowIso = new Date().toISOString();
    const todayStr = getBogotaDayKey(nowIso);
    const [y, m, d] = todayStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d, 12, 0, 0));
    setSelectedDateKey(todayStr);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 border border-white/[0.08] p-3 sm:p-4 rounded-2xl shadow-sm">
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
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-cyan-500/30 rounded-lg transition-all active:scale-[0.96]"
          >
            Hoy
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
        <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
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
                      : 'bg-zinc-900/20 hover:bg-zinc-900/50'
                  } ${
                    day.isSelected
                      ? 'ring-1 ring-cyan-500/40 bg-zinc-900/60'
                      : ''
                  } ${
                    isOver ? 'bg-cyan-950/30 ring-2 ring-cyan-400/50' : ''
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-medium inline-flex items-center justify-center ${
                        day.isToday
                          ? 'w-6 h-6 rounded-md bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : day.isSelected
                          ? 'text-cyan-300 font-bold'
                          : day.isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Pills */}
                  <div className="flex-1 space-y-1 overflow-hidden">
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
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${cfg.bg} ${cfg.border} ${cfg.text} ${
                            overdue ? 'ring-1 ring-rose-500/40' : ''
                          }`}
                          title={`${task.title} (${task.status})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-zinc-500 font-mono block pl-1">
                        +{dayTasks.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK GRID */}
      {viewMode === 'week' && (
        <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 divide-x divide-white/[0.04]">
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
                  className={`min-h-[380px] p-2.5 flex flex-col transition-colors ${
                    day.isSelected ? 'bg-zinc-900/60' : 'bg-zinc-900/20'
                  } ${isOver ? 'bg-cyan-950/30 ring-2 ring-cyan-400/50' : ''}`}
                >
                  <div className="text-center pb-2.5 mb-2 border-b border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 font-medium block uppercase tracking-wider">
                      {day.dayName}
                    </span>
                    <span
                      className={`text-sm font-mono font-medium inline-flex items-center justify-center mt-1 ${
                        day.isToday
                          ? 'w-7 h-7 rounded-md bg-cyan-400 text-zinc-950 font-bold'
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
        <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-6 shadow-sm">
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
