import React, { useState, useEffect, useMemo } from 'react';
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
  Smartphone,
  Layers,
  Printer,
} from 'lucide-react';
import { Room, TimePeriod, Reservation, ShiftType } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { EditRoomDetailsModal } from './EditRoomDetailsModal';
import { WeeklySchedulePrintModal } from './WeeklySchedulePrintModal';
import { formatLocalDateToISO } from '../lib/dateUtils';

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
    currentSchool,
    settings,
  } = useReservations();
  const { currentUser, isAdmin } = useAuth();

  // Week offset state (0 = current week, 1 = next week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [showRoomInfo, setShowRoomInfo] = useState<boolean>(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Mobile day view state: selectedDayIndex (0 = Seg, 1 = Ter, 2 = Qua, 3 = Qui, 4 = Sex)
  const getInitialDayIndex = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday... 5 is Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return dayOfWeek - 1;
    }
    return 0; // default to Monday
  };
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(getInitialDayIndex());
  const [mobileViewMode, setMobileViewMode] = useState<'DAY' | 'WEEK'>('DAY');

  // Helper to get week dates (Monday to Friday)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);

    const weekDays = [];
    const todayIso = formatLocalDateToISO();
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = formatLocalDateToISO(d);
      const isToday = isoDate === todayIso;
      
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

  // Authorized shifts for the currently active school
  const schoolShifts: ShiftType[] = useMemo(() => {
    if (currentSchool?.shifts && currentSchool.shifts.length > 0) {
      return currentSchool.shifts;
    }
    if (settings?.shifts && settings.shifts.length > 0) {
      return settings.shifts;
    }
    return ['MANHA', 'TARDE'];
  }, [currentSchool?.shifts, settings?.shifts]);

  // If selectedShift is not 'ALL' and is not permitted in this school, reset to 'ALL'
  useEffect(() => {
    if (selectedShift !== 'ALL' && !schoolShifts.includes(selectedShift)) {
      setSelectedShift('ALL');
    }
  }, [schoolShifts, selectedShift, setSelectedShift]);

  // Filter periods strictly by the school's configured shifts
  const filteredPeriods = periods.filter((p) => {
    if (!schoolShifts.includes(p.shift)) return false;
    if (selectedShift === 'ALL') return true;
    return p.shift === selectedShift;
  });

  // Shifts present in filteredPeriods
  const activeShifts: ShiftType[] = useMemo(() => {
    if (selectedShift === 'ALL') {
      return schoolShifts;
    }
    return schoolShifts.includes(selectedShift) ? [selectedShift] : [schoolShifts[0]];
  }, [selectedShift, schoolShifts]);

  // Guard slot clicking against unauthorized shifts
  const handleSlotClick = (roomId: string, date: string, period: TimePeriod) => {
    if (!schoolShifts.includes(period.shift)) {
      alert(`O turno desta aula (${period.shift}) não é ofertado pela escola ${currentSchool?.name || ''}. Horários restritos aos turnos configurados.`);
      return;
    }
    onSelectSlot(roomId, date, period.id);
  };

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
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 overflow-x-auto no-scrollbar pb-1">
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              const isMaintenance = room.status === 'MAINTENANCE';

              return (
                <button
                  key={room.id}
                  id={`room-tab-${room.id}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 w-36 sm:w-auto ${
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        {/* Week Navigator */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
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
              className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
            <span className="truncate">{formattedWeekRange}</span>
          </div>

          {/* Print Weekly Schedule Button */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Imprimir mapa de reservas da semana e turnos (Grid ou Pauta com Visto)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Imprimir Grade</span>
          </button>
        </div>

        {/* Shift Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Shift Filter Tabs - Dynamically restricted to School Configured Shifts */}
          <div className="flex overflow-x-auto no-scrollbar items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {schoolShifts.length > 1 && (
              <button
                onClick={() => setSelectedShift('ALL')}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedShift === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({schoolShifts.length})
              </button>
            )}

            {schoolShifts.map((shift) => {
              const isActive = selectedShift === shift || (schoolShifts.length === 1 && selectedShift === 'ALL');
              const shiftConfig = {
                MANHA: { label: 'Manhã', activeClass: 'bg-amber-500 text-white shadow-xs', badge: 'M' },
                TARDE: { label: 'Tarde', activeClass: 'bg-blue-600 text-white shadow-xs', badge: 'T' },
                NOITE: { label: 'Noite', activeClass: 'bg-purple-600 text-white shadow-xs', badge: 'N' },
                INTEGRAL: { label: 'Integral', activeClass: 'bg-emerald-600 text-white shadow-xs', badge: 'I' },
              }[shift] || { label: shift, activeClass: 'bg-slate-900 text-white', badge: shift[0] };

              return (
                <button
                  key={shift}
                  onClick={() => setSelectedShift(shift)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? shiftConfig.activeClass
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Exibir horários do turno ${shiftConfig.label}`}
                >
                  <span>{shiftConfig.label}</span>
                  {schoolShifts.length === 1 && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-white/20 font-bold uppercase">
                      Turno da Escola
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar prof., turma ou matéria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 w-full sm:w-56"
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

      {/* Mobile View Toggle Bar (Only on mobile < md) */}
      <div className="md:hidden flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <button
          type="button"
          onClick={() => setMobileViewMode('DAY')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            mobileViewMode === 'DAY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Visão por Dia (Diária)</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileViewMode('WEEK')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            mobileViewMode === 'WEEK'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grade Semanal</span>
        </button>
      </div>

      {/* Mobile Day View (Rendered when mobileViewMode is DAY) */}
      {mobileViewMode === 'DAY' && (
        <div className="md:hidden space-y-3">
          {/* Day Selector Pills */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700">
            {weekDays.map((d, idx) => {
              const isSelected = idx === selectedDayIndex;
              const dayReservations = reservations.filter(
                (r) => r.roomId === selectedRoomId && r.date === d.date && r.status !== 'CANCELLED'
              );
              const hasMyBooking = currentUser && dayReservations.some((r) => r.userId === currentUser.id);

              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-tight">{d.shortName}</span>
                  <span className={`text-sm font-black my-0.5 ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {d.displayDate.split(' ')[0]}
                  </span>
                  {d.isToday && (
                    <span className={`text-[8px] font-bold px-1 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'}`}>
                      Hoje
                    </span>
                  )}
                  {/* Indicator dots */}
                  <div className="flex items-center space-x-1 mt-0.5">
                    {hasMyBooking && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-blue-500'}`} title="Você tem reserva neste dia" />
                    )}
                    {dayReservations.length > 0 && !hasMyBooking && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-slate-400'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Header with Prev/Next Navigation */}
          {(() => {
            const curDay = weekDays[selectedDayIndex] || weekDays[0];
            const curDayReservations = reservations.filter(
              (r) => r.roomId === selectedRoomId && r.date === curDay.date && r.status !== 'CANCELLED'
            );

            const handlePrevDay = () => {
              if (selectedDayIndex > 0) {
                setSelectedDayIndex(selectedDayIndex - 1);
              } else {
                setWeekOffset((prev) => prev - 1);
                setSelectedDayIndex(4);
              }
            };

            const handleNextDay = () => {
              if (selectedDayIndex < 4) {
                setSelectedDayIndex(selectedDayIndex + 1);
              } else {
                setWeekOffset((prev) => prev + 1);
                setSelectedDayIndex(0);
              }
            };

            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Dia Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center min-w-0 flex-1">
                  <div className="flex items-center justify-center space-x-1.5">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {curDay.dayName}
                    </p>
                    {curDay.isToday && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white shrink-0">
                        Hoje
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {curDay.displayDate} • {curDayReservations.length} horário(s) agendado(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Próximo Dia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}

          {/* Selected Day Periods List */}
          {(() => {
            const curDay = weekDays[selectedDayIndex] || weekDays[0];

            return (
              <div className="space-y-3">
                {activeShifts.map((shift) => {
                  const shiftPeriods = periods.filter((p) => p.shift === shift);
                  if (shiftPeriods.length === 0) return null;

                  const shiftTitle =
                    shift === 'MANHA'
                      ? '☀️ Turno da Manhã'
                      : shift === 'TARDE'
                      ? '🌤️ Turno da Tarde'
                      : shift === 'NOITE'
                      ? '🌙 Turno da Noite'
                      : '🕒 Tempo Integral';

                  return (
                    <div
                      key={`mobile-shift-${shift}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                    >
                      <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{shiftTitle}</span>
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          {shiftPeriods[0]?.startTime} às {shiftPeriods[shiftPeriods.length - 1]?.endTime}
                        </span>
                      </div>

                      <div className="p-2.5 space-y-2">
                        {shiftPeriods.map((period) => {
                          const showInterval =
                            (shift === 'MANHA' && period.number === 3) ||
                            (shift === 'TARDE' && period.number === 3) ||
                            (shift === 'INTEGRAL' && (period.number === 3 || period.number === 5 || period.number === 7));

                          const slotReservation = reservations.find(
                            (r) =>
                              r.roomId === selectedRoomId &&
                              r.date === curDay.date &&
                              r.status !== 'CANCELLED' &&
                              r.periodIds.includes(period.id)
                          );

                          const isUserReservation =
                            currentUser && slotReservation?.userId === currentUser.id;

                          return (
                            <React.Fragment key={`mobile-period-${period.id}`}>
                              {slotReservation ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectReservation(slotReservation)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                    isUserReservation
                                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 shadow-sm'
                                      : 'bg-indigo-50/70 dark:bg-slate-800/80 border-indigo-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                        {period.name}
                                      </span>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        ({period.startTime} - {period.endTime})
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-blue-600 text-white">
                                        {slotReservation.turma}
                                      </span>
                                      {isUserReservation && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-900">
                                          Sua
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                    {slotReservation.disciplina}
                                  </p>

                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center space-x-1.5 truncate">
                                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <span className="truncate font-semibold">{slotReservation.userName}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                                      Ver Detalhes ›
                                    </span>
                                  </div>

                                  {slotReservation.requestedEquipment && slotReservation.requestedEquipment.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {slotReservation.requestedEquipment.map((eq, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                                        >
                                          {eq}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(selectedRoomId, curDay.date, period)}
                                  className="w-full text-left p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer min-h-[50px] flex items-center justify-between"
                                >
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mr-2">
                                      {period.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                      {period.startTime} - {period.endTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <Plus className="w-4 h-4" />
                                    <span>Disponível</span>
                                  </div>
                                </button>
                              )}

                              {showInterval && (
                                <div className="py-2 px-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-center text-xs text-amber-900 dark:text-amber-300 font-medium flex items-center justify-center space-x-1.5">
                                  <span>☕</span>
                                  <span>
                                    {shift === 'INTEGRAL' && period.number === 5
                                      ? 'Horário de Almoço & Tutoria Pedagógica'
                                      : 'Intervalo Escolar / Recreio'}
                                  </span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. The Interactive Schedule Matrix (Desktop OR Mobile Week Mode) */}
      <div className={`${mobileViewMode === 'DAY' ? 'hidden md:block' : 'block'} bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors`}>
        {/* Mobile Swipe Hint */}
        <div className="md:hidden p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-center space-x-1 border-b border-blue-200 dark:border-blue-900/60 font-medium">
          <span>👉 Deslize para os lados para visualizar todos os dias</span>
        </div>

        {/* Table Header with Weekdays */}
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200">
              {/* Horário Column Header */}
              <div className="p-3 text-center border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-xs">
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
              if (shiftPeriods.length === 0) return null;

              const shiftName =
                shift === 'MANHA'
                  ? '☀️ Turno da Manhã (Matutino)'
                  : shift === 'TARDE'
                  ? '🌤️ Turno da Tarde (Vespertino)'
                  : shift === 'NOITE'
                  ? '🌙 Turno da Noite (Noturno)'
                  : '🕒 Tempo Integral (Educação Integral / EMTI)';

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
                      (shift === 'TARDE' && period.number === 3) ||
                      (shift === 'INTEGRAL' && (period.number === 3 || period.number === 5 || period.number === 7));

                    return (
                      <React.Fragment key={period.id}>
                        <div className="grid grid-cols-6 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Period Title & Time */}
                          <div className="p-2.5 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center text-center sticky left-0 z-10 shadow-xs">
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
                                    onClick={() => handleSlotClick(selectedRoomId, day.date, period)}
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
                            <div className="p-1 text-center font-mono text-[10px] text-amber-700 dark:text-amber-400 sticky left-0 z-10 bg-amber-50 dark:bg-amber-950 shadow-xs">
                              {shift === 'MANHA'
                                ? '09:30 - 09:50'
                                : shift === 'TARDE'
                                ? '15:30 - 15:50'
                                : period.number === 3
                                ? '09:10 - 09:25'
                                : period.number === 5
                                ? '11:55 - 13:00 (Almoço)'
                                : '14:40 - 14:55'}
                            </div>
                            <div className="col-span-5 text-center text-amber-900/80 dark:text-amber-200/90 font-medium">
                              {shift === 'INTEGRAL' && period.number === 5
                                ? '🍽️ Horário de Almoço & Tutoria Pedagógica'
                                : '☕ Intervalo Escolar / Recreio dos Professores e Alunos'}
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

      {/* Weekly Schedule & Shifts Print Modal */}
      <WeeklySchedulePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialWeekOffset={weekOffset}
        initialShift={selectedShift}
      />
    </div>
  );
};
