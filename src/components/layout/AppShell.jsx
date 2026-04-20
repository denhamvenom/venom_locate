import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useFcmToken } from '../../hooks/useFcmToken'
import MonitorApprovalBanner from '../common/MonitorApprovalBanner'
import MessageBanner from '../common/MessageBanner'
import OfflineBanner from '../common/OfflineBanner'
import EmergencyButton from '../common/EmergencyButton'
import EmergencyBanner from '../common/EmergencyBanner'
import styles from './AppShell.module.css'

export default function AppShell() {
  const navigate = useNavigate()
  const { studentId, studentName, role, isMonitor, isAdmin, clearStudent, swUpdateReady, applyUpdate, installPrompt, triggerInstall } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const { permission, requestPermission } = useFcmToken(studentId, role)

  function handleSignOut() {
    setMenuOpen(false)
    clearStudent()
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.shell}>
      {swUpdateReady && (
        <div className={styles.updateBanner}>
          <span>Update available</span>
          <button className={styles.updateBtn} onClick={applyUpdate}>Tap to update</button>
        </div>
      )}
      <header className={styles.topBar}>
        <span className={styles.brand}>Venom Locate</span>
        <span className={styles.who}>{studentName}</span>
        <EmergencyButton />
        <button
          className={styles.gearBtn}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          ⚙️
        </button>
        {menuOpen && (
          <div className={styles.menu} onMouseLeave={() => setMenuOpen(false)}>
            {installPrompt && (
              <button className={styles.menuItem} onClick={() => { setMenuOpen(false); triggerInstall() }}>
                Install App
              </button>
            )}
            {isAdmin && (
              <button className={styles.menuItem} onClick={() => { setMenuOpen(false); navigate('/admin') }}>
                Admin
              </button>
            )}
            <button className={styles.menuItem} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </header>

      {permission === 'default' && (
        <div className={styles.notifBanner}>
          <span className={styles.notifText}>Enable notifications to get check-ins when the app is closed.</span>
          <button className={styles.notifBtn} onClick={requestPermission}>Enable</button>
        </div>
      )}

      <OfflineBanner />
      <EmergencyBanner />
      <MonitorApprovalBanner />
      <MessageBanner />

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        <NavLink to="/me" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
          <span className={styles.tabIcon}>📍</span>
          <span>Me</span>
        </NavLink>
        <NavLink to="/team" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
          <span className={styles.tabIcon}>👥</span>
          <span>Team</span>
        </NavLink>
        {isMonitor && (
          <NavLink to="/messages" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
            <span className={styles.tabIcon}>💬</span>
            <span>Messages</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}
