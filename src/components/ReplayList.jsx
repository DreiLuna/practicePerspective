// Saved replays, newest first. Selecting one shows it in the player beside the list.
export default function ReplayList({ replays, selectedId, onSelect }) {
  return (
    <section className="replay-list" aria-labelledby="replays-heading">
      <div className="replay-list-head">
        <h1 id="replays-heading" className="page-heading">Replays</h1>
        <span className="hint">On this device</span>
      </div>
      <ul>
        {replays.map((replay) => (
          <li key={replay.id}>
            <button className="replay-item" aria-pressed={replay.id === selectedId} onClick={() => onSelect(replay.id)}>
              <span className="replay-item-time">{formatSavedAt(replay.savedAt)}</span>
              <span className="replay-item-meta">
                {formatDuration(replay.durationMs)}
                {replay.cue && ` · ${replay.cue}`}
                {replay.jumps && ` · ${formatJumps(replay.jumps)}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function formatSavedAt(savedAt) {
  return new Date(savedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(ms) {
  return `${Math.round(ms / 1000)} s`
}

// Summary saved by jump analysis: count, and the highest jump by air time.
function formatJumps(jumps) {
  if (!jumps.length) return 'no jumps found'
  const best = Math.max(...jumps.map((j) => j.heightCm))
  return `${jumps.length} ${jumps.length === 1 ? 'jump' : 'jumps'}, best ${best.toFixed(1)} cm`
}
