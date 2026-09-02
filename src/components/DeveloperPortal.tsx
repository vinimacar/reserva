import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Building2,
  PlusCircle,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Trash2,
  Edit3,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Code2,
  Terminal,
  Settings2,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Clock,
  Laptop,
  Microscope,
  Cpu,
  Tv,
  HelpCircle,
  Share2,
  X,
  FileSpreadsheet,
  Lock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Server,
  Database,
  Radio,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { clearCloudDatabase } from '../services/firestoreSync';
import {
  School,
  ShiftType,
  RoomPackageType,
  ClientOnboardingData,
  User,
  Room,
} from '../types';

interface DeveloperPortalProps {
  onBackToApp: () => void;
  onSelectClientToView?: (schoolId: string) => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  onBackToApp,
  onSelectClientToView,
}) => {
  const {
    currentUser,
    users,
    isDeveloperMode,
    exitDeveloperMode,
    changePassword,
    addUser,
  } = useAuth();

  const {
    schools,
    currentSchoolId,
    switchSchool,
    onboardNewClient,
    updateSchool,
    deleteSchool,
    assignSchoolAdmin,
    removeSchoolAdmin,
    allRooms,
    allReservations,
    allAnnouncements,
    clearSystemForProduction,
    resetToDefaultData,
  } = useReservations();

  // Navigation tab inside Developer Portal
  const [activeTab, setActiveTab] = useState<
    'ONBOARDING' | 'CLIENTS_LIST' | 'ADMINS_CREDENTIALS' | 'BACKUP_TOOLS' | 'DOCS'
  >('ONBOARDING');

  // Search & Filters for Client List
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<string>('ALL');

  // Client Onboarding Form State
  const [onboardingForm, setOnboardingForm] = useState<ClientOnboardingData>({
    name: '',
    shortName: '',
    code: '',
    city: '',
    state: 'MG',
    inepCode: '',
    networkType: 'Estadual',
    contactEmail: '',
    phone: '',
    directorName: '',
    shifts: ['MANHA', 'TARDE'],
    requireAdminApproval: false,
    maxAdvanceDays: 30,
    allowWeekendBooking: false,
    adminName: '',
    adminEmail: '',
    adminPassword: 'educacao123',
    adminPhone: '',
    roomPackage: 'STANDARD_BASIC',
    createWelcomeAnnouncement: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCreatedClient, setLastCreatedClient] = useState<{
    school: School;
    adminUser?: User;
    roomsCount: number;
    rawPassword?: string;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const [copiedWelcomeMessage, setCopiedWelcomeMessage] = useState(false);

  // Admin Management Modal for existing client
  const [selectedSchoolForAdminModal, setSelectedSchoolForAdminModal] = useState<School | null>(null);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [newAdminNameInput, setNewAdminNameInput] = useState('');

  // Password reset modal for specific admin
  const [adminToResetPassword, setAdminToResetPassword] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Client Deletion State
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteStatusMessage, setDeleteStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const handleConfirmDeleteSchool = () => {
    if (!schoolToDelete) return;
    if (schools.length <= 1) {
      setDeleteStatusMessage({
        type: 'error',
        text: 'Não é possível excluir a única escola cadastrada. É necessário manter ao menos 1 instituição ativa no sistema.',
      });
      setSchoolToDelete(null);
      return;
    }

    setIsDeletingClient(true);
    try {
      const targetName = schoolToDelete.name;
      const success = deleteSchool(schoolToDelete.id);
      if (success) {
        setDeleteStatusMessage({
          type: 'success',
          text: `A instituição "${targetName}" e todos os seus dados vinculados (salas, reservas e comunicados) foram excluídos com sucesso.`,
        });
        setSchoolToDelete(null);
        setDeleteConfirmationText('');
      } else {
        setDeleteStatusMessage({
          type: 'error',
          text: 'Falha ao excluir a instituição. Verifique se existem outras escolas cadastradas.',
        });
      }
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      setDeleteStatusMessage({
        type: 'error',
        text: 'Ocorreu um erro ao processar a exclusão da instituição.',
      });
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Stats calculation
  const totalSchoolsCount = (schools || []).length;
  const totalRoomsCount = (allRooms || []).length;
  const totalReservationsCount = (allReservations || []).filter((r) => r && r.status !== 'CANCELLED').length;
  const totalUsersCount = (users || []).length;
  const totalAdminsCount = (users || []).filter((u) => u && u.role === 'ADMIN').length;

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return (schools || []).filter((s) => {
      if (!s) return false;
      const q = clientSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.inepCode && s.inepCode.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q));

      const matchNetwork = networkFilter === 'ALL' || s.networkType === networkFilter;

      return matchQuery && matchNetwork;
    });
  }, [schools, clientSearchQuery, networkFilter]);

  // Handle Shift checkbox toggle
  const handleShiftToggle = (shift: ShiftType) => {
    setOnboardingForm((prev) => {
      const exists = (prev.shifts || []).includes(shift);
      if (exists) {
        if ((prev.shifts || []).length === 1) return prev; // Keep at least one
        return { ...prev, shifts: (prev.shifts || []).filter((s) => s !== shift) };
      } else {
        return { ...prev, shifts: [...(prev.shifts || []), shift] };
      }
    });
  };

  // Generate a random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOnboardingForm((prev) => ({ ...prev, adminPassword: pass }));
  };

  // Handle Client Submission
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!onboardingForm.name.trim()) {
      setFormError('Por favor, informe o nome da Instituição / Escola.');
      return;
    }

    if (!onboardingForm.adminEmail.trim()) {
      setFormError('Por favor, informe o e-mail do Administrador Master.');
      return;
    }

    if (!onboardingForm.adminName.trim()) {
      setFormError('Por favor, informe o nome do Administrador Master.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = onboardNewClient(onboardingForm);
      setIsSubmitting(false);

      if (!result.success || !result.school) {
        setFormError(result.error || 'Erro ao cadastrar cliente.');
      } else {
        setLastCreatedClient({
          school: result.school,
          adminUser: result.adminUser,
          roomsCount: result.roomsCreatedCount || 0,
          rawPassword: onboardingForm.adminPassword || 'educacao123',
        });

        // Reset form for next client
        setOnboardingForm({
          name: '',
          shortName: '',
          code: '',
          city: '',
          state: 'MG',
          inepCode: '',
          networkType: 'Estadual',
          contactEmail: '',
          phone: '',
          directorName: '',
          shifts: ['MANHA', 'TARDE'],
          requireAdminApproval: false,
          maxAdvanceDays: 30,
          allowWeekendBooking: false,
          adminName: '',
          adminEmail: '',
          adminPassword: 'educacao123',
          adminPhone: '',
          roomPackage: 'STANDARD_BASIC',
          createWelcomeAnnouncement: true,
        });
      }
    }, 400);
  };

  // Copy Welcome Letter
  const getWelcomeLetterText = () => {
    if (!lastCreatedClient) return '';
    const { school, adminUser, rawPassword } = lastCreatedClient;
    return `*CONFIRMAÇÃO DE IMPLANTAÇÃO - SISTEMA DE AGENDAMENTO DE LABORATÓRIOS*
--------------------------------------------------
🏛️ *Instituição:* ${school.name}
📍 *Cidade / UF:* ${school.city} - ${school.state}
🔢 *Código INEP / Registro:* ${school.inepCode || school.code}
🏢 *Rede de Ensino:* ${school.networkType}
--------------------------------------------------
👤 *ADMINISTRADOR GESTOR MASTER:*
• *Nome:* ${adminUser?.name || school.directorName}
• *E-mail de Acesso:* ${adminUser?.email || school.contactEmail}
• *Senha Provisória:* ${rawPassword || 'educacao123'}

🚀 *COMO ACESSAR:*
1. Acesse o sistema pelo navegador.
2. Selecione a unidade "${school.name}".
3. Informe seu e-mail institucional e senha inicial acima.
4. No Painel Administrativo, você poderá cadastrar novos professores e gerenciar os laboratórios.
--------------------------------------------------
Ambiente provisionado com sucesso pela Equipe de Desenvolvimento.`;
  };

  const handleCopyWelcomeText = () => {
    navigator.clipboard.writeText(getWelcomeLetterText());
    setCopiedWelcomeMessage(true);
    setTimeout(() => setCopiedWelcomeMessage(false), 2500);
  };

  // Switch to client context and open app
  const handleAccessClientInstance = (schoolId: string) => {
    switchSchool(schoolId);
    if (onSelectClientToView) {
      onSelectClientToView(schoolId);
    } else {
      onBackToApp();
    }
  };

  // Export Global JSON Backup
  const handleExportGlobalBackup = () => {
    const backupData = {
      system: 'RESERVE_LABS_MULTI_TENANT',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      schools,
      rooms: allRooms,
      users,
      reservations: allReservations,
      announcements: allAnnouncements,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_reserve_labs_global_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle JSON Import
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.schools && Array.isArray(parsed.schools)) {
            localStorage.setItem('reserve_school_schools_list', JSON.stringify(parsed.schools));
            if (parsed.rooms) localStorage.setItem('reserve_school_rooms', JSON.stringify(parsed.rooms));
            if (parsed.users) localStorage.setItem('reserve_school_users_list', JSON.stringify(parsed.users));
            if (parsed.reservations) localStorage.setItem('reserve_school_reservations', JSON.stringify(parsed.reservations));
            if (parsed.announcements) localStorage.setItem('reserve_school_announcements', JSON.stringify(parsed.announcements));
            
            alert('Banco de dados restaurado com sucesso! A página será recarregada.');
            window.location.reload();
          } else {
            alert('Arquivo JSON inválido: estrutura de escolas não encontrada.');
          }
        } catch (err) {
          alert('Erro ao processar arquivo JSON de backup.');
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Developer Command Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-indigo-900/50 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Voltar ao Sistema de Reservas"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao App</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black tracking-tight text-white font-mono">
                  DEV CONSOLE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  ÁREA RESTRITA DO DESENVOLVEDOR
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cadastro, Provisionamento & Gestão de Clientes Multi-Tenant
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportGlobalBackup}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar backup completo de todas as escolas em JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Backup Global JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exitDeveloperMode();
              onBackToApp();
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sair do Modo Dev</span>
          </button>
        </div>
      </header>

      {/* Diagnostics / Overview Stats Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Clientes / Escolas</p>
              <p className="text-base font-black text-white font-mono">{totalSchoolsCount}</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Espaços Provisionados</p>
              <p className="text-base font-black text-white font-mono">{totalRoomsCount}</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Usuários & Gestores</p>
              <p className="text-base font-black text-white font-mono">{totalUsersCount} ({totalAdminsCount} admins)</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total de Reservas</p>
              <p className="text-base font-black text-white font-mono">{totalReservationsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Navigation Tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('ONBOARDING')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ONBOARDING'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Novo Cliente (Wizard)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CLIENTS_LIST')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CLIENTS_LIST'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Diretório de Clientes ({schools.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADMINS_CREDENTIALS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ADMINS_CREDENTIALS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Credenciais dos Gestores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BACKUP_TOOLS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'BACKUP_TOOLS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Ferramentas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DOCS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guia de Implantação</span>
          </button>
        </div>

        {/* TAB 1: ONBOARDING WIZARD */}
        {activeTab === 'ONBOARDING' && (
          <div className="space-y-6">
            {/* Success Card if client was just created */}
            {lastCreatedClient && (
              <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 rounded-3xl shadow-2xl animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Cliente Provisionado com Sucesso!
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                          ATIVO
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white">
                        {lastCreatedClient.school.name}
                      </h2>
                      <p className="text-xs text-slate-300">
                        {lastCreatedClient.school.city} - {lastCreatedClient.school.state} • INEP {lastCreatedClient.school.inepCode || lastCreatedClient.school.code} • {lastCreatedClient.roomsCount} Espaços Criados
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyWelcomeText}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                    >
                      {copiedWelcomeMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                      <span>{copiedWelcomeMessage ? 'Copiado para Área de Transferência!' : 'Copiar Dossiê para WhatsApp/E-mail'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccessClientInstance(lastCreatedClient.school.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Acessar Ambiente Deste Cliente Agora</span>
                    </button>
                  </div>
                </div>

                {/* Credentials summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-2 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Gestor Master Vinculado:</span>
                    <span className="font-bold text-white text-sm">{lastCreatedClient.adminUser?.name || 'Administrador'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">E-mail Institucional de Login:</span>
                    <span className="font-mono text-indigo-300 text-xs font-bold">{lastCreatedClient.adminUser?.email}</span>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Senha de Acesso Inicial:</span>
                    <span className="font-mono text-emerald-400 text-sm font-black">{lastCreatedClient.rawPassword}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6 pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[11px] font-bold border border-indigo-500/20 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Provisionador Automático de Escolas</span>
                  </div>
                  <h1 className="text-xl font-black text-white">
                    Formulário de Cadastro do Cliente / Tenant
                  </h1>
                  <p className="text-xs text-slate-400">
                    Preencha as informações institucionais para provisionar o banco de dados isolado e os laboratórios da nova escola.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Template: Auto-Provisioning v3
                  </span>
                </div>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p>{formError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                {/* 1. Institutional Info */}
                <div>
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>1. Dados Institucionais do Cliente</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Razão Social / Nome Completo da Instituição: *
                      </label>
                      <input
                        type="text"
                        required
                        value={onboardingForm.name}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, name: e.target.value })}
                        placeholder="ex: Escola Estadual Governador Milton Campos"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Sigla / Nome Curto (para comprovantes):
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.shortName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, shortName: e.target.value })}
                        placeholder="ex: E.E. Milton Campos"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Código INEP / MEC / CNPJ:
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.inepCode}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, inepCode: e.target.value, code: e.target.value })}
                        placeholder="ex: 31002341"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Tipo de Rede / Esfera:
                      </label>
                      <select
                        value={onboardingForm.networkType}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, networkType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="Estadual">Rede Estadual (SEE/MG)</option>
                        <option value="Municipal">Rede Municipal</option>
                        <option value="Federal">Rede Federal / IF</option>
                        <option value="Particular">Rede Particular / Privada</option>
                        <option value="Tecnológico">Centro Tecnológico / ETEC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Cidade e Estado (UF):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={onboardingForm.city}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, city: e.target.value })}
                          placeholder="Cidade (ex: Belo Horizonte)"
                          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                        <input
                          type="text"
                          value={onboardingForm.state}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, state: e.target.value })}
                          placeholder="UF"
                          className="w-16 px-2.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs text-center font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nome do(a) Diretor(a) Geral:
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.directorName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, directorName: e.target.value })}
                        placeholder="ex: Maria da Silva"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Telefone / Ramal Institucional:
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.phone}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                        placeholder="(31) 3333-0000"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        E-mail de Contato da Escola:
                      </label>
                      <input
                        type="email"
                        value={onboardingForm.contactEmail}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, contactEmail: e.target.value })}
                        placeholder="escola@educacao.mg.gov.br"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                {/* 2. Operational Rules */}
                <div>
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>2. Parâmetros Operacionais & Regras de Reserva</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Shifts selection */}
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <label className="block text-[11px] font-bold text-slate-300 mb-2">
                        Turnos de Atendimento:
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'MANHA' as ShiftType, label: 'Manhã (07:00 - 12:20)' },
                          { id: 'TARDE' as ShiftType, label: 'Tarde (13:00 - 18:20)' },
                          { id: 'NOITE' as ShiftType, label: 'Noite (18:40 - 22:40)' },
                          { id: 'INTEGRAL' as ShiftType, label: 'Integral (07:30 - 16:35)' },
                        ].map((shift) => (
                          <label
                            key={shift.id}
                            className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={onboardingForm.shifts.includes(shift.id)}
                              onChange={() => handleShiftToggle(shift.id)}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                            />
                            <span>{shift.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Max advance days */}
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Antecedência Máxima (Dias):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={onboardingForm.maxAdvanceDays}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, maxAdvanceDays: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                      />
                      <p className="text-[10px] text-slate-400">
                        Padrão recomendado: 30 dias para planejamento bimestral.
                      </p>
                    </div>

                    {/* Approvals and rules */}
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onboardingForm.requireAdminApproval}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, requireAdminApproval: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-white block">Exigir Aprovação Prévia</span>
                          <span className="text-[10px] text-slate-400">
                            Reservas de professores entram como pendentes.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onboardingForm.allowWeekendBooking}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, allowWeekendBooking: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-white block">Permitir Fins de Semana</span>
                          <span className="text-[10px] text-slate-400">
                            Habilitar sábados para reposição de aulas.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                {/* 3. Initial Administrator Credentials */}
                <div>
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>3. Administrador Master / Gestor Inicial do Cliente</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nome do Administrador Master: *
                      </label>
                      <input
                        type="text"
                        required
                        value={onboardingForm.adminName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, adminName: e.target.value })}
                        placeholder="ex: Prof. Vinicius Carvalho"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        E-mail Institucional do Gestor: *
                      </label>
                      <input
                        type="email"
                        required
                        value={onboardingForm.adminEmail}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, adminEmail: e.target.value })}
                        placeholder="ex: gestor@educacao.mg.gov.br"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-300">
                          Senha Inicial de Acesso:
                        </label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                        >
                          Gerar Senha Forte
                        </button>
                      </div>
                      <input
                        type="text"
                        value={onboardingForm.adminPassword}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, adminPassword: e.target.value })}
                        placeholder="educacao123"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                {/* 4. Room Blueprint Packages */}
                <div>
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>4. Pacote de Provisionamento de Laboratórios & Espaços (Blueprint)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Basic */}
                    <div
                      onClick={() => setOnboardingForm({ ...onboardingForm, roomPackage: 'STANDARD_BASIC' })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        onboardingForm.roomPackage === 'STANDARD_BASIC'
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-white text-xs">Pacote Educação Básica Padrão</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                          3 Espaços
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Ideal para Ensino Fundamental II e Médio Geral.
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Lab. de Informática & Tecnologia (35 comps)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Lab. de Ciências da Natureza & Biologia (32 bancadas)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Espaço Maker & Multimídia (30 lugares)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Option 2: Technical / Comprehensive */}
                    <div
                      onClick={() => setOnboardingForm({ ...onboardingForm, roomPackage: 'TECHNICAL_FULL' })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        onboardingForm.roomPackage === 'TECHNICAL_FULL'
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-white text-xs">Pacote Completo Técnico / Superior</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          5 Espaços
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Ideal para Escolas Técnicas, Polos de Tecnologia e Faculdades.
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Lab. Informática 1 (Desenvolvimento) + Lab 2 (Pesquisa)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Lab. de Química & Biotecnologia com Capela</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Centro Maker & Robótica com Impressão 3D</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Auditório Multimídia & Eventos (120 lugares)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Ao salvar, o banco isolado do cliente será imediatamente provisionado.</span>
                  </div>

                  <button
                    id="submit-onboarding-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitting ? 'Provisionando Tenant...' : 'Finalizar Cadastro & Provisionar Cliente'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTS DIRECTORY */}
        {activeTab === 'CLIENTS_LIST' && (
          <div className="space-y-4">
            {/* Status Feedback Message */}
            {deleteStatusMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                  deleteStatusMessage.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {deleteStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{deleteStatusMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteStatusMessage(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Pesquisar por escola, cidade, código INEP ou sigla..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ALL">Todas as Redes</option>
                  <option value="Estadual">Estadual (SEE/MG)</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Federal">Federal / IF</option>
                  <option value="Particular">Particular</option>
                </select>

                <button
                  type="button"
                  onClick={() => setActiveTab('ONBOARDING')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* School Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((school) => {
                if (!school) return null;
                const schoolRooms = (allRooms || []).filter((r) => r && r.schoolId === school.id);
                const schoolReservations = (allReservations || []).filter((r) => r && r.schoolId === school.id && r.status !== 'CANCELLED');
                const schoolTeachers = (users || []).filter((u) => u && u.schoolId === school.id);
                const isCurrent = school.id === currentSchoolId;

                return (
                  <div
                    key={school.id}
                    className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-indigo-500 shadow-xl ring-1 ring-indigo-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-sm truncate" title={school.name}>
                              {school.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{school.city} - {school.state}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">INEP {school.inepCode || school.code}</span>
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20 shrink-0">
                          {school.networkType || 'Estadual'}
                        </span>
                      </div>

                      {/* Stats pills */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/80 mb-3 text-center">
                        <div className="p-1.5 bg-slate-950/60 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-bold block">Salas</span>
                          <span className="text-xs font-black text-white font-mono">{schoolRooms.length}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950/60 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-bold block">Docentes</span>
                          <span className="text-xs font-black text-white font-mono">{schoolTeachers.length}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950/60 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-bold block">Reservas</span>
                          <span className="text-xs font-black text-white font-mono">{schoolReservations.length}</span>
                        </div>
                      </div>

                      {/* Admin List Preview */}
                      <div className="space-y-1 text-[11px] mb-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Responsáveis Autorizados ({school.adminEmails?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {(school.adminEmails || []).map((email) => (
                            <span
                              key={email}
                              className="px-2 py-0.5 rounded-md bg-slate-950 text-indigo-300 border border-slate-800 text-[10px] font-mono truncate max-w-[200px]"
                            >
                              {email}
                            </span>
                          ))}
                          {(!school.adminEmails || school.adminEmails.length === 0) && (
                            <span className="text-slate-500 italic text-[10px]">Nenhum administrador cadastrado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSchoolForAdminModal(school)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Users className="w-3 h-3 text-indigo-400" />
                          <span>Gestores</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSchoolToDelete(school);
                            setDeleteConfirmationText('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/40 hover:border-rose-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Excluir cliente e dados vinculados"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Excluir</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAccessClientInstance(school.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Acessar Ambiente</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ADMINS & CREDENTIALS MANAGEMENT */}
        {activeTab === 'ADMINS_CREDENTIALS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white">Central de Gestores & Credenciais</h2>
                <p className="text-xs text-slate-400">
                  Lista unificada de todos os administradores e responsáveis de cada escola com opção de reset de senha imediato.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Gestor / Nome</th>
                    <th className="pb-3 px-3">E-mail de Login</th>
                    <th className="pb-3 px-3">Escola Vinculada</th>
                    <th className="pb-3 px-3">Função</th>
                    <th className="pb-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(users || [])
                    .filter((u) => u && u.role === 'ADMIN')
                    .map((admin) => {
                      const userSchool = (schools || []).find((s) => s && s.id === admin.schoolId);

                      return (
                        <tr key={admin.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{admin.name}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-indigo-300">
                            {admin.email}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {userSchool?.name || admin.schoolName || 'Escola Geral'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              Administrador
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminToResetPassword(admin);
                                setNewPasswordValue('educacao123');
                                setPasswordResetSuccess(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3 text-indigo-400" />
                              <span>Resetar Senha</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & SYSTEM TOOLS */}
        {activeTab === 'BACKUP_TOOLS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export / Import Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Backup Global do Banco de Dados</h3>
                  <p className="text-xs text-slate-400">Exportação e importação de toda a estrutura multi-tenant</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Gera um arquivo JSON contendo todas as <strong>{schools.length} escolas</strong>, <strong>{allRooms.length} laboratórios</strong>, <strong>{users.length} usuários</strong> e agendamentos.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExportGlobalBackup}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Backup Completo (.JSON)</span>
                  </button>

                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-slate-700">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Restaurar de Arquivo JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackupFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Factory Reset & Clean for Production */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Preparação para Produção & Limpeza</h3>
                  <p className="text-xs text-slate-400">Zerar agendamentos de homologação mantendo as escolas</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-bold text-[11px]">Banco em Nuvem Ativo (Firebase Firestore)</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">Auto-Sync Realtime</span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Gerenciamento de persistência em nuvem. Você pode zerar as reservas para produção ou limpar o banco de dados na nuvem para começar do zero.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja zerar todas as reservas e preparar para produção? As escolas e salas cadastradas serão preservadas.')) {
                        clearSystemForProduction();
                        alert('Sistema limpo para produção!');
                      }
                    }}
                    className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Zerar Apenas Reservas
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Atenção: Deseja LIMPAR O BANCO DE DADOS EM NUVEM E COMEÇAR DO ZERO? Todas as reservas e dados temporários serão apagados e reiniciados limpos.')) {
                        await clearCloudDatabase();
                        clearSystemForProduction();
                        alert('Banco de dados em nuvem limpo com sucesso! Pronto para começar do zero.');
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Limpar Nuvem (Começar do Zero)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Restaurar dados padrão de fábrica? Isso recarregará as escolas e salas padrão.')) {
                        resetToDefaultData();
                        alert('Dados padrão restaurados!');
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                  >
                    Restaurar Padrões
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DOCUMENTATION */}
        {activeTab === 'DOCS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-xs">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Guia Técnico de Implantação de Clientes</h2>
              <p className="text-slate-400">Instruções para o desenvolvedor cadastrar e entregar novos clientes da rede.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs">1</span>
                <h4 className="font-bold text-white text-sm">Cadastro do Cliente</h4>
                <p className="text-slate-400 leading-relaxed">
                  Preencha o formulário na aba "Cadastrar Novo Cliente" com o nome da instituição, cidade e e-mail do gestor master.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs">2</span>
                <h4 className="font-bold text-white text-sm">Provisionamento Automático</h4>
                <p className="text-slate-400 leading-relaxed">
                  O sistema cria as salas (Informática, Ciências, Maker), configura os turnos e gera a credencial de Administrador com senha inicial.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs">3</span>
                <h4 className="font-bold text-white text-sm">Entrega do Dossiê</h4>
                <p className="text-slate-400 leading-relaxed">
                  Copie o texto de boas-vindas e envie ao gestor da escola por e-mail ou WhatsApp com o link de acesso institucional.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Manage Admins for School */}
      {selectedSchoolForAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Gestores Autorizados</h3>
                <p className="text-xs text-slate-400">{selectedSchoolForAdminModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForAdminModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Adicionar Novo Administrador para esta Escola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newAdminEmailInput}
                    onChange={(e) => setNewAdminEmailInput(e.target.value)}
                    placeholder="e-mail: coordenador@educacao.mg.gov.br"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAdminEmailInput.trim()) {
                        assignSchoolAdmin(selectedSchoolForAdminModal.id, newAdminEmailInput.trim(), newAdminNameInput);
                        setNewAdminEmailInput('');
                        setNewAdminNameInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Lista Atual de E-mails com Permissão de Admin:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(selectedSchoolForAdminModal.adminEmails || []).map((email) => (
                    <div
                      key={email}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-mono text-indigo-300 font-bold">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeSchoolAdmin(selectedSchoolForAdminModal.id, email)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                        title="Remover permissão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedSchoolForAdminModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password for Admin */}
      {adminToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Resetar Senha do Gestor</h3>
                <p className="text-xs text-indigo-400 font-mono">{adminToResetPassword.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdminToResetPassword(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {passwordResetSuccess ? (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Senha atualizada com sucesso!</span>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Nova senha: <code className="font-mono text-emerald-400 font-bold">{newPasswordValue}</code>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Digite a Nova Senha para {adminToResetPassword.name}:
                  </label>
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="ex: educacao123"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    O gestor poderá entrar imediatamente com esta nova senha.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAdminToResetPassword(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                {passwordResetSuccess ? 'Concluído' : 'Cancelar'}
              </button>

              {!passwordResetSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    if (newPasswordValue.trim()) {
                      changePassword(adminToResetPassword.id, newPasswordValue.trim());
                      setPasswordResetSuccess(true);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
                >
                  Salvar Nova Senha
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Delete Client Confirmation */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-5 bg-rose-950/40 border-b border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Excluir Cliente / Instituição</h3>
                  <p className="text-xs text-rose-300">Confirmação de exclusão permanente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSchoolToDelete(null);
                  setDeleteConfirmationText('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-bold uppercase">Instituição Selecionada:</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-[10px] font-bold">
                    {schoolToDelete.networkType || 'Estadual'}
                  </span>
                </div>
                <h4 className="text-white font-black text-base">{schoolToDelete.name}</h4>
                <p className="text-slate-400 text-[11px]">
                  {schoolToDelete.city} - {schoolToDelete.state} • Código: <span className="font-mono text-slate-300">{schoolToDelete.code || schoolToDelete.inepCode || 'N/A'}</span>
                </p>
              </div>

              {schools.length <= 1 ? (
                <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ação Bloqueada: Única Instituição do Sistema</span>
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Não é possível remover a única escola cadastrada. Para excluir esta instituição, cadastre primeiro um novo cliente na aba <strong>&quot;Onboarding de Clientes&quot;</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl space-y-2 text-rose-200">
                    <p className="font-bold flex items-center gap-1.5 text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Impacto da Exclusão:</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Esta ação é irreversível. Todos os dados associados a esta escola serão apagados localmente e no banco de dados em nuvem:
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                      <div className="p-2 bg-slate-950/80 rounded-xl border border-rose-900/40">
                        <span className="text-[10px] text-slate-400 block">Salas</span>
                        <span className="text-xs font-bold text-white">
                          {(allRooms || []).filter((r) => r && schoolToDelete && r.schoolId === schoolToDelete.id).length}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950/80 rounded-xl border border-rose-900/40">
                        <span className="text-[10px] text-slate-400 block">Reservas</span>
                        <span className="text-xs font-bold text-white">
                          {(allReservations || []).filter((r) => r && schoolToDelete && r.schoolId === schoolToDelete.id).length}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950/80 rounded-xl border border-rose-900/40">
                        <span className="text-[10px] text-slate-400 block">Avisos</span>
                        <span className="text-xs font-bold text-white">
                          {(allAnnouncements || []).filter((a) => a && schoolToDelete && a.schoolId === schoolToDelete.id).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {schoolToDelete.id === currentSchoolId && (
                    <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/20">
                      ℹ️ Esta escola é o ambiente atualmente ativo. Ao excluí-la, o sistema alternará automaticamente para outra instituição disponível.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setSchoolToDelete(null);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {schools.length > 1 && (
                <button
                  type="button"
                  disabled={isDeletingClient}
                  onClick={handleConfirmDeleteSchool}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/50 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingClient ? 'Excluindo...' : 'Confirmar e Excluir'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
