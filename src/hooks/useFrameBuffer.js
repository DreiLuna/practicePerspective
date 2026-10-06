import { useEffect, useRef } from 'react'
import { createRingBuffer } from '../lib/ringBuffer.js'

const CAPTURE_FPS = 30
const CAPTURE_WIDTH = 480

// Capture loop: copies frames from the hidden camera <video> into a ring buffer of
// ImageBitmaps at a capped size and rate. The buffer holds 2 x delay seconds (Save
// replay needs the window that was already shown) and is rebuilt when the delay changes.
// Frames never go through React state; callers read them from the returned ref.
export function useFrameBuffer({ videoRef, active, delaySeconds }) {
  const bufferRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!active || !video) return

    const capacity = Math.ceil(2 * delaySeconds * CAPTURE_FPS * 1.1)
    const buffer = createRingBuffer(capacity, (bitmap) => bitmap.close())
    bufferRef.current = buffer

    const useVideoFrameCallback = 'requestVideoFrameCallback' in video
    let stopped = false
    let pending = false
    let lastCapture = 0
    let handle = null

    function schedule() {
      if (stopped) return
      handle = useVideoFrameCallback
        ? video.requestVideoFrameCallback(tick)
        : requestAnimationFrame(tick)
    }

    function tick() {
      const now = performance.now()
      const due = now - lastCapture >= 1000 / CAPTURE_FPS - 4
      if (!pending && due && video.readyState >= 2 && video.videoWidth > 0) {
        pending = true
        lastCapture = now
        // Even dimensions: H.264 (used by Save replay) rejects odd widths and heights.
        const width = Math.min(CAPTURE_WIDTH, video.videoWidth) & ~1
        const height = Math.round((width * video.videoHeight) / video.videoWidth / 2) * 2
        createImageBitmap(video, { resizeWidth: width, resizeHeight: height })
          .then((bitmap) => {
            if (stopped) bitmap.close()
            else buffer.push(bitmap, now)
          })
          .catch(() => {})
          .finally(() => {
            pending = false
          })
      }
      schedule()
    }

    schedule()

    return () => {
      stopped = true
      if (handle !== null) {
        if (useVideoFrameCallback) video.cancelVideoFrameCallback(handle)
        else cancelAnimationFrame(handle)
      }
      buffer.clear()
      if (bufferRef.current === buffer) bufferRef.current = null
    }
  }, [active, delaySeconds, videoRef])

  return bufferRef
}
