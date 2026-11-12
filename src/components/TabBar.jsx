import { AccountIcon, ProgressIcon, ReplaysIcon, SessionIcon } from './icons.jsx'

export const TABS = [
  { id: 'session', label: 'Session', Icon: SessionIcon },
  { id: 'replays', label: 'Replays', Icon: ReplaysIcon },
  { id: 'progress', label: 'Progress', Icon: ProgressIcon },
  { id: 'account', label: 'Account', Icon: AccountIcon },
]

// The four tabs along the bottom of the screen.
export default function TabBar({ current, onSelect }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} className="tab" aria-current={current === id ? 'page' : undefined} onClick={() => onSelect(id)}>
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  )
}
