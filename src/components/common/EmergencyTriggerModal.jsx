import { useState } from 'react'
import styles from './EmergencyTriggerModal.module.css'

export default function EmergencyTriggerModal({ onSubmit, onCancel, busy }) {
  const [type, setType] = useState('')
  const [comment, setComment] = useState('')
  const canSend = type && comment.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSend) return
    onSubmit({ type, comment: comment.trim() })
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🚨 Emergency</h2>
        <p className={styles.subtitle}>This will notify all mentors immediately.</p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.typeRow}>
            <button
              type="button"
              className={`${styles.typeChip} ${type === 'medical' ? styles.typeMedical : ''}`}
              onClick={() => setType('medical')}
            >
              🩺 Medical
            </button>
            <button
              type="button"
              className={`${styles.typeChip} ${type === 'personal' ? styles.typePersonal : ''}`}
              onClick={() => setType('personal')}
            >
              ⚠️ Personal
            </button>
          </div>
          <textarea
            className={styles.comment}
            name="emergency-comment"
            rows={3}
            maxLength={300}
            placeholder="Briefly describe what's wrong..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            autoFocus
          />
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-danger" disabled={!canSend || busy}>
              {busy ? 'Sending...' : 'Send Emergency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
