import { ChevronIcon } from './icons.jsx'
import { Segmented } from './controls.jsx'

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const THEME_HINTS = {
  system: 'Follows your device setting.',
  light: 'Always light. Easier to read in bright gyms.',
  dark: 'Always dark. Keeps the video the brightest thing on screen.',
}

// Account tab: who is signed in (or a way to log in), appearance, what is stored, and
// the way back to the welcome screen.
export default function AccountTab({ user, onLogin, onCreateAccount, onSignOut, themeMode, onThemeMode, replays, onShowWelcome }) {
  const analyzed = replays.filter((r) => r.jumps).length

  return (
    <div className="account-page">
      <h1 className="page-heading">Account</h1>
      <div className="account-grid">
        <section className="panel" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="section-label">Profile</h2>
          {user ? (
            <>
              <div className="profile">
                <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <p className="profile-name">{user.name}</p>
                  <p className="hint">{user.email}</p>
                </div>
              </div>
              <div className="button-row">
                <button className="btn btn-danger" onClick={onSignOut}>Sign out</button>
              </div>
            </>
          ) : (
            <>
              <p className="hint">
                You are not logged in. An account keeps your replays and settings separate from anyone else using
                this device. You don't need one to start.
              </p>
              <div className="button-row">
                <button className="btn btn-primary" onClick={onLogin}>Log in</button>
                <button className="btn btn-secondary" onClick={onCreateAccount}>Create account</button>
              </div>
            </>
          )}
        </section>

        <div className="account-column">
          <section className="panel" aria-labelledby="appearance-heading">
            <h2 id="appearance-heading" className="section-label">Appearance</h2>
            <div>
              <Segmented label="Theme" options={THEME_OPTIONS} value={themeMode} onChange={onThemeMode} />
            </div>
            <p className="hint">{THEME_HINTS[themeMode]}</p>
          </section>

          <section className="panel" aria-labelledby="data-heading">
            <h2 id="data-heading" className="section-label">Your data</h2>
            <p className="stat-row">
              <span>Saved replays</span>
              <strong>{replays.length}</strong>
            </p>
            <p className="stat-row">
              <span>Analyzed replays</span>
              <strong>{analyzed}</strong>
            </p>
            <p className="hint">
              {user ? 'Your account, replays and settings' : 'Replays'} are kept on this device only. Nothing is
              uploaded.
            </p>
          </section>

          <button className="link-row" onClick={onShowWelcome}>
            How it works
            <ChevronIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
