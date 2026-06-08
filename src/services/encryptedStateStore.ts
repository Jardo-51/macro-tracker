/**
 * An oidc-client-ts StateStore that keeps tokens encrypted at rest.
 *
 * Values are encrypted with AES-GCM using a CryptoKey generated with
 * `extractable: false`. The key lives in IndexedDB but can never be read back
 * as raw bytes by JavaScript, and only the ciphertext is persisted. This
 * defends against exfiltration-at-rest (a stolen/shared device, a backup, a
 * storage-scraping browser extension, or a one-shot XSS that dumps storage):
 * an attacker gets ciphertext plus a key they cannot export.
 *
 * It does NOT stop an attacker already running JavaScript in this origin — they
 * can call the same decrypt path. Fully removing the token from JS's reach
 * would require a backend (HttpOnly cookie / BFF).
 */
import Dexie, { type EntityTable } from 'dexie'
import type { StateStore } from 'oidc-client-ts'

interface AuthEntry {
  key: string
  iv: Uint8Array<ArrayBuffer>
  data: ArrayBuffer
}

interface AuthMeta {
  id: string
  cryptoKey: CryptoKey
}

const db = new Dexie('MacroTrackerAuthDB') as Dexie & {
  entries: EntityTable<AuthEntry, 'key'>
  meta: EntityTable<AuthMeta, 'id'>
}

db.version(1).stores({
  entries: 'key',
  meta: 'id',
})

const KEY_ID = 'aesKey'

// Dedupe key creation within a tab. A rare cross-tab first-run race could orphan
// entries encrypted under a discarded key; decrypt then fails and the user is
// simply asked to log in again — no data loss, no security impact.
let keyPromise: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const existing = await db.meta.get(KEY_ID)
      if (existing) return existing.cryptoKey
      // Generated outside any Dexie transaction (awaiting crypto.subtle inside
      // one would commit the transaction early).
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      )
      await db.meta.put({ id: KEY_ID, cryptoKey: key })
      return key
    })()
  }
  return keyPromise
}

export class EncryptedStateStore implements StateStore {
  async set(key: string, value: string): Promise<void> {
    const cryptoKey = await getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      new TextEncoder().encode(value),
    )
    await db.entries.put({ key, iv, data })
  }

  async get(key: string): Promise<string | null> {
    const entry = await db.entries.get(key)
    if (!entry) return null
    const cryptoKey = await getKey()
    try {
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: entry.iv },
        cryptoKey,
        entry.data,
      )
      return new TextDecoder().decode(plain)
    } catch {
      // Corrupt entry or rotated key — treat as absent.
      return null
    }
  }

  async remove(key: string): Promise<string | null> {
    const existing = await this.get(key)
    await db.entries.delete(key)
    return existing
  }

  async getAllKeys(): Promise<string[]> {
    return (await db.entries.toCollection().primaryKeys()) as string[]
  }
}
