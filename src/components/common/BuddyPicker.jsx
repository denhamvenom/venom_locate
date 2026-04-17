import { useMemo, useState } from 'react'
import { STUDENTS, MENTORS } from '../../lib/roster'
import styles from './BuddyPicker.module.css'

export default function BuddyPicker({ location, selfId, requireMin = 0, initialSelected = [], onSave, onCancel }) {
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelected))
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherText, setOtherText] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return {
      students: STUDENTS.filter(s => s.id !== selfId && s.display.toLowerCase().includes(q)),
      mentors: MENTORS.filter(s => s.id !== selfId && s.display.toLowerCase().includes(q)),
    }
  }, [query, selfId])

  const otherCount = otherText.trim() ? 1 : 0
  const total = selectedIds.size + otherCount
  const minMet = total >= requireMin

  function toggle(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    if (!minMet) return
    onSave({
      withRosterIds: [...selectedIds],
      withOther: otherText.trim() || null,
    })
  }

  function renderRow(person) {
    const checked = selectedIds.has(person.id)
    return (
      <button
        key={person.id}
        type="button"
        className={`${styles.item} ${checked ? styles.itemChecked : ''}`}
        onClick={() => toggle(person.id)}
      >
        <span className={styles.checkbox} aria-hidden>{checked ? '✓' : ''}</span>
        <span className={styles.itemName}>{person.display}</span>
        {person.role === 'mentor' && (
          <span className={styles.mentorTag}>{person.isMonitor ? '🛡️' : '🔒'}</span>
        )}
      </button>
    )
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {location.icon} {location.label}
            </h2>
            <p className={styles.subtitle}>
              {requireMin > 0
                ? `Pick at least ${requireMin} other ${requireMin === 1 ? 'person' : 'people'} you're with.`
                : "Optional — note who you're with."}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onCancel}>✕</button>
        </div>

        <div className={`${styles.counter} ${minMet ? styles.counterMet : ''}`}>
          Selected {total}{requireMin > 0 ? ` of ${requireMin} required` : ''}
        </div>

        <input
          className={styles.search}
          type="text"
          name="buddy-search"
          placeholder="Type to filter..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />

        <div className={styles.list}>
          {filtered.students.length > 0 && (
            <>
              <div className={styles.section}>Students</div>
              {filtered.students.map(renderRow)}
            </>
          )}
          {filtered.mentors.length > 0 && (
            <>
              <div className={styles.section}>Mentors</div>
              {filtered.mentors.map(renderRow)}
            </>
          )}

          <div className={styles.section}>Off-roster</div>
          <div className={`${styles.otherWrap} ${otherText.trim() ? styles.otherActive : ''}`}>
            <button
              type="button"
              className={styles.otherToggle}
              onClick={() => setOtherOpen(o => !o)}
            >
              <span className={styles.checkbox} aria-hidden>{otherText.trim() ? '✓' : ''}</span>
              <span className={styles.itemName}>Other (parent, sibling, etc.)</span>
              <span className={styles.expand}>{otherOpen ? '▾' : '▸'}</span>
            </button>
            {otherOpen && (
              <div className={styles.otherInputWrap}>
                <input
                  type="text"
                  name="buddy-other"
                  maxLength={80}
                  placeholder="Describe who else you're with"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                <p className={styles.otherHint}>A monitor will need to acknowledge this.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={!minMet}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
