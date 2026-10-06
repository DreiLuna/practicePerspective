import { describe, it, expect, vi } from 'vitest'
import { createRingBuffer } from './ringBuffer.js'

describe('ringBuffer', () => {
  it('inserts up to capacity', () => {
    const buf = createRingBuffer(3)
    buf.push('a', 0)
    buf.push('b', 10)
    expect(buf.size).toBe(2)
  })

  it('evicts the oldest frame when full', () => {
    const onEvict = vi.fn()
    const buf = createRingBuffer(2, onEvict)
    buf.push('a', 0)
    buf.push('b', 10)
    buf.push('c', 20)
    expect(onEvict).toHaveBeenCalledWith('a')
    expect(buf.size).toBe(2)
    expect(buf.closestTo(0).frame).toBe('b')
  })

  it('looks up the frame closest to a timestamp', () => {
    const buf = createRingBuffer(5)
    for (const t of [0, 33, 66, 100]) buf.push(`f${t}`, t)
    expect(buf.closestTo(40).frame).toBe('f33')
    expect(buf.closestTo(60).frame).toBe('f66')
    expect(buf.closestTo(-50).frame).toBe('f0')
    expect(buf.closestTo(999).frame).toBe('f100')
  })

  it('returns the frames between two timestamps, oldest first', () => {
    const buf = createRingBuffer(4)
    for (const t of [0, 10, 20, 30, 40, 50]) buf.push(`f${t}`, t) // wraps: holds 20..50
    expect(buf.between(15, 40).map((e) => e.frame)).toEqual(['f20', 'f30', 'f40'])
    expect(buf.between(0, 5)).toEqual([])
    expect(buf.between(45, 100).map((e) => e.frame)).toEqual(['f50'])
  })

  it('clear evicts everything', () => {
    const onEvict = vi.fn()
    const buf = createRingBuffer(3, onEvict)
    buf.push('a', 0)
    buf.push('b', 10)
    buf.clear()
    expect(onEvict).toHaveBeenCalledTimes(2)
    expect(buf.size).toBe(0)
    expect(buf.closestTo(5)).toBeNull()
  })
})
