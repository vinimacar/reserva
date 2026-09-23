import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Check,
  Trash2,
  X,
  Layers,
  Smartphone,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { UserNotification } from '../types';
import { formatDateBR } from '../lib/dateUtils';
import { PushNotificationModal } from './PushNotificationModal';

interface TeacherNotificationCenterProps {
  onNavigateToMyReservations?: () => void;
}

export const TeacherNotificationCenter: React.FC<TeacherNotificationCenterProps> = ({
  onNavigateToMyReservations,
}) => {
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useReservations();

  const [isOpen, setIsOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [toastDismissedIds, setToastDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPushGranted =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find the most recent unread notification for the toast alert
  const latestUnread = notifications.find(
    (n) => !n.read && !toastDismissedIds.includes(n.id)
  );

  const handleDismissToast = (id: string) => {
    setToastDismissedIds((prev) => [...prev, id]);
    markNotificationAsRead(id);
  };

  const handleToastClick = (notif: UserNotification) => {
    markNotificationAsRead(notif.id);
    if (onNavigateToMyReservations) {
      onNavigateToMyReservations();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="teacher-notifications-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shadow-xs ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
            : unreadNotificationsCount > 0
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
        }`}
        title={
          unreadNotificationsCount > 0
            ? `Você tem ${unreadNotificationsCount} alerta(s) de reserva da coordenação`
            : 'Alertas de Reservas da Coordenação'
        }
        aria-label="Alertas de Reservas"
      >
        <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadNotificationsCount > 0 && (
          <span
            id="notifications-unread-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm"
          >
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Floating In-App Toast Alert for Instant Feedback */}
      {latestUnread && !isOpen && (
        <div
          id="teacher-instant-alert-toast"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  latestUnread.type === 'RESERVATION_APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {latestUnread.type === 'RESERVATION_APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      latestUnread.type === 'RESERVATION_APPROVED'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/30 text-rose-300'
                    }`}
                  >
                    {latestUnread.type === 'RESERVATION_APPROVED' ? 'Aprovada' : 'Cancelada'}
                  </span>
                  <span className="text-xs text-slate-400">Coordenação</span>
                </div>
                <h4 className="text-sm font-bold text-white">{latestUnread.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{latestUnread.message}</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToastClick(latestUnread)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Layers className="w-3 h-3" />
                    Ver Reservas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissToast(latestUnread.id)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDismissToast(latestUnread.id)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          id="teacher-notifications-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Alertas da Coordenação
              </h3>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                  {unreadNotificationsCount} novo{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPushModalOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Configurações de Notificações Push (FCM)"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
            </div>
          </div>

          {/* FCM Push Notification Quick Banner */}
          <div className="px-3 py-2 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Smartphone className={`w-3.5 h-3.5 ${isPushGranted ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span className="text-[11px] text-slate-300">
                {isPushGranted ? 'Push no Celular Ativo' : 'Alertas Push no Celular'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Grátis
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPushModalOpen(true)}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              {isPushGranted ? 'Gerenciar' : 'Ativar Agora'}
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">Nenhum alerta no momento</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto">
                  Quando a administração aprovar ou cancelar suas reservas, você receberá o aviso
                  diretamente aqui.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isApproved = notif.type === 'RESERVATION_APPROVED';
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors relative group ${
                      !notif.read ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {isApproved ? 'Aprovada' : 'Cancelada'}
                            </span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white mt-1">{notif.title}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Room and Date details */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formatDateBR(notif.date)}
                          </span>
                          {notif.periodLabels && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {notif.periodLabels}
                            </span>
                          )}
                        </div>

                        {/* Note from admin if exists */}
                        {notif.adminNote && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                            <span className="font-semibold text-slate-400">Obs Coordenação: </span>
                            {notif.adminNote}
                          </div>
                        )}

                        {/* Quick actions */}
                        <div className="flex items-center justify-between mt-2.5">
                          {!notif.read ? (
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                            >
                              Marcar como lida
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Lida</span>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                            title="Excluir notificação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-850 border-t border-slate-800 space-y-1.5 text-center">
            {notifications.length > 0 && onNavigateToMyReservations && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToMyReservations();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Ver todas as Minhas Reservas
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPushModalOpen(true);
              }}
              className="w-full py-1 px-3 rounded-xl hover:bg-slate-800/60 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3 h-3 text-indigo-400" />
              <span>Configurar Notificações Push (FCM Gratuito)</span>
            </button>
          </div>
        </div>
      )}

      {/* Push Notification Modal */}
      <PushNotificationModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />
    </div>
  );
};
