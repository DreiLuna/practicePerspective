import { describe, it, expect, beforeEach } from 'vitest'
import { AccountError, createAccountStore } from './accountStore.js'

// In-memory stand-in for localStorage.
function memoryStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  }
}

describe('accountStore', () => {
  let storage
  let store

  beforeEach(() => {
    storage = memoryStorage()
    store = createAccountStore(storage)
  })

  it('creates an account and signs it in', async () => {
    const user = await store.createAccount({ email: ' Drei@Example.com ', password: 'jumphigh1', name: 'Drei' })
    expect(user).toMatchObject({ email: 'drei@example.com', name: 'Drei' })
    expect(store.currentUser()).toEqual(user)
  })

  it('never stores the password', async () => {
    await store.createAccount({ email: 'a@b.co', password: 'jumphigh1' })
    expect(JSON.stringify(storage.dump())).not.toContain('jumphigh1')
  })

  it('does not hand out the hash or salt', async () => {
    const user = await store.createAccount({ email: 'a@b.co', password: 'jumphigh1' })
    expect(user).not.toHaveProperty('hash')
    expect(user).not.toHaveProperty('salt')
  })

  it('signs in with the right password only', async () => {
    await store.createAccount({ email: 'a@b.co', password: 'jumphigh1' })
    store.signOut()
    expect(store.currentUser()).toBeNull()
    await expect(store.signIn({ email: 'a@b.co', password: 'wrongpass' })).rejects.toThrow(AccountError)
    const user = await store.signIn({ email: 'A@B.CO', password: 'jumphigh1' })
    expect(store.currentUser()).toEqual(user)
  })

  it('gives the same error for an unknown email and a wrong password', async () => {
    await store.createAccount({ email: 'a@b.co', password: 'jumphigh1' })
    const unknown = await store.signIn({ email: 'x@y.co', password: 'jumphigh1' }).catch((e) => e.message)
    const wrong = await store.signIn({ email: 'a@b.co', password: 'nope-nope' }).catch((e) => e.message)
    expect(unknown).toBe(wrong)
  })

  it('rejects a duplicate email, a bad email, and a short password', async () => {
    await store.createAccount({ email: 'a@b.co', password: 'jumphigh1' })
    await expect(store.createAccount({ email: 'a@b.co', password: 'jumphigh2' })).rejects.toThrow(/already exists/)
    await expect(store.createAccount({ email: 'not-an-email', password: 'jumphigh1' })).rejects.toThrow(/valid email/)
    await expect(store.createAccount({ email: 'c@d.co', password: 'short' })).rejects.toThrow(/at least/)
  })

  it('names the account after the email when no name is given', async () => {
    const user = await store.createAccount({ email: 'sam.lifts@slu.edu', password: 'jumphigh1' })
    expect(user.name).toBe('sam.lifts')
  })
})
