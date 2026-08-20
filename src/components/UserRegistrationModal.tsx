import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Shield,
  BookOpen,
  Mail,
  CheckCircle2,
  Lock,
  Sparkles,
  School,
  Check,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { User, UserRole } from '../types';
import { EDUCATIONAL_ICONS, getIconForSubject } from '../data/avatars';
import { TeacherAvatar } from './TeacherAvatar';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
  initialRole?: UserRole;
}

const SCHOOL_DISCIPLINES = [
  'Tecnologia & Robótica',
  'Informática Educativa',
  'Matemática',
  'Química & Física',
  'Ciências & Biologia',
  'Língua Portuguesa & Literatura',
  'Língua Inglesa',
  'História',
  'Geografia',
  'Arte & Cultura',
  'Filosofia & Sociologia',
  'Educação Física',
  'Coordenação Pedagógica',
  'Direção Escolar',
  'Orientação Educacional',
  'Multidisciplinar / Projetos',
];

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  initialRole = 'TEACHER',
}) => {
  const { addUser, updateUser, isAdmin, currentUser } = useAuth();
  const { currentSchoolId, currentSchool } = useReservations();
  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('educacao123');
  const [subject, setSubject] = useState(SCHOOL_DISCIPLINES[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [selectedIconId, setSelectedIconId] = useState<string>('icon:academic');
  const [hasManuallySelectedIcon, setHasManuallySelectedIcon] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setPassword(userToEdit.password || 'educacao123');
      if (userToEdit.subject && SCHOOL_DISCIPLINES.includes(userToEdit.subject)) {
        setSubject(userToEdit.subject);
        setCustomSubject('');
      } else if (userToEdit.subject) {
        setSubject('OUTRA');
        setCustomSubject(userToEdit.subject);
      } else {
        setSubject(SCHOOL_DISCIPLINES[0]);
        setCustomSubject('');
      }
      setRole(userToEdit.role || 'TEACHER');
      setSelectedIconId(userToEdit.avatar || userToEdit.iconKey || getIconForSubject(userToEdit.subject));
      setHasManuallySelectedIcon(true);
    } else {
      setName('');
      setEmail('');
      setPassword('educacao123');
      setSubject(SCHOOL_DISCIPLINES[0]);
      setCustomSubject('');
      setRole(initialRole);
      setSelectedIconId(getIconForSubject(SCHOOL_DISCIPLINES[0]));
      setHasManuallySelectedIcon(false);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [userToEdit, isOpen, initialRole]);

  // When subject changes, automatically match the most relevant discipline icon
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    if (!hasManuallySelectedIcon && newSubject !== 'OUTRA') {
      setSelectedIconId(getIconForSubject(newSubject));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin) {
      setErrorMessage('Apenas administradores e coordenadores podem cadastrar novos professores.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const finalSubject = subject === 'OUTRA' ? customSubject.trim() : subject;

    if (!trimmedName) {
      setErrorMessage('Por favor, informe o nome completo do professor.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe o e-mail institucional.');
      return;
    }

    if (!finalSubject) {
      setErrorMessage('Por favor, informe a disciplina do professor.');
      return;
    }

    const chosenIcon = selectedIconId || getIconForSubject(finalSubject);

    if (isEditing && userToEdit) {
      updateUser(userToEdit.id, {
        name: trimmedName,
        email: trimmedEmail,
        password: password.trim() || 'educacao123',
        subject: finalSubject,
        role: role,
        avatar: chosenIcon,
        iconKey: chosenIcon,
      });
      setSuccessMessage(`Dados de ${trimmedName} atualizados com sucesso!`);
    } else {
      addUser(
        {
          name: trimmedName,
          email: trimmedEmail,
          password: password.trim() || 'educacao123',
          subject: finalSubject,
          role: role,
          avatar: chosenIcon,
          iconKey: chosenIcon,
          schoolId: currentSchoolId,
          schoolName: currentSchool?.name || currentUser?.schoolName || 'E.E. Governador Milton Campos',
        },
        false // Do not auto login on registration
      );
      setSuccessMessage(`Professor(a) ${trimmedName} cadastrado(a) com sucesso!`);
    }

    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEditing ? 'Editar Cadastro de Professor' : 'Cadastrar Novo Professor'}
              </h3>
              <p className="text-xs text-blue-100/90">
                Painel Administrativo da Coordenação Escolar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Access Guard for Non-Admins */}
        {!isAdmin ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                Acesso Restrito a Administradores
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apenas coordenadores e administradores da escola têm permissão para cadastrar ou gerenciar professores no sistema.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl font-medium animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Icon Badge Selector (Non-human, Non-animal) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Ícone Ilustrativo da Disciplina / Área: <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Ícone vetorizado acadêmico sem foto ou imagem pessoal
                  </p>
                </div>

                {/* Real-time Preview Badge */}
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <TeacherAvatar
                    avatar={selectedIconId}
                    name={name || 'Professor'}
                    subject={subject === 'OUTRA' ? customSubject : subject}
                    role={role}
                    size="sm"
                    showRoleBadge={true}
                  />
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block leading-tight">
                      {name || 'Nome do Professor'}
                    </span>
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      {subject === 'OUTRA' ? customSubject || 'Disciplina' : subject}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Subject Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {EDUCATIONAL_ICONS.map((iconOpt) => {
                  const isSelected = selectedIconId === iconOpt.id;

                  return (
                    <button
                      key={iconOpt.id}
                      type="button"
                      onClick={() => {
                        setSelectedIconId(iconOpt.id);
                        setHasManuallySelectedIcon(true);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <TeacherAvatar avatar={iconOpt.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                          {iconOpt.label.split('&')[0]}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {iconOpt.category}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Email Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Profa. Juliana Mendes"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional (@educacao.mg.gov.br): <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: juliana.mendes@educacao.mg.gov.br"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Discipline & Initial Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Disciplina / Função Principal: <span className="text-red-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SCHOOL_DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="OUTRA">Outra Disciplina / Especialidade...</option>
                </select>

                {subject === 'OUTRA' && (
                  <input
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Digite o nome da disciplina..."
                    className="w-full mt-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Senha Inicial de Acesso: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha inicial"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  O docente poderá alterar esta senha posteriormente em seu perfil.
                </p>
              </div>
            </div>

            {/* Profile Role Selector */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2">
                Nível de Acesso no Sistema:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                    role === 'TEACHER'
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 dark:border-blue-400 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Professor(a)</p>
                    <p className="text-[10px] text-slate-500">Faz e gerencia suas próprias reservas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                    role === 'ADMIN'
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Administrador / Coordenação</p>
                    <p className="text-[10px] text-slate-500">Controle total, cadastros e relatórios</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 cursor-pointer flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
