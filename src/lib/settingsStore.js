// Settings saved per account in localStorage, so they come back after signing in again.
// Signed-out sessions are not saved. The camera choice stays out: device ids belong to one
// machine, and settings are meant to follow the account.

const PREFIX = 'pp.settings.'
const DEVICE_ONLY = ['deviceId']

export function loadSettings(userId, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFIX + userId)) ?? {}
    return { ...defaults, ...saved, deviceId: defaults.deviceId }
  } catch {
    return defaults
  }
}

export function saveSettings(userId, settings) {
  const kept = { ...settings }
  for (const key of DEVICE_ONLY) delete kept[key]
  try {
    localStorage.setItem(PREFIX + userId, JSON.stringify(kept))
  } catch {
    // Storage full or blocked: settings just won't be remembered.
  }
}
