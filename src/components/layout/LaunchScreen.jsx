import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import RosterPicker from '../common/RosterPicker'
import styles from './LaunchScreen.module.css'

export default function LaunchScreen() {
  const { setIdentity } = useApp()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className={styles.screen}>
      <img src="/venom-logo.png" alt="Venom" className={styles.logo} />
      <h1 className={styles.title}>Venom Locate</h1>
      <p className={styles.subtitle}>Tell us who you are to get started.</p>
      <button type="button" className={`btn-primary ${styles.cta}`} onClick={() => setPickerOpen(true)}>
        Pick your name
      </button>
      <p className={styles.hint}>Mentors will be asked for the team PIN.</p>
      {pickerOpen && (
        <RosterPicker
          value=""
          onChange={(person) => setIdentity(person)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
