import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'
import { getDeviceId } from './deviceId'

const messagesRef = () => collection(db, 'events', EVENT_CODE, 'messages')

export async function sendMessage({ body, target, kind, sentBy }) {
  await addDoc(messagesRef(), {
    body,
    target,
    kind: kind || 'info',
    sentBy: sentBy || 'Admin',
    timestamp: serverTimestamp(),
    acks: {},
  })
}

export async function ackMessage(messageId, rosterId) {
  const ref = doc(messagesRef(), messageId)
  await updateDoc(ref, {
    [`acks.${rosterId}`]: serverTimestamp(),
  })
}

export function subscribeRecentMessages(callback, count = 20) {
  const q = query(messagesRef(), orderBy('timestamp', 'desc'), limit(count))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function isMessageForMe(message, rosterId, role) {
  const { target } = message
  if (!target) return false
  const groups = target.groups || []
  const rosterIds = target.rosterIds || []
  if (groups.includes('all')) return true
  if (groups.includes('students') && role === 'student') return true
  if (groups.includes('mentors') && role === 'mentor') return true
  if (rosterIds.includes(rosterId)) return true
  return false
}
