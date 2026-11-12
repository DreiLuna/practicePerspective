import { useState } from 'react'
import { CameraIcon, EyeOffIcon, LockIcon, ReplaysIcon } from './icons.jsx'

const KEY = 'pp.welcomeDone'

const STEPS = [
  { title: 'Set up from the side', body: 'Whole body in frame.', Icon: CameraIcon },
  { title: "Move, don't watch", body: 'Pay attention to how it feels.', Icon: EyeOffIcon },
  { title: 'Turn and watch', body: 'Your rep plays back a few seconds later.', Icon: (p) => <ReplaysIcon size={32} {...p} /> },
]

// Whether to show the welcome screen when the app opens: until someone ticks
// "Don't show this again". Storage blocked means it shows every time, which is harmless.
export function shouldShowWelcome() {
  try {
    return localStorage.getItem(KEY) !== '1'
  } catch {
    return true
  }
}

// One-screen welcome for first-time visitors: what the app does, in three steps.
// Also reachable from Account › How it works.
export default function Welcome({ onStart, onLogin }) {
  const [skipNext, setSkipNext] = useState(!shouldShowWelcome())

  function start() {
    try {
      if (skipNext) localStorage.setItem(KEY, '1')
      else localStorage.removeItem(KEY)
    } catch {
      // Ignore: the screen will just show again next time.
    }
    onStart()
  }

  return (
    <div className="welcome">
      <header className="welcome-top">
        <span className="topbar-title">Practice Perspective</span>
        {onLogin && <button className="pill" onClick={onLogin}>Log in</button>}
      </header>

      <main className="welcome-main">
        <div className="welcome-intro">
          <h1 className="welcome-title">Do the rep. Then see it.</h1>
          <p className="welcome-lead">Your camera plays back a few seconds late, so you can focus on the movement first.</p>
        </div>

        <ol className="welcome-steps">
          {STEPS.map(({ title, body, Icon }, i) => (
            <li key={title} className="welcome-step">
              <span className="welcome-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="welcome-step-number">Step {i + 1}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </li>
          ))}
        </ol>

        <div className="welcome-cta">
          <button className="btn btn-lg btn-primary" onClick={start}>Start</button>
          <label className="check-row">
            <input type="checkbox" checked={skipNext} onChange={(e) => setSkipNext(e.target.checked)} />
            Don't show this again
          </label>
        </div>
      </main>

      <footer className="welcome-foot">
        <LockIcon />
        Video stays on this device.
      </footer>
    </div>
  )
}
