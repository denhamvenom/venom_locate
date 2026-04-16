import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Toast — brief notification overlay.
 *
 * Props:
 *   message: string
 *   type: 'success' | 'warning' | 'error' | 'info'  (default: 'info')
 *   duration: number ms (default: 3000)
 *   onDone: fn — called after toast disappears
 */
export default function Toast({ message, type = 'info', duration = 3000, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  if (!visible) return null

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}

/**
 * ToastContainer — manages a list of toasts.
 * Usage: const { showToast, ToastContainer } = useToast()
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  function ToastContainer() {
    return (
      <div className={styles.container}>
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onDone={() => removeToast(t.id)}
          />
        ))}
      </div>
    )
  }

  return { showToast, ToastContainer }
}
