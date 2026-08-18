/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { Reservation } from './types';
import { Plus, Shield, Calendar, Layers, Sparkles, School, AlertCircle } from 'lucide-react';

function ReserveAppContent() {
  const { currentUser, isAdmin } = useAuth();
  const { announcements } = useReservations();

  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'SCHEDULE' | 'MY_RESERVATIONS' | 'ADMIN' | 'ANNOUNCEMENTS'
  >('SCHEDULE');

  // Modals state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isGoogleLoginModalOpen, setIsGoogleLoginModalOpen] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState<{
    roomId?: string;
    date?: string;
    periodId?: string;
  }>({});
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [receiptReservation, setReceiptReservation] = useState<Reservation | null>(null);

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

  const criticalAnnouncements = announcements.filter((a) => a.important);

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
            <span>Sistema Escolar de Agendamento de Salas e Laboratórios</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>Autenticação Google Workspace</span>
            <span className="text-slate-600">•</span>
            <span>Secretaria de Estado de Educação</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
