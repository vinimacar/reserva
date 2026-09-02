import React, { useState } from 'react';
import {
  Calendar,
  CalendarRange,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatDateBR, formatLocalDateToISO, getRelativeDays, addDaysToISO } from '../lib/dateUtils';

export type BookingType = 'SINGLE' | 'DATE_RANGE' | 'RECURRING';

interface PeriodBookingSelectorProps {
  bookingType: BookingType;
  setBookingType: (type: BookingType) => void;
  singleDate: string;
  setSingleDate: (date: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  weekdaysOnly: boolean;
  setWeekdaysOnly: (val: boolean) => void;
  recurringDaysOfWeek: number[];
  setRecurringDaysOfWeek: (days: number[]) => void;
  recurringDurationType: 'WEEKS' | 'UNTIL_DATE';
  setRecurringDurationType: (type: 'WEEKS' | 'UNTIL_DATE') => void;
  recurringWeeksCount: number;
  setRecurringWeeksCount: (weeks: number) => void;
  recurringEndDate: string;
  setRecurringEndDate: (date: string) => void;
  targetDates: string[];
  conflictingDates: Array<{ date: string; message: string }>;
  skipConflictDates: boolean;
  setSkipConflictDates: (val: boolean) => void;
}

const WEEKDAYS = [
  { day: 1, label: 'Seg', full: 'Segunda-feira' },
  { day: 2, label: 'Ter', full: 'Terça-feira' },
  { day: 3, label: 'Qua', full: 'Quarta-feira' },
  { day: 4, label: 'Qui', full: 'Quinta-feira' },
  { day: 5, label: 'Sex', full: 'Sexta-feira' },
  { day: 6, label: 'Sáb', full: 'Sábado' },
];

export const PeriodBookingSelector: React.FC<PeriodBookingSelectorProps> = ({
  bookingType,
  setBookingType,
  singleDate,
  setSingleDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  weekdaysOnly,
  setWeekdaysOnly,
  recurringDaysOfWeek,
  setRecurringDaysOfWeek,
  recurringDurationType,
  setRecurringDurationType,
  recurringWeeksCount,
  setRecurringWeeksCount,
  recurringEndDate,
  setRecurringEndDate,
  targetDates,
  conflictingDates,
  skipConflictDates,
  setSkipConflictDates,
}) => {
  const [showConflictsDetail, setShowConflictsDetail] = useState(false);
  const [showDatesList, setShowDatesList] = useState(false);

  const toggleDayOfWeek = (day: number) => {
    setRecurringDaysOfWeek(
      recurringDaysOfWeek.includes(day)
        ? recurringDaysOfWeek.length > 1
          ? recurringDaysOfWeek.filter((d) => d !== day)
          : recurringDaysOfWeek
        : [...recurringDaysOfWeek, day].sort((a, b) => a - b)
    );
  };

  const hasConflicts = conflictingDates.length > 0;
  const availableCount = targetDates.length - conflictingDates.length;

  return (
    <div className="space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
      {/* 1. Header & Booking Type Toggle Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>2. Modo e Período do Agendamento:</span>
          </label>
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-2 py-0.5 rounded-full">
            {targetDates.length} {targetDates.length === 1 ? 'dia' : 'dias no total'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-850 rounded-xl">
          <button
            type="button"
            onClick={() => setBookingType('SINGLE')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookingType === 'SINGLE'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dia Único</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBookingType('DATE_RANGE');
              if (startDate > endDate) {
                setEndDate(addDaysToISO(startDate, 7));
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookingType === 'DATE_RANGE'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Intervalo / Período</span>
          </button>

          <button
            type="button"
            onClick={() => setBookingType('RECURRING')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookingType === 'RECURRING'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Recorrência</span>
          </button>
        </div>
      </div>

      {/* 2. MODE: SINGLE DAY */}
      {bookingType === 'SINGLE' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <input
            type="date"
            value={singleDate}
            onChange={(e) => {
              setSingleDate(e.target.value);
              setStartDate(e.target.value);
            }}
            min={formatLocalDateToISO()}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setSingleDate(getRelativeDays(0))}
              className="px-2 py-0.8 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setSingleDate(getRelativeDays(1))}
              className="px-2 py-0.8 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Amanhã
            </button>
            <button
              type="button"
              onClick={() => setSingleDate(getRelativeDays(2))}
              className="px-2 py-0.8 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Em 2 dias
            </button>
          </div>
        </div>
      )}

      {/* 3. MODE: DATE RANGE / CONTINUOUS PERIOD */}
      {bookingType === 'DATE_RANGE' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Data Inicial (Início do Período):
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(addDaysToISO(e.target.value, 5));
                  }
                }}
                min={formatLocalDateToISO()}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Data Final (Término do Período):
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={weekdaysOnly}
                onChange={(e) => setWeekdaysOnly(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span>Apenas dias letivos (Segunda a Sexta)</span>
            </label>

            {/* Quick Period Presets */}
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="text-slate-500 dark:text-slate-400">Atalhos:</span>
              <button
                type="button"
                onClick={() => setEndDate(addDaysToISO(startDate, 5))}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md font-bold cursor-pointer"
              >
                1 Semana
              </button>
              <button
                type="button"
                onClick={() => setEndDate(addDaysToISO(startDate, 14))}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md font-bold cursor-pointer"
              >
                2 Semanas
              </button>
              <button
                type="button"
                onClick={() => setEndDate(addDaysToISO(startDate, 30))}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md font-bold cursor-pointer"
              >
                1 Mês
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODE: RECURRING WEEKLY */}
      {bookingType === 'RECURRING' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Dias da semana que a aula se repete:
            </span>
            <div className="grid grid-cols-6 gap-1">
              {WEEKDAYS.map(({ day, label }) => {
                const isSelected = recurringDaysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDayOfWeek(day)}
                    className={`py-1.5 px-1 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                A partir de qual data:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={formatLocalDateToISO()}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Duração da Recorrência:
              </span>
              <div className="flex gap-1.5">
                {[
                  { weeks: 2, label: '2 sem' },
                  { weeks: 4, label: '4 sem (1 mês)' },
                  { weeks: 8, label: '8 sem (Bimestre)' },
                ].map(({ weeks, label }) => (
                  <button
                    key={weeks}
                    type="button"
                    onClick={() => {
                      setRecurringDurationType('WEEKS');
                      setRecurringWeeksCount(weeks);
                    }}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                      recurringDurationType === 'WEEKS' && recurringWeeksCount === weeks
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Target Dates & Conflict Summary (for Period or Recurring) */}
      {bookingType !== 'SINGLE' && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
          {/* Conflict status banner */}
          {!hasConflicts ? (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  Todas as {targetDates.length} datas estão 100% livres e prontas para agendar!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDatesList(!showDatesList)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 underline hover:no-underline flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>{showDatesList ? 'Ocultar datas' : 'Ver datas'}</span>
                {showDatesList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {conflictingDates.length} de {targetDates.length} datas possuem conflito de horário.
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      {availableCount > 0
                        ? `${availableCount} datas livres podem ser reservadas.`
                        : 'Todas as datas do período estão ocupadas por outros professores.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConflictsDetail(!showConflictsDetail)}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  <span>{showConflictsDetail ? 'Ocultar' : 'Ver detalhes'}</span>
                  {showConflictsDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Conflict details list */}
              {showConflictsDetail && (
                <div className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-amber-200 dark:border-amber-900/50 space-y-1 text-[11px]">
                  {conflictingDates.map((c) => (
                    <div key={c.date} className="flex items-start justify-between text-amber-900 dark:text-amber-200">
                      <span className="font-bold">{formatDateBR(c.date, false)}:</span>
                      <span className="text-right text-slate-600 dark:text-slate-400">{c.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Skip option */}
              {availableCount > 0 && (
                <label className="flex items-center space-x-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200 cursor-pointer pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                  <input
                    type="checkbox"
                    checked={skipConflictDates}
                    onChange={(e) => setSkipConflictDates(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Agendar apenas as {availableCount} datas livres (ignorar conflitos)</span>
                </label>
              )}
            </div>
          )}

          {/* Interactive Date Pills Preview */}
          {showDatesList && (
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {targetDates.map((d) => {
                const isConflicted = conflictingDates.some((c) => c.date === d);
                return (
                  <span
                    key={d}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isConflicted
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 line-through'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {formatDateBR(d, false)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
