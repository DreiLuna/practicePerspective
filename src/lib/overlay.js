// Frame overlay ("ghosting"): earlier frames layered under the current delayed frame,
// so a movement shows as a trail. The trail always covers the same stretch of time;
// the frames-per-second setting controls how many frames inside it become ghosts.

export const TRAIL_MS = 1000
export const DEFAULT_OVERLAY_FPS = 5
export const MAX_OVERLAY_FPS = 30 // the capture rate; there are no more frames than this

// Ghost brightness: the share of the picture the ghosts get together (0-1); the current
// frame gets the rest. Set from the gear menu.
export const DEFAULT_GHOST_STRENGTH = 0.4
export const MIN_GHOST_STRENGTH = 0.1
export const MAX_GHOST_STRENGTH = 0.8

// Ghost frames for `current`, oldest first. Skips frames that are missing (start of a
// session), duplicates (camera running slower than the requested rate), and anything
// not strictly older than the current frame.
export function pickGhosts(buffer, current, overlayFps) {
  const spacingMs = 1000 / overlayFps
  const count = Math.floor(TRAIL_MS / spacingMs)
  const ghosts = []
  for (let k = count; k >= 1; k--) {
    const entry = buffer.closestTo(current.timestamp - k * spacingMs)
    if (!entry || entry.timestamp >= current.timestamp) continue
    if (entry === ghosts[ghosts.length - 1]) continue
    ghosts.push(entry)
  }
  return ghosts
}

// Ghosts are averaged with equal weight (layer i drawn at 1 / (i + 1)), so the trail looks
// balanced whether there are 2 ghosts or 30. The current frame then goes on top at
// (1 - ghostStrength), leaving the ghosts that share of the picture.
export function drawOverlay(ctx, current, ghosts, ghostStrength = DEFAULT_GHOST_STRENGTH) {
  ghosts.forEach((ghost, i) => {
    ctx.globalAlpha = 1 / (i + 1)
    ctx.drawImage(ghost.frame, 0, 0)
  })
  ctx.globalAlpha = ghosts.length ? 1 - ghostStrength : 1
  ctx.drawImage(current.frame, 0, 0)
  ctx.globalAlpha = 1
}
