import { PoseLandmarker } from '@mediapipe/tasks-vision'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'
import { ALL_FORMATS, BlobSource, CanvasSink, Input } from 'mediabunny'
import { ANALYSIS_VERSION, analyzeJumps } from './jumpAnalysis.js'

// Runs pose estimation over every frame of a saved replay, then finds jumps in it.
// Everything runs on the device: the model and Wasm are bundled with the app, so no
// video or pose data goes over the network.

// Full model: slower than Lite but steadier feet, which matters more than speed here
// because replays are analyzed once, not live.
const MODEL_URL = `${import.meta.env.BASE_URL}models/pose_landmarker_full.task`

// Frames are fed to the model at this width. Its input is 256 px anyway.
const ANALYSIS_WIDTH = 640

async function createLandmarker() {
  // Bundled files, not FilesetResolver.forVisionTasks(cdnUrl), so nothing is fetched from a CDN.
  const fileset = { wasmLoaderPath, wasmBinaryPath }
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
  try {
    return await PoseLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    return PoseLandmarker.createFromOptions(fileset, options('CPU'))
  }
}

// `file` is the replay's video. `onProgress(fraction)` is called as frames are processed.
// Returns { version, width, height, frames: [{ t, landmarks }], jumps, legLengthPx, floorY }.
export async function analyzeReplay(file, { onProgress, signal } = {}) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  const landmarker = await createLandmarker()
  try {
    const track = await input.getPrimaryVideoTrack()
    if (!track) throw new Error('Replay has no video track.')
    const duration = await track.computeDuration()
    const width = Math.min(ANALYSIS_WIDTH, track.displayWidth)
    const height = Math.round((width / track.displayWidth) * track.displayHeight)
    const sink = new CanvasSink(track, { width, height, fit: 'fill', poolSize: 2 })

    const frames = []
    let lastMs = -1
    for await (const { canvas, timestamp } of sink.canvases()) {
      if (signal?.aborted) throw new DOMException('Analysis cancelled', 'AbortError')
      // VIDEO mode needs strictly increasing timestamps.
      const t = Math.max(timestamp * 1000, lastMs + 1)
      lastMs = t
      const result = landmarker.detectForVideo(canvas, t)
      const pose = result.landmarks[0]
      frames.push({
        t,
        landmarks: pose ? pose.map(({ x, y, z, visibility }) => ({ x, y, z, visibility })) : null,
      })
      onProgress?.(duration ? Math.min(1, timestamp / duration) : 0)
    }

    const { jumps, legLengthPx, floorY } = analyzeJumps(frames, { width, height })
    return { version: ANALYSIS_VERSION, width, height, frames, jumps, legLengthPx, floorY }
  } finally {
    landmarker.close()
    input.dispose()
  }
}
