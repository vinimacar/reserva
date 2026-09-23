import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Smartphone,
  Send,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  KeyRound,
  Check,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  requestFCMPermissionAndToken,
  getPushPreferences,
  savePushPreferences,
  dispatchNativePushNotification,
  playNotificationChime,
  getCachedFCMToken,
  PushNotificationPreferences,
} from '../services/fcmPushService';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [fcmToken, setFcmToken] = useState<string | null>(getCachedFCMToken());
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(getPushPreferences());
  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [vapidInput, setVapidInput] = useState(preferences.vapidKey || '');
  const [showVapidConfig, setShowVapidConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      setFcmToken(getCachedFCMToken());
      setPreferences(getPushPreferences());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await requestFCMPermissionAndToken(currentUser);
      setPermission(result.permission);

      if (result.success) {
        setFcmToken(result.token);
        setPreferences(getPushPreferences());
        setSuccessMessage('Notificações push ativadas com sucesso via Firebase Cloud Messaging!');
        playNotificationChime();
      } else if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao solicitar permissão de notificações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreference = (key: keyof PushNotificationPreferences) => {
    const updated = savePushPreferences({ [key]: !preferences[key] });
    setPreferences(updated);
  };

  const handleSaveVapid = () => {
    const updated = savePushPreferences({ vapidKey: vapidInput.trim() });
    setPreferences(updated);
    setSuccessMessage('Chave VAPID salva com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    setErrorMessage(null);

    const sent = await dispatchNativePushNotification({
      title: '✅ Teste do ReserveLabs Push (FCM)',
      body: `Olá, ${currentUser?.name || 'Professor'}! Seu sistema de alertas da coordenação escolar está funcionando perfeitamente.`,
      tag: `test-${Date.now()}`,
      data: { url: '/', test: true },
    });

    if (!sent && permission !== 'granted') {
      setErrorMessage('Permita as notificações no navegador primeiro para ver o alerta.');
    }

    setTimeout(() => setTestSent(false), 3000);
  };

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-200 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Notificações Push (FCM)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  100% Gratuito
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Alertas instantâneos de aprovações de salas e comunicados da coordenação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Status no Dispositivo:</span>
            </div>
            <span
              className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isGranted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isDenied
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isGranted ? 'Ativado / Autorizado' : isDenied ? 'Bloqueado no Navegador' : 'Pendente de Permissão'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isGranted
              ? 'Seu navegador e celular estão configurados para receber alertas mesmo com a página em segundo plano.'
              : isDenied
              ? 'O navegador bloqueou as notificações deste site. Para reativar, clique no ícone de opções/cadeado na barra de endereços e altere Notificações para "Permitir".'
              : 'Clique no botão abaixo para receber avisos quando a direção ou coordenação aprovar suas aulas práticas.'}
          </p>

          {/* Action Button */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {!isGranted ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'Solicitando autorização...' : 'Ativar Notificações Push'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSent}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>{testSent ? 'Notificação enviada!' : 'Enviar Notificação de Teste'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => playNotificationChime()}
              className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              title="Testar o som oficial de alerta"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Testar Som</span>
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-2 mb-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Preferências de Alerta:
          </h4>

          {/* Toggle 1: Approvals */}
          <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Aprovações de Reserva</p>
                <p className="text-[11px] text-slate-400">
                  Notificar quando a coordenação liberar seu laboratório
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifyOnApproval}
              onChange={() => handleTogglePreference('notifyOnApproval')}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </label>

          {/* Toggle 2: Rejections & Cancellations */}
          <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Cancelamentos & Ajustes</p>
                <p className="text-[11px] text-slate-400">
                  Alerta imediato se um horário precisar ser alterado
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifyOnRejection}
              onChange={() => handleTogglePreference('notifyOnRejection')}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </label>

          {/* Toggle 3: Announcements */}
          <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Comunicados da Coordenação</p>
                <p className="text-[11px] text-slate-400">
                  Avisos importantes publicados no mural da escola
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifyOnAnnouncements}
              onChange={() => handleTogglePreference('notifyOnAnnouncements')}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </label>

          {/* Toggle 4: Sound */}
          <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2.5">
              {preferences.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-white">Efeito Sonoro Suave</p>
                <p className="text-[11px] text-slate-400">
                  Tocar som sutil ao receber notificações
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEnabled}
              onChange={() => handleTogglePreference('soundEnabled')}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </label>
        </div>

        {/* Free Service Guarantee Notice */}
        <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-300 mb-4">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-200">Garantia de Gratuidade: </span>
            O Firebase Cloud Messaging (FCM) faz parte do plano gratuito (Spark) do Google Cloud,
            sem nenhuma cobrança por mensagens enviadas para professores ou escolas.
          </div>
        </div>

        {/* Optional VAPID / Advanced Key Settings */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowVapidConfig(!showVapidConfig)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Configuração avançada de Chave VAPID (Opcional)</span>
          </button>

          {showVapidConfig && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs animate-in fade-in">
              <label className="block text-[11px] text-slate-400">
                Chave Pública VAPID (Firebase Console &gt; Cloud Messaging &gt; Web Push):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vapidInput}
                  onChange={(e) => setVapidInput(e.target.value)}
                  placeholder="Ex: BNX... chave pública do par gerado gratuitamente"
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveVapid}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </div>
              {fcmToken && (
                <div className="mt-2 text-[10px] text-slate-500 truncate">
                  <span className="font-mono">FCM Token Ativo: </span>
                  <span className="font-mono text-slate-400">{fcmToken.slice(0, 32)}...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
