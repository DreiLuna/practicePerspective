// Fixed-size ring buffer of { frame, timestamp }. Pure data structure, no DOM.
// `onEvict` is called with each frame pushed out (use it to call bitmap.close()).
export function createRingBuffer(capacity, onEvict = () => {}) {
  const items = new Array(capacity)
  let start = 0
  let size = 0

  function at(i) {
    return items[(start + i) % capacity]
  }

  function push(frame, timestamp) {
    if (size === capacity) {
      onEvict(items[start].frame)
      items[start] = { frame, timestamp }
      start = (start + 1) % capacity
    } else {
      items[(start + size) % capacity] = { frame, timestamp }
      size++
    }
  }

  // Entry whose timestamp is closest to `target`. Timestamps increase, so binary search.
  function closestTo(target) {
    if (size === 0) return null
    let lo = 0
    let hi = size - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (at(mid).timestamp < target) lo = mid + 1
      else hi = mid
    }
    if (lo > 0 && target - at(lo - 1).timestamp <= at(lo).timestamp - target) lo--
    return at(lo)
  }

  // Entries with from <= timestamp <= to, oldest first. Used by Save replay.
  function between(from, to) {
    const result = []
    for (let i = 0; i < size; i++) {
      const entry = at(i)
      if (entry.timestamp > to) break
      if (entry.timestamp >= from) result.push(entry)
    }
    return result
  }

  function clear() {
    for (let i = 0; i < size; i++) onEvict(at(i).frame)
    items.fill(undefined)
    start = 0
    size = 0
  }

  return {
    push,
    closestTo,
    between,
    clear,
    capacity,
    get size() {
      return size
    },
  }
}
