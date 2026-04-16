import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

const updateSW = registerSW({
  onNeedRefresh() {
    window.__updateSW = updateSW
    window.dispatchEvent(new CustomEvent('sw-update-ready'))
  },
  onOfflineReady() {},
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => { registration.update() }, 60 * 1000)
    }
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
