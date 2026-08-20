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
} from 'lucide-react';
import { Reservation } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { TeacherAvatar } from './TeacherAvatar';

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
  const { reservations, rooms } = useReservations();
  const { currentUser } = useAuth();
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'PAST' | 'ALL' | 'CANCELLED'>('UPCOMING');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const todayIso = new Date().toISOString().split('T')[0];

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
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <TeacherAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              subject={currentUser.subject}
              role={currentUser.role}
              size="lg"
              showRoleBadge={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white">{currentUser.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {currentUser.role === 'ADMIN' ? 'Coordenador / Admin' : 'Docente'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">{currentUser.email}</p>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">
                📚 Disciplina principal: <span className="text-white font-bold">{currentUser.subject || 'Geral'}</span>
              </p>
            </div>
          </div>

          {/* Quick Counter Badges & Action */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="px-3 py-1 text-center border-r border-white/10">
                <p className="text-lg font-black text-white leading-tight">{upcomingCount}</p>
                <p className="text-[10px] text-blue-200 font-semibold uppercase">Próximas</p>
              </div>
              <div className="px-3 py-1 text-center">
                <p className="text-lg font-black text-white leading-tight">{pastCount}</p>
                <p className="text-[10px] text-blue-200 font-semibold uppercase">Realizadas</p>
              </div>
            </div>

            <button
              onClick={onOpenNewReservation}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Reserva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        {/* Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('UPCOMING')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'UPCOMING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Próximas ({upcomingCount})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({userReservations.length})
          </button>
          <button
            onClick={() => setFilterTab('PAST')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'PAST'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Histórico ({pastCount})
          </button>
          <button
            onClick={() => setFilterTab('CANCELLED')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
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
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onOpenReceipt(res)}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Ficha de Reserva</span>
                  </button>

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
    </div>
  );
};
