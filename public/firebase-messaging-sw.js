/* eslint-disable no-undef */
// Service Worker para Firebase Cloud Messaging (FCM) - Notificações Push Gratuitas
// Scripts oficiais do Firebase Compat para execução isolada no Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuração do projeto Firebase (100% Gratuito - Plano Spark)
const firebaseConfig = {
  projectId: "votofacil-30139",
  appId: "1:297918826223:web:d4ec77b5caa7033be37d1a",
  apiKey: "AIzaSyCSQxa9xon_S_kqz6IBoKVkXenI8pOG_dw",
  authDomain: "votofacil-30139.firebaseapp.com",
  messagingSenderId: "297918826223",
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
  
  // Handler de Mensagens em Segundo Plano (Background Message Handler)
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem push em 2º plano recebida:', payload);

    const notificationTitle =
      payload.notification?.title ||
      payload.data?.title ||
      'ReserveLabs - Alerta da Coordenação';

    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.message ||
        payload.data?.body ||
        'Você possui uma nova atualização de agendamento ou aviso escolar.',
      icon: payload.notification?.icon || '/pwa-192x192.png',
      badge: '/icon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: payload.data?.tag || 'reserve-notification',
      data: payload.data || {
        url: '/',
        reservationId: payload.data?.reservationId,
      },
      actions: [
        { action: 'open', title: 'Visualizar Reserva' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Falha ao iniciar messaging compat no SW:', err);
}

// Fallback nativo para eventos Web Push padrão do navegador
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || data.notification?.title || 'ReserveLabs - Notificação';
      const options = {
        body: data.message || data.body || data.notification?.body || 'Atualização pedagógica.',
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: data.tag || 'fcm-push-alert',
        data: data,
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('ReserveLabs - Alerta da Coordenação', {
          body: text,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
        })
      );
    }
  }
});

// Ação de clique na notificação: focar ou abrir a aplicação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver janela aberta, foca nela
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abre a janela principal
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
