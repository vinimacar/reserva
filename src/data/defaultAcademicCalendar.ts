import {
  AcademicCalendarConfig,
  AcademicPeriodType,
  AcademicTerm,
  CalendarSpecialDay,
} from '../types';
import { parseISOLocalDate, formatLocalDateToISO } from '../lib/dateUtils';

/**
 * Feriados Nacionais e Oficiais do Calendário Escolar (SEE-MG / Nacional)
 */
export function getStandardBrazilianHolidays(year: number = 2026): CalendarSpecialDay[] {
  return [
    {
      id: `feriado-${year}-01-01`,
      date: `${year}-01-01`,
      title: 'Confraternização Universal (Ano Novo)',
      type: 'FERIADO',
      description: 'Feriado Nacional (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-paixao`,
      date: `${year}-04-03`,
      title: 'Sexta-Feira Santa (Paixão de Cristo)',
      type: 'FERIADO',
      description: 'Feriado Nacional Religioso (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-tiradentes`,
      date: `${year}-04-21`,
      title: 'Tiradentes',
      type: 'FERIADO',
      description: 'Feriado Nacional Cívico (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-trabalho`,
      date: `${year}-05-01`,
      title: 'Dia Mundial do Trabalho',
      type: 'FERIADO',
      description: 'Feriado Nacional (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-independencia`,
      date: `${year}-09-07`,
      title: 'Independência do Brasil',
      type: 'FERIADO',
      description: 'Feriado Nacional da Pátria (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-aparecida`,
      date: `${year}-10-12`,
      title: 'Nossa Senhora Aparecida',
      type: 'FERIADO',
      description: 'Padroeira do Brasil e Dia das Crianças (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-finados`,
      date: `${year}-11-02`,
      title: 'Finados',
      type: 'FERIADO',
      description: 'Feriado Nacional (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-republica`,
      date: `${year}-11-15`,
      title: 'Proclamação da República',
      type: 'FERIADO',
      description: 'Feriado Nacional (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-consciencia-negra`,
      date: `${year}-11-20`,
      title: 'Dia Nacional de Zumbi e da Consciência Negra',
      type: 'FERIADO',
      description: 'Feriado Nacional - Lei Federal 14.759 (FN)',
      allowBooking: false,
    },
    {
      id: `feriado-${year}-natal`,
      date: `${year}-12-25`,
      title: 'Natal',
      type: 'FERIADO',
      description: 'Feriado Nacional (FN)',
      allowBooking: false,
    },
  ];
}

/**
 * Recessos Escolares e Férias regulamentares do Calendário SEE-MG
 */
export function getStandardSchoolRecesses(year: number = 2026): CalendarSpecialDay[] {
  return [
    {
      id: `recesso-${year}-ferias-janeiro`,
      date: `${year}-01-02`,
      endDate: `${year}-01-31`,
      title: 'Férias Escolares (F)',
      type: 'RECESSO',
      description: 'Férias regulamentares dos servidores e estudantes',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-carnaval`,
      date: `${year}-02-16`,
      endDate: `${year}-02-18`,
      title: 'Recesso de Carnaval e Quarta-Feira de Cinzas (R)',
      type: 'RECESSO',
      description: 'Recesso escolar oficial da rede estadual',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-quinta-santa`,
      date: `${year}-04-02`,
      title: 'Recesso Escolar - Quinta-Feira Santa (R)',
      type: 'RECESSO',
      description: 'Recesso escolar da Semana Santa',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-ponte-tiradentes`,
      date: `${year}-04-20`,
      title: 'Recesso Escolar - Ponte Tiradentes (R)',
      type: 'RECESSO',
      description: 'Recesso escolar regulamentar',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-corpus-christi`,
      date: `${year}-06-04`,
      endDate: `${year}-06-05`,
      title: 'Recesso Escolar - Corpus Christi e Ponte (R)',
      type: 'RECESSO',
      description: 'Recesso escolar de Corpus Christi e sexta-feira subsequente',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-julho`,
      date: `${year}-07-20`,
      endDate: `${year}-07-31`,
      title: 'Recesso Escolar de Julho (R)',
      type: 'RECESSO',
      description: 'Recesso escolar regulamentar de meio de ano (SEE-MG)',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-outubro`,
      date: `${year}-10-13`,
      endDate: `${year}-10-16`,
      title: 'Recesso Escolar - Semana do Professor e da Criança (R)',
      type: 'RECESSO',
      description: 'Semana de comemoração do Dia do Professor e da Criança',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-vespera-natal`,
      date: `${year}-12-24`,
      title: 'Recesso Escolar - Véspera de Natal (R)',
      type: 'RECESSO',
      description: 'Recesso escolar de fim de ano',
      allowBooking: false,
    },
    {
      id: `recesso-${year}-fim-ano`,
      date: `${year}-12-26`,
      endDate: `${year}-12-31`,
      title: 'Recesso Escolar de Fim de Ano (R)',
      type: 'RECESSO',
      description: 'Recesso escolar de encerramento anual',
      allowBooking: false,
    },
  ];
}

/**
 * Dias Escolares (DE) - Atividades Pedagógicas sem estudantes (SEE-MG)
 */
export function getStandardDiasEscolares(year: number = 2026): CalendarSpecialDay[] {
  return [
    {
      id: `de-${year}-inicio`,
      date: `${year}-02-02`,
      endDate: `${year}-02-03`,
      title: 'Dia Escolar (DE) - Acolhimento e Planejamento',
      type: 'DIA_ESCOLAR',
      description: 'Planejamento docente e preparação escolar antes do início das aulas',
      allowBooking: true,
    },
    {
      id: `de-${year}-pos-carnaval`,
      date: `${year}-02-19`,
      endDate: `${year}-02-20`,
      title: 'Dia Escolar (DE) - Organização Pedagógica',
      type: 'DIA_ESCOLAR',
      description: 'Planejamento e alinhamento pedagógico pós-carnaval',
      allowBooking: true,
    },
    {
      id: `de-${year}-encerramento`,
      date: `${year}-12-21`,
      endDate: `${year}-12-23`,
      title: 'Dia Escolar (DE) - Reunião de Pais e Encerramento',
      type: 'DIA_ESCOLAR',
      description: 'Reunião de Pais/Responsáveis, conselhos finais e fechamento do ano',
      allowBooking: true,
    },
  ];
}

/**
 * Sábados Letivos (SL) - Dia de Mobilização das Famílias (SEE-MG)
 */
export function getStandardSaturdaySchoolDays(year: number = 2026): CalendarSpecialDay[] {
  return [
    {
      id: `sabado-${year}-06-27`,
      date: `${year}-06-27`,
      title: 'Sábado Letivo (SL) - Dia de Mobilização das Famílias',
      type: 'SABADO_LETIVO',
      description: 'Atividades pedagógicas, integração com a comunidade e cumprimento de carga horária (SEE-MG)',
      equivalentWeekday: 4, // Horário de Quinta-feira
      allowBooking: true,
    },
    {
      id: `sabado-${year}-09-12`,
      date: `${year}-09-12`,
      title: 'Sábado Letivo (SL) - Dia de Mobilização das Famílias',
      type: 'SABADO_LETIVO',
      description: 'Atividades com as famílias, projetos escolares e reposição de carga horária (SEE-MG)',
      equivalentWeekday: 1, // Horário de Segunda-feira
      allowBooking: true,
    },
  ];
}

/**
 * Eventos Institucionais do Calendário Escolar
 */
export function getStandardSchoolEvents(year: number = 2026): CalendarSpecialDay[] {
  return [
    {
      id: `censo-${year}-05-27`,
      date: `${year}-05-27`,
      title: 'Dia Nacional do Censo Escolar (CE)',
      type: 'EVENTO',
      description: 'Data de referência para a coleta de dados educacionais no Brasil',
      allowBooking: true,
    },
  ];
}

/**
 * Gera a configuração oficial do Calendário Escolar da SEE-MG / Trimestral 2026
 */
export function createDefaultAcademicCalendar(
  year: number = 2026,
  periodType: AcademicPeriodType = 'TRIMESTRE'
): AcademicCalendarConfig {
  let terms: AcademicTerm[] = [];

  if (periodType === 'TRIMESTRE') {
    // Organização Anual Trimestral Oficial SEE-MG 2026
    terms = [
      {
        id: `term-${year}-t1`,
        name: '1º Trimestre',
        startDate: `${year}-02-04`,
        endDate: `${year}-05-20`,
        targetSchoolDays: 67,
        classCouncilStart: `${year}-05-14`,
        classCouncilEnd: `${year}-05-20`,
        parentMeetingStart: `${year}-05-21`,
        parentMeetingEnd: `${year}-06-03`,
      },
      {
        id: `term-${year}-t2`,
        name: '2º Trimestre',
        startDate: `${year}-05-21`,
        endDate: `${year}-09-09`,
        targetSchoolDays: 67,
        classCouncilStart: `${year}-09-02`,
        classCouncilEnd: `${year}-09-09`,
        parentMeetingStart: `${year}-09-10`,
        parentMeetingEnd: `${year}-09-22`,
      },
      {
        id: `term-${year}-t3`,
        name: '3º Trimestre',
        startDate: `${year}-09-10`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 66,
        classCouncilStart: `${year}-12-11`,
        classCouncilEnd: `${year}-12-18`,
        parentMeetingStart: `${year}-12-21`,
        parentMeetingEnd: `${year}-12-23`,
      },
    ];
  } else if (periodType === 'SEMESTRE') {
    // Organização Semestral Oficial SEE-MG 2026 (EJA / Cursos Técnicos)
    terms = [
      {
        id: `term-${year}-s1`,
        name: '1º Semestre Letivo',
        startDate: `${year}-02-04`,
        endDate: `${year}-07-08`,
        targetSchoolDays: 100,
        classCouncilStart: `${year}-07-02`,
        classCouncilEnd: `${year}-07-08`,
        parentMeetingStart: `${year}-07-10`,
        parentMeetingEnd: `${year}-08-06`,
      },
      {
        id: `term-${year}-s2`,
        name: '2º Semestre Letivo',
        startDate: `${year}-07-10`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 100,
        classCouncilStart: `${year}-12-11`,
        classCouncilEnd: `${year}-12-18`,
        parentMeetingStart: `${year}-12-21`,
        parentMeetingEnd: `${year}-12-23`,
      },
    ];
  } else {
    // BIMESTRE (caso a instituição adote divisão bimestral)
    terms = [
      {
        id: `term-${year}-b1`,
        name: '1º Bimestre',
        startDate: `${year}-02-04`,
        endDate: `${year}-04-24`,
        targetSchoolDays: 52,
      },
      {
        id: `term-${year}-b2`,
        name: '2º Bimestre',
        startDate: `${year}-04-27`,
        endDate: `${year}-07-10`,
        targetSchoolDays: 50,
      },
      {
        id: `term-${year}-b3`,
        name: '3º Bimestre',
        startDate: `${year}-07-13`,
        endDate: `${year}-10-02`,
        targetSchoolDays: 48,
      },
      {
        id: `term-${year}-b4`,
        name: '4º Bimestre',
        startDate: `${year}-10-05`,
        endDate: `${year}-12-18`,
        targetSchoolDays: 50,
      },
    ];
  }

  const specialDays: CalendarSpecialDay[] = [
    ...getStandardBrazilianHolidays(year),
    ...getStandardSchoolRecesses(year),
    ...getStandardDiasEscolares(year),
    ...getStandardSaturdaySchoolDays(year),
    ...getStandardSchoolEvents(year),
  ];

  return {
    year,
    periodType,
    schoolYearStart: `${year}-02-04`,
    schoolYearEnd: `${year}-12-18`,
    terms,
    specialDays,
    warnOnHolidayBooking: true,
    blockBookingOnHolidays: false,
    totalSchoolDaysGoal: 200,
  };
}

/**
 * Verifica se uma data específica (YYYY-MM-DD) cai em um dia ou intervalo especial
 */
export function matchesSpecialDay(dateIso: string, specialDay: CalendarSpecialDay): boolean {
  if (!specialDay.endDate) {
    return specialDay.date === dateIso;
  }
  return dateIso >= specialDay.date && dateIso <= specialDay.endDate;
}

/**
 * Calcula a quantidade exata de Dias Letivos (DL) para estudantes em um termo.
 * Segunda a sexta contam como dia letivo, exceto se for feriado, recesso ou dia escolar (DE) sem aula.
 * Sábados letivos (SL) cadastrados no período são somados.
 */
export function calculateTermSchoolDays(
  term: AcademicTerm,
  specialDays: CalendarSpecialDay[]
): number {
  try {
    const start = parseISOLocalDate(term.startDate);
    const end = parseISOLocalDate(term.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return term.targetSchoolDays || 67;
    }

    let count = 0;
    const current = new Date(start.getTime());

    while (current <= end) {
      const iso = formatLocalDateToISO(current);
      const dayOfWeek = current.getDay(); // 0 = Dom, 6 = Sáb

      // Verifica se há dia especial
      const special = specialDays.find((s) => matchesSpecialDay(iso, s));

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Dia útil: conta como letivo para estudantes a não ser que seja feriado, recesso ou dia escolar exclusivo docente
        const isNonStudentDay =
          special &&
          (special.type === 'FERIADO' ||
            special.type === 'RECESSO' ||
            special.type === 'DIA_ESCOLAR');
        if (!isNonStudentDay) {
          count++;
        }
      } else if (dayOfWeek === 6) {
        // Sábado: só conta como letivo se for Sábado Letivo (SL)
        if (special && special.type === 'SABADO_LETIVO') {
          count++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  } catch {
    return term.targetSchoolDays || 67;
  }
}

/**
 * Calcula o total de dias letivos em toda a configuração anual
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
  isDiaEscolar: boolean;
  canBook: boolean;
  badgeLabel?: string;
  badgeColorClass?: string;
  warningNotice?: string;
}

/**
 * Analisa uma data no formato YYYY-MM-DD em relação ao calendário escolar
 */
export function analyzeDateWithCalendar(
  dateIso: string,
  calendar?: AcademicCalendarConfig | null
): CalendarDayAnalysis {
  const fallbackYear = parseInt(dateIso.split('-')[0], 10) || 2026;
  const cal = calendar || createDefaultAcademicCalendar(fallbackYear, 'TRIMESTRE');

  const isWithinSchoolYear =
    dateIso >= cal.schoolYearStart && dateIso <= cal.schoolYearEnd;

  // Localiza o período acadêmico correspondente (Trimestre / Bimestre)
  const term = cal.terms.find((t) => dateIso >= t.startDate && dateIso <= t.endDate) || null;

  // Localiza o dia especial se houver
  const specialDay = (cal.specialDays || []).find((s) => matchesSpecialDay(dateIso, s)) || null;

  const isHoliday = specialDay?.type === 'FERIADO';
  const isRecess = specialDay?.type === 'RECESSO';
  const isSaturdaySchool = specialDay?.type === 'SABADO_LETIVO';
  const isPlanningDay = specialDay?.type === 'PLANEJAMENTO';
  const isDiaEscolar = specialDay?.type === 'DIA_ESCOLAR';

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
    warningNotice = `Feriado Nacional / Escolar (${specialDay?.title}).`;
  } else if (isRecess) {
    badgeLabel = `Recesso: ${specialDay?.title}`;
    badgeColorClass = 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    warningNotice = `Período de Recesso Escolar (${specialDay?.title}).`;
  } else if (isSaturdaySchool) {
    const eq = specialDay?.equivalentWeekday
      ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][specialDay.equivalentWeekday - 1]
      : '';
    badgeLabel = `Sábado Letivo${eq ? ` (Horário de ${eq})` : ''}`;
    badgeColorClass = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    warningNotice = `Sábado Letivo com reposição e mobilização familiar.`;
  } else if (isDiaEscolar) {
    badgeLabel = `Dia Escolar: ${specialDay?.title}`;
    badgeColorClass = 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    warningNotice = `Dia Escolar exclusivo para professores e equipe pedagógica (${specialDay?.title}).`;
  } else if (isPlanningDay) {
    badgeLabel = `Planejamento: ${specialDay?.title}`;
    badgeColorClass = 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    warningNotice = `Dia de Planejamento Pedagógico / Conselho (${specialDay?.title}).`;
  } else if (specialDay?.type === 'EVENTO') {
    badgeLabel = specialDay.title;
    badgeColorClass = 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
    warningNotice = specialDay.description;
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
    isDiaEscolar,
    canBook,
    badgeLabel,
    badgeColorClass,
    warningNotice,
  };
}
