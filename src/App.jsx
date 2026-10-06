import { useCallback, useEffect, useState } from 'react'
import AccountBar from './components/AccountBar.jsx'
import PlaybackView from './components/PlaybackView.jsx'
import ReplayList from './components/ReplayList.jsx'
import ReplayPlayer from './components/ReplayPlayer.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { listReplays, removeReplay } from './lib/replayStore.js'

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

  // TODO: useCamera + useFrameBuffer live here; true once the buffer holds 2 x delay of frames.
  const bufferReady = false

  const refreshReplays = useCallback(() => {
    listReplays().then(setReplays, () => setReplays([]))
  }, [])

  useEffect(refreshReplays, [refreshReplays])

  const openReplay = replays.find((r) => r.id === openReplayId) ?? null

  function toggleReplay(id) {
    setOpenReplayId((current) => (current === id ? null : id))
  }

  async function deleteReplay(id) {
    if (openReplayId === id) setOpenReplayId(null)
    await removeReplay(id)
    refreshReplays()
  }

  function saveReplay() {
    // TODO: copy frames from (now - 2 x delay) to (now - delay) out of the buffer,
    // exportClip() them, saveReplay() to the store, then refreshReplays().
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
            onStart={() => setRunning(true)}
            onStop={() => setRunning(false)}
          />
        )}
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          canSave={running && bufferReady}
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
