import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Reservation,
  Room,
  TimePeriod,
  Announcement,
  SchoolSettings,
  ShiftType,
  ReservationStatus,
  RoomStats,
} from '../types';
import {
  DEFAULT_ROOMS,
  TIME_PERIODS,
  DEFAULT_RESERVATIONS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_SETTINGS,
} from '../data/initialData';
import { useAuth } from './AuthContext';

interface ConflictResult {
  hasConflict: boolean;
  conflictingReservation?: Reservation;
  conflictingPeriodName?: string;
  message?: string;
}

interface ReservationContextType {
  reservations: Reservation[];
  rooms: Room[];
  periods: TimePeriod[];
  announcements: Announcement[];
  settings: SchoolSettings;
  selectedRoomId: string;
  selectedDate: string; // ISO YYYY-MM-DD
  selectedShift: ShiftType | 'ALL';
  searchQuery: string;
  setSelectedRoomId: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedShift: (shift: ShiftType | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  // Reservation Actions
  addReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'roomName' | 'userName' | 'userEmail' | 'periodLabels'>) => { success: boolean; error?: string; reservation?: Reservation };
  updateReservation: (id: string, data: Partial<Reservation>) => boolean;
  cancelReservation: (id: string, reason?: string) => void;
  deleteReservation: (id: string) => void;
  approveReservation: (id: string, note?: string) => void;
  rejectReservation: (id: string, note?: string) => void;
  // Room Actions
  addRoom: (roomData: Omit<Room, 'id'>) => Room;
  updateRoom: (id: string, roomData: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  // Announcement Actions
  addAnnouncement: (data: Omit<Announcement, 'id' | 'date'>) => void;
  deleteAnnouncement: (id: string) => void;
  // Settings Actions
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  // Conflict Checking
  checkConflict: (roomId: string, date: string, periodIds: string[], excludeReservationId?: string) => ConflictResult;
  getReservationsForSlot: (roomId: string, date: string, periodId: string) => Reservation | undefined;
  // Stats
  getRoomStats: () => RoomStats[];
  getTeacherStats: () => { teacherName: string; count: number; email: string }[];
  resetToDefaultData: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

const STORAGE_KEY_RES = 'reserve_school_reservations';
const STORAGE_KEY_ROOMS = 'reserve_school_rooms';
const STORAGE_KEY_ANN = 'reserve_school_announcements';
const STORAGE_KEY_SETTINGS = 'reserve_school_settings';

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_RESERVATIONS;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_ROOMS;
  });

  const [periods] = useState<TimePeriod[]>(TIME_PERIODS);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ANN);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // UI state
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => DEFAULT_ROOMS[0]?.id || 'room_info_1');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RES, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANN, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Conflict detection
  const checkConflict = (
    roomId: string,
    date: string,
    periodIds: string[],
    excludeReservationId?: string
  ): ConflictResult => {
    const activeReservations = reservations.filter(
      (r) =>
        r.roomId === roomId &&
        r.date === date &&
        r.status !== 'CANCELLED' &&
        (!excludeReservationId || r.id !== excludeReservationId)
    );

    for (const r of activeReservations) {
      for (const pId of periodIds) {
        if (r.periodIds.includes(pId)) {
          const period = periods.find((p) => p.id === pId);
          return {
            hasConflict: true,
            conflictingReservation: r,
            conflictingPeriodName: period ? `${period.name} (${period.startTime} - ${period.endTime})` : pId,
            message: `A ${period?.name || 'aula'} já está reservada por ${r.userName} (${r.turma} - ${r.disciplina}).`,
          };
        }
      }
    }

    return { hasConflict: false };
  };

  const getReservationsForSlot = (roomId: string, date: string, periodId: string): Reservation | undefined => {
    return reservations.find(
      (r) =>
        r.roomId === roomId &&
        r.date === date &&
        r.status !== 'CANCELLED' &&
        r.periodIds.includes(periodId)
    );
  };

  const addReservation = (
    data: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'roomName' | 'userName' | 'userEmail' | 'periodLabels'>
  ) => {
    if (!currentUser) {
      return { success: false, error: 'Você precisa estar autenticado com uma conta Google.' };
    }

    const room = rooms.find((r) => r.id === data.roomId);
    if (!room) {
      return { success: false, error: 'Ambiente ou laboratório não encontrado.' };
    }

    if (room.status === 'MAINTENANCE') {
      return { success: false, error: 'Este laboratório está temporariamente em manutenção.' };
    }

    if (room.status === 'INACTIVE') {
      return { success: false, error: 'Este espaço está desativado.' };
    }

    // Check conflict
    const conflict = checkConflict(data.roomId, data.date, data.periodIds);
    if (conflict.hasConflict) {
      return { success: false, error: conflict.message || 'Conflito de horário: este período já está ocupado.' };
    }

    // Format period labels
    const selectedPeriods = periods.filter((p) => data.periodIds.includes(p.id));
    selectedPeriods.sort((a, b) => a.number - b.number);
    const periodNumbers = selectedPeriods.map((p) => p.number);
    const startHour = selectedPeriods[0]?.startTime || '07:00';
    const endHour = selectedPeriods[selectedPeriods.length - 1]?.endTime || '12:20';
    
    let periodLabels = '';
    if (selectedPeriods.length === 1) {
      periodLabels = `${selectedPeriods[0].name} (${selectedPeriods[0].startTime} - ${selectedPeriods[0].endTime})`;
    } else {
      periodLabels = `${selectedPeriods.map((p) => `${p.number}ª`).join(' e ')} Aula (${startHour} - ${endHour})`;
    }

    const initialStatus: ReservationStatus = settings.requireAdminApproval && !isAdmin ? 'PENDING' : 'CONFIRMED';

    const newReservation: Reservation = {
      ...data,
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomName: room.name,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userAvatar: currentUser.avatar,
      periodNumbers,
      periodLabels,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [newReservation, ...prev]);
    return { success: true, reservation: newReservation };
  };

  const updateReservation = (id: string, data: Partial<Reservation>): boolean => {
    const existing = reservations.find((r) => r.id === id);
    if (!existing) return false;

    // If changing room, date or periods, check conflict
    const roomId = data.roomId || existing.roomId;
    const date = data.date || existing.date;
    const periodIds = data.periodIds || existing.periodIds;

    if (data.roomId || data.date || data.periodIds) {
      const conflict = checkConflict(roomId, date, periodIds, id);
      if (conflict.hasConflict) {
        return false;
      }
    }

    const updated = { ...existing, ...data };
    setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return true;
  };

  const cancelReservation = (id: string, reason?: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CANCELLED',
              adminNote: reason ? `Cancelado: ${reason}` : r.adminNote,
            }
          : r
      )
    );
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const approveReservation = (id: string, note?: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CONFIRMED',
              adminNote: note || 'Aprovado pela Coordenação',
            }
          : r
      )
    );
  };

  const rejectReservation = (id: string, note?: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CANCELLED',
              adminNote: note ? `Não aprovado: ${note}` : 'Reserva não aprovada pela administração.',
            }
          : r
      )
    );
  };

  // Room Actions
  const addRoom = (roomData: Omit<Room, 'id'>): Room => {
    const newRoom: Room = {
      ...roomData,
      id: `room_${Date.now()}`,
    };
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (id: string, roomData: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...roomData };
          // If name changed, update reservations
          if (roomData.name && roomData.name !== r.name) {
            setReservations((resList) =>
              resList.map((res) => (res.roomId === id ? { ...res, roomName: roomData.name! } : res))
            );
          }
          return updated;
        }
        return r;
      })
    );
  };

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoomId === id && rooms.length > 1) {
      const remaining = rooms.filter((r) => r.id !== id);
      setSelectedRoomId(remaining[0]?.id || '');
    }
  };

  // Announcement Actions
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'date'>) => {
    const newAnn: Announcement = {
      ...data,
      id: `ann_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Settings
  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Stats
  const getRoomStats = (): RoomStats[] => {
    return rooms.map((room) => {
      const roomRes = reservations.filter((r) => r.roomId === room.id && r.status !== 'CANCELLED');
      const totalBookings = roomRes.length;

      // Calculate shift distribution
      const shiftsCount = { MANHA: 0, TARDE: 0, NOITE: 0 };
      roomRes.forEach((r) => {
        shiftsCount[r.shift] = (shiftsCount[r.shift] || 0) + 1;
      });

      let popularShift: ShiftType = 'MANHA';
      if (shiftsCount.TARDE > shiftsCount.MANHA && shiftsCount.TARDE > shiftsCount.NOITE) {
        popularShift = 'TARDE';
      } else if (shiftsCount.NOITE > shiftsCount.MANHA) {
        popularShift = 'NOITE';
      }

      // Simple occupancy approximation (out of ~30 weekly available slot blocks)
      const occupancyRate = Math.min(100, Math.round((totalBookings / 15) * 100));

      return {
        roomId: room.id,
        roomName: room.name,
        totalBookings,
        occupancyRate,
        popularShift,
      };
    });
  };

  const getTeacherStats = () => {
    const map = new Map<string, { count: number; email: string }>();
    reservations
      .filter((r) => r.status !== 'CANCELLED')
      .forEach((r) => {
        const current = map.get(r.userName) || { count: 0, email: r.userEmail };
        map.set(r.userName, { count: current.count + 1, email: r.userEmail });
      });

    return Array.from(map.entries())
      .map(([teacherName, data]) => ({ teacherName, count: data.count, email: data.email }))
      .sort((a, b) => b.count - a.count);
  };

  const resetToDefaultData = () => {
    setReservations(DEFAULT_RESERVATIONS);
    setRooms(DEFAULT_ROOMS);
    setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_RES);
    localStorage.removeItem(STORAGE_KEY_ROOMS);
    localStorage.removeItem(STORAGE_KEY_ANN);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        rooms,
        periods,
        announcements,
        settings,
        selectedRoomId,
        selectedDate,
        selectedShift,
        searchQuery,
        setSelectedRoomId,
        setSelectedDate,
        setSelectedShift,
        setSearchQuery,
        addReservation,
        updateReservation,
        cancelReservation,
        deleteReservation,
        approveReservation,
        rejectReservation,
        addRoom,
        updateRoom,
        deleteRoom,
        addAnnouncement,
        deleteAnnouncement,
        updateSettings,
        checkConflict,
        getReservationsForSlot,
        getRoomStats,
        getTeacherStats,
        resetToDefaultData,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
};
