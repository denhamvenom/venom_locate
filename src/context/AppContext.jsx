import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)
const STORAGE_KEY = 'venomLocate_state'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full / unavailable — non-fatal
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = loadState()
    return {
      studentName: saved.studentName ?? '',
      studentId: saved.studentId ?? '',
      role: saved.role ?? '',
      isMonitor: saved.isMonitor ?? false,
      isAdmin: false,
    }
  })

  useEffect(() => {
    const { studentName, studentId, role, isMonitor } = state
    saveState({ studentName, studentId, role, isMonitor })
  }, [state.studentName, state.studentId, state.role, state.isMonitor])

  const setIdentity = useCallback((person) => {
    setState(prev => ({
      ...prev,
      studentName: person.display,
      studentId: person.id,
      role: person.role,
      isMonitor: !!person.isMonitor,
    }))
  }, [])

  const clearStudent = useCallback(() => {
    setState(prev => ({
      ...prev,
      studentName: '',
      studentId: '',
      role: '',
      isMonitor: false,
      isAdmin: false,
    }))
  }, [])

  const setAdmin = useCallback((isAdmin) => {
    setState(prev => ({ ...prev, isAdmin }))
  }, [])

  // PWA install prompt capture
  const [installPrompt, setInstallPrompt] = useState(null)
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }, [installPrompt])

  // SW update detection
  const [swUpdateReady, setSwUpdateReady] = useState(false)
  useEffect(() => {
    const handler = () => setSwUpdateReady(true)
    window.addEventListener('sw-update-ready', handler)
    return () => window.removeEventListener('sw-update-ready', handler)
  }, [])

  const applyUpdate = useCallback(() => {
    if (window.__updateSW) window.__updateSW(true)
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      setIdentity,
      clearStudent,
      setAdmin,
      installPrompt,
      triggerInstall,
      swUpdateReady,
      applyUpdate,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
