import { useState } from 'react'
import styles from './PinSetup.module.css'

export default function PinVerify({ name, correctPin, onSuccess, onCancel }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === correctPin) {
      onSuccess()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>
          Enter your PIN, <strong>{name}</strong>.
        </p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            className={styles.pinInput}
            type="tel"
            name="verify-pin"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(false) }}
            autoFocus
          />
          {error && <p className={styles.error}>Incorrect PIN</p>}
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={pin.length !== 4}>
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
