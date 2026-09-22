import React, { useState } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  MapPin,
  PlusCircle,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Sparkles,
  BookOpen,
  Users,
  Wrench,
  AlertCircle,
  CalendarPlus,
  Download,
  Bell,
  CheckCircle2,
  XCircle,
  Check,
  Share2,
} from 'lucide-react';
import { Reservation } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { TeacherAvatar } from './TeacherAvatar';
import { formatLocalDateToISO, formatDateBR } from '../lib/dateUtils';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarExport';
import { ShareReservationModal } from './ShareReservationModal';

interface MyReservationsViewProps {
  onOpenNewReservation: () => void;
  onSelectReservation: (reservation: Reservation) => void;
  onOpenReceipt: (reservation: Reservation) => void;
}

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  onOpenNewReservation,
  onSelectReservation,
  onOpenReceipt,
}) => {
  const {
    reservations,
    rooms,
    currentSchool,
    settings,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useReservations();
  const { currentUser } = useAuth();
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'PAST' | 'ALL' | 'CANCELLED'>('UPCOMING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shareReservation, setShareReservation] = useState<Reservation | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto my-8 transition-colors">
        <Layers className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Autenticação Necessária</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Faça login com sua conta Google escolar para visualizar e gerenciar suas reservas.
        </p>
      </div>
    );
  }

  const todayIso = formatLocalDateToISO();

  // Filter reservations for current user
  const userReservations = reservations.filter((r) => r.userId === currentUser.id);

  const filteredReservations = userReservations.filter((r) => {
    // Filter by tab
    if (filterTab === 'UPCOMING') {
      if (r.status === 'CANCELLED' || r.date < todayIso) return false;
    } else if (filterTab === 'PAST') {
      if (r.status === 'CANCELLED' || r.date >= todayIso) return false;
    } else if (filterTab === 'CANCELLED') {
      if (r.status !== 'CANCELLED') return false;
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        r.roomName.toLowerCase().includes(term) ||
        r.turma.toLowerCase().includes(term) ||
        r.disciplina.toLowerCase().includes(term) ||
        r.subjectTopic.toLowerCase().includes(term);
      if (!match) return false;
    }

    return true;
  });

  const upcomingCount = userReservations.filter((r) => r.status !== 'CANCELLED' && r.date >= todayIso).length;
  const pastCount = userReservations.filter((r) => r.status !== 'CANCELLED' && r.date < todayIso).length;
  const cancelledCount = userReservations.filter((r) => r.status === 'CANCELLED').length;

  const formatDateBR = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Teacher Profile & Quick Metrics */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <TeacherAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              subject={currentUser.subject}
              role={currentUser.role}
              size="lg"
              showRoleBadge={true}
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">{currentUser.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 shrink-0">
                  {currentUser.role === 'ADMIN' ? 'Coordenador / Admin' : 'Docente'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5 truncate">{currentUser.email}</p>
              <p className="text-[11px] text-slate-300 mt-1 font-medium truncate">
                📚 Disciplina principal: <span className="text-white font-bold">{currentUser.subject || 'Geral'}</span>
              </p>
            </div>
          </div>

          {/* Quick Counter Badges & Action */}
          <div className="flex items-center justify-between sm:justify-end space-x-2.5 sm:space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-white/10 p-1.5 sm:p-2 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="px-2.5 sm:px-3 py-1 text-center border-r border-white/10">
                <p className="text-base sm:text-lg font-black text-white leading-tight">{upcomingCount}</p>
                <p className="text-[9px] sm:text-[10px] text-blue-200 font-semibold uppercase">Próximas</p>
              </div>
              <div className="px-2.5 sm:px-3 py-1 text-center">
                <p className="text-base sm:text-lg font-black text-white leading-tight">{pastCount}</p>
                <p className="text-[9px] sm:text-[10px] text-blue-200 font-semibold uppercase">Realizadas</p>
              </div>
            </div>

            <button
              onClick={onOpenNewReservation}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Reserva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unread Alerts from Administration */}
      {notifications && notifications.some((n) => !n.read) && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Bell className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Novos Alertas da Coordenação
              </h4>
            </div>
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              Dispensar todos
            </button>
          </div>
          <div className="space-y-2">
            {notifications
              .filter((n) => !n.read)
              .map((notif) => {
                const isApproved = notif.type === 'RESERVATION_APPROVED';
                return (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`p-1 rounded-lg shrink-0 ${
                          isApproved
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {notif.title}:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {notif.roomName} em {formatDateBR(notif.date)}
                          {notif.adminNote ? ` • ${notif.adminNote}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="shrink-0 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Lido
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        {/* Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('UPCOMING')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'UPCOMING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Próximas ({upcomingCount})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({userReservations.length})
          </button>
          <button
            onClick={() => setFilterTab('PAST')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'PAST'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Histórico ({pastCount})
          </button>
          <button
            onClick={() => setFilterTab('CANCELLED')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'CANCELLED'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Canceladas ({cancelledCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por turma, matéria ou sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Reservation Cards List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm
              ? 'Nenhuma reserva corresponde ao termo pesquisado.'
              : filterTab === 'UPCOMING'
              ? 'Você não possui reservas futuras no momento. Acesse a Grade de Horários ou clique no botão abaixo para agendar.'
              : 'Nenhum registro para esta categoria.'}
          </p>
          <button
            onClick={onOpenNewReservation}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Fazer Reserva Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReservations.map((res) => {
            const isCancelled = res.status === 'CANCELLED';
            const isPast = res.date < todayIso;
            const room = rooms.find((r) => r.id === res.roomId);

            return (
              <div
                key={res.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isCancelled
                    ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-800/30'
                    : isPast
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20'
                    : 'border-blue-200 dark:border-blue-900/50 shadow-xs hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                      {res.turma}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCancelled
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : res.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {isCancelled ? 'Cancelada' : res.status === 'PENDING' ? 'Pendente' : 'Confirmada'}
                    </span>
                  </div>

                  {/* Room & Subject */}
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">{res.roomName}</h4>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{res.disciplina}</p>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {res.subjectTopic}
                  </p>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold">{formatDateBR(res.date)} ({res.date})</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-semibold truncate">{res.periodLabels}</span>
                    </div>
                  </div>

                  {/* Equipment requested */}
                  {res.requestedEquipment && res.requestedEquipment.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {res.requestedEquipment.map((eq, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => onOpenReceipt(res)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="Imprimir Ficha de Reserva"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareReservation(res)}
                      className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                      title="Compartilhar via WhatsApp ou E-mail Institucional"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>

                    {!isCancelled && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const room = rooms.find((r) => r.id === res.roomId);
                            const url = getGoogleCalendarUrl(
                              res,
                              currentSchool?.name || settings?.schoolName || 'Escola da Rede',
                              room?.location
                            );
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                          title="Adicionar ao Google Agenda"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Agenda</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const room = rooms.find((r) => r.id === res.roomId);
                            downloadIcsFile(
                              res,
                              currentSchool?.name || settings?.schoolName || 'Escola da Rede',
                              room?.location
                            );
                          }}
                          className="flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title="Baixar arquivo .ics para celular ou Outlook"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.ics</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectReservation(res)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Reservation Modal */}
      {shareReservation && (
        <ShareReservationModal
          isOpen={!!shareReservation}
          reservation={shareReservation}
          onClose={() => setShareReservation(null)}
        />
      )}
    </div>
  );
};
