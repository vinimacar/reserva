export type UserRole = 'ADMIN' | 'TEACHER';
export type GenderType = 'MALE' | 'FEMALE';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  iconKey?: string;
  password?: string;
  role: UserRole;
  subject?: string;
  schoolName: string;
  gender?: GenderType;
}

export type SpaceType = 'INFORMATICA' | 'CIENCIAS' | 'QUIMICA_FISICA' | 'MAKER' | 'MULTIMIDIA';

export interface Room {
  id: string;
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

export type ShiftType = 'MANHA' | 'TARDE' | 'NOITE';

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
  isConfigured: boolean;
  configuredAt?: string;
}

export interface RoomStats {
  roomId: string;
  roomName: string;
  totalBookings: number;
  occupancyRate: number;
  popularShift: ShiftType;
}
