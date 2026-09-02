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

export function addDaysToISO(isoDate: string, days: number): string {
  const d = parseISOLocalDate(isoDate);
  d.setDate(d.getDate() + days);
  return formatLocalDateToISO(d);
}

/**
 * Generates array of ISO date strings ("YYYY-MM-DD") between start and end date
 */
export function generateDateRange(
  startDateIso: string,
  endDateIso: string,
  weekdaysOnly: boolean = true,
  maxDays: number = 60
): string[] {
  const dates: string[] = [];
  const start = parseISOLocalDate(startDateIso);
  const end = parseISOLocalDate(endDateIso);

  if (start > end) return [startDateIso];

  const current = new Date(start.getTime());
  let count = 0;

  while (current <= end && count < maxDays) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!weekdaysOnly || !isWeekend) {
      dates.push(formatLocalDateToISO(current));
    }

    current.setDate(current.getDate() + 1);
    count++;
  }

  return dates;
}

/**
 * Generates recurring dates matching specific days of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
 */
export function generateRecurringDates(
  startDateIso: string,
  selectedDaysOfWeek: number[], // e.g. [1, 3] for Mon & Wed
  options: { endDateIso?: string; weeksCount?: number },
  maxDays: number = 40
): string[] {
  const dates: string[] = [];
  const start = parseISOLocalDate(startDateIso);
  
  let end: Date;
  if (options.endDateIso) {
    end = parseISOLocalDate(options.endDateIso);
  } else if (options.weeksCount) {
    end = new Date(start.getTime());
    end.setDate(end.getDate() + options.weeksCount * 7);
  } else {
    end = new Date(start.getTime());
    end.setDate(end.getDate() + 28); // 4 weeks default
  }

  const current = new Date(start.getTime());
  let iterations = 0;

  while (current <= end && dates.length < maxDays && iterations < 180) {
    const dayOfWeek = current.getDay();
    if (selectedDaysOfWeek.includes(dayOfWeek)) {
      dates.push(formatLocalDateToISO(current));
    }
    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return dates;
}
