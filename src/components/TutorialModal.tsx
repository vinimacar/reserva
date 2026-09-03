import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Printer,
  Download,
  Calendar,
  Layers,
  Repeat,
  Shield,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  CalendarPlus,
  Info,
  Clock,
  Laptop,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  School,
  FileText,
  KeyRound,
  Users,
  Settings,
} from 'lucide-react';
import { useReservations } from '../context/ReservationContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey =
  | 'OVERVIEW'
  | 'BOOKING_GUIDE'
  | 'PERIOD_RECURRING'
  | 'SCHEDULE_GRID'
  | 'MY_RESERVATIONS'
  | 'ADMIN_GUIDE'
  | 'BEST_PRACTICES';

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { settings, currentSchool } = useReservations();
  const [activeTab, setActiveTab] = useState<TabKey>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handlePrintPDF = () => {
    // We trigger window.print() which renders the dedicated @media print layout
    window.print();
  };

  const schoolName = settings.schoolName || currentSchool?.name || 'Escola Estadual';
  const shortSchoolName = settings.shortName || 'RESERVE LABS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      {/* Printable Document Container (Screen Modal & Print View) */}
      <div
        id="tutorial-printable-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* MODAL HEADER (Hidden during print or styled cleanly) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Manual & Tutorial do Usuário
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  RESERVE LABS v3.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                Guia completo de agendamento de laboratórios para docentes e gestão • {schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download / Print PDF Button */}
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              title="Salvar como PDF ou Imprimir este Manual"
            >
              <Printer className="w-4 h-4" />
              <span>Baixar / Imprimir PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL MAIN LAYOUT (Sidebar Tabs + Content Area) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800 p-3 space-y-1 shrink-0 overflow-y-auto hidden md:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1">
              Capítulos do Guia
            </p>

            {[
              { id: 'OVERVIEW', label: '1. Visão Geral & Acesso', icon: GraduationCap },
              { id: 'BOOKING_GUIDE', label: '2. Como Fazer uma Reserva', icon: Calendar },
              { id: 'PERIOD_RECURRING', label: '3. Período & Recorrência', icon: Repeat },
              { id: 'SCHEDULE_GRID', label: '4. Grade de Horários', icon: Layers },
              { id: 'MY_RESERVATIONS', label: '5. Comprovantes & Agenda', icon: QrCode },
              { id: 'ADMIN_GUIDE', label: '6. Coordenação & Admin', icon: Shield },
              { id: 'BEST_PRACTICES', label: '7. Regras e Boas Práticas', icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as TabKey)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{label}</span>
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 px-2">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300">
                <span className="font-bold block mb-0.5">Dica de Exportação:</span>
                Clique em <strong>"Baixar / Imprimir PDF"</strong> e selecione a opção <em>"Salvar como PDF"</em> na janela de impressão do seu navegador.
              </div>
            </div>
          </div>

          {/* Mobile Tab Pill Bar */}
          <div className="md:hidden flex items-center space-x-1.5 p-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
            {[
              { id: 'OVERVIEW', label: 'Visão Geral' },
              { id: 'BOOKING_GUIDE', label: 'Reserva Simples' },
              { id: 'PERIOD_RECURRING', label: 'Período/Recorrência' },
              { id: 'SCHEDULE_GRID', label: 'Grade' },
              { id: 'MY_RESERVATIONS', label: 'Comprovantes' },
              { id: 'ADMIN_GUIDE', label: 'Admin' },
              { id: 'BEST_PRACTICES', label: 'Regras' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as TabKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content Body (Scrollable) */}
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-6">
            {/* CHAPTER 1: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>Capítulo 1</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Visão Geral do Sistema RESERVE LABS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    O <strong>RESERVE</strong> é a plataforma oficial de gestão, controle e agendamento dos laboratórios de informática, ciências, salas de robótica, auditórios e carrinhos de Chromebooks da <strong>{schoolName}</strong>.
                  </p>
                </div>

                {/* Key Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Zero Choques de Horário
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Travas de concorrência automáticas no banco de dados impedem duplicidades entre professores.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Integração com Agenda
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sincronize com o Google Agenda e exporte arquivos <code>.ics</code> com 1 clique para o celular.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Comprovantes Digitais
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Emissão de comprovante oficial com QR Code para validação da coordenação pedagógica.
                    </p>
                  </div>
                </div>

                {/* Login & Access Instructions */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Como Fazer Login e Primeiro Acesso</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>
                      <strong>1. E-mail Institucional:</strong> Utilize seu e-mail funcional (ex.: <code>nome.sobrenome@educacao.mg.gov.br</code>) ou selecione seu nome na lista rápida de docentes da escola.
                    </p>
                    <p>
                      <strong>2. Senha Inicial Padrão:</strong> Para o primeiro acesso de novos docentes cadastrados, a senha padrão é <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono font-bold">educacao123</code>.
                    </p>
                    <p>
                      <strong>3. Alteração de Senha:</strong> Após entrar no sistema, clique no seu avatar no canto superior direito e selecione a opção <em>"Alterar Senha de Acesso"</em> para definir sua senha pessoal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 2: BOOKING GUIDE */}
            {activeTab === 'BOOKING_GUIDE' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Capítulo 2</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Passo a Passo: Como Realizar uma Reserva
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Siga o roteiro abaixo para garantir a sala para suas aulas com facilidade.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Selecionar o Laboratório ou Sala',
                      desc: 'Escolha o ambiente desejado (ex.: Laboratório de Informática 1, Sala Maker, Auditório). O sistema exibe a capacidade de alunos, computadores disponíveis e localização.',
                    },
                    {
                      step: '2',
                      title: 'Definir a Data e o Turno Escolar',
                      desc: 'Indique o dia da aula e o turno correspondente (Manhã, Tarde, Noite ou Integral). O sistema carrega os horários específicos da grade.',
                    },
                    {
                      step: '3',
                      title: 'Escolher as Aulas / Horários',
                      desc: 'Selecione uma ou mais aulas consecutivas (ex.: 1ª e 2ª Aulas). A seleção é multi-período, permitindo reservar blocos inteiros com um só clique.',
                    },
                    {
                      step: '4',
                      title: 'Informar Turma e Disciplina',
                      desc: 'Selecione a turma (ex.: 3º Ano EM A, 9º Ano EF) e o componente curricular. Você também pode digitar e salvar turmas personalizadas da sua escola.',
                    },
                    {
                      step: '5',
                      title: 'Tema da Aula e Equipamentos Adicionais (Opcional)',
                      desc: 'Descreva o conteúdo pedagógico e selecione recursos extras necessários, como Projetor Datashow, Caixa de Som ou Fones de Ouvido.',
                    },
                    {
                      step: '6',
                      title: 'Confirmar e Sincronizar',
                      desc: 'O sistema realiza a validação instantânea no banco de dados. Ao concluir, você pode exportar a aula para o Google Agenda ou baixar o comprovante.',
                    },
                  ].map(({ step, title, desc }) => (
                    <div
                      key={step}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start space-x-3.5"
                    >
                      <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {step}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                          {title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 3: PERIOD & RECURRING */}
            {activeTab === 'PERIOD_RECURRING' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Repeat className="w-4 h-4" />
                    <span>Capítulo 3</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Agendamento por Período e Recorrência Semanal
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Precisa do laboratório para uma semana inteira de projetos ou para aulas fixas durante o bimestre? O sistema oferece três modalidades flexíveis:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>Modo 1: Dia Único</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Reserva avulsa para uma data específica com botões de atalho rápido (Hoje, Amanhã, Em 2 dias).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Layers className="w-4 h-4" />
                      <span>Modo 2: Intervalo / Período</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Agende da <strong>Data Inicial à Data Final</strong> com filtro opcional de <em>"Apenas dias letivos (Segunda a Sexta)"</em>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <Repeat className="w-4 h-4" />
                      <span>Modo 3: Recorrência</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Escolha os dias da semana (ex.: toda terça e quinta) com duração de 2 semanas, 4 semanas (1 mês) ou 8 semanas (bimestre).
                    </p>
                  </div>
                </div>

                {/* Conflict analysis & skip feature */}
                <div className="p-5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Como Funciona o Detector Inteligente de Conflitos:</span>
                  </div>
                  <p className="leading-relaxed">
                    Antes de gravar, o sistema testa todas as datas do período. Se outro professor já reservou uma aula em uma das datas intermediárias, você pode marcar a opção <strong>"Agendar apenas as datas livres (ignorar conflitos)"</strong>. O sistema agendará automaticamente todos os dias disponíveis e informará detalhadamente quais dias foram ignorados.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 4: SCHEDULE GRID */}
            {activeTab === 'SCHEDULE_GRID' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Capítulo 4</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Grade Semanal e Visualização de Ocupação
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    A tela principal oferece uma visão panorâmica completa do uso dos espaços da escola:
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Filtros de Data, Turno e Laboratório</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Navegue entre semanas usando os botões de seta ou selecione uma data específica no calendário. Alterne os turnos (Manhã, Tarde, Noite, Integral) para conferir a grade horária exata.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Agendamento Direto pelo Clique no Horário Livre</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ao visualizar um espaço livre na grade, clique diretamente no card do horário para abrir o formulário já pré-preenchido com a data, sala e aula selecionadas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 5: MY RESERVATIONS & SYNC */}
            {activeTab === 'MY_RESERVATIONS' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                    <QrCode className="w-4 h-4" />
                    <span>Capítulo 5</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Minhas Reservas, Comprovantes & Sincronização
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Na aba <strong>"Minhas Reservas"</strong>, o professor tem controle total de suas aulas agendadas, histórico e ferramentas de integração:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <CalendarPlus className="w-4 h-4" />
                      <span>Google Agenda & Arquivos .ics</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Clique em <strong>"Adicionar ao Google Agenda"</strong> para criar o evento diretamente no seu calendário pessoal com lembretes automáticos no celular, ou baixe o arquivo <code>.ics</code> com 1 clique.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <QrCode className="w-4 h-4" />
                      <span>Comprovante com QR Code</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Gere um comprovante oficial em PDF ou formato para impressão. O QR Code gerado permite que a equipe gestora confira a autenticidade da reserva na porta do laboratório.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 6: ADMIN GUIDE */}
            {activeTab === 'ADMIN_GUIDE' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Shield className="w-4 h-4" />
                    <span>Capítulo 6</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Guia da Coordenação Pedagógica e Administradores
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    O <strong>Painel Administrativo</strong> centraliza a governança pedagógica e de infraestrutura dos laboratórios da escola:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-blue-600" />
                      <span>1. Gestão de Salas, Laboratórios e Equipamentos</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Cadastre novas salas de informática, laboratórios móveis de Chromebooks ou salas de projeção. Defina a capacidade de alunos, computadores operacionais e marque o status de <strong>Manutenção</strong> quando necessário para bloquear reservas indevidas.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>2. Cadastro de Docentes e Definição de Perfis</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Adicione novos professores, defina a disciplina de atuação e altere perfis de acesso entre <strong>Professor</strong> e <strong>Administrador / Coordenador</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>3. Relatórios Estatísticos e Métricas de Ocupação</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Consulte a taxa de ocupação dos laboratórios por turno, as disciplinas mais ativas e exporte relatórios consolidados para a prestação de contas pedagógica da Superintendência de Ensino (SRE).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 7: BEST PRACTICES */}
            {activeTab === 'BEST_PRACTICES' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Capítulo 7</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Boas Práticas e Regras de Convivência dos Laboratórios
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Diretrizes para garantir a conservação do patrimônio escolar e a harmonia entre o corpo docente:
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">Cancelamento Responsável:</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Caso sua aula prática precise ser remarcada, cancele a reserva no sistema com antecedência para liberar o horário aos demais colegas de área.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">Preservação e Organização dos Equipamentos:</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Ao término da aula, oriente os alunos a desligarem os computadores corretamente, recolherem materiais e organizarem cadeiras e periféricos.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">Reporte Imediato de Avarias:</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Qualquer defeito identificado em computadores, projetores ou rede deve ser comunicado imediatamente à coordenação ou registrado no campo de observações.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <School className="w-3.5 h-3.5 text-blue-500" />
            <span>Sistema RESERVE LABS • {schoolName}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Salvar em PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Fechar Guia
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT STYLES (Enforces clean PDF output on window.print()) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #tutorial-printable-content, #tutorial-printable-content * {
            visibility: visible;
          }
          #tutorial-printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            max-height: none;
            box-shadow: none;
            border: none;
            background: white !important;
            color: black !important;
          }
          button {
            display: none !important;
          }
          .md\\:w-64 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
