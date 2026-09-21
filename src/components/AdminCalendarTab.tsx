import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  RotateCcw,
  Save,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Palmtree,
  Check,
  X,
  Clock,
  ShieldCheck,
  Sliders,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  HardDrive,
  CalendarClock,
  Maximize2,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import {
  AcademicCalendarConfig,
  AcademicPeriodType,
  AcademicTerm,
  CalendarDayType,
  CalendarSpecialDay,
} from '../types';
import {
  createDefaultAcademicCalendar,
  calculateTermSchoolDays,
  calculateTotalCalendarSchoolDays,
  matchesSpecialDay,
} from '../data/defaultAcademicCalendar';
import { formatDateBR, formatLocalDateToISO } from '../lib/dateUtils';
import {
  saveCalendarPdf,
  loadCalendarPdf,
  deleteCalendarPdf,
  downloadCalendarPdf,
  openCalendarPdfInNewTab,
  formatPdfFileSize,
} from '../lib/pdfStorage';
import { CalendarPdfViewerModal } from './CalendarPdfViewerModal';

interface AdminCalendarTabProps {
  onShowToast?: (msg: string) => void;
}

const WEEKDAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES_PT = [
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

export const AdminCalendarTab: React.FC<AdminCalendarTabProps> = ({ onShowToast }) => {
  const {
    academicCalendar,
    updateAcademicCalendar,
    resetAcademicCalendarToDefault,
    currentSchool,
    currentSchoolId,
  } = useReservations();

  // Local draft state of the calendar so coordinator can edit and save
  const [calendarDraft, setCalendarDraft] = useState<AcademicCalendarConfig>(() => {
    return academicCalendar || createDefaultAcademicCalendar(2026, 'TRIMESTRE');
  });

  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'TERMS' | 'HOLIDAYS' | 'SATURDAYS' | 'SETTINGS' | 'PDF'>('OVERVIEW');
  const [currentMonthView, setCurrentMonthView] = useState<number>(new Date().getMonth()); // 0 - 11
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // PDF Document upload & viewer state
  const [storedPdfUrl, setStoredPdfUrl] = useState<string | null>(calendarDraft.pdfUrl || null);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState<boolean>(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Year definition state
  const [isYearModalOpen, setIsYearModalOpen] = useState<boolean>(false);
  const [yearInputVal, setYearInputVal] = useState<number>(calendarDraft.year || 2026);

  // Modal for adding / editing a special day
  const [editingSpecialDay, setEditingSpecialDay] = useState<Partial<CalendarSpecialDay> | null>(null);
  const [isSpecialDayModalOpen, setIsSpecialDayModalOpen] = useState<boolean>(false);

  // Modal for editing an academic term
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);

  // Keep draft in sync if active school changes externally
  useEffect(() => {
    if (academicCalendar) {
      setCalendarDraft(academicCalendar);
      setYearInputVal(academicCalendar.year || 2026);
    }
  }, [academicCalendar, currentSchoolId]);

  // Load PDF from IndexedDB / cache whenever school or pdf metadata changes
  useEffect(() => {
    let isMounted = true;
    loadCalendarPdf(currentSchoolId, calendarDraft.pdfUrl).then((url) => {
      if (isMounted && url) {
        setStoredPdfUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentSchoolId, calendarDraft.pdfFileName, calendarDraft.pdfUrl]);

  // Handle PDF Upload via file input or drag-and-drop
  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      if (onShowToast) onShowToast('Erro: O arquivo selecionado deve ser um documento PDF (.pdf).');
      return;
    }

    try {
      setIsUploadingPdf(true);
      const res = await saveCalendarPdf(currentSchoolId, file);
      setStoredPdfUrl(res.dataUrl);

      const updatedDraft: AcademicCalendarConfig = {
        ...calendarDraft,
        pdfFileName: res.fileName,
        pdfFileSize: res.fileSize,
        pdfUploadedAt: res.uploadedAt,
        // Armazena no config apenas se for menor que 400KB para respeitar limites do Firestore
        pdfUrl: res.fileSize <= 400 * 1024 ? res.dataUrl : undefined,
      };

      setCalendarDraft(updatedDraft);
      updateAcademicCalendar(updatedDraft, currentSchoolId);
      if (onShowToast) {
        onShowToast(`Calendário em PDF "${res.fileName}" salvo com sucesso!`);
      }
    } catch (err: any) {
      console.error('Erro ao enviar PDF:', err);
      if (onShowToast) {
        onShowToast(err?.message || 'Falha ao processar o arquivo PDF.');
      }
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Handle Remove PDF
  const handleRemovePdf = async () => {
    if (!window.confirm('Deseja realmente excluir o documento PDF do calendário letivo desta unidade escolar?')) {
      return;
    }

    try {
      await deleteCalendarPdf(currentSchoolId);
      setStoredPdfUrl(null);

      const updatedDraft: AcademicCalendarConfig = {
        ...calendarDraft,
        pdfFileName: undefined,
        pdfFileSize: undefined,
        pdfUploadedAt: undefined,
        pdfUrl: undefined,
      };

      setCalendarDraft(updatedDraft);
      updateAcademicCalendar(updatedDraft, currentSchoolId);
      if (onShowToast) {
        onShowToast('Documento PDF removido.');
      }
    } catch (err) {
      console.error('Erro ao remover PDF:', err);
    }
  };

  // Handle Define / Change School Year
  const handleYearChange = (newYear: number, applyOfficialTemplate: boolean = true) => {
    if (isNaN(newYear) || newYear < 2020 || newYear > 2040) {
      if (onShowToast) onShowToast('Por favor, informe um ano válido entre 2020 e 2040.');
      return;
    }

    if (applyOfficialTemplate) {
      const template = createDefaultAcademicCalendar(newYear, calendarDraft.periodType || 'TRIMESTRE');
      const updated: AcademicCalendarConfig = {
        ...template,
        warnOnHolidayBooking: calendarDraft.warnOnHolidayBooking,
        blockBookingOnHolidays: calendarDraft.blockBookingOnHolidays,
        totalSchoolDaysGoal: calendarDraft.totalSchoolDaysGoal || 200,
        pdfUrl: calendarDraft.pdfUrl,
        pdfFileName: calendarDraft.pdfFileName,
        pdfFileSize: calendarDraft.pdfFileSize,
        pdfUploadedAt: calendarDraft.pdfUploadedAt,
      };
      setCalendarDraft(updated);
      updateAcademicCalendar(updated, currentSchoolId);
      if (onShowToast) {
        onShowToast(`Ano letivo alterado para ${newYear} com a matriz oficial de 200 dias aplicada!`);
      }
    } else {
      // Renomeia apenas o ano mantendo eventos
      const oldYearStr = String(calendarDraft.year || 2026);
      const newYearStr = String(newYear);
      const updated: AcademicCalendarConfig = {
        ...calendarDraft,
        year: newYear,
        schoolYearStart: calendarDraft.schoolYearStart.replace(new RegExp(`^${oldYearStr}`), newYearStr),
        schoolYearEnd: calendarDraft.schoolYearEnd.replace(new RegExp(`^${oldYearStr}`), newYearStr),
        terms: calendarDraft.terms.map((t) => ({
          ...t,
          startDate: t.startDate.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          endDate: t.endDate.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          classCouncilStart: t.classCouncilStart?.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          classCouncilEnd: t.classCouncilEnd?.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          parentMeetingStart: t.parentMeetingStart?.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          parentMeetingEnd: t.parentMeetingEnd?.replace(new RegExp(`^${oldYearStr}`), newYearStr),
        })),
        specialDays: calendarDraft.specialDays.map((d) => ({
          ...d,
          date: d.date.replace(new RegExp(`^${oldYearStr}`), newYearStr),
          endDate: d.endDate?.replace(new RegExp(`^${oldYearStr}`), newYearStr),
        })),
      };
      setCalendarDraft(updated);
      updateAcademicCalendar(updated, currentSchoolId);
      if (onShowToast) {
        onShowToast(`Ano letivo alterado para ${newYear}.`);
      }
    }
    setIsYearModalOpen(false);
  };

  // Total school days calculated
  const totalSchoolDays = useMemo(() => {
    return calculateTotalCalendarSchoolDays(calendarDraft);
  }, [calendarDraft]);

  const targetGoal = calendarDraft.totalSchoolDaysGoal || 200;
  const isLdbCompliant = totalSchoolDays >= targetGoal;

  // Handle Save
  const handleSaveChanges = () => {
    updateAcademicCalendar(calendarDraft, currentSchoolId);
    setSaveSuccess(true);
    if (onShowToast) {
      onShowToast('Calendário Letivo salvo com sucesso!');
    }
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  // Handle Reset to Default Template
  const handleResetToOfficialTemplate = (periodType: AcademicPeriodType = 'TRIMESTRE') => {
    const yearToUse = calendarDraft.year || 2026;
    const newCal = createDefaultAcademicCalendar(yearToUse, periodType);
    setCalendarDraft(newCal);
    updateAcademicCalendar(newCal, currentSchoolId);
    setIsResetConfirmOpen(false);
    if (onShowToast) {
      const typeLabel = periodType === 'TRIMESTRE' ? '3 Trimestres (SEE-MG Oficial)' : periodType === 'BIMESTRE' ? '4 Bimestres' : '2 Semestres';
      onShowToast(`Calendário redefinido para o Padrão Oficial (${typeLabel})!`);
    }
  };

  // Switch Period Type (Bimestre vs Trimestre vs Semestre)
  const handlePeriodTypeChange = (newType: AcademicPeriodType) => {
    const yearToUse = calendarDraft.year || 2026;
    const newCal = createDefaultAcademicCalendar(yearToUse, newType);
    setCalendarDraft((prev) => ({
      ...prev,
      periodType: newType,
      terms: newCal.terms,
    }));
  };

  // Add or Update Special Day
  const handleSaveSpecialDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialDay || !editingSpecialDay.title || !editingSpecialDay.date) return;

    const newDay: CalendarSpecialDay = {
      id: editingSpecialDay.id || `special-${Date.now()}`,
      date: editingSpecialDay.date,
      endDate: editingSpecialDay.endDate || undefined,
      title: editingSpecialDay.title.trim(),
      type: editingSpecialDay.type || 'FERIADO',
      description: editingSpecialDay.description?.trim() || '',
      equivalentWeekday: editingSpecialDay.equivalentWeekday || undefined,
      allowBooking: editingSpecialDay.allowBooking ?? (editingSpecialDay.type === 'SABADO_LETIVO'),
    };

    setCalendarDraft((prev) => {
      const exists = prev.specialDays.some((d) => d.id === newDay.id);
      const updatedSpecialDays = exists
        ? prev.specialDays.map((d) => (d.id === newDay.id ? newDay : d))
        : [...prev.specialDays, newDay];

      // Sort by date
      updatedSpecialDays.sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...prev,
        specialDays: updatedSpecialDays,
      };
    });

    setIsSpecialDayModalOpen(false);
    setEditingSpecialDay(null);
  };

  // Delete Special Day
  const handleDeleteSpecialDay = (id: string) => {
    setCalendarDraft((prev) => ({
      ...prev,
      specialDays: prev.specialDays.filter((d) => d.id !== id),
    }));
  };

  // Save edited term
  const handleSaveTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;

    setCalendarDraft((prev) => ({
      ...prev,
      terms: prev.terms.map((t) => (t.id === editingTerm.id ? editingTerm : t)),
    }));
    setEditingTerm(null);
  };

  // Month Calendar Matrix Generation
  const calendarMonthData = useMemo(() => {
    const year = calendarDraft.year || 2026;
    const month = currentMonthView;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Preceding blanks
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const isoDate = `${year}-${monthStr}-${dayStr}`;

      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const specialDay = (calendarDraft.specialDays || []).find((s) => matchesSpecialDay(isoDate, s));
      const term = (calendarDraft.terms || []).find((t) => isoDate >= t.startDate && isoDate <= t.endDate);

      const isHoliday = specialDay?.type === 'FERIADO';
      const isRecess = specialDay?.type === 'RECESSO';
      const isSaturdaySchool = specialDay?.type === 'SABADO_LETIVO';
      const isPlanning = specialDay?.type === 'PLANEJAMENTO';
      const isDiaEscolar = specialDay?.type === 'DIA_ESCOLAR';

      days.push({
        dayNumber: d,
        isoDate,
        dayOfWeek,
        isWeekend,
        specialDay,
        term,
        isHoliday,
        isRecess,
        isSaturdaySchool,
        isPlanning,
        isDiaEscolar,
      });
    }

    return days;
  }, [calendarDraft, currentMonthView]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Calendário Letivo & Planejamento Escolar
              </h3>
              <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <CalendarClock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Ano:</span>
                <select
                  value={calendarDraft.year}
                  onChange={(e) => {
                    const chosenYear = parseInt(e.target.value, 10);
                    if (chosenYear !== calendarDraft.year) {
                      setYearInputVal(chosenYear);
                      setIsYearModalOpen(true);
                    }
                  }}
                  className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  title="Alterar ano letivo"
                >
                  <option value={2024} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2024</option>
                  <option value={2025} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2025</option>
                  <option value={2026} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2026 (Atual)</option>
                  <option value={2027} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2027</option>
                  <option value={2028} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2028</option>
                  <option value={2029} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2029</option>
                  <option value={2030} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2030</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setYearInputVal(calendarDraft.year);
                    setIsYearModalOpen(true);
                  }}
                  title="Definir outro ano letivo"
                  className="p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-300 dark:border-blue-800">
                {calendarDraft.periodType === 'TRIMESTRE' ? 'Organização Trimestral (SEE-MG)' : calendarDraft.periodType === 'BIMESTRE' ? 'Organização Bimestral' : 'Organização Semestral'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configuração de trimestres, conselhos de classe, reuniões de pais, feriados, recessos, sábados letivos e cumprimento rigoroso dos 200 dias letivos da LDB para {currentSchool?.name || 'sua escola'}.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
          {/* PDF Action in Header */}
          {calendarDraft.pdfFileName ? (
            <button
              type="button"
              onClick={() => setIsPdfViewerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer hover:bg-rose-100 shadow-2xs"
              title={`Visualizar documento PDF oficial (${calendarDraft.pdfFileName})`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Ver PDF ({formatPdfFileSize(calendarDraft.pdfFileSize)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={isUploadingPdf}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Anexar arquivo PDF do Calendário Letivo Oficial"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isUploadingPdf ? 'Enviando...' : 'Upload PDF'}</span>
            </button>
          )}

          {/* Hidden File Input */}
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {calendarDraft.periodType !== 'TRIMESTRE' && (
            <button
              type="button"
              onClick={() => handleResetToOfficialTemplate('TRIMESTRE')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Corrigir para a organização trimestral oficial da SEE-MG"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Corrigir para Trimestral (SEE-MG)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Recarregar calendário padrão com 200 dias e feriados oficiais"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Padrão Oficial (200 Dias)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Calendário</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert banner if year is 2025 */}
      {calendarDraft.year === 2025 && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Atenção: O sistema está exibindo o Ano Letivo 2025 e nós já estamos em 2026!
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Deseja migrar imediatamente para o <strong>Ano Letivo 2026</strong> com a matriz oficial de 3 Trimestres (SEE-MG) e cumprimento de 200 dias letivos?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleYearChange(2026, true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shrink-0 self-start sm:self-auto cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Atualizar para 2026 Agora</span>
          </button>
        </div>
      )}

      {/* Alert banner if currently bimestral or not trimestral */}
      {calendarDraft.periodType !== 'TRIMESTRE' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Atenção: A organização oficial da rede estadual de ensino (SEE-MG) é Trimestral
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                O calendário escolar atualmente está configurado como <strong>{calendarDraft.periodType}</strong>. Deseja aplicar a matriz trimestral com 3 trimestres, conselhos de classe e 200 dias letivos?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleResetToOfficialTemplate('TRIMESTRE')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shrink-0 self-start sm:self-auto cursor-pointer shadow-xs transition-colors"
          >
            Aplicar 3 Trimestres (SEE-MG)
          </button>
        </div>
      )}

      {/* LDB 200 Days Compliance & Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total School Days */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLdbCompliant
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
            : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Dias Letivos Calculados</span>
            <ShieldCheck className={`w-4 h-4 ${isLdbCompliant ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-black">{totalSchoolDays}</span>
            <span className="text-xs font-semibold opacity-70">/ {targetGoal} dias</span>
          </div>
          <div className="mt-2 flex items-center space-x-1 text-[11px]">
            {isLdbCompliant ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conforme com a LDB (Min. 200 dias)
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Abaixo da meta legal ({targetGoal - totalSchoolDays} dias a menos)
              </span>
            )}
          </div>
        </div>

        {/* Structure */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estrutura Letiva</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {calendarDraft.terms.length} {calendarDraft.periodType === 'BIMESTRE' ? 'Bimestres' : calendarDraft.periodType === 'TRIMESTRE' ? 'Trimestres' : 'Semestres'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {calendarDraft.terms[0]?.name} a {calendarDraft.terms[calendarDraft.terms.length - 1]?.name}
          </p>
        </div>

        {/* Holidays & Recesses */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Feriados & Recessos</span>
            <Palmtree className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {calendarDraft.specialDays.filter((d) => d.type === 'FERIADO' || d.type === 'RECESSO').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Feriados nacionais, estaduais e recesso julhino
          </p>
        </div>

        {/* School Saturdays */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sábados Letivos</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {calendarDraft.specialDays.filter((d) => d.type === 'SABADO_LETIVO').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Feiras de ciências, acolhimento e reposições
          </p>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Visão Mensal Interativa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('TERMS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'TERMS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{calendarDraft.periodType === 'TRIMESTRE' ? 'Trimestres' : calendarDraft.periodType === 'BIMESTRE' ? 'Bimestres' : 'Semestres'} & Períodos Letivos ({calendarDraft.terms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('HOLIDAYS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'HOLIDAYS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palmtree className="w-3.5 h-3.5" />
          <span>Feriados, Recessos & Dias Escolares ({calendarDraft.specialDays.filter((d) => d.type === 'FERIADO' || d.type === 'RECESSO' || d.type === 'PLANEJAMENTO' || d.type === 'DIA_ESCOLAR').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SATURDAYS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'SATURDAYS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sábados Letivos ({calendarDraft.specialDays.filter((d) => d.type === 'SABADO_LETIVO').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SETTINGS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Regras & Definição do Ano</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PDF')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'PDF'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documento PDF Oficial</span>
          {calendarDraft.pdfFileName && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
          )}
        </button>
      </div>

      {/* SUBTAB 1: MONTHLY INTERACTIVE CALENDAR */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Quick PDF Notice / Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {calendarDraft.pdfFileName ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {calendarDraft.pdfFileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        PDF Oficial Anual ({calendarDraft.year})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tamanho: {formatPdfFileSize(calendarDraft.pdfFileSize)} • Enviado em: {calendarDraft.pdfUploadedAt ? formatDateBR(calendarDraft.pdfUploadedAt.slice(0, 10)) : 'Recentemente'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPdfViewerOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCalendarPdf(storedPdfUrl, calendarDraft.pdfFileName)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Baixar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openCalendarPdfInNewTab(storedPdfUrl)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer transition-colors"
                    title="Abrir em Nova Aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer transition-colors"
                    title="Substituir Arquivo PDF"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs cursor-pointer transition-colors"
                    title="Excluir PDF"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(true);
                }}
                onDragLeave={() => setIsDraggingPdf(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                onClick={() => pdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                  isDraggingPdf
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Anexar Calendário Escolar Oficial em Arquivo PDF ({calendarDraft.year})
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Arraste e solte o arquivo PDF aqui ou clique para selecionar (documentos oficiais da SEE-MG / SRE).
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors shadow-xs">
                    {isUploadingPdf ? 'Processando...' : 'Fazer Upload do PDF'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Month Switcher Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentMonthView((prev) => (prev > 0 ? prev - 1 : 11))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="text-base font-bold text-slate-900 dark:text-white min-w-[160px] text-center">
                {MONTH_NAMES_PT[currentMonthView]} de {calendarDraft.year}
              </h4>
              <button
                type="button"
                onClick={() => setCurrentMonthView((prev) => (prev < 11 ? prev + 1 : 0))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Legend */}
            <div className="hidden sm:flex items-center space-x-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Feriado</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Recesso</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                <span>Planejamento</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Sábado Letivo</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSpecialDay({
                  date: `${calendarDraft.year}-${String(currentMonthView + 1).padStart(2, '0')}-01`,
                  type: 'FERIADO',
                  title: '',
                });
                setIsSpecialDayModalOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Evento</span>
            </button>
          </div>

          {/* Monthly Matrix Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
              {WEEKDAY_NAMES_PT.map((w, idx) => (
                <div key={w} className={idx === 0 || idx === 6 ? 'text-slate-400 dark:text-slate-500' : ''}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
              {calendarMonthData.map((d, index) => {
                if (!d) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="bg-slate-50/50 dark:bg-slate-950/30 min-h-[90px] p-2"
                    />
                  );
                }

                let dayBg = 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60';
                if (d.isHoliday) {
                  dayBg = 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40';
                } else if (d.isRecess) {
                  dayBg = 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40';
                } else if (d.isSaturdaySchool) {
                  dayBg = 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60';
                } else if (d.isDiaEscolar) {
                  dayBg = 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40';
                } else if (d.isPlanning) {
                  dayBg = 'bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40';
                }

                return (
                  <div
                    key={d.isoDate}
                    onClick={() => {
                      if (d.specialDay) {
                        setEditingSpecialDay(d.specialDay);
                      } else {
                        setEditingSpecialDay({
                          date: d.isoDate,
                          type: d.dayOfWeek === 6 ? 'SABADO_LETIVO' : 'FERIADO',
                          title: '',
                          equivalentWeekday: d.dayOfWeek === 6 ? 1 : undefined,
                        });
                      }
                      setIsSpecialDayModalOpen(true);
                    }}
                    className={`min-h-[95px] p-2 transition-all cursor-pointer flex flex-col justify-between group ${dayBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-lg w-6 h-6 flex items-center justify-center ${
                          d.specialDay
                            ? 'font-black'
                            : d.isWeekend
                            ? 'text-slate-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {d.dayNumber}
                      </span>
                      {d.term && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 opacity-80 truncate max-w-[55px]">
                          {d.term.name.replace(' Bimestre', 'º Bim').replace(' Trimestre', 'º Tri')}
                        </span>
                      )}
                    </div>

                    {/* Event Tag in Box */}
                    <div className="mt-1 space-y-1">
                      {d.specialDay && (
                        <div
                          className={`text-[10px] font-bold p-1 rounded-md leading-tight line-clamp-2 ${
                            d.isHoliday
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                              : d.isRecess
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                              : d.isSaturdaySchool
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                              : d.isDiaEscolar
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
                          }`}
                          title={d.specialDay.title}
                        >
                          {d.specialDay.title}
                        </div>
                      )}
                      {!d.specialDay && !d.isWeekend && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Adicionar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TERMS (BIMESTRES / TRIMESTRES) */}
      {activeSubTab === 'TERMS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Divisão dos Períodos Letivos ({calendarDraft.periodType})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste as datas de início e término de cada bimestre ou trimestre. O sistema calcula automaticamente os dias letivos reais descontando feriados.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Regime:</label>
              <select
                value={calendarDraft.periodType}
                onChange={(e) => handlePeriodTypeChange(e.target.value as AcademicPeriodType)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BIMESTRE">4 Bimestres (Padrão Estadual/MEC)</option>
                <option value="TRIMESTRE">3 Trimestres</option>
                <option value="SEMESTRE">2 Semestres Letivos</option>
              </select>
            </div>
          </div>

          {/* Terms Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendarDraft.terms.map((term, index) => {
              const daysCount = calculateTermSchoolDays(term, calendarDraft.specialDays);
              return (
                <div
                  key={term.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{term.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Período: <strong>{formatDateBR(term.startDate, false)}</strong> até <strong>{formatDateBR(term.endDate, false)}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingTerm(term)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Editar Datas</span>
                    </button>
                  </div>

                  {/* Class Council & Parent Meeting info */}
                  {(term.classCouncilStart || term.parentMeetingStart) && (
                    <div className="space-y-1.5 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                      {term.classCouncilStart && (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                            Conselho de Classe:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDateBR(term.classCouncilStart, false)} a {term.classCouncilEnd ? formatDateBR(term.classCouncilEnd, false) : ''}
                          </span>
                        </div>
                      )}
                      {term.parentMeetingStart && (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Reunião de Pais:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDateBR(term.parentMeetingStart, false)} a {term.parentMeetingEnd ? formatDateBR(term.parentMeetingEnd, false) : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dias Letivos Reais</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">{daysCount}</span>
                      <span className="text-[10px] text-slate-400 ml-1">dias</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Meta do Período</span>
                      <span className="text-xl font-black text-slate-700 dark:text-slate-300">{term.targetSchoolDays || 50}</span>
                      <span className="text-[10px] text-slate-400 ml-1">dias</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HOLIDAYS & RECESSES */}
      {activeSubTab === 'HOLIDAYS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Feriados, Recessos & Dias Não Letivos
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Datas com suspensão de aulas ou atividades especiais. Dias cadastrados aqui são automaticamente abatidos no cálculo de dias letivos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSpecialDay({
                  date: `${calendarDraft.year}-05-01`,
                  type: 'FERIADO',
                  title: '',
                });
                setIsSpecialDayModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Feriado / Recesso</span>
            </button>
          </div>

          {/* List of Holidays & Recesses */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {calendarDraft.specialDays
              .filter((d) => d.type !== 'SABADO_LETIVO')
              .map((day) => (
                <div
                  key={day.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        day.type === 'FERIADO'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                          : day.type === 'RECESSO'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                          : day.type === 'DIA_ESCOLAR'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {day.type === 'FERIADO' ? (
                        <Palmtree className="w-4 h-4" />
                      ) : day.type === 'RECESSO' ? (
                        <CalendarRange className="w-4 h-4" />
                      ) : day.type === 'DIA_ESCOLAR' ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{day.title}</h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            day.type === 'FERIADO'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                              : day.type === 'RECESSO'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                              : day.type === 'DIA_ESCOLAR'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                          }`}
                        >
                          {day.type === 'DIA_ESCOLAR' ? 'Dia Escolar (DE)' : day.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {day.endDate
                          ? `${formatDateBR(day.date, false)} até ${formatDateBR(day.endDate, false)}`
                          : formatDateBR(day.date, true)}
                        {day.description && ` • ${day.description}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSpecialDay(day);
                        setIsSpecialDayModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar este registro"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpecialDay(day.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: SATURDAY SCHOOL DAYS (SÁBADOS LETIVOS) */}
      {activeSubTab === 'SATURDAYS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Sábados Letivos & Reposição de Carga Horária
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sábados com atividades letivas (feiras de ciências, acolhimento, simulados e mostras maker) contam como dia letivo oficial e podem permitir agendamentos com antecedência.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSpecialDay({
                  date: `${calendarDraft.year}-06-14`,
                  type: 'SABADO_LETIVO',
                  title: 'Sábado Letivo - ',
                  equivalentWeekday: 1,
                  allowBooking: true,
                });
                setIsSpecialDayModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Sábado Letivo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendarDraft.specialDays
              .filter((d) => d.type === 'SABADO_LETIVO')
              .map((sat) => {
                const eqDay = sat.equivalentWeekday
                  ? ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'][sat.equivalentWeekday - 1]
                  : null;

                return (
                  <div
                    key={sat.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                            SÁB
                          </span>
                          <div>
                            <h4 className="font-black text-xs text-slate-900 dark:text-white">{sat.title}</h4>
                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatDateBR(sat.date, false)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSpecialDay(sat);
                              setIsSpecialDayModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpecialDay(sat.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {sat.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                          {sat.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">
                        Horário de referência: <strong>{eqDay || 'Padrão da Escola'}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {sat.allowBooking ? 'Reservas Habilitadas' : 'Apenas Atividades Gerais'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: SETTINGS & POLICIES */}
      {activeSubTab === 'SETTINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Políticas de Agendamento em Datas do Calendário Letivo
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defina o comportamento do sistema quando um professor tentar agendar laboratórios em feriados, recessos ou fins de semana.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start space-x-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={calendarDraft.warnOnHolidayBooking ?? true}
                onChange={(e) =>
                  setCalendarDraft({
                    ...calendarDraft,
                    warnOnHolidayBooking: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Exibir aviso inteligente ao agendar em Feriado ou Recesso
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Quando ativado, se o professor escolher uma data marcada como Feriado ou Recesso no formulário de reserva, um alerta explicativo é exibido na tela para prevenir agendamentos por engano.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={calendarDraft.blockBookingOnHolidays ?? false}
                onChange={(e) =>
                  setCalendarDraft({
                    ...calendarDraft,
                    blockBookingOnHolidays: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Bloquear completamente reservas de professores em feriados e recessos
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Impede que professores enviem solicitações de agendamento em datas não letivas (apenas coordenadores e gestores poderão autorizar diretamente).
                </span>
              </div>
            </label>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Meta Mínima de Dias Letivos (LDB)
              </span>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={calendarDraft.totalSchoolDaysGoal || 200}
                  onChange={(e) =>
                    setCalendarDraft({
                      ...calendarDraft,
                      totalSchoolDaysGoal: parseInt(e.target.value, 10) || 200,
                    })
                  }
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dias letivos (o Art. 24 da LDB determina no mínimo 200 dias de efetivo trabalho escolar).
                </span>
              </div>
            </div>

            {/* SEÇÃO: DEFINIÇÃO DO ANO LETIVO */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <CalendarClock className="w-4 h-4 text-blue-600" />
                  <span>Definição do Ano Letivo Escolar (Vigência)</span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure o ano de vigência do calendário letivo para {currentSchool?.name || 'sua escola'}. O sistema está ajustado para o ano vigente de <strong>2026</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ano Configurado:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black">
                      {calendarDraft.year}
                    </span>
                    {calendarDraft.year === 2026 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Ano Atual Vigente
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Período: {formatDateBR(calendarDraft.schoolYearStart)} até {formatDateBR(calendarDraft.schoolYearEnd)}
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setYearInputVal(calendarDraft.year);
                      setIsYearModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Definir / Trocar Ano Letivo</span>
                  </button>

                  {calendarDraft.year !== 2026 && (
                    <button
                      type="button"
                      onClick={() => handleYearChange(2026, true)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Atualizar para 2026</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO: DOCUMENTO OFICIAL DO CALENDÁRIO EM PDF */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Documento Oficial do Calendário em Arquivo PDF</span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Anexe a resolução ou calendário oficial em PDF expedido pela Secretaria de Estado de Educação (SEE-MG) ou Superintendência Regional.
                </p>
              </div>

              {calendarDraft.pdfFileName ? (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {calendarDraft.pdfFileName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tamanho: {formatPdfFileSize(calendarDraft.pdfFileSize)} • Enviado em: {calendarDraft.pdfUploadedAt ? formatDateBR(calendarDraft.pdfUploadedAt.slice(0, 10)) : 'Recentemente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPdfViewerOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadCalendarPdf(storedPdfUrl, calendarDraft.pdfFileName)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Baixar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Substituir</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs cursor-pointer"
                      title="Excluir PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        Nenhum PDF do calendário anual anexado no momento
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Clique aqui para selecionar o arquivo PDF do Calendário Letivo {calendarDraft.year}.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-xs">
                    {isUploadingPdf ? 'Enviando...' : 'Fazer Upload do PDF'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: DEDICATED PDF VIEWER TAB */}
      {activeSubTab === 'PDF' && (
        <div className="space-y-4">
          {/* Top PDF Controls Header */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {calendarDraft.pdfFileName || `Calendário Letivo Anual ${calendarDraft.year}`}
                  </h4>
                  {calendarDraft.pdfFileName && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      PDF Oficial Carregado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {calendarDraft.pdfFileName
                    ? `Arquivo: ${formatPdfFileSize(calendarDraft.pdfFileSize)} • Vigência Ano ${calendarDraft.year} • Escola: ${currentSchool?.name}`
                    : `Faça upload do arquivo PDF oficial do calendário escolar do ano ${calendarDraft.year} para consulta rápida.`}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {calendarDraft.pdfFileName ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPdfViewerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Tela Cheia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCalendarPdf(storedPdfUrl, calendarDraft.pdfFileName)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Baixar PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openCalendarPdfInNewTab(storedPdfUrl)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Abrir em Nova Aba</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Substituir PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs cursor-pointer"
                    title="Excluir PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={isUploadingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingPdf ? 'Processando...' : 'Fazer Upload do Arquivo PDF'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Embedded Viewer or Empty State */}
          {calendarDraft.pdfFileName && storedPdfUrl ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
              <iframe
                src={storedPdfUrl}
                title={calendarDraft.pdfFileName}
                className="w-full h-[750px] rounded-2xl border-0 bg-slate-100 dark:bg-slate-950"
              />
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPdf(true);
              }}
              onDragLeave={() => setIsDraggingPdf(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPdf(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handlePdfUpload(file);
              }}
              onClick={() => pdfInputRef.current?.click()}
              className={`bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all ${
                isDraggingPdf
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-xs">
                <FileText className="w-8 h-8" />
              </div>

              <div className="max-w-md space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Nenhum Arquivo PDF do Calendário Letivo Anexado
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Arraste e solte o documento oficial do Calendário Escolar (SEE-MG / SRE) em formato PDF aqui ou clique para selecionar do seu dispositivo.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <span className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors">
                  {isUploadingPdf ? 'Processando envio...' : 'Selecionar Documento PDF do Computador'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT SPECIAL DAY */}
      {isSpecialDayModalOpen && editingSpecialDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>{editingSpecialDay.id ? 'Editar Evento do Calendário' : 'Novo Evento / Feriado'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsSpecialDayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecialDay} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Evento: *
                </label>
                <select
                  value={editingSpecialDay.type || 'FERIADO'}
                  onChange={(e) =>
                    setEditingSpecialDay({
                      ...editingSpecialDay,
                      type: e.target.value as CalendarDayType,
                      allowBooking: e.target.value === 'SABADO_LETIVO',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="FERIADO">Feriado Escolar / Nacional / Estadual</option>
                  <option value="RECESSO">Recesso Escolar (Férias de Julho / Recesso)</option>
                  <option value="DIA_ESCOLAR">Dia Escolar (DE) - Atividades Pedagógicas sem estudantes</option>
                  <option value="SABADO_LETIVO">Sábado Letivo (Reposição / Atividade)</option>
                  <option value="PLANEJAMENTO">Planejamento Docente / Módulo / Conselho</option>
                  <option value="EVENTO">Evento Escolar (Mostra Maker / Feira)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título / Nome do Evento: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Feriado Municipal, Feira de Robótica..."
                  value={editingSpecialDay.title || ''}
                  onChange={(e) => setEditingSpecialDay({ ...editingSpecialDay, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início: *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingSpecialDay.date || ''}
                    onChange={(e) => setEditingSpecialDay({ ...editingSpecialDay, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Fim (Opcional):
                  </label>
                  <input
                    type="date"
                    value={editingSpecialDay.endDate || ''}
                    onChange={(e) => setEditingSpecialDay({ ...editingSpecialDay, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {editingSpecialDay.type === 'SABADO_LETIVO' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário de Referência para as Aulas:
                  </label>
                  <select
                    value={editingSpecialDay.equivalentWeekday || 1}
                    onChange={(e) =>
                      setEditingSpecialDay({
                        ...editingSpecialDay,
                        equivalentWeekday: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={1}>Horário de Segunda-feira</option>
                    <option value={2}>Horário de Terça-feira</option>
                    <option value={3}>Horário de Quarta-feira</option>
                    <option value={4}>Horário de Quinta-feira</option>
                    <option value={5}>Horário de Sexta-feira</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Descrição:
                </label>
                <textarea
                  rows={2}
                  value={editingSpecialDay.description || ''}
                  onChange={(e) => setEditingSpecialDay({ ...editingSpecialDay, description: e.target.value })}
                  placeholder="Informações adicionais para a comunidade escolar..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSpecialDayModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TERM DATES */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Editar Datas do {editingTerm.name}
              </h4>
              <button
                type="button"
                onClick={() => setEditingTerm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTerm} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início: *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingTerm.startDate}
                    onChange={(e) => setEditingTerm({ ...editingTerm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Término: *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingTerm.endDate}
                    onChange={(e) => setEditingTerm({ ...editingTerm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta de Dias Letivos (Opcional):
                </label>
                <input
                  type="number"
                  value={editingTerm.targetSchoolDays || 66}
                  onChange={(e) =>
                    setEditingTerm({
                      ...editingTerm,
                      targetSchoolDays: parseInt(e.target.value, 10) || 66,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Class Council Dates */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Conselho de Classe do {editingTerm.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Início do Conselho:</label>
                    <input
                      type="date"
                      value={editingTerm.classCouncilStart || ''}
                      onChange={(e) => setEditingTerm({ ...editingTerm, classCouncilStart: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Término do Conselho:</label>
                    <input
                      type="date"
                      value={editingTerm.classCouncilEnd || ''}
                      onChange={(e) => setEditingTerm({ ...editingTerm, classCouncilEnd: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Meeting Dates */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reunião com Pais / Responsáveis</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Início da Reunião:</label>
                    <input
                      type="date"
                      value={editingTerm.parentMeetingStart || ''}
                      onChange={(e) => setEditingTerm({ ...editingTerm, parentMeetingStart: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Término da Reunião:</label>
                    <input
                      type="date"
                      value={editingTerm.parentMeetingEnd || ''}
                      onChange={(e) => setEditingTerm({ ...editingTerm, parentMeetingEnd: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTerm(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Salvar Período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET TO OFFICIAL TEMPLATE */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Recarregar Calendário Oficial Padrão?
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Isso atualizará este calendário com a matriz oficial para o ano <strong>{calendarDraft.year}</strong> (cumprimento exato de 200 dias letivos da LDB, feriados e recessos escolares).
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleResetToOfficialTemplate('TRIMESTRE');
                  setIsResetConfirmOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Padrão Oficial Trimestral SEE-MG (3 Trimestres - 200 Dias)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetToOfficialTemplate('BIMESTRE');
                  setIsResetConfirmOpen(false);
                }}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Regime Bimestral Alternativo (4 Bimestres)
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-full py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      <CalendarPdfViewerModal
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
        pdfUrl={storedPdfUrl}
        fileName={calendarDraft.pdfFileName}
        fileSize={calendarDraft.pdfFileSize}
        uploadedAt={calendarDraft.pdfUploadedAt}
        onReplace={() => pdfInputRef.current?.click()}
        onRemove={handleRemovePdf}
      />

      {/* MODAL: DEFINIR / MUDAR ANO LETIVO */}
      {isYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <CalendarClock className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Definir Ano Letivo do Calendário
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure a vigência do calendário letivo para <strong>{currentSchool?.name || 'sua escola'}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecione o Ano Desejado:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setYearInputVal(yr)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        yearInputVal === yr
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {yr}
                      {yr === 2026 && <span className="block text-[9px] font-normal opacity-90">Atual</span>}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Outro ano:</span>
                  <input
                    type="number"
                    min={2020}
                    max={2040}
                    value={yearInputVal}
                    onChange={(e) => setYearInputVal(parseInt(e.target.value, 10) || 2026)}
                    className="w-28 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Atualização para {yearInputVal}:
                </p>
                <p className="opacity-90 leading-relaxed">
                  Ao escolher <strong>Aplicar Padrão Oficial</strong>, o sistema calcula os 200 dias da LDB, 3 trimestres oficiais (SEE-MG) e feriados exatos deste ano.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleYearChange(yearInputVal, true);
                  setIsYearModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Aplicar Padrão Oficial {yearInputVal} (200 Dias - Recomendado)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleYearChange(yearInputVal, false);
                  setIsYearModalOpen(false);
                }}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Apenas Atualizar Ano (Manter Eventos Existentes)
              </button>

              <button
                type="button"
                onClick={() => setIsYearModalOpen(false)}
                className="w-full py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
