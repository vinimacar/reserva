import React, { useState } from 'react';
import {
  X,
  Shield,
  LogOut,
  UserPlus,
  BookOpen,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { SCHOOL_DISCIPLINES } from '../data/initialData';
import { UserRole } from '../types';
import { signInWithGooglePopup } from '../services/firebaseAuthService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, addUser, loginWithGoogleEmail, logout, isAdmin } = useAuth();
  const { settings, currentSchool } = useReservations();

  const [activeMode, setActiveMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Full Register state for administrators
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regSubject, setRegSubject] = useState<string>(SCHOOL_DISCIPLINES[0] || 'Matemática');
  const [regCustomSubject, setRegCustomSubject] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('TEACHER');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setFeedbackMsg(null);
    setIsLoadingGoogle(true);

    try {
      const googleRes = await signInWithGooglePopup();
      if (googleRes.success && googleRes.user && googleRes.user.email) {
        const verifiedEmail = googleRes.user.email.trim().toLowerCase();

        // Strict: only authenticate into the account of the verified Google user
        loginWithGoogleEmail(
          verifiedEmail,
          googleRes.user.displayName || undefined,
          currentSchool?.id || settings.schoolId,
          currentSchool?.name || settings.schoolName
        );

        setFeedbackMsg({
          type: 'success',
          text: `Autenticado com sucesso como ${googleRes.user.displayName || verifiedEmail}!`,
        });

        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        const rawError = (googleRes.error || '').toLowerCase();
        if (rawError.includes('popup-closed-by-user') || rawError.includes('cancelled')) {
          setFeedbackMsg({
            type: 'error',
            text: 'Autenticação com o Google cancelada. Selecione sua própria conta institucional para acessar.',
          });
        } else {
          setFeedbackMsg({
            type: 'error',
            text: googleRes.error || 'Falha ao autenticar com o Google. Verifique sua conexão e tente novamente.',
          });
        }
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: 'Erro ao abrir janela do Google. Certifique-se de que pop-ups estão habilitados no navegador.',
      });
    } finally {
      setIsLoadingGoogle(false);
    }
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
        text: 'Apenas administradores da escola têm permissão para cadastrar novos professores.',
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
        schoolId: currentSchool?.id || settings.schoolId,
        schoolName: currentSchool?.name || settings.schoolName || 'Escola Estadual',
      },
      false // Do not switch current user automatically
    );

    setFeedbackMsg({
      type: 'success',
      text: `Professor(a) "${created.name}" cadastrado(a) com sucesso!`,
    });

    setTimeout(() => {
      setRegName('');
      setRegEmail('');
      setActiveMode('LOGIN');
      setFeedbackMsg(null);
    }, 1200);
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
            {activeMode === 'LOGIN' ? 'Autenticação Google Individual' : 'Cadastrar Novo Professor'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMode === 'LOGIN'
              ? 'Acesso seguro e individual com conta Google institucional'
              : 'Pré-cadastro de professores para agendamento dos laboratórios'}
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
                Minha Conta
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
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sessão protegida por autenticação individual</span>
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
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* TAB 1: CURRENT USER SESSION & GOOGLE LOGIN */}
        {activeMode === 'LOGIN' && (
          <div className="p-6 space-y-4 text-xs">
            {/* Current Logged User Info */}
            {currentUser && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Sessão Ativa Conectada
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {currentUser.role === 'ADMIN' ? 'Coordenador / Admin' : 'Professor'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {currentUser.subject || 'Geral'} • {currentUser.schoolName || 'Escola da Rede'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Conta protegida e isolada</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}

            {/* Google Authentication Button */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={isLoadingGoogle}
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isLoadingGoogle ? 'Conectando ao Google...' : 'Entrar com Conta Google Institucional'}</span>
              </button>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                  Proteção de Privacidade:
                </span>
                Cada professor deve se autenticar com sua própria conta Google oficial. Não é permitido entrar ou fazer reservas no nome de outro professor.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW TEACHER (ADMIN ONLY) */}
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
                <span>Cadastrar Docente</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 transition-colors">
          🔒 Conexão segura e isolamento de contas da Secretaria de Estado de Educação de Minas Gerais.
        </div>
      </div>
    </div>
  );
};
