import { PRESET_CUES } from '../lib/cues.js'

// Delay slider, cue picker, session toggles, and the Save replay button when enabled.
export default function SettingsPanel({ settings, onChange, canSave, onSaveReplay }) {
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

        <Toggle label="Mirror video" checked={settings.mirrored} onChange={set('mirrored')} />
        <Toggle label="Frame overlay" checked={settings.overlayEnabled} onChange={set('overlayEnabled')} />
      </div>

      {settings.saveReplayEnabled && (
        <div className="save-row">
          <button className="save-button" disabled={!canSave} onClick={onSaveReplay}>
            Save replay
          </button>
          <p className="save-hint">
            {canSave
              ? `Saves the last ${settings.delaySeconds}s you watched.`
              : 'Available once a session has been running for a moment.'}
          </p>
        </div>
      )}
    </section>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
