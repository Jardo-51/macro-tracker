import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { db } from '@/db'
import vuetify from '@/plugins/vuetify'
import router from '@/router'

// A smoke test for the shell, and for the Vitest setup as much as for the app:
// it is the one test that mounts real components, so it is what catches the
// jsdom environment, the Vuetify plugin and the fake IndexedDB in
// `src/__tests__/setup.ts` drifting out of a working state. It mounts the app
// the way main.ts does, with the app's own Vuetify instance rather than a bare
// `createVuetify()`, so the themes in `plugins/vuetify.ts` are the ones the
// dark-mode watcher in App.vue switches between.
describe('App', () => {
  let wrapper: VueWrapper | null = null

  // The mounted shell keeps App.vue's `immediate` theme watcher and the page's
  // stores alive for the rest of the file, so it is taken down explicitly
  // rather than left to the runner.
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('mounts the shell and renders what it read out of IndexedDB', async () => {
    // Written before the mount so the assertions below can only pass with a
    // value that came back *out* of the database: `seedDefaults` writes 2000
    // kcal when the row is missing, so a rendered 1234 is unreachable without a
    // successful read.
    await db.dailyGoals.put({ id: 'default', calories: 1234, protein: 150, carbsTotal: 250, fat: 65 })

    const pinia = createPinia()

    // `/` redirects to `/daily`, so this also covers the redirect and the lazy
    // chunk behind it.
    router.push('/')
    await router.isReady()

    wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    })

    expect(wrapper.find('.v-application').exists()).toBe(true)
    expect(wrapper.find('.v-bottom-navigation').exists()).toBe(true)
    expect(router.currentRoute.value.path).toBe('/daily')

    // `DailyPage` starts `ensureFreshToday()` from `onMounted` and does not
    // await it, so without this the Dexie round-trip is still in flight when
    // the test ends: the assertions above hold whatever IndexedDB does, and a
    // broken data layer surfaces only as a late unhandled rejection attributed
    // to whichever file the reporter was on. Several IDB requests have to
    // complete in sequence (seed → read goals → read entries), and each one
    // takes a macrotask of its own, hence the loop rather than a single flush.
    await waitFor(() => wrapper!.text().includes('1234'))

    // Both of these came back from the database rather than from the store's
    // defaults: the seeded goal, and the entries query resolving to nothing.
    expect(wrapper.text()).toContain('1234')
    expect(wrapper.text()).toContain('No entries yet')
  })
})

/**
 * Flushes until `condition` holds, so a failing data layer fails the assertion
 * that follows rather than the wait. 50 flushes is far more than the handful of
 * IndexedDB round-trips a healthy mount needs, and costs nothing when the first
 * one already satisfies the condition.
 */
async function waitFor (condition: () => boolean) {
  for (let i = 0; i < 50 && !condition(); i++) {
    await flushPromises()
  }
}
