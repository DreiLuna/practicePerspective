import { useEffect } from 'react'

// Keep the screen on during a session; no-op if navigator.wakeLock is unsupported.
// The browser drops the lock when the tab is hidden, so it is re-requested on return.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let lock = null
    let released = false

    function request() {
      navigator.wakeLock.request('screen').then(
        (l) => {
          if (released) l.release()
          else lock = l
        },
        () => {}
      )
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') request()
    }

    request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lock?.release()
    }
  }, [active])
}
