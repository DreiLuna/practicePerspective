// Light / dark theme. 'system' follows the device; 'light' and 'dark' override it by
// setting data-theme on <html>, which tokens.css reads. The choice belongs to the device,
// not an account, so it is stored on its own.

const KEY = 'pp.theme'
export const THEME_MODES = ['system', 'light', 'dark']

export function loadThemeMode() {
  try {
    const saved = localStorage.getItem(KEY)
    return THEME_MODES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemeMode(mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Blocked storage: the choice lasts until reload.
  }
}

export function applyThemeMode(mode) {
  const root = document.documentElement
  if (mode === 'light' || mode === 'dark') root.dataset.theme = mode
  else delete root.dataset.theme
  // Match the browser chrome to the page background.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#111316'
}
