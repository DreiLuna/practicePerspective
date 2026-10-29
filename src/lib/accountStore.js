// Accounts, stored locally in the browser. There is no server: an account only exists on
// the device it was made on. This is enough to demo sign-in and keep each person's replays,
// settings, and jump history apart. Everything else in the app goes through these
// functions, so a real backend (Supabase, Firebase) can replace this module later.
//
// Passwords are never stored: only a PBKDF2 hash with a random salt. That still is not real
// security, since anyone with the device can read browser storage.

const ACCOUNTS_KEY = 'pp.accounts'
const SESSION_KEY = 'pp.session'
const ITERATIONS = 100_000
export const MIN_PASSWORD_LENGTH = 8

export class AccountError extends Error {}

export function createAccountStore(storage = globalThis.localStorage) {
  function readAccounts() {
    try {
      return JSON.parse(storage.getItem(ACCOUNTS_KEY)) ?? {}
    } catch {
      return {}
    }
  }

  function writeAccounts(accounts) {
    storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  }

  // What the app sees of an account: never the hash or salt.
  function publicUser({ id, email, name, createdAt }) {
    return { id, email, name, createdAt }
  }

  return {
    async createAccount({ email, password, name }) {
      email = normalizeEmail(email)
      name = name?.trim() || email.split('@')[0]
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccountError('Enter a valid email address.')
      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        throw new AccountError(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`)
      }
      const accounts = readAccounts()
      if (accounts[email]) throw new AccountError('An account with that email already exists on this device.')

      const salt = crypto.getRandomValues(new Uint8Array(16))
      const account = {
        id: crypto.randomUUID(),
        email,
        name,
        salt: toBase64(salt),
        hash: await hashPassword(password, salt),
        createdAt: Date.now(),
      }
      writeAccounts({ ...accounts, [email]: account })
      storage.setItem(SESSION_KEY, account.id)
      return publicUser(account)
    },

    async signIn({ email, password }) {
      const account = readAccounts()[normalizeEmail(email)]
      // Same message either way, so the form does not reveal which emails have accounts.
      const wrong = new AccountError('Email or password is incorrect.')
      if (!account) throw wrong
      const hash = await hashPassword(password ?? '', fromBase64(account.salt))
      if (hash !== account.hash) throw wrong
      storage.setItem(SESSION_KEY, account.id)
      return publicUser(account)
    },

    signOut() {
      storage.removeItem(SESSION_KEY)
    },

    // The signed-in user, or null.
    currentUser() {
      const id = storage.getItem(SESSION_KEY)
      const account = id && Object.values(readAccounts()).find((a) => a.id === id)
      return account ? publicUser(account) : null
    },
  }
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  return toBase64(new Uint8Array(bits))
}

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
}
