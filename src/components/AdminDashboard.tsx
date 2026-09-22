import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  TrendingUp,
  Filter,
  BarChart3,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { Reservation, Room } from '../types';
import { parseISOLocalDate } from '../lib/dateUtils';

// Palette of colors for distinct rooms in charts
const ROOM_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
];

const WEEKDAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_MAP: Record<number, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface AdminDashboardProps {
  onNavigateToBookings?: (status?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToBookings }) => {
  const { reservations, rooms, currentSchool, settings } = useReservations();
  const { isDark } = useTheme();

  // Selected Month & Year (defaults to current real-time month/year)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // Filters
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');
  const [weekdayChartMode, setWeekdayChartMode] = useState<'STACKED' | 'TOTAL'>('STACKED');

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  const isCurrentMonthSelected =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  // Helper to test if a reservation matches month and filter
  const matchesFilter = (r: Reservation, filterByMonth = true): boolean => {
    if (!r || !r.date) return false;

    // Room filter
    if (selectedRoomFilter !== 'ALL' && r.roomId !== selectedRoomFilter) {
      return false;
    }

    // Shift filter
    if (selectedShiftFilter !== 'ALL' && r.shift !== selectedShiftFilter) {
      return false;
    }

    if (filterByMonth) {
      const d = parseISOLocalDate(r.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) {
        return false;
      }
    }

    return true;
  };

  // 1. Current Month KPI Metrics
  const currentMonthConfirmedReservations = useMemo(() => {
    return reservations.filter((r) => r.status === 'CONFIRMED' && matchesFilter(r, true));
  }, [reservations, selectedYear, selectedMonth, selectedRoomFilter, selectedShiftFilter]);

  const currentMonthAllReservations = useMemo(() => {
    return reservations.filter((r) => matchesFilter(r, true));
  }, [reservations, selectedYear, selectedMonth, selectedRoomFilter, selectedShiftFilter]);

  const currentMonthPendingCount = useMemo(() => {
    return currentMonthAllReservations.filter((r) => r.status === 'PENDING').length;
  }, [currentMonthAllReservations]);

  const currentMonthCancelledCount = useMemo(() => {
    return currentMonthAllReservations.filter((r) => r.status === 'CANCELLED').length;
  }, [currentMonthAllReservations]);

  const totalStudentsServed = useMemo(() => {
    return currentMonthConfirmedReservations.reduce(
      (acc, curr) => acc + (curr.numberOfStudents || 30),
      0
    );
  }, [currentMonthConfirmedReservations]);

  const confirmationRate = useMemo(() => {
    if (currentMonthAllReservations.length === 0) return 0;
    return Math.round(
      (currentMonthConfirmedReservations.length / currentMonthAllReservations.length) * 100
    );
  }, [currentMonthConfirmedReservations.length, currentMonthAllReservations.length]);

  // 2. Frequency by Day of Week Data (Segunda a Sábado)
  // We compute frequency for the chosen period (within the selected month or all-time)
  const weekdayUsageData = useMemo(() => {
    // Initialise structure for each weekday
    const daysData: Record<string, Record<string, any>> = {
      Segunda: { name: 'Segunda', total: 0 },
      Terça: { name: 'Terça', total: 0 },
      Quarta: { name: 'Quarta', total: 0 },
      Quinta: { name: 'Quinta', total: 0 },
      Sexta: { name: 'Sexta', total: 0 },
      Sábado: { name: 'Sábado', total: 0 },
    };

    // Initialize room counts on each day
    rooms.forEach((room) => {
      WEEKDAY_NAMES.forEach((day) => {
        daysData[day][room.name] = 0;
      });
    });

    // Count confirmed reservations matching filters
    currentMonthConfirmedReservations.forEach((r) => {
      const d = parseISOLocalDate(r.date);
      const dayNum = d.getDay();
      const dayName = WEEKDAY_MAP[dayNum];
      if (dayName && daysData[dayName]) {
        daysData[dayName].total += 1;
        const roomName = r.roomName || 'Outra';
        if (daysData[dayName][roomName] !== undefined) {
          daysData[dayName][roomName] += 1;
        } else {
          daysData[dayName][roomName] = 1;
        }
      }
    });

    return WEEKDAY_NAMES.map((day) => daysData[day]);
  }, [currentMonthConfirmedReservations, rooms]);

  // Peak weekday calculation
  const peakWeekday = useMemo(() => {
    let max = -1;
    let peak = 'Nenhum';
    weekdayUsageData.forEach((item) => {
      if (item.total > max && item.total > 0) {
        max = item.total;
        peak = item.name;
      }
    });
    return { name: peak, total: max > 0 ? max : 0 };
  }, [weekdayUsageData]);

  // 3. Daily Progression Throughout the Selected Month (1st to last day)
  const dailyProgressionData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result: Array<{ day: number; label: string; confirmadas: number; pendentes: number }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const isoDate = `${selectedYear}-${monthStr}-${dayStr}`;

      const dayReservations = reservations.filter((r) => r.date === isoDate && matchesFilter(r, false));
      const confirmed = dayReservations.filter((r) => r.status === 'CONFIRMED').length;
      const pending = dayReservations.filter((r) => r.status === 'PENDING').length;

      result.push({
        day,
        label: `Dia ${day}`,
        confirmadas: confirmed,
        pendentes: pending,
      });
    }

    return result;
  }, [reservations, selectedYear, selectedMonth, selectedRoomFilter, selectedShiftFilter]);

  // 4. Confirmed Reservations by Room (Pie/Donut distribution)
  const roomDistributionData = useMemo(() => {
    const roomCounts: Record<string, number> = {};

    currentMonthConfirmedReservations.forEach((r) => {
      const name = r.roomName || 'Outro Espaço';
      roomCounts[name] = (roomCounts[name] || 0) + 1;
    });

    const data = Object.entries(roomCounts).map(([name, count], index) => ({
      name,
      value: count,
      color: ROOM_COLORS[index % ROOM_COLORS.length],
    }));

    return data.sort((a, b) => b.value - a.value);
  }, [currentMonthConfirmedReservations]);

  // Most used room this month
  const topRoom = useMemo(() => {
    if (roomDistributionData.length === 0) return null;
    return roomDistributionData[0];
  }, [roomDistributionData]);

  // Styling theme colors for Recharts tooltips & grids
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1E293B' : '#CBD5E1';

  return (
    <div className="space-y-6">
      {/* Top Banner & Month Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Dashboard de Indicadores & Analytics
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Recharts Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Análise de frequência dos espaços por dia da semana e reservas confirmadas no mês em{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {currentSchool?.name || settings.schoolName}
              </strong>
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              id="dashboard-prev-month-btn"
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {MONTH_NAMES[selectedMonth]} de {selectedYear}
              </span>
            </div>
            <button
              id="dashboard-next-month-btn"
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentMonthSelected && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            >
              Mês Atual
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-bold px-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros do Dashboard:</span>
          </div>

          {/* Filter by Room */}
          <select
            id="dashboard-room-filter"
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todas as Salas ({rooms.length})</option>
            {rooms.map((rm) => (
              <option key={rm.id} value={rm.id}>
                {rm.name}
              </option>
            ))}
          </select>

          {/* Filter by Shift */}
          <select
            id="dashboard-shift-filter"
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos os Turnos</option>
            <option value="MANHÃ">Manhã</option>
            <option value="TARDE">Tarde</option>
            <option value="NOITE">Noite</option>
            <option value="INTEGRAL">Integral</option>
          </select>
        </div>

        {/* Reset filters if any applied */}
        {(selectedRoomFilter !== 'ALL' || selectedShiftFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedRoomFilter('ALL');
              setSelectedShiftFilter('ALL');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Confirmadas no Mês Atual */}
        <div
          onClick={() => onNavigateToBookings && onNavigateToBookings('CONFIRMED')}
          className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Confirmadas no Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {currentMonthConfirmedReservations.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              aulas aprovadas
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Taxa de aprovação:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
              {confirmationRate}%
            </strong>
          </div>
        </div>

        {/* Card 2: Estudantes Impactados */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estudantes no Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalStudentsServed}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              alunos em aulas práticas
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Média por aula:</span>
            <strong className="text-slate-700 dark:text-slate-300">
              {currentMonthConfirmedReservations.length > 0
                ? Math.round(totalStudentsServed / currentMonthConfirmedReservations.length)
                : 0}{' '}
              alunos
            </strong>
          </div>
        </div>

        {/* Card 3: Dia com Maior Frequência */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dia de Maior Demanda
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 truncate">
              {peakWeekday.name}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Pico no mês:</span>
            <strong className="text-purple-600 dark:text-purple-400 font-bold">
              {peakWeekday.total} agendamentos
            </strong>
          </div>
        </div>

        {/* Card 4: Sala Líder do Mês */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Espaço Mais Ocupado
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {topRoom ? topRoom.name : 'Sem registros'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Total no mês:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {topRoom ? `${topRoom.value} reservas` : '0'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Frequência de Uso das Salas por Dia da Semana (2 Columns on Large Screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Frequência de Uso por Dia da Semana
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição de reservas confirmadas de Segunda a Sábado em{' '}
                {MONTH_NAMES[selectedMonth]}/{selectedYear}
              </p>
            </div>

            {/* Toggle: Stacked vs Total */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setWeekdayChartMode('STACKED')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  weekdayChartMode === 'STACKED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Por Espaço
              </button>
              <button
                type="button"
                onClick={() => setWeekdayChartMode('TOTAL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  weekdayChartMode === 'TOTAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Total do Dia
              </button>
            </div>
          </div>

          {/* Recharts BarChart */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekdayUsageData}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    fontSize: '12px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                />
                {weekdayChartMode === 'STACKED' && rooms.length <= 10 && (
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                )}

                {weekdayChartMode === 'TOTAL' ? (
                  <Bar
                    dataKey="total"
                    name="Total de Aulas"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                  />
                ) : (
                  rooms.map((room, idx) => (
                    <Bar
                      key={room.id}
                      dataKey={room.name}
                      stackId="a"
                      fill={ROOM_COLORS[idx % ROOM_COLORS.length]}
                      radius={idx === rooms.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekday Summary badges */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            {weekdayUsageData.map((d) => (
              <div
                key={d.name}
                className={`p-2 rounded-xl border ${
                  d.name === peakWeekday.name && peakWeekday.total > 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                }`}
              >
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {d.name.slice(0, 3)}
                </p>
                <p
                  className={`text-sm font-black mt-0.5 ${
                    d.name === peakWeekday.name && peakWeekday.total > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {d.total}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: Distribuição por Espaço no Mês (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Ocupação por Espaço
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proporção de reservas confirmadas no mês
            </p>
          </div>

          {roomDistributionData.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold">Nenhuma reserva confirmada</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Neste mês ainda não constam agendamentos aprovados com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="w-full h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roomDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentMonthConfirmedReservations.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Aulas</span>
              </div>
            </div>
          )}

          {/* Room Legend List */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-3">
            {roomDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0">
                  {item.value} ({Math.round((item.value / currentMonthConfirmedReservations.length) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART 3: Total e Evolução Diária no Mês Selecionado (AreaChart) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Evolução Diária das Reservas no Mês ({MONTH_NAMES[selectedMonth]}/{selectedYear})
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Volume de agendamentos confirmados e pendentes ao longo de cada dia do mês
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">Confirmadas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-400"></span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">Pendentes</span>
            </div>
          </div>
        </div>

        {/* Recharts AreaChart */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyProgressionData}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorConfirmadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="day"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                tickFormatter={(val) => `${val}`}
              />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                  fontSize: '12px',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                }}
                labelFormatter={(label) => `Dia ${label} de ${MONTH_NAMES[selectedMonth]}`}
              />
              <Area
                type="monotone"
                dataKey="confirmadas"
                name="Aulas Confirmadas"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorConfirmadas)"
              />
              <Area
                type="monotone"
                dataKey="pendentes"
                name="Aguardando Aprovação"
                stroke="#FBBF24"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPendentes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
