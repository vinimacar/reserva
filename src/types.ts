export type UserRole = 'ADMIN' | 'TEACHER';
export type GenderType = 'MALE' | 'FEMALE';
export type UserApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface School {
  id: string;
  name: string;
  shortName: string;
  code: string; // e.g. '31002341' or 'MILTON'
  city: string;
  state: string;
  inepCode?: string;
  networkType: string; // 'Estadual' | 'Municipal' | 'Federal' | 'Particular'
  shifts: ShiftType[];
  contactEmail: string;
  phone?: string;
  directorName?: string;
  logoUrl?: string; // URL or base64 image of the school's crest/logo
  active: boolean;
  createdAt: string;
  adminEmails: string[]; // List of emails of authorized administrators / responsáveis for this school
  requireAdminApproval?: boolean;
  maxAdvanceDays?: number;
  allowWeekendBooking?: boolean;
  classes?: string[]; // Turmas cadastradas especificamente para esta escola
  academicCalendar?: AcademicCalendarConfig;
}

export type AcademicPeriodType = 'BIMESTRE' | 'TRIMESTRE' | 'SEMESTRE';

export interface AcademicTerm {
  id: string;
  name: string; // e.g. "1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  targetSchoolDays?: number;
}

export type CalendarDayType =
  | 'FERIADO' // Feriado Nacional, Estadual ou Municipal
  | 'RECESSO' // Recesso Escolar de meio ou fim de ano
  | 'PLANEJAMENTO' // Conselho de Classe, Módulo ou Planejamento Pedagógico
  | 'SABADO_LETIVO' // Sábado Letivo com reposição ou atividade
  | 'EVENTO'; // Mostra Cultural, Feira de Ciências, etc.

export interface CalendarSpecialDay {
  id: string;
  date: string; // "YYYY-MM-DD"
  endDate?: string; // Opcional para intervalos de recesso (ex: 14/07 a 25/07)
  title: string; // e.g. "Tiradentes", "Recesso de Julho", "Sábado Letivo - Horário de Segunda"
  type: CalendarDayType;
  description?: string;
  equivalentWeekday?: number; // Para Sábado Letivo: 1 = Segunda, 2 = Terça, ..., 5 = Sexta
  allowBooking?: boolean; // Se permite reservas ou se alerta/bloqueia
}

export interface AcademicCalendarConfig {
  year: number; // e.g. 2025, 2026
  periodType: AcademicPeriodType; // 'BIMESTRE' ou 'TRIMESTRE'
  schoolYearStart: string; // "YYYY-MM-DD"
  schoolYearEnd: string; // "YYYY-MM-DD"
  terms: AcademicTerm[];
  specialDays: CalendarSpecialDay[];
  warnOnHolidayBooking?: boolean;
  blockBookingOnHolidays?: boolean;
  totalSchoolDaysGoal?: number; // Meta da LDB (200 dias)
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  iconKey?: string;
  password?: string;
  role: UserRole;
  subject?: string;
  schoolId?: string;
  schoolName: string;
  gender?: GenderType;
  approvalStatus?: UserApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  firstLoginAt?: string;
  authProvider?: 'GOOGLE' | 'PASSWORD' | 'SYSTEM';
}

export type SpaceType = 'INFORMATICA' | 'CIENCIAS' | 'QUIMICA_FISICA' | 'MAKER' | 'MULTIMIDIA';

export interface Room {
  id: string;
  schoolId?: string;
  name: string;
  type: SpaceType;
  capacity: number;
  location: string;
  description: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  equipment: string[];
  color: string;
  iconName: string;
  responsibleName?: string;
  rules?: string[];
}

export type ShiftType = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';

export interface TimePeriod {
  id: string;
  number: number; // 1 to 6
  name: string; // "1ª Aula", "2ª Aula", etc.
  startTime: string; // "07:00"
  endTime: string; // "07:50"
  shift: ShiftType;
}

export type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  schoolId?: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  date: string; // "YYYY-MM-DD"
  shift: ShiftType;
  periodIds: string[]; // List of period IDs (e.g. ['m1', 'm2'] for double class)
  periodNumbers: number[]; // [1, 2]
  periodLabels: string; // "1ª e 2ª Aula (07:00 - 08:40)"
  turma: string; // "9º Ano A", "2º Ano E.M. B"
  disciplina: string; // "Matemática", "Robótica", "Química"
  subjectTopic: string; // "Pesquisa e simulação sobre funções"
  numberOfStudents?: number;
  requestedEquipment: string[]; // ['Projetor', 'Kit de Robótica']
  observations?: string;
  status: ReservationStatus;
  createdAt: string;
  adminNote?: string;
}

export interface Announcement {
  id: string;
  schoolId?: string;
  title: string;
  content: string;
  date: string;
  author: string;
  important: boolean;
  targetRoomId?: string;
}

export interface SchoolSettings {
  schoolName: string;
  shortName?: string;
  city?: string;
  state?: string;
  inepCode?: string;
  networkType?: string; // 'Estadual' | 'Municipal' | 'Federal' | 'Particular'
  shifts?: ShiftType[];
  requireAdminApproval: boolean;
  maxAdvanceDays: number;
  allowWeekendBooking: boolean;
  contactEmail: string;
  phone?: string;
  directorName?: string;
  logoUrl?: string;
  isConfigured: boolean;
  configuredAt?: string;
  academicCalendar?: AcademicCalendarConfig;
}

export interface RoomStats {
  roomId: string;
  roomName: string;
  totalBookings: number;
  occupancyRate: number;
  popularShift: ShiftType;
}

export type RoomPackageType = 'STANDARD_BASIC' | 'TECHNICAL_FULL' | 'CUSTOM';

export interface ClientOnboardingData {
  // Institutional
  name: string;
  shortName: string;
  code: string;
  city: string;
  state: string;
  inepCode?: string;
  networkType: string;
  contactEmail: string;
  phone?: string;
  directorName?: string;
  logoUrl?: string;
  
  // Operational rules
  shifts: ShiftType[];
  requireAdminApproval: boolean;
  maxAdvanceDays: number;
  allowWeekendBooking: boolean;

  // Initial Administrator / Gestor
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  adminPhone?: string;

  // Rooms blueprint
  roomPackage: RoomPackageType;
  customRooms?: Omit<Room, 'id' | 'schoolId'>[];

  // Welcome announcement
  createWelcomeAnnouncement?: boolean;
}

export interface ClientOnboardingResult {
  success: boolean;
  school?: School;
  adminUser?: User;
  roomsCreatedCount?: number;
  error?: string;
}

export type ErrorSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export type ErrorCategory =
  | 'CROSS_ORIGIN'
  | 'TYPE_ERROR'
  | 'PROMISE_REJECTION'
  | 'RUNTIME_ERROR'
  | 'REACT_ERROR'
  | 'NETWORK_ERROR'
  | 'CUSTOM';

export interface FrontendErrorLog {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  componentStack?: string;
  url: string;
  path: string;
  origin: string;
  isIframe: boolean;
  userAgent: string;
  timestamp: string;
  userEmail?: string | null;
  userId?: string | null;
  schoolId?: string | null;
  metadata?: Record<string, unknown>;
}

export type { CalendarDayAnalysis } from './data/defaultAcademicCalendar';

