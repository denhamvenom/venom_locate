import styles from './AppLockedScreen.module.css'

export default function AppLockedScreen() {
  return (
    <div className={styles.screen}>
      <img src="/venom-logo.png" alt="Venom" className={styles.logo} />
      <h1 className={styles.title}>Venom Locate</h1>
      <div className={styles.lockBadge}>🔒 App Locked</div>
      <p className={styles.message}>
        The app is currently disabled by an administrator.
        It will return to normal once re-enabled.
      </p>
      <p className={styles.hint}>
        Emergency reporting still works (⚠️ button at top).
      </p>
    </div>
  )
}
