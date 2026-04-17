import { useEffect, useState, useMemo } from 'react'
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { LOCATIONS, locationLabel, locationIcon } from '../../lib/locations'
import { writeLocation } from '../../lib/locationSync'
import { nameOf } from '../../lib/roster'
import { useApp } from '../../context/AppContext'
import { useToast } from '../common/Toast'
import BuddyPicker from '../common/BuddyPicker'
import styles from './MyLocation.module.css'

const DISMISSED_KEY = 'venomLocate_dismissedClaims'

function loadDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}
function saveDismissed(arr) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr)) } catch {}
}
function isDismissed(claimantId, locationId) {
  return loadDismissed().some(d => d.claimantId === claimantId && d.locationId === locationId)
}
function addDismissed(claimantId, locationId) {
  const arr = loadDismissed().filter(d => !(d.claimantId === claimantId && d.locationId === locationId))
  arr.push({ claimantId, locationId, ts: Date.now() })
  saveDismissed(arr)
}

export default function MyLocation() {
  const { studentId, studentName, role } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [note, setNote] = useState('')
  const [current, setCurrent] = useState(null)
  const [pending, setPending] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [buddyPickerLoc, setBuddyPickerLoc] = useState(null)
  const [buddyPickerInitial, setBuddyPickerInitial] = useState([])
  const [claims, setClaims] = useState([])
  const [, setDismissVersion] = useState(0)

  useEffect(() => {
    if (!studentId) return
    const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
    return onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      setCurrent(data)
      if (!loaded) {
        setPickerOpen(!data)
        setLoaded(true)
      }
    })
  }, [studentId, loaded])

  useEffect(() => {
    if (!studentId) return
    const q = query(
      collection(db, 'events', EVENT_CODE, 'locations'),
      where('withRosterIds', 'array-contains', studentId)
    )
    return onSnapshot(q, (snap) => {
      setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.id !== studentId))
    })
  }, [studentId])

  const pendingClaims = useMemo(() => {
    return claims.filter(claim => {
      if (isDismissed(claim.id, claim.location)) return false
      const isMutual = current?.location === claim.location &&
        (current.withRosterIds || []).includes(claim.id)
      return !isMutual
    })
  }, [claims, current])

  async function commit(loc, buddies) {
    setPending(loc.id)
    try {
      await writeLocation({
        studentId,
        studentName,
        role,
        locationId: loc.id,
        note: note.trim(),
        withRosterIds: buddies?.withRosterIds ?? [],
        withOther: buddies?.withOther ?? null,
      })
      setNote('')
      setPickerOpen(false)
      setBuddyPickerLoc(null)
      setBuddyPickerInitial([])
      showToast(`Location set: ${loc.label}`, 'success', 2000)
    } catch (err) {
      console.error(err)
      showToast('Could not save — try again', 'error', 3000)
    } finally {
      setPending(null)
    }
  }

  function handleTap(loc) {
    const needsBuddy = role === 'student' && loc.buddyMin > 0
    if (needsBuddy) {
      setBuddyPickerLoc(loc)
      setBuddyPickerInitial([])
      return
    }
    commit(loc, null)
  }

  function handleConfirmClaim(claim) {
    const groupBuddies = [
      claim.id,
      ...(claim.withRosterIds || []).filter(id => id !== studentId),
    ]
    const loc = LOCATIONS.find(l => l.id === claim.location) || { id: claim.location, label: claim.location, icon: '📍', buddyMin: 0 }
    commit(loc, { withRosterIds: groupBuddies, withOther: null })
  }

  function handleAddSomeoneClaim(claim) {
    const groupBuddies = [
      claim.id,
      ...(claim.withRosterIds || []).filter(id => id !== studentId),
    ]
    const loc = LOCATIONS.find(l => l.id === claim.location) || { id: claim.location, label: claim.location, icon: '📍', buddyMin: 0 }
    setBuddyPickerLoc(loc)
    setBuddyPickerInitial(groupBuddies)
  }

  function handleDismissClaim(claim) {
    addDismissed(claim.id, claim.location)
    setDismissVersion(v => v + 1)
  }

  return (
    <div className={styles.screen}>
      {pendingClaims.length > 0 && !pickerOpen && (
        <div className={styles.claimBanners}>
          {pendingClaims.map(claim => {
            const groupNames = [
              claim.studentName,
              ...(claim.withRosterIds || [])
                .filter(id => id !== studentId && id !== claim.id)
                .map(id => nameOf(id)),
              'You',
            ]
            return (
              <div key={claim.id} className={styles.claimCard}>
                <div className={styles.claimText}>
                  <strong>{claim.studentName}</strong> says you're at{' '}
                  <strong>{locationIcon(claim.location)} {locationLabel(claim.location)}</strong>
                </div>
                <div className={styles.claimGroup}>
                  Group: {groupNames.join(', ')}
                </div>
                <div className={styles.claimActions}>
                  <button className={styles.claimConfirm} onClick={() => handleConfirmClaim(claim)}>
                    Confirm
                  </button>
                  <button className={styles.claimAdd} onClick={() => handleAddSomeoneClaim(claim)}>
                    Add Someone
                  </button>
                  <button className={styles.claimDismiss} onClick={() => handleDismissClaim(claim)}>
                    Different Location
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={`${styles.statusCard} ${current ? styles.statusCardSet : ''}`}>
        <div className={styles.statusLabel}>Current location</div>
        {current ? (
          <>
            <div className={styles.statusValueRow}>
              <span className={styles.statusIcon}>{locationIcon(current.location)}</span>
              <span className={styles.statusValue}>{locationLabel(current.location)}</span>
            </div>
            {(current.withRosterIds?.length > 0 || current.withOther) && (
              <div className={styles.statusBuddies}>
                with {[
                  ...(current.withRosterIds || []).map(id => nameOf(id)),
                  current.withOther && `${current.withOther}${current.otherApproved ? ' ✓' : ' (needs monitor OK)'}`,
                ].filter(Boolean).join(', ')}
              </div>
            )}
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
              const showBuddyHint = role === 'student' && loc.buddyMin > 0
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
                  {showBuddyHint && (
                    <span className={styles.tileBuddy}>+{loc.buddyMin} 👥</span>
                  )}
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

      {buddyPickerLoc && (
        <BuddyPicker
          location={buddyPickerLoc}
          selfId={studentId}
          requireMin={buddyPickerLoc.buddyMin}
          initialSelected={buddyPickerInitial}
          onSave={(buddies) => commit(buddyPickerLoc, buddies)}
          onCancel={() => { setBuddyPickerLoc(null); setBuddyPickerInitial([]) }}
        />
      )}

      <ToastContainer />
    </div>
  )
}
