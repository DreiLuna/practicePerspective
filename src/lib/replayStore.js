// Saved replays, stored in a `replays/` folder in the Origin Private File System.
// Each replay is a video file `<id>.<ext>` plus a metadata file `<id>.json`.
// Everything else in the app goes through these functions, so the backing store
// can move to an online database later without touching the UI.

const FOLDER = 'replays'

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
    if (handle.kind !== 'file' || !name.endsWith('.json')) continue
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

// The replay's video as a File.
export async function loadReplay(id) {
  const dir = await folder()
  const meta = JSON.parse(await (await (await dir.getFileHandle(`${id}.json`)).getFile()).text())
  return (await dir.getFileHandle(meta.fileName)).getFile()
}

export async function removeReplay(id) {
  const dir = await folder()
  const meta = JSON.parse(await (await (await dir.getFileHandle(`${id}.json`)).getFile()).text())
  await dir.removeEntry(meta.fileName)
  await dir.removeEntry(`${id}.json`)
}
