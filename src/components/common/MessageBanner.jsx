import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EVENT_CODE } from '../../lib/constants'
import { locationLabel, locationIcon } from '../../lib/locations'
import { subscribeRecentMessages, ackMessage, isMessageForMe } from '../../lib/messages'
import { useApp } from '../../context/AppContext'
import styles from './MessageBanner.module.css'

export default function MessageBanner() {
  const { studentId, role } = useApp()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [acking, setAcking] = useState(null)
  const [myLocation, setMyLocation] = useState(null)

  useEffect(() => {
    if (!studentId) return
    return subscribeRecentMessages(setMessages)
  }, [studentId])

  useEffect(() => {
    if (!studentId) return
    const ref = doc(db, 'events', EVENT_CODE, 'locations', studentId)
    return onSnapshot(ref, (snap) => {
      setMyLocation(snap.exists() ? snap.data().location : null)
    })
  }, [studentId])

  const allUnacked = messages.filter(m =>
    isMessageForMe(m, studentId, role) && !m.acks?.[studentId]
  )

  // Check-ins don't stack — only the most recent unacked check-in is shown.
  // Info messages always stack (they're independent broadcasts).
  const checkins = allUnacked.filter(m => m.kind === 'checkin')
  const infos = allUnacked.filter(m => m.kind !== 'checkin')
  const latestCheckin = checkins.length > 0 ? checkins[0] : null // already ordered desc
  const unacked = latestCheckin ? [latestCheckin, ...infos] : infos

  useEffect(() => {
    if (unacked.length === 0) return
    const hasCheckin = unacked.some(m => m.kind === 'checkin')
    if (hasCheckin) {
      try { navigator.vibrate?.([200, 100, 200]) } catch {}
    }
  }, [unacked.length])

  if (unacked.length === 0) return null

  async function handleAck(msg) {
    setAcking(msg.id)
    try {
      await ackMessage(msg.id, studentId)
    } catch (err) {
      console.error(err)
    } finally {
      setAcking(null)
    }
  }

  async function handleCheckinHere(msg) {
    await handleAck(msg)
  }

  async function handleCheckinChange(msg) {
    await handleAck(msg)
    navigate('/me?openPicker=1')
  }

  return (
    <div className={styles.container}>
      {unacked.map(msg => (
        <div key={msg.id} className={`${styles.banner} ${msg.kind === 'checkin' ? styles.checkin : styles.info}`}>
          <div className={styles.text}>
            <span className={styles.label}>
              {msg.kind === 'checkin' ? '🔴 CHECK IN' : '📢 Message'}
            </span>
            <span className={styles.body}>{msg.body}</span>
            <span className={styles.from}>from {msg.sentBy}</span>
          </div>
          {msg.kind === 'checkin' ? (
            <div className={styles.checkinActions}>
              <button
                className={styles.hereBtn}
                onClick={() => handleCheckinHere(msg)}
                disabled={acking === msg.id}
              >
                {myLocation ? `I'm in ${locationIcon(myLocation)} ${locationLabel(myLocation)}` : "I'm here"}
              </button>
              <button
                className={styles.changeBtn}
                onClick={() => handleCheckinChange(msg)}
                disabled={acking === msg.id}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              className={styles.ackBtn}
              onClick={() => handleAck(msg)}
              disabled={acking === msg.id}
            >
              {acking === msg.id ? '…' : 'OK'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
