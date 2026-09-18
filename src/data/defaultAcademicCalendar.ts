import {
  AcademicCalendarConfig,
  AcademicPeriodType,
  AcademicTerm,
  CalendarSpecialDay,
} from '../types';
import { parseISOLocalDate, formatLocalDateToISO } from '../lib/dateUtils';

/**
 * Pre-defined national & school holidays for Brazilian academic calendars.
 */
export function getStandardBrazilianHolidays(year: number): CalendarSpecialDay[] {
  return [
    {
      id: `feriado-${year}-01-01`,
      date: `${year}-01-01`,
      title: 'Confraternização Universal (Ano Novo)',
      type: 'FERIADO',
      description: 'Feriado Nacional',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-carnaval`,
      date: `${year}-03-03`,
      endDate: `${year}-03-05`,
      title: 'Recesso de Carnaval e Quarta-Feira de Cinzas',
      type: 'RECESSO',
      description: 'Recesso escolar e ponto facultativo',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-paixao`,
      date: `${year}-04-18`,
      title: 'Sexta-feira da Paixão',
      type: 'FERIADO',
      description: 'Feriado Nacional Religioso',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-tiradentes`,
      date: `${year}-04-21`,
      title: 'Tiradentes',
      type: 'FERIADO',
      description: 'Feriado Nacional Cívico',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-trabalho`,
      date: `${year}-05-01`,
      title: 'Dia Mundial do Trabalho',
      type: 'FERIADO',
      description: 'Feriado Nacional',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-corpus-christi`,
      date: `${year}-06-19`,
      title: 'Corpus Christi',
      type: 'FERIADO',
      description: 'Ponto Facultativo Estadual e Municipal',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-julho`,
      date: `${year}-07-14`,
      endDate: `${year}-07-25`,
      title: 'Recesso Escolar de Meio de Ano (Férias Docentes/Discentes)',
      type: 'RECESSO',
      description: 'Recesso escolar regulamentar de julho',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-independencia`,
      date: `${year}-09-07`,
      title: 'Independência do Brasil',
      type: 'FERIADO',
      description: 'Feriado Nacional da Pátria',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-aparecida`,
      date: `${year}-10-12`,
      title: 'Nossa Senhora Aparecida',
      type: 'FERIADO',
      description: 'Padroeira do Brasil e Dia das Crianças',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-professor`,
      date: `${year}-10-15`,
      title: 'Dia do Professor e dos Profissionais da Educação',
      type: 'FERIADO',
      description: 'Feriado Escolar Regulamentar em toda a rede de ensino',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-finados`,
      date: `${year}-11-02`,
      title: 'Finados',
      type: 'FERIADO',
      description: 'Feriado Nacional',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-republica`,
      date: `${year}-11-15`,
      title: 'Proclamação da República',
      type: 'FERIADO',
      description: 'Feriado Nacional',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-consciencia-negra`,
      date: `${year}-11-20`,
      title: 'Dia Nacional de Zumbi e da Consciência Negra',
      type: 'FERIADO',
      description: 'Feriado Nacional (Lei Federal 14.759)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-natal`,
      date: `${year}-12-25`,
      title: 'Natal',
      type: 'FERIADO',
      description: 'Feriado Nacional',
      allowBooking: false,
    },
  ];
}

/**
 * Standard Sábados Letivos (school saturdays) for reposição and activities
 */
export function getStandardSaturdaySchoolDays(year: number): CalendarSpecialDay[] {
  return [
    {
      id: `sabado-${year}-03-29`,
      date: `${year}-03-29`,
      title: 'Sábado Letivo - Acolhimento e Reunião com a Comunidade Escolar',
      type: 'SABADO_LETIVO',
      description: 'Atividades pedagógicas e integração com famílias. Horário de Segunda-feira.',
      equivalentWeekday: 1, // Segunda-feira
      allowBooking: true,
    },
    {
      id: `sabado-${year}-05-31`,
      date: `${year}-05-31`,
      title: 'Sábado Letivo - Feira de Ciências, Tecnologia & Inovação',
      type: 'SABADO_LETIVO',
      description: 'Exposição de projetos maker e experiências nos laboratórios. Horário de Quarta-feira.',
      equivalentWeekday: 3, // Quarta-feira
      allowBooking: true,
    },
    {
      id: `sabado-${year}-08-30`,
      date: `${year}-08-30`,
      title: 'Sábado Letivo - Mostra Cultural & Robótica Educacional',
      type: 'SABADO_LETIVO',
      description: 'Apresentação de protótipos e robótica das turmas. Horário de Sexta-feira.',
      equivalentWeekday: 5, // Sexta-feira
      allowBooking: true,
    },
    {
      id: `sabado-${year}-10-25`,
      date: `${year}-10-25`,
      title: 'Sábado Letivo - Olimpíada do Conhecimento & Reposição de Carga Horária',
      type: 'SABADO_LETIVO',
      description: 'Simulados para vestibulares/ENEM e reposição. Horário de Quinta-feira.',
      equivalentWeekday: 4, // Quinta-feira
      allowBooking: true,
    },
  ];
}

/**
 * Pedagogical planning and conselho de classe days
 */
export function getStandardPlanningDays(year: number): CalendarSpecialDay[] {
  return [
    {
      id: `plan-${year}-inicio`,
      date: `${year}-02-03`,
      endDate: `${year}-02-04`,
      title: 'Jornada Pedagógica & Planejamento Docente Inicial',
      type: 'PLANEJAMENTO',
      description: 'Alinhamento da equipe docente e preparação dos laboratórios',
      allowBooking: false,
    },
    {
      id: `plan-${year}-conselho-1`,
      date: `${year}-04-25`,
      title: 'Conselho de Classe do 1º Bimestre',
      type: 'PLANEJAMENTO',
      description: 'Avaliação de desempenho discente e recuperação paralela',
      allowBooking: false,
    },
    {
      id: `plan-${year}-conselho-2`,
      date: `${year}-07-11`,
      title: 'Conselho de Classe do 2º Bimestre',
      type: 'PLANEJAMENTO',
      description: 'Fechamento do primeiro semestre letivo',
      allowBooking: false,
    },
    {
      id: `plan-${year}-conselho-3`,
      date: `${year}-10-03`,
      title: 'Conselho de Classe do 3º Bimestre',
      type: 'PLANEJAMENTO',
      description: 'Avaliação diagnóstica do 3º bimestre',
      allowBooking: false,
    },
    {
      id: `plan-${year}-conselho-final`,
      date: `${year}-12-19`,
      title: 'Conselho de Classe Final & Encerramento do Ano Letivo',
      type: 'PLANEJAMENTO',
      description: 'Conselho final e homologação de resultados anuais',
      allowBooking: false,
    },
  ];
}

/**
 * Generates the full standard academic calendar configuration for a given school year
 */
export function createDefaultAcademicCalendar(
  year: number = 2025,
  periodType: AcademicPeriodType = 'BIMESTRE'
): AcademicCalendarConfig {
  let terms: AcademicTerm[] = [];

  if (periodType === 'BIMESTRE') {
    terms = [
      {
        id: `term-${year}-b1`,
        name: '1º Bimestre',
        startDate: `${year}-02-05`,
        endDate: `${year}-04-25`,
        targetSchoolDays: 52,
      },
      {
        id: `term-${year}-b2`,
        name: '2º Bimestre',
        startDate: `${year}-04-28`,
        endDate: `${year}-07-11`,
        targetSchoolDays: 51,
      },
      {
        id: `term-${year}-b3`,
        name: '3º Bimestre',
        startDate: `${year}-07-28`,
        endDate: `${year}-10-03`,
        targetSchoolDays: 49,
      },
      {
        id: `term-${year}-b4`,
        name: '4º Bimestre',
        startDate: `${year}-06-10` > `${year}-10-06` ? `${year}-10-06` : `${year}-10-06`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 51,
      },
    ];
  } else if (periodType === 'TRIMESTRE') {
    terms = [
      {
        id: `term-${year}-t1`,
        name: '1º Trimestre',
        startDate: `${year}-02-05`,
        endDate: `${year}-05-16`,
        targetSchoolDays: 68,
      },
      {
        id: `term-${year}-t2`,
        name: '2º Trimestre',
        startDate: `${year}-05-19`,
        endDate: `${year}-08-29`,
        targetSchoolDays: 66,
      },
      {
        id: `term-${year}-t3`,
        name: '3º Trimestre',
        startDate: `${year}-09-01`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 66,
      },
    ];
  } else {
    // SEMESTRE
    terms = [
      {
        id: `term-${year}-s1`,
        name: '1º Semestre Letivo',
        startDate: `${year}-02-05`,
        endDate: `${year}-07-11`,
        targetSchoolDays: 103,
      },
      {
        id: `term-${year}-s2`,
        name: '2º Semestre Letivo',
        startDate: `${year}-07-28`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 100,
      },
    ];
  }

  const specialDays: CalendarSpecialDay[] = [
    ...getStandardBrazilianHolidays(year),
    ...getStandardSaturdaySchoolDays(year),
    ...getStandardPlanningDays(year),
  ];

  return {
    year,
    periodType,
    schoolYearStart: `${year}-02-05`,
    schoolYearEnd: `${year}-12-18`,
    terms,
    specialDays,
    warnOnHolidayBooking: true,
    blockBookingOnHolidays: false,
    totalSchoolDaysGoal: 200,
  };
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls inside a special day (single or range)
 */
export function matchesSpecialDay(dateIso: string, specialDay: CalendarSpecialDay): boolean {
  if (!specialDay.endDate) {
    return specialDay.date === dateIso;
  }
  return dateIso >= specialDay.date && dateIso <= specialDay.endDate;
}

/**
 * Computes exact count of actual school days (dias letivos) in a term.
 * Monday to Friday are counted, minus holidays and recess periods.
 * Saturdays marked as SABADO_LETIVO in this range are added.
 */
export function calculateTermSchoolDays(
  term: AcademicTerm,
  specialDays: CalendarSpecialDay[]
): number {
  try {
    const start = parseISOLocalDate(term.startDate);
    const end = parseISOLocalDate(term.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return term.targetSchoolDays || 50;
    }

    let count = 0;
    const current = new Date(start.getTime());

    while (current <= end) {
      const iso = formatLocalDateToISO(current);
      const dayOfWeek = current.getDay(); // 0 = Dom, 6 = Sáb

      // Check if this date has a special day
      const special = specialDays.find((s) => matchesSpecialDay(iso, s));

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Weekday: is a school day unless it's a holiday or recess
        if (!special || (special.type !== 'FERIADO' && special.type !== 'RECESSO')) {
          count++;
        }
      } else if (dayOfWeek === 6) {
        // Saturday: only counts if marked as SABADO_LETIVO
        if (special && special.type === 'SABADO_LETIVO') {
          count++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  } catch {
    return term.targetSchoolDays || 50;
  }
}

/**
 * Computes total school days for the full academic calendar configuration
 */
export function calculateTotalCalendarSchoolDays(calendar: AcademicCalendarConfig): number {
  if (!calendar.terms || calendar.terms.length === 0) return 200;
  return calendar.terms.reduce((acc, t) => acc + calculateTermSchoolDays(t, calendar.specialDays || []), 0);
}

export interface CalendarDayAnalysis {
  dateIso: string;
  isWithinSchoolYear: boolean;
  term: AcademicTerm | null;
  specialDay: CalendarSpecialDay | null;
  isHoliday: boolean;
  isRecess: boolean;
  isSaturdaySchool: boolean;
  isPlanningDay: boolean;
  canBook: boolean;
  badgeLabel?: string;
  badgeColorClass?: string;
  warningNotice?: string;
}

/**
 * Analyzes any given date against the school's academic calendar
 */
export function analyzeDateWithCalendar(
  dateIso: string,
  calendar?: AcademicCalendarConfig | null
): CalendarDayAnalysis {
  const fallbackYear = parseInt(dateIso.split('-')[0], 10) || 2025;
  const cal = calendar || createDefaultAcademicCalendar(fallbackYear);

  const isWithinSchoolYear =
    dateIso >= cal.schoolYearStart && dateIso <= cal.schoolYearEnd;

  // Find corresponding academic term (Bimestre / Trimestre)
  const term = cal.terms.find((t) => dateIso >= t.startDate && dateIso <= t.endDate) || null;

  // Find special day if any
  const specialDay = (cal.specialDays || []).find((s) => matchesSpecialDay(dateIso, s)) || null;

  const isHoliday = specialDay?.type === 'FERIADO';
  const isRecess = specialDay?.type === 'RECESSO';
  const isSaturdaySchool = specialDay?.type === 'SABADO_LETIVO';
  const isPlanningDay = specialDay?.type === 'PLANEJAMENTO';

  let canBook = true;
  if (cal.blockBookingOnHolidays && (isHoliday || isRecess)) {
    canBook = false;
  }

  let badgeLabel: string | undefined;
  let badgeColorClass: string | undefined;
  let warningNotice: string | undefined;

  if (isHoliday) {
    badgeLabel = `Feriado: ${specialDay?.title}`;
    badgeColorClass = 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    warningNotice = `Esta data é Feriado Escolar (${specialDay?.title}). Verifique com a coordenação a realização de reservas neste dia.`;
  } else if (isRecess) {
    badgeLabel = `Recesso Escolar: ${specialDay?.title}`;
    badgeColorClass = 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    warningNotice = `Esta data está dentro do Período de Recesso Escolar (${specialDay?.title}).`;
  } else if (isSaturdaySchool) {
    const eq = specialDay?.equivalentWeekday
      ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][specialDay.equivalentWeekday - 1]
      : '';
    badgeLabel = `Sábado Letivo${eq ? ` (Horário de ${eq})` : ''}`;
    badgeColorClass = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  } else if (isPlanningDay) {
    badgeLabel = `Planejamento / Módulo: ${specialDay?.title}`;
    badgeColorClass = 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    warningNotice = `Dia de Atividade Pedagógica / Reunião Docente (${specialDay?.title}).`;
  }

  return {
    dateIso,
    isWithinSchoolYear,
    term,
    specialDay,
    isHoliday,
    isRecess,
    isSaturdaySchool,
    isPlanningDay,
    canBook,
    badgeLabel,
    badgeColorClass,
    warningNotice,
  };
}
