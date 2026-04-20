import { useState, useMemo } from 'react'
import { STUDENTS, MENTORS } from '../../lib/roster'
import styles from './RosterPicker.module.css'

export default function RosterPicker({ value, onChange, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return {
      students: STUDENTS.filter(s => s.display.toLowerCase().includes(q)),
      mentors: MENTORS.filter(s => s.display.toLowerCase().includes(q)),
    }
  }, [query])

  function tap(person) {
    onChange(person)
    onClose()
  }

  const noMatches = filtered.students.length === 0 && filtered.mentors.length === 0
  const rosterEmpty = STUDENTS.length === 0 && MENTORS.length === 0

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Who are you?</h2>
          <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>
        <input
          className={styles.search}
          type="text"
          name="roster-search"
          placeholder="Type to filter..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <div className={styles.list}>
          {rosterEmpty && (
            <p className={styles.empty}>
              Roster is empty. Add names to <code>src/data/students.csv</code>.
            </p>
          )}
          {!rosterEmpty && noMatches && (
            <p className={styles.empty}>No matches for "{query}"</p>
          )}
          {filtered.students.length > 0 && (
            <details className={styles.group} open={!!query || filtered.students.length <= 8}>
              <summary className={styles.section}>
                Students <span className={styles.sectionCount}>{filtered.students.length}</span>
              </summary>
              {filtered.students.map(s => (
                <button
                  key={s.key}
                  type="button"
                  className={`${styles.item} ${value === s.display ? styles.active : ''}`}
                  onClick={() => tap(s)}
                >
                  <span>{s.display}</span>
                </button>
              ))}
            </details>
          )}
          {filtered.mentors.length > 0 && (
            <details className={styles.group} open={!!query}>
              <summary className={styles.section}>
                Mentors <span className={styles.sectionCount}>{filtered.mentors.length}</span>
              </summary>
              {filtered.mentors.map(s => (
                <button
                  key={s.key}
                  type="button"
                  className={`${styles.item} ${value === s.display ? styles.active : ''}`}
                  onClick={() => tap(s)}
                >
                  <span>{s.display}</span>
                  <span className={styles.mentorTag}>
                    {s.isMonitor ? '🛡️ Monitor' : '🔒 Mentor'}
                  </span>
                </button>
              ))}
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
