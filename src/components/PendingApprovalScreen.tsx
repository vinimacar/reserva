import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { TeacherAvatar } from './TeacherAvatar';
import {
  Clock,
  ShieldCheck,
  RotateCw,
  LogOut,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const PendingApprovalScreen: React.FC = () => {
  const { currentUser, logout, approveUser, isDeveloperMode } = useAuth();
  const { currentSchool, settings } = useReservations();
  const [isChecking, setIsChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);

  const schoolName = currentSchool?.name || currentUser?.schoolName || settings?.schoolName || 'Escola Estadual';
  const schoolCity = currentSchool?.city ? `${currentSchool.city} - ${currentSchool.state}` : 'Minas Gerais';
  const directorName = currentSchool?.directorName || 'Coordenação Pedagógica';
  const contactEmail = currentSchool?.contactEmail || 'escola@educacao.mg.gov.br';
  const contactPhone = currentSchool?.phone || '(31) 3222-1000';

  const handleManualCheck = () => {
    setIsChecking(true);
    setCheckFeedback(null);

    setTimeout(() => {
      setIsChecking(false);
      if (currentUser?.approvalStatus === 'APPROVED') {
        setCheckFeedback('Acesso liberado! Redirecionando...');
      } else {
        const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCheckFeedback(`Verificação realizada às ${timeNow}. O coordenador ainda não autorizou o acesso.`);
      }
    }, 900);
  };

  const handleSimulateApproval = () => {
    if (currentUser?.id) {
      approveUser(currentUser.id, 'Coordenação Pedagógica (Teste)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>{schoolName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                Rede Pública
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{schoolCity} • Sistema Integrado de Agendamento</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Conta</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center relative z-10">
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top amber border highlight */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />

          {/* Status Badge */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Aguardando Liberação da Coordenação</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              1º Acesso Google
            </span>
          </div>

          {/* Main Title & Explanation */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Olá, {currentUser?.name || 'Professor(a)'}!
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Identificamos que este é o seu <strong>primeiro acesso ao sistema escolar através do Google</strong>.
              Por normas institucionais, seu perfil precisa ser <strong>liberado pelo coordenador ou diretor</strong> antes do primeiro uso.
            </p>
          </div>

          {/* Teacher Info Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <TeacherAvatar
                avatar={currentUser?.avatar}
                name={currentUser?.name}
                subject={currentUser?.subject}
                role={currentUser?.role || 'TEACHER'}
                size="lg"
                showRoleBadge={false}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">{currentUser?.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    Google OAuth
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Escola: <strong className="text-slate-300">{schoolName}</strong>
                </p>
              </div>
            </div>

            <div className="text-right sm:self-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status do Acesso</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Em Análise</span>
              </span>
            </div>
          </div>

          {/* Important Security & Process Notice */}
          <div className="bg-blue-950/40 border border-blue-900/60 rounded-2xl p-4 mb-6 text-xs text-blue-200 leading-relaxed flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-100">
                Esta verificação ocorre exclusivamente no 1º acesso
              </p>
              <p className="text-blue-300 text-[11px]">
                Uma notificação já foi gerada no painel da coordenação escolar. Assim que o coordenador liberar seu acesso, você poderá agendar laboratórios de informática, ciências e salas multimídia normalmente em todos os acessos futuros.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="pending-check-status-btn"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Verificando com o servidor...' : 'Verificar se já fui liberado'}</span>
              </button>

              <button
                id="pending-logout-btn"
                onClick={logout}
                className="w-full sm:w-auto py-3 px-5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Trocar de Conta</span>
              </button>
            </div>

            {checkFeedback && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-300 animate-fade-in flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{checkFeedback}</span>
              </div>
            )}
          </div>

          {/* School Contact Box */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Precisa de liberação urgente? Contate a escola:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">E-mail da Coordenação:</span>
                  <span className="font-mono text-slate-200 truncate">{contactEmail}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Telefone / Ramal:</span>
                  <span className="font-bold text-slate-200">{contactPhone}</span>
                </div>
              </div>
            </div>
            {directorName && (
              <p className="text-[11px] text-slate-400 mt-2">
                Direção / Coordenação Responsável: <strong>{directorName}</strong>
              </p>
            )}
          </div>

          {/* Developer / Testing Mode Quick Unlock */}
          {isDeveloperMode && (
            <div className="mt-6 pt-4 border-t border-dashed border-amber-500/30 bg-amber-950/20 p-3 rounded-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Modo Desenvolvedor Ativo</span>
                </div>
                <button
                  onClick={handleSimulateApproval}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Liberar Acesso Agora (Teste)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/60 text-slate-400 text-center py-3 text-xs">
        {schoolName} • Sistema de Gestão e Agendamento Pedagógico
      </footer>
    </div>
  );
};
