'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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

// Lightweight count-up hook with cubic ease-out for executive KPI counters
function useCountUp(target: number, duration: number = 550): number {
  const [count, setCount] = useState(target);

  useEffect(() => {
    let animationFrameId: number;
    const startVal = 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

interface DonutSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  glowColor: string;
}

const InteractiveDonutChart: React.FC<{
  segments: DonutSegment[];
  total: number;
}> = ({ segments, total }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const activeKey = selectedKey || hoveredKey;
  const activeSegment = segments.find((s) => s.key === activeKey);

  const radius = 38;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 rounded-2xl bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 transition-colors">
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => {
            const percent = total > 0 ? seg.count / total : 0;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredKey === seg.key;
            const isSelected = selectedKey === seg.key;
            const isDimmed = (hoveredKey && !isHovered) || (selectedKey && !isSelected);

            return (
              <circle
                key={seg.key}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered || isSelected ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${seg.glowColor})` : 'none',
                }}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setSelectedKey(selectedKey === seg.key ? null : seg.key)}
              />
            );
          })}
        </svg>

        {/* Center Feedback Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl font-bold font-mono text-white">
            {activeSegment ? activeSegment.count : total}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">
            {activeSegment ? activeSegment.label : 'Total'}
          </span>
          {activeSegment && total > 0 && (
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
              {Math.round((activeSegment.count / total) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Interactive Legend / Segments */}
      <div className="flex-1 space-y-2 w-full">
        <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between pb-1 border-b border-white/[0.06]">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            Distribución por estado
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {selectedKey ? '1 seleccionado' : 'Hover / Clic para fijar'}
          </span>
        </div>
        <div className="space-y-1.5">
          {segments.map((seg) => {
            const percent = total > 0 ? Math.round((seg.count / total) * 100) : 0;
            const isSelected = selectedKey === seg.key;
            const isHovered = hoveredKey === seg.key;

            return (
              <div
                key={seg.key}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setSelectedKey(selectedKey === seg.key ? null : seg.key)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 ring-1 ring-cyan-500/30'
                    : isHovered
                    ? 'bg-zinc-800/50'
                    : 'hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.glowColor}` }}
                  />
                  <span className="text-xs text-zinc-200 font-medium">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-zinc-400">{seg.count}</span>
                  <span className="text-[11px] text-zinc-500 w-10 text-right font-semibold">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

  // Sanitize filterUser if selected user is not in current project members
  useEffect(() => {
    if (filterUser !== 'all') {
      const exists = users.some((u) => u.id === filterUser);
      if (!exists) {
        setFilterUser('all');
      }
    }
  }, [users, filterUser]);

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

  // Animated KPI Counters with smooth cubic ease-out
  const animatedTotal = useCountUp(totalTasks, 500);
  const animatedCompleted = useCountUp(completedTasks, 500);
  const animatedInProgress = useCountUp(inProgressTasks, 500);
  const animatedOverdue = useCountUp(overdueTasks, 500);
  const animatedPercent = useCountUp(completionPercent, 500);

  // Single Glowing KPI Hero hierarchy: highlighted with Aceternity luminous border
  const primaryHeroKpi = useMemo(() => {
    if (completedTasks > 0) return 'completed';
    if (inProgressTasks > 0) return 'working';
    return 'total';
  }, [completedTasks, inProgressTasks]);

  const donutSegments: DonutSegment[] = useMemo(
    () => [
      {
        key: 'finalizado',
        label: 'Finalizadas',
        count: completedTasks,
        color: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.7)',
      },
      {
        key: 'trabajando',
        label: 'En progreso',
        count: inProgressTasks,
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.7)',
      },
      {
        key: 'iniciado',
        label: 'Iniciadas',
        count: startedTasks,
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.7)',
      },
    ],
    [completedTasks, inProgressTasks, startedTasks]
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 p-4 sm:p-5 rounded-2xl shadow-sm transition-colors">
        <div>
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
            Analítica de rendimiento
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
            Centro de Control: Productividad y Métricas
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Seguimiento de tiempos, estados y rendimiento del equipo en tiempo real.
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
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] p-4 rounded-2xl space-y-3">
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

      {/* Executive KPI Cards with Count-up & Hero Glowing Hierarchy */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div
          className={`bg-[#070c18]/85 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
            primaryHeroKpi === 'total'
              ? 'border-cyan-500/60 ring-1 ring-cyan-400/30 shadow-[0_0_25px_rgba(6,182,212,0.22)]'
              : 'border-white/[0.08] hover:border-cyan-500/35'
          } hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.08)]`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Total gestionadas
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300 border border-white/[0.06]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono tracking-tight">
            {animatedTotal}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            Tareas en el período seleccionado
          </span>
        </div>

        {/* Completed Tasks */}
        <div
          className={`bg-[#070c18]/85 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
            primaryHeroKpi === 'completed'
              ? 'border-emerald-500/60 ring-1 ring-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
              : 'border-white/[0.08] hover:border-emerald-500/35'
          } hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.08)]`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              Finalizadas
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tracking-tight">
              {animatedCompleted}
            </p>
            <span className="text-xs font-semibold text-emerald-400/80 font-mono">
              ({animatedPercent}%)
            </span>
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            Tasa de resolución efectiva
          </span>
        </div>

        {/* In Progress Tasks */}
        <div
          className={`bg-[#070c18]/85 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
            primaryHeroKpi === 'working'
              ? 'border-amber-500/60 ring-1 ring-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              : 'border-white/[0.08] hover:border-amber-500/35'
          } hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(245,158,11,0.08)]`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
              En progreso
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono tracking-tight">
            {animatedInProgress}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            En fase de ejecución activa
          </span>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-[#070c18]/85 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/[0.08] hover:border-rose-500/35 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(244,63,94,0.08)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
              Vencidas
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono tracking-tight">
            {animatedOverdue}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">
            Requieren atención prioritaria
          </span>
        </div>
      </div>

      {/* Visual Analytics: Interactive Donut Chart & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InteractiveDonutChart segments={donutSegments} total={totalTasks} />

        {/* Priority Distribution Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#070c18]/85 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 transition-colors space-y-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Distribución por prioridad
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'}
            </span>
          </div>

          <div className="space-y-3">
            {/* Alta */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Alta
                </span>
                <span className="font-mono text-zinc-400">
                  {priorityDistribution.alta} ({totalTasks > 0 ? Math.round((priorityDistribution.alta / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${totalTasks > 0 ? (priorityDistribution.alta / totalTasks) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep-light pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Media
                </span>
                <span className="font-mono text-zinc-400">
                  {priorityDistribution.media} ({totalTasks > 0 ? Math.round((priorityDistribution.media / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${totalTasks > 0 ? (priorityDistribution.media / totalTasks) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep-light pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Baja */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Baja
                </span>
                <span className="font-mono text-zinc-400">
                  {priorityDistribution.baja} ({totalTasks > 0 ? Math.round((priorityDistribution.baja / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-zinc-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${totalTasks > 0 ? (priorityDistribution.baja / totalTasks) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep-light pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown per Team Member */}
      <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Rendimiento por colaborador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userMetrics.map((m) => (
            <div
              key={m.user.id}
              className="p-4 rounded-xl bg-[#070c18]/90 border border-white/[0.06] hover:border-cyan-500/25 transition-colors space-y-3"
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

              {/* Progress bar with smooth entrance and single luminous sweep */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${m.rate}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sweep-light pointer-events-none" />
                </div>
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
