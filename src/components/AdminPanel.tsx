import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Monitor,
  BarChart3,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  Search,
  Bell,
  RefreshCw,
  Sparkles,
  School,
  Building2,
  Mail,
  Phone,
  UserPlus,
  UserCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Room, SpaceType, Reservation, UserRole, User } from '../types';
import { UserRegistrationModal } from './UserRegistrationModal';
import { TeacherAvatar } from './TeacherAvatar';

export const AdminPanel: React.FC<{
  onSelectReservation: (r: Reservation) => void;
  onOpenReceipt: (r: Reservation) => void;
  onOpenSchoolSettings?: () => void;
}> = ({ onSelectReservation, onOpenReceipt, onOpenSchoolSettings }) => {
  const {
    reservations,
    rooms,
    announcements,
    settings,
    updateRoom,
    addRoom,
    deleteRoom,
    approveReservation,
    rejectReservation,
    cancelReservation,
    clearAllReservations,
    addAnnouncement,
    deleteAnnouncement,
    clearAllAnnouncements,
    updateSettings,
    getRoomStats,
    getTeacherStats,
    clearSystemForProduction,
    loadDemoSampleData,
    resetToDefaultData,
  } = useReservations();

  const { users, currentUser, updateUserRole, addUser, deleteUser } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<
    'BOOKINGS' | 'ROOMS' | 'REPORTS' | 'USERS' | 'ANNOUNCEMENTS' | 'SETTINGS'
  >('BOOKINGS');

  // Filter state for bookings
  const [filterRoomId, setFilterRoomId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchBooking, setSearchBooking] = useState<string>('');

  // Room modal & delete state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [newRoomForm, setNewRoomForm] = useState<Partial<Room>>({
    name: '',
    type: 'INFORMATICA',
    capacity: 35,
    location: '',
    description: '',
    status: 'ACTIVE',
    color: 'blue',
    iconName: 'Monitor',
    equipment: ['Computadores', 'Projetor', 'Internet Fibra'],
    rules: ['Proibido alimentos', 'Desligar após o uso'],
  });

  // Announcement state
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [annImportant, setAnnImportant] = useState<boolean>(true);
  const [annTargetRoom, setAnnTargetRoom] = useState<string>('');

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Sala',
      'Data',
      'Turno',
      'Aulas',
      'Professor',
      'Email',
      'Turma',
      'Disciplina',
      'Assunto',
      'Equipamentos',
      'Status',
    ];

    const rows = reservations.map((r) => [
      r.id,
      `"${r.roomName}"`,
      r.date,
      r.shift,
      `"${r.periodLabels}"`,
      `"${r.userName}"`,
      r.userEmail,
      `"${r.turma}"`,
      `"${r.disciplina}"`,
      `"${r.subjectTopic.replace(/"/g, '""')}"`,
      `"${(r.requestedEquipment || []).join(', ')}"`,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reservas_laboratorios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Reservations for Admin table
  const filteredReservations = reservations.filter((r) => {
    if (filterRoomId !== 'ALL' && r.roomId !== filterRoomId) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchBooking) {
      const q = searchBooking.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.turma.toLowerCase().includes(q) ||
        r.disciplina.toLowerCase().includes(q) ||
        r.roomName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roomStats = getRoomStats();
  const teacherStats = getTeacherStats();

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom(editingRoom.id, newRoomForm);
    } else {
      addRoom(newRoomForm as Omit<Room, 'id'>);
    }
    setIsRoomModalOpen(false);
    setEditingRoom(null);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement({
      title: annTitle,
      content: annContent,
      author: currentUser?.name || 'Coordenação Escolar',
      important: annImportant,
      targetRoomId: annTargetRoom || undefined,
    });
    setAnnTitle('');
    setAnnContent('');
    showToast('Aviso publicado no mural da escola com sucesso!');
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white">Painel da Coordenação & Administração</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase font-mono">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão de laboratórios, aprovação de horários, métricas de ocupação e permissões docentes
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-2.5">
          {reservations.length > 0 && (
            <button
              onClick={() => {
                setConfirmModal({
                  title: 'Limpar Reservas de Teste?',
                  message: 'Deseja limpar todas as reservas para iniciar o lançamento dos dados definitivos da escola?',
                  confirmLabel: 'Sim, Limpar Reservas',
                  isDestructive: true,
                  onConfirm: () => {
                    clearAllReservations();
                    showToast('Todas as reservas foram limpas com sucesso! A grade está pronta.');
                  },
                });
              }}
              className="flex items-center space-x-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/80 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Limpar Reservas de Teste</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-1 text-xs font-bold transition-colors">
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'BOOKINGS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gestão de Reservas ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ROOMS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ROOMS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Salas e Laboratórios ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'REPORTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Estatísticas & Relatórios</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Professores & Acessos ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Publicar Avisos</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* TAB 1: RESERVATIONS MANAGEMENT */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Room Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Ambiente:</label>
                <select
                  value={filterRoomId}
                  onChange={(e) => setFilterRoomId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos os Laboratórios</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="CONFIRMED">Confirmadas</option>
                  <option value="PENDING">Pendentes de Aprovação</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar professor, turma..."
                value={searchBooking}
                onChange={(e) => setSearchBooking(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Data & Aulas</th>
                    <th className="p-3.5">Espaço / Lab</th>
                    <th className="p-3.5">Professor</th>
                    <th className="p-3.5">Turma & Disciplina</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500 dark:text-slate-400">
                        {reservations.length === 0 ? (
                          <div className="max-w-md mx-auto space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              Sistema Limpo para Lançamentos Definitivos
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Nenhuma reserva pendente ou anterior cadastrada. A grade de horários está pronta para receber os agendamentos reais dos professores.
                            </p>
                          </div>
                        ) : (
                          'Nenhuma reserva encontrada com os filtros selecionados.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{res.date}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{res.periodLabels}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{res.roomName}</p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{res.shift}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{res.userName}</p>
                          <p className="text-[10px] text-slate-400">{res.userEmail}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800/60">
                            {res.turma}
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{res.disciplina}</p>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              res.status === 'CONFIRMED'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : res.status === 'PENDING'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {res.status === 'CONFIRMED'
                              ? 'Confirmada'
                              : res.status === 'PENDING'
                              ? 'Pendente'
                              : 'Cancelada'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          {res.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveReservation(res.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                                title="Aprovar Reserva"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => rejectReservation(res.id)}
                                className="px-2.5 py-1 bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-800 dark:text-red-200 rounded-lg font-bold text-[11px] cursor-pointer"
                                title="Recusar Reserva"
                              >
                                Recusar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onSelectReservation(res)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => onOpenReceipt(res)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] cursor-pointer"
                            title="Comprovante"
                          >
                            <Printer className="w-3 h-3 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOMS MANAGEMENT */}
      {activeTab === 'ROOMS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Espaços e Laboratórios Cadastrados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure os ambientes, capacidade e inventário de equipamentos.</p>
            </div>
            <button
              onClick={() => {
                setEditingRoom(null);
                setNewRoomForm({
                  name: '',
                  type: 'INFORMATICA',
                  capacity: 35,
                  location: 'Bloco A',
                  description: '',
                  status: 'ACTIVE',
                  color: 'blue',
                  iconName: 'Monitor',
                  equipment: ['Projetor', 'Computadores'],
                  rules: ['Uso obrigatório de jaleco/crachá'],
                });
                setIsRoomModalOpen(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Espaço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 uppercase">
                        {room.type}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">{room.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        room.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : room.status === 'MAINTENANCE'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {room.status === 'ACTIVE'
                        ? 'Ativo'
                        : room.status === 'MAINTENANCE'
                        ? 'Manutenção'
                        : 'Desativado'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {room.location} • {room.capacity} Lugares
                  </p>

                  <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-1 flex items-center gap-1 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Responsável: {room.responsibleName || 'Coordenação'}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                    {room.description}
                  </p>

                  {/* Equipment chips */}
                  <div className="mt-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Equipamentos ({room.equipment?.length || 0})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.equipment && room.equipment.slice(0, 3).map((eq, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {eq}
                        </span>
                      ))}
                      {room.equipment && room.equipment.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold">+{room.equipment.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Rules count */}
                  {room.rules && room.rules.length > 0 && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>{room.rules.length} normas de utilização cadastradas</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      updateRoom(room.id, {
                        status: room.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE',
                      });
                      showToast(`Espaço ${room.name} agora está ${room.status === 'ACTIVE' ? 'em Manutenção' : 'Ativo'}.`);
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      room.status === 'ACTIVE'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {room.status === 'ACTIVE' ? 'Colocar em Manutenção' : 'Ativar Espaço'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setNewRoomForm(room);
                        setIsRoomModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="Editar Espaço"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRoomToDelete(room)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg cursor-pointer"
                      title="Excluir Espaço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                Nenhum laboratório ou sala cadastrada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Cadastre os laboratórios de informática, ciências ou salas de recursos da sua escola para iniciar os agendamentos.
              </p>
              <button
                onClick={() => {
                  setEditingRoom(null);
                  setNewRoomForm({
                    name: '',
                    type: 'INFORMATICA',
                    capacity: 35,
                    location: '',
                    description: '',
                    status: 'ACTIVE',
                    color: 'blue',
                    iconName: 'Monitor',
                    equipment: ['Computadores', 'Projetor', 'Internet Fibra'],
                    rules: ['Proibido alimentos', 'Desligar após o uso'],
                  });
                  setIsRoomModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Espaço</span>
              </button>
            </div>
          )}

          {/* Add/Edit Room Modal */}
          {isRoomModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingRoom ? `Editar: ${editingRoom.name}` : 'Cadastrar Novo Laboratório/Sala'}
                  </h3>
                  {editingRoom && (
                    <button
                      type="button"
                      onClick={() => {
                        setRoomToDelete(editingRoom);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Espaço</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveRoom} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Espaço:</label>
                    <input
                      type="text"
                      value={newRoomForm.name || ''}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                      placeholder="Ex: Laboratório de Robótica 02"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo:</label>
                      <select
                        value={newRoomForm.type || 'INFORMATICA'}
                        onChange={(e) => setNewRoomForm({ ...newRoomForm, type: e.target.value as SpaceType })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                      >
                        <option value="INFORMATICA">Informática</option>
                        <option value="CIENCIAS">Ciências & Biologia</option>
                        <option value="QUIMICA_FISICA">Química & Física</option>
                        <option value="MAKER">Maker & Robótica</option>
                        <option value="MULTIMIDIA">Multimídia / Auditório</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Capacidade (Alunos):</label>
                      <input
                        type="number"
                        value={newRoomForm.capacity || 30}
                        onChange={(e) => setNewRoomForm({ ...newRoomForm, capacity: parseInt(e.target.value) || 20 })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Localização no Prédio:</label>
                    <input
                      type="text"
                      value={newRoomForm.location || ''}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, location: e.target.value })}
                      placeholder="Ex: Bloco B - Sala 104"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Professor / Responsável pelo Espaço:</label>
                    <input
                      type="text"
                      value={newRoomForm.responsibleName || ''}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, responsibleName: e.target.value })}
                      placeholder="Ex: Prof. Vinicius Carvalho ou Coordenação de TI"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium"
                    />
                    {users.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-400">Atribuir a:</span>
                        {users.slice(0, 3).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setNewRoomForm({ ...newRoomForm, responsibleName: u.name })}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                          >
                            {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Equipamentos Disponíveis (um por linha):
                    </label>
                    <textarea
                      rows={3}
                      value={Array.isArray(newRoomForm.equipment) ? newRoomForm.equipment.join('\n') : ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
                        setNewRoomForm({ ...newRoomForm, equipment: lines });
                      }}
                      placeholder="Ex:&#10;36 Computadores Core i5&#10;Projetor Multimídia&#10;Lousa Digital Interativa"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Normas e Regras de Utilização (uma por linha):
                    </label>
                    <textarea
                      rows={3}
                      value={Array.isArray(newRoomForm.rules) ? newRoomForm.rules.join('\n') : ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
                        setNewRoomForm({ ...newRoomForm, rules: lines });
                      }}
                      placeholder="Ex:&#10;Proibido alimentos e bebidas&#10;Desligar computadores ao término&#10;Uso obrigatório de jaleco"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição Breve:</label>
                    <textarea
                      rows={2}
                      value={newRoomForm.description || ''}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsRoomModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow cursor-pointer"
                    >
                      Salvar Espaço
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORTS & ANALYTICS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Relatório Geral de Uso dos Laboratórios</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Métricas pedagógicas e taxa de ocupação para gestão escolar.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Dados (CSV)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Relatório</span>
              </button>
            </div>
          </div>

          {/* Occupancy Rate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roomStats.map((stat) => (
              <div key={stat.roomId} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{stat.roomName}</h4>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">{stat.occupancyRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stat.occupancyRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <span>{stat.totalBookings} Aulas Agendadas</span>
                  <span>Turno mais buscado: <strong>{stat.popularShift}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Rankings & Popular Subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Teachers */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Professores com Mais Agendamentos
              </h4>
              <div className="space-y-2.5 text-xs">
                {teacherStats.slice(0, 5).map((t, idx) => (
                  <div key={t.teacherName} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{t.teacherName}</p>
                        <p className="text-[10px] text-slate-400">{t.email}</p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg text-xs">
                      {t.count} reservas
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* School Lab Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs transition-colors">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Resumo Geral da Instituição
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center">
                  <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{reservations.length}</p>
                  <p className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 mt-0.5">Total de Reservas</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-center">
                  <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{rooms.length}</p>
                  <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 mt-0.5">Espaços Ativos</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-100 dark:border-purple-900/50 text-center">
                  <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{users.length}</p>
                  <p className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 mt-0.5">Docentes Conectados</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-100 dark:border-amber-900/50 text-center">
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-100">
                    {reservations.filter((r) => r.status === 'CONFIRMED').length}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 mt-0.5">Aulas Confirmadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ADMIN ROLES */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Corpo Docente & Gestão de Permissões</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Professores cadastrados no sistema escolar. Você pode adicionar novos docentes e gerenciar privilégios.
              </p>
            </div>

            <button
              id="admin-add-teacher-btn"
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer self-start sm:self-auto transform active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cadastrar Novo Professor</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Professor</th>
                    <th className="p-3.5">E-mail Institucional Google</th>
                    <th className="p-3.5">Disciplina</th>
                    <th className="p-3.5">Nível de Acesso</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <TeacherAvatar
                            avatar={u.avatar}
                            name={u.name}
                            subject={u.subject}
                            role={u.role}
                            size="sm"
                            showRoleBadge={true}
                          />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{u.subject || 'Geral'}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {u.role === 'ADMIN'
                            ? '👑 Administrador'
                            : u.gender === 'FEMALE'
                            ? '👩‍🏫 Professora'
                            : '👨‍🏫 Professor'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Edit Teacher Button */}
                          <button
                            id={`admin-edit-teacher-${u.id}`}
                            onClick={() => {
                              setEditingUser(u);
                              setIsUserModalOpen(true);
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            title={`Editar dados de ${u.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => {
                              const newRole: UserRole = u.role === 'ADMIN' ? 'TEACHER' : 'ADMIN';
                              updateUserRole(u.id, newRole);
                              showToast(`Permissão do professor ${u.name} alterada para ${newRole === 'ADMIN' ? 'Administrador' : 'Professor'}.`);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                              u.role === 'ADMIN'
                                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 border border-red-200 dark:border-red-800'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Revogar Admin' : 'Tornar Admin'}
                          </button>

                          {users.length > 1 && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  title: 'Remover Docente do Sistema',
                                  message: `Tem certeza que deseja remover o usuário de "${u.name}" (${u.email})?`,
                                  confirmLabel: 'Sim, Remover',
                                  isDestructive: true,
                                  onConfirm: () => {
                                    deleteUser(u.id);
                                    showToast(`Professor ${u.name} removido com sucesso.`);
                                  },
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Remover docente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PUBLISH ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Announcement Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Publicar Novo Comunicado no Mural
            </h3>

            <form onSubmit={handleAddAnnouncement} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título do Aviso:</label>
                <input
                  type="text"
                  placeholder="Ex: Manutenção de Rede na Sala de Informática..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ambiente Relacionado (Opcional):</label>
                <select
                  value={annTargetRoom}
                  onChange={(e) => setAnnTargetRoom(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                >
                  <option value="">Aviso Geral para Todos os Laboratórios</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Conteúdo da Mensagem:</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para os professores..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  required
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={annImportant}
                  onChange={(e) => setAnnImportant(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Marcar como Importante (Destaque em Amarelo)</span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow cursor-pointer"
              >
                Publicar Comunicado
              </button>
            </form>
          </div>

          {/* Active Announcements List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Avisos Ativos no Sistema ({announcements.length})</h3>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                    ann.important
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ann.title}</span>
                      {ann.important && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase">
                          Importante
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px] leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Por: {ann.author} • {ann.date}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Excluir Comunicado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-xs max-w-2xl transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Configurações Gerais do Sistema RESERVE</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Personalize os dados da instituição escolar e as regras de agendamento de laboratórios.
            </p>
          </div>

          {/* School Identity Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {settings.schoolName}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        settings.isConfigured
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {settings.isConfigured ? 'Escola Salva' : 'Configuração Inicial'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {settings.city ? `${settings.city} - ${settings.state || 'MG'}` : 'Minas Gerais'} • {settings.networkType || 'Rede Estadual'} {settings.inepCode && `• INEP: ${settings.inepCode}`}
                  </p>
                </div>
              </div>

              {onOpenSchoolSettings && (
                <button
                  id="admin-edit-school-btn"
                  onClick={onOpenSchoolSettings}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Escola</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">E-mail de Contato:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                  {settings.contactEmail}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Turnos Ativos:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {(settings.shifts || ['MANHA', 'TARDE', 'NOITE']).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Responsável / Direção:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                  {settings.directorName || 'Coordenação de TI'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Instituição de Ensino:</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => updateSettings({ schoolName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Antecedência Máxima para Agendamento (Dias):
              </label>
              <input
                type="number"
                value={settings.maxAdvanceDays}
                onChange={(e) => updateSettings({ maxAdvanceDays: parseInt(e.target.value) || 30 })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-center space-x-2.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.requireAdminApproval}
                  onChange={(e) => updateSettings({ requireAdminApproval: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Exigir Aprovação Prévia da Coordenação para Reservas de Professores</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                Se ativado, novas reservas de professores entrarão como "Pendentes" até um administrador aprovar.
              </p>
            </div>

            {/* Theme & Appearance Configuration */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {isDark ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>Aparência & Tema do Sistema</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Selecione o tema visual da interface ou deixe automático para acompanhar o dispositivo.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {theme === 'light' ? '☀️ Modo Claro' : theme === 'dark' ? '🌙 Modo Escuro' : '💻 Automático'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  id="admin-theme-light-btn"
                  onClick={() => setTheme('light')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-400/40'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Tema Claro</span>
                  <span className="text-[9px] font-normal opacity-70">Cores diurnas</span>
                </button>

                <button
                  type="button"
                  id="admin-theme-dark-btn"
                  onClick={() => setTheme('dark')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-xs ring-2 ring-blue-400/40'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-blue-300" />
                  <span>Tema Escuro</span>
                  <span className="text-[9px] font-normal opacity-70">Modo noturno</span>
                </button>

                <button
                  type="button"
                  id="admin-theme-system-btn"
                  onClick={() => setTheme('system')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-slate-800 text-white border-slate-600 shadow-xs ring-2 ring-slate-400/40'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Automático</span>
                  <span className="text-[9px] font-normal opacity-70">Sistema / OS</span>
                </button>
              </div>
            </div>

            {/* Production Clearance Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Ambiente de Produção & Limpeza de Dados Definitivos</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Utilize estas opções para limpar dados de teste/demonstração e iniciar o lançamento dos agendamentos oficiais e definitivos da instituição.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="admin-clear-reservations-btn"
                  onClick={() => {
                    setConfirmModal({
                      title: 'Limpar Todas as Reservas?',
                      message: 'Tem certeza que deseja apagar TODAS as reservas cadastradas? Esta ação deixará a grade limpa para os agendamentos definitivos.',
                      confirmLabel: 'Sim, Apagar Reservas',
                      isDestructive: true,
                      onConfirm: () => {
                        clearAllReservations();
                        showToast('Todas as reservas foram removidas. A grade está limpa!');
                      },
                    });
                  }}
                  className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 rounded-xl font-bold transition-all text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs">Limpar Todas as Reservas</p>
                    <p className="text-[10px] font-normal text-slate-400">Zera a grade de horários mantendo salas e usuários</p>
                  </div>
                </button>

                <button
                  id="admin-clear-announcements-btn"
                  onClick={() => {
                    setConfirmModal({
                      title: 'Limpar Avisos do Mural?',
                      message: 'Tem certeza que deseja apagar todos os comunicados e avisos do mural da escola?',
                      confirmLabel: 'Sim, Apagar Avisos',
                      isDestructive: true,
                      onConfirm: () => {
                        clearAllAnnouncements();
                        showToast('Todos os avisos foram removidos do mural.');
                      },
                    });
                  }}
                  className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 rounded-xl font-bold transition-all text-left cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs">Limpar Avisos do Mural</p>
                    <p className="text-[10px] font-normal text-slate-400">Remove comunicados de teste ou antigos</p>
                  </div>
                </button>

                <button
                  id="admin-clear-all-prod-btn"
                  onClick={() => {
                    setConfirmModal({
                      title: 'Limpar Sistema Completo para Produção?',
                      message: 'Deseja limpar COMPLETAMENTE o sistema para produção (zerar todas as reservas e avisos de teste, deixando o sistema pronto para os lançamentos definitivos)?',
                      confirmLabel: 'Sim, Limpar para Produção',
                      isDestructive: true,
                      onConfirm: () => {
                        clearSystemForProduction();
                        showToast('Sistema 100% limpo e pronto para o lançamento dos dados definitivos!');
                      },
                    });
                  }}
                  className="sm:col-span-2 flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black">Limpar Sistema Completo para Produção</p>
                      <p className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                        Zera todas as reservas e avisos de teste em um único clique
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                    Pronto para Uso
                  </span>
                </button>
              </div>
            </div>

            {/* Load Sample Demo Data (Optional) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Dados de Exemplo / Demonstração</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Caso queira simular agendamentos de teste antes de entrar em produção.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setConfirmModal({
                      title: 'Carregar Dados de Demonstração?',
                      message: 'Deseja carregar as reservas e avisos de exemplo para demonstração?',
                      confirmLabel: 'Sim, Carregar Demonstração',
                      onConfirm: () => {
                        loadDemoSampleData();
                        showToast('Dados de demonstração carregados com sucesso!');
                      },
                    });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Carregar Exemplo</span>
                </button>

                <button
                  onClick={() => {
                    setConfirmModal({
                      title: 'Restaurar Padrão de Fábrica?',
                      message: 'Deseja restaurar as configurações e dados padrão de fábrica do sistema?',
                      confirmLabel: 'Restaurar Padrão',
                      isDestructive: true,
                      onConfirm: () => {
                        resetToDefaultData();
                        showToast('Sistema restaurado ao padrão inicial com sucesso.');
                      },
                    });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Padrão de Fábrica</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Room Deletion Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Excluir Espaço / Laboratório?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja excluir permanentemente o espaço <strong>"{roomToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">
                As reservas vinculadas a esta sala também serão removidas.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRoom(roomToDelete.id);
                  setRoomToDelete(null);
                  if (isRoomModalOpen) {
                    setIsRoomModalOpen(false);
                    setEditingRoom(null);
                  }
                  showToast(`Espaço "${roomToDelete.name}" excluído com sucesso.`);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                confirmModal.isDestructive
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              }`}
            >
              {confirmModal.isDestructive ? (
                <Trash2 className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                className={`px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5 ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                <span>{confirmModal.confirmLabel || 'Confirmar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Registration & Edit Modal */}
      <UserRegistrationModal
        isOpen={isUserModalOpen}
        userToEdit={editingUser}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={(savedUser) => {
          showToast(
            editingUser
              ? `Professor "${savedUser.name}" atualizado com sucesso!`
              : `Professor "${savedUser.name}" cadastrado com sucesso!`
          );
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
      />
    </div>
  );
};
