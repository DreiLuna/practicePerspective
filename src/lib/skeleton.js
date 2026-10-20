import { LM } from './jumpAnalysis.js'

// Draws a pose skeleton over a saved replay. Kept separate from MediaPipe so the replay
// player can draw saved analyses without loading the model.

// Body connections (MediaPipe Pose indices), face left out.
const CONNECTIONS = [
  [11, 12], [11, 23], [12, 24], [23, 24], // torso
  [11, 13], [13, 15], [12, 14], [14, 16], // arms
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
  [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32], // feet
]
const FEET = [LM.leftHeel, LM.leftToe, LM.rightHeel, LM.rightToe]

const GROUNDED = '#5b9bff'
const AIRBORNE = '#ffb347'

// The pose-track frame closest to `ms`. Frames are sorted by time.
export function frameAt(frames, ms) {
  let lo = 0
  let hi = frames.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (frames[mid].t < ms) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(frames[lo - 1].t - ms) < Math.abs(frames[lo].t - ms)) return lo - 1
  return lo
}

// `ctx` is sized to the analysis (width x height). `floorY` is in the same pixels.
export function drawSkeleton(ctx, landmarks, { airborne = false, floorY = null } = {}) {
  const { width, height } = ctx.canvas
  ctx.clearRect(0, 0, width, height)

  const scale = width / 640
  if (floorY !== null) {
    ctx.strokeStyle = 'rgb(255 255 255 / 0.35)'
    ctx.lineWidth = 1.5 * scale
    ctx.setLineDash([8 * scale, 8 * scale])
    ctx.beginPath()
    ctx.moveTo(0, floorY)
    ctx.lineTo(width, floorY)
    ctx.stroke()
    ctx.setLineDash([])
  }
  if (!landmarks) return

  const color = airborne ? AIRBORNE : GROUNDED
  const at = (i) => [landmarks[i].x * width, landmarks[i].y * height]
  const seen = (i) => (landmarks[i].visibility ?? 1) >= 0.5

  ctx.lineCap = 'round'
  ctx.lineWidth = 3 * scale
  for (const [a, b] of CONNECTIONS) {
    ctx.strokeStyle = color
    ctx.globalAlpha = seen(a) && seen(b) ? 0.9 : 0.3
    ctx.beginPath()
    ctx.moveTo(...at(a))
    ctx.lineTo(...at(b))
    ctx.stroke()
  }
  for (const i of FEET) {
    ctx.fillStyle = color
    ctx.globalAlpha = seen(i) ? 1 : 0.3
    ctx.beginPath()
    ctx.arc(...at(i), 4 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
