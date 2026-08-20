import React, { useState } from 'react';
import {
  School,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Laptop,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { TeacherAvatar } from './TeacherAvatar';
import { User } from '../types';

export const LoginScreen: React.FC = () => {
  const { users, loginWithCredentials, loginWithGoogleEmail } = useAuth();
  const { settings } = useReservations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUserForQuickFill, setSelectedUserForQuickFill] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Por favor, digite seu e-mail institucional.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = loginWithCredentials(trimmedEmail, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao realizar login. Verifique seus dados.');
      }
    }, 250);
  };

  const handleSelectQuickUser = (user: User) => {
    setEmail(user.email);
    setPassword(user.password || 'educacao123');
    setSelectedUserForQuickFill(user);
    setErrorMessage(null);
  };

  const handleGoogleQuickLogin = () => {
    if (!email.trim()) {
      // Default to the first teacher or admin
      const defaultUser = users[0];
      if (defaultUser) {
        loginWithGoogleEmail(defaultUser.email, defaultUser.name);
      }
    } else {
      loginWithGoogleEmail(email.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Institutional Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white font-mono">RESERVE LABS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                Portal Docente
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {settings.schoolName || 'E.E. Governador Milton Campos'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Acesso Seguro & Individual</span>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Left Column: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="space-y-1.5 mb-6">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/20 mb-1">
                  <Lock className="w-3 h-3" />
                  <span>Identificação do Professor</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Entrar no Sistema
                </h1>
                <p className="text-xs text-slate-400">
                  Informe suas credenciais institucionais para gerenciar seus agendamentos de laboratório.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 mb-5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    E-mail Institucional:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: professor@educacao.mg.gov.br"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300">
                      Senha de Acesso:
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Padrão: <code className="text-blue-400 font-mono">educacao123</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Autenticando...' : 'Acessar Sistema'}</span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                  <span className="bg-slate-900 px-3">Ou acesse com</span>
                </div>
              </div>

              {/* Google Fast Login Button */}
              <button
                id="login-google-btn"
                type="button"
                onClick={handleGoogleQuickLogin}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span>Entrar com Conta Google Institucional</span>
              </button>
            </div>

            {/* Bottom Security Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Proteção de dados: O Professor A não pode visualizar ou alterar agendamentos privados de outros docentes.
              </span>
            </div>
          </div>

          {/* Right Column: Quick Account Picker for Easy Testing */}
          <div className="lg:col-span-5 bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>Professores Cadastrados:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {users.length} ativos
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3.5">
                Clique no seu nome abaixo para preencher automaticamente seu login:
              </p>

              {/* Staff List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {users.map((user) => {
                  const isSelected = email.toLowerCase() === user.email.toLowerCase();
                  const isAdmin = user.role === 'ADMIN';

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectQuickUser(user)}
                      className={`w-full flex items-center space-x-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                          : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <TeacherAvatar
                        avatar={user.avatar}
                        name={user.name}
                        subject={user.subject}
                        role={user.role}
                        size="sm"
                        showRoleBadge={true}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white truncate">
                            {user.name}
                          </p>
                          {isAdmin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {user.subject || 'Docente'} • <span className="font-mono text-slate-500">{user.email.split('@')[0]}</span>
                        </p>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helper Info Card */}
            <div className="mt-4 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Primeiro Acesso ou Novo Professor?</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Novos docentes são cadastrados pelo administrador do sistema (Coordenação/Direção).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 text-slate-500 text-[11px] py-3.5 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <div>
          <span>Secretaria de Estado de Educação de Minas Gerais • Rede Estadual de Ensino</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>RESERVE LABS v3.0</span>
          <span>•</span>
          <span>Ambiente Seguro</span>
        </div>
      </footer>
    </div>
  );
};
