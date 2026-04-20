import { useEffect, useState } from 'react'
import { sendMessage, subscribeRecentMessages } from '../../lib/messages'
import { nameOf } from '../../lib/roster'
import { relativeTime, toDate } from '../../lib/time'
import { useApp } from '../../context/AppContext'
import { useToast } from '../common/Toast'
import TargetPicker from '../common/TargetPicker'
import styles from './MonitorMessages.module.css'

export default function MonitorMessages() {
  const { studentName } = useApp()
  const { showToast, ToastContainer } = useToast()
  const [msgBody, setMsgBody] = useState('')
  const [msgKind, setMsgKind] = useState('info')
  const [msgTarget, setMsgTarget] = useState({ groups: [], rosterIds: [] })
  const [sentMessages, setSentMessages] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeRecentMessages(setSentMessages), [])

  async function handleSend() {
    const body = msgKind === 'checkin' ? 'Please confirm your current location.' : msgBody.trim()
    if (!body) { showToast('Enter a message', 'warning'); return }
    const hasTarget = msgTarget.groups.length > 0 || msgTarget.rosterIds.length > 0
    if (!hasTarget) { showToast('Select recipients', 'warning'); return }
    setBusy(true)
    try {
      await sendMessage({ body, target: msgTarget, kind: msgKind, sentBy: studentName })
      showToast(msgKind === 'checkin' ? 'Check-in sent' : 'Message sent', 'success')
      setMsgBody(''); setMsgTarget({ groups: [], rosterIds: [] })
    } catch (err) { console.error(err); showToast('Send failed', 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className={styles.screen}>
      <h2 className={styles.title}>Send Message</h2>

      <section className={styles.composer}>
        <div className={styles.kindRow}>
          <button
            className={`${styles.kindChip} ${msgKind === 'info' ? styles.kindInfo : ''}`}
            onClick={() => setMsgKind('info')}
          >Info</button>
          <button
            className={`${styles.kindChip} ${msgKind === 'checkin' ? styles.kindCheckin : ''}`}
            onClick={() => setMsgKind('checkin')}
          >Check-in</button>
        </div>
        {msgKind === 'info' ? (
          <textarea
            className={styles.textarea}
            name="monitor-message"
            rows={3}
            maxLength={300}
            placeholder="Type your message..."
            value={msgBody}
            onChange={e => setMsgBody(e.target.value)}
          />
        ) : (
          <div className={styles.checkinPreview}>
            📍 "Please confirm your current location."
          </div>
        )}
        <TargetPicker value={msgTarget} onChange={setMsgTarget} />
        <button className="btn-primary" onClick={handleSend} disabled={busy}>
          Send {msgKind === 'checkin' ? 'Check-in' : 'Message'}
        </button>
      </section>

      {sentMessages.length > 0 && (
        <details className={styles.log}>
          <summary className={styles.logTitle}>Sent messages ({sentMessages.length})</summary>
          {sentMessages.map(msg => {
            const acks = msg.acks || {}
            const ackCount = Object.keys(acks).length
            const ts = toDate(msg.timestamp)
            return (
              <details key={msg.id} className={styles.msgEntry}>
                <summary className={styles.msgSummary}>
                  <span>{msg.kind === 'checkin' ? '🔴' : '📢'}</span>
                  <span className={styles.msgBody}>{msg.body}</span>
                  <span className={styles.msgAckBadge}>{ackCount} ack{ackCount !== 1 ? 's' : ''}</span>
                  <span className={styles.msgTime}>{ts ? relativeTime(ts) : ''}</span>
                </summary>
                <div className={styles.msgDetail}>
                  <div className={styles.msgMeta}>from {msg.sentBy}</div>
                  {ackCount > 0 ? (
                    <ul className={styles.ackList}>
                      {Object.entries(acks).map(([rid, ackTs]) => (
                        <li key={rid} className={styles.ackItem}>
                          ✓ {nameOf(rid)}
                          <span className={styles.ackTime}>{toDate(ackTs) ? relativeTime(toDate(ackTs)) : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noAcks}>No acknowledgements yet</p>
                  )}
                </div>
              </details>
            )
          })}
        </details>
      )}

      <ToastContainer />
    </div>
  )
}
