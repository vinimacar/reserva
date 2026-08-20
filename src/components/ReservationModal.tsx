import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  Sparkles,
  Info,
  UserPlus,
  User as UserIcon,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { ShiftType, Room, User } from '../types';
import { SCHOOL_CLASSES, SCHOOL_DISCIPLINES, AVAILABLE_EQUIPMENT } from '../data/initialData';
import { TeacherAvatar } from './TeacherAvatar';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialDate?: string;
  initialPeriodId?: string;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  initialRoomId,
  initialDate,
  initialPeriodId,
}) => {
  const { rooms, periods, addReservation, checkConflict, selectedRoomId } = useReservations();
  const { currentUser, users, addUser, switchUser, isAdmin } = useAuth();

  // Teacher / User selection state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentUser?.id || users[0]?.id || ''
  );
  const [isCreatingNewUser, setIsCreatingNewUser] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherEmail, setNewTeacherEmail] = useState<string>('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>(SCHOOL_DISCIPLINES[0] || 'Matemática');

  // Form State
  const [roomId, setRoomId] = useState<string>(initialRoomId || selectedRoomId || rooms[0]?.id || '');
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<ShiftType>('MANHA');
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [turma, setTurma] = useState<string>('9º Ano A');
  const [disciplina, setDisciplina] = useState<string>('Tecnologia & Robótica');
  const [customDisciplina, setCustomDisciplina] = useState<string>('');
  const [subjectTopic, setSubjectTopic] = useState<string>('');
  const [numberOfStudents, setNumberOfStudents] = useState<number>(30);
  const [requestedEquipment, setRequestedEquipment] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialRoomId) setRoomId(initialRoomId);
      if (initialDate) setDate(initialDate);
      
      if (currentUser) {
        setSelectedTeacherId(currentUser.id);
        if (currentUser.subject && currentUser.subject !== 'Geral') {
          setDisciplina(currentUser.subject);
        }
      } else if (users.length > 0) {
        setSelectedTeacherId(users[0].id);
      }

      if (initialPeriodId) {
        setSelectedPeriodIds([initialPeriodId]);
        const p = periods.find((item) => item.id === initialPeriodId);
        if (p) setShift(p.shift);
      } else {
        // Default to first period of current shift
        const shiftPeriods = periods.filter((p) => p.shift === 'MANHA');
        if (shiftPeriods.length > 0) {
          setSelectedPeriodIds([shiftPeriods[0].id]);
        }
      }
      
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsCreatingNewUser(false);
    }
  }, [isOpen, initialRoomId, initialDate, initialPeriodId, periods, currentUser, users]);

  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.id === roomId) || rooms[0];
  const shiftPeriods = periods.filter((p) => p.shift === shift);
  const currentSelectedTeacher = users.find((u) => u.id === selectedTeacherId) || currentUser || users[0];

  // Quick Inline New Teacher Creation
  const handleQuickCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) {
      setErrorMessage('Informe o nome do professor.');
      return;
    }
    const emailToUse =
      newTeacherEmail.trim() ||
      `${newTeacherName.toLowerCase().replace(/\s+/g, '.')}@educacao.mg.gov.br`;

    const createdUser = addUser(
      {
        name: newTeacherName.trim(),
        email: emailToUse,
        subject: newTeacherSubject,
        role: 'TEACHER',
      },
      true // autoLogin as current
    );

    setSelectedTeacherId(createdUser.id);
    if (createdUser.subject) {
      setDisciplina(createdUser.subject);
    }
    setIsCreatingNewUser(false);
    setNewTeacherName('');
    setNewTeacherEmail('');
    setErrorMessage(null);
  };

  // Toggle period selection (allowing multi-select e.g. 1st and 2nd class)
  const handleTogglePeriod = (periodId: string) => {
    setSelectedPeriodIds((prev) => {
      if (prev.includes(periodId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== periodId);
      } else {
        return [...prev, periodId];
      }
    });
  };

  // Toggle equipment checkbox
  const handleToggleEquipment = (eq: string) => {
    setRequestedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  // Live Conflict Check
  const conflict = checkConflict(roomId, date, selectedPeriodIds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const reservingUser = users.find((u) => u.id === selectedTeacherId) || currentUser;

    if (!reservingUser) {
      setErrorMessage('Selecione ou cadastre um professor para realizar o agendamento.');
      return;
    }

    if (selectedPeriodIds.length === 0) {
      setErrorMessage('Selecione pelo menos um período (aula) para a reserva.');
      return;
    }

    if (!turma.trim()) {
      setErrorMessage('Informe a turma escolar.');
      return;
    }

    const finalDisciplina = disciplina === 'OUTRA' ? customDisciplina : disciplina;
    if (!finalDisciplina.trim()) {
      setErrorMessage('Informe a disciplina da aula.');
      return;
    }

    if (!subjectTopic.trim()) {
      setErrorMessage('Descreva o objetivo ou planejamento pedagógico da aula.');
      return;
    }

    const result = addReservation({
      roomId,
      date,
      shift,
      periodIds: selectedPeriodIds,
      turma,
      disciplina: finalDisciplina,
      subjectTopic,
      numberOfStudents,
      requestedEquipment,
      observations,
      userId: reservingUser.id,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Erro ao realizar a reserva.');
    } else {
      setSuccessMessage('Reserva confirmada com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  // Quick date pickers
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nova Reserva de Laboratório</h3>
              <p className="text-xs text-blue-100/80">
                Agendamento para uso pedagógico e atividades práticas
              </p>
            </div>
          </div>
          <button
            id="close-reservation-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 flex-1">
          {/* Teacher identity & creation card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Professor(a) Solicitante da Reserva:</span>
              </span>

              {isAdmin && !isCreatingNewUser && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewUser(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Criar Novo Professor / Usuário</span>
                </button>
              )}
            </div>

            {!isCreatingNewUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {currentSelectedTeacher && (
                    <TeacherAvatar
                      avatar={currentSelectedTeacher.avatar}
                      name={currentSelectedTeacher.name}
                      subject={currentSelectedTeacher.subject}
                      role={currentSelectedTeacher.role}
                      size="md"
                      showRoleBadge={true}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {isAdmin ? (
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => {
                          setSelectedTeacherId(e.target.value);
                          const found = users.find((u) => u.id === e.target.value);
                          if (found && found.subject && found.subject !== 'Geral') {
                            setDisciplina(found.subject);
                          }
                        }}
                        className="w-full sm:w-auto p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.subject || 'Docente'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{currentSelectedTeacher?.name}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">(Seu Usuário)</span>
                        </p>
                      </div>
                    )}
                    {currentSelectedTeacher && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {currentSelectedTeacher.email} • {currentSelectedTeacher.subject || 'Docente'}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 uppercase shrink-0 self-start sm:self-center">
                  {currentSelectedTeacher?.role === 'ADMIN' ? 'Coordenação' : 'Docente'}
                </span>
              </div>
            ) : (
              /* Inline Quick Teacher Registration Form */
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>Cadastrar Novo Usuário / Professor</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewUser(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Nome do Professor: *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Profa. Claudia Castro"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      E-mail Institucional (@educacao.mg.gov.br ou Gmail):
                    </label>
                    <input
                      type="email"
                      placeholder="claudia.castro@educacao.mg.gov.br"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-[11px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Disciplina Principal:
                    </label>
                    <select
                      value={newTeacherSubject}
                      onChange={(e) => setNewTeacherSubject(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
                    >
                      {SCHOOL_DISCIPLINES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewUser(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateTeacher}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Salvar Professor e Agendar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conflict Alert Banner */}
          {conflict.hasConflict && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-2xl p-3.5 flex items-start space-x-3 text-red-900 dark:text-red-200 animate-in fade-in duration-150">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Conflito de Horário Detectado!</p>
                <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">{conflict.message}</p>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-1">
                  💡 Por favor, selecione outro período, turno ou data para realizar o agendamento.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 flex items-center space-x-3 text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-bold text-xs">{successMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-2xl p-3.5 flex items-center space-x-3 text-red-900 dark:text-red-200 animate-in fade-in duration-150">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="font-bold text-xs">{errorMessage}</p>
            </div>
          )}

          {/* 1. Escolha do Espaço / Laboratório */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
              1. Selecione o Laboratório ou Sala:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rooms.map((room) => {
                const isSelected = room.id === roomId;
                const isMaintenance = room.status === 'MAINTENANCE';

                return (
                  <button
                    type="button"
                    key={room.id}
                    onClick={() => setRoomId(room.id)}
                    disabled={isMaintenance}
                    className={`flex items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500'
                        : isMaintenance
                        ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{room.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {room.capacity} alunos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{room.location}</p>
                      {isMaintenance && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1">⚠️ Em Manutenção</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Data e Turno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                2. Data do Agendamento:
              </label>
              <input
                id="reservation-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                required
              />
              <div className="flex items-center space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-2 py-0.8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Em 2 dias
                </button>
              </div>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                3. Turno:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['MANHA', 'TARDE', 'NOITE'] as ShiftType[]).map((s) => {
                  const label = s === 'MANHA' ? 'Manhã' : s === 'TARDE' ? 'Tarde' : 'Noite';
                  const isSelected = shift === s;
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => {
                        setShift(s);
                        // reset selected periods to first period of that shift
                        const newPeriods = periods.filter((p) => p.shift === s);
                        if (newPeriods.length > 0) {
                          setSelectedPeriodIds([newPeriods[0].id]);
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Aulas / Períodos (Seleção Múltipla) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                4. Aulas Desejadas (Selecione 1 ou mais aulas geminadas):
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Pode marcar mais de uma aula</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {shiftPeriods.map((period) => {
                const isSelected = selectedPeriodIds.includes(period.id);
                // Check if this single slot is occupied
                const slotConflict = checkConflict(roomId, date, [period.id]);

                return (
                  <button
                    type="button"
                    key={period.id}
                    onClick={() => handleTogglePeriod(period.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      slotConflict.hasConflict
                        ? 'bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">{period.name}</span>
                    <span
                      className={`text-[10px] font-mono mt-0.5 ${
                        isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {period.startTime} - {period.endTime}
                    </span>
                    {slotConflict.hasConflict && (
                      <span className="text-[9px] font-bold text-red-600 dark:text-red-400 mt-1 uppercase bg-red-100 dark:bg-red-950 px-1 py-0.2 rounded">
                        Ocupado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Turma e Disciplina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Turma */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                5. Turma Escolar:
              </label>
              <select
                id="turma-select"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                required
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Disciplina */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                6. Disciplina:
              </label>
              <select
                id="disciplina-select"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                required
              >
                {SCHOOL_DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="OUTRA">Outra Disciplina / Projeto Especial</option>
              </select>
              {disciplina === 'OUTRA' && (
                <input
                  type="text"
                  placeholder="Especifique o nome da disciplina..."
                  value={customDisciplina}
                  onChange={(e) => setCustomDisciplina(e.target.value)}
                  className="w-full mt-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>
          </div>

          {/* 5. Objetivo da Aula / Planejamento Pedagógico */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
              7. Conteúdo / Objetivo da Aula Prática:
            </label>
            <textarea
              id="subject-topic-textarea"
              rows={2}
              placeholder="Ex: Simulação de circuitos elétricos, pesquisa bibliográfica no Google Acadêmico, experimento com ácido acético e bicarbonato..."
              value={subjectTopic}
              onChange={(e) => setSubjectTopic(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              required
            />
          </div>

          {/* 6. Equipamentos Adicionais Requisitados */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
              8. Recursos / Equipamentos Adicionais Necessários:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_EQUIPMENT.map((eq) => {
                const isChecked = requestedEquipment.includes(eq);
                return (
                  <label
                    key={eq}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEquipment(eq)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px]">{eq}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 7. Observações e Quantidade de Alunos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                Nº de Alunos Previstos:
              </label>
              <input
                type="number"
                min={1}
                max={currentRoom.capacity + 10}
                value={numberOfStudents}
                onChange={(e) => setNumberOfStudents(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1.5">
                Observações para a Coordenação (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Alunos precisarão de acesso a tomadas para carregar projetos..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="confirm-reservation-btn"
            onClick={handleSubmit}
            disabled={conflict.hasConflict || !!successMessage}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
              conflict.hasConflict
                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-blue-500/25'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirmar Agendamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
