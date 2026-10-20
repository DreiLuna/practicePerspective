import { useEffect, useRef, useState } from 'react'
import { ANALYSIS_VERSION, airborneMask } from '../lib/jumpAnalysis.js'
import { loadAnalysis, loadReplay, saveAnalysis } from '../lib/replayStore.js'
import { drawSkeleton, frameAt } from '../lib/skeleton.js'
import JumpAnalysis from './JumpAnalysis.jsx'

// A saved replay shown in the video stage in place of the delayed feed, on loop.
// Below it, jump analysis: pose estimation over the whole replay, a skeleton drawn on the
// video, and air time / height / hip rise for each jump.
export default function ReplayPlayer({ replay, onClose, onAnalyzed }) {
  const [file, setFile] = useState(null)
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('idle') // idle | analyzing | failed
  const [progress, setProgress] = useState(0)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [slow, setSlow] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    let url = null
    let cancelled = false
    setFile(null)
    setSrc(null)
    setFailed(false)
    setAnalysis(null)
    setStatus('idle')
    loadReplay(replay.id).then(
      (loaded) => {
        if (cancelled) return
        url = URL.createObjectURL(loaded)
        setFile(loaded)
        setSrc(url)
      },
      () => !cancelled && setFailed(true)
    )
    loadAnalysis(replay.id).then(
      (saved) => !cancelled && saved?.version === ANALYSIS_VERSION && setAnalysis(saved),
      () => {}
    )
    return () => {
      cancelled = true
      abortRef.current?.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [replay.id])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = slow ? 0.25 : 1
  }, [slow, src])

  // Draw the pose for whichever frame the video is showing.
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !analysis || !showSkeleton) return
    canvas.width = analysis.width
    canvas.height = analysis.height
    const ctx = canvas.getContext('2d')
    const mask = airborneMask(analysis.frames, analysis.jumps)
    const useFrameCallback = 'requestVideoFrameCallback' in video
    let handle

    function draw(_now, metadata) {
      const ms = (metadata?.mediaTime ?? video.currentTime) * 1000
      const i = frameAt(analysis.frames, ms)
      drawSkeleton(ctx, analysis.frames[i]?.landmarks, { airborne: mask[i], floorY: analysis.floorY })
      handle = useFrameCallback ? video.requestVideoFrameCallback(draw) : requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (useFrameCallback) video.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [analysis, showSkeleton, src])

  async function analyze() {
    if (!file || status === 'analyzing') return
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('analyzing')
    setProgress(0)
    try {
      // Loaded on demand so the model code stays out of the main page.
      const { analyzeReplay } = await import('../lib/poseAnalysis.js')
      const result = await analyzeReplay(file, { onProgress: setProgress, signal: controller.signal })
      await saveAnalysis(replay.id, result)
      setAnalysis(result)
      setStatus('idle')
      onAnalyzed?.()
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Jump analysis failed', err)
      setStatus('failed')
    }
  }

  function seekTo(ms) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, ms / 1000)
    video.play().catch(() => {})
  }

  return (
    <>
      <section className="video-stage" aria-label="Saved replay">
        {src && <video ref={videoRef} className="replay-video" src={src} autoPlay loop muted playsInline />}
        {analysis && showSkeleton && <canvas ref={canvasRef} className="skeleton-canvas" aria-hidden="true" />}
        {failed && <p className="video-placeholder">This replay could not be loaded.</p>}
        {replay.cue && <p className="video-cue">{replay.cue}</p>}
        <button className="icon-button close-button" aria-label="Close replay" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </section>
      <JumpAnalysis
        analysis={analysis}
        status={status}
        progress={progress}
        canAnalyze={Boolean(file)}
        onAnalyze={analyze}
        showSkeleton={showSkeleton}
        onShowSkeleton={setShowSkeleton}
        slow={slow}
        onSlow={setSlow}
        onSeek={seekTo}
      />
    </>
  )
}
