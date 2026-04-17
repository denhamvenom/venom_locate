import { useEffect, useState } from 'react'
import { subscribePendingApprovals, approveOther } from '../../lib/buddyApproval'
import { locationLabel, locationIcon } from '../../lib/locations'
import { nameOf } from '../../lib/roster'
import { useApp } from '../../context/AppContext'
import styles from './MonitorApprovalBanner.module.css'

export default function MonitorApprovalBanner() {
  const { isMonitor, studentId } = useApp()
  const [pending, setPending] = useState([])
  const [approving, setApproving] = useState(null)

  useEffect(() => {
    if (!isMonitor) return
    return subscribePendingApprovals(setPending)
  }, [isMonitor])

  if (!isMonitor || pending.length === 0) return null

  async function handleApprove(group) {
    setApproving(group.id)
    try {
      await approveOther(group.id, studentId)
    } catch (err) {
      console.error(err)
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className={styles.container}>
      {pending.map(group => (
        <div key={group.id} className={styles.banner}>
          <div className={styles.text}>
            <span className={styles.label}>Monitor approval needed</span>
            <span className={styles.detail}>
              {nameOf(group.createdBy)}'s group at{' '}
              <strong>{locationIcon(group.location)} {locationLabel(group.location)}</strong>
              {' '}includes off-roster: <strong>"{group.withOther}"</strong>
            </span>
          </div>
          <button
            className={styles.okBtn}
            onClick={() => handleApprove(group)}
            disabled={approving === group.id}
          >
            {approving === group.id ? '…' : 'OK'}
          </button>
        </div>
      ))}
    </div>
  )
}
