import React, { useState, useMemo } from 'react';
import {
  School as SchoolIcon,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  HelpCircle,
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
  CalendarDays,
  Sparkles,
  Smartphone,
  Layers,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { TeacherAvatar } from './TeacherAvatar';
import { DeveloperAuthModal } from './DeveloperAuthModal';
import { User, School } from '../types';
import { ReserveLabsLogo } from './ReserveLabsLogo';
import { signInWithGooglePopup } from '../services/firebaseAuthService';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  onOpenDeveloperPortal?: () => void;
  onOpenTutorial?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onOpenDeveloperPortal,
  onOpenTutorial,
}) => {
  const { users, loginWithCredentials, loginWithGoogleEmail } = useAuth();
  const { schools, currentSchoolId, switchSchool, rooms } = useReservations();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentSchoolId || schools[0]?.id || ''
  );
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  // Tabs for the authentication box: 'LOGIN' or 'DIRECTORY' (Docentes Cadastrados)
  const [authViewTab, setAuthViewTab] = useState<'LOGIN' | 'DIRECTORY'>('LOGIN');
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

  // Filtered schools for search with deduplication
  const filteredSchools = useMemo(() => {
    const q = schoolSearchQuery.toLowerCase().trim();
    const list = !q
      ? schools
      : schools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.shortName.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            (s.code && s.code.toLowerCase().includes(q)) ||
            (s.inepCode && s.inepCode.toLowerCase().includes(q))
        );

    // Strictly deduplicate schools by ID/code to ensure unique rendering
    const seen = new Set<string>();
    return list.filter((s, idx) => {
      const uniqueId = s.id || s.inepCode || s.code || `school-${idx}`;
      if (seen.has(uniqueId)) return false;
      seen.add(uniqueId);
      return true;
    });
  }, [schools, schoolSearchQuery]);

  // Teachers filtered by selected school and search with deduplication
  const teachersForSelectedSchool = useMemo(() => {
    const list = (users || []).filter(
      (u) =>
        u.schoolId === selectedSchoolId ||
        (!u.schoolId && selectedSchoolId === schools[0]?.id)
    );
    const baseList = list.length > 0 ? list : (users || []).slice(0, 8);

    const tq = teacherSearchQuery.toLowerCase().trim();
    const filtered = !tq
      ? baseList
      : baseList.filter(
          (u) =>
            (u.name && u.name.toLowerCase().includes(tq)) ||
            (u.email && u.email.toLowerCase().includes(tq)) ||
            (u.subject && u.subject.toLowerCase().includes(tq))
        );

    // Strictly deduplicate teachers by ID and Email to ensure no duplicate keys
    const seen = new Set<string>();
    return filtered.filter((u, idx) => {
      const emailKey = (u.email || '').toLowerCase().trim();
      const idKey = u.id ? `id:${u.id}` : '';
      const dedupeKey = idKey || (emailKey ? `email:${emailKey}` : `idx:${idx}`);
      if (seen.has(dedupeKey) || (emailKey && seen.has(`email:${emailKey}`))) {
        return false;
      }
      seen.add(dedupeKey);
      if (emailKey) seen.add(`email:${emailKey}`);
      return true;
    });
  }, [users, selectedSchoolId, schools, teacherSearchQuery]);

  // Count active rooms in selected school
  const schoolRoomsCount = useMemo(() => {
    if (!rooms) return 0;
    return rooms.filter(
      (r) => !r.schoolId || r.schoolId === selectedSchoolId
    ).length;
  }, [rooms, selectedSchoolId]);

  // Auto-detect school when user enters email
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    const trimmed = newEmail.trim().toLowerCase();
    if (trimmed.length > 3) {
      const matchedUser = users.find((u) => u.email.toLowerCase() === trimmed);
      if (matchedUser && matchedUser.schoolId && matchedUser.schoolId !== selectedSchoolId) {
        setSelectedSchoolId(matchedUser.schoolId);
        switchSchool(matchedUser.schoolId);
        return;
      }

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
      setErrorMessage('Por favor, informe seu e-mail institucional.');
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
    setPassword('');
    setErrorMessage(null);

    if (user.schoolId && user.schoolId !== selectedSchoolId) {
      setSelectedSchoolId(user.schoolId);
      switchSchool(user.schoolId);
    }
    setAuthViewTab('LOGIN');
  };

  const handleGoogleQuickLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const googleRes = await signInWithGooglePopup();

      if (googleRes.success && googleRes.user && googleRes.user.email) {
        const verifiedGoogleEmail = googleRes.user.email.trim().toLowerCase();

        const loggedUser = loginWithGoogleEmail(
          verifiedGoogleEmail,
          googleRes.user.displayName || undefined,
          selectedSchoolId,
          activeSelectedSchool?.name
        );

        if (loggedUser.schoolId) {
          switchSchool(loggedUser.schoolId);
        }
        setIsLoading(false);
        return;
      }

      const rawError = (googleRes.error || '').toLowerCase();
      if (rawError.includes('popup-closed-by-user') || rawError.includes('cancelled')) {
        setErrorMessage(
          'Login com o Google não concluído. Selecione sua própria conta Google institucional na janela pop-up.'
        );
      } else if (rawError.includes('popup-blocked')) {
        setErrorMessage(
          'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para este site e tente novamente.'
        );
      } else {
        setErrorMessage(
          googleRes.error ||
            'Não foi possível autenticar com o Google. Por segurança, cada usuário deve acessar com sua conta verificada.'
        );
      }
    } catch (popupErr: any) {
      console.warn('Google popup error:', popupErr);
      setErrorMessage(
        'Erro ao iniciar autenticação Google. Certifique-se de que pop-ups estão permitidos no seu navegador.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Modern High-End Atmospheric Mesh & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-48 left-1/3 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar / Institutional Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between relative z-20 transition-colors">
        <div className="flex items-center space-x-3.5">
          <ReserveLabsLogo variant="horizontal" size="md" theme="dark" />
          <span className="hidden md:inline-block h-5 w-px bg-slate-800" />
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
            <span>Rede Estadual de Educação de Minas Gerais</span>
            <span>·</span>
            <span className="text-slate-500">Gestão de Ambientes Pedagógicos</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <PWAInstallButton variant="login" />

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{schools.length} Escolas Conectadas</span>
          </div>

          {onOpenTutorial && (
            <button
              id="login-tutorial-btn"
              type="button"
              onClick={onOpenTutorial}
              className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white rounded-xl text-xs font-semibold border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Abrir Manual e Tutorial de Uso"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Tutorial</span>
            </button>
          )}

          <button
            id="dev-portal-top-btn"
            type="button"
            onClick={() => setIsDevAuthModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Acesso restrito ao Painel do Desenvolvedor"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Acesso Dev</span>
          </button>
        </div>
      </header>

      {/* Main Showcase & Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden transition-all">
          
          {/* LEFT COLUMN: Modern Institutional Showcase & School Identity */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <div className="space-y-6">
              {/* Brand and Tagline */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 tracking-wide uppercase mb-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Ambiente Digital Integrado</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Agendamento inteligente para laboratórios e salas multiuso.
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Elimine conflitos de horários, organize aulas práticas e visualize a disponibilidade em tempo real para toda a equipe escolar.
                </p>
              </div>

              {/* Active School Identity Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/70 pb-2">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Unidade de Ensino Ativa</span>
                  </span>
                  <span className="text-slate-500 font-mono">
                    INEP {activeSelectedSchool?.inepCode || activeSelectedSchool?.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    {activeSelectedSchool?.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {activeSelectedSchool?.city} · {activeSelectedSchool?.state || 'MG'}
                    </span>
                  </p>
                </div>

                {/* Quick stats for this school */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/60">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Laboratórios</p>
                    <p className="text-sm font-black text-slate-200 mt-0.5">
                      {schoolRoomsCount > 0 ? `${schoolRoomsCount} espaços` : 'Ativos'}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/60">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Professores</p>
                    <p className="text-sm font-black text-slate-200 mt-0.5">
                      {teachersForSelectedSchool.length} docentes
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Features Pillars */}
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-200 font-semibold">Reserva em segundos:</strong>{' '}
                    <span>Escolha dia, turno e horários com conferência em tempo real.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-200 font-semibold">Google Agenda & ICS:</strong>{' '}
                    <span>Sincronize suas aulas práticas direto na sua agenda docente.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-200 font-semibold">Isolamento Seguro:</strong>{' '}
                    <span>Dados protegidos por escola com autenticação institucional.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-200 font-semibold">Baixe como Aplicativo:</strong>{' '}
                    <span>Instale no celular ou PC com abertura direta sem navegador.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom State Notice */}
            <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-[11px] text-slate-500">
              <span>Governo de Minas Gerais</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ambiente Criptografado</span>
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Modern Authentication Form & Quick Staff Directory */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-900/60">
            <div>
              {/* Header with Switcher Tabs */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Acesso Institucional
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Faça login com sua conta institucional para agendar.
                  </p>
                </div>

                {/* Tab Pill Switcher (Interactive segmented buttons) */}
                <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAuthViewTab('LOGIN')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      authViewTab === 'LOGIN'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthViewTab('DIRECTORY')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      authViewTab === 'DIRECTORY'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Ver professores cadastrados nesta escola para seleção rápida"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Docentes</span>
                  </button>
                </div>
              </div>

              {/* 1. School Selector Dropdown */}
              <div className="mb-4 relative">
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Selecione sua Escola:</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-normal">
                    {activeSelectedSchool?.city} · {activeSelectedSchool?.state || 'MG'}
                  </span>
                </label>

                <div className="relative">
                  <button
                    id="login-school-selector-btn"
                    type="button"
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/25">
                        <SchoolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {activeSelectedSchool?.name || 'Selecione sua Escola'}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{activeSelectedSchool?.networkType || 'Estadual'}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-500">
                            INEP {activeSelectedSchool?.inepCode || activeSelectedSchool?.code}
                          </span>
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                        showSchoolDropdown ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showSchoolDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          placeholder="Buscar por nome, cidade ou código INEP..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        {filteredSchools.map((s, idx) => {
                          const isCur = s.id === selectedSchoolId;
                          const schoolKey = s.id ? `school-${s.id}` : `school-idx-${idx}-${s.name || 'item'}`;
                          return (
                            <button
                              key={schoolKey}
                              type="button"
                              onClick={() => handleSelectSchool(s)}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isCur
                                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                                  : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate text-white">{s.name}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {s.city} · {s.state}
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono text-slate-500">
                                    INEP {s.inepCode || s.code}
                                  </span>
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

              {/* Error Message Notice */}
              {errorMessage && (
                <div className="p-3.5 mb-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* VIEW 1: STANDARD CREDENTIALS & GOOGLE LOGIN */}
              {authViewTab === 'LOGIN' && (
                <div className="space-y-4">
                  {/* Google 1-Click Login Button */}
                  <button
                    id="login-google-btn"
                    type="button"
                    onClick={handleGoogleQuickLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-md shadow-white/5 active:scale-[0.99] disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Entrar com Google Institucional (@educacao.mg.gov.br)</span>
                  </button>

                  {/* Elegant Divider */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                      <span className="bg-slate-900/90 px-3">ou credenciais de e-mail</span>
                    </div>
                  </div>

                  {/* Credentials Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                    {/* Email Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        E-mail Institucional:
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
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
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
                          placeholder="Digite sua senha cadastrada"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>
                        {isLoading
                          ? 'Autenticando...'
                          : `Entrar no ${activeSelectedSchool?.shortName || 'ReserveLabs'}`}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 2: STAFF DIRECTORY & QUICK TEST ACCESS */}
              {authViewTab === 'DIRECTORY' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      Corpo Docente da Escola ({teachersForSelectedSchool.length})
                    </span>
                    <span className="text-[10px]">Clique para preencher e-mail</span>
                  </div>

                  {/* Filter docentes */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                      placeholder="Filtrar por nome, e-mail ou disciplina..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Staff List */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {teachersForSelectedSchool.map((user, idx) => {
                      const isSelected = email.toLowerCase() === user.email.toLowerCase();
                      const isAdmin = user.role === 'ADMIN';
                      const userKey = user.id
                        ? `teacher-${user.id}`
                        : `teacher-${user.email || idx}`;

                      return (
                        <button
                          key={userKey}
                          type="button"
                          onClick={() => handleSelectQuickUser(user)}
                          className={`w-full flex items-center space-x-2.5 p-2 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-950/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                              : 'bg-slate-950/80 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
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
                              <p className="text-xs font-bold text-white truncate">{user.name}</p>
                              {isAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {user.subject || 'Docente'} ·{' '}
                              <span className="font-mono text-slate-500">
                                {user.email.split('@')[0]}
                              </span>
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-blue-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      );
                    })}

                    {teachersForSelectedSchool.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/50 rounded-2xl">
                        Nenhum docente encontrado para esta busca.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Security Guidance */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Acesso seguro com perfil docente exclusivo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Ajuda / Suporte
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 text-slate-500 text-[11px] py-3 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <div>
          <span>Secretaria de Estado de Educação de Minas Gerais · Sistema Multi-Escolas</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>RESERVE LABS v3.0</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setIsDevAuthModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-mono hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Code2 className="w-3 h-3" />
            <span>Console do Desenvolvedor</span>
          </button>
        </div>
      </footer>

      {/* Password & First Access Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                  Para todos os novos professores e gestores cadastrados, a senha padrão é:
                </p>
                <div className="p-2 bg-blue-950/50 border border-blue-500/30 rounded-xl text-center">
                  <code className="text-blue-300 font-mono font-black text-sm">educacao123</code>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white">2. Como Alterar sua Senha</span>
                <p className="text-slate-400">
                  Após entrar no sistema, clique na sua foto no canto superior direito e selecione{' '}
                  <strong>"Alterar Minha Senha"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-white">3. Esqueci Minha Senha</span>
                <p className="text-slate-400">
                  Solicite ao gestor / administrador da sua escola que redefina sua senha no Painel
                  Administrativo.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Entendi / Fechar
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
