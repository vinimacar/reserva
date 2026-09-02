import { Reservation, TimePeriod } from '../types';
import { TIME_PERIODS } from '../data/initialData';

/**
 * Helper to calculate start & end time strings for a given reservation
 */
function getReservationTimeBounds(reservation: Reservation): { startTime: string; endTime: string } {
  const periodObjects = (reservation.periodIds || [])
    .map((pid) => TIME_PERIODS.find((tp) => tp.id === pid))
    .filter((p): p is TimePeriod => Boolean(p));

  if (periodObjects.length > 0) {
    periodObjects.sort((a, b) => a.number - b.number);
    const firstPeriod = periodObjects[0];
    const lastPeriod = periodObjects[periodObjects.length - 1];
    return {
      startTime: firstPeriod.startTime,
      endTime: lastPeriod.endTime,
    };
  }

  // Fallback defaults based on shift
  if (reservation.shift === 'TARDE') {
    return { startTime: '13:00', endTime: '17:30' };
  } else if (reservation.shift === 'NOITE') {
    return { startTime: '19:00', endTime: '22:30' };
  }
  return { startTime: '07:00', endTime: '11:30' };
}

/**
 * Format date & time into Google Calendar & iCal string (e.g., 20260902T070000)
 */
function formatDateTimeForCal(dateIso: string, timeStr: string): string {
  const cleanDate = dateIso.replace(/[-]/g, '');
  const [hh, mm] = timeStr.split(':');
  const cleanTime = `${(hh || '00').padStart(2, '0')}${(mm || '00').padStart(2, '0')}00`;
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Build clean, rich description for calendar events
 */
function buildEventDetails(reservation: Reservation, schoolName: string, roomLocation?: string): string {
  const lines: string[] = [
    `SISTEMA RESERVE - AGENDAMENTO PEDAGÓGICO`,
    `----------------------------------------`,
    `🏫 Escola: ${schoolName}`,
    `📍 Ambiente: ${reservation.roomName}${roomLocation ? ` (${roomLocation})` : ''}`,
    `👨‍🏫 Professor(a): ${reservation.userName} (${reservation.userEmail})`,
    `👥 Turma: ${reservation.turma} (${reservation.numberOfStudents || 30} estudantes previstos)`,
    `📚 Disciplina: ${reservation.disciplina}`,
    `🎯 Objetivo / Conteúdo: ${reservation.subjectTopic}`,
    `⏰ Turno & Aulas: ${reservation.shift} • ${reservation.periodLabels}`,
  ];

  if (reservation.requestedEquipment && reservation.requestedEquipment.length > 0) {
    lines.push(`🛠️ Equipamentos: ${reservation.requestedEquipment.join(', ')}`);
  }

  if (reservation.observations) {
    lines.push(`📝 Observações: ${reservation.observations}`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`Status: ${reservation.status === 'CONFIRMED' ? 'Confirmado' : reservation.status}`);
  lines.push(`ID da Reserva: ${reservation.id}`);

  return lines.join('\n');
}

/**
 * Generates direct Google Calendar URL to create event with 1 click
 */
export function getGoogleCalendarUrl(
  reservation: Reservation,
  schoolName: string = 'Escola da Rede',
  roomLocation?: string
): string {
  const { startTime, endTime } = getReservationTimeBounds(reservation);
  const startDt = formatDateTimeForCal(reservation.date, startTime);
  const endDt = formatDateTimeForCal(reservation.date, endTime);

  const title = `[RESERVE] ${reservation.roomName} - ${reservation.turma} (${reservation.disciplina})`;
  const details = buildEventDetails(reservation, schoolName, roomLocation);
  const location = `${reservation.roomName}, ${schoolName}${roomLocation ? ` - ${roomLocation}` : ''}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDt}/${endDt}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates standard RFC 5545 .ics text content
 */
export function generateIcsContent(
  reservation: Reservation,
  schoolName: string = 'Escola da Rede',
  roomLocation?: string
): string {
  const { startTime, endTime } = getReservationTimeBounds(reservation);
  const startDt = formatDateTimeForCal(reservation.date, startTime);
  const endDt = formatDateTimeForCal(reservation.date, endTime);

  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = `Aula no ${reservation.roomName} - ${reservation.turma} (${reservation.disciplina})`;
  const description = buildEventDetails(reservation, schoolName, roomLocation)
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
  const location = `${reservation.roomName}, ${schoolName}${roomLocation ? ` (${roomLocation})` : ''}`
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RESERVE Gestao de Laboratorios Escolares//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:RESERVE - Agendamentos Escolares',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'BEGIN:VEVENT',
    `UID:reserve-${reservation.id}-${reservation.date}@educacao.mg.gov.br`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${startDt}`,
    `DTEND:${endDt}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete de aula no laboratório agendado pelo RESERVE',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers instant download of .ics calendar file in the browser
 */
export function downloadIcsFile(
  reservation: Reservation,
  schoolName: string = 'Escola da Rede',
  roomLocation?: string
): void {
  try {
    const icsData = generateIcsContent(reservation, schoolName, roomLocation);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanTurma = (reservation.turma || 'turma').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanRoom = (reservation.roomName || 'lab').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `reserva_${reservation.date}_${cleanRoom}_${cleanTurma}.ics`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao gerar arquivo .ics:', err);
  }
}
