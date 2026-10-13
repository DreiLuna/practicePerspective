import { useEffect, useRef, useState } from 'react'
import { drawOverlay, pickGhosts } from '../lib/overlay.js'
import CameraError from './CameraError.jsx'

// A frame counts as "on time" if it is at most this far past the delay target.
// Keeps the screen blank until the buffer really reaches back `delay` seconds.
const FRAME_TOLERANCE_MS = 100

// 16:9 video stage: play button before a session; delayed canvas, cue and delay indicator during one.
export default function PlaybackView({ settings, running, bufferRef, camera, onStart, onStop }) {
  if (!running) {
    return (
      <section className="video-stage" aria-label="Video">
        <div className="video-placeholder">
          <button className="play-button" aria-label="Start delayed video" onClick={onStart}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
          </button>
          <span>Start</span>
        </div>
      </section>
    )
  }

  if (camera.error) {
    return (
      <section className="video-stage" aria-label="Video">
        <CameraError error={camera.error} onRetry={camera.retry} />
        <button className="pill-button stop-button" onClick={onStop}>Stop</button>
      </section>
    )
  }

  if (!camera.stream) {
    return (
      <section className="video-stage" aria-label="Video">
        <p className="video-placeholder">Starting camera…</p>
        <button className="pill-button stop-button" onClick={onStop}>Stop</button>
      </section>
    )
  }

  return (
    <section className="video-stage" aria-label="Video">
      <DelayedCanvas settings={settings} bufferRef={bufferRef} />
      {settings.cue && <p className="video-cue">{settings.cue}</p>}
      <p className="delay-indicator">{settings.delaySeconds}s behind</p>
      <button className="pill-button stop-button" onClick={onStop}>Stop</button>
    </section>
  )
}

function DelayedCanvas({ settings, bufferRef }) {
  const canvasRef = useRef(null)
  const [showing, setShowing] = useState(false)
  const delayMs = settings.delaySeconds * 1000

  // Overlay settings are read through a ref so toggling them doesn't restart the loop
  // (which would blank the screen and show the waiting note again).
  const overlayRef = useRef(null)
  overlayRef.current = settings.overlayEnabled
    ? { fps: settings.overlayFps, strength: settings.ghostStrength }
    : null

  // Render loop: draw the buffered frame closest to (now - delay), plus ghosts if overlay is on.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setShowing(false)
    let drewFirst = false
    let raf

    function draw() {
      const target = performance.now() - delayMs
      const buffer = bufferRef.current
      const entry = buffer?.closestTo(target)
      if (entry && entry.timestamp <= target + FRAME_TOLERANCE_MS) {
        const frame = entry.frame
        if (canvas.width !== frame.width || canvas.height !== frame.height) {
          canvas.width = frame.width
          canvas.height = frame.height
        }
        const overlay = overlayRef.current
        if (overlay) drawOverlay(ctx, entry, pickGhosts(buffer, entry, overlay.fps), overlay.strength)
        else ctx.drawImage(frame, 0, 0)
        if (!drewFirst) {
          drewFirst = true
          setShowing(true)
        }
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [delayMs, bufferRef])

  return (
    <>
      <canvas ref={canvasRef} className={settings.mirrored ? 'delay-canvas mirrored' : 'delay-canvas'} />
      {!showing && (
        <p className="video-placeholder waiting-note">
          Go ahead and move. Your replay appears {settings.delaySeconds}s later.
        </p>
      )}
    </>
  )
}
