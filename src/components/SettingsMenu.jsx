import { useEffect, useRef } from 'react'
import { MAX_GHOST_STRENGTH, MIN_GHOST_STRENGTH } from '../lib/overlay.js'

// Menu opened by the gear. Holds options that stay out of the main settings panel.
export default function SettingsMenu({ settings, onChange, onClose }) {
  const menuRef = useRef(null)
  const set = (key) => (value) => onChange({ ...settings, [key]: value })

  // Close on a click outside the account bar, or on Escape.
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
    <div id="settings-menu" className="settings-menu" ref={menuRef}>
      <label className="toggle">
        Save replay
        <input
          type="checkbox"
          checked={settings.saveReplayEnabled}
          onChange={(e) => set('saveReplayEnabled')(e.target.checked)}
        />
      </label>
      <p className="menu-hint">Adds a Save replay button under the video.</p>

      <label className="field menu-field">
        Ghost brightness
        <span className="field-range">
          <input
            type="range"
            min={MIN_GHOST_STRENGTH * 100}
            max={MAX_GHOST_STRENGTH * 100}
            step="5"
            value={Math.round(settings.ghostStrength * 100)}
            onChange={(e) => set('ghostStrength')(Number(e.target.value) / 100)}
          />
          <output>{Math.round(settings.ghostStrength * 100)}%</output>
        </span>
      </label>
      <p className="menu-hint">How strongly the frame overlay trail shows.</p>
    </div>
  )
}
