import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { LOCATIONS, locationLabel, locationIcon } from '../../lib/locations'
import { writeLocation } from '../../lib/locationSync'
import {
  createGroup, joinGroup, moveGroup, leaveGroup,
  addMember, dismissClaim, findMemberGroup,
  subscribeGroupClaims, subscribeMyGroup, subscribeAllGroups,
} from '../../lib/groups'
import { nameOf } from '../../lib/roster'
import { useApp } from '../../context/AppContext'
import { useToast } from '../common/Toast'
import BuddyPicker from '../common/BuddyPicker'
import styles from './MyLocation.module.css'

export default function MyLocation() {
  const { studentId, studentName, role } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [note, setNote] = useState('')
  const [current, setCurrent] = useState(null)
  const [myGroup, setMyGroup] = useState(null)
  const [allGroups, setAllGroups] = useState({})
  const [pendingClaims, setPendingClaims] = useState([])
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [buddyPickerLoc, setBuddyPickerLoc] = useState(null)
  const [buddyPickerInitial, setBuddyPickerInitial] = useState([])
  const [groupDialog, setGroupDialog] = useState(null)
  const [groupConflict, setGroupConflict] = useState(null)

  useEffect(() => {
    if (!studentId) return
    const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
    return onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      setCurrent(data)
      if (!loaded) { setPickerOpen(!data); setLoaded(true) }
    })
  }, [studentId, loaded])

  useEffect(() => subscribeMyGroup(current?.groupId, setMyGroup), [current?.groupId])
  useEffect(() => { if (!studentId) return; return subscribeGroupClaims(studentId, setPendingClaims) }, [studentId])
  useEffect(() => subscribeAllGroups(setAllGroups), [])

  const inGroup = !!myGroup && (myGroup.confirmedMembers || []).includes(studentId)

  // ── Solo commit ──
  async function commitSolo(loc) {
    setSaving(true)
    try {
      await writeLocation({ studentId, studentName, role, locationId: loc.id, note: note.trim(), groupId: null })
      setNote(''); setPickerOpen(false)
      showToast(`Location set: ${loc.label}`, 'success', 2000)
    } catch (err) { console.error(err); showToast('Could not save — try again', 'error', 3000) }
    finally { setSaving(false) }
  }

  // ── Create new group ──
  async function commitGroup(loc, buddies) {
    setSaving(true)
    try {
      await createGroup({ creatorId: studentId, creatorName: studentName, creatorRole: role, locationId: loc.id, memberIds: buddies.withRosterIds, withOther: buddies.withOther, note: note.trim() })
      setNote(''); setPickerOpen(false); setBuddyPickerLoc(null); setBuddyPickerInitial([])
      showToast(`Group created at ${loc.label}`, 'success', 2000)
    } catch (err) { console.error(err); showToast('Could not create group — try again', 'error', 3000) }
    finally { setSaving(false) }
  }

  // ── Tile tap ──
  function handleTap(loc) {
    if (inGroup) { setGroupDialog({ loc }); return }
    if (role === 'student' && loc.buddyMin > 0) { setBuddyPickerLoc(loc); setBuddyPickerInitial([]); return }
    commitSolo(loc)
  }

  // ── Move / Leave group ──
  async function handleMoveGroup(loc) {
    setGroupDialog(null); setSaving(true)
    try { await moveGroup(myGroup.id, loc.id); setPickerOpen(false); showToast(`Group moved to ${loc.label}`, 'success', 2000) }
    catch (err) { console.error(err); showToast('Could not move group', 'error', 3000) }
    finally { setSaving(false) }
  }

  async function handleLeaveGroup() {
    setGroupDialog(null); setSaving(true)
    try { await leaveGroup(myGroup.id, studentId); showToast('Left group', 'info', 2000) }
    catch (err) { console.error(err); showToast('Could not leave group', 'error', 3000) }
    finally { setSaving(false) }
  }

  // ── Claim banners ──
  async function handleConfirmClaim(claim) {
    setSaving(true)
    try { await joinGroup(claim.id, { id: studentId, display: studentName, role }); showToast(`Joined group at ${locationLabel(claim.location)}`, 'success', 2000) }
    catch (err) { console.error(err); showToast('Could not join group', 'error', 3000) }
    finally { setSaving(false) }
  }

  function handleAddSomeoneClaim(claim) {
    handleConfirmClaim(claim).then(() => {
      const loc = LOCATIONS.find(l => l.id === claim.location) || { id: claim.location, label: claim.location, icon: '📍', buddyMin: 0 }
      setBuddyPickerLoc(loc); setBuddyPickerInitial((claim.members || []).filter(id => id !== studentId))
    })
  }

  async function handleDismissClaim(claim) {
    try { await dismissClaim(claim.id, studentId) } catch (err) { console.error(err) }
  }

  // ── "Add to Group" button handler ──
  function handleOpenAddToGroup() {
    if (!current || !myGroup) return
    const loc = LOCATIONS.find(l => l.id === current.location) || { id: current.location, label: current.location, icon: '📍', buddyMin: 0 }
    setBuddyPickerLoc(loc)
    setBuddyPickerInitial((myGroup.members || []).filter(id => id !== studentId))
  }

  // ── BuddyPicker save — with group conflict detection ──
  async function handleBuddySave(buddies) {
    // Check for group conflicts on selected members
    for (const memberId of buddies.withRosterIds) {
      const theirGroup = findMemberGroup(memberId, allGroups)
      if (theirGroup && theirGroup.id !== current?.groupId) {
        setGroupConflict({
          personId: memberId,
          theirGroup,
          pendingBuddies: buddies,
        })
        return
      }
    }

    await finalizeBuddySave(buddies)
  }

  async function finalizeBuddySave(buddies) {
    if (inGroup && current?.groupId) {
      const newIds = buddies.withRosterIds.filter(id => !(myGroup.members || []).includes(id))
      setSaving(true)
      try {
        for (const id of newIds) await addMember(current.groupId, id)
        setBuddyPickerLoc(null); setBuddyPickerInitial([])
        showToast('Members added', 'success', 2000)
      } catch (err) { console.error(err); showToast('Could not add members', 'error', 3000) }
      finally { setSaving(false) }
      return
    }
    if (buddyPickerLoc) commitGroup(buddyPickerLoc, buddies)
  }

  // ── Group conflict handlers ──
  async function handleJoinTheirGroup() {
    if (!groupConflict) return
    setSaving(true)
    try {
      await joinGroup(groupConflict.theirGroup.id, { id: studentId, display: studentName, role })
      showToast(`Joined ${nameOf(groupConflict.personId)}'s group`, 'success', 2000)
      setBuddyPickerLoc(null); setBuddyPickerInitial([])
    } catch (err) { console.error(err); showToast('Could not join group', 'error', 3000) }
    finally { setSaving(false); setGroupConflict(null) }
  }

  async function handleInviteToYours() {
    if (!groupConflict) return
    setGroupConflict(null)
    // Proceed with normal save — the invited person will get a claim banner
    // and auto-leave their old group if they confirm
    await finalizeBuddySave(groupConflict.pendingBuddies)
  }

  // ── Render helpers ──
  function renderGroupStatus() {
    if (!myGroup) return null
    const confirmed = (myGroup.confirmedMembers || []).filter(id => id !== studentId)
    const pending = (myGroup.members || []).filter(id => id !== studentId && !(myGroup.confirmedMembers || []).includes(id))
    const parts = [
      ...confirmed.map(id => `${nameOf(id)} ✓`),
      ...pending.map(id => `${nameOf(id)} (pending)`),
      myGroup.withOther && `${myGroup.withOther}${myGroup.otherApproved ? ' ✓' : ' (needs monitor OK)'}`,
    ].filter(Boolean)
    if (parts.length === 0) return null
    return <div className={styles.statusBuddies}>Group: {parts.join(', ')}</div>
  }

  return (
    <div className={styles.screen}>
      {/* ── Claim banners ── */}
      {pendingClaims.length > 0 && !pickerOpen && (
        <div className={styles.claimBanners}>
          {pendingClaims.map(claim => {
            const groupNames = [
              ...(claim.confirmedMembers || []).map(id => nameOf(id)),
              ...(claim.members || []).filter(id => !(claim.confirmedMembers || []).includes(id) && id !== studentId).map(id => `${nameOf(id)} (pending)`),
              'You',
            ]
            return (
              <div key={claim.id} className={styles.claimCard}>
                <div className={styles.claimText}>
                  <strong>{nameOf(claim.createdBy)}</strong> says you're at{' '}
                  <strong>{locationIcon(claim.location)} {locationLabel(claim.location)}</strong>
                </div>
                <div className={styles.claimGroup}>Group: {groupNames.join(', ')}</div>
                <div className={styles.claimActions}>
                  <button className={styles.claimConfirm} onClick={() => handleConfirmClaim(claim)} disabled={saving}>Confirm</button>
                  <button className={styles.claimAdd} onClick={() => handleAddSomeoneClaim(claim)} disabled={saving}>Add Someone</button>
                  <button className={styles.claimDismiss} onClick={() => handleDismissClaim(claim)} disabled={saving}>Different Location</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Status card ── */}
      <div className={`${styles.statusCard} ${current ? styles.statusCardSet : ''}`}>
        <div className={styles.statusLabel}>Current location</div>
        {current ? (
          <>
            <div className={styles.statusValueRow}>
              <span className={styles.statusIcon}>{locationIcon(current.location)}</span>
              <span className={styles.statusValue}>{locationLabel(current.location)}</span>
            </div>
            {renderGroupStatus()}
            {current.note && <div className={styles.statusNote}>"{current.note}"</div>}
          </>
        ) : (
          <div className={styles.statusValue}>— not set —</div>
        )}
      </div>

      {/* ── Action buttons (collapsed) ── */}
      {!pickerOpen && current && (
        <div className={styles.actionRow}>
          <button type="button" className={`btn-primary ${styles.changeBtn}`} onClick={() => setPickerOpen(true)}>
            Change Location
          </button>
          {inGroup && (
            <button type="button" className={`btn-secondary ${styles.addToGroupBtn}`} onClick={handleOpenAddToGroup}>
              Add to Group
            </button>
          )}
        </div>
      )}

      {/* ── Location grid ── */}
      {pickerOpen && (
        <>
          <label className={styles.noteLabel}>
            <span>Add a note (optional)</span>
            <input type="text" name="location-note" maxLength={80} placeholder="e.g. Helping with battery swap" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
          </label>
          <div className={styles.grid}>
            {LOCATIONS.map((loc) => {
              const isCurrent = current?.location === loc.id
              const showBuddyHint = role === 'student' && loc.buddyMin > 0 && !inGroup
              return (
                <button key={loc.id} type="button" className={`${styles.tile} ${isCurrent ? styles.tileCurrent : ''}`} onClick={() => handleTap(loc)} disabled={saving}>
                  <span className={styles.tileIcon}>{loc.icon}</span>
                  <span className={styles.tileLabel}>{loc.label}</span>
                  {showBuddyHint && <span className={styles.tileBuddy}>+{loc.buddyMin} 👥</span>}
                </button>
              )
            })}
          </div>
          {current && (
            <button type="button" className={`btn-secondary ${styles.cancelBtn}`} onClick={() => { setPickerOpen(false); setNote(''); setGroupDialog(null) }}>Cancel</button>
          )}
        </>
      )}

      {/* ── Group dialog: move vs leave ── */}
      {groupDialog && (
        <div className={styles.groupOverlay} onClick={() => setGroupDialog(null)}>
          <div className={styles.groupModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.groupTitle}>{locationIcon(groupDialog.loc.id)} {groupDialog.loc.label}</h3>
            <p className={styles.groupText}>You're in a group. What do you want to do?</p>
            <div className={styles.groupActions}>
              <button className="btn-primary" onClick={() => handleMoveGroup(groupDialog.loc)} disabled={saving}>Move entire group</button>
              <button className="btn-secondary" onClick={handleLeaveGroup} disabled={saving}>Leave group &amp; go alone</button>
              <button className="btn-ghost" onClick={() => setGroupDialog(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Group conflict dialog ── */}
      {groupConflict && (
        <div className={styles.groupOverlay} onClick={() => setGroupConflict(null)}>
          <div className={styles.groupModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.groupTitle}>Group Conflict</h3>
            <p className={styles.groupText}>
              <strong>{nameOf(groupConflict.personId)}</strong> is already in a group at{' '}
              <strong>{locationIcon(groupConflict.theirGroup.location)} {locationLabel(groupConflict.theirGroup.location)}</strong>.
            </p>
            <div className={styles.groupActions}>
              <button className="btn-primary" onClick={handleJoinTheirGroup} disabled={saving}>
                Join {nameOf(groupConflict.personId)}'s group
              </button>
              <button className="btn-secondary" onClick={handleInviteToYours} disabled={saving}>
                Invite them to yours
              </button>
              <button className="btn-ghost" onClick={() => setGroupConflict(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BuddyPicker ── */}
      {buddyPickerLoc && (
        <BuddyPicker
          location={buddyPickerLoc}
          selfId={studentId}
          requireMin={inGroup ? 0 : buddyPickerLoc.buddyMin}
          initialSelected={buddyPickerInitial}
          onSave={handleBuddySave}
          onCancel={() => { setBuddyPickerLoc(null); setBuddyPickerInitial([]) }}
        />
      )}

      <ToastContainer />
    </div>
  )
}
