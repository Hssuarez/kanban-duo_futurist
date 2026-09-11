'use client';

import React, { useMemo } from 'react';
import { Task, User } from '@/lib/types';
import {
  formatBogotaDateTime,
  formatBogotaDate,
  formatBogotaMonthYear,
  calculateDuration,
  getBogotaDayKey,
} from '@/lib/dateUtils';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Building2,
  Calendar,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-mono overflow-y-auto print:p-0 print:bg-white print:text-black">
      <div
        className="bg-[#0b0e17] border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-cyan-500/20 bg-[#0e121e] print:hidden gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest block truncate">
                INFORME EJECUTIVO
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase truncate">
                {currentMonthName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors uppercase tracking-wider"
              title="Descargar datos en CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">CSV/EXCEL</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all uppercase tracking-wider"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">DESCARGAR </span>
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          id="printable-report"
          className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-[#090b12] text-slate-200 print:bg-white print:text-black print:overflow-visible print:p-0 print:space-y-6"
        >
          {/* PORTADA / ENCABEZADO */}
          <div className="border-b-2 border-cyan-500/40 pb-5 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block print:text-black">
                  PORTAL DE GESTIÓN // KANBAN DUO
                </span>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider print:text-black mt-0.5">
                  INFORME MENSUAL DE ACTIVIDADES
                </h1>
                <p className="text-xs text-slate-400 mt-1 uppercase print:text-gray-700">
                  Mes Evaluado:{' '}
                  <strong className="text-cyan-300 print:text-black font-mono">
                    {currentMonthName}
                  </strong>{' '}
                  | Equipo: <strong className="text-white print:text-black">Equipo Kanban Duo</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-400 print:text-gray-700 font-mono">
                <div>
                  Fecha de Generación:{' '}
                  <strong className="text-white print:text-black">{generationDate}</strong>
                </div>
                <div>
                  Zona Horaria: <strong className="text-cyan-400 print:text-black">America/Bogota (UTC-5)</strong>
                </div>
                <div>
                  Generado por:{' '}
                  <strong className="text-white print:text-black">{currentUser.name}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* RESUMEN DEL EQUIPO */}
          <div>
            <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2 print:text-black">
              <Building2 className="w-4 h-4" />
              // 1. RESUMEN EJECUTIVO DEL EQUIPO
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0e121e] border border-cyan-500/30 p-3.5 rounded-xl print:border-gray-400 print:bg-gray-50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 print:text-gray-600">
                  TOTAL TAREAS GESTIONADAS
                </span>
                <span className="text-2xl font-black text-white print:text-black font-mono">
                  {totalManaged}
                </span>
              </div>

              <div className="bg-[#0e121e] border border-emerald-500/30 p-3.5 rounded-xl print:border-gray-400 print:bg-gray-50">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1 print:text-gray-600">
                  TOTAL FINALIZADAS
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 print:text-black font-mono">
                    {totalCompleted}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 print:text-black">
                    ({completionRate}%)
                  </span>
                </div>
              </div>

              <div className="bg-[#0e121e] border border-amber-500/30 p-3.5 rounded-xl print:border-gray-400 print:bg-gray-50">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block mb-1 print:text-gray-600">
                  TOTAL EN PROGRESO (TRABAJANDO)
                </span>
                <span className="text-2xl font-black text-amber-400 print:text-black font-mono">
                  {totalInProgress}
                </span>
              </div>

              <div className="bg-[#0e121e] border border-cyan-500/30 p-3.5 rounded-xl print:border-gray-400 print:bg-gray-50">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block mb-1 print:text-gray-600">
                  TOTAL PENDIENTES (INICIADAS)
                </span>
                <span className="text-2xl font-black text-cyan-300 print:text-black font-mono">
                  {totalPending}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVIDAD POR USUARIO */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 print:text-black">
              <Shield className="w-4 h-4" />
              // 2. ACTIVIDAD DETALLADA POR COLABORADOR
            </h2>

            {userReports.map((report, idx) => (
              <div
                key={report.user.id}
                className="bg-[#0d101b] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 print:border-gray-300 print:bg-white print:p-3 print:page-break-inside-avoid"
              >
                {/* User Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 print:border-gray-300 gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={report.user.avatar}
                      alt={report.user.name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-cyan-500/50 print:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white print:text-black">
                          {report.user.name}
                        </h3>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.2 rounded bg-slate-800 text-slate-300 print:border print:border-gray-400 print:text-black">
                          {report.user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 print:text-gray-600">
                        {report.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Quick User Stats */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-300 print:text-black">
                      Asignadas: <strong>{report.total}</strong>
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
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 print:text-black">
                    Detalle de Tareas Finalizadas ({report.completedTasks.length}):
                  </h4>

                  {report.completedTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic bg-[#090b12] p-2.5 rounded-lg border border-slate-800/80 print:bg-gray-50 print:text-gray-600 print:border-gray-300">
                      // No registra tareas finalizadas durante el período evaluado.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                      <table className="w-full text-left text-[11px] font-mono border-collapse">
                        <thead>
                          <tr className="bg-[#121625] text-cyan-400 border-b border-slate-800 uppercase print:bg-gray-100 print:text-black print:border-gray-300">
                            <th className="p-2.5">Tarea</th>
                            <th className="p-2.5">Prioridad</th>
                            <th className="p-2.5">Inicio (Started)</th>
                            <th className="p-2.5">Fin (Completed)</th>
                            <th className="p-2.5">Duración</th>
                            <th className="p-2.5 text-right">Estado Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                          {report.completedTasks.map((t) => {
                            const duration = calculateDuration(
                              t.startedAt || t.createdAt,
                              t.completedAt || undefined
                            );
                            return (
                              <tr
                                key={t.id}
                                className="hover:bg-[#101422] transition-colors print:hover:bg-transparent"
                              >
                                <td className="p-2.5 font-bold text-white print:text-black max-w-xs">
                                  {t.title}
                                </td>
                                <td className="p-2.5 uppercase font-semibold text-slate-300 print:text-black">
                                  {t.priority}
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-gray-700">
                                  {formatBogotaDateTime(t.startedAt)}
                                </td>
                                <td className="p-2.5 text-emerald-400 print:text-black font-semibold">
                                  {formatBogotaDateTime(t.completedAt)}
                                </td>
                                <td className="p-2.5 text-cyan-300 print:text-black font-bold">
                                  {duration}
                                </td>
                                <td className="p-2.5 text-right">
                                  <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase print:border-gray-400 print:text-black print:bg-transparent">
                                    FINALIZADA
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

          {/* RESUMEN FINAL */}
          <div className="border-t-2 border-cyan-500/40 pt-5 print:border-black">
            <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-3 print:text-black">
              // 3. RESUMEN FINAL CONSOLIDADO
            </h2>
            <div className="bg-[#0e121e] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-gray-400 print:bg-gray-50">
              <div className="text-xs space-y-1">
                <div>
                  • Total de tareas gestionadas por el equipo:{' '}
                  <strong className="text-white print:text-black font-mono font-bold">
                    {totalManaged}
                  </strong>
                </div>
                <div>
                  • Tareas finalizadas exitosamente:{' '}
                  <strong className="text-emerald-400 print:text-black font-mono font-bold">
                    {totalCompleted} ({completionRate}%)
                  </strong>
                </div>
                <div>
                  • Tareas activas en progreso:{' '}
                  <strong className="text-amber-400 print:text-black font-mono font-bold">
                    {totalInProgress}
                  </strong>
                </div>
                <div>
                  • Tareas pendientes en cola:{' '}
                  <strong className="text-cyan-300 print:text-black font-mono font-bold">
                    {totalPending}
                  </strong>
                </div>
              </div>

              <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 print:border-gray-300">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block print:text-gray-600">
                  ESTADO DE RENDIMIENTO
                </span>
                <span className="text-base font-black text-cyan-400 print:text-black uppercase">
                  {completionRate >= 70
                    ? 'ÓPTIMO // ALTA PRODUCTIVIDAD'
                    : completionRate >= 40
                    ? 'EN PROCESO // FLUJO MODERADO'
                    : 'INICIAL // CARGA EN CURSO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-[#0e121e] border-t border-cyan-500/20 flex items-center justify-between print:hidden">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            // KANBAN DUO EXECUTIVE REPORT SYSTEM
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white uppercase tracking-wider transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
