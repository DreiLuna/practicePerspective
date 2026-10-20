// Saved replays, stored in a `replays/` folder in the Origin Private File System.
// Each replay is a video file `<id>.<ext>` plus a metadata file `<id>.json`, and once it
// has been analyzed, a pose track `<id>.pose.json`.
// Everything else in the app goes through these functions, so the backing store
// can move to an online database later without touching the UI.

const FOLDER = 'replays'
const POSE_SUFFIX = '.pose.json'

async function folder() {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(FOLDER, { create: true })
}

async function writeFile(dir, name, data) {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(data)
  await writable.close()
}

export function isReplayStoreSupported() {
  return Boolean(navigator.storage?.getDirectory)
}

// Metadata for every saved replay, newest first.
export async function listReplays() {
  if (!isReplayStoreSupported()) return []
  const dir = await folder()
  const replays = []
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== 'file' || !name.endsWith('.json') || name.endsWith(POSE_SUFFIX)) continue
    const file = await handle.getFile()
    replays.push(JSON.parse(await file.text()))
  }
  return replays.sort((a, b) => b.savedAt - a.savedAt)
}

// Stores a video blob. `meta` holds durationMs, delaySeconds, and cue.
export async function saveReplay(blob, meta) {
  const dir = await folder()
  const id = crypto.randomUUID()
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const record = { ...meta, id, fileName: `${id}.${ext}`, savedAt: Date.now() }
  // Ask the browser not to clear saved replays under storage pressure. It may say no.
  navigator.storage.persist?.()
  await writeFile(dir, record.fileName, blob)
  await writeFile(dir, `${id}.json`, JSON.stringify(record))
  return record
}

async function readJson(dir, name) {
  return JSON.parse(await (await (await dir.getFileHandle(name)).getFile()).text())
}

// The replay's video as a File.
export async function loadReplay(id) {
  const dir = await folder()
  const meta = await readJson(dir, `${id}.json`)
  return (await dir.getFileHandle(meta.fileName)).getFile()
}

export async function removeReplay(id) {
  const dir = await folder()
  const meta = await readJson(dir, `${id}.json`)
  await dir.removeEntry(meta.fileName)
  await dir.removeEntry(`${id}.json`)
  await dir.removeEntry(`${id}${POSE_SUFFIX}`).catch(() => {})
}

// Stores a replay's pose analysis, and a short summary of its jumps in the replay's
// metadata so the list can show it without loading the whole pose track.
export async function saveAnalysis(id, analysis) {
  const dir = await folder()
  await writeFile(dir, `${id}${POSE_SUFFIX}`, JSON.stringify(analysis))
  const meta = await readJson(dir, `${id}.json`)
  meta.jumps = analysis.jumps.map(({ flightMs, heightCm, hipRisePercent }) => ({ flightMs, heightCm, hipRisePercent }))
  await writeFile(dir, `${id}.json`, JSON.stringify(meta))
  return meta
}

// The replay's pose analysis, or null if it has not been analyzed.
export async function loadAnalysis(id) {
  const dir = await folder()
  try {
    return await readJson(dir, `${id}${POSE_SUFFIX}`)
  } catch (err) {
    if (err.name === 'NotFoundError') return null
    throw err
  }
}
