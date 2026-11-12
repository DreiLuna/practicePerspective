# Delay: Project Context

This file gives background for anyone (or any AI coding assistant) working in this repo. Read it before making changes.

## What this is

Delay is a browser app that shows a live camera feed on a short delay so athletes can finish a movement, turn to the screen, and watch what they just did. It is being built as the "attending medium" for ENGL 4010: New Media Writing (Dr. Nathaniel Rivers, Saint Louis University, Fall 2026). The final deliverable is the working app plus a usability report based on testing with real athletes.

The app is not just a video tool. Its purpose is to shape how athletes attend to their own bodies. Every feature decision should be judged against that goal.

## Core idea and design principles

1. **Feel first, then see.** The video is always a few seconds behind, so nothing useful appears on screen during the movement. The athlete stays inside the rep and looks afterward. Do not add any real-time view that encourages watching mid-movement. The one exception is the Delay off switch in the secret settings (below), kept out of sight on purpose.
2. **One thing at a time.** Each session has a single focus cue (for example, "watch the bar path"). Never show multiple cues at once.
3. **A tool that makes itself unnecessary.** The goal is for athletes to need the app less over time. Avoid anything designed to increase engagement or repeat use (streaks, notifications, badges, history feeds). The saved replays list is a deliberate exception: a plain list the athlete chose to build, with no counts, streaks, or prompts to save more.
4. **No judging.** No scoring, form grading, rep counting, or numbers about performance. The athlete should attend to their body, not a metric.
5. **Calm and plain UI.** Large video, minimal text, no clutter. Light and dark themes from one token set (see Interface system); the video area stays dark in both.
6. **Private by default.** Video never leaves the device. No uploads, no analytics, no network calls with camera data. Saved replays are stored on the device only for now (see Saved replays). Moving them to an online database later would need its own explicit, opt-in decision.

## Target users and environment

- SLU club sport athletes and students who lift at the Simon Recreation Center.
- Used in gyms and practice spaces: loud, busy, bright lighting, the device is often several meters away.
- Typical setup: laptop or tablet on a tripod or stand, side view of the athlete, landscape orientation.
- UI elements must be readable and tappable from a distance or with sweaty hands. Use large controls and large text.

## Features

### MVP (required)

The app has four tabs (Session, Replays, Progress, Account) under a top bar, after a one-screen welcome on the first visit. See Interface system for the layout. The top bar holds the app name, a Log in button (the account name once signed in) and the settings gear.

- **Session settings** (beside the video on the Session tab, below it on narrow screens):
  - Delay length slider, 3 to 15 seconds (default 6). Labeled "Replay length" when the delay is off, since it then only sets how much Save replay keeps.
  - Focus cue picker (one cue from a short preset list, plus an optional custom text field).
  - Frame overlay toggle.
- **Delayed playback (video stage)**
  - A play button in the video area, or the Start button under it, starts the session.
  - Chosen cue shown in a small pill along the top.
  - A badge showing how far behind the video is ("6 s behind"), or "Live" with the delay off.
  - The Start button becomes Stop during a session.
- **Camera handling**
  - Request camera with `getUserMedia`.
  - Camera selector if multiple cameras are available (front/back on tablets).
  - Mirror toggle.
  - Clear error states: permission denied, no camera found, camera in use.

### Frame overlay ("ghosting")

- Layers several past frames over the current delayed frame at partial transparency, so a jump, swing, or lift appears as a trail of images.
- Purpose: let the athlete see how they take up space across the whole movement (for example, whether hips move before knees, or whether the bar drifts forward).
- The trail always covers the 1 second before the current delayed frame. An **Overlay frames per second** slider (shown under the toggle when overlay is on; 1 to 30, default 5) sets how many frames inside that second become ghosts: 5 means one ghost every 200 ms. The maximum is 30 because that is the capture rate.
- Blending (`lib/overlay.js`): ghosts are averaged with equal weight, then the current frame is drawn on top. Still parts of the picture stay sharp; only moving parts leave a trail.
- **Ghost brightness** slider in the gear menu (10% to 80%, default 40%): the share of the picture the ghosts get together; the current frame gets the rest. Because the ghosts split that share, each ghost gets fainter as the overlay rate goes up (at 40% and 5 per second, about 8% each). If trails are too faint in the gym, try `globalCompositeOperation` `'lighten'` or `'darken'` for the ghosts before anything else.
- Saved replays are the plain frames, without ghosts. Applying the overlay to saved replays belongs with the "overlay two saved replays" idea, since both need a replay player that draws to a canvas.
- Must stay smooth. If it drops frames on a laptop, lower the overlay rate or resolution before anything else.

### Secret settings (gear menu)

"Secret settings" is the name for the menu opened by the gear in the top-right corner (`SettingsMenu.jsx`). It holds options that stay out of the main settings panel so testers do not stumble on them:

- **Delay** on/off (on by default). Off makes the video stage live: the render loop draws the newest buffered frame, the indicator reads "Live", and the waiting note is skipped. The buffer is not rebuilt, so switching back and forth keeps the footage. With the delay off, Save replay keeps the last slider-length seconds (captured between now − length and now) and records `delaySeconds: 0` in the replay's metadata.
- **Save replay** toggle.
- **Ghost brightness** slider.

### Save replay

Replaces the earlier "hidden replay mode" idea (hiding the replay so the athlete guesses before revealing it), which has been dropped.

- **Turning it on:** the gear menu (top-right) has a "Save replay" toggle, off by default. When it is on, a **Save replay** button appears next to Start/Stop under the video on the Session tab, where it is easy to reach during a session.
- **What gets saved:** the replay the athlete just watched, meaning whatever was on screen during the last `delay` seconds. The athlete does the rep, watches it come up on the delayed feed, then presses Save. Example with a 6 s delay, Save pressed at time C:
  - The buffer holds footage captured from C−12 to C.
  - The screen showed the C−12 to C−6 footage during the last 6 seconds.
  - Save keeps that C−12 to C−6 footage (the rep they just watched), not the C−6 to C footage they have not seen yet.
- So the buffer must hold **2 × delay** seconds of frames (up to 30 s at the 15 s maximum), not 1 × delay.
- The button is disabled when no session is running or the buffer does not yet hold a full clip, including right after the delay changes (that clears the buffer).
- Saved as one video file (MP4 where the browser can make one, otherwise WebM) into the replay store (below). Nothing is uploaded.
- No rep detection to choose the clip. The window is always "what was on screen for the last N seconds."

### Saved replays

- **Where they live:** a designated `replays/` folder in the browser's Origin Private File System (OPFS). OPFS works in Chrome and Safari (including iPad), needs no permission prompt, and survives reloads. It is private to the app, so the folder does not appear in Finder or File Explorer; each replay has a Download action to get a copy out.
- **Swappable storage:** all storage goes through one module (`lib/replayStore.js`: list, save, load, remove) so it can move to an online database later without touching the UI. Each replay is stored as its video file plus a small metadata record (id, saved time, duration, delay used, cue if any).
- **Replays tab:** the list on the left, newest first, the selected replay on the right (stacked on narrow screens). Each row shows when it was saved, its length, the cue if one was set, and a jump summary once analyzed. The newest replay is selected when nothing else is.
- **Watching one:** the selected replay plays on loop, with a toolbar under it: Skeleton and Slow motion toggles, Analyze jumps, Download and Delete.
- The delayed session keeps running in the background on every tab, so going back to Session returns straight to the live delay.
- Each row can be deleted. OPFS shares the site's storage quota, so old replays need a way out.

### Jump analysis (extension, saved replays only)

Added after the MVP was mostly done, on the `replay-jump-analysis` branch. It deliberately goes beyond principle 4 (no numbers) and the old "no pose estimation" scope line, but **only on saved replays**, never on the live delayed feed. The athlete still feels the rep first; measurements are something they choose to look at afterward. This tension is worth discussing in the usability report.

- **Running it:** in the toolbar under a replay, an **Analyze jumps** button decodes the replay (Mediabunny `CanvasSink`) and runs MediaPipe Pose Landmarker (Full model, VIDEO mode, GPU with CPU fallback) on every frame (`lib/poseAnalysis.js`, loaded on demand). The model (`public/models/pose_landmarker_full.task`) and Wasm are bundled, so nothing goes to a CDN.
- **Stored** as `<id>.pose.json` next to the replay (landmarks for every frame plus the jumps), with a short jump summary added to the replay's metadata so the list can show "2 jumps, best 31.0 cm". Deleting a replay deletes its analysis.
- **Jump detection** (`lib/jumpAnalysis.js`, pure and unit tested): the lowest point of each foot (heel or toe, so calf raises don't count) is compared with a floor line (90th percentile of foot height over the clip), in units of leg length so camera distance cancels out. Airborne above 4% of leg length, landed below 2% (hysteresis); median-of-3 smoothing removes single-frame spikes; takeoff and landing are interpolated between frames; flights under 100 ms or over 1.5 s are dropped. A foot with visibility under 0.5 is ignored, so the hidden far foot in side view falls back to the near one.
- **Two measurements per jump:**
  1. **Height from air time:** h = g·t²/8. No calibration. About ±4 cm at 30 fps; landing with bent knees inflates it.
  2. **Pixel displacement:** hip rise (highest hip point vs. median standing hip height) and peak foot clearance, both as a percentage of leg length.
- **Display:** a skeleton over the replay (blue grounded, orange airborne) with a dashed floor line, Skeleton and Slow motion (0.25x) toggles, and a table with each jump's values and the change from the jump before. Tapping a jump seeks to just before takeoff.
- **Still to do:** test on real jumps and check against My Jump 2 or a jump mat; compare jumps across replays; consider 60 fps capture for better air-time precision.

### Accounts (local only)

Log in is a working, **device-local** login: there is no server, so an account exists only in the browser it was made in. It is there to demo the flow in usability testing and to keep each person's data apart, and it is built so a real backend can replace it.

- **Store** (`lib/accountStore.js`, unit tested): `createAccount`, `signIn`, `signOut`, `currentUser`. Accounts live in `localStorage` (`pp.accounts`, keyed by lowercased email) and the session in `pp.session`. Passwords are never stored, only a PBKDF2-SHA-256 hash (100,000 iterations, random 16-byte salt). Minimum password length is 8. Wrong email and wrong password give the same message. This is not real security: anyone with the device can read browser storage.
- **Log in dialog** (`LoginDialog.jsx`): a modal with email and password, switching to Create account (adds an optional name). It opens from the top bar's Log in button or the Account tab. Signed in, the top bar shows the account name, which opens the Account tab; Sign out is there.
- **What an account gets:**
  - **Its own replays:** `replayStore.setReplayOwner(id)` points every replay function at `users/<id>/replays/` in OPFS. Signed out, the shared `replays/` folder is used as before. Replays saved while signed out stay with the guest; they do not move into an account.
  - **Its own settings:** saved to `localStorage` (`pp.settings.<id>`) on every change and restored on sign-in (`lib/settingsStore.js`). The camera choice is not saved, and switching accounts keeps the camera running. Signed-out settings are not saved.
  - **Jump history** (Progress tab, `ProgressTab.jsx`): a bar chart of the last 8 analyzed replays (switch between best height, hip rise and air time) and a table of all of them, newest first, with jump count, best height, best hip rise and average air time, each with the change from the replay before. Built from the jump summary in each replay's metadata. It shows the current replays whether or not someone is signed in.
- **Moving to a real backend later:** swap `accountStore.js` for Supabase or Firebase auth, and `replayStore.js` / `settingsStore.js` for its database and file storage. Uploading video still needs its own explicit, opt-in privacy decision (principle 6).

### Interface system

Built on the `new-ui` branch from a design canvas (tokens, components, and every screen in both themes).

- **Tokens** (`styles/tokens.css`): every color, radius, control height and spacing step is a CSS custom property. Dark and light sets share the same names; components never use raw colors. 48 px minimum touch targets, 52 px controls, 64 px primary buttons, 17 px body text, for a tablet a few meters away.
- **Themes** (`lib/theme.js`): System (default, follows the device), Light or Dark, chosen in Account > Appearance. Stored per device in `localStorage` (`pp.theme`), not per account, and applied as `data-theme` on `<html>`. The browser's theme color follows. The video area and its overlays stay dark in both themes.
- **Type:** Space Grotesk for the app name, page headings and the welcome title; IBM Plex Sans for everything else.
- **Shared controls** (`components/controls.jsx`): `Switch` (a whole-row on/off button with `role="switch"`), `Slider`, `Segmented` and `Delta`. Icons are inline stroke SVGs in `components/icons.jsx`.
- **Layout:** a top bar (app name, account button, gear), the current tab (scrolls on its own), and a bottom tab bar. The tab is in the URL hash (`#session`, `#replays`, `#progress`, `#account`), so the browser's back button works. Designed for an iPad in landscape (1194 x 834, where Session fits without scrolling); under 900 px wide the two-column tabs stack.
- **Tabs:** Session (video, Start/Stop, Save replay, session settings), Replays (list, player, jump analysis), Progress (jump history), Account (profile or Log in / Create account, Appearance, what is stored, How it works).
- **Welcome** (`Welcome.jsx`): one screen on the first visit: "Do the rep. Then see it.", three short steps, Start, and "Don't show this again" (`pp.welcomeDone`). Account > How it works opens it again.
- The hidden camera `<video>` is rendered in the same place on every screen, so switching between the welcome screen and the tabs never drops the camera stream.

### Future ideas

- **Overlay two saved replays** on top of each other (for example, one at partial transparency) to compare two reps. Not planned for the MVP. Keep the replay player able to grow into this: it should draw replays to a canvas rather than relying only on a plain `<video>` element, so a second replay can be layered in later.
- **Online replay storage:** replace the OPFS store behind `lib/replayStore.js` with a database. Needs accounts and its own privacy decision first.

### Out of scope for now

- Sharing, cloud upload, trimming or editing saved clips.
- Pose estimation and skeleton overlays on the live delayed feed (saved replays have jump analysis, above), AI form feedback, scoring, cloud storage.
- Online accounts and syncing between devices (accounts are local only for now, see Accounts).

## Tech stack

- **React** with **Vite** (JavaScript or TypeScript, either is fine, but stay consistent).
- **`navigator.mediaDevices.getUserMedia()`** for camera input.
- **Canvas 2D API** for drawing delayed frames and the overlay.
- **`requestAnimationFrame`** for the render loop.
- **Screen Wake Lock API** (`navigator.wakeLock`) to keep the screen on during sessions, with graceful fallback if unsupported.
- **Fullscreen API** for the playback view.
- Hosting: GitHub Pages or any static host. No backend.

Notes:
- `getUserMedia` only works on HTTPS or `localhost`. Use `vite --host` with HTTPS (for example, `@vitejs/plugin-basic-ssl`) when testing on a tablet over the local network.
- Target browsers: recent Chrome and Safari (including iPad Safari). Test on both.

## Architecture

```
Camera (MediaStream)
   -> hidden <video> element
   -> capture loop: draw frame to an offscreen canvas at capped resolution
   -> ring buffer of frames, each with a timestamp
   -> render loop: find frame closest to (now - delay)
   -> draw it to the visible canvas
   -> if overlay is on: also draw N earlier frames with reduced globalAlpha

Save replay (on demand)
   -> take the frames shown during the last `delay` seconds:
      timestamps from (now - 2 x delay) to (now - delay)
   -> encode them into a video file
   -> write it to the replay store (OPFS replays/ folder)

Saved replay (selected from the list)
   -> load the file from the replay store
   -> play it in the video stage on loop, X returns to the delayed feed
```

### Saving a replay

- Encode from the ring buffer, not from a second recording of the camera. A continuous `MediaRecorder` on the camera cannot be cut cleanly at an arbitrary "N seconds ago" point.
- Implemented with WebCodecs through the Mediabunny library (`lib/exportClip.js`). This encodes faster than real time and uses the real frame timestamps. The browser needs WebCodecs; without it the Save replay button stays disabled.
- Fallback where WebCodecs is missing: draw the frames in order to an offscreen canvas, record it with `canvas.captureStream()` and `MediaRecorder`. This takes as long as the clip itself.
- **Eviction must not race the export.** The capture loop keeps closing old bitmaps while an export runs. The frames being saved are the oldest in the buffer, so they are the next to be evicted. Copy them (for example, into `VideoFrame`s) at the moment Save is pressed, before encoding starts.
- If frames are stored compressed (frame buffer option 3), decode them during export.
- Saving must not stall the live delayed playback.

### Frame buffer

- Store frames in a fixed-size ring buffer with timestamps. Size = 2 x delay x capture fps, plus a small margin. The 2x is for Save replay, which needs the window that was already shown. Size it to the current delay, not the maximum, and rebuild it when the delay changes.
- Use timestamps (`performance.now()`) to choose which frame to show. Do not assume a steady frame rate.
- **Memory is the main risk.** Rough math: a 640x360 RGBA frame is about 0.9 MB. At the 15 s maximum delay, 2 x 15 s at 30 fps is 900 frames, about 830 MB. That is far too much for tablets, so expect to need option 3 (compressed frames). At the default 6 s it is 360 frames, about 330 MB. Options, in order of preference to try:
  1. Cap capture resolution (for example, 480x270 or 640x360) and capture fps (for example, 24 to 30).
  2. Store frames as `ImageBitmap` and always call `.close()` when evicting a frame.
  3. If memory is still too high, store compressed frames (JPEG blobs via `OffscreenCanvas.convertToBlob` or WebCodecs `VideoEncoder`) and decode before drawing.
- Measure memory and frame timing early (Chrome DevTools Performance and Memory tabs) before building extra features on top.
- Clear the entire buffer when the session ends or the delay setting changes.

### Suggested file structure

```
src/
  App.jsx                 # owns settings, the session, the account, the current tab and the welcome screen
  components/
    TopBar.jsx            # app name, Log in / account name, settings gear
    TabBar.jsx            # Session, Replays, Progress, Account
    SettingsMenu.jsx      # "secret settings", opened by the gear: delay on/off, Save replay toggle, ghost brightness
    SessionTab.jsx        # video stage, Start/Stop and Save replay, session settings
    PlaybackView.jsx      # 16:9 video stage: start button, then canvas, cue, delay badge
    ReplaysTab.jsx        # replay list beside the selected replay
    ReplayList.jsx        # saved replays, newest first
    ReplayPlayer.jsx      # a saved replay on loop: skeleton overlay, toolbar
    JumpAnalysis.jsx      # per-jump table under a replay
    ProgressTab.jsx       # jump history chart and table
    AccountTab.jsx        # profile, appearance, data, How it works
    LoginDialog.jsx       # Log in / Create account modal
    Welcome.jsx           # first-visit welcome screen
    controls.jsx          # Switch, Slider, Segmented, Delta
    icons.jsx             # stroke icons
    CameraError.jsx
  hooks/
    useCamera.js          # getUserMedia, device list, cleanup
    useFrameBuffer.js     # ring buffer, capture loop, eviction
    useWakeLock.js
  lib/
    ringBuffer.js         # pure data structure, unit tested
    overlay.js            # draws ghost frames onto a canvas context
    exportClip.js         # encodes buffered frames into a video file
    replayStore.js        # saved replays: list, save, load, remove (OPFS now, online later), per account
    accountStore.js       # local accounts: create, sign in/out, current user (unit tested)
    settingsStore.js      # settings saved per account
    cues.js               # preset focus cue list
    jumpAnalysis.js       # finds jumps in a pose track; air time, height, hip rise (unit tested)
    poseAnalysis.js       # decodes a replay and runs MediaPipe Pose on every frame
    skeleton.js           # draws a pose over a replay
    theme.js              # System / Light / Dark theme
  styles/
    tokens.css            # design tokens, light and dark
    global.css            # component and layout styles
```

Keep the buffer, overlay, and export logic in plain JS modules outside React so they are easy to test and do not re-render on every frame. React state should only hold settings and UI state, never frames.

The camera and frame buffer belong to the session, which `App` owns, not `PlaybackView`. The video stage draws from the buffer and the Save replay button saves from it, and the session must keep running while a saved replay is open.

## Focus cues

Write cues as external focus (the effect of the movement) when possible, based on Wulf's attentional focus research. Examples:

- "Watch the bar path"
- "Watch how high you get off the ground"
- "Watch where the ball leaves your hand"
- "Watch your depth"
- "Watch your balance at the finish"

Avoid stacking body-part cues like "knees out, chest up, hips back."

## Coding conventions

- Clean up everything on unmount: stop camera tracks, cancel animation frames, release wake lock, close bitmaps.
- No network requests involving camera data, ever.
- No `localStorage` for video. Settings only (delay, cue, overlay, Save replay toggle) may be saved locally if useful. Saved replays go through `lib/replayStore.js` only.
- Keep components small and readable. Prefer clear names over clever code.
- Write unit tests for `ringBuffer.js` (insert, evict, lookup by timestamp, and reading the frames between two timestamps for Save replay).

## Milestones

| Dates | Goal |
|---|---|
| Week of 10/10 | Research, interface sketches, camera access working |
| Week of 10/17 | Full prototype: settings panel, delay buffer, playback view |
| Week of 10/27 | Focus cues, overlay, save replay |
| Week of 11/3 | Self-test in a real gym, fix performance, deploy |
| Week of 11/10 | Usability testing with 3 to 5 SLU athletes |
| Week of 11/17 | Usability report and final revisions |
| 12/1 | Final app and report due |

## Usability testing notes

The usability report needs observations, so plan for them in the build:

- Watch for: how long setup takes, whether users understand the delay without explanation, whether they read the cue, whether overlay helps or confuses, whether anyone turns on Save replay in the gear menu, and whether saved replays get rewatched or just pile up.
- Keep a simple "about" or help screen short enough to skip.
- Do not add in-app analytics. Observation and short interviews are the method.

## References

- Salmoni, Schmidt, and Walter (1984), "Knowledge of Results and Motor Learning," *Psychological Bulletin*. (guidance hypothesis; background for principle 3)
- Wulf (2013), "Attentional Focus and Motor Learning: A Review of 15 Years," *International Review of Sport and Exercise Psychology*. (external focus cues)
- Wulf and Lewthwaite (2016), OPTIMAL theory, *Psychonomic Bulletin & Review*. (learner control over settings)
- Nielsen, "Usability 101," Nielsen Norman Group. (usability framework)
- MDN Web Docs: `getUserMedia`, Canvas API, Screen Wake Lock API, WebCodecs `VideoEncoder`, `MediaRecorder`, Origin Private File System (`navigator.storage.getDirectory`).
