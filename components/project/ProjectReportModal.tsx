'use client';

import React, { useState, useMemo } from 'react';
import { Project, Task, User } from '@/lib/types';
import {
  X,
  Printer,
  FileSpreadsheet,
  Copy,
  Check,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { formatDueDateBadge, isTaskOverdue } from '@/lib/dateUtils';

interface ProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  tasks: Task[];
  users: User[];
}

export const ProjectReportModal: React.FC<ProjectReportModalProps> = ({
  isOpen,
  onClose,
  project,
  tasks,
  users,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const stats = useMemo(() => {
    if (!project) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, highPriority: 0, completionRate: 0, memberStats: [] };
    }
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'finalizado').length;
    const inProgress = tasks.filter((t) => t.status === 'trabajando').length;
    const pending = tasks.filter((t) => t.status === 'iniciado').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
    const highPriority = tasks.filter((t) => t.priority === 'alta').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // By member
    const memberStats = users.map((u) => {
      const uTasks = tasks.filter((t) => t.assignedTo === u.id);
      const uDone = uTasks.filter((t) => t.status === 'finalizado').length;
      return {
        user: u,
        total: uTasks.length,
        done: uDone,
        rate: uTasks.length > 0 ? Math.round((uDone / uTasks.length) * 100) : 0,
      };
    }).filter((m) => m.total > 0);

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      highPriority,
      completionRate,
      memberStats,
    };
  }, [tasks, users]);

  if (!isOpen || !project) return null;

  // Handle CSV Download
  const handleDownloadCsv = () => {
    if (!project) return;
    const headers = ['ID', 'Titulo', 'Estado', 'Prioridad', 'Asignado', 'Vencimiento', 'Subtareas', 'Etiquetas'];
    const rows = tasks.map((t) => {
      const assignee = users.find((u) => u.id === t.assignedTo)?.name || 'Sin asignar';
      const subtaskStr = t.subtasks
        ? `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`
        : '0/0';
      const tagsStr = t.tags ? t.tags.join(';') : '';

      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        `"${assignee}"`,
        t.dueDate || 'Sin fecha',
        subtaskStr,
        `"${tagsStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${project.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Copy Markdown
  const handleCopyMarkdown = () => {
    if (!project) return;
    let md = `# 📊 Reporte Ejecutivo: ${project.name}\n\n`;
    md += `*Generado el ${new Date().toLocaleDateString('es-CO')} · KanbanDuo*\n\n`;
    md += `### Métricas Clave\n`;
    md += `- **Total tareas:** ${stats.total}\n`;
    md += `- **Completadas:** ${stats.completed} (${stats.completionRate}%)\n`;
    md += `- **En curso:** ${stats.inProgress}\n`;
    md += `- **Por iniciar:** ${stats.pending}\n`;
    md += `- **Vencidas:** ${stats.overdue}\n\n`;

    md += `### Desglose por Responsable\n`;
    stats.memberStats.forEach((m) => {
      md += `- **${m.user.name}:** ${m.done}/${m.total} completadas (${m.rate}%)\n`;
    });
    md += `\n### Listado de Tareas\n`;
    md += `| Título | Estado | Prioridad | Asignado | Vence |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    tasks.forEach((t) => {
      const u = users.find((user) => user.id === t.assignedTo)?.name || 'Sin asignar';
      md += `| ${t.title} | ${t.status} | ${t.priority} | ${u} | ${t.dueDate || '-'} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans"
    >
      <div
        className="relative w-full max-w-2xl my-auto bg-[#070c18] border border-cyan-500/25 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.1)] overflow-hidden text-zinc-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter print:m-0 print:border-none print:shadow-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#050811]/95 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate tracking-wide">
                Reporte de Proyecto: {project.name}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {stats.total} tareas registradas · {stats.completionRate}% completado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir o exportar PDF"
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              title="Descargar datos en CSV para Excel"
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              title="Copiar resumen en Markdown"
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 hover:text-white border border-cyan-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedMd ? '¡Copiado!' : 'Markdown'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-5 print:p-0 print:space-y-4">
          {/* Printable Header */}
          <div className="hidden print:block pb-4 border-b border-zinc-200">
            <h1 className="text-xl font-bold text-zinc-900">{project.name}</h1>
            <p className="text-sm text-zinc-600">Reporte Ejecutivo de Productividad y Estado de Tareas</p>
            <p className="text-xs text-zinc-400 mt-1">Generado: {new Date().toLocaleDateString('es-CO')} · KanbanDuo</p>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#090f1f] border border-white/[0.06] print:border-zinc-300 print:bg-zinc-50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 print:text-zinc-600 block mb-1">
                Total Tareas
              </span>
              <span className="text-xl font-bold font-mono text-white print:text-zinc-900">
                {stats.total}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#090f1f] border border-emerald-500/25 print:border-zinc-300 print:bg-zinc-50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block mb-1">
                Completadas
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-emerald-300 print:text-emerald-700">
                  {stats.completed}
                </span>
                <span className="text-xs font-mono text-zinc-400">({stats.completionRate}%)</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#090f1f] border border-amber-500/25 print:border-zinc-300 print:bg-zinc-50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block mb-1">
                En Progreso
              </span>
              <span className="text-xl font-bold font-mono text-amber-300 print:text-amber-700">
                {stats.inProgress}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#090f1f] border border-rose-500/25 print:border-zinc-300 print:bg-zinc-50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 block mb-1">
                Vencidas / Urgentes
              </span>
              <span className="text-xl font-bold font-mono text-rose-300 print:text-rose-700">
                {stats.overdue}
              </span>
            </div>
          </div>

          {/* Members Breakdown */}
          {stats.memberStats.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider print:text-zinc-700">
                Desglose por Responsable
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stats.memberStats.map((m) => (
                  <div
                    key={m.user.id}
                    className="p-2.5 rounded-xl bg-[#090f1f] border border-white/[0.06] flex items-center justify-between text-xs print:border-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      {m.user.avatar ? (
                        <img src={m.user.avatar} alt={m.user.name} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                          {m.user.name[0]}
                        </div>
                      )}
                      <span className="font-medium text-zinc-200 print:text-zinc-800">{m.user.name}</span>
                    </div>
                    <span className="font-mono text-zinc-400 print:text-zinc-600">
                      {m.done}/{m.total} ({m.rate}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Task Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider print:text-zinc-700">
              Listado Detallado de Tareas
            </h4>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden print:border-zinc-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-[#050811] text-zinc-400 print:bg-zinc-100 print:text-zinc-800 font-mono text-[11px]">
                      <th className="py-2 px-3">Título</th>
                      <th className="py-2 px-2.5">Estado</th>
                      <th className="py-2 px-2.5">Prioridad</th>
                      <th className="py-2 px-2.5">Responsable</th>
                      <th className="py-2 px-2.5">Vence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] print:divide-zinc-200">
                    {tasks.map((t) => {
                      const assignee = users.find((u) => u.id === t.assignedTo);
                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/40 print:hover:bg-transparent">
                          <td className="py-2 px-3 font-medium text-zinc-200 print:text-zinc-900">
                            {t.title}
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {t.tags.map((tag) => (
                                  <span key={tag} className="text-[9px] font-mono text-cyan-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] text-zinc-400 capitalize">
                            {t.status}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] text-zinc-400 capitalize">
                            {t.priority}
                          </td>
                          <td className="py-2 px-2.5 text-zinc-400 print:text-zinc-700">
                            {assignee?.name || 'Sin asignar'}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] text-zinc-400">
                            {t.dueDate ? formatDueDateBadge(t.dueDate) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 sticky bottom-0 z-10 flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-[#050811] print:hidden">
          <span className="text-[11px] text-zinc-500 font-mono">
            {project.name} · Exportación Ejecutiva
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
