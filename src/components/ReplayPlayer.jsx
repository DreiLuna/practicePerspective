import { useEffect, useState } from 'react'
import { loadReplay } from '../lib/replayStore.js'

// A saved replay shown in the video stage in place of the delayed feed, on loop.
export default function ReplayPlayer({ replay, onClose }) {
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let url = null
    let cancelled = false
    setSrc(null)
    setFailed(false)
    loadReplay(replay.id).then(
      (file) => {
        if (cancelled) return
        url = URL.createObjectURL(file)
        setSrc(url)
      },
      () => !cancelled && setFailed(true)
    )
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [replay.id])

  return (
    <section className="video-stage" aria-label="Saved replay">
      {src && <video className="replay-video" src={src} autoPlay loop muted playsInline />}
      {failed && <p className="video-placeholder">This replay could not be loaded.</p>}
      {replay.cue && <p className="video-cue">{replay.cue}</p>}
      <button className="icon-button close-button" aria-label="Close replay" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </section>
  )
}
