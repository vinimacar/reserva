import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  X,
  Calendar,
  Clock,
  School,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  FileText,
  Grid,
  List,
  Layers,
  Sparkles,
  MapPin,
  User,
  Users,
  BookOpen,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { ShiftType, Reservation, TimePeriod, Room } from '../types';
import { formatLocalDateToISO } from '../lib/dateUtils';

interface WeeklySchedulePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShift?: ShiftType | 'ALL';
  initialWeekOffset?: number;
}

export const WeeklySchedulePrintModal: React.FC<WeeklySchedulePrintModalProps> = ({
  isOpen,
  onClose,
  initialShift = 'ALL',
  initialWeekOffset = 0,
}) => {
  const {
    reservations,
    rooms,
    periods,
    currentSchool,
    settings,
  } = useReservations();

  // Filters
  const [weekOffset, setWeekOffset] = useState<number>(initialWeekOffset);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<ShiftType | 'ALL'>(initialShift);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [onlyApproved, setOnlyApproved] = useState<boolean>(true);
  const [printLayout, setPrintLayout] = useState<'GRID' | 'LIST'>('GRID'); // 'GRID' = Mapa Semanal, 'LIST' = Pauta com Assinatura

  useEffect(() => {
    if (isOpen) {
      setWeekOffset(initialWeekOffset);
      setSelectedShiftFilter(initialShift);
    }
  }, [isOpen, initialWeekOffset, initialShift]);

  // School branding details
  const schoolName = currentSchool?.name || settings?.schoolName || 'Escola da Rede';
  const schoolCity = currentSchool?.city || settings?.city || 'Belo Horizonte';
  const schoolState = currentSchool?.state || settings?.state || 'MG';
  const schoolLogo = currentSchool?.logoUrl || settings?.logoUrl;

  // Calculate week days (Monday to Friday or Saturday)
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    // Distance to Monday of current week
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + weekOffset * 7);

    const days = [];
    const numDays = settings.allowWeekendBooking ? 6 : 5; // Monday to Friday (5) or Saturday (6)

    for (let i = 0; i < numDays; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatLocalDateToISO(d);
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      days.push({
        date: d,
        iso,
        dayName: capitalizedDayName,
        formattedDate,
      });
    }

    return days;
  }, [weekOffset, settings.allowWeekendBooking]);

  const weekStartDateStr = weekDays[0]?.formattedDate || '';
  const weekEndDateStr = weekDays[weekDays.length - 1]?.formattedDate || '';
  const weekYearStr = weekDays[0]?.date.getFullYear() || new Date().getFullYear();

  // Filter reservations for the selected week, shift, room and status
  const weekReservations = useMemo(() => {
    const weekIsoSet = new Set(weekDays.map((d) => d.iso));

    return reservations.filter((r) => {
      if (!weekIsoSet.has(r.date)) return false;
      if (selectedShiftFilter !== 'ALL' && r.shift !== selectedShiftFilter) return false;
      if (selectedRoomFilter !== 'ALL' && r.roomId !== selectedRoomFilter) return false;
      if (onlyApproved && r.status !== 'CONFIRMED' && r.status !== 'COMPLETED') return false;
      if (r.status === 'CANCELLED') return false;
      return true;
    });
  }, [reservations, weekDays, selectedShiftFilter, selectedRoomFilter, onlyApproved]);

  // Relevant shifts to display
  const activeShifts: ShiftType[] = useMemo(() => {
    if (selectedShiftFilter !== 'ALL') return [selectedShiftFilter];

    const configuredShifts =
      currentSchool?.shifts && currentSchool.shifts.length > 0
        ? currentSchool.shifts
        : settings?.shifts && settings.shifts.length > 0
        ? settings.shifts
        : (['MANHA', 'TARDE', 'NOITE', 'INTEGRAL'] as ShiftType[]);

    const candidateOrder: ShiftType[] = ['MANHA', 'TARDE', 'NOITE', 'INTEGRAL'];
    const filtered = candidateOrder.filter((sh) => {
      const hasPeriods = periods.some((p) => p.shift === sh);
      const isConfigured = configuredShifts.includes(sh);
      const hasRes = weekReservations.some((r) => r.shift === sh);
      return hasPeriods && (isConfigured || hasRes);
    });

    return filtered.length > 0 ? filtered : configuredShifts;
  }, [selectedShiftFilter, currentSchool?.shifts, settings?.shifts, periods, weekReservations]);

  // Shift label helper
  const shiftLabels: Record<ShiftType, string> = {
    MANHA: 'Turno da Manhã',
    TARDE: 'Turno da Tarde',
    NOITE: 'Turno da Noite',
    INTEGRAL: 'Tempo Integral',
  };

  // Trigger print safely without crashing iframe or throwing COOP errors
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Erro ou bloqueio ao chamar window.print():', err);
    }
  };

  // Render nothing only after ALL hooks have been registered unconditionally
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* MODAL HEADER - Hidden on print */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Imprimir Reservas por Semana e Turno</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Pronto para PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gere o mapa semanal de ocupação ou a pauta com campo de assinatura dos professores
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS - Hidden on print */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          {/* Week Navigation */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
            >
              Semana Atual
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 px-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              {weekStartDateStr} a {weekEndDateStr}/{weekYearStr}
            </span>
          </div>

          {/* Filters: Turno, Sala, Formato */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Turno */}
            <div className="flex items-center space-x-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Turno:</span>
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value as ShiftType | 'ALL')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os Turnos (Geral)</option>
                <option value="MANHA">Turno da Manhã</option>
                <option value="TARDE">Turno da Tarde</option>
                <option value="NOITE">Turno da Noite</option>
                <option value="INTEGRAL">Tempo Integral</option>
              </select>
            </div>

            {/* Sala */}
            <div className="flex items-center space-x-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Espaço:</span>
              <select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[170px] truncate"
              >
                <option value="ALL">Todas as Salas / Labs</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Mode Selector */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setPrintLayout('GRID')}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                  printLayout === 'GRID'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Quadro / Mapa Semanal por Horários"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grade Semanal</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('LIST')}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                  printLayout === 'LIST'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Pauta Oficial detalhada com campo de visto do professor"
              >
                <List className="w-3.5 h-3.5" />
                <span>Pauta de Assinatura</span>
              </button>
            </div>

            {/* Only approved checkbox */}
            <label className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Apenas Aprovadas</span>
            </label>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTAINER */}
        <div
          id="printable-weekly-schedule"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 print:p-0 print:overflow-visible print:bg-white print:text-black"
        >
          {/* 1. OFFICIAL INSTITUTIONAL HEADER */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt="Brasão da Escola"
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 print:border-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                    <School className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">
                    REDE PÚBLICA DE ENSINO • RESERVELABS
                  </span>
                  <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                    {schoolName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600">
                    {schoolCity} - {schoolState}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-black rounded-lg uppercase tracking-wider">
                  {printLayout === 'GRID' ? 'Grade Semanal de Ocupação' : 'Pauta Semanal de Aulas e Reservas'}
                </span>
                <p className="text-[11px] font-bold text-slate-700 mt-1">
                  Semana: {weekStartDateStr} a {weekEndDateStr}/{weekYearStr}
                </p>
                <p className="text-[10px] text-slate-500">
                  Turno: {selectedShiftFilter === 'ALL' ? 'Todos os Turnos' : shiftLabels[selectedShiftFilter]}
                </p>
              </div>
            </div>

            {/* Document metadata bar */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>Espaço(s):</strong> {selectedRoomFilter === 'ALL' ? 'Todos os Laboratórios & Salas' : rooms.find(r => r.id === selectedRoomFilter)?.name}
                </span>
                <span>
                  <strong>Total de Reservas:</strong> {weekReservations.length}
                </span>
              </div>
              <div>
                <span>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* 2. BODY CONTENT - LAYOUT OPTION 1: GRADE SEMANAL (MATRIZ) */}
          {printLayout === 'GRID' && (
            <div className="space-y-6">
              {activeShifts.map((sh) => {
                const shiftPeriodList = periods
                  .filter((p) => p.shift === sh)
                  .sort((a, b) => a.number - b.number || a.startTime.localeCompare(b.startTime));

                if (shiftPeriodList.length === 0) return null;

                // Check if there are any reservations in this shift
                const shiftRes = weekReservations.filter((r) => r.shift === sh);

                return (
                  <div key={sh} className="space-y-2 break-inside-avoid">
                    {/* Shift section title */}
                    <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="uppercase">{shiftLabels[sh]}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        {shiftRes.length} agendamento(s)
                      </span>
                    </div>

                    {/* Table Matrix */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                            <th className="py-2 px-2.5 border-r border-slate-200 w-28 text-center">
                              Horário / Aula
                            </th>
                            {weekDays.map((day) => (
                              <th key={day.iso} className="py-2 px-2.5 border-r border-slate-200 last:border-r-0 text-center">
                                <span className="block font-bold text-slate-900">{day.dayName}</span>
                                <span className="text-[10px] font-medium text-slate-500">{day.formattedDate}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {shiftPeriodList.map((period, idx) => {
                            return (
                              <tr key={period.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                {/* Period cell */}
                                <td className="py-2 px-2 border-t border-r border-slate-200 text-center font-semibold text-slate-800 bg-slate-50/80">
                                  <span className="block font-bold text-xs">{period.number}ª Aula</span>
                                  <span className="text-[9px] text-slate-500">{period.startTime} - {period.endTime}</span>
                                </td>

                                {/* Day slots */}
                                {weekDays.map((day) => {
                                  const slotRes = weekReservations.filter((r) => {
                                    return (
                                      r.date === day.iso &&
                                      r.periodIds &&
                                      r.periodIds.includes(period.id)
                                    );
                                  });

                                  return (
                                    <td
                                      key={`${period.id}-${day.iso}`}
                                      className="py-1.5 px-2 border-t border-r border-slate-200 last:border-r-0 align-top min-h-[56px] w-[18%]"
                                    >
                                      {slotRes.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-[10px] text-slate-300 py-2">
                                          —
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {slotRes.map((r) => (
                                            <div
                                              key={r.id}
                                              className="p-1.5 rounded-lg border border-slate-300 bg-white shadow-2xs text-[10px] space-y-0.5"
                                            >
                                              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-0.5">
                                                <span className="truncate">{r.roomName}</span>
                                                <span className="text-[8px] font-black px-1 rounded bg-slate-100 text-slate-700">
                                                  {r.turma || 'Geral'}
                                                </span>
                                              </div>
                                              <p className="font-semibold text-blue-900 truncate">
                                                {r.userName}
                                              </p>
                                              {r.disciplina && (
                                                <p className="text-slate-600 text-[9px] truncate">
                                                  {r.disciplina}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. BODY CONTENT - LAYOUT OPTION 2: PAUTA OFICIAL COM ASSINATURA */}
          {printLayout === 'LIST' && (
            <div className="space-y-6">
              {weekDays.map((day) => {
                const dayReservations = weekReservations
                  .filter((r) => r.date === day.iso)
                  .sort((a, b) => {
                    const shiftOrder = { MANHA: 1, TARDE: 2, NOITE: 3, INTEGRAL: 4 };
                    return (shiftOrder[a.shift] || 0) - (shiftOrder[b.shift] || 0);
                  });

                return (
                  <div key={day.iso} className="space-y-2 break-inside-avoid">
                    {/* Day header banner */}
                    <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>
                          {day.dayName}, {day.formattedDate}/{weekYearStr}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        {dayReservations.length} agendamento(s)
                      </span>
                    </div>

                    {/* Day Table */}
                    {dayReservations.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Nenhum agendamento registrado para este dia.
                      </div>
                    ) : (
                      <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full border-collapse text-left text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                              <th className="py-2 px-2 border-r border-slate-200 w-24">Turno & Horário</th>
                              <th className="py-2 px-2 border-r border-slate-200 w-36">Espaço / Lab</th>
                              <th className="py-2 px-2 border-r border-slate-200">Professor(a)</th>
                              <th className="py-2 px-2 border-r border-slate-200 w-24">Turma</th>
                              <th className="py-2 px-2 border-r border-slate-200">Componente / Conteúdo</th>
                              <th className="py-2 px-2 w-36 text-center">Visto / Assinatura</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayReservations.map((res, idx) => (
                              <tr key={res.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-2 px-2 border-t border-r border-slate-200 font-semibold text-slate-800">
                                  <span className="font-bold text-blue-900 block">
                                    {shiftLabels[res.shift] || res.shift}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block">
                                    {Array.isArray(res.periodLabels)
                                      ? res.periodLabels.join(', ')
                                      : typeof res.periodLabels === 'string' && res.periodLabels
                                      ? res.periodLabels
                                      : 'Horário integral'}
                                  </span>
                                </td>
                                <td className="py-2 px-2 border-t border-r border-slate-200 font-bold text-slate-900">
                                  {res.roomName}
                                </td>
                                <td className="py-2 px-2 border-t border-r border-slate-200 font-semibold text-slate-800">
                                  {res.userName}
                                </td>
                                <td className="py-2 px-2 border-t border-r border-slate-200 font-bold text-slate-700">
                                  {res.turma || 'Geral'}
                                </td>
                                <td className="py-2 px-2 border-t border-r border-slate-200 text-slate-700">
                                  <strong>{res.disciplina || 'Geral'}</strong>
                                  {res.subjectTopic && (
                                    <span className="text-slate-500 block text-[9px]">{res.subjectTopic}</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 border-t text-center align-middle">
                                  <div className="border-b border-slate-400 w-28 mx-auto mt-4" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. OFFICIAL FOOTER / SIGNATURES ON PRINT */}
          <div className="mt-8 pt-6 border-t-2 border-slate-800 text-[10px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4 break-inside-avoid">
            <div>
              <p className="font-bold text-slate-800">
                Coordenação Pedagógica / Especialista da Educação Básica
              </p>
              <p className="text-slate-500">
                Documento emitido para controle e acompanhamento de uso dos laboratórios escolares.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="border-b border-slate-400 w-48 mb-1 mx-auto sm:ml-auto" />
              <span className="font-semibold text-slate-700">Visto da Direção / Coordenação</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS - Hidden on print */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            💡 Dica: Nas opções de impressão do navegador, marque <strong>"Gráficos de segundo plano"</strong> para manter as cores e bordas nítidas.
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded print styles to ensure perfection in landscape or portrait */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-weekly-schedule, #printable-weekly-schedule * {
            visibility: visible;
          }
          #printable-weekly-schedule {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: ${printLayout === 'GRID' ? 'landscape' : 'portrait'};
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
};
