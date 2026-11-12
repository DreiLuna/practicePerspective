// Stroke icons used across the app. Decorative: callers label the button, not the icon.

function Icon({ size = 24, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const SessionIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3z" />
  </Icon>
)

export const ReplaysIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
    <path d="M12 8v4l3 2" />
  </Icon>
)

export const ProgressIcon = (p) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
)

export const AccountIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Icon>
)

export const GearIcon = (p) => (
  <Icon size={22} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
)

export const PlayIcon = (p) => (
  <svg width={p?.size ?? 34} height={p?.size ?? 34} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
)

export const DownloadIcon = (p) => (
  <Icon size={20} {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
)

export const TrashIcon = (p) => (
  <Icon size={20} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
)

export const CloseIcon = (p) => (
  <Icon size={20} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const ChevronIcon = (p) => (
  <Icon size={20} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
)

export const LockIcon = (p) => (
  <Icon size={16} {...p}>
    <path d="M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5z" />
  </Icon>
)

export const CameraIcon = (p) => (
  <Icon size={32} {...p}>
    <path d="M3 7h3l2-3h8l2 3h3v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  </Icon>
)

export const EyeOffIcon = (p) => (
  <Icon size={32} {...p}>
    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7a11 11 0 0 1-2.2 3.3M6.6 6.6C4.4 8 3 10.4 3 12c0 2 4 7 9 7a9.7 9.7 0 0 0 5.4-1.6" />
  </Icon>
)
