import { useState } from 'react'
import styles from './PasswordModal.module.css'

const CORRECT_PASSWORD = 'Frc8044!$@'

/**
 * PasswordModal — shown when accessing protected roles or actions.
 *
 * Props:
 *   title: string — modal heading
 *   onSuccess: fn — called when correct password entered
 *   onCancel: fn — called when dismissed without success
 */
export default function PasswordModal({ title = 'Enter Password', onSuccess, onCancel, password }) {
  const [value, setValue] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (value === (password || CORRECT_PASSWORD)) {
      onSuccess()
    } else {
      setError(true)
      setValue('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Hidden username paired with password — suppresses browser "Save password?" prompt */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={(password || CORRECT_PASSWORD) === '8044admin!@#' ? 'Admin' : 'Lead'}
            readOnly
            tabIndex={-1}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }}
          />
          <div className={styles.inputRow}>
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Password"
              autoFocus
              className={error ? styles.inputError : ''}
            />
            <button
              type="button"
              className={styles.showBtn}
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <p className={styles.error}>Incorrect password</p>}
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
