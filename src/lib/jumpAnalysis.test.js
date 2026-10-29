import { describe, it, expect } from 'vitest'
import { LM, airborneMask, analyzeJumps, heightFromFlight } from './jumpAnalysis.js'

const SIZE = { width: 1000, height: 1000 } // square, so normalized * 1000 = pixels
const FPS = 30

// A standing athlete in side view, legs 200 px long (hip 400, knee 500, ankle 600, feet 620).
// `lift` raises the whole body, `hipExtra` raises only the hips, `heelLift` raises only heels.
function pose({ lift = 0, hipExtra = 0, heelLift = 0, rightVisibility = 1 } = {}) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }))
  const set = (i, y, v = 1) => (lm[i] = { x: 0.5, y: y / 1000, visibility: v })
  for (const side of ['left', 'right']) {
    const v = side === 'right' ? rightVisibility : 1
    set(LM[`${side}Hip`], 400 - lift - hipExtra, v)
    set(LM[`${side}Knee`], 500 - lift, v)
    set(LM[`${side}Ankle`], 600 - lift, v)
    set(LM[`${side}Heel`], 620 - lift - heelLift, v)
    set(LM[`${side}Toe`], 620 - lift, v)
  }
  return lm
}

// 30 fps frames over `durationMs`; `at(t)` returns pose options for time t.
function clip(durationMs, at) {
  const frames = []
  for (let t = 0; t <= durationMs; t += 1000 / FPS) frames.push({ t, landmarks: pose(at(t)) })
  return frames
}

// Parabolic flight from `start` for `flightMs`, peaking `peakPx` above the floor.
function jumpAt(start, flightMs, peakPx) {
  return (t) => {
    const tau = (t - start) / flightMs
    if (tau <= 0 || tau >= 1) return {}
    const lift = 4 * peakPx * tau * (1 - tau)
    return { lift, hipExtra: 20 }
  }
}

describe('analyzeJumps', () => {
  it('finds one jump and measures its flight time', () => {
    const frames = clip(3000, jumpAt(1000, 500, 60))
    const { jumps } = analyzeJumps(frames, SIZE)
    expect(jumps).toHaveLength(1)
    expect(jumps[0].flightMs).toBeGreaterThan(470)
    expect(jumps[0].flightMs).toBeLessThan(510)
    expect(jumps[0].heightCm).toBeCloseTo(heightFromFlight(jumps[0].flightMs))
  })

  it('reports hip rise as a percentage of leg length', () => {
    const frames = clip(3000, jumpAt(1000, 500, 60))
    const [jump] = analyzeJumps(frames, SIZE).jumps
    // Peak is 60 px body lift + 20 px hip extension, legs are 200 px.
    expect(jump.hipRisePercent).toBeGreaterThan(36)
    expect(jump.hipRisePercent).toBeLessThanOrEqual(40)
    expect(jump.footClearancePercent).toBeGreaterThan(25)
  })

  it('tells a higher jump from a lower one', () => {
    const low = jumpAt(500, 400, 40)
    const high = jumpAt(2000, 600, 90)
    const frames = clip(3500, (t) => (t < 1500 ? low(t) : high(t)))
    const { jumps } = analyzeJumps(frames, SIZE)
    expect(jumps).toHaveLength(2)
    expect(jumps[1].flightMs).toBeGreaterThan(jumps[0].flightMs)
    expect(jumps[1].heightCm).toBeGreaterThan(jumps[0].heightCm)
    expect(jumps[1].hipRisePercent).toBeGreaterThan(jumps[0].hipRisePercent)
  })

  it('does not count a calf raise (heels up, toes down)', () => {
    const frames = clip(3000, (t) => (t > 1000 && t < 1600 ? { heelLift: 40, hipExtra: 30 } : {}))
    expect(analyzeJumps(frames, SIZE).jumps).toHaveLength(0)
  })

  it('ignores a single-frame landmark spike', () => {
    const frames = clip(3000, () => ({}))
    frames[40].landmarks = pose({ lift: 50 })
    expect(analyzeJumps(frames, SIZE).jumps).toHaveLength(0)
  })

  it('still works when the far foot is hidden', () => {
    const jump = jumpAt(1000, 500, 60)
    const frames = clip(3000, (t) => ({ ...jump(t), rightVisibility: 0.1 }))
    expect(analyzeJumps(frames, SIZE).jumps).toHaveLength(1)
  })

  it('skips frames with no pose', () => {
    const frames = clip(3000, jumpAt(1000, 500, 60))
    frames[5].landmarks = null
    frames[80].landmarks = null
    expect(analyzeJumps(frames, SIZE).jumps).toHaveLength(1)
  })

  it('returns no jumps when no pose was found at all', () => {
    const frames = [{ t: 0, landmarks: null }, { t: 33, landmarks: null }]
    expect(analyzeJumps(frames, SIZE).jumps).toEqual([])
  })
})

describe('airborneMask', () => {
  it('marks the frames inside each jump', () => {
    const frames = clip(3000, jumpAt(1000, 500, 60))
    const { jumps } = analyzeJumps(frames, SIZE)
    const mask = airborneMask(frames, jumps)
    expect(mask[Math.round(1.25 * FPS)]).toBe(true)
    expect(mask[Math.round(0.5 * FPS)]).toBe(false)
    expect(mask[Math.round(2 * FPS)]).toBe(false)
  })
})

describe('heightFromFlight', () => {
  it('uses h = g t^2 / 8', () => {
    expect(heightFromFlight(500)).toBeCloseTo(30.66, 1)
  })
})
