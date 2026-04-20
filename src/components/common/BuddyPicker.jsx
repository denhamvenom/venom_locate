import { useMemo, useState } from 'react'
import { STUDENTS, MENTORS } from '../../lib/roster'
import styles from './BuddyPicker.module.css'

export default function BuddyPicker({ location, selfId, requireMin = 0, requireOther = false, initialSelected = [], onSave, onCancel }) {
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelected))
  const [otherOpen, setOtherOpen] = useState(requireOther)
  const [otherRole, setOtherRole] = useState('')
  const [otherName, setOtherName] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return {
      students: STUDENTS.filter(s => s.id !== selfId && s.display.toLowerCase().includes(q)),
      mentors: MENTORS.filter(s => s.id !== selfId && s.display.toLowerCase().includes(q)),
    }
  }, [query, selfId])

  const otherComplete = otherRole && otherName.trim()
  const otherCount = otherComplete ? 1 : 0
  const otherText = otherComplete ? `${otherRole} — ${otherName.trim()}` : ''
  const total = selectedIds.size + otherCount
  const minMet = total >= requireMin && (!requireOther || otherComplete)

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

  function openAndScroll(id) {
    const el = document.getElementById(id)
    if (!el) return
    if (el.tagName === 'DETAILS') el.open = true
    el.scrollIntoView({ behavior: 'smooth' })
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
              {requireOther
                ? "Tell us who you're with (parent, sibling, etc). A monitor must approve."
                : requireMin > 0
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

        <div className={styles.jumpRow}>
          <button type="button" className={styles.jumpChip} onClick={() => openAndScroll('bp-students')}>Students</button>
          <button type="button" className={styles.jumpChip} onClick={() => openAndScroll('bp-mentors')}>Mentors</button>
          <button type="button" className={styles.jumpChip} onClick={() => openAndScroll('bp-other')}>Other</button>
        </div>

        <div className={styles.list}>
          {filtered.students.length > 0 && (
            <details id="bp-students" className={styles.group} open={!!query || filtered.students.length <= 8}>
              <summary className={styles.section}>
                Students <span className={styles.sectionCount}>{filtered.students.length}</span>
              </summary>
              {filtered.students.map(renderRow)}
            </details>
          )}
          {filtered.mentors.length > 0 && (
            <details id="bp-mentors" className={styles.group} open={!!query}>
              <summary className={styles.section}>
                Mentors <span className={styles.sectionCount}>{filtered.mentors.length}</span>
              </summary>
              {filtered.mentors.map(renderRow)}
            </details>
          )}

          <div id="bp-other" className={styles.section}>Off-roster</div>
          <div className={`${styles.otherWrap} ${otherComplete ? styles.otherActive : ''}`}>
            <button
              type="button"
              className={styles.otherToggle}
              onClick={() => setOtherOpen(o => !o)}
            >
              <span className={styles.checkbox} aria-hidden>{otherComplete ? '✓' : ''}</span>
              <span className={styles.itemName}>
                {otherComplete ? otherText : 'Someone not on the roster'}
              </span>
              <span className={styles.expand}>{otherOpen ? '▾' : '▸'}</span>
            </button>
            {otherOpen && (
              <div className={styles.otherInputWrap}>
                <div className={styles.otherRoleRow}>
                  {['Parent', 'Sibling', 'Grandparent', 'Other Family'].map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`${styles.otherRoleChip} ${otherRole === r ? styles.otherRoleActive : ''}`}
                      onClick={() => setOtherRole(prev => prev === r ? '' : r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="buddy-other-name"
                  maxLength={60}
                  placeholder="Their name"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  autoComplete="off"
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
