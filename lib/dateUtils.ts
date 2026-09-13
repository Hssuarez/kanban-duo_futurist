/**
 * Date and Time utilities for Kanban Duo
 * Timezone: America/Bogota (Colombia, UTC-5)
 */

export const BOGOTA_TZ = 'America/Bogota';

/**
 * Returns current Date in America/Bogota as an ISO string
 */
export function getNowBogotaIso(): string {
  return new Date().toISOString();
}

/**
 * Formats an ISO date string to Colombia format: DD MMM YYYY, HH:mm
 * e.g., '11 SEP 2026, 16:20'
 */
export function formatBogotaDateTime(isoString?: string | null): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';

    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(d).toUpperCase();
  } catch {
    return '--';
  }
}

/**
 * Formats an ISO date string to short date: DD/MM/YYYY
 * e.g., '11/09/2026'
 */
export function formatBogotaDate(isoString?: string | null): string {
  if (!isoString) return '--';
  try {
    const clean = isoString.trim();
    // Prevenir desfase horario UTC-5 en strings de solo fecha YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${d}/${m}/${y}`;
    }

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';

    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d);
  } catch {
    return '--';
  }
}

/**
 * Formats to standard month name & year: e.g. 'SEPTIEMBRE 2026'
 */
export function formatBogotaMonthYear(isoOrDate: string | Date = new Date()): string {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(d).toUpperCase();
  } catch {
    return 'MES ACTUAL';
  }
}

/**
 * Formats time only: HH:mm in America/Bogota
 */
export function formatBogotaTime(isoString?: string | null): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';

    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(d);
  } catch {
    return '--';
  }
}

/**
 * Extracts YYYY-MM-DD key in America/Bogota from an ISO string
 */
export function getBogotaDayKey(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BOGOTA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // Outputs YYYY-MM-DD
  } catch {
    return '';
  }
}

/**
 * Calculates human-readable duration between two ISO dates
 * e.g. '2h 35m', '1d 4h', '< 1m'
 */
export function calculateDuration(
  startIso?: string | null,
  endIso?: string | null
): string {
  if (!startIso) return '--';
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return '--';

  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '< 1 min';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) {
    const remMinutes = diffMinutes % 60;
    return remMinutes > 0 ? `${diffHours}h ${remMinutes}m` : `${diffHours}h`;
  }
  const remHours = diffHours % 24;
  return remHours > 0 ? `${diffDays}d ${remHours}h` : `${diffDays}d`;
}

/**
 * Calculates duration in decimal hours for statistics
 */
export function calculateDurationHours(
  startIso?: string | null,
  endIso?: string | null
): number {
  if (!startIso) return 0;
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Number(((end - start) / (1000 * 60 * 60)).toFixed(1));
}

/**
 * Date range definitions for Dashboard filters in America/Bogota
 */
export type QuickFilterPeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom'
  | 'all';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Returns Start & End Date bounds for quick filter in America/Bogota
 */
export function getFilterDateRange(
  period: QuickFilterPeriod,
  customStart?: string,
  customEnd?: string
): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();

  // Helper to construct Date in Colombia timezone approximation
  const todayKey = getBogotaDayKey(now.toISOString());
  const [year, month, day] = todayKey.split('-').map(Number);

  if (period === 'all') {
    return { startDate: null, endDate: null };
  }

  if (period === 'today') {
    const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0)); // 00:00 Bogota (UTC-5)
    const end = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999));
    return { startDate: start, endDate: end };
  }

  if (period === 'this_week') {
    // Current day of week in Bogota (0 = Sun, 1 = Mon ... 6 = Sat)
    const curDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = curDate.getUTCDay();
    const diffToMonday = (dayOfWeek + 6) % 7; // Monday = 0
    const startDay = day - diffToMonday;

    const start = new Date(Date.UTC(year, month - 1, startDay, 5, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, startDay + 7, 4, 59, 59, 999));
    return { startDate: start, endDate: end };
  }

  if (period === 'this_month') {
    const start = new Date(Date.UTC(year, month - 1, 1, 5, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 4, 59, 59, 999));
    return { startDate: start, endDate: end };
  }

  if (period === 'last_month') {
    const start = new Date(Date.UTC(year, month - 2, 1, 5, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, 1, 4, 59, 59, 999));
    return { startDate: start, endDate: end };
  }

  if (period === 'custom' && customStart && customEnd) {
    const [sy, sm, sd] = customStart.split('-').map(Number);
    const [ey, em, ed] = customEnd.split('-').map(Number);
    const start = new Date(Date.UTC(sy, sm - 1, sd, 5, 0, 0));
    const end = new Date(Date.UTC(ey, em - 1, ed + 1, 4, 59, 59, 999));
    return { startDate: start, endDate: end };
  }

  return { startDate: null, endDate: null };
}

/**
 * Formats a due date (YYYY-MM-DD) into a clean, timezone-safe short badge
 * e.g. 'HOY, 13 SEP', 'MAÑANA, 14 SEP', '15 SEP'
 */
export function formatDueDateBadge(dueDate?: string | null): string {
  if (!dueDate) return '--';
  try {
    const clean = dueDate.trim();
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);

      const MONTHS = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
        'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
      ];
      const monthName = MONTHS[month - 1] || `${month}`;

      const todayKey = getBogotaDayKey(new Date().toISOString());
      const [ty, tm, td] = todayKey.split('-').map(Number);
      const todayDateUtc = Date.UTC(ty, tm - 1, td);
      const dueDateUtc = Date.UTC(year, month - 1, day);
      const diffDays = Math.round((dueDateUtc - todayDateUtc) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `HOY, ${day} ${monthName}`;
      }
      if (diffDays === 1) {
        return `MAÑANA, ${day} ${monthName}`;
      }
      if (diffDays === -1) {
        return `AYER, ${day} ${monthName}`;
      }

      return `${day} ${monthName}`;
    }

    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return dueDate;

    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      day: 'numeric',
      month: 'short',
    });
    return formatter.format(d).toUpperCase();
  } catch {
    return dueDate;
  }
}

/**
 * Checks if a task is due today in America/Bogota
 */
export function isTaskDueToday(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'finalizado') return false;
  const todayKey = getBogotaDayKey(new Date().toISOString());
  const dueKey = dueDate.trim().substring(0, 10);
  return dueKey === todayKey;
}

/**
 * Checks if a task is overdue (due_date in the past relative to America/Bogota and status !== 'finalizado')
 */
export function isTaskOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'finalizado') return false;
  const todayKey = getBogotaDayKey(new Date().toISOString());
  const dueKey = dueDate.trim().substring(0, 10);
  return dueKey < todayKey;
}
