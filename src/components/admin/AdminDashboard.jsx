import { useEffect, useState } from 'react'
import { collection, getDocs, doc, writeBatch, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { LOCATIONS, locationLabel, locationIcon } from '../../lib/locations'
import { ROSTER, nameOf } from '../../lib/roster'
import { writeLocation } from '../../lib/locationSync'
import { moveGroup as moveGroupFn, subscribeAllGroups } from '../../lib/groups'
import { sendMessage, subscribeRecentMessages, isMessageForMe } from '../../lib/messages'
import { relativeTime, toDate } from '../../lib/time'
import { deletePin, deleteAllPins } from '../../lib/pins'
import { useApp } from '../../context/AppContext'
import { useToast } from '../common/Toast'
import TargetPicker from '../common/TargetPicker'
import ConfirmModal from '../common/ConfirmModal'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const { studentName } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [docs, setDocs] = useState([])
  const [groups, setGroups] = useState({})
  const [tab, setTab] = useState('move')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)

  // Move state
  const [movePerson, setMovePerson] = useState('')
  const [moveLoc, setMoveLoc] = useState('')
  const [moveAllLoc, setMoveAllLoc] = useState('')
  const [moveGroupId, setMoveGroupId] = useState('')
  const [moveGroupLoc, setMoveGroupLoc] = useState('')

  // PIN reset state
  const [resetPinPerson, setResetPinPerson] = useState('')

  // Message state
  const [msgBody, setMsgBody] = useState('')
  const [msgKind, setMsgKind] = useState('info')
  const [msgTarget, setMsgTarget] = useState({ groups: [], rosterIds: [] })
  const [sentMessages, setSentMessages] = useState([])

  useEffect(() => {
    const ref = collection(db, 'events', EVENT_CODE, 'locations')
    return onSnapshot(ref, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => subscribeAllGroups(setGroups), [])
  useEffect(() => subscribeRecentMessages(setSentMessages), [])

  const activeGroups = Object.values(groups).filter(g => (g.confirmedMembers || []).length > 1)

  // ── Move person ──
  async function handleMovePerson() {
    if (!movePerson || !moveLoc) return
    setBusy(true)
    try {
      const person = ROSTER.find(r => r.id === movePerson)
      if (person) {
        await writeLocation({
          studentId: person.id,
          studentName: person.display,
          role: person.role,
          locationId: moveLoc,
          note: `Moved by admin`,
          groupId: null,
        })
        showToast(`Moved ${person.display} to ${locationLabel(moveLoc)}`, 'success')
        setMovePerson(''); setMoveLoc('')
      }
    } catch (err) { console.error(err); showToast('Move failed', 'error') }
    finally { setBusy(false) }
  }

  // ── Move group ──
  async function handleMoveGroup() {
    if (!moveGroupId || !moveGroupLoc) return
    setBusy(true)
    try {
      await moveGroupFn(moveGroupId, moveGroupLoc)
      showToast(`Group moved to ${locationLabel(moveGroupLoc)}`, 'success')
      setMoveGroupId(''); setMoveGroupLoc('')
    } catch (err) { console.error(err); showToast('Move failed', 'error') }
    finally { setBusy(false) }
  }

  // ── Move bulk ──
  async function handleMoveBulk(roleFilter) {
    if (!moveAllLoc) return
    setBusy(true)
    try {
      const targets = roleFilter ? docs.filter(d => d.role === roleFilter) : docs
      const batch = writeBatch(db)
      for (const d of targets) {
        const ref = doc(db, 'events', EVENT_CODE, 'locations', d.id)
        batch.update(ref, { location: moveAllLoc })
      }
      await batch.commit()
      const label = roleFilter === 'student' ? 'students' : roleFilter === 'mentor' ? 'mentors' : 'everyone'
      showToast(`${targets.length} ${label} moved to ${locationLabel(moveAllLoc)}`, 'success')
      setMoveAllLoc('')
    } catch (err) { console.error(err); showToast('Move failed', 'error') }
    finally { setBusy(false) }
  }

  // ── Send message ──
  async function handleSendMessage() {
    const body = msgKind === 'checkin' ? 'Please confirm your current location.' : msgBody.trim()
    if (!body) { showToast('Enter a message', 'warning'); return }
    const hasTarget = msgTarget.groups.length > 0 || msgTarget.rosterIds.length > 0
    if (!hasTarget) { showToast('Select recipients', 'warning'); return }
    setBusy(true)
    try {
      await sendMessage({ body, target: msgTarget, kind: msgKind, sentBy: studentName })
      showToast(msgKind === 'checkin' ? 'Check-in sent' : 'Message sent', 'success')
      setMsgBody(''); setMsgTarget({ groups: [], rosterIds: [] })
    } catch (err) { console.error(err); showToast('Send failed', 'error') }
    finally { setBusy(false) }
  }

  // ── Reset event ──
  async function handleReset() {
    setBusy(true)
    setShowReset(false)
    try {
      const locSnap = await getDocs(collection(db, 'events', EVENT_CODE, 'locations'))
      const grpSnap = await getDocs(collection(db, 'events', EVENT_CODE, 'groups'))
      const msgSnap = await getDocs(collection(db, 'events', EVENT_CODE, 'messages'))

      const batch = writeBatch(db)
      locSnap.docs.forEach(d => batch.delete(d.ref))
      grpSnap.docs.forEach(d => batch.delete(d.ref))
      msgSnap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()

      showToast('All location data, groups, and messages cleared', 'success')
    } catch (err) { console.error(err); showToast('Reset failed', 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className={styles.screen}>
      <h2 className={styles.title}>Admin Dashboard</h2>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'move' ? styles.tabActive : ''}`} onClick={() => setTab('move')}>Move</button>
        <button className={`${styles.tab} ${tab === 'message' ? styles.tabActive : ''}`} onClick={() => setTab('message')}>Message</button>
        <button className={`${styles.tab} ${tab === 'reset' ? styles.tabActive : ''}`} onClick={() => setTab('reset')}>Reset</button>
      </div>

      {/* ── Move tab ── */}
      {tab === 'move' && (
        <div className={styles.tabContent}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Move a person</h3>
            <select className={styles.select} value={movePerson} onChange={e => setMovePerson(e.target.value)}>
              <option value="">Select person...</option>
              {ROSTER.map(r => <option key={r.id} value={r.id}>{r.display}</option>)}
            </select>
            <select className={styles.select} value={moveLoc} onChange={e => setMoveLoc(e.target.value)}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
            </select>
            <button className="btn-primary" onClick={handleMovePerson} disabled={busy || !movePerson || !moveLoc}>
              Move Person
            </button>
          </section>

          <div className="divider" />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Move a group</h3>
            <select className={styles.select} value={moveGroupId} onChange={e => setMoveGroupId(e.target.value)}>
              <option value="">Select group...</option>
              {activeGroups.map(g => (
                <option key={g.id} value={g.id}>
                  {locationLabel(g.location)} — {(g.confirmedMembers || []).map(id => nameOf(id)).join(', ')}
                </option>
              ))}
            </select>
            <select className={styles.select} value={moveGroupLoc} onChange={e => setMoveGroupLoc(e.target.value)}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
            </select>
            <button className="btn-primary" onClick={handleMoveGroup} disabled={busy || !moveGroupId || !moveGroupLoc}>
              Move Group
            </button>
          </section>

          <div className="divider" />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Move in bulk</h3>
            <select className={styles.select} value={moveAllLoc} onChange={e => setMoveAllLoc(e.target.value)}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleMoveBulk('student')} disabled={busy || !moveAllLoc}>
                Students
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleMoveBulk('mentor')} disabled={busy || !moveAllLoc}>
                Mentors
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleMoveBulk(null)} disabled={busy || !moveAllLoc}>
                Everyone
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── Message tab ── */}
      {tab === 'message' && (
        <div className={styles.tabContent}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Send a message</h3>
            <div className={styles.kindRow}>
              <button
                className={`${styles.kindChip} ${msgKind === 'info' ? styles.kindInfo : ''}`}
                onClick={() => setMsgKind('info')}
              >Info</button>
              <button
                className={`${styles.kindChip} ${msgKind === 'checkin' ? styles.kindCheckin : ''}`}
                onClick={() => setMsgKind('checkin')}
              >Check-in</button>
            </div>
            {msgKind === 'info' ? (
              <textarea
                className={styles.textarea}
                name="admin-message"
                rows={3}
                maxLength={300}
                placeholder="Type your message..."
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
              />
            ) : (
              <div className={styles.checkinPreview}>
                📍 "Please confirm your current location."
              </div>
            )}
            <TargetPicker value={msgTarget} onChange={setMsgTarget} />
            <button className="btn-primary" onClick={handleSendMessage} disabled={busy}>
              Send {msgKind === 'checkin' ? 'Check-in' : 'Message'}
            </button>
          </section>

          {sentMessages.length > 0 && (
            <section className={styles.section} style={{ marginTop: 16 }}>
              <h3 className={styles.sectionTitle}>Sent messages</h3>
              <div className={styles.messageLog}>
                {sentMessages.map(msg => {
                  const acks = msg.acks || {}
                  const ackCount = Object.keys(acks).length
                  const targetDesc = (msg.target?.groups || []).join(', ') || `${(msg.target?.rosterIds || []).length} individuals`
                  const ts = toDate(msg.timestamp)
                  return (
                    <details key={msg.id} className={styles.msgEntry}>
                      <summary className={styles.msgSummary}>
                        <span className={`${styles.msgKind} ${msg.kind === 'checkin' ? styles.msgCheckin : styles.msgInfo}`}>
                          {msg.kind === 'checkin' ? '🔴' : '📢'}
                        </span>
                        <span className={styles.msgBody}>{msg.body}</span>
                        <span className={styles.msgAckBadge}>{ackCount} ack{ackCount !== 1 ? 's' : ''}</span>
                        <span className={styles.msgTime}>{ts ? relativeTime(ts) : ''}</span>
                      </summary>
                      <div className={styles.msgDetail}>
                        <div className={styles.msgMeta}>To: {targetDesc} · from {msg.sentBy}</div>
                        {ackCount > 0 ? (
                          <ul className={styles.ackList}>
                            {Object.entries(acks).map(([rid, ackTs]) => (
                              <li key={rid} className={styles.ackItem}>
                                ✓ {nameOf(rid)}
                                <span className={styles.ackTime}>{toDate(ackTs) ? relativeTime(toDate(ackTs)) : ''}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={styles.noAcks}>No acknowledgements yet</p>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Reset tab ── */}
      {tab === 'reset' && (
        <div className={styles.tabContent}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Reset a student's PIN</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Student will be asked to set a new PIN on next login.
            </p>
            <select className={styles.select} value={resetPinPerson} onChange={e => setResetPinPerson(e.target.value)}>
              <option value="">Select person...</option>
              {ROSTER.map(r => <option key={r.id} value={r.id}>{r.display} ({r.role})</option>)}
            </select>
            <button
              className="btn-primary"
              disabled={busy || !resetPinPerson}
              onClick={async () => {
                setBusy(true)
                try {
                  await deletePin(resetPinPerson)
                  showToast(`PIN reset for ${nameOf(resetPinPerson)}`, 'success')
                  setResetPinPerson('')
                } catch (err) { console.error(err); showToast('Reset failed', 'error') }
                finally { setBusy(false) }
              }}
            >
              Reset PIN
            </button>
          </section>

          <div className="divider" />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Bulk PIN reset</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const n = await deleteAllPins('student')
                    showToast(`Reset ${n} student PIN${n !== 1 ? 's' : ''}`, 'success')
                  } catch (err) { console.error(err); showToast('Reset failed', 'error') }
                  finally { setBusy(false) }
                }}
              >
                All Students
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const n = await deleteAllPins('mentor')
                    showToast(`Reset ${n} mentor PIN${n !== 1 ? 's' : ''}`, 'success')
                  } catch (err) { console.error(err); showToast('Reset failed', 'error') }
                  finally { setBusy(false) }
                }}
              >
                All Mentors
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1 }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const n = await deleteAllPins(null)
                    showToast(`Reset ${n} PIN${n !== 1 ? 's' : ''}`, 'success')
                  } catch (err) { console.error(err); showToast('Reset failed', 'error') }
                  finally { setBusy(false) }
                }}
              >
                Everyone
              </button>
            </div>
          </section>

          <div className="divider" />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Reset event data</h3>
            <p className={styles.warning}>
              This deletes ALL location data, groups, and messages for the current event.
              PINs are preserved — only location tracking data is cleared.
            </p>
            <button className="btn-danger" onClick={() => setShowReset(true)} disabled={busy}>
              Reset All Data
            </button>
          </section>
        </div>
      )}

      {showReset && (
        <ConfirmModal
          title="Reset all event data?"
          message="This will permanently delete all locations, groups, and messages. This cannot be undone."
          confirmLabel="Yes, Reset Everything"
          danger
          onConfirm={handleReset}
          onCancel={() => setShowReset(false)}
        />
      )}

      <ToastContainer />
    </div>
  )
}
