import { useEffect, useRef } from 'react'
import { MAX_GHOST_STRENGTH, MIN_GHOST_STRENGTH } from '../lib/overlay.js'
import { Slider, Switch } from './controls.jsx'

// Menu opened by the gear ("secret settings"). Holds options that stay out of the main
// settings panel.
export default function SettingsMenu({ settings, onChange, onClose }) {
  const menuRef = useRef(null)
  const set = (key) => (value) => onChange({ ...settings, [key]: value })

  // Close on a click outside the top bar's buttons, or on Escape.
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
      <Switch label="Delay" checked={settings.delayEnabled} onChange={set('delayEnabled')} />
      <p className="menu-hint">
        {settings.delayEnabled ? 'Turn off to watch the camera live.' : 'Off: the video is live, with no delay.'}
      </p>

      <Switch label="Save replay" checked={settings.saveReplayEnabled} onChange={set('saveReplayEnabled')} />
      <p className="menu-hint">Adds a Save replay button under the video.</p>

      <Slider
        label="Ghost brightness"
        min={MIN_GHOST_STRENGTH * 100}
        max={MAX_GHOST_STRENGTH * 100}
        step={5}
        value={Math.round(settings.ghostStrength * 100)}
        display={`${Math.round(settings.ghostStrength * 100)}%`}
        onChange={(v) => set('ghostStrength')(v / 100)}
      />
      <p className="menu-hint">How strongly the frame overlay trail shows.</p>
    </div>
  )
}
