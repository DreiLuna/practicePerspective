import { useEffect, useRef } from 'react'

// Menu opened by the gear. Holds options that stay out of the main settings panel.
export default function SettingsMenu({ saveReplayEnabled, onSaveReplayChange, onClose }) {
  const menuRef = useRef(null)

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
          checked={saveReplayEnabled}
          onChange={(e) => onSaveReplayChange(e.target.checked)}
        />
      </label>
      <p className="menu-hint">Adds a Save replay button under the video.</p>
    </div>
  )
}
