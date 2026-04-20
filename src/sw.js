/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

// ── Workbox precache (PWA offline caching) ──
precacheAndRoute(self.__WB_MANIFEST)

// ── Firebase init ──
const app = initializeApp({
  apiKey: 'AIzaSyCul2iqK07AsjreHEFx2UYNvjImV58XVGk',
  authDomain: 'venom-locate-26.firebaseapp.com',
  projectId: 'venom-locate-26',
  storageBucket: 'venom-locate-26.firebasestorage.app',
  messagingSenderId: '1092529120987',
  appId: '1:1092529120987:web:05fab90bdd4f0fd1d00efe',
})

const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  const data = payload.data || {}
  const title = data.title || 'Venom Locate'
  const body = data.body || 'New message'
  const kind = data.kind || 'info'

  return self.registration.showNotification(title, {
    body,
    icon: '/venom-logo-192.png',
    badge: '/venom-logo-192.png',
    vibrate: kind === 'checkin' ? [200, 100, 200, 100, 200] : [200],
    requireInteraction: kind === 'checkin',
    tag: kind === 'checkin' ? 'venom-checkin' : (data.messageId || 'venom-msg'),
    data: { url: '/' },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(event.notification.data?.url || '/')
    })
  )
})

// Don't auto-skipWaiting here — vite-plugin-pwa's registerType='prompt' relies
// on the new SW staying in waiting state until user taps "Tap to update".
// Listen for the SKIP_WAITING message that the prompt flow sends on tap.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
