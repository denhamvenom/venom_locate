import React from 'react'

/**
 * ErrorBoundary — catches any render error in child component tree.
 * Uses inline styles so it renders correctly even if CSS imports fail.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          gap: '1rem',
          background: 'var(--color-background, #1A1A1A)',
          color: 'var(--color-text, #F0F0F0)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>&#9888;</div>
          <h2 style={{ color: 'var(--color-warning, #F0A500)', margin: 0, fontSize: '1.3rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-text-secondary, #A0A0A0)', margin: 0, fontSize: '0.95rem' }}>
            Your scouting data is safe. Tap to reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 2.5rem',
              borderRadius: '8px',
              background: 'var(--color-gold, #F0A500)',
              color: '#1A1A1A',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
