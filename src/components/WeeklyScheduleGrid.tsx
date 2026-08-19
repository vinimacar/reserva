import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  Search,
  Filter,
  Info,
  CheckCircle2,
  Sparkles,
  Monitor,
  Laptop,
  Microscope,
  FlaskConical,
  Cpu,
  Video,
  Plus,
  AlertCircle,
  BookOpen,
  MapPin,
  Wrench,
  Edit2,
  Shield,
  UserCheck,
} from 'lucide-react';
import { Room, TimePeriod, Reservation, ShiftType } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { EditRoomDetailsModal } from './EditRoomDetailsModal';

interface WeeklyScheduleGridProps {
  onSelectSlot: (roomId: string, date: string, periodId: string) => void;
  onSelectReservation: (reservation: Reservation) => void;
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  onSelectSlot,
  onSelectReservation,
}) => {
  const {
    rooms,
    periods,
    reservations,
    selectedRoomId,
    setSelectedRoomId,
    selectedShift,
    setSelectedShift,
    searchQuery,
    setSearchQuery,
    announcements,
  } = useReservations();
  const { currentUser, isAdmin } = useAuth();

  // Week offset state (0 = current week, 1 = next week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [showRoomInfo, setShowRoomInfo] = useState<boolean>(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState<boolean>(false);

  // Helper to get week dates (Monday to Friday)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);

    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const isToday = isoDate === new Date().toISOString().split('T')[0];
      
      const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
      const shortDayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
      
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });

      weekDays.push({
        date: isoDate,
        dayName: dayNames[i],
        shortName: shortDayNames[i],
        displayDate: `${dayNumber} ${monthName}`,
        isToday,
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDates(weekOffset);
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Filter periods by selected shift
  const filteredPeriods = periods.filter((p) => {
    if (selectedShift === 'ALL') return true;
    return p.shift === selectedShift;
  });

  // Shifts present in filteredPeriods
  const activeShifts: ShiftType[] = selectedShift === 'ALL' ? ['MANHA', 'TARDE', 'NOITE'] : [selectedShift];

  const getRoomIcon = (iconName: string) => {
    switch (iconName) {
      case 'Monitor':
        return <Monitor className="w-4 h-4" />;
      case 'Laptop':
        return <Laptop className="w-4 h-4" />;
      case 'Microscope':
        return <Microscope className="w-4 h-4" />;
      case 'FlaskConical':
        return <FlaskConical className="w-4 h-4" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4" />;
      case 'Video':
        return <Video className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Helper to format Portuguese date range
  const formattedWeekRange = `${weekDays[0].displayDate} a ${weekDays[4].displayDate}, ${new Date().getFullYear()}`;

  // Room announcement warning
  const roomAnnouncement = announcements.find(
    (a) => a.targetRoomId === currentRoom?.id && a.important
  );

  return (
    <div id="weekly-schedule-container" className="space-y-4">
      {/* 1. Room Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Selecione o Ambiente / Laboratório:
            </span>
          </div>
          {currentRoom && (
            <button
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showRoomInfo ? 'Ocultar Detalhes' : 'Ver Equipamentos & Regras'}</span>
            </button>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nenhum espaço ou laboratório cadastrado no momento.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              O Administrador pode cadastrar novos ambientes e laboratórios na aba Administração.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              const isMaintenance = room.status === 'MAINTENANCE';

              return (
                <button
                  key={room.id}
                  id={`room-tab-${room.id}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-600 dark:ring-blue-500'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                {isMaintenance && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}

                <div className="flex items-center space-x-2 w-full mb-1.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getRoomIcon(room.iconName)}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {room.capacity} lug.
                  </span>
                </div>

                <p className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-blue-950 dark:text-blue-200' : 'text-slate-900 dark:text-slate-100'}`}>
                  {room.name}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate w-full">
                  {room.location.split('-')[0]}
                </p>
              </button>
            );
          })}
        </div>
        )}

        {/* Expandable Room Info & Hardware */}
        {showRoomInfo && currentRoom && (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs animate-in fade-in duration-150 space-y-3.5">
            {/* Header with Title and Admin Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  {currentRoom.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  {currentRoom.capacity} Lugares
                </span>
              </div>

              {/* Only Administrator can edit equipments and rules */}
              {isAdmin ? (
                <button
                  id="btn-edit-room-rules-admin"
                  onClick={() => setIsEditRoomModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer self-start sm:self-auto transform active:scale-95 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Equipamentos, Regras e Responsável</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Edição restrita ao Administrador</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Localização & Responsável</span>
                </h4>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{currentRoom.location}</p>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">Responsável:</span>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                    {currentRoom.responsibleName || 'Coordenação'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-[11px] leading-relaxed">
                  {currentRoom.description || 'Espaço pedagógico para realização de atividades práticas.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Equipamentos Disponíveis ({currentRoom.equipment?.length || 0})</span>
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {currentRoom.equipment && currentRoom.equipment.length > 0 ? (
                    currentRoom.equipment.map((eq, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                        <span>{eq}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-slate-400 italic">Nenhum equipamento cadastrado.</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Normas de Utilização ({currentRoom.rules?.length || 0})</span>
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {currentRoom.rules && currentRoom.rules.length > 0 ? (
                    currentRoom.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                        <span>{rule}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-slate-400 italic">Nenhuma norma especial cadastrada.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Room Announcement Notice if any */}
      {roomAnnouncement && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">{roomAnnouncement.title}:</span>{' '}
              <span>{roomAnnouncement.content}</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded">
            Aviso de Manutenção
          </span>
        </div>
      )}

      {/* 2. Week Controls & Shift Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        {/* Week Navigator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              id="prev-week-btn"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="today-btn"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                weekOffset === 0
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              Semana Atual
            </button>
            <button
              id="next-week-btn"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Próxima Semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{formattedWeekRange}</span>
          </div>
        </div>

        {/* Shift Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSelectedShift('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedShift === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos os Turnos
            </button>
            <button
              onClick={() => setSelectedShift('MANHA')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedShift === 'MANHA'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Manhã
            </button>
            <button
              onClick={() => setSelectedShift('TARDE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedShift === 'TARDE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tarde
            </button>
            <button
              onClick={() => setSelectedShift('NOITE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedShift === 'NOITE'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Noite
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar prof., turma ou matéria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. The Interactive Schedule Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Table Header with Weekdays */}
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200">
              {/* Horário Column Header */}
              <div className="p-3 text-center border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Horário / Aula</span>
                <span className="text-[10px] text-slate-400 font-medium">Turno Escolar</span>
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors ${
                    day.isToday ? 'bg-blue-50/70 dark:bg-blue-950/40 border-b-2 border-b-blue-600' : ''
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{day.dayName}</p>
                  <p
                    className={`text-[11px] font-semibold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                      day.isToday ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.displayDate}
                  </p>
                </div>
              ))}
            </div>

            {/* Matrix Body: Loop through Shifts */}
            {activeShifts.map((shift) => {
              const shiftPeriods = periods.filter((p) => p.shift === shift);
              const shiftName =
                shift === 'MANHA'
                  ? '☀️ Turno da Manhã (Matutino)'
                  : shift === 'TARDE'
                  ? '🌤️ Turno da Tarde (Vespertino)'
                  : '🌙 Turno da Noite (Noturno)';

              return (
                <div key={shift} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                  {/* Shift Separator Header */}
                  <div className="bg-slate-100/90 dark:bg-slate-800/90 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{shiftName}</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      {shiftPeriods[0]?.startTime} às {shiftPeriods[shiftPeriods.length - 1]?.endTime}
                    </span>
                  </div>

                  {/* Period Rows */}
                  {shiftPeriods.map((period, idx) => {
                    // Check if we need an interval separator row
                    const showInterval =
                      (shift === 'MANHA' && period.number === 3) ||
                      (shift === 'TARDE' && period.number === 3);

                    return (
                      <React.Fragment key={period.id}>
                        <div className="grid grid-cols-6 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Period Title & Time */}
                          <div className="p-2.5 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 flex flex-col justify-center items-center text-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{period.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {period.startTime} - {period.endTime}
                            </span>
                          </div>

                          {/* 5 Day Slot Cells */}
                          {weekDays.map((day) => {
                            // Find reservation for this slot
                            const slotReservation = reservations.find(
                              (r) =>
                                r.roomId === selectedRoomId &&
                                r.date === day.date &&
                                r.status !== 'CANCELLED' &&
                                r.periodIds.includes(period.id)
                            );

                            // Check search query match
                            const matchesSearch =
                              searchQuery &&
                              slotReservation &&
                              (slotReservation.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                slotReservation.turma.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                slotReservation.disciplina.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                slotReservation.subjectTopic.toLowerCase().includes(searchQuery.toLowerCase()));

                            const isUserReservation =
                              currentUser && slotReservation?.userId === currentUser.id;

                            return (
                              <div
                                key={`${day.date}-${period.id}`}
                                className={`p-1.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 min-h-[86px] flex flex-col justify-center ${
                                  day.isToday ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                                } ${matchesSearch ? 'ring-2 ring-amber-400 rounded-lg z-10' : ''}`}
                              >
                                {slotReservation ? (
                                  <button
                                    onClick={() => onSelectReservation(slotReservation)}
                                    className={`w-full text-left p-2 rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between h-full ${
                                      isUserReservation
                                        ? 'bg-blue-500/10 dark:bg-blue-950/60 border-2 border-blue-500 hover:bg-blue-500/20 dark:hover:bg-blue-950/80 text-blue-950 dark:text-blue-100'
                                        : 'bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-200 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 truncate">
                                          {slotReservation.turma}
                                        </span>
                                        {isUserReservation && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white uppercase shrink-0">
                                            Sua Reserva
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                        {slotReservation.disciplina}
                                      </p>
                                      
                                      <div className="flex items-center space-x-1 text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{slotReservation.userName.split(' ')[0]} {slotReservation.userName.split(' ')[1] || ''}</span>
                                      </div>
                                    </div>

                                    {slotReservation.requestedEquipment && slotReservation.requestedEquipment.length > 0 && (
                                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                        <Wrench className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                        <span className="truncate">{slotReservation.requestedEquipment[0]}</span>
                                        {slotReservation.requestedEquipment.length > 1 && (
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400">+{slotReservation.requestedEquipment.length - 1}</span>
                                        )}
                                      </div>
                                    )}
                                  </button>
                                ) : (
                                  /* Empty Slot -> Quick Book */
                                  <button
                                    onClick={() => onSelectSlot(selectedRoomId, day.date, period.id)}
                                    className="w-full h-full min-h-[70px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group cursor-pointer p-1"
                                    title={`Reservar ${period.name} na ${day.dayName}`}
                                  >
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center transition-colors">
                                      <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      Reservar
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Interval / Recreio Row */}
                        {showInterval && (
                          <div className="grid grid-cols-6 bg-amber-50/50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-semibold py-1">
                            <div className="p-1 text-center font-mono text-[10px] text-amber-700 dark:text-amber-400">
                              {shift === 'MANHA' ? '09:30 - 09:50' : '15:30 - 15:50'}
                            </div>
                            <div className="col-span-5 text-center text-amber-900/80 dark:text-amber-200/90 font-medium">
                              ☕ Intervalo Escolar / Recreio dos Professores e Alunos
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Quick Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950 border border-blue-500"></div>
            <span>Suas Reservas</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700"></div>
            <span>Outros Professores</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <span>Horário Livre (Disponível)</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 sm:mt-0">
          💡 Clique em qualquer horário livre para agendar sua aula.
        </p>
      </div>

      {/* Edit Room Details, Equipments & Rules Modal (Admin Only) */}
      <EditRoomDetailsModal
        isOpen={isEditRoomModalOpen}
        room={currentRoom}
        onClose={() => setIsEditRoomModalOpen(false)}
      />
    </div>
  );
};
