import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { locationLabel, locationIcon } from '../../lib/locations'
import { relativeTime, toDate } from '../../lib/time'
import styles from './StudentDetail.module.css'

export default function StudentDetail({ person, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'events', EVENT_CODE, 'locationHistory', person.id, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(20)
    )
    return onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [person.id])

  const ts = toDate(person.timestamp)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.name}>
              {person.studentName}
              {person.role === 'mentor' && <span className={styles.mentorTag}>Mentor</span>}
            </h2>
            <div className={styles.current}>
              <span>{locationIcon(person.location)} {locationLabel(person.location)}</span>
              <span className={styles.time}>{ts ? relativeTime(ts) : ''}</span>
            </div>
            {person.note && <div className={styles.note}>"{person.note}"</div>}
          </div>
          <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.historySection}>
          <div className={styles.historyLabel}>Location history</div>
          {loading && <p className={styles.loading}>Loading...</p>}
          {!loading && history.length === 0 && (
            <p className={styles.empty}>No history yet.</p>
          )}
          {!loading && history.length > 0 && (
            <ul className={styles.historyList}>
              {history.map(h => {
                const hts = toDate(h.timestamp)
                return (
                  <li key={h.id} className={styles.historyRow}>
                    <span className={styles.historyIcon}>{locationIcon(h.location)}</span>
                    <span className={styles.historyLoc}>{locationLabel(h.location)}</span>
                    {h.note && <span className={styles.historyNote}>"{h.note}"</span>}
                    <span className={styles.historyTime}>{hts ? relativeTime(hts) : ''}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
