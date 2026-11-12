import { PRESET_CUES } from '../lib/cues.js'
import { MAX_OVERLAY_FPS } from '../lib/overlay.js'
import { Slider, Switch } from './controls.jsx'
import PlaybackView from './PlaybackView.jsx'

// Session tab: the delayed video with Start/Stop and Save replay under it, and the
// session settings beside it (below it on narrow screens).
export default function SessionTab({
  settings,
  onChange,
  running,
  onStart,
  onStop,
  bufferRef,
  camera,
  canSave,
  saveStatus,
  onSaveReplay,
}) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value })

  return (
    <div className="session-layout">
      <div className="session-main">
        <PlaybackView settings={settings} running={running} bufferRef={bufferRef} camera={camera} onStart={onStart} />
        <div className="session-actions">
          <button className="btn btn-lg btn-secondary" onClick={running ? onStop : onStart}>
            {running ? 'Stop' : 'Start'}
          </button>
          {settings.saveReplayEnabled && (
            <button
              className="btn btn-lg btn-primary"
              disabled={!canSave || saveStatus === 'saving'}
              onClick={onSaveReplay}
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save replay'}
            </button>
          )}
        </div>
        {settings.saveReplayEnabled && (
          <p className="hint" role="status">
            {saveHint(canSave, saveStatus, settings.delaySeconds)}
          </p>
        )}
      </div>

      <aside className="panel session-aside" aria-labelledby="session-settings-heading">
        <h2 id="session-settings-heading" className="section-label">Session</h2>
        <Slider
          label={settings.delayEnabled ? 'Delay' : 'Replay length'}
          min={3}
          max={15}
          value={settings.delaySeconds}
          display={`${settings.delaySeconds} s`}
          minLabel="3 s"
          maxLabel="15 s"
          onChange={set('delaySeconds')}
        />

        <label className="field">
          Focus cue
          <select value={settings.cue} onChange={(e) => set('cue')(e.target.value)}>
            <option value="">None</option>
            {PRESET_CUES.map((cue) => (
              <option key={cue} value={cue}>{cue}</option>
            ))}
          </select>
        </label>

        {camera.devices.length > 1 && (
          <label className="field">
            Camera
            <select
              value={settings.deviceId ?? camera.activeDeviceId ?? ''}
              onChange={(e) => set('deviceId')(e.target.value)}
            >
              {camera.devices.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <Switch label="Frame overlay" checked={settings.overlayEnabled} onChange={set('overlayEnabled')} />
        {settings.overlayEnabled && (
          <Slider
            label="Ghosts per second"
            min={1}
            max={MAX_OVERLAY_FPS}
            value={settings.overlayFps}
            onChange={set('overlayFps')}
          />
        )}
        <Switch label="Mirror video" checked={settings.mirrored} onChange={set('mirrored')} />
      </aside>
    </div>
  )
}

function saveHint(canSave, saveStatus, delaySeconds) {
  if (saveStatus === 'saved') return 'Saved. Find it in Replays.'
  if (saveStatus === 'failed') return 'That replay could not be saved. Try again.'
  if (canSave) return `Saves the last ${delaySeconds} s you watched.`
  return `Available once ${delaySeconds} s of replay has played.`
}
