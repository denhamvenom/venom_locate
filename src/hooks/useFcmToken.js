import { useEffect, useState, useCallback, useRef } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, getMessagingIfSupported } from '../lib/firebase'
import { EVENT_CODE } from '../lib/constants'
import { getDeviceId } from '../lib/deviceId'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export function useFcmToken(rosterId, role) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const registered = useRef(false)

  const registerToken = useCallback(async () => {
    if (!rosterId || !VAPID_KEY) return
    try {
      const messaging = await getMessagingIfSupported()
      if (!messaging) return

      // Use the unified PWA service worker (sw.js) — it includes Firebase messaging.
      const swReg = await navigator.serviceWorker.ready

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      })

      if (token) {
        const deviceId = getDeviceId()
        const ref = doc(db, 'events', EVENT_CODE, 'fcmTokens', deviceId)
        await setDoc(ref, {
          rosterId,
          role: role || 'student',
          token,
          updatedAt: serverTimestamp(),
        })
      }

      onMessage(messaging, (payload) => {
        // If page is hidden (minimized/background tab), manually show OS notification.
        // Visible foreground messages are handled by MessageBanner via Firestore.
        if (document.visibilityState === 'hidden') {
          const data = payload.data || {}
          const title = data.title || 'Venom Locate'
          const opts = {
            body: data.body || 'New message',
            icon: '/venom-logo-192.png',
            badge: '/venom-logo-192.png',
            vibrate: data.kind === 'checkin' ? [200, 100, 200, 100, 200] : [200],
            tag: data.messageId || 'venom-msg',
            requireInteraction: data.kind === 'checkin',
          }
          if (swReg) swReg.showNotification(title, opts)
        }
      })
    } catch (err) {
      console.warn('FCM token registration failed:', err)
    }
  }, [rosterId, role])

  // If already granted, register on mount
  useEffect(() => {
    if (!rosterId || registered.current) return
    if (permission === 'granted') {
      registered.current = true
      registerToken()
    }
  }, [rosterId, permission, registerToken])

  const requestPermission = useCallback(async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        registered.current = true
        await registerToken()
      }
      return result
    } catch (err) {
      console.warn('Permission request failed:', err)
      return 'denied'
    }
  }, [registerToken])

  return { permission, requestPermission }
}
