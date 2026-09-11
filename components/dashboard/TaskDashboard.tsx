'use client';

import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '@/lib/types';
import {
  QuickFilterPeriod,
  getFilterDateRange,
  getBogotaDayKey,
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
  const [filterUser, setFilterUser] = useState<string>(
    currentUser.role === 'admin' ? 'all' : currentUser.id
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Determine allowed users based on permissions
  const visibleUsers = useMemo(() => {
    if (currentUser.role === 'admin') return users;
    return users.filter((u) => u.id === currentUser.id);
  }, [users, currentUser]);

  // Date range from filter
  const { startDate, endDate } = useMemo(() => {
    return getFilterDateRange(quickFilter, customStart, customEnd);
  }, [quickFilter, customStart, customEnd]);

  // Filter tasks based on all active criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Permission check: if member, only their tasks
      if (currentUser.role !== 'admin' && t.assignedTo !== currentUser.id) {
        return false;
      }

      // User filter (if admin and selected specific user)
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
        // Check if created, started, or completed falls within the range
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
  }, [tasks, currentUser, filterUser, filterStatus, filterPriority, startDate, endDate]);

  // General Metrics
  const totalTasks = filteredTasks.length;
  const startedTasks = filteredTasks.filter((t) => t.status === 'iniciado').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'trabajando').length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'finalizado').length;
  const pendingTasks = startedTasks; // pendientes
  const overdueTasks = filteredTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

  // Created during period
  const createdInPeriod = useMemo(() => {
    if (!startDate && !endDate) return totalTasks;
    const startMs = startDate ? startDate.getTime() : 0;
    const endMs = endDate ? endDate.getTime() : Infinity;
    return filteredTasks.filter((t) => {
      const ms = new Date(t.createdAt).getTime();
      return ms >= startMs && ms <= endMs;
    }).length;
  }, [filteredTasks, startDate, endDate]);

  // Completed during period
  const completedInPeriod = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (t.status !== 'finalizado') return false;
      if (!startDate && !endDate) return true;
      const compDate = t.completedAt || t.updatedAt;
      const ms = new Date(compDate).getTime();
      const startMs = startDate ? startDate.getTime() : 0;
      const endMs = endDate ? endDate.getTime() : Infinity;
      return ms >= startMs && ms <= endMs;
    }).length;
  }, [filteredTasks, startDate, endDate]);

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // User-specific metrics
  const userMetrics = useMemo(() => {
    return visibleUsers.map((u) => {
      const uTasks = filteredTasks.filter((t) => t.assignedTo === u.id);
      const uStarted = uTasks.filter((t) => t.status === 'iniciado').length;
      const uWorking = uTasks.filter((t) => t.status === 'trabajando').length;
      const uCompleted = uTasks.filter((t) => t.status === 'finalizado');
      const uPending = uStarted;
      const uOverdue = uTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
      const uRate = uTasks.length > 0 ? Math.round((uCompleted.length / uTasks.length) * 100) : 0;

      // Average completion time in hours
      const durations = uCompleted
        .map((t) => calculateDurationHours(t.startedAt || t.createdAt, t.completedAt || undefined))
        .filter((h) => h > 0);

      const avgHours =
        durations.length > 0
          ? Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1))
          : 0;

      return {
        user: u,
        assigned: uTasks.length,
        started: uStarted,
        working: uWorking,
        completed: uCompleted.length,
        pending: uPending,
        overdue: uOverdue,
        rate: uRate,
        avgHours,
      };
    });
  }, [filteredTasks, visibleUsers]);

  // Daily statistics for charts (grouped by day in America/Bogota)
  const dailyStats = useMemo(() => {
    const createdMap = new Map<string, number>();
    const completedMap = new Map<string, number>();

    for (const t of filteredTasks) {
      const cDay = getBogotaDayKey(t.createdAt);
      if (cDay) {
        createdMap.set(cDay, (createdMap.get(cDay) || 0) + 1);
      }
      if (t.status === 'finalizado') {
        const compDay = getBogotaDayKey(t.completedAt || t.updatedAt);
        if (compDay) {
          completedMap.set(compDay, (completedMap.get(compDay) || 0) + 1);
        }
      }
    }

    // Merge and sort dates
    const allCreatedKeys = Array.from(createdMap.keys());
    const allCompletedKeys = Array.from(completedMap.keys());
    const allDays = Array.from(new Set([...allCreatedKeys, ...allCompletedKeys])).sort();
    // Keep last 10 days for clean chart display
    const lastDays = allDays.slice(-10);

    return lastDays.map((day) => ({
      day: day.slice(5), // MM-DD
      fullDay: day,
      created: createdMap.get(day) || 0,
      completed: completedMap.get(day) || 0,
    }));
  }, [filteredTasks]);

  return (
    <div className="w-full flex-1 flex flex-col font-mono pb-12">
      {/* Top Header & Monthly Report Trigger */}
      <div className="bg-[#0e121e]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40">
              <LayoutDashboard className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest">
                  PANEL DE PRODUCTIVIDAD // {currentUser.role === 'admin' ? 'GLOBAL ADMIN' : 'COLABORADOR'}
                </span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40 font-bold">
                  AMERICA/BOGOTA
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                MÉTRICAS & RENDIMIENTO OPERATIVO
              </h2>
            </div>
          </div>

          {/* Monthly Report Action Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-fuchsia-500 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider active:scale-98"
          >
            <FileText className="w-4 h-4 text-black stroke-[2.5]" />
            <span>GENERAR INFORME DEL MES</span>
          </button>
        </div>

        {/* Quick Filter Buttons & Selectors */}
        <div className="mt-4 pt-4 border-t border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-[#090b12] rounded-xl border border-slate-800">
            {(
              [
                { id: 'today', label: 'HOY' },
                { id: 'this_week', label: 'ESTA SEMANA' },
                { id: 'this_month', label: 'ESTE MES' },
                { id: 'last_month', label: 'MES ANTERIOR' },
                { id: 'all', label: 'TODO' },
                { id: 'custom', label: 'PERSONALIZADO' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  quickFilter === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs (if custom chosen) */}
          {quickFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#101422] border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs"
              />
              <span className="text-slate-500">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#101422] border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs"
              />
            </div>
          )}

          {/* Filter Selectors: User, Status, Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentUser.role === 'admin' && (
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="text-xs bg-[#101422] border border-slate-700 text-cyan-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">TODOS LOS USUARIOS</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-[#101422] border border-slate-700 text-cyan-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">TODOS LOS ESTADOS</option>
              <option value="iniciado">INICIADO</option>
              <option value="trabajando">TRABAJANDO</option>
              <option value="finalizado">FINALIZADO</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs bg-[#101422] border border-slate-700 text-cyan-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">TODAS LAS PRIORIDADES</option>
              <option value="alta">ALTA</option>
              <option value="media">MEDIA</option>
              <option value="baja">BAJA</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1. RESUMEN GENERAL HUD CARDS */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          // RESUMEN GENERAL DE INDICADORES
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total */}
          <div className="bg-[#0e121e] border border-cyan-500/30 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-0.5">
              TOTAL TAREAS
            </span>
            <span className="text-xl font-black text-white font-mono">{totalTasks}</span>
          </div>

          {/* Iniciadas */}
          <div className="bg-[#0e121e] border border-cyan-500/40 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-cyan-400 uppercase tracking-wider block mb-0.5">
              INICIADAS
            </span>
            <span className="text-xl font-black text-cyan-300 font-mono">{startedTasks}</span>
          </div>

          {/* Trabajando */}
          <div className="bg-[#0e121e] border border-amber-500/40 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-amber-400 uppercase tracking-wider block mb-0.5">
              EN PROGRESO
            </span>
            <span className="text-xl font-black text-amber-400 font-mono">{inProgressTasks}</span>
          </div>

          {/* Finalizadas */}
          <div className="bg-[#0e121e] border border-emerald-500/40 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-emerald-400 uppercase tracking-wider block mb-0.5">
              FINALIZADAS
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">{completedTasks}</span>
          </div>

          {/* Pendientes */}
          <div className="bg-[#0e121e] border border-indigo-500/40 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-indigo-400 uppercase tracking-wider block mb-0.5">
              PENDIENTES
            </span>
            <span className="text-xl font-black text-indigo-300 font-mono">{pendingTasks}</span>
          </div>

          {/* Vencidas */}
          <div className="bg-[#0e121e] border border-rose-500/40 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-rose-400 uppercase tracking-wider block mb-0.5">
              VENCIDAS
            </span>
            <span className="text-xl font-black text-rose-400 font-mono">{overdueTasks}</span>
          </div>

          {/* Creadas en Periodo */}
          <div className="bg-[#0e121e] border border-slate-700 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-slate-300 uppercase tracking-wider block mb-0.5">
              CREADAS EN PERÍODO
            </span>
            <span className="text-xl font-black text-white font-mono">{createdInPeriod}</span>
          </div>

          {/* Finalizadas en Periodo */}
          <div className="bg-[#0e121e] border border-emerald-500/30 p-3 rounded-xl shadow-xs">
            <span className="text-[9px] text-emerald-300 uppercase tracking-wider block mb-0.5">
              CUMPLIMIENTO
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {completionPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTIVITY CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Chart 1: Tareas por Estado (Visual Donut / Segmented Progress) */}
        <div className="bg-[#0e121e] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              1. TAREAS POR ESTADO
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">{totalTasks} TOTAL</span>
          </div>

          {totalTasks === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">// Sin datos</div>
          ) : (
            <div className="space-y-3 pt-2">
              {/* Proportional Cyberpunk Bar */}
              <div className="h-6 w-full bg-[#080a11] rounded-xl overflow-hidden flex border border-slate-800 p-0.5 gap-1">
                {startedTasks > 0 && (
                  <div
                    style={{ width: `${(startedTasks / totalTasks) * 100}%` }}
                    className="bg-cyan-500 h-full rounded-lg shadow-[0_0_8px_#06b6d4] transition-all"
                    title={`Iniciado: ${startedTasks}`}
                  />
                )}
                {inProgressTasks > 0 && (
                  <div
                    style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                    className="bg-amber-500 h-full rounded-lg shadow-[0_0_8px_#f59e0b] transition-all"
                    title={`Trabajando: ${inProgressTasks}`}
                  />
                )}
                {completedTasks > 0 && (
                  <div
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-lg shadow-[0_0_8px_#10b981] transition-all"
                    title={`Finalizado: ${completedTasks}`}
                  />
                )}
              </div>

              {/* Legend with exact count and percentage */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-[#090b12] p-2 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                    INICIADO
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    {startedTasks}{' '}
                    <span className="text-[10px] text-slate-400">
                      ({Math.round((startedTasks / totalTasks) * 100)}%)
                    </span>
                  </span>
                </div>

                <div className="bg-[#090b12] p-2 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">
                    TRABAJANDO
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    {inProgressTasks}{' '}
                    <span className="text-[10px] text-slate-400">
                      ({Math.round((inProgressTasks / totalTasks) * 100)}%)
                    </span>
                  </span>
                </div>

                <div className="bg-[#090b12] p-2 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                    FINALIZADO
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    {completedTasks}{' '}
                    <span className="text-[10px] text-slate-400">
                      ({Math.round((completedTasks / totalTasks) * 100)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Tareas Creadas vs Finalizadas por Día */}
        <div className="bg-[#0e121e] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              2. CREACIONES VS FINALIZACIONES POR DÍA
            </h4>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Creadas
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Finalizadas
              </span>
            </div>
          </div>

          {dailyStats.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">
              // Sin registros en el período
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
              {dailyStats.map((item, idx) => {
                const maxVal = Math.max(
                  ...dailyStats.map((d) => Math.max(d.created, d.completed)),
                  1
                );
                const createdHeight = Math.round((item.created / maxVal) * 110);
                const compHeight = Math.round((item.completed / maxVal) * 110);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      {/* Bar Created */}
                      <div
                        style={{ height: `${Math.max(createdHeight, 4)}px` }}
                        className="w-2.5 sm:w-3.5 bg-cyan-500 rounded-t transition-all group-hover:brightness-125"
                        title={`Creadas: ${item.created} (${item.fullDay})`}
                      />
                      {/* Bar Completed */}
                      <div
                        style={{ height: `${Math.max(compHeight, 4)}px` }}
                        className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t transition-all group-hover:brightness-125"
                        title={`Finalizadas: ${item.completed} (${item.fullDay})`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono truncate max-w-[36px]">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: Distribución de Tareas por Usuario */}
        <div className="bg-[#0e121e] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              3. CARGA DE TAREAS POR USUARIO
            </h4>
          </div>

          <div className="space-y-3">
            {userMetrics.map((um) => (
              <div key={um.user.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={um.user.avatar}
                      alt={um.user.name}
                      className="w-5 h-5 rounded-md object-cover ring-1 ring-cyan-500/40"
                    />
                    <span className="font-semibold text-white">{um.user.name}</span>
                  </div>
                  <span className="font-mono text-cyan-300 text-xs">
                    {um.assigned} tareas ({totalTasks > 0 ? Math.round((um.assigned / totalTasks) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#080a11] h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{
                      width: `${totalTasks > 0 ? (um.assigned / totalTasks) * 100 : 0}%`,
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Tiempo Promedio de Resolución y % Finalización */}
        <div className="bg-[#0e121e] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              4. TIEMPO PROMEDIO & FINALIZACIONES
            </h4>
          </div>

          <div className="space-y-3">
            {userMetrics.map((um) => (
              <div
                key={um.user.id}
                className="bg-[#090b12] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={um.user.avatar}
                    alt={um.user.name}
                    className="w-7 h-7 rounded-md object-cover ring-1 ring-cyan-500/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{um.user.name}</span>
                    <span className="text-[10px] text-emerald-400">
                      Finalizadas: {um.completed} de {um.assigned} ({um.rate}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">
                    TIEMPO PROM.
                  </span>
                  <span className="text-sm font-black text-cyan-300 font-mono">
                    {um.avgHours > 0 ? `${um.avgHours}h` : '--'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MÉTRICAS DETALLADAS POR USUARIO */}
      <div>
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          // MÉTRICAS INDIVIDUALES DE RENDIMIENTO
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMetrics.map((um) => (
            <div
              key={um.user.id}
              className="bg-[#0e121e] border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-4 transition-all shadow-sm"
            >
              {/* User Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={um.user.avatar}
                    alt={um.user.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-cyan-500/50"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{um.user.name}</h4>
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {um.user.role}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 font-mono">
                  {um.rate}% COMPLETO
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#090b12] p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block mb-0.5">ASIGNADAS</span>
                  <span className="font-black text-white font-mono">{um.assigned}</span>
                </div>
                <div className="bg-[#090b12] p-2 rounded-lg border border-cyan-500/20">
                  <span className="text-[9px] text-cyan-400 block mb-0.5">INICIADAS</span>
                  <span className="font-black text-cyan-300 font-mono">{um.started}</span>
                </div>
                <div className="bg-[#090b12] p-2 rounded-lg border border-amber-500/20">
                  <span className="text-[9px] text-amber-400 block mb-0.5">TRABAJANDO</span>
                  <span className="font-black text-amber-300 font-mono">{um.working}</span>
                </div>
                <div className="bg-[#090b12] p-2 rounded-lg border border-emerald-500/20">
                  <span className="text-[9px] text-emerald-400 block mb-0.5">FINALIZADAS</span>
                  <span className="font-black text-emerald-300 font-mono">{um.completed}</span>
                </div>
                <div className="bg-[#090b12] p-2 rounded-lg border border-rose-500/20">
                  <span className="text-[9px] text-rose-400 block mb-0.5">VENCIDAS</span>
                  <span className="font-black text-rose-400 font-mono">{um.overdue}</span>
                </div>
                <div className="bg-[#090b12] p-2 rounded-lg border border-indigo-500/20">
                  <span className="text-[9px] text-indigo-400 block mb-0.5">TIEMPO PROM</span>
                  <span className="font-black text-indigo-300 font-mono">
                    {um.avgHours > 0 ? `${um.avgHours}h` : '--'}
                  </span>
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
