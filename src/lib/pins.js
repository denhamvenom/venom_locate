import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { EVENT_CODE } from './constants'

const pinRef = (rosterId) => doc(db, 'events', EVENT_CODE, 'pins', rosterId)

export async function getPin(rosterId) {
  const snap = await getDoc(pinRef(rosterId))
  return snap.exists() ? snap.data().pin : null
}

export async function setPin(rosterId, pin) {
  await setDoc(pinRef(rosterId), { pin })
}

export async function deletePin(rosterId) {
  await deleteDoc(pinRef(rosterId))
}

export async function deleteAllPins(filterRole) {
  const snap = await getDocs(collection(db, 'events', EVENT_CODE, 'pins'))
  if (snap.empty) return 0
  const { ROSTER } = await import('./roster')
  const roleSet = new Set(
    ROSTER.filter(r => !filterRole || r.role === filterRole).map(r => r.id)
  )
  const batch = writeBatch(db)
  let count = 0
  snap.docs.forEach(d => {
    if (roleSet.has(d.id)) { batch.delete(d.ref); count++ }
  })
  if (count > 0) await batch.commit()
  return count
}
