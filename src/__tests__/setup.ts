// jsdom ships no IndexedDB, and every page in this app reaches one through
// Dexie (`src/db`) as soon as it mounts. An in-memory implementation is what
// makes a component test of this app possible at all without mocking the data
// layer away — a mock would only prove the components run against the mock.
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'
import { db } from '@/db'

// `fake-indexeddb/auto` installs one factory per test *file* (Vitest's
// `isolate: true` gives each file its own environment, but not each test), and
// `src/db`'s Dexie instance is a module singleton opened once against it. So
// without this, rows written by one test — and the defaults `seedDefaults`
// writes — are still there for the next one, and the failure that produces is
// an assertion seeing a row it did not create, which points at the assertion
// rather than at the leak.
//
// `db.delete()` rather than swapping in a fresh `new IDBFactory()`: Dexie
// captures the factory in `_deps` when the instance is *constructed*
// (`Dexie.dependencies.indexedDB`, read at import time), so replacing
// `globalThis.indexedDB` afterwards would leave this already-built singleton
// pointed at the old one and silently do nothing.
//
// `disableAutoOpen: false` is the part that is easy to miss: `delete()`
// defaults to closing the connection *and* latching auto-open off, which turns
// the next table access into a `DatabaseClosedError` instead of a reopen
// against the fresh schema.
beforeEach(async () => {
  await db.delete({ disableAutoOpen: false })
})

// jsdom implements neither ResizeObserver nor matchMedia, both of which
// Vuetify's layout components rely on. Provide minimal stubs so components can
// mount under the test environment.

globalThis.ResizeObserver ??= class {
  observe () {}
  unobserve () {}
  disconnect () {}
}

// The router calls window.scrollTo on navigation, which jsdom defines only as a
// throwing "not implemented" stub; replace it so navigation is quiet.
window.scrollTo = (() => {}) as typeof window.scrollTo

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}
