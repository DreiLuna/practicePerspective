import { useEffect, useRef, useState } from 'react'
import { AccountError, MIN_PASSWORD_LENGTH } from '../lib/accountStore.js'

// Sign in / create account, in a modal dialog opened by the Log in button.
export default function LoginDialog({ accounts, onSignedIn, onClose }) {
  const dialogRef = useRef(null)
  const [mode, setMode] = useState('signIn') // signIn | create
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const details = {
      email: form.get('email'),
      password: form.get('password'),
      name: form.get('name') ?? undefined,
    }
    setBusy(true)
    setError('')
    try {
      const user = mode === 'create' ? await accounts.createAccount(details) : await accounts.signIn(details)
      onSignedIn(user)
    } catch (err) {
      setError(err instanceof AccountError ? err.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  const creating = mode === 'create'

  return (
    <dialog
      ref={dialogRef}
      className="login-dialog"
      aria-labelledby="login-heading"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <form className="login-form" onSubmit={submit}>
        <h2 id="login-heading" className="login-heading">{creating ? 'Create account' : 'Log in'}</h2>

        {creating && (
          <label className="field">
            Name
            <input name="name" autoComplete="name" />
          </label>
        )}
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" required autoFocus />
        </label>
        <label className="field">
          Password
          <input
            name="password"
            type="password"
            autoComplete={creating ? 'new-password' : 'current-password'}
            minLength={creating ? MIN_PASSWORD_LENGTH : undefined}
            required
          />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="save-button" type="submit" disabled={busy}>
          {busy ? 'One moment…' : creating ? 'Create account' : 'Log in'}
        </button>

        <p className="login-switch">
          {creating ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" className="link-button" onClick={() => switchMode(creating ? 'signIn' : 'create')}>
            {creating ? 'Log in' : 'Create an account'}
          </button>
        </p>
        <p className="menu-hint">Accounts are kept on this device only.</p>

        <button type="button" className="icon-button close-button" aria-label="Close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </form>
    </dialog>
  )
}
