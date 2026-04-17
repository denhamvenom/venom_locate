import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import MonitorApprovalBanner from '../common/MonitorApprovalBanner'
import MessageBanner from '../common/MessageBanner'
import styles from './AppShell.module.css'

export default function AppShell() {
  const navigate = useNavigate()
  const { studentName, isMonitor, clearStudent, swUpdateReady, applyUpdate } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

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
        <button
          className={styles.gearBtn}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          ⚙️
        </button>
        {menuOpen && (
          <div className={styles.menu} onMouseLeave={() => setMenuOpen(false)}>
            <button className={styles.menuItem} onClick={() => { setMenuOpen(false); navigate('/admin') }}>
              Admin
            </button>
            <button className={styles.menuItem} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </header>

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
