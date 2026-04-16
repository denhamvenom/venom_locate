import { useState } from 'react'
import styles from './ConfirmModal.module.css'

/**
 * ConfirmModal — single or double confirmation dialog.
 *
 * Props:
 *   title: string
 *   message: string
 *   confirmLabel: string (default: 'Confirm')
 *   danger: boolean — use red confirm button
 *   requireTyping: string | null — if set, user must type this exact string to enable confirm
 *   onConfirm: fn
 *   onCancel: fn
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  requireTyping = null,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('')
  const canConfirm = requireTyping ? typed === requireTyping : true

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <p className={styles.message}>{message}</p>
        {requireTyping && (
          <div className={styles.typeBox}>
            <p className={styles.typeInstruction}>
              Type <strong>{requireTyping}</strong> to confirm:
            </p>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireTyping}
              autoFocus
            />
          </div>
        )}
        <div className={styles.actions}>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
