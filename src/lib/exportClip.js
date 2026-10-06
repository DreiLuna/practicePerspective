// Encodes a list of { frame, timestamp } entries into a video Blob.
// Plan: WebCodecs VideoEncoder + a muxer (mp4-muxer / webm-muxer); fallback to
// canvas.captureStream() + MediaRecorder where WebCodecs is missing.
// Callers must copy frames out of the ring buffer before calling this, since the
// capture loop evicts (and closes) the oldest frames while encoding runs.
export async function exportClip(entries) {
  // TODO
  throw new Error('exportClip is not implemented yet')
}
