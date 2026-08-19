import React, { useState } from 'react';
import {
  X,
  Shield,
  Check,
  School,
  ArrowRight,
  UserPlus,
  Sparkles,
  BookOpen,
  Mail,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { SCHOOL_DISCIPLINES } from '../data/initialData';
import { UserRole } from '../types';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
}) => {
  const { currentUser, users, switchUser, addUser, loginWithGoogleEmail, isAdmin } = useAuth();
  const { settings } = useReservations();

  const [activeMode, setActiveMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Custom quick login state
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);

  // Full Register state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regSubject, setRegSubject] = useState<string>(SCHOOL_DISCIPLINES[0] || 'Matemática');
  const [regCustomSubject, setRegCustomSubject] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('TEACHER');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    loginWithGoogleEmail(customEmail, customName);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();

    if (!trimmedName) {
      setFeedbackMsg({ type: 'error', text: 'Por favor, informe o nome do professor.' });
      return;
    }

    if (!trimmedEmail) {
      setFeedbackMsg({ type: 'error', text: 'Por favor, informe o e-mail institucional.' });
      return;
    }

    if (!isAdmin) {
      setFeedbackMsg({
        type: 'error',
        text: 'Apenas administradores do sistema têm permissão para cadastrar novos professores.',
      });
      return;
    }

    const finalSubject = regSubject === 'OUTRA' ? regCustomSubject.trim() || 'Geral' : regSubject;

    const created = addUser(
      {
        name: trimmedName,
        email: trimmedEmail,
        subject: finalSubject,
        role: regRole,
        schoolName: settings.schoolName || 'E.E. Governador Milton Campos',
      },
      true // autoLogin
    );

    setFeedbackMsg({
      type: 'success',
      text: `Professor "${created.name}" cadastrado e conectado com sucesso!`,
    });

    setTimeout(() => {
      onClose();
      setRegName('');
      setRegEmail('');
      setFeedbackMsg(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-center relative transition-colors">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Google Workspace Badge */}
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
            {activeMode === 'LOGIN' ? 'Autenticação de Docente' : 'Cadastrar Novo Professor'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMode === 'LOGIN'
              ? 'Selecione ou entre com sua conta institucional para fazer reservas'
              : 'Cadastre seus dados para começar a agendar os laboratórios da escola'}
          </p>

          {/* Mode Switch Tabs (only show Register tab for Admins) */}
          {isAdmin ? (
            <div className="flex items-center justify-center space-x-1 mt-4 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl max-w-xs mx-auto border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveMode('LOGIN')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'LOGIN'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Trocar Usuário
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('REGISTER')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  activeMode === 'REGISTER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Cadastro</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Novos cadastros de professores são gerenciados pela coordenação escolar</span>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div
            className={`p-3 mx-6 mt-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : null}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* TAB 1: LOGIN / SELECT REGISTERED USER */}
        {activeMode === 'LOGIN' && (
          <div className="p-6 space-y-4 text-xs">
            {/* Quick Account Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Professores Cadastrados na Escola ({users.length}):
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveMode('REGISTER')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Criar Novo
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {users.map((user) => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                              {user.name}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                user.role === 'ADMIN'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {user.role === 'ADMIN' ? 'Admin' : 'Docente'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                            {user.subject || 'Geral'}
                          </p>
                        </div>
                      </div>

                      {isCurrent && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">
                Ou
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Custom Google Email Form */}
            {!showCustomForm ? (
              <div className="space-y-2">
                <button
                  onClick={() => setActiveMode('REGISTER')}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Novo Professor / Criar Usuário</span>
                </button>

                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-all text-[11px] flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Entrar com Outro E-mail Google</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleCustomLogin}
                className="space-y-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Entrar com E-mail Google:
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nome Completo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Profa. Juliana Mendes"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    E-mail Google:
                  </label>
                  <input
                    type="email"
                    placeholder="nome.sobrenome@educacao.mg.gov.br"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px]"
                    required
                  />
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER NEW TEACHER / USER */}
        {activeMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Professor: <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Carlos Eduardo Souza"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Institucional (@educacao.mg.gov.br ou Gmail): <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="carlos.eduardo@educacao.mg.gov.br"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Disciplina Principal / Componente Curricular:
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={regSubject}
                  onChange={(e) => setRegSubject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  {SCHOOL_DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="OUTRA">Outra Disciplina / Projeto...</option>
                </select>
              </div>

              {regSubject === 'OUTRA' && (
                <input
                  type="text"
                  placeholder="Informe a disciplina..."
                  value={regCustomSubject}
                  onChange={(e) => setRegCustomSubject(e.target.value)}
                  className="mt-2 w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Função de Acesso:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('TEACHER')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2 ${
                    regRole === 'TEACHER'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Professor</p>
                    <p className="text-[10px] opacity-75">Faz reservas de aulas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('ADMIN')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2 ${
                    regRole === 'ADMIN'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Coordenação</p>
                    <p className="text-[10px] opacity-75">Administra o sistema</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMode('LOGIN')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black shadow-md shadow-blue-500/25 flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Salvar & Entrar</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 transition-colors">
          🔒 Conexão segura e gerenciamento de perfis da Secretaria de Educação.
        </div>
      </div>
    </div>
  );
};

