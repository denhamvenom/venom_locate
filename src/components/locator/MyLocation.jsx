import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { LOCATIONS, locationLabel, locationIcon } from '../../lib/locations'
import { writeLocation } from '../../lib/locationSync'
import { useApp } from '../../context/AppContext'
import { useToast } from '../common/Toast'
import styles from './MyLocation.module.css'

export default function MyLocation() {
  const { studentId, studentName, role } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [note, setNote] = useState('')
  const [current, setCurrent] = useState(null)
  const [pending, setPending] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!studentId) return
    const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
    return onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      setCurrent(data)
      // Auto-open picker on first load if no location set yet
      if (!loaded) {
        setPickerOpen(!data)
        setLoaded(true)
      }
    })
  }, [studentId, loaded])

  async function handleTap(loc) {
    setPending(loc.id)
    try {
      await writeLocation({
        studentId,
        studentName,
        role,
        locationId: loc.id,
        note: note.trim(),
      })
      setNote('')
      setPickerOpen(false)
      showToast(`Location set: ${loc.label}`, 'success', 2000)
    } catch (err) {
      console.error(err)
      showToast('Could not save — try again', 'error', 3000)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={`${styles.statusCard} ${current ? styles.statusCardSet : ''}`}>
        <div className={styles.statusLabel}>Current location</div>
        {current ? (
          <>
            <div className={styles.statusValueRow}>
              <span className={styles.statusIcon}>{locationIcon(current.location)}</span>
              <span className={styles.statusValue}>{locationLabel(current.location)}</span>
            </div>
            {current.note && <div className={styles.statusNote}>"{current.note}"</div>}
          </>
        ) : (
          <div className={styles.statusValue}>— not set —</div>
        )}
      </div>

      {!pickerOpen && current && (
        <button
          type="button"
          className={`btn-primary ${styles.changeBtn}`}
          onClick={() => setPickerOpen(true)}
        >
          Change Location
        </button>
      )}

      {pickerOpen && (
        <>
          <label className={styles.noteLabel}>
            <span>Add a note (optional)</span>
            <input
              type="text"
              name="location-note"
              maxLength={80}
              placeholder="e.g. Helping with battery swap"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className={styles.grid}>
            {LOCATIONS.map((loc) => {
              const isCurrent = current?.location === loc.id
              const isPending = pending === loc.id
              return (
                <button
                  key={loc.id}
                  type="button"
                  className={`${styles.tile} ${isCurrent ? styles.tileCurrent : ''}`}
                  onClick={() => handleTap(loc)}
                  disabled={pending !== null}
                >
                  <span className={styles.tileIcon}>{loc.icon}</span>
                  <span className={styles.tileLabel}>{loc.label}</span>
                  {isPending && <span className={styles.tilePending}>…</span>}
                </button>
              )
            })}
          </div>

          {current && (
            <button
              type="button"
              className={`btn-secondary ${styles.cancelBtn}`}
              onClick={() => { setPickerOpen(false); setNote('') }}
            >
              Cancel
            </button>
          )}
        </>
      )}

      <ToastContainer />
    </div>
  )
}
