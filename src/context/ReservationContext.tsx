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
  School,
  User,
} from '../types';
import {
  DEFAULT_ROOMS,
  TIME_PERIODS,
  DEFAULT_RESERVATIONS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_SETTINGS,
  SAMPLE_DEMO_RESERVATIONS,
  SAMPLE_DEMO_ANNOUNCEMENTS,
  DEFAULT_SCHOOLS,
} from '../data/initialData';
import { useAuth } from './AuthContext';

interface ConflictResult {
  hasConflict: boolean;
  conflictingReservation?: Reservation;
  conflictingPeriodName?: string;
  message?: string;
}

interface ReservationContextType {
  // Multi-school properties
  schools: School[];
  currentSchoolId: string;
  currentSchool: School;
  switchSchool: (schoolId: string) => void;
  addSchool: (schoolData: Omit<School, 'id' | 'createdAt'>, createDefaultRooms?: boolean) => School;
  updateSchool: (id: string, schoolData: Partial<School>) => void;
  deleteSchool: (id: string) => boolean;
  assignSchoolAdmin: (schoolId: string, email: string, name?: string) => void;
  removeSchoolAdmin: (schoolId: string, email: string) => void;
  getSchoolTeachers: (schoolId?: string) => User[];

  // Tenant-scoped entities
  reservations: Reservation[];
  allReservations: Reservation[];
  rooms: Room[];
  allRooms: Room[];
  periods: TimePeriod[];
  announcements: Announcement[];
  settings: SchoolSettings;

  // Selected filters & UI state
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
  clearAllReservations: () => void;

  // Room Actions
  addRoom: (roomData: Omit<Room, 'id'>) => Room;
  updateRoom: (id: string, roomData: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  // Announcement Actions
  addAnnouncement: (data: Omit<Announcement, 'id' | 'date'>) => void;
  deleteAnnouncement: (id: string) => void;
  clearAllAnnouncements: () => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;

  // Conflict Checking
  checkConflict: (roomId: string, date: string, periodIds: string[], excludeReservationId?: string) => ConflictResult;
  getReservationsForSlot: (roomId: string, date: string, periodId: string) => Reservation | undefined;

  // Stats
  getRoomStats: () => RoomStats[];
  getTeacherStats: () => { teacherName: string; count: number; email: string }[];
  getNetworkOverviewStats: () => {
    totalSchools: number;
    activeSchools: number;
    totalRooms: number;
    totalReservations: number;
    totalAdmins: number;
  };

  // Production / Data Management
  clearSystemForProduction: () => void;
  loadDemoSampleData: () => void;
  resetToDefaultData: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

const STORAGE_KEY_SCHOOLS = 'reserve_school_schools_list';
const STORAGE_KEY_ACTIVE_SCHOOL = 'reserve_school_active_id';
const STORAGE_KEY_RES = 'reserve_school_reservations';
const STORAGE_KEY_ROOMS = 'reserve_school_rooms';
const STORAGE_KEY_ANN = 'reserve_school_announcements';

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin, users, addUser, updateUserRole } = useAuth();

  // 1. Schools List State
  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHOOLS);
      if (saved) {
        const parsed: School[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SCHOOLS;
  });

  // 2. Active School ID
  const [currentSchoolId, setCurrentSchoolId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_SCHOOL);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos';
  });

  // Get active school object
  const currentSchool: School =
    schools.find((s) => s.id === currentSchoolId) ||
    schools[0] ||
    DEFAULT_SCHOOLS[0];

  // 3. Raw Data Stores (Multi-tenant persisted)
  const [allReservations, setAllReservations] = useState<Reservation[]>(() => {
    try {
      const isCleared = localStorage.getItem('reserve_production_cleared');
      if (isCleared === 'true') {
        const saved = localStorage.getItem(STORAGE_KEY_RES);
        if (saved) return JSON.parse(saved);
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEY_RES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return DEFAULT_RESERVATIONS;
  });

  const [allRooms, setAllRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ROOMS;
  });

  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>(() => {
    try {
      const isCleared = localStorage.getItem('reserve_production_cleared');
      if (isCleared === 'true') {
        const saved = localStorage.getItem(STORAGE_KEY_ANN);
        if (saved) return JSON.parse(saved);
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEY_ANN);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [periods] = useState<TimePeriod[]>(TIME_PERIODS);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SCHOOL, currentSchoolId);
  }, [currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RES, JSON.stringify(allReservations));
  }, [allReservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(allRooms));
  }, [allRooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANN, JSON.stringify(allAnnouncements));
  }, [allAnnouncements]);

  // Derived tenant-scoped slices
  const defaultSchoolId = DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos';

  const rooms: Room[] = allRooms.filter(
    (r) => r.schoolId === currentSchoolId || (!r.schoolId && currentSchoolId === defaultSchoolId)
  );

  const reservations: Reservation[] = allReservations.filter(
    (r) => r.schoolId === currentSchoolId || (!r.schoolId && currentSchoolId === defaultSchoolId)
  );

  const announcements: Announcement[] = allAnnouncements.filter(
    (a) => a.schoolId === currentSchoolId || (!a.schoolId && currentSchoolId === defaultSchoolId)
  );

  // Derived School Settings dynamically generated from the active School tenant
  const settings: SchoolSettings = {
    schoolName: currentSchool.name,
    shortName: currentSchool.shortName,
    city: currentSchool.city,
    state: currentSchool.state,
    inepCode: currentSchool.inepCode || currentSchool.code,
    networkType: currentSchool.networkType,
    shifts: currentSchool.shifts,
    requireAdminApproval: currentSchool.requireAdminApproval || false,
    maxAdvanceDays: currentSchool.maxAdvanceDays || 30,
    allowWeekendBooking: currentSchool.allowWeekendBooking || false,
    contactEmail: currentSchool.contactEmail,
    phone: currentSchool.phone,
    directorName: currentSchool.directorName,
    isConfigured: true,
    configuredAt: currentSchool.createdAt,
  };

  // UI state for active school
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => rooms[0]?.id || 'room_info_1');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // When active school changes, ensure selected room is updated to a room belonging to the new school
  useEffect(() => {
    const schoolRooms = allRooms.filter(
      (r) => r.schoolId === currentSchoolId || (!r.schoolId && currentSchoolId === defaultSchoolId)
    );
    if (schoolRooms.length > 0) {
      const exists = schoolRooms.some((r) => r.id === selectedRoomId);
      if (!exists) {
        setSelectedRoomId(schoolRooms[0].id);
      }
    } else {
      setSelectedRoomId('');
    }
  }, [currentSchoolId, allRooms]);

  // When user logs in, if their user object has a specific schoolId, switch context to that school
  useEffect(() => {
    if (currentUser?.schoolId && currentUser.schoolId !== currentSchoolId) {
      const schoolExists = schools.some((s) => s.id === currentUser.schoolId);
      if (schoolExists) {
        setCurrentSchoolId(currentUser.schoolId);
      }
    }
  }, [currentUser]);

  // School Actions
  const switchSchool = (schoolId: string) => {
    const found = schools.find((s) => s.id === schoolId);
    if (found) {
      setCurrentSchoolId(schoolId);
    }
  };

  const addSchool = (
    schoolData: Omit<School, 'id' | 'createdAt'>,
    createDefaultRooms: boolean = true
  ): School => {
    const newSchoolId = `school_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newSchool: School = {
      ...schoolData,
      id: newSchoolId,
      createdAt: new Date().toISOString(),
      active: true,
      adminEmails: schoolData.adminEmails || [],
    };

    setSchools((prev) => [...prev, newSchool]);

    // Create standard default rooms for this new school if requested
    if (createDefaultRooms) {
      const defaultStandardRooms: Room[] = [
        {
          id: `room_${newSchoolId}_info`,
          schoolId: newSchoolId,
          name: 'Laboratório de Informática & Tecnologia',
          type: 'INFORMATICA',
          capacity: 35,
          location: 'Bloco Principal - Sala 101',
          description: 'Espaço com computadores conectados à internet para atividades pedagógicas digitais.',
          status: 'ACTIVE',
          color: 'blue',
          iconName: 'Monitor',
          responsibleName: schoolData.directorName || 'Coordenação de TI',
          equipment: ['Computadores com Acesso à Internet', 'Projetor Multimídia', 'Quadro Branco'],
          rules: ['Proibido alimentos', 'Desligar equipamentos após o uso'],
        },
        {
          id: `room_${newSchoolId}_ciencias`,
          schoolId: newSchoolId,
          name: 'Laboratório Integrado de Ciências e Biologia',
          type: 'CIENCIAS',
          capacity: 32,
          location: 'Bloco de Laboratórios',
          description: 'Ambiente com bancadas e instrumentos para práticas experimentais de Ciências da Natureza.',
          status: 'ACTIVE',
          color: 'emerald',
          iconName: 'Microscope',
          responsibleName: 'Coordenação de Ciências',
          equipment: ['Microscópios Ópticos', 'Modelos Didáticos Anatômicos', 'Vidrarias Básicas'],
          rules: ['Uso obrigatório de jaleco', 'Manter bancadas limpas e secas'],
        },
        {
          id: `room_${newSchoolId}_maker`,
          schoolId: newSchoolId,
          name: 'Espaço Maker / Multimídia',
          type: 'MAKER',
          capacity: 30,
          location: 'Sala Multiuso',
          description: 'Ambiente flexível para projetos práticos, robótica e exibições audiovisuais.',
          status: 'ACTIVE',
          color: 'amber',
          iconName: 'Cpu',
          responsibleName: 'Coordenação Pedagógica',
          equipment: ['Smart TV / Projetor', 'Kits de Robótica', 'Mesas Modulares'],
          rules: ['Guardar materiais nos respectivos organizadores ao final'],
        },
      ];

      setAllRooms((prev) => [...prev, ...defaultStandardRooms]);
    }

    return newSchool;
  };

  const updateSchool = (id: string, schoolData: Partial<School>) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...schoolData } : s))
    );
  };

  const deleteSchool = (id: string): boolean => {
    if (schools.length <= 1) {
      return false; // Cannot delete the only remaining school
    }

    setSchools((prev) => prev.filter((s) => s.id !== id));
    setAllRooms((prev) => prev.filter((r) => r.schoolId !== id));
    setAllReservations((prev) => prev.filter((res) => res.schoolId !== id));
    setAllAnnouncements((prev) => prev.filter((ann) => ann.schoolId !== id));

    if (currentSchoolId === id) {
      const nextSchool = schools.find((s) => s.id !== id);
      if (nextSchool) {
        setCurrentSchoolId(nextSchool.id);
      }
    }
    return true;
  };

  const assignSchoolAdmin = (schoolId: string, email: string, name?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    // 1. Add email to school's admin list
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          const currentAdmins = s.adminEmails || [];
          if (!currentAdmins.some((e) => e.toLowerCase() === trimmedEmail)) {
            return { ...s, adminEmails: [...currentAdmins, trimmedEmail] };
          }
        }
        return s;
      })
    );

    // 2. Ensure user exists in AuthContext as Admin for this school
    const targetSchool = schools.find((s) => s.id === schoolId);
    const existingUser = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (existingUser) {
      updateUserRole(existingUser.id, 'ADMIN');
    } else {
      addUser({
        name: name || trimmedEmail.split('@')[0].replace('.', ' '),
        email: trimmedEmail,
        role: 'ADMIN',
        schoolId: schoolId,
        schoolName: targetSchool ? targetSchool.name : 'Escola da Rede',
        subject: 'Administrador / Coordenação do Sistema',
      });
    }
  };

  const removeSchoolAdmin = (schoolId: string, email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return {
            ...s,
            adminEmails: (s.adminEmails || []).filter(
              (e) => e.toLowerCase() !== trimmedEmail
            ),
          };
        }
        return s;
      })
    );
  };

  const getSchoolTeachers = (schoolId?: string): User[] => {
    const targetId = schoolId || currentSchoolId;
    return users.filter(
      (u) =>
        u.schoolId === targetId ||
        (!u.schoolId && targetId === defaultSchoolId)
    );
  };

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
      return { success: false, error: 'Você precisa estar autenticado.' };
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

    const initialStatus: ReservationStatus = currentSchool.requireAdminApproval && !isAdmin ? 'PENDING' : 'CONFIRMED';

    const newReservation: Reservation = {
      ...data,
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      schoolId: currentSchoolId,
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

    setAllReservations((prev) => [newReservation, ...prev]);
    return { success: true, reservation: newReservation };
  };

  const updateReservation = (id: string, data: Partial<Reservation>): boolean => {
    const existing = allReservations.find((r) => r.id === id);
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
    setAllReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return true;
  };

  const cancelReservation = (id: string, reason?: string) => {
    setAllReservations((prev) =>
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
    setAllReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const approveReservation = (id: string, note?: string) => {
    setAllReservations((prev) =>
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
    setAllReservations((prev) =>
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
      schoolId: currentSchoolId,
    };
    setAllRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (id: string, roomData: Partial<Room>) => {
    setAllRooms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...roomData };
          if (roomData.name && roomData.name !== r.name) {
            setAllReservations((resList) =>
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
    setAllRooms((prev) => prev.filter((r) => r.id !== id));
    setAllReservations((prev) => prev.filter((r) => r.roomId !== id));
    setAllAnnouncements((prev) => prev.filter((a) => a.targetRoomId !== id));

    setSelectedRoomId((prevId) => {
      if (prevId === id) {
        const remaining = rooms.filter((r) => r.id !== id);
        return remaining[0]?.id || '';
      }
      return prevId;
    });
  };

  // Announcement Actions
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'date'>) => {
    const newAnn: Announcement = {
      ...data,
      id: `ann_${Date.now()}`,
      schoolId: currentSchoolId,
      date: new Date().toISOString().split('T')[0],
    };
    setAllAnnouncements((prev) => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAllAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Settings
  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    // Synchronize to the active school
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === currentSchoolId) {
          return {
            ...s,
            name: newSettings.schoolName || s.name,
            shortName: newSettings.shortName || s.shortName,
            city: newSettings.city || s.city,
            state: newSettings.state || s.state,
            inepCode: newSettings.inepCode || s.inepCode,
            networkType: newSettings.networkType || s.networkType,
            shifts: newSettings.shifts || s.shifts,
            contactEmail: newSettings.contactEmail || s.contactEmail,
            phone: newSettings.phone || s.phone,
            directorName: newSettings.directorName || s.directorName,
            requireAdminApproval: newSettings.requireAdminApproval !== undefined ? newSettings.requireAdminApproval : s.requireAdminApproval,
            maxAdvanceDays: newSettings.maxAdvanceDays || s.maxAdvanceDays,
            allowWeekendBooking: newSettings.allowWeekendBooking !== undefined ? newSettings.allowWeekendBooking : s.allowWeekendBooking,
          };
        }
        return s;
      })
    );
  };

  // Stats
  const getRoomStats = (): RoomStats[] => {
    return rooms.map((room) => {
      const roomRes = reservations.filter((r) => r.roomId === room.id && r.status !== 'CANCELLED');
      const totalBookings = roomRes.length;

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

  const getNetworkOverviewStats = () => {
    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => s.active).length;
    const totalRooms = allRooms.length;
    const totalReservations = allReservations.filter((r) => r.status !== 'CANCELLED').length;
    const adminEmailsSet = new Set<string>();
    schools.forEach((s) => (s.adminEmails || []).forEach((e) => adminEmailsSet.add(e.toLowerCase())));
    users.filter((u) => u.role === 'ADMIN').forEach((u) => adminEmailsSet.add(u.email.toLowerCase()));

    return {
      totalSchools,
      activeSchools,
      totalRooms,
      totalReservations,
      totalAdmins: adminEmailsSet.size,
    };
  };

  const clearAllReservations = () => {
    setAllReservations((prev) => prev.filter((r) => r.schoolId !== currentSchoolId && r.schoolId));
  };

  const clearAllAnnouncements = () => {
    setAllAnnouncements((prev) => prev.filter((a) => a.schoolId !== currentSchoolId && a.schoolId));
  };

  const clearSystemForProduction = () => {
    setAllReservations([]);
    setAllAnnouncements([]);
    localStorage.setItem('reserve_production_cleared', 'true');
  };

  const loadDemoSampleData = () => {
    setAllReservations(SAMPLE_DEMO_RESERVATIONS);
    setAllAnnouncements(SAMPLE_DEMO_ANNOUNCEMENTS);
    localStorage.removeItem('reserve_production_cleared');
  };

  const resetToDefaultData = () => {
    setSchools(DEFAULT_SCHOOLS);
    setCurrentSchoolId(DEFAULT_SCHOOLS[0].id);
    setAllReservations(DEFAULT_RESERVATIONS);
    setAllRooms(DEFAULT_ROOMS);
    setAllAnnouncements(DEFAULT_ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEY_SCHOOLS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SCHOOL);
    localStorage.removeItem(STORAGE_KEY_RES);
    localStorage.removeItem(STORAGE_KEY_ROOMS);
    localStorage.removeItem(STORAGE_KEY_ANN);
  };

  return (
    <ReservationContext.Provider
      value={{
        schools,
        currentSchoolId,
        currentSchool,
        switchSchool,
        addSchool,
        updateSchool,
        deleteSchool,
        assignSchoolAdmin,
        removeSchoolAdmin,
        getSchoolTeachers,
        reservations,
        allReservations,
        rooms,
        allRooms,
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
        clearAllReservations,
        addRoom,
        updateRoom,
        deleteRoom,
        addAnnouncement,
        deleteAnnouncement,
        clearAllAnnouncements,
        updateSettings,
        checkConflict,
        getReservationsForSlot,
        getRoomStats,
        getTeacherStats,
        getNetworkOverviewStats,
        clearSystemForProduction,
        loadDemoSampleData,
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
