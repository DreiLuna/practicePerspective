import { loadReplay } from '../lib/replayStore.js'

// Saved replays at the bottom of the page. Selecting one shows it in the video stage.
export default function ReplayList({ replays, openReplayId, onToggle, onDelete }) {
  return (
    <section className="replay-list" aria-labelledby="replays-heading">
      <h2 id="replays-heading" className="section-heading">Saved replays</h2>
      {replays.length === 0 ? (
        <p className="empty-note">
          No saved replays. Turn on Save replay in the settings menu (gear, top right).
        </p>
      ) : (
        <ul>
          {replays.map((replay) => (
            <li key={replay.id} className="replay-row">
              <button
                className="replay-select"
                aria-pressed={replay.id === openReplayId}
                onClick={() => onToggle(replay.id)}
              >
                <span className="replay-time">{formatSavedAt(replay.savedAt)}</span>
                <span className="replay-meta">
                  {formatDuration(replay.durationMs)}
                  {replay.cue && ` · ${replay.cue}`}
                  {replay.jumps && ` · ${formatJumps(replay.jumps)}`}
                </span>
              </button>
              <button
                className="icon-button"
                aria-label={`Download replay from ${formatSavedAt(replay.savedAt)}`}
                onClick={() => download(replay)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </svg>
              </button>
              <button
                className="icon-button"
                aria-label={`Delete replay from ${formatSavedAt(replay.savedAt)}`}
                onClick={() => onDelete(replay.id)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

async function download(replay) {
  const file = await loadReplay(replay.id)
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatSavedAt(savedAt) {
  return new Date(savedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Summary saved by jump analysis: count, and the highest jump by air time.
function formatJumps(jumps) {
  if (!jumps.length) return 'no jumps found'
  const best = Math.max(...jumps.map((j) => j.heightCm))
  return `${jumps.length} ${jumps.length === 1 ? 'jump' : 'jumps'}, best ${best.toFixed(1)} cm`
}

function formatDuration(ms) {
  return `${Math.round(ms / 1000)}s`
}
