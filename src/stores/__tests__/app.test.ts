import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, watch } from 'vue'
import { useAppStore } from '@/stores/app'

// The store reads localStorage during setup; these tests run in the `node`
// environment, so give it a minimal in-memory stand-in.
function createLocalStorageStub () {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
}

describe('showSnackbar', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the message', async () => {
    const app = useAppStore()
    await app.showSnackbar('saved')
    expect(app.snackbar).toBe(true)
    expect(app.snackbarText).toBe('saved')
    expect(app.snackbarColor).toBe('success')
  })

  it('keeps the newest message when a second call interrupts the close', async () => {
    const app = useAppStore()
    await app.showSnackbar('first')

    const a = app.showSnackbar('second')
    const b = app.showSnackbar('third')
    await Promise.all([a, b])

    expect(app.snackbar).toBe(true)
    expect(app.snackbarText).toBe('third')
  })

  // The snackbar's timeout only restarts if the watcher actually observes the
  // ref go false and back to true. A same-tick true -> false -> true is
  // invisible to it, and the new message silently inherits the old timer.
  it('lets the watcher observe the close before reopening', async () => {
    const app = useAppStore()
    await app.showSnackbar('first')

    const observed: boolean[] = []
    watch(() => app.snackbar, value => observed.push(value))

    const a = app.showSnackbar('second')
    const b = app.showSnackbar('third')
    await Promise.all([a, b])
    await nextTick()

    expect(observed).toContain(false)
    expect(app.snackbar).toBe(true)
    expect(app.snackbarText).toBe('third')
  })
})
