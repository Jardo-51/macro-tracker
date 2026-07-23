import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone config (not merged with vite.config.mts) so tests don't pull in
// the Vuetify/PWA/fonts plugins, none of which matter for pure-logic tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/*.test.ts'],
    // Pin a non-UTC zone: date.test.ts distinguishes local-date from UTC-date
    // implementations, which is only observable at a nonzero UTC offset.
    // CI runners default to UTC, where the two are indistinguishable.
    env: { TZ: 'America/New_York' },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
})
