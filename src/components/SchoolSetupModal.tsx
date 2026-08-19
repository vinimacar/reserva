import React, { useState, useEffect } from 'react';
import {
  School,
  Building2,
  MapPin,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  Shield,
  Phone,
  Hash,
  X,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { ShiftType, SchoolSettings } from '../types';

interface SchoolSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

const POPULAR_TEMPLATES = [
  {
    label: 'Escola Estadual (Minas Gerais)',
    schoolName: 'E.E. Governador Milton Campos',
    shortName: 'E.E. Milton Campos',
    city: 'Belo Horizonte',
    state: 'MG',
    inepCode: '31002341',
    networkType: 'Estadual',
    shifts: ['MANHA', 'TARDE', 'NOITE'] as ShiftType[],
    contactEmail: 'escola.310023@educacao.mg.gov.br',
    phone: '(31) 3222-1000',
    directorName: 'Prof. Vinicius Carvalho',
  },
  {
    label: 'Escola Municipal (Ensino Fundamental)',
    schoolName: 'E.M. Professora Cecília Meireles',
    shortName: 'E.M. Cecília Meireles',
    city: 'Contagem',
    state: 'MG',
    inepCode: '31045892',
    networkType: 'Municipal',
    shifts: ['MANHA', 'TARDE'] as ShiftType[],
    contactEmail: 'cecilia.meireles@educacao.contagem.mg.gov.br',
    phone: '(31) 3390-5500',
    directorName: 'Profa. Mariana Souza',
  },
  {
    label: 'Instituto Federal / Escola Técnica',
    schoolName: 'Instituto Federal de Educação, Ciência e Tecnologia',
    shortName: 'IFMG - Campus Central',
    city: 'Belo Horizonte',
    state: 'MG',
    inepCode: '31289012',
    networkType: 'Federal',
    shifts: ['MANHA', 'TARDE', 'NOITE'] as ShiftType[],
    contactEmail: 'ti.laboratorios@ifmg.edu.br',
    phone: '(31) 3615-8000',
    directorName: 'Prof. Carlos Eduardo',
  },
];

export const SchoolSetupModal: React.FC<SchoolSetupModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false,
}) => {
  const { settings, updateSettings } = useReservations();
  const { updateSchoolNameForAllUsers } = useAuth();

  const [schoolName, setSchoolName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateCode, setStateCode] = useState<string>('MG');
  const [inepCode, setInepCode] = useState<string>('');
  const [networkType, setNetworkType] = useState<string>('Estadual');
  const [selectedShifts, setSelectedShifts] = useState<ShiftType[]>(['MANHA', 'TARDE', 'NOITE']);
  const [contactEmail, setContactEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [directorName, setDirectorName] = useState<string>('');
  
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form values from current settings
  useEffect(() => {
    if (isOpen) {
      setSchoolName(settings.schoolName || '');
      setShortName(settings.shortName || settings.schoolName?.split('-')[0]?.trim() || '');
      setCity(settings.city || 'Belo Horizonte');
      setStateCode(settings.state || 'MG');
      setInepCode(settings.inepCode || '');
      setNetworkType(settings.networkType || 'Estadual');
      setSelectedShifts(settings.shifts || ['MANHA', 'TARDE', 'NOITE']);
      setContactEmail(settings.contactEmail || '');
      setPhone(settings.phone || '');
      setDirectorName(settings.directorName || '');
      setSavedSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleToggleShift = (shift: ShiftType) => {
    setSelectedShifts((prev) => {
      if (prev.includes(shift)) {
        if (prev.length === 1) return prev; // keep at least 1 shift
        return prev.filter((s) => s !== shift);
      } else {
        return [...prev, shift];
      }
    });
  };

  const handleApplyTemplate = (tpl: typeof POPULAR_TEMPLATES[0]) => {
    setSchoolName(tpl.schoolName);
    setShortName(tpl.shortName);
    setCity(tpl.city);
    setStateCode(tpl.state);
    setInepCode(tpl.inepCode);
    setNetworkType(tpl.networkType);
    setSelectedShifts(tpl.shifts);
    setContactEmail(tpl.contactEmail);
    setPhone(tpl.phone);
    setDirectorName(tpl.directorName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!schoolName.trim()) {
      setErrorMessage('Por favor, informe o nome da escola.');
      return;
    }

    if (!contactEmail.trim()) {
      setErrorMessage('Informe um e-mail de contato da escola.');
      return;
    }

    if (selectedShifts.length === 0) {
      setErrorMessage('Selecione pelo menos um turno de funcionamento.');
      return;
    }

    const finalShortName = shortName.trim() || schoolName.trim().slice(0, 30);

    const updatedData: Partial<SchoolSettings> = {
      schoolName: schoolName.trim(),
      shortName: finalShortName,
      city: city.trim(),
      state: stateCode.trim(),
      inepCode: inepCode.trim(),
      networkType,
      shifts: selectedShifts,
      contactEmail: contactEmail.trim(),
      phone: phone.trim(),
      directorName: directorName.trim(),
      isConfigured: true,
      configuredAt: new Date().toISOString(),
    };

    updateSettings(updatedData);
    updateSchoolNameForAllUsers(schoolName.trim());
    localStorage.setItem('reserve_school_configured', 'true');

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25 shadow-inner">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white">
                  {isFirstTime ? 'Configuração Inicial da Escola' : 'Dados Cadastrais da Escola'}
                </h3>
                {isFirstTime && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 uppercase">
                    1º Acesso
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100/85 mt-0.5">
                {isFirstTime
                  ? 'Cadastre as informações da sua instituição de ensino para personalizar o sistema'
                  : 'Atualize os dados institucionais, turnos e contato da unidade escolar'}
              </p>
            </div>
          </div>

          {!isFirstTime && (
            <button
              id="close-school-setup-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 flex-1">
          {/* Welcome Alert for First Time */}
          {isFirstTime && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start space-x-3.5">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Bem-vindo ao RESERVE - Gestão de Salas & Laboratórios
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Para emitir comprovantes oficiais de agendamento, organizar a grade semanal e vincular os professores,
                  por favor confirme os dados da sua escola abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Quick Preset Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Exemplos Prontos de Preenchimento Rápido:
              </label>
              <span className="text-[10px] text-slate-400">Clique para preencher automaticamente</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {POPULAR_TEMPLATES.map((tpl, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all cursor-pointer group"
                >
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tpl.label}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{tpl.schoolName}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-2xl p-3 flex items-center space-x-2 text-red-800 dark:text-red-200">
              <X className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {savedSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 flex items-center space-x-3 text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-bold text-xs">Escola salva e configurada com sucesso!</p>
            </div>
          )}

          {/* 1. Identificação Principal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              1. Identificação da Instituição
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo da Escola / Unidade Escolar <span className="text-red-500">*</span>
              </label>
              <input
                id="school-name-input"
                type="text"
                placeholder="Ex: Escola Estadual Governador Milton Campos"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Abreviado / Sigla (para cabeçalho):
                </label>
                <input
                  id="school-short-name-input"
                  type="text"
                  placeholder="Ex: E.E. Milton Campos"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rede de Ensino / Esfera:
                </label>
                <select
                  value={networkType}
                  onChange={(e) => setNetworkType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Estadual">Rede Estadual de Ensino</option>
                  <option value="Municipal">Rede Municipal de Ensino</option>
                  <option value="Federal">Rede Federal / IF</option>
                  <option value="Particular">Rede Privada / Particular</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade / Município:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Belo Horizonte"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado (UF):
                </label>
                <input
                  type="text"
                  placeholder="Ex: MG"
                  value={stateCode}
                  maxLength={2}
                  onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium uppercase font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Código INEP / Registro da Escola (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: 31002341"
                value={inepCode}
                onChange={(e) => setInepCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 2. Turnos Atendidos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              2. Turnos com Aulas e Laboratórios Ativos
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MANHA' as ShiftType, label: 'Manhã', time: '07:00 às 12:20' },
                { id: 'TARDE' as ShiftType, label: 'Tarde', time: '13:00 às 18:20' },
                { id: 'NOITE' as ShiftType, label: 'Noite', time: '19:00 às 22:10' },
              ].map((t) => {
                const isSelected = selectedShifts.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleToggleShift(t.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <p className="font-bold text-xs">{t.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{t.time}</p>
                    <span
                      className={`inline-block text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded uppercase ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Ativo' : 'Desativado'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Contato e Responsável */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              3. Contato & Coordenação
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional de Contato / Suporte <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="escola@educacao.mg.gov.br"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone da Secretaria / Coordenação:
                </label>
                <input
                  type="text"
                  placeholder="(31) 3222-1000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Diretor(a) ou Coordenador(a) Geral:
              </label>
              <input
                type="text"
                placeholder="Ex: Prof. Vinicius Carvalho / Diretoria Pedagógica"
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
          {!isFirstTime ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Configuração necessária no 1º uso</span>
            </div>
          )}

          <button
            id="save-school-btn"
            onClick={handleSubmit}
            disabled={savedSuccess}
            className="px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-blue-500/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFirstTime ? 'Salvar Escola e Começar' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
