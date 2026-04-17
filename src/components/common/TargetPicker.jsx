import { useMemo, useState } from 'react'
import { STUDENTS, MENTORS } from '../../lib/roster'
import styles from './TargetPicker.module.css'

export default function TargetPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const groups = value.groups || []
  const rosterIds = value.rosterIds || []

  function toggleGroup(g) {
    const next = groups.includes(g) ? groups.filter(x => x !== g) : [...groups, g]
    onChange({ ...value, groups: next })
  }

  function togglePerson(id) {
    const next = rosterIds.includes(id) ? rosterIds.filter(x => x !== id) : [...rosterIds, id]
    onChange({ ...value, rosterIds: next })
  }

  const allSelected = groups.includes('all')
  const studentsSelected = groups.includes('students')
  const mentorsSelected = groups.includes('mentors')

  const sq = query.toLowerCase()
  const filteredStudents = STUDENTS.filter(s => !sq || s.display.toLowerCase().includes(sq))
  const filteredMentors = MENTORS.filter(s => !sq || s.display.toLowerCase().includes(sq))

  const summary = [
    allSelected && 'Everyone',
    !allSelected && studentsSelected && 'All Students',
    !allSelected && mentorsSelected && 'All Mentors',
    rosterIds.length > 0 && `${rosterIds.length} individual${rosterIds.length > 1 ? 's' : ''}`,
  ].filter(Boolean).join(' + ') || 'No one selected'

  return (
    <div className={styles.picker}>
      <div className={styles.groupRow}>
        <button
          type="button"
          className={`${styles.groupChip} ${allSelected ? styles.groupActive : ''}`}
          onClick={() => toggleGroup('all')}
        >All</button>
        <button
          type="button"
          className={`${styles.groupChip} ${studentsSelected ? styles.groupActive : ''}`}
          onClick={() => toggleGroup('students')}
        >Students</button>
        <button
          type="button"
          className={`${styles.groupChip} ${mentorsSelected ? styles.groupActive : ''}`}
          onClick={() => toggleGroup('mentors')}
        >Mentors</button>
      </div>

      <div className={styles.summary}>{summary}</div>

      <input
        className={styles.search}
        type="text"
        name="target-search"
        placeholder="Add individuals..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoComplete="off"
      />

      {sq && (
        <div className={styles.list}>
          {filteredStudents.map(s => (
            <button
              key={s.id}
              type="button"
              className={`${styles.item} ${rosterIds.includes(s.id) ? styles.itemChecked : ''}`}
              onClick={() => togglePerson(s.id)}
            >
              <span className={styles.checkbox}>{rosterIds.includes(s.id) ? '✓' : ''}</span>
              <span>{s.display}</span>
            </button>
          ))}
          {filteredMentors.map(s => (
            <button
              key={s.id}
              type="button"
              className={`${styles.item} ${rosterIds.includes(s.id) ? styles.itemChecked : ''}`}
              onClick={() => togglePerson(s.id)}
            >
              <span className={styles.checkbox}>{rosterIds.includes(s.id) ? '✓' : ''}</span>
              <span>{s.display}</span>
              <span className={styles.mentorTag}>Mentor</span>
            </button>
          ))}
        </div>
      )}

      {!sq && rosterIds.length > 0 && (
        <div className={styles.selectedChips}>
          {rosterIds.map(id => {
            const person = [...STUDENTS, ...MENTORS].find(s => s.id === id)
            return (
              <button key={id} className={styles.chip} onClick={() => togglePerson(id)}>
                {person?.display ?? id} ✕
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
