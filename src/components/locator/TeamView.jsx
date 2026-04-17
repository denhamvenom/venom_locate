import { useEffect, useState, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE, STALE_MS } from '../../lib/constants'
import { LOCATIONS, locationLabel } from '../../lib/locations'
import { ROSTER, nameOf } from '../../lib/roster'
import { subscribeAllGroups } from '../../lib/groups'
import { relativeTime, toDate } from '../../lib/time'
import styles from './TeamView.module.css'

export default function TeamView() {
  const [docs, setDocs] = useState([])
  const [groups, setGroups] = useState({})
  const [, setTick] = useState(0)

  useEffect(() => {
    const ref = collection(db, 'events', EVENT_CODE, 'locations')
    return onSnapshot(ref, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => subscribeAllGroups(setGroups), [])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const grouped = useMemo(() => {
    const byLocation = {}
    const idsWithDoc = new Set()
    for (const d of docs) {
      const loc = d.location || 'unknown'
      if (!byLocation[loc]) byLocation[loc] = []
      byLocation[loc].push(d)
      idsWithDoc.add(d.id)
    }
    for (const arr of Object.values(byLocation)) {
      arr.sort((a, b) => a.studentName.localeCompare(b.studentName))
    }
    const notSignedIn = ROSTER.filter(s => !idsWithDoc.has(s.id))
    return { byLocation, notSignedIn }
  }, [docs])

  function renderGroupInfo(s) {
    if (!s.groupId) return null
    const group = groups[s.groupId]
    if (!group) return null
    const confirmed = (group.confirmedMembers || []).filter(id => id !== s.id)
    const pending = (group.members || []).filter(id => id !== s.id && !(group.confirmedMembers || []).includes(id))
    const parts = [
      ...confirmed.map(id => {
        const buddyLoc = docs.find(d => d.id === id)
        const atSameLocation = buddyLoc?.location === s.location
        return `${nameOf(id)}${atSameLocation ? ' ✓' : ` ✗ at ${locationLabel(buddyLoc?.location || '?')}`}`
      }),
      ...pending.map(id => `${nameOf(id)} (pending)`),
      group.withOther && `${group.withOther}${group.otherApproved ? ' ✓' : ' ⚠ needs OK'}`,
    ].filter(Boolean)
    if (parts.length === 0) return null
    return <div className={styles.rowBuddies}>Group: {parts.join(', ')}</div>
  }

  const totalCheckedIn = docs.length

  return (
    <div className={styles.screen}>
      <div className={styles.summary}>
        <span className={styles.summaryStrong}>{totalCheckedIn}</span> checked in
        <span className={styles.summaryDivider}>·</span>
        <span className={styles.summaryMuted}>{grouped.notSignedIn.length} not yet</span>
      </div>

      {LOCATIONS.map((loc) => {
        const students = grouped.byLocation[loc.id] ?? []
        if (students.length === 0) return null
        return (
          <section key={loc.id} className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{loc.icon}</span>
              <span className={styles.sectionLabel}>{loc.label}</span>
              <span className={styles.sectionCount}>{students.length}</span>
            </header>
            <ul className={styles.list}>
              {students.map((s) => {
                const ts = toDate(s.timestamp)
                const stale = ts && Date.now() - ts.getTime() > STALE_MS
                const isMentor = s.role === 'mentor'
                return (
                  <li key={s.id} className={`${styles.row} ${stale ? styles.rowStale : ''}`}>
                    <div className={styles.rowName}>
                      {s.studentName}
                      {isMentor && <span className={styles.rowMentorTag}>Mentor</span>}
                    </div>
                    <div className={styles.rowMeta}>
                      <span className={styles.rowTime}>{ts ? relativeTime(ts) : 'unknown'}</span>
                      {s.note && <span className={styles.rowNote}>"{s.note}"</span>}
                    </div>
                    {renderGroupInfo(s)}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {grouped.notSignedIn.length > 0 && (
        <section className={`${styles.section} ${styles.notSignedIn}`}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>·</span>
            <span className={styles.sectionLabel}>Not signed in</span>
            <span className={styles.sectionCount}>{grouped.notSignedIn.length}</span>
          </header>
          <ul className={styles.list}>
            {grouped.notSignedIn.map((s) => (
              <li key={s.id} className={`${styles.row} ${styles.rowMuted}`}>
                <div className={styles.rowName}>
                  {s.display}
                  {s.role === 'mentor' && <span className={styles.rowMentorTag}>Mentor</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {totalCheckedIn === 0 && grouped.notSignedIn.length === 0 && (
        <div className={styles.empty}>
          <p>No students in roster yet.</p>
          <p className={styles.emptyHint}>Add names to <code>src/data/students.csv</code>.</p>
        </div>
      )}
    </div>
  )
}
