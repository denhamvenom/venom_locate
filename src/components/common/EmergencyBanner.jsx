import { useEffect, useState } from 'react'
import { subscribeActiveEmergencies, acknowledgeEmergency, resolveEmergency } from '../../lib/emergencies'
import { locationLabel, locationIcon } from '../../lib/locations'
import { useApp } from '../../context/AppContext'
import styles from './EmergencyBanner.module.css'

export default function EmergencyBanner() {
  const { studentId, studentName, role } = useApp()
  const [emergencies, setEmergencies] = useState([])
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!studentId) return
    return subscribeActiveEmergencies(setEmergencies)
  }, [studentId])

  // Students see only their own active emergency. Mentors see all.
  const visible = emergencies.filter(e =>
    role === 'mentor' || e.studentId === studentId
  )

  if (visible.length === 0) return null

  async function handleAck(em) {
    setBusy(em.id)
    try { await acknowledgeEmergency(em.id, studentId, studentName) }
    catch (err) { console.error(err) }
    finally { setBusy(null) }
  }

  async function handleResolve(em, reason) {
    setBusy(em.id)
    try { await resolveEmergency(em.id, studentId, studentName, reason) }
    catch (err) { console.error(err) }
    finally { setBusy(null) }
  }

  return (
    <div className={styles.container}>
      {visible.map(em => {
        const ackList = Object.values(em.acknowledgedBy || {})
        const alreadyAcked = !!em.acknowledgedBy?.[studentId]
        const isMine = em.studentId === studentId
        const isMentor = role === 'mentor'
        const typeIcon = em.type === 'medical' ? '🩺' : '⚠️'
        const typeLabel = em.type === 'medical' ? 'Medical' : 'Personal'

        return (
          <div key={em.id} className={styles.banner}>
            <div className={styles.head}>
              <span className={styles.label}>🚨 EMERGENCY · {typeIcon} {typeLabel}</span>
            </div>
            <div className={styles.text}>
              <strong>{em.studentName}</strong>
              {em.location && <> at <strong>{locationIcon(em.location)} {locationLabel(em.location)}</strong></>}
            </div>
            <div className={styles.comment}>"{em.comment}"</div>
            {ackList.length > 0 && (
              <div className={styles.ackList}>
                Help on the way: {ackList.map(a => a.name).join(', ')}
              </div>
            )}
            <div className={styles.actions}>
              {isMentor && !alreadyAcked && (
                <button
                  className={styles.btnAck}
                  onClick={() => handleAck(em)}
                  disabled={busy === em.id}
                >
                  Help on the way
                </button>
              )}
              {isMentor && (
                <button
                  className={styles.btnResolve}
                  onClick={() => handleResolve(em, 'confirmed')}
                  disabled={busy === em.id}
                >
                  Confirm Resolution
                </button>
              )}
              {isMine && !isMentor && (
                <button
                  className={styles.btnFalseAlarm}
                  onClick={() => handleResolve(em, 'false-alarm')}
                  disabled={busy === em.id}
                >
                  False Alarm
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
