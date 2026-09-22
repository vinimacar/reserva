import React, { useState } from 'react';
import {
  X,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  CalendarPlus,
  Download,
} from 'lucide-react';
import { Reservation } from '../types';
import { useReservations } from '../context/ReservationContext';
import { formatDateBR } from '../lib/dateUtils';
import {
  buildReservationShareText,
  buildWhatsAppShareUrl,
  buildEmailShareUrl,
  copyReservationShareText,
} from '../lib/shareReservation';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarExport';

interface ShareReservationModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareReservationModal: React.FC<ShareReservationModalProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  const { currentSchool, settings, rooms } = useReservations();
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  if (!isOpen || !reservation) return null;

  const schoolName = currentSchool?.name || settings?.schoolName || 'Escola da Rede';
  const room = rooms.find((r) => r.id === reservation.roomId);
  const targetEmail = recipientEmail || reservation.userEmail || '';

  const handleShareWhatsApp = () => {
    const url = buildWhatsAppShareUrl(reservation, schoolName, room?.location, whatsappNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const url = buildEmailShareUrl(reservation, schoolName, room?.location, targetEmail);
    window.location.href = url;
  };

  const handleCopyText = async () => {
    const success = await copyReservationShareText(reservation, schoolName, room?.location);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(reservation, schoolName, room?.location);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(reservation, schoolName, room?.location);
  };

  const previewText = buildReservationShareText(reservation, schoolName, room?.location);

  return (
    <div
      id="share-reservation-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="share-reservation-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Compartilhamento Rápido
              </h3>
              <p className="text-[11px] text-slate-400">
                Envie o comprovante por WhatsApp ou E-mail Institucional
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
          {/* Reservation Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {schoolName}
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {reservation.roomName}
                </h4>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  reservation.status === 'CONFIRMED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : reservation.status === 'PENDING'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {reservation.status === 'CONFIRMED'
                  ? 'Aprovada'
                  : reservation.status === 'PENDING'
                  ? 'Pendente'
                  : 'Cancelada'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{formatDateBR(reservation.date)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{reservation.periodLabels || reservation.shift}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Professor(a): <strong className="text-slate-700 dark:text-slate-200">{reservation.userName}</strong> • Turma: {reservation.turma}
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="space-y-3.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block uppercase tracking-wider">
              Canais de Envio
            </label>

            {/* Option 1: WhatsApp */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#25D366] text-white">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      WhatsApp
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Compartilhe no privado ou grupo da escola
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="DDD + Telefone (opcional, ex: 31988887777)"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  id="share-whatsapp-btn"
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Option 2: Institutional Email */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    E-mail Institucional (@educacao.mg.gov.br)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Abre rascunho formatado no Gmail ou aplicativo padrão
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="email"
                  placeholder="Destinatário (padrão: professor da reserva)"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  defaultValue={reservation.userEmail || ''}
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700/80 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  id="share-email-btn"
                  type="button"
                  onClick={handleShareEmail}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir E-mail</span>
                </button>
              </div>
            </div>

            {/* Option 3: Copy to Clipboard */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Copiar Ficha Completa
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Para colar no Google Classroom, Teams ou bloco de notas
                  </p>
                </div>
              </div>

              <button
                id="copy-share-text-btn"
                type="button"
                onClick={handleCopyText}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Calendar Sync Secondary Shortcuts */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Salvar na Agenda:
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenGoogleCalendar}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Google Agenda</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Arquivo .ics</span>
              </button>
            </div>
          </div>

          {/* Collapsible Message Preview */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1 cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Visualizar mensagem formatada</span>
              </span>
              {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showPreview && (
              <pre className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 select-all">
                {previewText}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
