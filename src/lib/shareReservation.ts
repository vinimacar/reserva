import { Reservation } from '../types';
import { formatDateBR } from './dateUtils';

/**
 * Builds a structured, clear text representation of a reservation
 * optimized for messaging apps (WhatsApp, Telegram, Teams) and emails.
 */
export function buildReservationShareText(
  reservation: Reservation,
  schoolName: string,
  roomLocation?: string
): string {
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmado / Aprovado',
    PENDING: 'Pendente de Aprovação',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Concluído',
  };

  const statusText = statusLabels[reservation.status] || reservation.status;
  const locationText = roomLocation ? ` (${roomLocation})` : '';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reserve.educacao.mg.gov.br';

  const lines: string[] = [
    `📋 *COMPROVANTE DE AGENDAMENTO • RESERVELABS*`,
    `----------------------------------------`,
    `🏫 *Escola:* ${schoolName}`,
    `🧪 *Ambiente:* ${reservation.roomName}${locationText}`,
    `📅 *Data:* ${formatDateBR(reservation.date)}`,
    `⏰ *Turno & Horário:* ${reservation.shift} • ${reservation.periodLabels || 'Horário integral'}`,
    `👤 *Professor(a):* ${reservation.userName}`,
  ];

  if (reservation.userEmail) {
    lines.push(`📧 *E-mail:* ${reservation.userEmail}`);
  }

  lines.push(`👥 *Turma:* ${reservation.turma} (${reservation.numberOfStudents || 30} estudantes previstos)`);
  lines.push(`📚 *Disciplina:* ${reservation.disciplina}`);
  lines.push(`📝 *Tema / Aula:* ${reservation.subjectTopic}`);

  if (reservation.requestedEquipment && reservation.requestedEquipment.length > 0) {
    lines.push(`🛠️ *Equipamentos:* ${reservation.requestedEquipment.join(', ')}`);
  }

  if (reservation.observations) {
    lines.push(`💬 *Observações:* ${reservation.observations}`);
  }

  if (reservation.adminNote) {
    lines.push(`📌 *Nota da Coordenação:* ${reservation.adminNote}`);
  }

  lines.push(`✅ *Status:* ${statusText}`);
  lines.push(`🔑 *Código:* ${reservation.id.slice(0, 16)}`);
  lines.push(`----------------------------------------`);
  lines.push(`🌐 *Acesse o ReserveLabs:* ${appUrl}`);

  return lines.join('\n');
}

/**
 * Builds a WhatsApp API URL with pre-encoded reservation details.
 * Supports optional recipient phone number.
 */
export function buildWhatsAppShareUrl(
  reservation: Reservation,
  schoolName: string,
  roomLocation?: string,
  customPhone?: string
): string {
  const text = buildReservationShareText(reservation, schoolName, roomLocation);
  const encodedText = encodeURIComponent(text);

  if (customPhone) {
    const cleanPhone = customPhone.replace(/\D/g, '');
    if (cleanPhone) {
      // If no country code, add 55 (Brazil)
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
    }
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Builds an institutional mailto: URL with prefilled subject and body.
 */
export function buildEmailShareUrl(
  reservation: Reservation,
  schoolName: string,
  roomLocation?: string,
  recipientEmail?: string
): string {
  const subject = `[ReserveLabs] Agendamento de Espaço: ${reservation.roomName} - ${formatDateBR(reservation.date)} (${reservation.userName})`;
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'CONFIRMADO / APROVADO',
    PENDING: 'PENDENTE DE AVALIAÇÃO',
    CANCELLED: 'CANCELADO',
    COMPLETED: 'CONCLUÍDO',
  };

  const statusText = statusLabels[reservation.status] || reservation.status;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reserve.educacao.mg.gov.br';

  const bodyLines = [
    `Prezada Equipe Pedagógica e Professor(a) ${reservation.userName},`,
    ``,
    `Seguem os dados detalhados do agendamento registrado no ReserveLabs:`,
    ``,
    `• Unidade Escolar: ${schoolName}`,
    `• Espaço / Laboratório: ${reservation.roomName}${roomLocation ? ` (${roomLocation})` : ''}`,
    `• Data do Agendamento: ${formatDateBR(reservation.date)}`,
    `• Turno e Horários: ${reservation.shift} • ${reservation.periodLabels || 'Período indicado'}`,
    `• Professor(a) Solicitante: ${reservation.userName} (${reservation.userEmail || 'Não informado'})`,
    `• Turma Atendida: ${reservation.turma} (${reservation.numberOfStudents || 30} estudantes previstos)`,
    `• Componente Curricular: ${reservation.disciplina}`,
    `• Tema / Conteúdo da Aula: ${reservation.subjectTopic}`,
    reservation.requestedEquipment && reservation.requestedEquipment.length > 0
      ? `• Recursos e Equipamentos Requisitados: ${reservation.requestedEquipment.join(', ')}`
      : null,
    reservation.observations ? `• Observações: ${reservation.observations}` : null,
    reservation.adminNote ? `• Parecer da Coordenação: ${reservation.adminNote}` : null,
    `• Situação da Solicitação: ${statusText}`,
    `• Identificador do Registro: ${reservation.id}`,
    ``,
    `Para consultar o quadro de horários em tempo real ou gerenciar agendamentos, acesse:`,
    `${appUrl}`,
    ``,
    `Atenciosamente,`,
    `Coordenação de Laboratórios e Apoio Pedagógico`,
    `${schoolName}`,
  ].filter((line): line is string => line !== null);

  const recipient = recipientEmail || reservation.userEmail || '';
  const mailtoParams = new URLSearchParams({
    subject,
    body: bodyLines.join('\r\n'),
  });

  return `mailto:${recipient}?${mailtoParams.toString()}`;
}

/**
 * Copies the formatted reservation text to clipboard safely.
 */
export async function copyReservationShareText(
  reservation: Reservation,
  schoolName: string,
  roomLocation?: string
): Promise<boolean> {
  const text = buildReservationShareText(reservation, schoolName, roomLocation);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}
