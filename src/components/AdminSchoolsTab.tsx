import React, { useState } from 'react';
import {
  School as SchoolIcon,
  Building2,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Clock,
  Layers,
  Monitor,
  Users,
  Search,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  X,
  UserCheck,
  Check,
  UserX,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { School, ShiftType, User } from '../types';
import { TeacherAvatar } from './TeacherAvatar';

export const AdminSchoolsTab: React.FC<{
  onShowToast: (msg: string) => void;
}> = ({ onShowToast }) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    switchSchool,
    addSchool,
    updateSchool,
    deleteSchool,
    assignSchoolAdmin,
    removeSchoolAdmin,
    allRooms,
    allReservations,
    getNetworkOverviewStats,
  } = useReservations();

  const { users, addUser, updateUserRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState(false);
  const [selectedSchoolForAdmin, setSelectedSchoolForAdmin] = useState<School | null>(null);
  const [adminNameInput, setAdminNameInput] = useState('');
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminRoleTitle, setAdminRoleTitle] = useState('Coordenador(a) Pedagógico(a)');

  const [deleteConfirmSchool, setDeleteConfirmSchool] = useState<School | null>(null);

  // Form state for creating/editing school
  const [formData, setFormData] = useState<{
    name: string;
    shortName: string;
    code: string;
    inepCode: string;
    city: string;
    state: string;
    networkType: string;
    directorName: string;
    contactEmail: string;
    phone: string;
    shifts: ShiftType[];
    initialAdminEmail: string;
    initialAdminName: string;
    createDefaultRooms: boolean;
    requireAdminApproval: boolean;
    maxAdvanceDays: number;
    allowWeekendBooking: boolean;
  }>({
    name: '',
    shortName: '',
    code: '',
    inepCode: '',
    city: 'Belo Horizonte',
    state: 'MG',
    networkType: 'Estadual',
    directorName: '',
    contactEmail: '',
    phone: '',
    shifts: ['MANHA', 'TARDE'],
    initialAdminEmail: '',
    initialAdminName: '',
    createDefaultRooms: true,
    requireAdminApproval: false,
    maxAdvanceDays: 30,
    allowWeekendBooking: false,
  });

  const stats = getNetworkOverviewStats();

  const filteredSchools = (schools || []).filter((s) => {
    if (!s) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.shortName && s.shortName.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.inepCode && s.inepCode.toLowerCase().includes(q)) ||
      (s.directorName && s.directorName.toLowerCase().includes(q))
    );
  });

  const handleOpenCreateModal = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      shortName: '',
      code: `3100${Math.floor(1000 + Math.random() * 9000)}`,
      inepCode: `3100${Math.floor(1000 + Math.random() * 9000)}`,
      city: 'Belo Horizonte',
      state: 'MG',
      networkType: 'Estadual',
      directorName: '',
      contactEmail: '',
      phone: '',
      shifts: ['MANHA', 'TARDE'],
      initialAdminEmail: '',
      initialAdminName: '',
      createDefaultRooms: true,
      requireAdminApproval: false,
      maxAdvanceDays: 30,
      allowWeekendBooking: false,
    });
    setIsSchoolModalOpen(true);
  };

  const handleOpenEditModal = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      shortName: school.shortName || '',
      code: school.code || '',
      inepCode: school.inepCode || school.code || '',
      city: school.city,
      state: school.state || 'MG',
      networkType: school.networkType || 'Estadual',
      directorName: school.directorName || '',
      contactEmail: school.contactEmail || '',
      phone: school.phone || '',
      shifts: school.shifts || ['MANHA', 'TARDE'],
      initialAdminEmail: '',
      initialAdminName: '',
      createDefaultRooms: false,
      requireAdminApproval: school.requireAdminApproval || false,
      maxAdvanceDays: school.maxAdvanceDays || 30,
      allowWeekendBooking: school.allowWeekendBooking || false,
    });
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome da escola.');
      return;
    }

    if (editingSchool) {
      updateSchool(editingSchool.id, {
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || formData.name.trim().split('-')[0],
        code: formData.code.trim(),
        inepCode: formData.inepCode.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        networkType: formData.networkType,
        directorName: formData.directorName.trim(),
        contactEmail: formData.contactEmail.trim(),
        phone: formData.phone.trim(),
        shifts: formData.shifts,
        requireAdminApproval: formData.requireAdminApproval,
        maxAdvanceDays: formData.maxAdvanceDays,
        allowWeekendBooking: formData.allowWeekendBooking,
      });
      onShowToast(`Dados da escola "${formData.name}" atualizados com sucesso!`);
    } else {
      const created = addSchool(
        {
          name: formData.name.trim(),
          shortName: formData.shortName.trim() || formData.name.trim().split('-')[0],
          code: formData.code.trim() || `ESC-${Date.now().toString().slice(-4)}`,
          inepCode: formData.inepCode.trim() || formData.code.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          networkType: formData.networkType,
          directorName: formData.directorName.trim(),
          contactEmail: formData.contactEmail.trim(),
          phone: formData.phone.trim(),
          shifts: formData.shifts,
          active: true,
          adminEmails: formData.initialAdminEmail.trim() ? [formData.initialAdminEmail.trim().toLowerCase()] : [],
          requireAdminApproval: formData.requireAdminApproval,
          maxAdvanceDays: formData.maxAdvanceDays,
          allowWeekendBooking: formData.allowWeekendBooking,
        },
        formData.createDefaultRooms
      );

      // If initial admin email provided, register admin user
      if (formData.initialAdminEmail.trim()) {
        const adminEmail = formData.initialAdminEmail.trim().toLowerCase();
        addUser({
          name: formData.initialAdminName.trim() || `Coordenador(a) ${formData.shortName}`,
          email: adminEmail,
          role: 'ADMIN',
          schoolId: created.id,
          schoolName: created.name,
          subject: 'Administração Escolar',
        });
      }

      onShowToast(`Nova escola "${created.name}" cadastrada com sucesso!`);
    }

    setIsSchoolModalOpen(false);
  };

  const handleOpenAssignAdmin = (school: School) => {
    setSelectedSchoolForAdmin(school);
    setAdminNameInput('');
    setAdminEmailInput('');
    setAdminRoleTitle('Coordenador(a) Pedagógico(a)');
    setIsAssignAdminModalOpen(true);
  };

  const handleAssignAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForAdmin) return;
    const trimmedEmail = adminEmailInput.trim().toLowerCase();
    if (!trimmedEmail) return;

    assignSchoolAdmin(selectedSchoolForAdmin.id, trimmedEmail, adminNameInput.trim());
    onShowToast(`Responsável ${trimmedEmail} vinculado à escola ${selectedSchoolForAdmin.shortName || selectedSchoolForAdmin.name}!`);
    setIsAssignAdminModalOpen(false);
  };

  const handleRemoveAdmin = (school: School, email: string) => {
    if (confirm(`Deseja remover o vínculo de administrador do e-mail "${email}" para a escola ${school.shortName || school.name}?`)) {
      removeSchoolAdmin(school.id, email);
      onShowToast(`Vínculo de administrador removido.`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmSchool) return;
    const success = deleteSchool(deleteConfirmSchool.id);
    if (success) {
      onShowToast(`Escola "${deleteConfirmSchool.name}" removida da rede.`);
    } else {
      alert('Não é possível excluir a única escola remanescente do sistema.');
    }
    setDeleteConfirmSchool(null);
  };

  const toggleShift = (shift: ShiftType) => {
    setFormData((prev) => {
      const exists = (prev.shifts || []).includes(shift);
      if (exists) {
        if ((prev.shifts || []).length <= 1) return prev; // Keep at least one
        return { ...prev, shifts: (prev.shifts || []).filter((s) => s !== shift) };
      } else {
        return { ...prev, shifts: [...(prev.shifts || []), shift] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Network Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Escolas na Rede</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalSchools}</p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> {stats.activeSchools} ativas
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Responsáveis / Admins</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalAdmins}</p>
          <span className="text-[10px] text-slate-500">Gestores locais</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Laboratórios na Rede</span>
            <Monitor className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalRooms}</p>
          <span className="text-[10px] text-slate-500">Espaços cadastrados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total de Reservas</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalReservations}</p>
          <span className="text-[10px] text-slate-500">Agendamentos totais</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Ação Rápida</span>
            <p className="text-xs font-black mt-0.5">Adicionar Unidade Escolar</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 w-full py-1.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Escola</span>
          </button>
        </div>
      </div>

      {/* Active School Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <SchoolIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider font-mono">
                ESCOLA ATIVA ATUAL
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold">
                {currentSchool.networkType} • INEP: {currentSchool.inepCode || currentSchool.code}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {currentSchool.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentSchool.city} - {currentSchool.state}</span>
              {currentSchool.directorName && (
                <>
                  <span>•</span>
                  <span>Direção: {currentSchool.directorName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleOpenEditModal(currentSchool)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Editar Esta Escola</span>
          </button>
          <button
            onClick={() => handleOpenAssignAdmin(currentSchool)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Novo Responsável</span>
          </button>
        </div>
      </div>

      {/* Schools List Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span>Unidades Escolares Cadastradas ({schools.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre novas escolas na rede e vincule os responsáveis e coordenadores de cada unidade.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por escola, cidade ou INEP..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Escola</span>
          </button>
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSchools.map((school) => {
          if (!school) return null;
          const isCurrentActive = school.id === currentSchoolId;
          const schoolRooms = (allRooms || []).filter((r) => r && r.schoolId === school.id);
          const schoolReservations = (allReservations || []).filter((r) => r && r.schoolId === school.id && r.status !== 'CANCELLED');
          const schoolTeachers = (users || []).filter((u) => u && u.schoolId === school.id);

          return (
            <div
              key={school.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between relative ${
                isCurrentActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCurrentActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <SchoolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {school.networkType || 'Estadual'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          INEP: {school.inepCode || school.code}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-white">
                            EM EXIBIÇÃO
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {school.name}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{school.city} - {school.state || 'MG'}</span>
                  </div>

                  {school.contactEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate text-slate-600 dark:text-slate-400">{school.contactEmail}</span>
                    </div>
                  )}

                  {school.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px]">{school.phone}</span>
                    </div>
                  )}

                  {school.directorName && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Direção: <strong className="text-slate-800 dark:text-slate-200">{school.directorName}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-[11px] text-slate-500">
                      Turnos: {school.shifts?.join(', ') || 'MANHA, TARDE'}
                    </span>
                  </div>
                </div>

                {/* Responsáveis do Sistema (Admins da Escola) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>Responsáveis pelo Sistema na Escola ({school.adminEmails?.length || 0}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignAdmin(school)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Vincular</span>
                    </button>
                  </div>

                  {school.adminEmails && school.adminEmails.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {school.adminEmails.map((email) => {
                        const adminUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
                        return (
                          <div
                            key={email}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold"
                          >
                            <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span className="font-mono text-[11px]">{adminUser?.name || email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(school, email)}
                              className="text-amber-700 dark:text-amber-400 hover:text-red-500 ml-1 cursor-pointer"
                              title="Remover este responsável"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Nenhum administrador local vinculado. Clique em "+ Vincular" para associar o responsável do sistema.
                    </p>
                  )}
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="font-black text-slate-900 dark:text-white font-mono">{schoolRooms.length}</p>
                    <span className="text-[10px] text-slate-500">Salas/Labs</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="font-black text-slate-900 dark:text-white font-mono">{schoolTeachers.length}</p>
                    <span className="text-[10px] text-slate-500">Professores</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="font-black text-slate-900 dark:text-white font-mono">{schoolReservations.length}</p>
                    <span className="text-[10px] text-slate-500">Reservas</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {!isCurrentActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        switchSchool(school.id);
                        onShowToast(`Contexto alterado para a escola: ${school.shortName || school.name}`);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Acessar Esta Escola</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Escola Selecionada</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(school)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Editar informações da escola"
                  >
                    <Edit2 className="w-4 h-4 text-blue-500" />
                  </button>

                  {schools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSchool(school)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Excluir escola da rede"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar / Editar Escola */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingSchool ? 'Editar Dados da Escola' : 'Cadastrar Nova Unidade Escolar'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha os dados institucionais da escola e defina o responsável pelo sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchoolSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* School Name */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo da Escola: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Escola Estadual Governador Milton Campos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sigla / Nome Curto:
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="Ex: E.E. Milton Campos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Network Sphere */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rede / Esfera de Ensino:
                  </label>
                  <select
                    value={formData.networkType}
                    onChange={(e) => setFormData({ ...formData, networkType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Estadual">Rede Estadual (SEE/MG)</option>
                    <option value="Municipal">Rede Municipal</option>
                    <option value="Federal">Rede Federal / IF</option>
                    <option value="Particular">Rede Privada / Particular</option>
                  </select>
                </div>

                {/* INEP Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Código INEP / Censo Escolar:
                  </label>
                  <input
                    type="text"
                    value={formData.inepCode}
                    onChange={(e) => setFormData({ ...formData, inepCode: e.target.value, code: e.target.value })}
                    placeholder="Ex: 31002341"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Município:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Belo Horizonte"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      UF:
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Director / Coordinator */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Diretor(a) / Coordenador(a) Geral:
                  </label>
                  <input
                    type="text"
                    value={formData.directorName}
                    onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                    placeholder="Ex: Prof. Vinicius Carvalho"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Institutional Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Institucional da Escola:
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="escola@educacao.mg.gov.br"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Contato:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(31) 3222-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Shifts */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Turnos de Atendimento:
                  </label>
                  <div className="flex items-center space-x-2 pt-1">
                    {(['MANHA', 'TARDE', 'NOITE'] as ShiftType[]).map((shift) => {
                      const isChecked = formData.shifts.includes(shift);
                      return (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => toggleShift(shift)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {shift === 'MANHA' ? 'Manhã' : shift === 'TARDE' ? 'Tarde' : 'Noite'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Initial Responsible Section (Only for new schools) */}
              {!editingSchool && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Responsável pelo Sistema nesta Escola (Administrador Local)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Responsável:
                      </label>
                      <input
                        type="text"
                        value={formData.initialAdminName}
                        onChange={(e) => setFormData({ ...formData, initialAdminName: e.target.value })}
                        placeholder="Ex: Prof. Coordenador da TI"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        E-mail Institucional do Responsável:
                      </label>
                      <input
                        type="email"
                        value={formData.initialAdminEmail}
                        onChange={(e) => setFormData({ ...formData, initialAdminEmail: e.target.value })}
                        placeholder="responsavel@educacao.mg.gov.br"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.createDefaultRooms}
                      onChange={(e) => setFormData({ ...formData, createDefaultRooms: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Criar automaticamente salas padrão (Informática, Ciências, Espaço Maker)</span>
                  </label>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  {editingSchool ? 'Salvar Alterações' : 'Cadastrar Escola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vincular Responsável pelo Sistema */}
      {isAssignAdminModalOpen && selectedSchoolForAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Vincular Responsável pelo Sistema
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs">
                    {selectedSchoolForAdmin.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignAdminModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignAdminSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo do Responsável:
                </label>
                <input
                  type="text"
                  required
                  value={adminNameInput}
                  onChange={(e) => setAdminNameInput(e.target.value)}
                  placeholder="Ex: Prof. Carlos Eduardo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional do Responsável: *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="exemplo@educacao.mg.gov.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cargo / Função na Escola:
                </label>
                <input
                  type="text"
                  value={adminRoleTitle}
                  onChange={(e) => setAdminRoleTitle(e.target.value)}
                  placeholder="Ex: Coordenador Pedagógico / TI"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200">
                Este usuário terá privilégios de administrador para aprovar reservas, gerenciar laboratórios e professores desta unidade escolar.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignAdminModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Salvar Responsável
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Escola */}
      {deleteConfirmSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Excluir Escola da Rede?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tem certeza que deseja excluir a escola <strong className="text-slate-900 dark:text-white">{deleteConfirmSchool.name}</strong>? Todos os laboratórios e reservas vinculadas a esta unidade serão removidos.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSchool(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
              >
                Sim, Excluir Escola
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
