import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'
import { getDeviceId } from './deviceId'

const historyRef = (rosterId) =>
  collection(db, 'events', EVENT_CODE, 'locationHistory', rosterId, 'entries')

export async function writeLocation({ studentId, studentName, role, locationId, note, groupId }) {
  if (!studentId || !locationId) {
    throw new Error('writeLocation requires studentId and locationId')
  }

  const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
  await setDoc(ref, {
    studentId,
    studentName,
    role: role || 'student',
    location: locationId,
    note: note || null,
    timestamp: serverTimestamp(),
    deviceId: getDeviceId(),
    groupId: groupId || null,
  })

  await addDoc(historyRef(studentId), {
    location: locationId,
    note: note || null,
    timestamp: serverTimestamp(),
    groupId: groupId || null,
  })
}

export async function writeHistoryEntry(rosterId, locationId, groupId) {
  await addDoc(historyRef(rosterId), {
    location: locationId,
    note: null,
    timestamp: serverTimestamp(),
    groupId: groupId || null,
  })
}
