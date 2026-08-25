import React, { useState, useMemo } from 'react';
import {
  School as SchoolIcon,
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
  GraduationCap,
  Building2,
  MapPin,
  Search,
  Check,
  ChevronDown,
  Terminal,
  Code2,
  X,
  KeyRound,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { TeacherAvatar } from './TeacherAvatar';
import { DeveloperAuthModal } from './DeveloperAuthModal';
import { User, School } from '../types';

interface LoginScreenProps {
  onOpenDeveloperPortal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenDeveloperPortal }) => {
  const { users, loginWithCredentials, loginWithGoogleEmail, isDeveloperMode } = useAuth();
  const { schools, currentSchoolId, switchSchool } = useReservations();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchoolId || schools[0]?.id || '');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDevAuthModalOpen, setIsDevAuthModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Selected school object
  const activeSelectedSchool = useMemo(() => {
    return schools.find((s) => s.id === selectedSchoolId) || schools[0];
  }, [schools, selectedSchoolId]);

  // Filtered schools for search
  const filteredSchools = useMemo(() => {
    const q = schoolSearchQuery.toLowerCase().trim();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.inepCode && s.inepCode.toLowerCase().includes(q))
    );
  }, [schools, schoolSearchQuery]);

  // Teachers filtered by selected school and teacher search
  const teachersForSelectedSchool = useMemo(() => {
    const list = users.filter((u) => u.schoolId === selectedSchoolId || (!u.schoolId && selectedSchoolId === schools[0]?.id));
    const baseList = list.length > 0 ? list : users.slice(0, 5);

    const tq = teacherSearchQuery.toLowerCase().trim();
    if (!tq) return baseList;

    return baseList.filter(
      (u) =>
        u.name.toLowerCase().includes(tq) ||
        u.email.toLowerCase().includes(tq) ||
        (u.subject && u.subject.toLowerCase().includes(tq))
    );
  }, [users, selectedSchoolId, schools, teacherSearchQuery]);

  // Auto-detect school when user enters email
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    const trimmed = newEmail.trim().toLowerCase();
    if (trimmed.length > 3) {
      // 1. Check if user exists in database
      const matchedUser = users.find((u) => u.email.toLowerCase() === trimmed);
      if (matchedUser && matchedUser.schoolId && matchedUser.schoolId !== selectedSchoolId) {
        setSelectedSchoolId(matchedUser.schoolId);
        switchSchool(matchedUser.schoolId);
        return;
      }

      // 2. Check if user is an admin of any registered school
      const schoolWithAdmin = schools.find((s) =>
        (s.adminEmails || []).some((adm) => adm.toLowerCase() === trimmed)
      );
      if (schoolWithAdmin && schoolWithAdmin.id !== selectedSchoolId) {
        setSelectedSchoolId(schoolWithAdmin.id);
        switchSchool(schoolWithAdmin.id);
      }
    }
  };

  const handleSelectSchool = (school: School) => {
    setSelectedSchoolId(school.id);
    switchSchool(school.id);
    setShowSchoolDropdown(false);
    setSchoolSearchQuery('');
    setErrorMessage(null);
  };

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
      const result = loginWithCredentials(trimmedEmail, password, selectedSchoolId);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao realizar login. Verifique seus dados.');
      } else {
        // Switch to the correct school context for this user
        if (result.user?.schoolId) {
          switchSchool(result.user.schoolId);
        } else if (selectedSchoolId) {
          switchSchool(selectedSchoolId);
        }
      }
    }, 250);
  };

  const handleSelectQuickUser = (user: User) => {
    setEmail(user.email);
    setPassword(user.password || 'educacao123');
    setErrorMessage(null);

    if (user.schoolId && user.schoolId !== selectedSchoolId) {
      setSelectedSchoolId(user.schoolId);
      switchSchool(user.schoolId);
    }
  };

  const handleGoogleQuickLogin = () => {
    if (!email.trim()) {
      const defaultUser = teachersForSelectedSchool[0] || users[0];
      if (defaultUser) {
        loginWithGoogleEmail(defaultUser.email, defaultUser.name, selectedSchoolId, activeSelectedSchool?.name);
      }
    } else {
      loginWithGoogleEmail(email.trim(), undefined, selectedSchoolId, activeSelectedSchool?.name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Institutional Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <SchoolIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white font-mono">RESERVE LABS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                Rede de Escolas
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              Sistema Integrado de Agendamento de Laboratórios & Espaços Pedagógicos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{schools.length} Escolas Conectadas</span>
          </div>

          <button
            id="dev-portal-top-btn"
            type="button"
            onClick={() => setIsDevAuthModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Acesso exclusivo do desenvolvedor para cadastrar e gerenciar clientes"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Acesso Desenvolvedor</span>
            <span className="sm:hidden">Dev</span>
          </button>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Left Column: Login Form & School Selector */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="space-y-1.5 mb-5">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/20 mb-1">
                  <Lock className="w-3 h-3" />
                  <span>Acesso Institucional por Escola</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Entrar no Sistema
                </h1>
                <p className="text-xs text-slate-400">
                  Selecione sua unidade de ensino e informe suas credenciais para gerenciar agendamentos.
                </p>
              </div>

              {/* 1. School Selector Dropdown */}
              <div className="mb-4 relative">
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Unidade Escolar:</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-normal">
                    {activeSelectedSchool?.city} - {activeSelectedSchool?.state || 'MG'}
                  </span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                        <SchoolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {activeSelectedSchool?.name || 'Selecione sua Escola'}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{activeSelectedSchool?.networkType || 'Estadual'}</span>
                          <span>•</span>
                          <span>INEP: {activeSelectedSchool?.inepCode || activeSelectedSchool?.code}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${showSchoolDropdown ? 'rotate-180 text-blue-400' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showSchoolDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                      {/* Search inside dropdown */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          placeholder="Buscar por escola, cidade ou INEP..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {filteredSchools.map((s) => {
                          const isCur = s.id === selectedSchoolId;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSchool(s)}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isCur
                                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                                  : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate text-white">{s.name}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>{s.city} - {s.state}</span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-500">INEP {s.inepCode || s.code}</span>
                                </p>
                              </div>
                              {isCur && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                        {filteredSchools.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-500">
                            Nenhuma escola encontrada com "{schoolSearchQuery}".
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 mb-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    E-mail Institucional do Docente ou Responsável:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="ex: professor@educacao.mg.gov.br"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      Senha de Acesso:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                    >
                      Primeiro acesso ou esqueceu?
                    </button>
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
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Autenticando...' : `Acessar ${activeSelectedSchool?.shortName || 'Escola'}`}</span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
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
                className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                <span>Entrar com Google Workspace Institucional</span>
              </button>
            </div>

            {/* Bottom Security Notice */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Proteção de dados por unidade escolar</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Ajuda
              </button>
            </div>
          </div>

          {/* Right Column: Staff & Quick Account Picker for Easy Testing */}
          <div className="lg:col-span-5 bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>Docentes Cadastrados:</span>
                </span>
                <span className="text-[10px] text-blue-400 font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  {teachersForSelectedSchool.length} listados
                </span>
              </div>

              {/* Teacher Search Input */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  placeholder="Filtrar por nome ou disciplina..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Staff List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {teachersForSelectedSchool.map((user) => {
                  const isSelected = email.toLowerCase() === user.email.toLowerCase();
                  const isAdmin = user.role === 'ADMIN';

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectQuickUser(user)}
                      className={`w-full flex items-center space-x-2.5 p-2 rounded-2xl border text-left transition-all cursor-pointer ${
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

                {teachersForSelectedSchool.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl">
                    Nenhum docente encontrado para o termo pesquisado.
                  </div>
                )}
              </div>
            </div>

            {/* Helper Info Card */}
            <div className="mt-4 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Escolas & Docentes</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Clique em qualquer professor da lista para preencher as credenciais instantaneamente ou digite seu e-mail institucional.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 text-slate-500 text-[11px] py-3 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <div>
          <span>Secretaria de Estado de Educação de Minas Gerais • Sistema Multi-Escolas</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>RESERVE LABS v3.0</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsDevAuthModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-mono hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Code2 className="w-3 h-3" />
            <span>Painel do Desenvolvedor</span>
          </button>
        </div>
      </footer>

      {/* First Time / Password Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Primeiro Acesso & Senha</h3>
                  <p className="text-xs text-slate-400">Guia de acesso institucional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  1. Senha Inicial Padrão
                </span>
                <p className="text-slate-400">
                  Para todos os novos professores e administradores cadastrados, a senha padrão é:
                </p>
                <div className="p-2 bg-blue-950/50 border border-blue-500/30 rounded-xl text-center">
                  <code className="text-blue-300 font-mono font-black text-sm">educacao123</code>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white">2. Como Alterar sua Senha</span>
                <p className="text-slate-400">
                  Após entrar no sistema, clique na sua foto no canto superior direito e selecione <strong>"Alterar Minha Senha"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white">3. Esqueci Minha Senha</span>
                <p className="text-slate-400">
                  Solicite ao gestor / administrador da sua escola que redefina sua senha no Painel Administrativo ou no Console do Desenvolvedor.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPassword('educacao123');
                  setIsHelpModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Preencher Senha Padrão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Auth Modal */}
      <DeveloperAuthModal
        isOpen={isDevAuthModalOpen}
        onClose={() => setIsDevAuthModalOpen(false)}
        onSuccess={() => {
          setIsDevAuthModalOpen(false);
          if (onOpenDeveloperPortal) {
            onOpenDeveloperPortal();
          }
        }}
      />
    </div>
  );
};
