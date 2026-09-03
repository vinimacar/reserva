/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReservationProvider, useReservations } from './context/ReservationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { WeeklyScheduleGrid } from './components/WeeklyScheduleGrid';
import { MyReservationsView } from './components/MyReservationsView';
import { AdminPanel } from './components/AdminPanel';
import { AnnouncementsView } from './components/AnnouncementsView';
import { ReservationModal } from './components/ReservationModal';
import { ReservationDetailsModal } from './components/ReservationDetailsModal';
import { ReservationReceiptModal } from './components/ReservationReceiptModal';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { SchoolSetupModal } from './components/SchoolSetupModal';
import { UserRegistrationModal } from './components/UserRegistrationModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DeveloperAuthModal } from './components/DeveloperAuthModal';
import { DeveloperPortal } from './components/DeveloperPortal';
import { LoginScreen } from './components/LoginScreen';
import { TutorialModal } from './components/TutorialModal';
import { Reservation } from './types';
import { School, Terminal } from 'lucide-react';

function ReserveAppContent() {
  const { currentUser, isAdmin, isDeveloperMode } = useAuth();
  const { settings, switchSchool } = useReservations();

  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS'
  >('SCHEDULE');

  // Developer Portal state
  const [showDeveloperPortal, setShowDeveloperPortal] = useState(false);
  const [isDevAuthModalOpen, setIsDevAuthModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  // Modals state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isGoogleLoginModalOpen, setIsGoogleLoginModalOpen] = useState(false);
  const [isUserRegistrationModalOpen, setIsUserRegistrationModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSchoolSetupModalOpen, setIsSchoolSetupModalOpen] = useState<boolean>(() => {
    // If not configured in settings and not saved in localStorage, open on first use
    const isConfiguredInStorage = localStorage.getItem('reserve_school_configured');
    return !settings.isConfigured && !isConfiguredInStorage;
  });

  const [selectedSlotData, setSelectedSlotData] = useState<{
    roomId?: string;
    date?: string;
    periodId?: string;
  }>({});
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [receiptReservation, setReceiptReservation] = useState<Reservation | null>(null);

  // Check if school setup is required on mount or if settings change
  useEffect(() => {
    const isConfiguredInStorage = localStorage.getItem('reserve_school_configured');
    if (!settings.isConfigured && !isConfiguredInStorage) {
      setIsSchoolSetupModalOpen(true);
    }
  }, [settings.isConfigured]);

  // Handlers
  const handleOpenSlotBooking = (roomId: string, date: string, periodId: string) => {
    setSelectedSlotData({ roomId, date, periodId });
    setIsReservationModalOpen(true);
  };

  const handleOpenNewReservationGeneral = () => {
    setSelectedSlotData({});
    setIsReservationModalOpen(true);
  };

  const handleSelectReservation = (reservation: Reservation) => {
    setViewingReservation(reservation);
  };

  const handleOpenReceipt = (reservation: Reservation) => {
    setReceiptReservation(reservation);
  };

  const isFirstTimeSetup = !settings.isConfigured && !localStorage.getItem('reserve_school_configured');

  // If Developer Portal is explicitly open or developer mode is active
  if (showDeveloperPortal || isDeveloperMode) {
    return (
      <DeveloperPortal
        onBackToApp={() => {
          setShowDeveloperPortal(false);
        }}
        onSelectClientToView={(schoolId) => {
          switchSchool(schoolId);
          setShowDeveloperPortal(false);
        }}
      />
    );
  }

  // If user is not authenticated, show the Login Screen with Developer Access option
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onOpenDeveloperPortal={() => setShowDeveloperPortal(true)}
          onOpenTutorial={() => setIsTutorialModalOpen(true)}
        />
        <DeveloperAuthModal
          isOpen={isDevAuthModalOpen}
          onClose={() => setIsDevAuthModalOpen(false)}
          onSuccess={() => {
            setIsDevAuthModalOpen(false);
            setShowDeveloperPortal(true);
          }}
        />
        <TutorialModal
          isOpen={isTutorialModalOpen}
          onClose={() => setIsTutorialModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'ADMIN' && !isAdmin) {
            alert('Acesso restrito a administradores e coordenadores.');
            return;
          }
          setCurrentView(view);
        }}
        onOpenNewReservation={handleOpenNewReservationGeneral}
        onOpenGoogleLogin={() => setIsGoogleLoginModalOpen(true)}
        onOpenAnnouncements={() => setCurrentView('ANNOUNCEMENTS')}
        onOpenSchoolSettings={() => setIsSchoolSetupModalOpen(true)}
        onOpenRegisterTeacher={() => setIsUserRegistrationModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenDeveloperPortal={() => setShowDeveloperPortal(true)}
        onOpenTutorial={() => setIsTutorialModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Dynamic Views */}
        {currentView === 'SCHEDULE' && (
          <WeeklyScheduleGrid
            onSelectSlot={handleOpenSlotBooking}
            onSelectReservation={handleSelectReservation}
          />
        )}

        {currentView === 'MY_RESERVATIONS' && (
          <MyReservationsView
            onOpenNewReservation={handleOpenNewReservationGeneral}
            onSelectReservation={handleSelectReservation}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {currentView === 'ADMIN' && (
          <AdminPanel
            onSelectReservation={handleSelectReservation}
            onOpenReceipt={handleOpenReceipt}
            onOpenSchoolSettings={() => setIsSchoolSetupModalOpen(true)}
          />
        )}

        {currentView === 'ANNOUNCEMENTS' && (
          <AnnouncementsView onOpenNewReservation={handleOpenNewReservationGeneral} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <School className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">RESERVE</span>
            <span className="text-slate-500">•</span>
            <span>{settings.schoolName}</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>Autenticação Google Workspace</span>
            <span className="text-slate-600">•</span>
            <span>Secretaria de Estado de Educação</span>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => setShowDeveloperPortal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Terminal className="w-3 h-3" />
              <span>Console Dev</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SchoolSetupModal
        isOpen={isSchoolSetupModalOpen}
        onClose={() => setIsSchoolSetupModalOpen(false)}
        isFirstTime={isFirstTimeSetup}
      />

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        initialRoomId={selectedSlotData.roomId}
        initialDate={selectedSlotData.date}
        initialPeriodId={selectedSlotData.periodId}
      />

      <ReservationDetailsModal
        isOpen={!!viewingReservation}
        reservation={viewingReservation}
        onClose={() => setViewingReservation(null)}
        onOpenReceipt={handleOpenReceipt}
      />

      <ReservationReceiptModal
        isOpen={!!receiptReservation}
        reservation={receiptReservation}
        onClose={() => setReceiptReservation(null)}
      />

      <GoogleLoginModal
        isOpen={isGoogleLoginModalOpen}
        onClose={() => setIsGoogleLoginModalOpen(false)}
        onOpenRegister={() => {
          setIsGoogleLoginModalOpen(false);
          setIsUserRegistrationModalOpen(true);
        }}
      />

      <UserRegistrationModal
        isOpen={isUserRegistrationModalOpen}
        onClose={() => setIsUserRegistrationModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <DeveloperAuthModal
        isOpen={isDevAuthModalOpen}
        onClose={() => setIsDevAuthModalOpen(false)}
        onSuccess={() => {
          setIsDevAuthModalOpen(false);
          setShowDeveloperPortal(true);
        }}
      />

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReservationProvider>
          <ReserveAppContent />
        </ReservationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
