import { describe, it, expect } from 'vitest'
import { createRingBuffer } from './ringBuffer.js'
import { pickGhosts } from './overlay.js'

// Frames every `stepMs` from 0 to `untilMs`.
function bufferOf(stepMs, untilMs) {
  const buf = createRingBuffer(1000)
  for (let t = 0; t <= untilMs; t += stepMs) buf.push(`f${t}`, t)
  return buf
}

describe('pickGhosts', () => {
  it('picks evenly spaced frames across the trail, oldest first', () => {
    const buf = bufferOf(10, 3000)
    const current = buf.closestTo(3000)
    const ghosts = pickGhosts(buf, current, 5) // 5 per second -> every 200 ms over 1 s
    expect(ghosts.map((g) => g.timestamp)).toEqual([2000, 2200, 2400, 2600, 2800])
  })

  it('uses more ghosts at a higher rate', () => {
    const buf = bufferOf(10, 3000)
    const current = buf.closestTo(3000)
    expect(pickGhosts(buf, current, 10)).toHaveLength(10)
    expect(pickGhosts(buf, current, 1).map((g) => g.timestamp)).toEqual([2000])
  })

  it('skips ghosts the buffer does not reach back to yet', () => {
    const buf = createRingBuffer(100)
    for (let t = 500; t <= 1000; t += 10) buf.push(`f${t}`, t)
    const current = buf.closestTo(1000)
    const ghosts = pickGhosts(buf, current, 5)
    // 0 ms and 200 ms are not buffered; closestTo returns the 500 ms frame once, not twice.
    expect(ghosts.map((g) => g.timestamp)).toEqual([500, 600, 800])
  })

  it('drops duplicates when frames are sparser than the overlay rate', () => {
    const buf = bufferOf(100, 3000) // camera at 10 fps
    const current = buf.closestTo(3000)
    const ghosts = pickGhosts(buf, current, 30)
    const stamps = ghosts.map((g) => g.timestamp)
    expect(new Set(stamps).size).toBe(stamps.length)
    expect(stamps.every((t) => t < 3000)).toBe(true)
    expect(stamps).toHaveLength(10)
  })
})
