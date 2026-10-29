import { useEffect, useRef, useState } from 'react'
import SettingsMenu from './SettingsMenu.jsx'

// Log in (or the signed-in name) and settings buttons, fixed to the top-right corner of the viewport.
export default function AccountBar({ user, onLogin, onSignOut, settings, onChange }) {
  const [openMenu, setOpenMenu] = useState(null) // null | 'account' | 'settings'
  const toggle = (menu) => setOpenMenu((current) => (current === menu ? null : menu))
  const close = () => setOpenMenu(null)

  return (
    <nav className="account-bar" aria-label="Account">
      {user ? (
        <button
          className="pill-button"
          aria-expanded={openMenu === 'account'}
          aria-controls="account-menu"
          onClick={() => toggle('account')}
        >
          {user.name}
        </button>
      ) : (
        <button className="pill-button" onClick={onLogin}>Log in</button>
      )}
      <button
        className="icon-button"
        aria-label="Settings"
        aria-expanded={openMenu === 'settings'}
        aria-controls="settings-menu"
        onClick={() => toggle('settings')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {openMenu === 'settings' && <SettingsMenu settings={settings} onChange={onChange} onClose={close} />}
      {openMenu === 'account' && user && (
        <AccountMenu
          user={user}
          onSignOut={() => {
            close()
            onSignOut()
          }}
          onClose={close}
        />
      )}
    </nav>
  )
}

function AccountMenu({ user, onSignOut, onClose }) {
  const menuRef = useRef(null)

  // Close on a click outside the account bar, or on Escape (same as the settings menu).
  useEffect(() => {
    function onPointerDown(e) {
      if (!menuRef.current?.parentElement.contains(e.target)) onClose()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div id="account-menu" className="settings-menu" ref={menuRef}>
      <p className="menu-hint">Signed in as {user.email}</p>
      <button className="pill-button" onClick={onSignOut}>Sign out</button>
    </div>
  )
}
