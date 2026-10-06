import { useCallback, useEffect, useState } from 'react'

// Small, steady capture size: every frame is kept in the delay buffer.
function constraints(deviceId) {
  return {
    audio: false,
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 30, max: 30 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
    },
  }
}

function describeError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access is blocked. Allow the camera for this site in your browser settings, then try again.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera found. Connect a camera and try again.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera is being used by another app. Close it and try again.'
    default:
      return 'The camera could not start. Try again.'
  }
}

async function listCameras() {
  const all = await navigator.mediaDevices.enumerateDevices()
  return all.filter((d) => d.kind === 'videoinput')
}

function stopAll(stream) {
  stream.getTracks().forEach((t) => t.stop())
}

// Opens the camera while `active`, reopens it when `deviceId` changes, stops every track on cleanup.
export function useCamera({ active, deviceId }) {
  const [stream, setStream] = useState(null)
  const [devices, setDevices] = useState([])
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!active) return
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('The camera needs a secure connection. Open the app over https, or on localhost.')
      return
    }

    let cancelled = false
    let opened = null
    navigator.mediaDevices.getUserMedia(constraints(deviceId)).then(
      async (s) => {
        if (cancelled) return stopAll(s)
        opened = s
        setStream(s)
        // Camera names are only available after permission is granted.
        setDevices(await listCameras())
      },
      (err) => {
        if (!cancelled) setError(describeError(err))
      }
    )

    return () => {
      cancelled = true
      if (opened) stopAll(opened)
      setStream(null)
      setError(null)
    }
  }, [active, deviceId, attempt])

  // Pick up cameras plugged in or removed while the app is open.
  useEffect(() => {
    const md = navigator.mediaDevices
    if (!md?.addEventListener) return
    const onChange = () => listCameras().then(setDevices, () => {})
    md.addEventListener('devicechange', onChange)
    return () => md.removeEventListener('devicechange', onChange)
  }, [])

  const activeDeviceId = stream?.getVideoTracks()[0]?.getSettings().deviceId ?? null
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { stream, devices, activeDeviceId, error, retry }
}
