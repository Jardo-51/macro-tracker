import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import { defineConfig } from 'vitest/config'

// Intentionally a standalone config rather than `mergeConfig(viteConfig, …)`:
// merging would pull the PWA/fonts plugins from vite.config.mts into the test
// pipeline. The `@` alias and Vue/Vuetify plugins below are duplicated on
// purpose — keep them in sync with vite.config.mts by hand.
export default defineConfig({
  plugins: [
    Vue(),
    // Without `styles.configFile`: the SCSS customisation in
    // src/styles/settings.scss only affects what the app looks like, and
    // Vitest does not process CSS at all, so compiling it here would be time
    // spent on output nothing reads.
    Vuetify({ autoImport: true }),
  ],
  test: {
    environment: 'jsdom',
    // Scoped to `src/` on purpose: Vitest's default include also matches
    // `e2e-tests/*.spec.ts`, and those are Playwright specs — under Vitest they
    // fail at the `@playwright/test` import rather than doing anything useful.
    // The extension half is Vitest's own default, kept verbatim: narrowing it to
    // `.ts` would silently stop collecting a `Foo.spec.tsx`, and a test that
    // never runs looks exactly like one that passes.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    setupFiles: ['./src/__tests__/setup.ts'],
    // Vuetify ships untranspiled ESM that Vitest must process rather than
    // externalise.
    server: { deps: { inline: ['vuetify'] } },
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
