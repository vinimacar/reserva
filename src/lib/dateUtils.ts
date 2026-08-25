/**
 * Date utility functions to avoid timezone offset bugs (e.g. UTC vs local time in Brazil)
 */

export function formatLocalDateToISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISOLocalDate(isoDate: string): Date {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 12, 0, 0); // midday avoids edge-of-day DST issues
}

export function formatDateBR(isoDate: string, includeWeekday: boolean = true): string {
  try {
    const d = parseISOLocalDate(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    
    if (includeWeekday) {
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function getRelativeDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatLocalDateToISO(d);
}
