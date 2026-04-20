import {
  collection, doc, addDoc, updateDoc, setDoc, getDoc,
  query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'

const emergenciesRef = () => collection(db, 'events', EVENT_CODE, 'emergencies')
const configRef = () => doc(db, 'events', EVENT_CODE, 'config', 'emergency')

export async function createEmergency({ studentId, studentName, role, type, comment, location, gps }) {
  if (!studentId || !type || !comment?.trim()) {
    throw new Error('createEmergency requires studentId, type, and comment')
  }
  return await addDoc(emergenciesRef(), {
    studentId,
    studentName,
    role: role || 'student',
    type,
    comment: comment.trim(),
    location: location || null,
    gps: gps || null,
    status: 'active',
    createdAt: serverTimestamp(),
    acknowledgedBy: {},
    resolvedBy: null,
    resolvedById: null,
    resolvedReason: null,
    resolvedAt: null,
  })
}

// Best-effort GPS capture. Resolves to { lat, lng, accuracy } or null on
// denial/timeout/error. Never throws — emergency send must not be blocked.
export function captureGpsBestEffort(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null); return
    }
    let done = false
    const finish = (val) => { if (!done) { done = true; resolve(val) } }
    const timer = setTimeout(() => finish(null), timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        finish({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        })
      },
      () => { clearTimeout(timer); finish(null) },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 }
    )
  })
}

export async function acknowledgeEmergency(emergencyId, mentorId, mentorName) {
  const ref = doc(emergenciesRef(), emergencyId)
  await updateDoc(ref, {
    [`acknowledgedBy.${mentorId}`]: { name: mentorName, timestamp: serverTimestamp() },
  })
}

export async function resolveEmergency(emergencyId, resolverId, resolverName, reason) {
  const ref = doc(emergenciesRef(), emergencyId)
  await updateDoc(ref, {
    status: 'resolved',
    resolvedBy: resolverName,
    resolvedById: resolverId,
    resolvedReason: reason,
    resolvedAt: serverTimestamp(),
  })
}

export function subscribeActiveEmergencies(callback) {
  const q = query(emergenciesRef(), where('status', '==', 'active'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, (err) => {
    console.error('subscribeActiveEmergencies error:', err)
  })
}

export function subscribeEmergencyConfig(callback) {
  return onSnapshot(configRef(), (snap) => {
    callback(snap.exists() ? snap.data() : { enabled: true })
  }, () => {
    callback({ enabled: true })
  })
}

export async function setEmergencyEnabled(enabled) {
  await setDoc(configRef(), { enabled }, { merge: true })
}

export async function getEmergencyConfig() {
  const snap = await getDoc(configRef())
  return snap.exists() ? snap.data() : { enabled: true }
}
