import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'
import { getDeviceId } from './deviceId'

export async function writeLocation({ studentId, studentName, role, locationId, note }) {
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
  })
}
