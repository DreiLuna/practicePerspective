import { useCallback, useEffect, useRef, useState } from 'react'
import AccountBar from './components/AccountBar.jsx'
import PlaybackView from './components/PlaybackView.jsx'
import ReplayList from './components/ReplayList.jsx'
import ReplayPlayer from './components/ReplayPlayer.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { useCamera } from './hooks/useCamera.js'
import { useFrameBuffer } from './hooks/useFrameBuffer.js'
import { useWakeLock } from './hooks/useWakeLock.js'
import { canExportClips, copyFrames, exportClip } from './lib/exportClip.js'
import { listReplays, removeReplay, saveReplay as storeReplay } from './lib/replayStore.js'

const DEFAULT_SETTINGS = {
  delaySeconds: 6,
  cue: '',
  overlayEnabled: false,
  saveReplayEnabled: false,
  mirrored: false,
  deviceId: null,
}

// One page: video stage, settings, saved replays. App owns the session (camera + frame
// buffer) so it keeps running while a saved replay is open in the video stage.
export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [running, setRunning] = useState(false)
  const [replays, setReplays] = useState([])
  const [openReplayId, setOpenReplayId] = useState(null)

  // The session: camera -> hidden <video> -> frame buffer. Lives here, not in PlaybackView,
  // so it keeps running while a saved replay is open in the video stage.
  const videoRef = useRef(null)
  const camera = useCamera({ active: running, deviceId: settings.deviceId })
  const bufferRef = useFrameBuffer({
    videoRef,
    active: Boolean(camera.stream),
    delaySeconds: settings.delaySeconds,
  })
  useWakeLock(running)

  useEffect(() => {
    const video = videoRef.current
    video.srcObject = camera.stream
    if (camera.stream) video.play().catch(() => {})
  }, [camera.stream])

  // Save replay needs footage from 2 x delay ago (the window that was just shown), so it
  // turns on once the oldest buffered frame reaches back that far.
  const [bufferReady, setBufferReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | failed

  useEffect(() => {
    setBufferReady(false)
    if (!camera.stream) return
    const id = setInterval(() => {
      const oldest = bufferRef.current?.oldest()
      const needed = performance.now() - 2 * settings.delaySeconds * 1000 + 200
      setBufferReady(Boolean(oldest) && oldest.timestamp <= needed)
    }, 500)
    return () => clearInterval(id)
  }, [camera.stream, settings.delaySeconds, bufferRef])

  const refreshReplays = useCallback(() => {
    listReplays().then(setReplays, () => setReplays([]))
  }, [])

  useEffect(refreshReplays, [refreshReplays])

  // Let the "Saved" note fade back to the normal hint after a few seconds.
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const id = setTimeout(() => setSaveStatus('idle'), 4000)
    return () => clearTimeout(id)
  }, [saveStatus])

  const openReplay = replays.find((r) => r.id === openReplayId) ?? null

  function toggleReplay(id) {
    setOpenReplayId((current) => (current === id ? null : id))
  }

  async function deleteReplay(id) {
    if (openReplayId === id) setOpenReplayId(null)
    await removeReplay(id)
    refreshReplays()
  }

  // Saves what was on screen for the last `delay` seconds: footage captured between
  // (now - 2 x delay) and (now - delay).
  async function saveReplay() {
    const buffer = bufferRef.current
    if (!buffer || saveStatus === 'saving') return
    const delayMs = settings.delaySeconds * 1000
    const now = performance.now()
    const entries = buffer.between(now - 2 * delayMs, now - delayMs)
    if (entries.length < 2) return
    const frames = copyFrames(entries) // same tick as the read, before eviction can close them

    setSaveStatus('saving')
    try {
      const blob = await exportClip(frames, { mirrored: settings.mirrored })
      await storeReplay(blob, {
        durationMs: entries[entries.length - 1].timestamp - entries[0].timestamp,
        delaySeconds: settings.delaySeconds,
        cue: settings.cue,
      })
      refreshReplays()
      setSaveStatus('saved')
    } catch (err) {
      console.error('Save replay failed', err)
      setSaveStatus('failed')
    }
  }

  return (
    <div className="page">
      <AccountBar
        saveReplayEnabled={settings.saveReplayEnabled}
        onSaveReplayChange={(on) => setSettings({ ...settings, saveReplayEnabled: on })}
      />
      <main className="page-main">
        <header className="page-header">
          <h1 className="page-title">Practice Perspective</h1>
          <div className="title-rule"></div>
        </header>
        {openReplay ? (
          <ReplayPlayer replay={openReplay} onClose={() => setOpenReplayId(null)} />
        ) : (
          <PlaybackView
            settings={settings}
            running={running}
            bufferRef={bufferRef}
            camera={camera}
            onStart={() => setRunning(true)}
            onStop={() => setRunning(false)}
          />
        )}
        <video ref={videoRef} className="camera-source" muted playsInline autoPlay aria-hidden="true" />
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          cameras={camera.devices}
          activeDeviceId={camera.activeDeviceId}
          canSave={running && bufferReady && canExportClips()}
          saveStatus={saveStatus}
          onSaveReplay={saveReplay}
        />
        <ReplayList
          replays={replays}
          openReplayId={openReplayId}
          onToggle={toggleReplay}
          onDelete={deleteReplay}
        />
      </main>
    </div>
  )
}
