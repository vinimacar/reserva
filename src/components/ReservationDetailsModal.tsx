import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  BookOpen,
  Wrench,
  FileText,
  Printer,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Tag,
} from 'lucide-react';
import { Reservation } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { TeacherAvatar } from './TeacherAvatar';
import { formatDateBR } from '../lib/dateUtils';

interface ReservationDetailsModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: (res: Reservation) => void;
}

export const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  const { cancelReservation, deleteReservation, approveReservation, rejectReservation, rooms } =
    useReservations();
  const { currentUser, isAdmin } = useAuth();
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState<boolean>(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Horário indisponível');

  if (!isOpen || !reservation) return null;

  const room = rooms.find((r) => r.id === reservation.roomId);
  const isOwner = currentUser && currentUser.id === reservation.userId;
  const canManage = isAdmin || isOwner;

  const handleCancel = () => {
    cancelReservation(reservation.id, cancelReason);
    setShowCancelPrompt(false);
    onClose();
  };

  const handleDelete = () => {
    deleteReservation(reservation.id);
    setShowDeletePrompt(false);
    onClose();
  };

  const handleApprove = () => {
    approveReservation(reservation.id, 'Aprovado pela coordenação');
    onClose();
  };

  const handleReject = () => {
    rejectReservation(reservation.id, rejectReason || 'Horário indisponível');
    setShowRejectPrompt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-colors">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Detalhes do Agendamento</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {reservation.id.slice(0, 14)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 overflow-y-auto max-h-[80vh]">
          {/* Status & Lab header banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Espaço Reservado</p>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">{reservation.roomName}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {room?.location || 'Prédio Principal'}
              </p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                reservation.status === 'CONFIRMED'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : reservation.status === 'PENDING'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
              }`}
            >
              {reservation.status === 'CONFIRMED'
                ? '✓ Confirmada'
                : reservation.status === 'PENDING'
                ? '⏳ Pendente de Aprovação'
                : '✕ Cancelada'}
            </span>
          </div>

          {/* Teacher Info Card */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center space-x-3">
            <TeacherAvatar
              avatar={reservation.userAvatar}
              name={reservation.userName}
              subject={reservation.disciplina}
              size="md"
              showRoleBadge={true}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{reservation.userName}</p>
                {isOwner && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white uppercase">
                    Você
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{reservation.userEmail}</p>
            </div>
          </div>

          {/* Key Schedule Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Data
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">{formatDateBR(reservation.date)}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Aulas / Horário
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{reservation.periodLabels}</p>
            </div>
          </div>

          {/* Academic details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Turma & Alunos
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{reservation.turma}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {reservation.numberOfStudents || 30} estudantes previstos
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                Disciplina
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{reservation.disciplina}</p>
            </div>
          </div>

          {/* Activity Goal */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Objetivo Pedagógico / Conteúdo da Atividade
            </p>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {reservation.subjectTopic}
            </p>
          </div>

          {/* Requested Hardware & Equipment */}
          {reservation.requestedEquipment && reservation.requestedEquipment.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <Wrench className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Equipamentos Solicitados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reservation.requestedEquipment.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold border border-indigo-200 dark:border-indigo-800 text-[11px]"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          {reservation.observations && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Observações Adicionais
              </p>
              <p className="text-slate-600 dark:text-slate-400 italic">{reservation.observations}</p>
            </div>
          )}

          {/* Admin Note if any */}
          {reservation.adminNote && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Nota da Administração
              </p>
              <p className="text-xs font-semibold mt-0.5">{reservation.adminNote}</p>
            </div>
          )}

          {/* Delete prompt dialog */}
          {showDeletePrompt && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 space-y-2 animate-in fade-in duration-150">
              <p className="font-bold text-red-900 dark:text-red-200 text-xs">Excluir Permanentemente esta Reserva?</p>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                Esta ação apagará permanentemente o registro da reserva do histórico da escola.
              </p>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeletePrompt(false)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          )}

          {/* Reject prompt dialog */}
          {showRejectPrompt && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in duration-150">
              <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">Recusar Solicitação de Reserva?</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Informe o motivo da recusa para notificar o professor solicitante.
              </p>
              <input
                type="text"
                placeholder="Ex: Horário indisponível para manutenção ou duplicidade..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectPrompt(false)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Confirmar Recusa
                </button>
              </div>
            </div>
          )}

          {/* Cancel prompt dialog */}
          {showCancelPrompt && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 space-y-2 animate-in fade-in duration-150">
              <p className="font-bold text-red-900 dark:text-red-200 text-xs">Confirmar Cancelamento da Reserva?</p>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                O horário ficará imediatamente disponível para outros professores agendarem.
              </p>
              <input
                type="text"
                placeholder="Motivo do cancelamento (opcional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Sim, Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 transition-colors">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onOpenReceipt(reservation);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Imprimir Comprovante</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowDeletePrompt(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                title="Excluir Permanentemente (Admin)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && reservation.status === 'PENDING' && !showRejectPrompt && (
              <>
                <button
                  onClick={() => setShowRejectPrompt(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-800 dark:text-red-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Recusar
                </button>
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  Aprovar Reserva
                </button>
              </>
            )}

            {canManage && reservation.status !== 'CANCELLED' && !showCancelPrompt && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
              >
                Cancelar Reserva
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
