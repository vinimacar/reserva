import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  AlertCircle,
  UserCheck,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
  Sparkles,
  Users,
  FileText,
} from 'lucide-react';
import { Room } from '../types';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';

interface EditRoomDetailsModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onSuccess?: (updatedRoom: Room) => void;
}

const COMMON_EQUIPMENT_SUGGESTIONS = [
  'Computadores Core i5',
  'Lousa Digital Interativa',
  'Projetor Multimídia',
  'Ar Condicionado',
  'Internet Fibra de Alta Velocidade',
  'Smart TV 65" 4K',
  'Chromebooks Google Education',
  'Kits de Robótica Arduino',
  'Microscópios Ópticos',
  'Impressora 3D',
  'Headsets Individuais',
  'Caixas de Som Amplificadas',
  'Tubos de Ensaio e Vidrarias',
  'Quadro Branco Panorâmico',
];

const COMMON_RULES_SUGGESTIONS = [
  'Proibido entrar com alimentos ou bebidas',
  'Desligar todos os aparelhos e iluminação ao término',
  'Manter as bancadas e cadeiras alinhadas e limpas',
  'Uso obrigatório de jaleco de proteção',
  'Comunicar qualquer avaria técnica imediatamente',
  'Salvar arquivos em nuvem (Google Drive institucional)',
  'Não alterar as conexões físicas ou cabos de rede',
  'Uso exclusivo com acompanhamento do professor',
];

export const EditRoomDetailsModal: React.FC<EditRoomDetailsModalProps> = ({
  isOpen,
  room,
  onClose,
  onSuccess,
}) => {
  const { updateRoom } = useReservations();
  const { users, isAdmin } = useAuth();

  const [responsibleName, setResponsibleName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(30);
  const [description, setDescription] = useState<string>('');
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [rulesList, setRulesList] = useState<string[]>([]);

  // Input fields for adding new items
  const [newEquipmentInput, setNewEquipmentInput] = useState<string>('');
  const [newRuleInput, setNewRuleInput] = useState<string>('');
  const [successToast, setSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (room) {
      setResponsibleName(room.responsibleName || '');
      setLocation(room.location || '');
      setCapacity(room.capacity || 30);
      setDescription(room.description || '');
      setEquipmentList(room.equipment ? [...room.equipment] : []);
      setRulesList(room.rules ? [...room.rules] : []);
      setNewEquipmentInput('');
      setNewRuleInput('');
      setSuccessToast(false);
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  // Security guard: Only Admin can access
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Acesso Restrito ao Administrador
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Somente coordenadores e administradores têm permissão para editar os equipamentos, regras e responsáveis pelos espaços.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const handleAddEquipment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const item = newEquipmentInput.trim();
    if (!item) return;
    if (!equipmentList.includes(item)) {
      setEquipmentList([...equipmentList, item]);
    }
    setNewEquipmentInput('');
  };

  const handleRemoveEquipment = (indexToRemove: number) => {
    setEquipmentList(equipmentList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSuggestedEquipment = (suggested: string) => {
    if (!equipmentList.includes(suggested)) {
      setEquipmentList([...equipmentList, suggested]);
    }
  };

  const handleAddRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rule = newRuleInput.trim();
    if (!rule) return;
    if (!rulesList.includes(rule)) {
      setRulesList([...rulesList, rule]);
    }
    setNewRuleInput('');
  };

  const handleRemoveRule = (indexToRemove: number) => {
    setRulesList(rulesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSuggestedRule = (suggested: string) => {
    if (!rulesList.includes(suggested)) {
      setRulesList([...rulesList, suggested]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<Room> = {
      responsibleName: responsibleName.trim() || 'Coordenação',
      location: location.trim() || room.location,
      capacity: Number(capacity) || room.capacity,
      description: description.trim(),
      equipment: equipmentList,
      rules: rulesList,
    };

    updateRoom(room.id, updatedData);

    const fullUpdatedRoom: Room = {
      ...room,
      ...updatedData,
    };

    setSuccessToast(true);

    setTimeout(() => {
      if (onSuccess) {
        onSuccess(fullUpdatedRoom);
      }
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white">
                  Editar Equipamentos, Regras e Responsável
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Ambiente: <span className="font-bold text-white">{room.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs">
          {successToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Informações do espaço atualizadas com sucesso!</span>
            </div>
          )}

          {/* Section 1: Responsável e Dados Básicos */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Responsável e Localização</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Responsável */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Professor / Responsável pelo Espaço: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ex: Prof. Vinicius Carvalho ou Coordenação de TI"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Quick teacher selector helper */}
                {users.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-400">Atribuir a:</span>
                    {users.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setResponsibleName(u.name)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                      >
                        {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setResponsibleName('Coordenação Pedagógica & TI')}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Coordenação
                    </button>
                  </div>
                )}
              </div>

              {/* Localização */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Localização no Prédio Escolar:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Bloco B - 2º Andar (Sala 204)"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Capacidade */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Capacidade Máxima de Alunos:
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 30)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Descrição / Finalidade Pedagógica:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Laboratório climatizado para aulas práticas de informática e ciências"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Equipamentos Disponíveis */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Equipamentos e Recursos do Espaço ({equipmentList.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Itens disponíveis para os professores solicitarem
              </span>
            </div>

            {/* Current Equipment Tags */}
            <div className="min-h-[50px] p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 items-center">
              {equipmentList.length === 0 ? (
                <span className="text-slate-400 text-[11px] italic p-1">
                  Nenhum equipamento listado. Adicione itens abaixo.
                </span>
              ) : (
                equipmentList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(idx)}
                      className="text-indigo-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                      title="Remover equipamento"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add New Equipment Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ex: 36 Computadores, Lousa Digital, Projetor..."
                value={newEquipmentInput}
                onChange={(e) => setNewEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEquipment();
                  }
                }}
                className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddEquipment()}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Sugestões Rápidas de Equipamentos (clique para adicionar):
              </p>
              <div className="flex flex-wrap gap-1">
                {COMMON_EQUIPMENT_SUGGESTIONS.map((sug, i) => {
                  const isAdded = equipmentList.includes(sug);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSuggestedEquipment(sug)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                        isAdded
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
                      }`}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Normas e Regras de Utilização */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Normas & Regras de Utilização ({rulesList.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Orientações exibidas para os professores ao reservar
              </span>
            </div>

            {/* Current Rules List */}
            <div className="space-y-1.5">
              {rulesList.length === 0 ? (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] italic">
                  Nenhuma norma cadastrada. Adicione regras abaixo.
                </div>
              ) : (
                rulesList.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{rule}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                      title="Remover regra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Rule Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ex: Proibido alimentos e bebidas, desligar luzes após o uso..."
                value={newRuleInput}
                onChange={(e) => setNewRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddRule()}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Quick Rule Suggestions */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Sugestões Rápidas de Normas (clique para adicionar):
              </p>
              <div className="flex flex-wrap gap-1">
                {COMMON_RULES_SUGGESTIONS.map((sug, i) => {
                  const isAdded = rulesList.includes(sug);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSuggestedRule(sug)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                        isAdded
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer'
                      }`}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Modificações salvas são aplicadas imediatamente a todos os professores.</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black shadow-md shadow-blue-500/25 transition-all flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Informações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
