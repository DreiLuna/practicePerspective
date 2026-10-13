import { PRESET_CUES } from '../lib/cues.js'
import { MAX_OVERLAY_FPS } from '../lib/overlay.js'

// Delay slider, cue picker, camera picker, session toggles, and the Save replay button when enabled.
export default function SettingsPanel({ settings, onChange, cameras, activeDeviceId, canSave, saveStatus, onSaveReplay }) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value })

  return (
    <section className="settings-panel" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="section-heading">Settings</h2>
      <div className="settings-grid">
        <label className="field">
          Delay
          <span className="field-range">
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={settings.delaySeconds}
              onChange={(e) => set('delaySeconds')(Number(e.target.value))}
            />
            <output>{settings.delaySeconds}s</output>
          </span>
        </label>

        <label className="field">
          Focus cue
          <select value={settings.cue} onChange={(e) => set('cue')(e.target.value)}>
            <option value="">None</option>
            {PRESET_CUES.map((cue) => (
              <option key={cue} value={cue}>{cue}</option>
            ))}
          </select>
        </label>

        {cameras.length > 1 && (
          <label className="field">
            Camera
            <select
              value={settings.deviceId ?? activeDeviceId ?? ''}
              onChange={(e) => set('deviceId')(e.target.value)}
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <Toggle label="Mirror video" checked={settings.mirrored} onChange={set('mirrored')} />
        <Toggle label="Frame overlay" checked={settings.overlayEnabled} onChange={set('overlayEnabled')} />

        {settings.overlayEnabled && (
          <label className="field">
            Overlay frames per second
            <span className="field-range">
              <input
                type="range"
                min="1"
                max={MAX_OVERLAY_FPS}
                step="1"
                value={settings.overlayFps}
                onChange={(e) => set('overlayFps')(Number(e.target.value))}
              />
              <output>{settings.overlayFps}</output>
            </span>
          </label>
        )}
      </div>

      {settings.saveReplayEnabled && (
        <div className="save-row">
          <button
            className="save-button"
            disabled={!canSave || saveStatus === 'saving'}
            onClick={onSaveReplay}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save replay'}
          </button>
          <p className="save-hint" role="status">
            {saveHint(canSave, saveStatus, settings.delaySeconds)}
          </p>
        </div>
      )}
    </section>
  )
}

function saveHint(canSave, saveStatus, delaySeconds) {
  if (saveStatus === 'saved') return 'Saved. It is in your saved replays below.'
  if (saveStatus === 'failed') return 'That replay could not be saved. Try again.'
  if (canSave) return `Saves the last ${delaySeconds}s you watched.`
  return `Available once ${delaySeconds}s of replay has played.`
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
