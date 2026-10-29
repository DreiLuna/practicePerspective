// Finds jumps (both feet off the floor) in a saved replay's pose track and measures each
// one two ways:
//   1. Flight time -> height: h = g * t^2 / 8. Needs no calibration.
//   2. Pixel displacement: how far the hips rose above standing height, as a percentage
//      of the athlete's leg length in the video. Unitless, so camera distance cancels out.
// Pure functions, no browser APIs, so it is unit tested.

const G = 9.81

// Saved analyses with another version are ignored, so bump this when the output changes.
export const ANALYSIS_VERSION = 1

// MediaPipe Pose landmark indices.
export const LM = {
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
  leftHeel: 29, rightHeel: 30,
  leftToe: 31, rightToe: 32,
}

export const DEFAULTS = {
  takeoffClearance: 0.04, // lowest foot this far above the floor (x leg length) = airborne
  landingClearance: 0.02, // and back below this = landed (hysteresis between the two)
  minFlightMs: 100,
  maxFlightMs: 1500,
  minVisibility: 0.5, // ignore a foot MediaPipe is unsure about
  floorPercentile: 0.9, // feet are down most of a clip, so a high percentile of foot y is the floor
}

// `frames`: [{ t (ms), landmarks: [{ x, y, visibility }] | null }], landmarks normalized 0..1.
// `size`: { width, height } of the video in pixels.
export function analyzeJumps(frames, size, options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const samples = frames.map((f) => measureFrame(f, size, opts))

  const legLength = median(samples.map((s) => s?.legLength).filter(isNum))
  const floorY = percentile(samples.map((s) => s?.lowestFootY).filter(isNum), opts.floorPercentile)
  if (!isNum(legLength) || !isNum(floorY)) return { jumps: [], legLengthPx: null, floorY: null }

  // Clearance of the lowest foot above the floor, in leg lengths. Median-of-3 removes
  // single-frame landmark spikes without shifting takeoff or landing.
  const clearance = median3(samples.map((s) => (s && isNum(s.lowestFootY) ? (floorY - s.lowestFootY) / legLength : null)))
  const hipY = samples.map((s) => s?.hipY ?? null)

  const jumps = []
  let takeoffIndex = null
  for (let i = 0; i < frames.length; i++) {
    const c = clearance[i]
    if (!isNum(c)) continue
    if (takeoffIndex === null && c > opts.takeoffClearance) {
      takeoffIndex = i
    } else if (takeoffIndex !== null && c < opts.landingClearance) {
      const jump = measureJump(frames, clearance, hipY, takeoffIndex, i, legLength, opts)
      if (jump) jumps.push(jump)
      takeoffIndex = null
    }
  }

  // Standing hip height: hips while grounded, outside every jump.
  const standingHipY = median(
    hipY.filter((y, i) => isNum(y) && isNum(clearance[i]) && clearance[i] < opts.landingClearance)
  )
  for (const jump of jumps) {
    const rise = isNum(standingHipY) && isNum(jump.peakHipY) ? standingHipY - jump.peakHipY : null
    jump.hipRisePx = rise
    jump.hipRisePercent = isNum(rise) ? (rise / legLength) * 100 : null
    delete jump.peakHipY
  }

  return { jumps, legLengthPx: legLength, floorY }
}

// The airborne flag for every frame, for drawing the skeleton in a different color.
export function airborneMask(frames, jumps) {
  return frames.map((f) => jumps.some((j) => f.t >= j.takeoffMs && f.t <= j.landingMs))
}

// Height from flight time, in centimeters.
export function heightFromFlight(flightMs) {
  const t = flightMs / 1000
  return ((G * t * t) / 8) * 100
}

function measureJump(frames, clearance, hipY, takeoffIndex, landingIndex, legLength, opts) {
  // The real crossings happen between frames: interpolate where clearance passed the
  // landing threshold on each side. At 30 fps this roughly halves the timing error.
  const level = opts.landingClearance
  let lastDown = takeoffIndex - 1
  while (lastDown >= 0 && !(isNum(clearance[lastDown]) && clearance[lastDown] <= level)) lastDown--
  const takeoffMs = lastDown < 0
    ? frames[takeoffIndex].t
    : crossing(frames, clearance, lastDown, nextValued(clearance, lastDown, 1), level)
  const landingMs = crossing(frames, clearance, nextValued(clearance, landingIndex, -1), landingIndex, level)
  const flightMs = landingMs - takeoffMs
  if (flightMs < opts.minFlightMs || flightMs > opts.maxFlightMs) return null

  let peakHipY = null
  let peakClearance = 0
  for (let i = takeoffIndex; i < landingIndex; i++) {
    if (isNum(hipY[i]) && (peakHipY === null || hipY[i] < peakHipY)) peakHipY = hipY[i]
    if (isNum(clearance[i])) peakClearance = Math.max(peakClearance, clearance[i])
  }

  return {
    takeoffMs,
    landingMs,
    flightMs,
    heightCm: heightFromFlight(flightMs),
    footClearancePercent: peakClearance * 100,
    peakHipY,
  }
}

// Time at which clearance crossed `level` between frames `a` and `b` (a before b).
function crossing(frames, clearance, a, b, level) {
  if (a < 0 || b < 0 || b >= frames.length) return frames[Math.max(a, b)].t
  const ca = clearance[a]
  const cb = clearance[b]
  if (ca === cb) return frames[b].t
  const f = Math.min(1, Math.max(0, (level - ca) / (cb - ca)))
  return frames[a].t + f * (frames[b].t - frames[a].t)
}

// Index of the nearest frame from `index` in direction `step` that has a clearance value.
function nextValued(clearance, index, step) {
  let i = index + step
  while (i >= 0 && i < clearance.length && !isNum(clearance[i])) i += step
  return i >= 0 && i < clearance.length ? i : -1
}

function measureFrame(frame, { width, height }, opts) {
  const lm = frame.landmarks
  if (!lm) return null
  const px = (i) => ({ x: lm[i].x * width, y: lm[i].y * height, v: lm[i].visibility ?? 1 })

  // Lowest point of each foot (y grows downward). Toe counts, so a calf raise is not a jump.
  const feet = [
    [LM.leftHeel, LM.leftToe],
    [LM.rightHeel, LM.rightToe],
  ]
    .map(([heel, toe]) => {
      const h = px(heel)
      const t = px(toe)
      return { y: Math.max(h.y, t.y), v: Math.min(h.v, t.v) }
    })
    .filter((foot) => foot.v >= opts.minVisibility)

  // In side view the far foot is often hidden; fall back to the visible one.
  const lowestFootY = feet.length ? Math.max(...feet.map((f) => f.y)) : null

  const legs = [
    [LM.leftHip, LM.leftKnee, LM.leftAnkle],
    [LM.rightHip, LM.rightKnee, LM.rightAnkle],
  ].map(([h, k, a]) => dist(px(h), px(k)) + dist(px(k), px(a)))

  return {
    lowestFootY,
    hipY: (px(LM.leftHip).y + px(LM.rightHip).y) / 2,
    legLength: Math.max(...legs),
  }
}

function median3(values) {
  return values.map((v, i) => {
    const window = [values[i - 1], v, values[i + 1]].filter(isNum)
    return isNum(v) ? median(window) : null
  })
}

function median(values) {
  return percentile(values, 0.5)
}

function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}
