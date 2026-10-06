import {
  BufferTarget,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSource,
  WebMOutputFormat,
  getFirstEncodableVideoCodec,
} from 'mediabunny'

// Encodes buffered frames into a video Blob with WebCodecs (via Mediabunny), which runs
// faster than real time and keeps each frame's real timestamp. MP4 where the browser can
// encode it, otherwise WebM.

export function canExportClips() {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

// Copies ring buffer entries into VideoFrames. This is synchronous on purpose: the frames
// being saved are the oldest in the buffer, so the capture loop will evict (and close)
// them within moments. Call it in the same tick as reading the buffer.
export function copyFrames(entries) {
  return entries.map((entry) => ({
    frame: new VideoFrame(entry.frame, { timestamp: Math.round(entry.timestamp * 1000) }),
    timestamp: entry.timestamp,
  }))
}

// `frames` come from copyFrames() and are closed here once encoded.
// `mirrored` bakes the flip in, so the file looks the way the athlete watched it.
export async function exportClip(frames, { mirrored = false } = {}) {
  try {
    const width = frames[0].frame.displayWidth
    const height = frames[0].frame.displayHeight

    for (const format of [new Mp4OutputFormat(), new WebMOutputFormat()]) {
      const codec = await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), { width, height })
      if (!codec) continue

      const output = new Output({ format, target: new BufferTarget() })
      const source = new VideoSampleSource({
        codec,
        quality: new Quality('high'),
        transform: mirrored ? { flip: true } : undefined,
      })
      output.addVideoTrack(source, { frameRate: 30 })
      await output.start()

      const start = frames[0].timestamp
      for (let i = 0; i < frames.length; i++) {
        const { frame, timestamp } = frames[i]
        const next = frames[i + 1]?.timestamp ?? timestamp + 1000 / 30
        const sample = new VideoSample(frame, {
          timestamp: (timestamp - start) / 1000,
          duration: (next - timestamp) / 1000,
        })
        await source.add(sample)
        sample.close()
      }

      await output.finalize()
      return new Blob([output.target.buffer], { type: format.mimeType })
    }

    throw new Error('This browser cannot encode video.')
  } finally {
    frames.forEach(({ frame }) => frame.close())
  }
}
