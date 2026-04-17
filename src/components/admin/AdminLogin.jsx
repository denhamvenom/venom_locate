import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import PasswordModal from '../common/PasswordModal'
import AdminDashboard from './AdminDashboard'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

export default function AdminLogin() {
  const { isAdmin, setAdmin } = useApp()
  const [showModal, setShowModal] = useState(!isAdmin)

  if (!isAdmin) {
    return (
      <PasswordModal
        title="Admin Login"
        password={ADMIN_PASSWORD}
        onSuccess={() => { setAdmin(true); setShowModal(false) }}
        onCancel={() => window.history.back()}
      />
    )
  }

  return <AdminDashboard />
}
