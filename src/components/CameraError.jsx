// Clear error states: permission denied, no camera found, camera in use.
export default function CameraError({ error, onRetry }) {
  return (
    <div className="camera-error">
      <p>{error}</p>
      {onRetry && <button className="big-button" onClick={onRetry}>Try again</button>}
    </div>
  )
}
