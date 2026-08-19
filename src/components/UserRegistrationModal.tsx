import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Edit2,
  BookOpen,
  Mail,
  User as UserIcon,
  Shield,
  School,
  CheckCircle2,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { User, UserRole, GenderType } from '../types';
import { SCHOOL_DISCIPLINES } from '../data/initialData';
import {
  MALE_EDUCATOR_AVATARS,
  FEMALE_EDUCATOR_AVATARS,
  detectGenderFromName,
  getDefaultAvatar,
} from '../data/avatars';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  initialRole?: UserRole;
  userToEdit?: User | null;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'TEACHER',
  userToEdit = null,
}) => {
  const { addUser, updateUser, users, isAdmin } = useAuth();
  const { settings } = useReservations();

  const isEditing = Boolean(userToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SCHOOL_DISCIPLINES[0] || 'Matemática');
  const [customSubject, setCustomSubject] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [gender, setGender] = useState<GenderType>('MALE');
  const [avatar, setAvatar] = useState<string>('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);
  const [hasManuallySelectedAvatar, setHasManuallySelectedAvatar] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      if (userToEdit.subject && SCHOOL_DISCIPLINES.includes(userToEdit.subject)) {
        setSubject(userToEdit.subject);
        setCustomSubject('');
      } else if (userToEdit.subject) {
        setSubject('OUTRA');
        setCustomSubject(userToEdit.subject);
      } else {
        setSubject(SCHOOL_DISCIPLINES[0] || 'Matemática');
        setCustomSubject('');
      }
      setRole(userToEdit.role || 'TEACHER');
      const initialGender = userToEdit.gender || detectGenderFromName(userToEdit.name || '');
      setGender(initialGender);
      setAvatar(userToEdit.avatar || getDefaultAvatar(initialGender, userToEdit.name));
      setHasManuallySelectedAvatar(true);
    } else {
      setName('');
      setEmail('');
      setSubject(SCHOOL_DISCIPLINES[0] || 'Matemática');
      setCustomSubject('');
      setRole(initialRole);
      setGender('MALE');
      setAvatar(getDefaultAvatar('MALE'));
      setHasManuallySelectedAvatar(false);
      setCustomAvatarUrl('');
      setShowCustomUrlInput(false);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [userToEdit, isOpen, initialRole]);

  // When gender is explicitly toggled by the user
  const handleSelectGender = (newGender: GenderType) => {
    setGender(newGender);
    // Switch to default avatar of the new gender
    const defaultAv = getDefaultAvatar(newGender, name);
    setAvatar(defaultAv);
    setHasManuallySelectedAvatar(false);
  };

  // Name change with intelligent auto-detection of title/gender if not manually locked
  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasManuallySelectedAvatar && !isEditing) {
      const detected = detectGenderFromName(val);
      if (detected !== gender) {
        setGender(detected);
        setAvatar(getDefaultAvatar(detected, val));
      }
    }
  };

  if (!isOpen) return null;

  const currentAvatarList = gender === 'MALE' ? MALE_EDUCATOR_AVATARS : FEMALE_EDUCATOR_AVATARS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage('Por favor, informe o nome completo do professor.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe o e-mail do professor.');
      return;
    }

    // Basic email validation
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Informe um e-mail válido (ex: professor@educacao.mg.gov.br).');
      return;
    }

    // Enforce administrator permission for new registrations
    if (!isEditing && !isAdmin) {
      setErrorMessage('Apenas administradores do sistema têm permissão para cadastrar novos professores.');
      return;
    }

    // Check if another user already uses this email (if changing email)
    if (isEditing && userToEdit) {
      const emailConflict = users.find(
        (u) => u.id !== userToEdit.id && u.email.toLowerCase() === trimmedEmail
      );
      if (emailConflict) {
        setErrorMessage(`O e-mail "${trimmedEmail}" já está cadastrado para outro usuário.`);
        return;
      }
    }

    const finalSubject = subject === 'OUTRA' ? customSubject.trim() || 'Geral' : subject;
    const finalAvatar = customAvatarUrl.trim() || avatar || getDefaultAvatar(gender, trimmedName);

    if (isEditing && userToEdit) {
      updateUser(userToEdit.id, {
        name: trimmedName,
        email: trimmedEmail,
        subject: finalSubject,
        role: role,
        gender: gender,
        avatar: finalAvatar,
      });

      const updatedUser: User = {
        ...userToEdit,
        name: trimmedName,
        email: trimmedEmail,
        subject: finalSubject,
        role: role,
        gender: gender,
        avatar: finalAvatar,
      };

      setSuccessMessage(`Dados do docente "${trimmedName}" atualizados com sucesso!`);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(updatedUser);
        }
        onClose();
      }, 700);
    } else {
      const newUser = addUser(
        {
          name: trimmedName,
          email: trimmedEmail,
          subject: finalSubject,
          role: role,
          gender: gender,
          schoolName: settings.schoolName || 'E.E. Governador Milton Campos',
          avatar: finalAvatar,
        },
        true // autoLogin
      );

      setSuccessMessage(`Docente "${newUser.name}" cadastrado com sucesso!`);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(newUser);
        }
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setSubject(SCHOOL_DISCIPLINES[0] || 'Matemática');
        setCustomSubject('');
        setSuccessMessage(null);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-colors">
        {/* Header */}
        <div
          className={`text-white p-5 sm:p-6 flex items-center justify-between shrink-0 sticky top-0 z-10 ${
            isEditing
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              {isEditing ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEditing ? 'Editar Cadastro do Professor' : 'Cadastro de Professor'}
              </h3>
              <p className="text-xs text-blue-100/90">
                {isEditing
                  ? 'Atualize o nome, foto de perfil (masculino/feminino), e-mail e disciplina'
                  : 'Crie seu usuário com foto representativa para agendar laboratórios'}
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

        {/* Form Body */}
        {!isEditing && !isAdmin ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                Acesso Restrito: Somente Administradores
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                O cadastro de novos professores e a gestão de acessos escolares só podem ser realizados por administradores ou pela coordenação pedagógica.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 max-w-md mx-auto text-left space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">ℹ️ O que fazer se você é professor:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Se já possui cadastro, selecione seu nome no menu superior.</li>
                <li>Caso seu nome não conste na lista, solicite seu cadastro à coordenação/direção.</li>
              </ul>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
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

          {/* Gênero / Identificação & Foto do Perfil */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Identificação & Foto do Perfil: <span className="text-red-500">*</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Selecione o gênero para organizar a foto com figura masculina ou feminina
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                {gender === 'MALE' ? '👨‍🏫 Professor (Masculino)' : '👩‍🏫 Professora (Feminino)'}
              </span>
            </div>

            {/* Gender Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectGender('MALE')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  gender === 'MALE'
                    ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-base shrink-0">
                  👨‍🏫
                </div>
                <div>
                  <p className="font-bold text-xs">Professor</p>
                  <p className="text-[10px] opacity-75">Figura Masculina</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGender('FEMALE')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  gender === 'FEMALE'
                    ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-base shrink-0">
                  👩‍🏫
                </div>
                <div>
                  <p className="font-bold text-xs">Professora</p>
                  <p className="text-[10px] opacity-75">Figura Feminina</p>
                </div>
              </button>
            </div>

            {/* Avatar Gallery & Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Escolha uma foto / avatar ({gender === 'MALE' ? 'Masculino' : 'Feminino'}):
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  <span>{showCustomUrlInput ? 'Ocultar Link' : 'Inserir Link de Foto'}</span>
                </button>
              </div>

              {/* Avatars Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {currentAvatarList.map((avOption) => {
                  const isSelected = avatar === avOption.url && !customAvatarUrl;
                  return (
                    <button
                      key={avOption.id}
                      type="button"
                      onClick={() => {
                        setAvatar(avOption.url);
                        setCustomAvatarUrl('');
                        setHasManuallySelectedAvatar(true);
                      }}
                      className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/40 scale-105 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:scale-102'
                      }`}
                      title={avOption.label}
                    >
                      <img
                        src={avOption.url}
                        alt={avOption.label}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Image URL input if toggled */}
              {showCustomUrlInput && (
                <div className="mt-2.5 space-y-1 animate-in fade-in">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value) {
                        setAvatar(e.target.value);
                        setHasManuallySelectedAvatar(true);
                      }
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-[11px]"
                  />
                  <p className="text-[10px] text-slate-400">Cole o link direto de uma imagem (JPEG/PNG)</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Nome Completo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Docente: <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder={gender === 'MALE' ? 'Ex: Prof. André Santos ou Carlos Silva' : 'Ex: Profa. Mariana Souza ou Ana Paula'}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>

            {/* E-mail Institucional ou Pessoal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail (Institucional @educacao.mg.gov.br ou Gmail): <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ex: professor@educacao.mg.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>

            {/* Disciplina / Componente Curricular */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Componente Curricular / Disciplina Principal:
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
                >
                  {SCHOOL_DISCIPLINES.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                  <option value="OUTRA">Outra Disciplina / Especialidade...</option>
                </select>
              </div>

              {subject === 'OUTRA' && (
                <input
                  type="text"
                  placeholder="Digite o nome da disciplina ou projeto..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2 w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  required
                />
              )}
            </div>

            {/* Cargo / Perfil */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Perfil de Acesso:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                    role === 'TEACHER'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">{gender === 'MALE' ? 'Professor' : 'Professora'}</p>
                    <p className="text-[10px] opacity-75">Faz reservas de aulas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                    role === 'ADMIN'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Coordenação / Admin</p>
                    <p className="text-[10px] opacity-75">Aprova e gerencia</p>
                  </div>
                </button>
              </div>
            </div>

            {/* School display */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <School className="w-3.5 h-3.5 text-blue-500" />
                <span>Instituição:</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {settings.schoolName}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black shadow-md shadow-blue-500/25 transition-all flex items-center space-x-2 cursor-pointer transform active:scale-95"
            >
              {isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar & Fazer Reservas</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
