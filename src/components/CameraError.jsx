// Clear error states: permission denied, no camera found, camera in use.
export default function CameraError({ error, onRetry }) {
  return (
    <div className="camera-error" role="alert">
      <p>{error}</p>
      {onRetry && <button className="pill-button" onClick={onRetry}>Try again</button>}
    </div>
  )
}
