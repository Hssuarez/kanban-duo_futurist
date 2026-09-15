'use client';

import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '@/lib/types';
import {
  QuickFilterPeriod,
  getFilterDateRange,
  formatBogotaDate,
  formatBogotaMonthYear,
  calculateDuration,
  calculateDurationHours,
  isTaskOverdue,
} from '@/lib/dateUtils';
import { MonthlyReportModal } from './MonthlyReportModal';
import {
  LayoutDashboard,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  Award,
  Zap,
  Activity,
  Layers,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface TaskDashboardProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onOpenTaskDetail?: (task: Task) => void;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  users,
  currentUser,
  onOpenTaskDetail,
}) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilterPeriod>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Date range from filter
  const { startDate, endDate } = useMemo(() => {
    return getFilterDateRange(quickFilter, customStart, customEnd);
  }, [quickFilter, customStart, customEnd]);

  // Filter tasks based on all active criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // User filter
      if (filterUser !== 'all' && t.assignedTo !== filterUser) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && t.status !== filterStatus) {
        return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && t.priority !== filterPriority) {
        return false;
      }

      // Date range filter
      if (startDate || endDate) {
        const taskTime = new Date(t.createdAt).getTime();
        const startMs = startDate ? startDate.getTime() : 0;
        const endMs = endDate ? endDate.getTime() : Infinity;
        const completedTime = t.completedAt ? new Date(t.completedAt).getTime() : 0;
        const updatedTime = new Date(t.updatedAt).getTime();

        const inRange =
          (taskTime >= startMs && taskTime <= endMs) ||
          (completedTime >= startMs && completedTime <= endMs) ||
          (updatedTime >= startMs && updatedTime <= endMs);

        if (!inRange) return false;
      }

      return true;
    });
  }, [tasks, filterUser, filterStatus, filterPriority, startDate, endDate]);

  // General Metrics
  const totalTasks = filteredTasks.length;
  const startedTasks = filteredTasks.filter((t) => t.status === 'iniciado').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'trabajando').length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'finalizado').length;
  const pendingTasks = startedTasks;
  const overdueTasks = filteredTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // User-specific metrics
  const userMetrics = useMemo(() => {
    return users.map((u) => {
      const uTasks = filteredTasks.filter((t) => t.assignedTo === u.id);
      const uStarted = uTasks.filter((t) => t.status === 'iniciado').length;
      const uWorking = uTasks.filter((t) => t.status === 'trabajando').length;
      const uCompleted = uTasks.filter((t) => t.status === 'finalizado');
      const uPending = uStarted;
      const uOverdue = uTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
      const uRate = uTasks.length > 0 ? Math.round((uCompleted.length / uTasks.length) * 100) : 0;

      const durations = uCompleted
        .map((t) => calculateDurationHours(t.startedAt || t.createdAt, t.completedAt || undefined))
        .filter((h) => h > 0);
      const avgDurationHours =
        durations.length > 0
          ? Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1))
          : 0;

      return {
        user: u,
        total: uTasks.length,
        started: uStarted,
        working: uWorking,
        completed: uCompleted.length,
        pending: uPending,
        overdue: uOverdue,
        rate: uRate,
        avgHours: avgDurationHours,
      };
    });
  }, [filteredTasks, users]);

  // Top performer
  const topPerformer = useMemo(() => {
    const withCompleted = userMetrics.filter((m) => m.completed > 0);
    if (withCompleted.length === 0) return null;
    return withCompleted.reduce((max, cur) => (cur.completed > max.completed ? cur : max), withCompleted[0]);
  }, [userMetrics]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    return {
      alta: filteredTasks.filter((t) => t.priority === 'alta').length,
      media: filteredTasks.filter((t) => t.priority === 'media').length,
      baja: filteredTasks.filter((t) => t.priority === 'baja').length,
    };
  }, [filteredTasks]);

  const quickFilterButtons: { key: QuickFilterPeriod; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'this_week', label: 'Esta semana' },
    { key: 'this_month', label: 'Este mes' },
    { key: 'last_month', label: 'Mes anterior' },
    { key: 'all', label: 'Histórico' },
  ];

  return (
    <div className="space-y-6 font-sans animate-view-fade">
      {/* Top Header & Report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Analítica de rendimiento
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
            Métricas de productividad y resolución
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Seguimiento de tiempos, estados y rendimiento del equipo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-white via-cyan-50 to-white hover:from-cyan-100 hover:to-white text-slate-950 rounded-lg shadow-[0_0_14px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Informe mensual</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-zinc-900/40 border border-white/[0.08] p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Filters Segmented Buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-900 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar">
            {quickFilterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setQuickFilter(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all active:scale-[0.98] ${
                  quickFilter === btn.key
                    ? 'bg-zinc-800/95 text-white font-semibold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* User and Priority Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-xs bg-zinc-900 border border-white/[0.08] text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30"
            >
              <option value="all">Todos los miembros</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs bg-zinc-900 border border-white/[0.08] text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30"
            >
              <option value="all">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Total gestionadas
            </span>
            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono tracking-tight">
            {totalTasks}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            Tareas en el período seleccionado
          </span>
        </div>

        {/* Completed Tasks */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              Finalizadas
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tracking-tight">
              {completedTasks}
            </p>
            <span className="text-xs font-semibold text-emerald-400/80 font-mono">
              ({completionPercent}%)
            </span>
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            Tasa de resolución efectiva
          </span>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
              En progreso
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono tracking-tight">
            {inProgressTasks}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            En fase de ejecución activa
          </span>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.06)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
              Vencidas
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono tracking-tight">
            {overdueTasks}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            Requieren atención prioritaria
          </span>
        </div>
      </div>

      {/* Breakdown per Team Member */}
      <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Rendimiento por colaborador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userMetrics.map((m) => (
            <div
              key={m.user.id}
              className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={m.user.avatar}
                    alt={m.user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <h4 className="font-semibold text-white text-xs">{m.user.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono capitalize">
                      {m.user.role}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {m.rate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${m.rate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-white/[0.04] font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Total</span>
                  <span className="font-semibold text-zinc-200">{m.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block">En curso</span>
                  <span className="font-semibold text-amber-300">{m.working}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block">Listas</span>
                  <span className="font-semibold text-emerald-300">{m.completed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Report Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tasks={tasks}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
};
