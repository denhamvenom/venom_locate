import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getPin, setPin as savePin } from '../../lib/pins'
import RosterPicker from '../common/RosterPicker'
import PasswordModal from '../common/PasswordModal'
import PinSetup from '../common/PinSetup'
import PinVerify from '../common/PinVerify'
import styles from './LaunchScreen.module.css'

const MENTOR_PIN = import.meta.env.VITE_MENTOR_PIN

export default function LaunchScreen() {
  const { setIdentity } = useApp()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [step, setStep] = useState(null)
  const [existingPin, setExistingPin] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handlePersonSelected(person) {
    setSelectedPerson(person)
    setPickerOpen(false)
    setLoading(true)
    try {
      const pin = await getPin(person.id)
      if (pin) {
        setExistingPin(pin)
        setStep('pinVerify')
      } else if (person.role === 'mentor') {
        setStep('mentorPin')
      } else {
        setStep('pinSetup')
      }
    } catch (err) {
      console.error('Failed to check PIN:', err)
      setStep(person.role === 'mentor' ? 'mentorPin' : 'pinSetup')
    } finally {
      setLoading(false)
    }
  }

  async function handlePinCreated(pin) {
    try {
      await savePin(selectedPerson.id, pin)
      setIdentity(selectedPerson)
    } catch (err) {
      console.error('Failed to save PIN:', err)
    }
  }

  function handleCancel() {
    setSelectedPerson(null)
    setStep(null)
    setExistingPin(null)
  }

  return (
    <div className={styles.screen}>
      <img src="/venom-logo.png" alt="Venom" className={styles.logo} />
      <h1 className={styles.title}>Venom Locate</h1>
      <p className={styles.subtitle}>Tell us who you are to get started.</p>
      <button
        type="button"
        className={`btn-primary ${styles.cta}`}
        onClick={() => setPickerOpen(true)}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Pick your name'}
      </button>
      <p className={styles.hint}>You'll set a 4-digit PIN on first login.</p>

      {pickerOpen && (
        <RosterPicker
          value=""
          onChange={handlePersonSelected}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {step === 'mentorPin' && selectedPerson && (
        <PasswordModal
          title={`Team mentor PIN for ${selectedPerson.display}`}
          password={MENTOR_PIN}
          onSuccess={() => setStep('pinSetup')}
          onCancel={handleCancel}
        />
      )}

      {step === 'pinSetup' && selectedPerson && (
        <PinSetup
          name={selectedPerson.display}
          onComplete={handlePinCreated}
          onCancel={handleCancel}
        />
      )}

      {step === 'pinVerify' && selectedPerson && existingPin && (
        <PinVerify
          name={selectedPerson.display}
          correctPin={existingPin}
          onSuccess={() => setIdentity(selectedPerson)}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
