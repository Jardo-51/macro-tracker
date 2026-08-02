import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
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
  it('mounts and renders the shell', async () => {
    const pinia = createPinia()

    // `/` redirects to `/daily`, so this also covers the redirect and the lazy
    // chunk behind it.
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    })

    expect(wrapper.find('.v-application').exists()).toBe(true)
    expect(wrapper.find('.v-bottom-navigation').exists()).toBe(true)
    expect(router.currentRoute.value.path).toBe('/daily')
  })
})
