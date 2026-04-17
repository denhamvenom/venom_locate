import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'

const groupsRef = () => collection(db, 'events', EVENT_CODE, 'groups')

export function subscribePendingApprovals(callback) {
  const q = query(
    groupsRef(),
    where('otherApproved', '==', false),
  )
  return onSnapshot(q, (snap) => {
    const pending = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(pending)
  }, (err) => {
    console.error('subscribePendingApprovals error:', err)
  })
}

export async function approveOther(groupId, monitorId) {
  const ref = doc(groupsRef(), groupId)
  await updateDoc(ref, {
    otherApproved: true,
    otherApprovedBy: monitorId,
    otherApprovedAt: serverTimestamp(),
  })
}
