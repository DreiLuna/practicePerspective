// 16:9 video stage: play button before a session; delayed canvas, cue and delay indicator during one.
export default function PlaybackView({ settings, running, onStart, onStop }) {
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

  return (
    <section className="video-stage" aria-label="Video">
      {/* TODO: hidden <video>, visible <canvas>, render loop */}
      {settings.cue && <p className="video-cue">{settings.cue}</p>}
      <p className="delay-indicator">{settings.delaySeconds}s behind</p>
      <button className="pill-button stop-button" onClick={onStop}>Stop</button>
    </section>
  )
}
