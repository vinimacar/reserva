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
  Sparkles,
  School,
  CheckCircle2,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentView: 'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS';
  onViewChange: (view: 'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS') => void;
  onOpenNewReservation: () => void;
  onOpenGoogleLogin: () => void;
  onOpenAnnouncements: () => void;
  onOpenSchoolSettings?: () => void;
  onOpenRegisterTeacher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewReservation,
  onOpenGoogleLogin,
  onOpenAnnouncements,
  onOpenSchoolSettings,
  onOpenRegisterTeacher,
}) => {
  const { currentUser, isAdmin, toggleRole, logout } = useAuth();
  const { announcements, settings } = useReservations();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const importantAnnouncementsCount = announcements.filter((a) => a.important).length;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3">
            <button
              id="header-logo-btn"
              onClick={() => onViewChange('SCHEDULE')}
              className="flex items-center space-x-2 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-black tracking-tight text-white font-mono">RESERVE</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                    LABS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-[200px] md:max-w-[280px]">
                  {settings.shortName || settings.schoolName.split('-')[0]}
                </p>
              </div>
            </button>

            {onOpenSchoolSettings && (
              <button
                id="header-school-settings-btn"
                onClick={onOpenSchoolSettings}
                className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Configurar informações da escola"
              >
                <School className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate max-w-[130px]">{settings.city ? `${settings.city} - ${settings.state || 'MG'}` : 'Configurar'}</span>
                <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-schedule-btn"
              onClick={() => onViewChange('SCHEDULE')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'SCHEDULE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Grade de Horários</span>
            </button>

            <button
              id="nav-my-reservations-btn"
              onClick={() => onViewChange('MY_RESERVATIONS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'MY_RESERVATIONS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Minhas Reservas</span>
            </button>

            <button
              id="nav-announcements-btn"
              onClick={() => onViewChange('ANNOUNCEMENTS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                currentView === 'ANNOUNCEMENTS'
                  ? 'bg-blue-600 text-white shadow-sm'
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
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'ADMIN'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Painel Admin</span>
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

            {/* User Google Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 px-2.5 rounded-xl transition-all text-left focus:outline-none"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-600"
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
                  <div
                    id="profile-dropdown"
                    className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* User Info Card */}
                    <div className="p-3 bg-slate-800/80 rounded-xl mb-2 border border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-full border-2 border-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                          <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <img
                              src="https://www.google.com/favicon.ico"
                              alt="Google"
                              className="w-3 h-3 inline-block opacity-80"
                            />
                            <span className="text-[11px] text-blue-400 font-medium">Conta Google Conectada</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role quick toggle */}
                    <div className="px-2 py-1 mb-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          Perfil Atual:
                        </span>
                        <button
                          id="toggle-role-btn"
                          onClick={() => {
                            toggleRole();
                            setShowProfileMenu(false);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                          }`}
                          title="Alternar entre perfil de Professor e Administrador para testes"
                        >
                          {currentUser.role === 'ADMIN' ? '👑 Administrador' : '👨‍🏫 Professor'}
                          <span className="text-[10px] ml-1 opacity-70 underline">(Alternar)</span>
                        </button>
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

                    {/* Quick navigation options */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          onViewChange('MY_RESERVATIONS');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors"
                      >
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>Minhas Reservas Agendadas</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onViewChange('ADMIN');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 text-left transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Painel da Coordenação / Admin</span>
                        </button>
                      )}

                      {onOpenSchoolSettings && (
                        <button
                          id="profile-school-settings-btn"
                          onClick={() => {
                            onOpenSchoolSettings();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors"
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
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-950/40 text-left transition-colors"
                        >
                          <UserPlus className="w-4 h-4 text-blue-400" />
                          <span>+ Cadastrar Novo Professor</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenGoogleLogin();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        <span>Trocar Conta Google Escolar</span>
                      </button>
                    </div>

                    <div className="h-px bg-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 text-left transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenGoogleLogin}
                className="flex items-center space-x-2 bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold shadow transition-all"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span>Entrar com Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => onViewChange('SCHEDULE')}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-lg ${
              currentView === 'SCHEDULE' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Grade</span>
          </button>
          <button
            onClick={() => onViewChange('MY_RESERVATIONS')}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-lg ${
              currentView === 'MY_RESERVATIONS' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Minhas</span>
          </button>
          <button
            onClick={() => onViewChange('ANNOUNCEMENTS')}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-lg ${
              currentView === 'ANNOUNCEMENTS' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Avisos</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => onViewChange('ADMIN')}
              className={`flex items-center space-x-1 py-1 px-2.5 rounded-lg ${
                currentView === 'ADMIN' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
