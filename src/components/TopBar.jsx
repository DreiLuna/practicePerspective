import { useState } from 'react'
import { GearIcon } from './icons.jsx'
import SettingsMenu from './SettingsMenu.jsx'

// App name, then the account button and the gear (secret settings), on every tab.
export default function TopBar({ user, onAccount, onLogin, settings, onChange }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="topbar">
      <span className="topbar-title">Practice Perspective</span>
      <div className="topbar-actions">
        {user ? (
          <button className="pill" onClick={onAccount}>{user.name}</button>
        ) : (
          <button className="pill" onClick={onLogin}>Log in</button>
        )}
        <button
          className="icon-btn"
          aria-label="Settings"
          aria-expanded={menuOpen}
          aria-controls="settings-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <GearIcon />
        </button>
        {menuOpen && <SettingsMenu settings={settings} onChange={onChange} onClose={() => setMenuOpen(false)} />}
      </div>
    </header>
  )
}
