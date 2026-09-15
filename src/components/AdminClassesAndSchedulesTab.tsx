import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Search,
  RotateCcw,
  Check,
  AlertCircle,
  School,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  Zap,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { ShiftType, TimePeriod } from '../types';
import { SCHOOL_CLASSES, TIME_PERIODS } from '../data/initialData';

export const AdminClassesAndSchedulesTab: React.FC<{
  onShowToast?: (msg: string) => void;
}> = ({ onShowToast }) => {
  const {
    classes,
    addClass,
    removeClass,
    updateClass,
    resetClasses,
    periods,
    addPeriod,
    updatePeriod,
    deletePeriod,
    resetPeriods,
    currentSchool,
    settings,
  } = useReservations();

  // Active view: 'CLASSES' | 'SCHEDULES'
  const [subTab, setSubTab] = useState<'CLASSES' | 'SCHEDULES'>('CLASSES');

  // --- TURMAS STATE ---
  const [classSearch, setClassSearch] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassNameVal, setEditClassNameVal] = useState<string>('');
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<string | null>(null);
  const [confirmResetClasses, setConfirmResetClasses] = useState<boolean>(false);

  // --- HORÁRIOS STATE ---
  const [selectedShift, setSelectedShift] = useState<ShiftType>('MANHA');
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<TimePeriod | null>(null);
  const [confirmDeletePeriod, setConfirmDeletePeriod] = useState<TimePeriod | null>(null);
  const [confirmResetPeriods, setConfirmResetPeriods] = useState<boolean>(false);

  // Form for New Period
  const [periodFormShift, setPeriodFormShift] = useState<ShiftType>('MANHA');
  const [periodFormNumber, setPeriodFormNumber] = useState<number>(7);
  const [periodFormName, setPeriodFormName] = useState<string>('7ª Aula');
  const [periodFormStart, setPeriodFormStart] = useState<string>('12:20');
  const [periodFormEnd, setPeriodFormEnd] = useState<string>('13:10');

  // Form for Edit Period
  const [editPeriodNumber, setEditPeriodNumber] = useState<number>(1);
  const [editPeriodName, setEditPeriodName] = useState<string>('');
  const [editPeriodStart, setEditPeriodStart] = useState<string>('');
  const [editPeriodEnd, setEditPeriodEnd] = useState<string>('');

  // Default classes set for quick check
  const defaultClassesSet = useMemo(() => new Set(SCHOOL_CLASSES), []);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    let result = classes;

    // Segment Filter
    if (selectedSegment === 'FUNDAMENTAL') {
      result = result.filter((c) => c.includes('Fundamental') || c.includes('º Ano '));
    } else if (selectedSegment === 'MEDIO') {
      result = result.filter((c) => c.includes('E.M.') || c.includes('EMTI') || c.includes('Médio'));
    } else if (selectedSegment === 'EJA') {
      result = result.filter((c) => c.includes('EJA'));
    } else if (selectedSegment === 'TECNICO') {
      result = result.filter((c) => c.includes('Técnico') || c.includes('Itinerário') || c.includes('Robótica'));
    } else if (selectedSegment === 'CUSTOM') {
      result = result.filter((c) => !defaultClassesSet.has(c));
    }

    // Search query
    if (classSearch.trim()) {
      const q = classSearch.toLowerCase().trim();
      result = result.filter((c) => c.toLowerCase().includes(q));
    }

    return result;
  }, [classes, selectedSegment, classSearch, defaultClassesSet]);

  // Periods for current selected shift
  const shiftPeriods = useMemo(() => {
    return periods
      .filter((p) => p.shift === selectedShift)
      .sort((a, b) => a.number - b.number || a.startTime.localeCompare(b.startTime));
  }, [periods, selectedShift]);

  // Calculate period duration in minutes
  const getDurationMinutes = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return eh * 60 + em - (sh * 60 + sm);
    } catch {
      return 50;
    }
  };

  // Shift badge configurations
  const shiftConfigs = {
    MANHA: { label: 'Manhã', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    TARDE: { label: 'Tarde', icon: Sunset, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    NOITE: { label: 'Noite', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    INTEGRAL: { label: 'Tempo Integral', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  };

  // Handlers for Turmas
  const handleSaveNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      alert('Esta turma já está cadastrada na escola.');
      return;
    }
    addClass(trimmed);
    setNewClassName('');
    setIsAddClassModalOpen(false);
    onShowToast?.(`Turma "${trimmed}" cadastrada com sucesso!`);
  };

  const handleStartEditClass = (c: string) => {
    setEditingClass(c);
    setEditClassNameVal(c);
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    const trimmed = editClassNameVal.trim();
    if (!trimmed) return;
    updateClass(editingClass, trimmed);
    setEditingClass(null);
    onShowToast?.(`Turma atualizada para "${trimmed}" com sucesso!`);
  };

  const handleDeleteClass = (c: string) => {
    removeClass(c);
    setConfirmDeleteClass(null);
    onShowToast?.(`Turma "${c}" removida.`);
  };

  const handleResetClasses = () => {
    resetClasses();
    setConfirmResetClasses(false);
    onShowToast?.('Lista de turmas restaurada para o catálogo padrão.');
  };

  // Handlers for Horários
  const handleOpenAddPeriod = () => {
    const currentShiftPeriods = periods.filter((p) => p.shift === selectedShift);
    const nextNumber = currentShiftPeriods.length > 0 ? Math.max(...currentShiftPeriods.map((p) => p.number)) + 1 : 1;
    setPeriodFormShift(selectedShift);
    setPeriodFormNumber(nextNumber);
    setPeriodFormName(`${nextNumber}ª Aula`);

    // Suggest start time based on previous period
    if (currentShiftPeriods.length > 0) {
      const last = currentShiftPeriods[currentShiftPeriods.length - 1];
      setPeriodFormStart(last.endTime);
      // add 50 mins
      const [h, m] = last.endTime.split(':').map(Number);
      const totalM = h * 60 + m + 50;
      const eh = String(Math.floor(totalM / 60) % 24).padStart(2, '0');
      const em = String(totalM % 60).padStart(2, '0');
      setPeriodFormEnd(`${eh}:${em}`);
    } else {
      setPeriodFormStart(selectedShift === 'MANHA' ? '07:00' : selectedShift === 'TARDE' ? '13:00' : selectedShift === 'NOITE' ? '19:00' : '07:30');
      setPeriodFormEnd(selectedShift === 'MANHA' ? '07:50' : selectedShift === 'TARDE' ? '13:50' : selectedShift === 'NOITE' ? '19:45' : '08:20');
    }
    setIsAddPeriodModalOpen(true);
  };

  const handleSaveNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodFormStart || !periodFormEnd || !periodFormName.trim()) return;

    addPeriod({
      shift: periodFormShift,
      number: Number(periodFormNumber),
      name: periodFormName.trim(),
      startTime: periodFormStart,
      endTime: periodFormEnd,
    });

    setIsAddPeriodModalOpen(false);
    onShowToast?.(`Horário "${periodFormName}" adicionado ao turno ${shiftConfigs[periodFormShift].label}!`);
  };

  const handleStartEditPeriod = (p: TimePeriod) => {
    setEditingPeriod(p);
    setEditPeriodNumber(p.number);
    setEditPeriodName(p.name);
    setEditPeriodStart(p.startTime);
    setEditPeriodEnd(p.endTime);
  };

  const handleSaveEditPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;
    updatePeriod({
      ...editingPeriod,
      number: Number(editPeriodNumber),
      name: editPeriodName.trim(),
      startTime: editPeriodStart,
      endTime: editPeriodEnd,
    });
    setEditingPeriod(null);
    onShowToast?.(`Horário atualizado com sucesso!`);
  };

  const handleDeletePeriod = (id: string) => {
    deletePeriod(id);
    setConfirmDeletePeriod(null);
    onShowToast?.('Horário excluído.');
  };

  const handleResetPeriods = () => {
    resetPeriods();
    setConfirmResetPeriods(false);
    onShowToast?.('Grade de horários restaurada para o padrão da rede.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & School Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Gestão de Turmas e Horários
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Mantém Padrões
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Configure e cadastre novas turmas escolares e os horários das aulas por turno. Todos os registros existentes foram preservados e podem ser personalizados conforme a rotina da escola.
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
              {classes.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Turmas
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
              {periods.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Horários
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab switcher: TURMAS vs HORÁRIOS */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-fit gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('CLASSES')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'CLASSES'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Turmas Escolares ({classes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('SCHEDULES')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'SCHEDULES'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários & Aulas ({periods.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: GESTÃO DE TURMAS */}
      {subTab === 'CLASSES' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Buscar turma (ex.: 9º Ano, 3º E.M., Robótica...)"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {classSearch && (
                <button
                  type="button"
                  onClick={() => setClassSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetClasses(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center space-x-1.5"
                title="Restaura a lista com todas as turmas padrão originais"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewClassName('');
                  setIsAddClassModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar Nova Turma</span>
              </button>
            </div>
          </div>

          {/* Segment Filter Chips */}
          <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'Todas as Turmas', count: classes.length },
              {
                id: 'FUNDAMENTAL',
                label: 'Ensino Fundamental II',
                count: classes.filter((c) => c.includes('Fundamental') || c.includes('º Ano ')).length,
              },
              {
                id: 'MEDIO',
                label: 'Ensino Médio & EMTI',
                count: classes.filter((c) => c.includes('E.M.') || c.includes('EMTI') || c.includes('Médio')).length,
              },
              {
                id: 'EJA',
                label: 'EJA & Noturno',
                count: classes.filter((c) => c.includes('EJA')).length,
              },
              {
                id: 'TECNICO',
                label: 'Técnicos & Projetos',
                count: classes.filter((c) => c.includes('Técnico') || c.includes('Itinerário') || c.includes('Robótica')).length,
              },
              {
                id: 'CUSTOM',
                label: 'Novas / Customizadas',
                count: classes.filter((c) => !defaultClassesSet.has(c)).length,
              },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedSegment(chip.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  selectedSegment === chip.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedSegment === chip.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredClasses.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                <GraduationCap className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma turma encontrada com os filtros atuais.
                </p>
                <p className="text-xs text-slate-400">
                  Cadastre uma nova turma ou ajuste a busca acima.
                </p>
              </div>
            ) : (
              filteredClasses.map((className) => {
                const isCustom = !defaultClassesSet.has(className);
                return (
                  <div
                    key={className}
                    className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                        {className.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {className}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          {isCustom ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Personalizada
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-400">
                              Catálogo Padrão
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditClass(className)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Renomear turma"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteClass(className)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remover turma"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: GESTÃO DE HORÁRIOS */}
      {subTab === 'SCHEDULES' && (
        <div className="space-y-4">
          {/* Shift Selector & Actions */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Shift Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1 overflow-x-auto no-scrollbar">
              {(['MANHA', 'TARDE', 'NOITE', 'INTEGRAL'] as ShiftType[]).map((sh) => {
                const conf = shiftConfigs[sh];
                const Icon = conf.icon;
                const count = periods.filter((p) => p.shift === sh).length;
                const isActive = selectedShift === sh;

                return (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                    <span>{conf.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                          : 'bg-slate-200/60 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetPeriods(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center space-x-1.5"
                title="Restaura os horários para a grade oficial padrão"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Restaurar Grade Padrão</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddPeriod}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar Horário / Aula</span>
              </button>
            </div>
          </div>

          {/* Shift Overview Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Aulas cadastradas para o Turno da {shiftConfigs[selectedShift].label}:
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {shiftPeriods.length} horários
              </span>
            </div>
            {shiftPeriods.length > 0 && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Faixa horária: {shiftPeriods[0].startTime} às {shiftPeriods[shiftPeriods.length - 1].endTime}
              </span>
            )}
          </div>

          {/* Periods Timeline List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shiftPeriods.map((period, idx) => {
              const duration = getDurationMinutes(period.startTime, period.endTime);
              return (
                <div
                  key={period.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                      <span>{period.number}ª</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">Aula</span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {period.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {duration} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {period.startTime} às {period.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEditPeriod(period)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Editar horário de início e fim"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePeriod(period)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir este horário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVA TURMA */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Cadastrar Nova Turma
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    A turma ficará disponível em reservas e relatórios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveNewClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex.: 9º Ano F, 3º EMTI Robótica, 1º TI..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '6º Ano F',
                    '7º Ano F',
                    '8º Ano F',
                    '9º Ano F',
                    '1º Ano E.M. E',
                    '2º Ano E.M. E',
                    '3º Ano E.M. E',
                    '1º EMTI TI',
                    'Clube Maker',
                    'Reforço Matemática',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewClassName(sug)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
                >
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NOME DA TURMA */}
      {editingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Renomear Turma
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Novo Nome
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editClassNameVal}
                  onChange={(e) => setEditClassNameVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
                >
                  Atualizar Nome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TURMA */}
      {confirmDeleteClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Remover Turma
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja realmente remover a turma <strong>"{confirmDeleteClass}"</strong> do catálogo?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClass(confirmDeleteClass)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-xs transition-all"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET TURMAS */}
      {confirmResetClasses && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Restaurar Turmas Padrão
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Isso recarregará o catálogo oficial com todas as turmas padrão do Ensino Fundamental, Ensino Médio, EJA e Técnicos. Deseja continuar?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmResetClasses(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetClasses}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
              >
                Restaurar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVO HORÁRIO */}
      {isAddPeriodModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Cadastrar Novo Horário / Aula
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Disponível na grade e na seleção de reservas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveNewPeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Turno
                  </label>
                  <select
                    value={periodFormShift}
                    onChange={(e) => setPeriodFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                    <option value="INTEGRAL">Tempo Integral</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Número de Ordem
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={periodFormNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setPeriodFormNumber(num);
                      setPeriodFormName(`${num}ª Aula`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Horário / Identificação
                </label>
                <input
                  type="text"
                  required
                  value={periodFormName}
                  onChange={(e) => setPeriodFormName(e.target.value)}
                  placeholder="Ex: 7ª Aula, Acolhimento, Horário de Almoço..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    required
                    value={periodFormStart}
                    onChange={(e) => setPeriodFormStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    required
                    value={periodFormEnd}
                    onChange={(e) => setPeriodFormEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
                >
                  Salvar Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR HORÁRIO */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Editar Horário ({editingPeriod.shift})
              </h3>
              <button
                type="button"
                onClick={() => setEditingPeriod(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditPeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Número da Aula
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={editPeriodNumber}
                    onChange={(e) => setEditPeriodNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome da Aula
                  </label>
                  <input
                    type="text"
                    required
                    value={editPeriodName}
                    onChange={(e) => setEditPeriodName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    required
                    value={editPeriodStart}
                    onChange={(e) => setEditPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    required
                    value={editPeriodEnd}
                    onChange={(e) => setEditPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PERIOD */}
      {confirmDeletePeriod && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Excluir Horário
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja remover a <strong>"{confirmDeletePeriod.name}"</strong> ({confirmDeletePeriod.startTime} - {confirmDeletePeriod.endTime}) do turno {shiftConfigs[confirmDeletePeriod.shift].label}?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeletePeriod(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePeriod(confirmDeletePeriod.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-xs transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET PERIODS */}
      {confirmResetPeriods && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Restaurar Grade de Horários
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Isso restaurará todos os horários oficiais padrão da rede para os turnos Manhã, Tarde, Noite e Integral. Deseja continuar?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmResetPeriods(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetPeriods}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all"
              >
                Restaurar Horários
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
