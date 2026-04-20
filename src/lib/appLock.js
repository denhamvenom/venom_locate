import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'

const lockRef = () => doc(db, 'events', EVENT_CODE, 'config', 'appLock')

export function subscribeAppLock(callback) {
  return onSnapshot(lockRef(), (snap) => {
    const data = snap.exists() ? snap.data() : {}
    callback({
      studentsLocked: !!data.studentsLocked,
      mentorsLocked: !!data.mentorsLocked,
    })
  }, () => callback({ studentsLocked: false, mentorsLocked: false }))
}

export async function setAppLock({ studentsLocked, mentorsLocked }) {
  await setDoc(lockRef(), {
    studentsLocked: !!studentsLocked,
    mentorsLocked: !!mentorsLocked,
  }, { merge: true })
}

export function isUserLocked(lockState, role, isAdmin) {
  if (isAdmin) return false
  if (role === 'student') return lockState.studentsLocked
  if (role === 'mentor') return lockState.mentorsLocked
  return false
}
