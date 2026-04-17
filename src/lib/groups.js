import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, setDoc, deleteField, arrayUnion, arrayRemove,
  serverTimestamp, query, where, onSnapshot, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'
import { getDeviceId } from './deviceId'

const groupsRef = () => collection(db, 'events', EVENT_CODE, 'groups')
const locRef = (rosterId) => doc(db, 'events', EVENT_CODE, 'locations', rosterId)

export async function createGroup({ creatorId, creatorName, creatorRole, locationId, memberIds, withOther, note }) {
  const allMembers = [creatorId, ...memberIds.filter(id => id !== creatorId)]

  const groupDoc = await addDoc(groupsRef(), {
    members: allMembers,
    confirmedMembers: [creatorId],
    location: locationId,
    createdBy: creatorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    withOther: withOther || null,
    otherApproved: withOther ? false : null,
    otherApprovedBy: null,
    otherApprovedAt: null,
  })

  await setDoc(locRef(creatorId), {
    studentId: creatorId,
    studentName: creatorName,
    role: creatorRole,
    location: locationId,
    note: note || null,
    timestamp: serverTimestamp(),
    deviceId: getDeviceId(),
    groupId: groupDoc.id,
  })

  return groupDoc.id
}

export async function joinGroup(groupId, person) {
  const ref = doc(groupsRef(), groupId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  // Auto-leave old group if in one
  const locSnap = await getDoc(locRef(person.id))
  const oldGroupId = locSnap.exists() ? locSnap.data().groupId : null
  if (oldGroupId && oldGroupId !== groupId) {
    await leaveGroup(oldGroupId, person.id)
  }

  const data = snap.data()
  await updateDoc(ref, {
    members: arrayUnion(person.id),
    confirmedMembers: arrayUnion(person.id),
    updatedAt: serverTimestamp(),
  })

  await setDoc(locRef(person.id), {
    studentId: person.id,
    studentName: person.display,
    role: person.role,
    location: data.location,
    note: null,
    timestamp: serverTimestamp(),
    deviceId: getDeviceId(),
    groupId,
  })
}

export async function findMemberGroup(rosterId, allGroups) {
  for (const g of Object.values(allGroups)) {
    if ((g.confirmedMembers || []).includes(rosterId)) return g
  }
  return null
}

export async function moveGroup(groupId, newLocationId) {
  const ref = doc(groupsRef(), groupId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const data = snap.data()
  const confirmed = data.confirmedMembers || []

  const batch = writeBatch(db)
  batch.update(ref, { location: newLocationId, updatedAt: serverTimestamp() })

  for (const memberId of confirmed) {
    batch.update(locRef(memberId), {
      location: newLocationId,
      timestamp: serverTimestamp(),
      deviceId: getDeviceId(),
    })
  }

  await batch.commit()
}

export async function leaveGroup(groupId, rosterId) {
  const ref = doc(groupsRef(), groupId)
  await updateDoc(ref, {
    members: arrayRemove(rosterId),
    confirmedMembers: arrayRemove(rosterId),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(locRef(rosterId), {
    groupId: null,
  })

  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data()
    if (!data.confirmedMembers?.length) {
      // no one left — group is dead; we could delete it but leaving it is harmless
    }
  }
}

export async function addMember(groupId, newMemberId) {
  const ref = doc(groupsRef(), groupId)
  await updateDoc(ref, {
    members: arrayUnion(newMemberId),
    updatedAt: serverTimestamp(),
  })
}

export async function dismissClaim(groupId, rosterId) {
  const ref = doc(groupsRef(), groupId)
  await updateDoc(ref, {
    members: arrayRemove(rosterId),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeGroupClaims(rosterId, callback) {
  const q = query(groupsRef(), where('members', 'array-contains', rosterId))
  return onSnapshot(q, (snap) => {
    const groups = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(g => !(g.confirmedMembers || []).includes(rosterId))
    callback(groups)
  })
}

export function subscribeMyGroup(groupId, callback) {
  if (!groupId) { callback(null); return () => {} }
  const ref = doc(groupsRef(), groupId)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export function subscribeAllGroups(callback) {
  return onSnapshot(groupsRef(), (snap) => {
    const groups = {}
    snap.docs.forEach(d => { groups[d.id] = { id: d.id, ...d.data() } })
    callback(groups)
  })
}
