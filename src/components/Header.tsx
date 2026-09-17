import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  PlusCircle,
  Shield,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronDown,
  School,
  Settings,
  Sun,
  Moon,
  Monitor,
  UserPlus,
  KeyRound,
  GraduationCap,
  Terminal,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { TeacherAvatar } from './TeacherAvatar';
import { isOwnerEmail } from '../services/totp';
import { ReserveLabsLogo } from './ReserveLabsLogo';

interface HeaderProps {
  currentView: 'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS';
  onViewChange: (view: 'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS') => void;
  onOpenNewReservation: () => void;
  onOpenGoogleLogin: () => void;
  onOpenAnnouncements: () => void;
  onOpenSchoolSettings?: () => void;
  onOpenRegisterTeacher?: () => void;
  onOpenChangePassword?: () => void;
  onOpenDeveloperPortal?: () => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewReservation,
  onOpenGoogleLogin,
  onOpenAnnouncements,
  onOpenSchoolSettings,
  onOpenRegisterTeacher,
  onOpenChangePassword,
  onOpenDeveloperPortal,
  onOpenTutorial,
}) => {
  const { currentUser, isAdmin, isDeveloperMode, logout, pendingApprovalUsers } = useAuth();
  const isOwner = isOwnerEmail(currentUser?.email);
  const { reservations, announcements, settings, schools, currentSchool, currentSchoolId, switchSchool } = useReservations();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSchoolSwitcher, setShowSchoolSwitcher] = useState(false);

  const importantAnnouncementsCount = (announcements || []).filter((a) => a && a.important).length;
  const activeSchoolLogo = currentSchool?.logoUrl || settings?.logoUrl;
  const totalReservationsCount = (reservations || []).length;
  const pendingReservationsCount = (reservations || []).filter((r) => r && r.status === 'PENDING').length;
  const pendingTeachersCount = (pendingApprovalUsers || []).length;
  const totalPendingAlerts = pendingReservationsCount + pendingTeachersCount;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3 relative">
            <button
              id="header-logo-btn"
              onClick={() => onViewChange('SCHEDULE')}
              className="flex items-center space-x-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform">
                <ReserveLabsLogo variant="icon" size="sm" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-black tracking-tight text-white font-mono">RESERVE</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-extrabold shadow-2xs">
                    LABS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-[180px] md:max-w-[240px]">
                  {currentSchool?.name || settings.shortName || settings.schoolName.split('-')[0]}
                </p>
              </div>
            </button>

            {/* School Switcher / Indicator Button */}
            <div className="relative">
              <button
                id="header-school-switcher-btn"
                onClick={() => setShowSchoolSwitcher(!showSchoolSwitcher)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
                title="Clique para alternar de escola ou ver unidades da rede"
              >
                {activeSchoolLogo ? (
                  <div className="w-4 h-4 rounded bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={activeSchoolLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <School className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="truncate max-w-[110px] md:max-w-[150px] font-semibold">
                  {currentSchool?.city ? `${currentSchool.city} - ${currentSchool.state || 'MG'}` : (settings.city ? `${settings.city} - ${settings.state || 'MG'}` : 'Rede de Escolas')}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSchoolSwitcher ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              {/* School Switcher Dropdown */}
              {showSchoolSwitcher && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
                    onClick={() => setShowSchoolSwitcher(false)}
                  />
                  <div className="fixed sm:absolute left-3 sm:left-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in">
                    <div className="p-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Rede de Ensino ({schools.length} Escolas)
                        </p>
                        <p className="text-xs font-semibold text-slate-300">
                          Alternar Unidade Escolar:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSchoolSwitcher(false)}
                        className="sm:hidden p-1 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                    {schools.map((s) => {
                      const isCur = s.id === currentSchoolId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            switchSchool(s.id);
                            setShowSchoolSwitcher(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center space-x-2.5 text-xs transition-colors cursor-pointer ${
                            isCur
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                              : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white p-0.5 shrink-0 flex items-center justify-center border border-slate-700 overflow-hidden">
                            {s.logoUrl ? (
                              <img
                                src={s.logoUrl}
                                alt={s.name}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <School className="w-4 h-4 text-slate-700" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate text-white">{s.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {s.city} - {s.state || 'MG'} • INEP: {s.inepCode || s.code}
                            </p>
                          </div>
                          {isCur && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAdmin && (
                    <div className="pt-2 mt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onViewChange('ADMIN');
                          setShowSchoolSwitcher(false);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-amber-400 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Gerenciar Escolas & Responsáveis</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-schedule-btn"
              onClick={() => onViewChange('SCHEDULE')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'SCHEDULE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Grade de Horários</span>
            </button>

            <button
              id="nav-my-reservations-btn"
              onClick={() => onViewChange('MY_RESERVATIONS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'MY_RESERVATIONS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Minhas Reservas</span>
            </button>

            <button
              id="nav-announcements-btn"
              onClick={() => onViewChange('ANNOUNCEMENTS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                currentView === 'ANNOUNCEMENTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Avisos</span>
              {importantAnnouncementsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            {isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => onViewChange('ADMIN')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'ADMIN'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title={`Painel da Coordenação / Admin • ${totalReservationsCount} reserva(s)${pendingReservationsCount > 0 ? ` (${pendingReservationsCount} reserva(s) pendente(s))` : ''}${pendingTeachersCount > 0 ? ` (${pendingTeachersCount} professor(es) aguardando liberação)` : ''}`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Painel Admin</span>
                {totalPendingAlerts > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                    {totalPendingAlerts} pendente{totalPendingAlerts > 1 ? 's' : ''}
                  </span>
                ) : totalReservationsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-bold text-[10px]">
                    {totalReservationsCount}
                  </span>
                ) : null}
              </button>
            )}
          </nav>

          {/* Right Action & User Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Dark/Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shadow-xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300'
              }`}
              title={isDark ? 'Tema Escuro ativo • Clique para Modo Claro' : 'Tema Claro ativo • Clique para Modo Escuro'}
              aria-label={isDark ? 'Mudar para Tema Claro' : 'Mudar para Modo Escuro'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-amber-800 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Tutorial / Manual PDF Button */}
            {onOpenTutorial && (
              <button
                id="header-tutorial-btn"
                type="button"
                onClick={onOpenTutorial}
                className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shadow-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700"
                title="Abrir Manual / Tutorial em PDF"
                aria-label="Abrir Tutorial"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            {/* Quick Developer Portal Button - Restricted strictly to isOwner (vinicius.machado.carvalho@educacao.mg.gov.br) */}
            {isOwner && onOpenDeveloperPortal && (
              <button
                id="header-quick-dev-portal-btn"
                type="button"
                onClick={onOpenDeveloperPortal}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white text-xs font-bold transition-all border border-indigo-500/40 shadow-xs cursor-pointer"
                title="Abrir Console do Desenvolvedor (Exclusivo Vinicius Carvalho)"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Console Dev</span>
              </button>
            )}

            {/* Quick New Reservation Button */}
            <button
              id="header-new-reservation-btn"
              onClick={onOpenNewReservation}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Reserva</span>
              <span className="sm:hidden">Reservar</span>
            </button>

            {/* User Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 px-2.5 rounded-xl transition-all text-left focus:outline-none cursor-pointer"
                >
                  <TeacherAvatar
                    avatar={currentUser.avatar}
                    name={currentUser.name}
                    subject={currentUser.subject}
                    role={currentUser.role}
                    size="sm"
                    showRoleBadge={true}
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-100 leading-none truncate max-w-[130px]">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-1 py-0.2 rounded leading-tight ${
                          currentUser.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {currentUser.role === 'ADMIN' ? 'ADMINISTRADOR' : 'PROFESSOR'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div
                      id="profile-dropdown"
                      className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                    {/* User Info Card */}
                    <div className="p-3 bg-slate-800/80 rounded-xl mb-2 border border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <TeacherAvatar
                          avatar={currentUser.avatar}
                          name={currentUser.name}
                          subject={currentUser.subject}
                          role={currentUser.role}
                          size="md"
                          showRoleBadge={true}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-[10px] text-blue-400 font-semibold truncate">
                              {currentUser.subject || 'Docente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Theme selector in dropdown */}
                    <div className="p-2 bg-slate-800/90 rounded-xl mb-2 border border-slate-700/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                          {isDark ? (
                            <Moon className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          Tema Visual:
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Auto'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          id="theme-select-light-btn"
                          onClick={() => setTheme('light')}
                          className={`py-1 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Sun className="w-3 h-3" />
                          <span>Claro</span>
                        </button>
                        <button
                          type="button"
                          id="theme-select-dark-btn"
                          onClick={() => setTheme('dark')}
                          className={`py-1 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-blue-600 text-white shadow-xs font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Moon className="w-3 h-3" />
                          <span>Escuro</span>
                        </button>
                        <button
                          type="button"
                          id="theme-select-system-btn"
                          onClick={() => setTheme('system')}
                          className={`py-1 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                            theme === 'system'
                              ? 'bg-slate-700 text-white shadow-xs font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Monitor className="w-3 h-3" />
                          <span>Auto</span>
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800 my-1"></div>

                    {/* Quick navigation & account options */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          onViewChange('MY_RESERVATIONS');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>Minhas Reservas Agendadas</span>
                      </button>

                      {onOpenChangePassword && (
                        <button
                          onClick={() => {
                            onOpenChangePassword();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-emerald-400" />
                          <span>Alterar Senha de Acesso</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onViewChange('ADMIN');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 text-left transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Painel da Coordenação / Admin</span>
                        </button>
                      )}

                      {isAdmin && onOpenSchoolSettings && (
                        <button
                          id="profile-school-settings-btn"
                          onClick={() => {
                            onOpenSchoolSettings();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <School className="w-4 h-4 text-emerald-400" />
                          <span>Configurar Dados da Escola</span>
                        </button>
                      )}

                      {isAdmin && onOpenRegisterTeacher && (
                        <button
                          id="profile-register-teacher-btn"
                          onClick={() => {
                            onOpenRegisterTeacher();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-950/40 text-left transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-blue-400" />
                          <span>+ Cadastrar Novo Professor</span>
                        </button>
                      )}

                      {onOpenTutorial && (
                        <button
                          id="profile-tutorial-btn"
                          onClick={() => {
                            onOpenTutorial();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-950/40 text-left transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Manual / Tutorial de Uso (PDF)</span>
                        </button>
                      )}

                      {isOwner && onOpenDeveloperPortal && (
                        <button
                          id="profile-developer-portal-btn"
                          onClick={() => {
                            onOpenDeveloperPortal();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/50 text-left transition-colors cursor-pointer border-t border-slate-800/80 pt-2.5 mt-1"
                        >
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          <span>Console do Desenvolvedor</span>
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-slate-800 my-1"></div>

                    <button
                      id="profile-logout-btn"
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-white hover:bg-red-600/80 text-left transition-all font-bold cursor-pointer border border-red-500/20"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta (Desconectar)</span>
                    </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenGoogleLogin}
                className="flex items-center space-x-2 bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Entrar no Sistema</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Mobile Navigation Bar for Smartphones */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-bottom shadow-2xl"
      >
        <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
          {/* Grade de Horários */}
          <button
            id="mobile-nav-schedule-btn"
            type="button"
            onClick={() => onViewChange('SCHEDULE')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all cursor-pointer min-h-[48px] ${
              currentView === 'SCHEDULE'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-0.5 transition-transform ${currentView === 'SCHEDULE' ? 'scale-110 text-blue-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Grade</span>
          </button>

          {/* Minhas Reservas */}
          <button
            id="mobile-nav-my-reservations-btn"
            type="button"
            onClick={() => onViewChange('MY_RESERVATIONS')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all cursor-pointer min-h-[48px] ${
              currentView === 'MY_RESERVATIONS'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-5 h-5 mb-0.5 transition-transform ${currentView === 'MY_RESERVATIONS' ? 'scale-110 text-blue-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Minhas</span>
          </button>

          {/* Center Floating Action Button: Nova Reserva */}
          <div className="flex items-center justify-center px-2">
            <button
              id="mobile-nav-new-reservation-btn"
              type="button"
              onClick={onOpenNewReservation}
              className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-slate-900 active:scale-90 transition-transform cursor-pointer"
              title="Criar Nova Reserva"
              aria-label="Criar Nova Reserva"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Avisos */}
          <button
            id="mobile-nav-announcements-btn"
            type="button"
            onClick={() => onViewChange('ANNOUNCEMENTS')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all relative cursor-pointer min-h-[48px] ${
              currentView === 'ANNOUNCEMENTS'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className={`w-5 h-5 mb-0.5 transition-transform ${currentView === 'ANNOUNCEMENTS' ? 'scale-110 text-blue-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Avisos</span>
            {importantAnnouncementsCount > 0 && (
              <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          {/* Admin ou Perfil */}
          {isAdmin ? (
            <button
              id="mobile-nav-admin-btn"
              type="button"
              onClick={() => onViewChange('ADMIN')}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all cursor-pointer min-h-[48px] relative ${
                currentView === 'ADMIN'
                  ? 'text-amber-400 font-bold'
                  : 'text-amber-300/80 hover:text-amber-200'
              }`}
            >
              <div className="relative">
                <Shield className={`w-5 h-5 mb-0.5 transition-transform ${currentView === 'ADMIN' ? 'scale-110 text-amber-400' : ''}`} />
                {totalPendingAlerts > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] animate-pulse">
                    {totalPendingAlerts}
                  </span>
                ) : totalReservationsCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-bold text-[9px]">
                    {totalReservationsCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">Admin</span>
            </button>
          ) : (
            <button
              id="mobile-nav-profile-btn"
              type="button"
              onClick={() => setShowProfileMenu(true)}
              className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 cursor-pointer min-h-[48px]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden mb-0.5 border border-slate-600 flex items-center justify-center">
                <TeacherAvatar avatar={currentUser?.avatar} name={currentUser?.name || ''} size="xs" />
              </div>
              <span className="text-[10px] tracking-tight">Perfil</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
