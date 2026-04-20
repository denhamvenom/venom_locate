import { useEffect, useState } from 'react'
import styles from './OfflineBanner.module.css'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className={styles.banner}>
      <span className={styles.dot} />
      <span>Offline — changes will sync when you're back online.</span>
    </div>
  )
}
