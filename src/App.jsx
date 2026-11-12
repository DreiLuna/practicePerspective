import { useCallback, useEffect, useRef, useState } from 'react'
import AccountTab from './components/AccountTab.jsx'
import LoginDialog from './components/LoginDialog.jsx'
import ProgressTab from './components/ProgressTab.jsx'
import ReplaysTab from './components/ReplaysTab.jsx'
import SessionTab from './components/SessionTab.jsx'
import TabBar, { TABS } from './components/TabBar.jsx'
import TopBar from './components/TopBar.jsx'
import Welcome, { shouldShowWelcome } from './components/Welcome.jsx'
import { useCamera } from './hooks/useCamera.js'
import { useFrameBuffer } from './hooks/useFrameBuffer.js'
import { useWakeLock } from './hooks/useWakeLock.js'
import { canExportClips, copyFrames, exportClip } from './lib/exportClip.js'
import { DEFAULT_GHOST_STRENGTH, DEFAULT_OVERLAY_FPS } from './lib/overlay.js'
import { createAccountStore } from './lib/accountStore.js'
import { listReplays, removeReplay, saveReplay as storeReplay, setReplayOwner } from './lib/replayStore.js'
import { loadSettings, saveSettings } from './lib/settingsStore.js'
import { applyThemeMode, loadThemeMode, saveThemeMode } from './lib/theme.js'

const accounts = createAccountStore(window.localStorage)

const DEFAULT_SETTINGS = {
  delaySeconds: 6,
  delayEnabled: true,
  cue: '',
  overlayEnabled: false,
  overlayFps: DEFAULT_OVERLAY_FPS,
  ghostStrength: DEFAULT_GHOST_STRENGTH,
  saveReplayEnabled: false,
  mirrored: false,
  deviceId: null,
}

// The tab lives in the URL hash so the browser's back button moves between tabs.
function tabFromHash() {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? id : 'session'
}

// Four tabs (Session, Replays, Progress, Account) under one top bar, after a welcome
// screen on the first visit. App owns the session (camera + frame buffer) so it keeps
// running on every tab.
export default function App() {
  // The signed-in account (local only, see lib/accountStore.js). Replays and settings
  // belong to it; signed out, the app uses the shared replays folder.
  const [user, setUser] = useState(() => {
    const current = accounts.currentUser()
    setReplayOwner(current?.id)
    return current
  })
  const [login, setLogin] = useState(null) // null | 'signIn' | 'create'
  const [settings, setSettings] = useState(() => (user ? loadSettings(user.id, DEFAULT_SETTINGS) : DEFAULT_SETTINGS))
  const [themeMode, setThemeMode] = useState(loadThemeMode)
  const [tab, setTab] = useState(tabFromHash)
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome)
  const [running, setRunning] = useState(false)
  const [replays, setReplays] = useState([])
  const [selectedReplayId, setSelectedReplayId] = useState(null)

  // The session: camera -> hidden <video> -> frame buffer. Lives here, not in a tab,
  // so it keeps running while another tab is open.
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

  useEffect(() => {
    applyThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function selectTab(id) {
    window.location.hash = id
    setTab(id)
  }

  function changeThemeMode(mode) {
    setThemeMode(mode)
    saveThemeMode(mode)
  }

  // With the delay off (secret settings) the video is live, and the delay slider only sets
  // how much Save replay keeps. The buffer still holds 2 x slider length either way.
  const clipMs = settings.delaySeconds * 1000
  const delayMs = settings.delayEnabled ? clipMs : 0

  // Save replay needs footage from (delay + clip length) ago, so it turns on once the
  // oldest buffered frame reaches back that far.
  const [bufferReady, setBufferReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | failed

  useEffect(() => {
    setBufferReady(false)
    if (!camera.stream) return
    const id = setInterval(() => {
      const oldest = bufferRef.current?.oldest()
      const needed = performance.now() - delayMs - clipMs + 200
      setBufferReady(Boolean(oldest) && oldest.timestamp <= needed)
    }, 500)
    return () => clearInterval(id)
  }, [camera.stream, delayMs, clipMs, bufferRef])

  const refreshReplays = useCallback(() => {
    listReplays().then(setReplays, () => setReplays([]))
  }, [])

  useEffect(refreshReplays, [refreshReplays])

  useEffect(() => {
    if (user) saveSettings(user.id, settings)
  }, [user, settings])

  // Switches whose replays and settings are shown. The camera session keeps running.
  function switchUser(next) {
    setReplayOwner(next?.id)
    setUser(next)
    // Keep the camera that is in use: switching accounts should not restart it.
    setSettings((current) => ({
      ...(next ? loadSettings(next.id, DEFAULT_SETTINGS) : DEFAULT_SETTINGS),
      deviceId: current.deviceId,
    }))
    setSelectedReplayId(null)
    setLogin(null)
    refreshReplays()
  }

  function signOut() {
    accounts.signOut()
    switchUser(null)
  }

  // Let the "Saved" note fade back to the normal hint after a few seconds.
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const id = setTimeout(() => setSaveStatus('idle'), 4000)
    return () => clearTimeout(id)
  }, [saveStatus])

  async function deleteReplay(id) {
    if (selectedReplayId === id) setSelectedReplayId(null)
    await removeReplay(id)
    refreshReplays()
  }

  // Saves what was on screen for the last `clip` seconds: footage captured between
  // (now - delay - clip) and (now - delay). With the delay off, that is just the last clip.
  async function saveReplay() {
    const buffer = bufferRef.current
    if (!buffer || saveStatus === 'saving') return
    const now = performance.now()
    const entries = buffer.between(now - delayMs - clipMs, now - delayMs)
    if (entries.length < 2) return
    const frames = copyFrames(entries) // same tick as the read, before eviction can close them

    setSaveStatus('saving')
    try {
      const blob = await exportClip(frames, { mirrored: settings.mirrored })
      await storeReplay(blob, {
        durationMs: entries[entries.length - 1].timestamp - entries[0].timestamp,
        delaySeconds: settings.delayEnabled ? settings.delaySeconds : 0,
        cue: settings.cue,
      })
      refreshReplays()
      setSaveStatus('saved')
    } catch (err) {
      console.error('Save replay failed', err)
      setSaveStatus('failed')
    }
  }

  const loginDialog = login && (
    <LoginDialog
      key={login}
      accounts={accounts}
      initialMode={login}
      onSignedIn={switchUser}
      onClose={() => setLogin(null)}
    />
  )

  // The hidden camera <video> is rendered first, in the same place on every screen, so
  // React keeps the same element and the session never loses its stream.
  const cameraSource = <video ref={videoRef} className="camera-source" muted playsInline autoPlay aria-hidden="true" />

  return (
    <>
      {cameraSource}
      {welcomeOpen ? (
        <Welcome
          onStart={() => {
            setWelcomeOpen(false)
            selectTab('session')
          }}
          onLogin={user ? null : () => setLogin('signIn')}
        />
      ) : (
        <div className="app">
          <TopBar
            user={user}
            onAccount={() => selectTab('account')}
            onLogin={() => setLogin('signIn')}
            settings={settings}
            onChange={setSettings}
          />
          <main className="app-main">
            {tab === 'session' && (
              <SessionTab
                settings={settings}
                onChange={setSettings}
                running={running}
                onStart={() => setRunning(true)}
                onStop={() => setRunning(false)}
                bufferRef={bufferRef}
                camera={camera}
                canSave={running && bufferReady && canExportClips()}
                saveStatus={saveStatus}
                onSaveReplay={saveReplay}
              />
            )}
            {tab === 'replays' && (
              <ReplaysTab
                replays={replays}
                selectedId={selectedReplayId}
                onSelect={setSelectedReplayId}
                onDelete={deleteReplay}
                onAnalyzed={refreshReplays}
              />
            )}
            {tab === 'progress' && <ProgressTab replays={replays} />}
            {tab === 'account' && (
              <AccountTab
                user={user}
                onLogin={() => setLogin('signIn')}
                onCreateAccount={() => setLogin('create')}
                onSignOut={signOut}
                themeMode={themeMode}
                onThemeMode={changeThemeMode}
                replays={replays}
                onShowWelcome={() => setWelcomeOpen(true)}
              />
            )}
          </main>
          <TabBar current={tab} onSelect={selectTab} />
        </div>
      )}
      {loginDialog}
    </>
  )
}
