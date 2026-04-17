import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import LaunchScreen from './components/layout/LaunchScreen'
import MyLocation from './components/locator/MyLocation'
import TeamView from './components/locator/TeamView'
import AdminLogin from './components/admin/AdminLogin'
import MonitorMessages from './components/admin/MonitorMessages'

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
          <Route path="/messages" element={<MonitorMessages />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/me" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
