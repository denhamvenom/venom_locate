import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import LaunchScreen from './components/layout/LaunchScreen'
import MyLocation from './components/locator/MyLocation'
import TeamView from './components/locator/TeamView'

function Placeholder({ title, note }) {
  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
      <h2 style={{ color: 'var(--color-gold)' }}>{title}</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{note}</p>
    </div>
  )
}

export default function App() {
  const { studentName } = useApp()

  if (!studentName) return <LaunchScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/me" replace />} />
          <Route path="/me" element={<MyLocation />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/admin" element={<Placeholder title="Admin" note="Phase 6 will add the password gate + dashboard." />} />
          <Route path="*" element={<Navigate to="/me" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
