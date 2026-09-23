import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { saveUserToCloud } from './firestoreSync';
import { User, UserNotification } from '../types';

export interface PushNotificationPreferences {
  enabled: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnAnnouncements: boolean;
  notifyOnNewBookings: boolean;
  soundEnabled: boolean;
  vapidKey?: string;
}

const STORAGE_KEY_TOKEN = 'reserve_fcm_token_v1';
const STORAGE_KEY_PREFS = 'reserve_fcm_preferences_v1';

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  enabled: true,
  notifyOnApproval: true,
  notifyOnRejection: true,
  notifyOnAnnouncements: true,
  notifyOnNewBookings: true,
  soundEnabled: true,
  vapidKey: '',
};

let messagingInstance: Messaging | null = null;
let isFCMSupportedCached: boolean | null = null;

/**
 * Toca um aviso sonoro agradável e suave utilizando a Web Audio API nativa
 * Não requer arquivos externos nem chamadas de rede (100% gratuito e offline).
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tom 1 (Nota D5 - 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tom 2 mais agudo (Nota A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.22, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (err) {
    // Autoplay policy do navegador pode silenciar caso o usuário não tenha interagido ainda
    console.debug('Audio chime notice:', err);
  }
}

/**
 * Vibra o dispositivo móvel se suportado (padrão de alerta duplo)
 */
export function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 180]);
    } catch {
      // ignore
    }
  }
}

/**
 * Carrega as preferências locais de notificação push
 */
export function getPushPreferences(): PushNotificationPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFS);
    if (saved) {
      return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PUSH_PREFERENCES;
}

/**
 * Salva as preferências de notificação push
 */
export function savePushPreferences(prefs: Partial<PushNotificationPreferences>): PushNotificationPreferences {
  const current = getPushPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Retorna o token FCM atualmente armazenado em cache local
 */
export function getCachedFCMToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Verifica se o navegador atual suporta Firebase Cloud Messaging e Service Workers
 */
export async function checkFCMSupport(): Promise<boolean> {
  if (isFCMSupportedCached !== null) {
    return isFCMSupportedCached;
  }

  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  ) {
    isFCMSupportedCached = false;
    return false;
  }

  try {
    const supported = await isSupported();
    isFCMSupportedCached = supported;
    return supported;
  } catch (e) {
    console.warn('Verificação de compatibilidade FCM:', e);
    isFCMSupportedCached = false;
    return false;
  }
}

/**
 * Registra o Service Worker dedicado para FCM se ainda não registrado
 */
export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Verifica se já existe um SW registrado para o escopo
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (existing) {
      return existing;
    }

    // Registra o arquivo de background do FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('[FCM] Service Worker registrado com sucesso:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('[FCM] Registro do service worker de messaging falhou:', err);
    // Fallback para qualquer Service Worker ativo no navegador
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
}

/**
 * Obtém a instância ativa do Firebase Messaging
 */
export async function getFCMInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await checkFCMSupport();
  if (!supported) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM] Erro ao obter messaging app:', err);
    return null;
  }
}

/**
 * Solicita a permissão do usuário no navegador e registra o Token FCM no Firebase
 */
export async function requestFCMPermissionAndToken(
  user?: User | null
): Promise<{
  success: boolean;
  token: string | null;
  permission: NotificationPermission;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      token: null,
      permission: 'denied',
      error: 'Seu navegador não suporta notificações nativas.',
    };
  }

  try {
    // 1. Solicita permissão nativa ao usuário
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        permission,
        error:
          permission === 'denied'
            ? 'Notificações bloqueadas nas permissões do navegador. Clique no ícone de cadeado na barra de endereço para permitir.'
            : 'Permissão não concedida.',
      };
    }

    // 2. Registra o Service Worker do FCM
    const swRegistration = await registerFCMServiceWorker();

    // 3. Inicializa o Messaging
    const messaging = await getFCMInstance();
    let fcmToken: string | null = null;

    if (messaging) {
      const prefs = getPushPreferences();
      const vapidKey = prefs.vapidKey || undefined;

      try {
        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swRegistration || undefined,
          vapidKey: vapidKey,
        });

        if (fcmToken) {
          localStorage.setItem(STORAGE_KEY_TOKEN, fcmToken);
          console.log('[FCM] Token push gerado com sucesso:', fcmToken.slice(0, 15) + '...');
        }
      } catch (tokenErr: any) {
        console.warn('[FCM] Aviso ao obter token FCM (VAPID/Sandbox):', tokenErr);
        // Mesmo sem o token VAPID cadastrado no Console, a permissão do navegador foi concedida
        // permitindo que o sistema envie Web Push e notificações locais perfeitamente.
      }
    }

    // 4. Se o usuário estiver autenticado, sincroniza o status de push e token no Firestore
    if (user && user.id) {
      try {
        const updatedUser: User = {
          ...user,
          pushNotificationsEnabled: true,
          fcmToken: fcmToken || user.fcmToken || undefined,
          fcmTokens: fcmToken
            ? Array.from(new Set([...(user.fcmTokens || []), fcmToken]))
            : user.fcmTokens,
        };
        await saveUserToCloud(updatedUser).catch(() => {});
      } catch (saveErr) {
        console.warn('[FCM] Erro ao sincronizar token no perfil:', saveErr);
      }
    }

    // Atualiza preferências
    savePushPreferences({ enabled: true });

    return {
      success: true,
      token: fcmToken,
      permission,
    };
  } catch (err: any) {
    console.error('[FCM] Erro no fluxo de solicitação:', err);
    return {
      success: false,
      token: null,
      permission: Notification.permission,
      error: err?.message || 'Erro ao ativar notificações push.',
    };
  }
}

/**
 * Escuta mensagens FCM recebidas enquanto a aplicação está aberta em primeiro plano
 */
export async function setupForegroundFCMListener(
  onReceiveNotification: (payload: any) => void
): Promise<(() => void) | null> {
  const messaging = await getFCMInstance();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Notificação em 1º plano recebida:', payload);

      const prefs = getPushPreferences();
      if (prefs.soundEnabled) {
        playNotificationChime();
      }
      triggerHapticFeedback();

      onReceiveNotification(payload);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM] Erro ao registrar listener em primeiro plano:', err);
    return null;
  }
}

/**
 * Dispara uma notificação nativa imediata (Web Notification / Service Worker Push)
 * Utilizada para alertas de aprovação de reserva, rejeição ou novos avisos
 */
export async function dispatchNativePushNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const prefs = getPushPreferences();
  if (!prefs.enabled) {
    return false;
  }

  if (prefs.soundEnabled) {
    playNotificationChime();
  }
  triggerHapticFeedback();

  const title = options.title;
  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: options.tag || 'reserve-notification',
    data: options.data || {},
    requireInteraction: options.requireInteraction ?? false,
  };

  // Tenta enviar via Service Worker (melhor para Mobile e PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.debug('[FCM] Fallback para window.Notification:', swErr);
    }
  }

  // Fallback para construtor Notification nativo
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (nativeErr) {
    console.warn('[FCM] Erro ao exibir notificação:', nativeErr);
    return false;
  }
}

/**
 * Dispara notificação push quando uma reserva é aprovada pela coordenação
 */
export async function sendReservationApprovalPush(
  teacherEmail: string,
  teacherName: string,
  roomName: string,
  dateFormatted: string,
  periods: string,
  adminName?: string
) {
  const prefs = getPushPreferences();
  if (!prefs.notifyOnApproval) return;

  await dispatchNativePushNotification({
    title: '✅ Reserva Aprovada pela Coordenação!',
    body: `Olá, ${teacherName}! Sua reserva de ${roomName} para ${dateFormatted} (${periods}) foi aprovada por ${adminName || 'Coordenação'}.`,
    tag: `approval-${Date.now()}`,
    data: {
      url: '/minhas-reservas',
      type: 'RESERVATION_APPROVED',
      roomName,
      date: dateFormatted,
    },
  });
}

/**
 * Dispara notificação push quando uma reserva é rejeitada ou cancelada
 */
export async function sendReservationRejectionPush(
  teacherName: string,
  roomName: string,
  dateFormatted: string,
  reason?: string,
  adminName?: string
) {
  const prefs = getPushPreferences();
  if (!prefs.notifyOnRejection) return;

  await dispatchNativePushNotification({
    title: '⚠️ Alerta de Agendamento: Reserva Cancelada',
    body: `Atenção, ${teacherName}: Sua reserva em ${roomName} para ${dateFormatted} foi cancelada. Motivo: ${reason || 'Ajuste pedagógico da coordenação.'}`,
    tag: `rejection-${Date.now()}`,
    data: {
      url: '/minhas-reservas',
      type: 'RESERVATION_REJECTED',
      roomName,
    },
  });
}

/**
 * Dispara notificação push quando um novo aviso da coordenação é publicado
 */
export async function sendCoordinationAnnouncementPush(
  title: string,
  author: string,
  contentSnippet: string
) {
  const prefs = getPushPreferences();
  if (!prefs.notifyOnAnnouncements) return;

  await dispatchNativePushNotification({
    title: `📢 Comunicado da Coordenação (${author})`,
    body: `${title}: ${contentSnippet.slice(0, 120)}${contentSnippet.length > 120 ? '...' : ''}`,
    tag: `announcement-${Date.now()}`,
    data: {
      url: '/avisos',
      type: 'ANNOUNCEMENT',
    },
  });
}
