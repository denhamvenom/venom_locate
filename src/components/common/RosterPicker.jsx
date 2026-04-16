import { useState, useMemo } from 'react'
import { STUDENTS, MENTORS } from '../../lib/roster'
import PasswordModal from './PasswordModal'
import styles from './RosterPicker.module.css'

const MENTOR_PIN = import.meta.env.VITE_MENTOR_PIN

export default function RosterPicker({ value, onChange, onClose }) {
  const [query, setQuery] = useState('')
  const [pinFor, setPinFor] = useState(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return {
      students: STUDENTS.filter(s => s.display.toLowerCase().includes(q)),
      mentors: MENTORS.filter(s => s.display.toLowerCase().includes(q)),
    }
  }, [query])

  function tap(person) {
    if (person.role === 'mentor') {
      setPinFor(person)
      return
    }
    onChange(person)
    onClose()
  }

  function handlePinSuccess() {
    onChange(pinFor)
    setPinFor(null)
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
            <>
              <div className={styles.section}>Students</div>
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
            </>
          )}
          {filtered.mentors.length > 0 && (
            <>
              <div className={styles.section}>Mentors</div>
              {filtered.mentors.map(s => (
                <button
                  key={s.key}
                  type="button"
                  className={`${styles.item} ${value === s.display ? styles.active : ''}`}
                  onClick={() => tap(s)}
                >
                  <span>{s.display}</span>
                  <span className={styles.mentorTag}>
                    {s.isMonitor ? '🛡️ Monitor' : '🔒 PIN'}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {pinFor && (
        <PasswordModal
          title={`Enter mentor PIN for ${pinFor.display}`}
          password={MENTOR_PIN}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinFor(null)}
        />
      )}
    </div>
  )
}
