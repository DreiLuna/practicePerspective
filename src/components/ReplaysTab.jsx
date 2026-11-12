import ReplayList from './ReplayList.jsx'
import ReplayPlayer from './ReplayPlayer.jsx'

// Replays tab: the saved replays list, and the selected replay beside it. With nothing
// selected yet, the newest replay is shown.
export default function ReplaysTab({ replays, selectedId, onSelect, onDelete, onAnalyzed }) {
  if (replays.length === 0) {
    return (
      <div className="empty-state">
        <h1 className="page-heading">No saved replays</h1>
        <p>Turn on Save replay in the settings menu (the gear, top right), then press Save replay during a session.</p>
      </div>
    )
  }

  const selected = replays.find((r) => r.id === selectedId) ?? replays[0]

  return (
    <div className="replays-layout">
      <ReplayList replays={replays} selectedId={selected.id} onSelect={onSelect} />
      <ReplayPlayer
        key={selected.id}
        replay={selected}
        onAnalyzed={onAnalyzed}
        onDelete={() => onDelete(selected.id)}
      />
    </div>
  )
}
