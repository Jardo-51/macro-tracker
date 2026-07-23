import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDailyLogStore } from '@/stores/dailyLog'
import type { DailyLogEntry } from '@/types'

// Real IndexedDB structured-clones every value it stores and rejects Vue
// reactive proxies with DataCloneError. The mock mirrors that so tests catch
// proxies leaking into db writes (the delete-undo restore bug).
const storedEntries: DailyLogEntry[] = []

vi.mock('@/db', () => ({
  db: {
    dailyLogEntries: {
      add: vi.fn(async (entry: DailyLogEntry) => {
        storedEntries.push(structuredClone(entry))
      }),
      delete: vi.fn(async (id: string) => {
        const idx = storedEntries.findIndex(e => e.id === id)
        if (idx !== -1) storedEntries.splice(idx, 1)
      }),
      where: () => ({
        equals: (date: string) => ({
          toArray: async () => structuredClone(storedEntries.filter(e => e.date === date)),
        }),
      }),
    },
  },
}))

vi.mock('@/db/seed', () => ({
  seedDefaults: vi.fn(async () => {}),
}))

function makeEntry(store: ReturnType<typeof useDailyLogStore>): DailyLogEntry {
  return {
    id: 'entry-1',
    date: store.currentDate,
    name: 'Oatmeal',
    macros: { calories: 300, protein: 10, carbsTotal: 50, carbsFiber: 4, carbsSugar: 1, fat: 6 },
    servings: 1,
    sourceType: 'manual',
    createdAt: '2026-07-16T08:00:00.000Z',
  }
}

describe('restoreEntry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storedEntries.length = 0
  })

  // The undo snackbar hands restoreEntry the entry object from the v-for,
  // which is a reactive proxy once it has lived in store.entries.
  it('restores an entry read back through the store (reactive proxy)', async () => {
    const store = useDailyLogStore()
    await store.addEntry(makeEntry(store))
    await store.loadDate()

    const proxied = store.entries[0]
    await store.removeEntry(proxied.id)
    expect(store.entries).toHaveLength(0)

    await expect(store.restoreEntry(proxied)).resolves.toBeUndefined()
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].name).toBe('Oatmeal')
  })
})
