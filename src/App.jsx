import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import LaunchScreen from './components/layout/LaunchScreen'
import MyLocation from './components/locator/MyLocation'
import TeamView from './components/locator/TeamView'
import AdminDashboard from './components/admin/AdminDashboard'
import MonitorMessages from './components/admin/MonitorMessages'

function AdminGuarded() {
  const { isAdmin } = useApp()
  if (!isAdmin) return <Navigate to="/me" replace />
  return <AdminDashboard />
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
          <Route path="/messages" element={<MonitorMessages />} />
          <Route path="/admin" element={<AdminGuarded />} />
          <Route path="*" element={<Navigate to="/me" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
