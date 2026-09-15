'use client';

import React, { useMemo } from 'react';
import { Task, User } from '@/lib/types';
import {
  formatBogotaDateTime,
  formatBogotaMonthYear,
  calculateDuration,
  getBogotaDayKey,
} from '@/lib/dateUtils';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Building2,
  Shield,
} from 'lucide-react';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  currentUser: User;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  users,
  currentUser,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nowBogota = new Date().toISOString();
  const currentMonthName = formatBogotaMonthYear(nowBogota);
  const generationDate = formatBogotaDateTime(nowBogota);

  // Month boundary in Bogota (current month)
  const currentYearMonth = getBogotaDayKey(nowBogota).slice(0, 7); // YYYY-MM

  // Filter tasks created or active during the current month
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => {
      const createdKey = getBogotaDayKey(t.createdAt);
      const updatedKey = getBogotaDayKey(t.updatedAt);
      const completedKey = t.completedAt ? getBogotaDayKey(t.completedAt) : '';
      return (
        createdKey.startsWith(currentYearMonth) ||
        updatedKey.startsWith(currentYearMonth) ||
        completedKey.startsWith(currentYearMonth)
      );
    });
  }, [tasks, currentYearMonth]);

  // General statistics
  const totalManaged = monthTasks.length;
  const totalCompleted = monthTasks.filter((t) => t.status === 'finalizado').length;
  const totalInProgress = monthTasks.filter((t) => t.status === 'trabajando').length;
  const totalPending = monthTasks.filter((t) => t.status === 'iniciado').length;
  const completionRate =
    totalManaged > 0 ? Math.round((totalCompleted / totalManaged) * 100) : 0;

  // Breakdown per user
  const userReports = useMemo(() => {
    return users.map((u) => {
      const uTasks = monthTasks.filter((t) => t.assignedTo === u.id);
      const uCompleted = uTasks.filter((t) => t.status === 'finalizado');
      const uInProgress = uTasks.filter((t) => t.status === 'trabajando');
      const uPending = uTasks.filter((t) => t.status === 'iniciado');
      const uRate = uTasks.length > 0 ? Math.round((uCompleted.length / uTasks.length) * 100) : 0;

      return {
        user: u,
        total: uTasks.length,
        completed: uCompleted.length,
        inProgress: uInProgress.length,
        pending: uPending.length,
        completionRate: uRate,
        completedTasks: uCompleted,
      };
    });
  }, [monthTasks, users]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'ID Tarea',
      'Titulo',
      'Responsable',
      'Prioridad',
      'Estado',
      'Fecha Creacion',
      'Fecha Inicio',
      'Fecha Finalizacion',
      'Duracion',
    ];

    const rows = monthTasks.map((t) => {
      const assigned = users.find((u) => u.id === t.assignedTo)?.name || 'Sin asignar';
      const duration = calculateDuration(t.startedAt || t.createdAt, t.completedAt || undefined);
      return [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${assigned}"`,
        `"${t.priority.toUpperCase()}"`,
        `"${t.status.toUpperCase()}"`,
        `"${formatBogotaDateTime(t.createdAt)}"`,
        `"${formatBogotaDateTime(t.startedAt)}"`,
        `"${formatBogotaDateTime(t.completedAt)}"`,
        `"${duration}"`,
      ].join(',');
    });

    const csvContent = `﻿${headers.join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe_mensual_${currentYearMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans print:p-0 print:bg-white print:text-black animate-fade-in"
    >
      <div
        className="relative w-full max-w-4xl my-auto bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-zinc-900/50 print:hidden gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block truncate">
                Informe ejecutivo
              </span>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                {currentMonthName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-colors active:scale-[0.98]"
              title="Descargar datos en CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV / Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-zinc-950 hover:bg-zinc-200 transition-all active:scale-[0.98]"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          id="printable-report"
          className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-zinc-950 text-zinc-200 print:bg-white print:text-black print:overflow-visible print:p-0 print:space-y-6 custom-scrollbar"
        >
          {/* Header */}
          <div className="border-b border-white/[0.08] pb-6 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block print:text-black">
                  Kanban Duo — Espacio de trabajo
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight print:text-black mt-0.5">
                  Informe mensual de actividades
                </h1>
                <p className="text-xs text-zinc-400 mt-1 print:text-gray-700">
                  Mes evaluado:{' '}
                  <strong className="text-zinc-200 print:text-black">
                    {currentMonthName}
                  </strong>{' '}
                  · Equipo: <strong className="text-zinc-200 print:text-black">General</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-zinc-400 print:text-gray-700 space-y-0.5">
                <div>
                  Fecha de generación:{' '}
                  <strong className="text-zinc-200 print:text-black font-mono">{generationDate}</strong>
                </div>
                <div>
                  Zona horaria: <strong className="text-zinc-300 print:text-black">America/Bogota (UTC-5)</strong>
                </div>
                <div>
                  Generado por:{' '}
                  <strong className="text-zinc-200 print:text-black">{currentUser.name}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Cards */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2 print:text-black">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              1. Resumen ejecutivo del equipo
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/40 border border-white/[0.06] p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
                <span className="text-[11px] text-zinc-400 font-medium block mb-1 print:text-gray-600">
                  Total gestionadas
                </span>
                <span className="text-2xl font-semibold text-white print:text-black font-mono tracking-tight">
                  {totalManaged}
                </span>
              </div>

              <div className="bg-zinc-900/40 border border-white/[0.06] p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
                <span className="text-[11px] text-zinc-400 font-medium block mb-1 print:text-gray-600">
                  Finalizadas
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-emerald-400 print:text-black font-mono tracking-tight">
                    {totalCompleted}
                  </span>
                  <span className="text-xs font-medium text-emerald-400/80 print:text-black">
                    ({completionRate}%)
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/[0.06] p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
                <span className="text-[11px] text-zinc-400 font-medium block mb-1 print:text-gray-600">
                  En progreso
                </span>
                <span className="text-2xl font-semibold text-amber-400 print:text-black font-mono tracking-tight">
                  {totalInProgress}
                </span>
              </div>

              <div className="bg-zinc-900/40 border border-white/[0.06] p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
                <span className="text-[11px] text-zinc-400 font-medium block mb-1 print:text-gray-600">
                  Iniciadas / Pendientes
                </span>
                <span className="text-2xl font-semibold text-cyan-400 print:text-black font-mono tracking-tight">
                  {totalPending}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: User Activity Breakdown */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 print:text-black">
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              2. Desglose por colaborador
            </h2>

            {userReports.map((report) => (
              <div
                key={report.user.id}
                className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4 sm:p-5 space-y-4 print:border-gray-300 print:bg-white print:p-3 print:page-break-inside-avoid"
              >
                {/* User Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] print:border-gray-300 gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={report.user.avatar}
                      alt={report.user.name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 print:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white print:text-black">
                          {report.user.name}
                        </h3>
                        <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 print:border print:border-gray-400 print:text-black">
                          {report.user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 print:text-gray-600">
                        {report.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Quick User Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-400 print:text-black">
                      Asignadas: <strong className="text-zinc-200">{report.total}</strong>
                    </span>
                    <span className="text-emerald-400 print:text-black">
                      Finalizadas: <strong>{report.completed}</strong> ({report.completionRate}%)
                    </span>
                    <span className="text-amber-400 print:text-black">
                      En progreso: <strong>{report.inProgress}</strong>
                    </span>
                    <span className="text-cyan-400 print:text-black">
                      Pendientes: <strong>{report.pending}</strong>
                    </span>
                  </div>
                </div>

                {/* Finished Tasks Detail Table */}
                <div>
                  <h4 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2 print:text-black">
                    Tareas finalizadas ({report.completedTasks.length}):
                  </h4>

                  {report.completedTasks.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic bg-zinc-950/40 p-3 rounded-lg border border-white/[0.04] print:bg-gray-50 print:text-gray-600 print:border-gray-300">
                      No registra tareas finalizadas durante el período evaluado.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-white/[0.06] print:border-gray-300">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-400 border-b border-white/[0.06] uppercase text-[10px] tracking-wider print:bg-gray-100 print:text-black print:border-gray-300">
                            <th className="py-2 px-3 font-semibold">Tarea</th>
                            <th className="py-2 px-3 font-semibold">Prioridad</th>
                            <th className="py-2 px-3 font-semibold">Inicio</th>
                            <th className="py-2 px-3 font-semibold">Fin</th>
                            <th className="py-2 px-3 font-semibold">Duración</th>
                            <th className="py-2 px-3 font-semibold text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] print:divide-gray-300">
                          {report.completedTasks.map((t) => {
                            const duration = calculateDuration(
                              t.startedAt || t.createdAt,
                              t.completedAt || undefined
                            );
                            return (
                              <tr
                                key={t.id}
                                className="hover:bg-zinc-900/40 transition-colors print:hover:bg-transparent"
                              >
                                <td className="py-2.5 px-3 font-medium text-zinc-200 print:text-black max-w-xs">
                                  {t.title}
                                </td>
                                <td className="py-2.5 px-3 uppercase text-[11px] text-zinc-400 print:text-black">
                                  {t.priority}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px] print:text-gray-700">
                                  {formatBogotaDateTime(t.startedAt)}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-400 font-mono text-[11px] print:text-black">
                                  {formatBogotaDateTime(t.completedAt)}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px] print:text-black">
                                  {duration}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium uppercase print:border-gray-400 print:text-black print:bg-transparent">
                                    Finalizada
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Summary */}
          <div className="border-t border-white/[0.08] pt-6 print:border-black">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 print:text-black">
              3. Resumen final consolidado
            </h2>
            <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-gray-400 print:bg-gray-50">
              <div className="text-xs space-y-1.5 text-zinc-300">
                <div>
                  • Total de tareas gestionadas por el equipo:{' '}
                  <strong className="text-white print:text-black font-semibold">
                    {totalManaged}
                  </strong>
                </div>
                <div>
                  • Tareas finalizadas exitosamente:{' '}
                  <strong className="text-emerald-400 print:text-black font-semibold">
                    {totalCompleted} ({completionRate}%)
                  </strong>
                </div>
                <div>
                  • Tareas activas en progreso:{' '}
                  <strong className="text-amber-400 print:text-black font-semibold">
                    {totalInProgress}
                  </strong>
                </div>
                <div>
                  • Tareas pendientes en cola:{' '}
                  <strong className="text-cyan-400 print:text-black font-semibold">
                    {totalPending}
                  </strong>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-white/[0.06] sm:pl-5 pt-3 sm:pt-0 print:border-gray-300">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block print:text-gray-600">
                  Rendimiento global
                </span>
                <span className="text-sm font-semibold text-zinc-100 print:text-black">
                  {completionRate >= 70
                    ? 'Excelente — Alta productividad'
                    : completionRate >= 40
                    ? 'Estable — Flujo continuo'
                    : 'En curso — Tareas en desarrollo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-zinc-900/50 border-t border-white/[0.08] flex items-center justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-colors active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
