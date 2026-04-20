import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { createEmergency, subscribeEmergencyConfig } from '../../lib/emergencies'
import { useApp } from '../../context/AppContext'
import { useToast } from './Toast'
import EmergencyTriggerModal from './EmergencyTriggerModal'
import styles from './EmergencyButton.module.css'

export default function EmergencyButton() {
  const { studentId, studentName, role } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [myLocation, setMyLocation] = useState(null)

  useEffect(() => subscribeEmergencyConfig((cfg) => setEnabled(cfg.enabled !== false)), [])

  useEffect(() => {
    if (!studentId) return
    const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
    return onSnapshot(ref, (snap) => {
      setMyLocation(snap.exists() ? snap.data().location : null)
    })
  }, [studentId])

  if (!enabled || !studentId) return null

  async function handleSubmit({ type, comment }) {
    setBusy(true)
    try {
      await createEmergency({
        studentId, studentName, role,
        type, comment,
        location: myLocation,
      })
      showToast('Emergency sent — mentors notified', 'success', 3000)
      setOpen(false)
    } catch (err) {
      console.error(err)
      showToast('Could not send emergency — try again', 'error', 4000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setOpen(true)}
        aria-label="Emergency"
      >
        ⚠️
      </button>
      {open && (
        <EmergencyTriggerModal
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          busy={busy}
        />
      )}
      <ToastContainer />
    </>
  )
}
