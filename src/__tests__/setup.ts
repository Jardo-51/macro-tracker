// jsdom ships no IndexedDB, and every page in this app reaches one through
// Dexie (`src/db`) as soon as it mounts. An in-memory implementation is what
// makes a component test of this app possible at all without mocking the data
// layer away — a mock would only prove the components run against the mock.
import 'fake-indexeddb/auto'

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
