import React from 'react';
import { X, Printer, School, CheckCircle, Calendar, Clock, MapPin, User, Users, BookOpen, Shield } from 'lucide-react';
import { Reservation } from '../types';
import { useReservations } from '../context/ReservationContext';

interface ReservationReceiptModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationReceiptModal: React.FC<ReservationReceiptModalProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  const { settings, rooms } = useReservations();

  if (!isOpen || !reservation) return null;

  const room = rooms.find((r) => r.id === reservation.roomId);

  const handlePrint = () => {
    window.print();
  };

  const formatDateBR = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Header - Screen only */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Comprovante de Agendamento Escolar</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div id="printable-voucher" className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black flex items-center justify-center text-sm">
                  R
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900">
                    SISTEMA RESERVE - GESTÃO DE LABORATÓRIOS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">{settings.schoolName}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Secretaria de Estado de Educação de Minas Gerais • Uso Pedagógico
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                AGENDAMENTO CONFIRMADO
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Cód: {reservation.id.slice(0, 16)}</p>
            </div>
          </div>

          <div className="text-center py-1">
            <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
              Ficha de Reserva de Espaço Pedagógico
            </h3>
          </div>

          {/* Form Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-300">
              <div className="p-3 border-r border-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500">Ambiente Solicitado</p>
                <p className="font-bold text-slate-900 mt-0.5">{reservation.roomName}</p>
              </div>
              <div className="p-3 border-r border-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500">Localização</p>
                <p className="font-medium text-slate-900 mt-0.5">{room?.location || 'Prédio da Escola'}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">Capacidade Máxima</p>
                <p className="font-medium text-slate-900 mt-0.5">{room?.capacity} Estudantes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-300">
              <div className="p-3 border-r border-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500">Data Agendada</p>
                <p className="font-bold text-slate-900 mt-0.5 capitalize">{formatDateBR(reservation.date)}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">Turno & Aulas</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {reservation.shift} • {reservation.periodLabels}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-300 bg-slate-50">
              <div className="p-3 border-r border-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500">Professor Responsável</p>
                <p className="font-bold text-slate-900 mt-0.5">{reservation.userName}</p>
                <p className="text-[10px] text-slate-500">{reservation.userEmail}</p>
              </div>
              <div className="p-3 border-r border-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500">Turma Atendida</p>
                <p className="font-bold text-slate-900 mt-0.5">{reservation.turma}</p>
                <p className="text-[10px] text-slate-500">{reservation.numberOfStudents || 30} alunos previstos</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">Componente Curricular</p>
                <p className="font-bold text-slate-900 mt-0.5">{reservation.disciplina}</p>
              </div>
            </div>

            <div className="p-3 border-b border-slate-300">
              <p className="text-[10px] font-bold uppercase text-slate-500">Planejamento & Objetivo da Aula</p>
              <p className="text-slate-800 font-medium mt-1 leading-relaxed">{reservation.subjectTopic}</p>
            </div>

            {reservation.requestedEquipment && reservation.requestedEquipment.length > 0 && (
              <div className="p-3 border-b border-slate-300 bg-slate-50">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Recursos e Equipamentos Requisitados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {reservation.requestedEquipment.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white text-slate-800 text-[11px] font-semibold border border-slate-300"
                    >
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reservation.observations && (
              <div className="p-3 bg-white">
                <p className="text-[10px] font-bold uppercase text-slate-500">Observações Gerais</p>
                <p className="text-slate-700 italic mt-0.5">{reservation.observations}</p>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">{reservation.userName}</p>
              <p className="text-[11px] text-slate-500">Professor(a) Solicitante</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Coordenação Pedagógica / Direção</p>
              <p className="text-[11px] text-slate-500">Visto e Autorização</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
            Documento gerado automaticamente pelo Sistema RESERVE em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
          </div>
        </div>

        {/* Footer actions - Screen only */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
