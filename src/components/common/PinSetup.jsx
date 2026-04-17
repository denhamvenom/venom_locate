import { useState } from 'react'
import styles from './PinSetup.module.css'

export default function PinSetup({ name, onComplete, onCancel }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits')
      return
    }
    if (pin !== confirm) {
      setError('PINs do not match')
      setConfirm('')
      return
    }
    onComplete(pin)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Set Your PIN</h2>
        <p className={styles.subtitle}>
          Hi <strong>{name}</strong>! Create a 4-digit PIN to secure your account.
        </p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            className={styles.pinInput}
            type="tel"
            name="new-pin"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
            autoFocus
          />
          <input
            className={styles.pinInput}
            type="tel"
            name="confirm-pin"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="Confirm PIN"
            value={confirm}
            onChange={e => { setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={pin.length !== 4 || confirm.length !== 4}>
              Set PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
