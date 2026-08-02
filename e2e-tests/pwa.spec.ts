import { expect, test } from '@playwright/test'
import {
  appRoot,
  addManualEntry,
  dailyCard,
  darkModeSwitch,
  entryRow,
  openApp,
  openDaily,
  openSettings,
  serviceWorkerReady,
  setDarkMode,
  appearanceCard,
} from './support/app'

/**
 * The service worker, which is what makes this an app the user can open rather
 * than a page they have to be online for. `VitePWA` precaches the build
 * (`globPatterns` in `vite.config.mts`) and workbox serves navigations out of
 * it, and nothing here is visible until the network is gone: online, every
 * assertion below passes with the worker deleted.
 *
 * This is the test to keep running as the app grows — the failure it catches is
 * a `globPatterns` change that leaves the app booting fine on a warm network
 * and dead on a train, which for an offline-first food log is the whole product
 * broken.
 *
 * It says nothing about the web app manifest: nothing here fetches
 * `manifest.webmanifest` or checks installability, and `globPatterns` does not
 * even list that extension, so a broken `start_url` or a dropped icon passes
 * this file silently. That is a gap worth closing, not a claim to make here.
 */
test.describe('the app with the network down', () => {
  test('reloads, routes and keeps its data', async ({ page }) => {
    await openApp(page)

    // Two kinds of persisted state, because they fail independently: the entry
    // is in IndexedDB through Dexie, the theme is a localStorage string the
    // Pinia store reads at startup. A reload that came back without either
    // would say the app booted without reading it.
    await addManualEntry(page, 'Oatmeal', 320)
    await setDarkMode(page, true)

    await serviceWorkerReady(page)

    // Back to Daily before cutting the network, so the reload below is a
    // document request for that route and the `/settings` one further down is
    // the first for a path no file corresponds to. Reloading on `/settings`
    // instead would make that later block a re-run of this one.
    await openDaily(page)

    await page.context().setOffline(true)
    await page.reload()

    // The app came back at all: `index.html` and the entry bundle were served
    // by the worker, since nothing could have fetched them.
    await openDaily(page)
    await expect(appRoot(page)).toHaveClass(/v-theme--dark/)
    await expect(entryRow(page, 'Oatmeal')).toBeVisible()
    await expect(dailyCard(page)).toContainText('320')

    // Each route is a chunk of its own (`router/index.ts` imports every page
    // lazily), and the reload dropped the module graph, so Settings is being
    // fetched here with nowhere but the precache to come from. A `globPatterns`
    // that stopped covering the chunks would leave the app booting and then
    // failing to navigate, which is what this catches.
    await openSettings(page)
    await expect(darkModeSwitch(page)).toBeChecked()

    // A cold start on a URL that no file corresponds to: `/settings` is a
    // client-side route, so this is workbox's navigate fallback handing back
    // the precached `index.html` and the router taking it from there. The
    // reload above only showed the fallback answering for `/daily`; the in-app
    // navigation cannot show it at all — it never made a document request. This
    // is what a user reopening an installed app on a deep link does. Daily
    // first so the assertion stands on its own: Settings being on screen after
    // it can only be the cold start having rendered it.
    await openDaily(page)
    await page.goto('/settings')
    await expect(appearanceCard(page)).toBeVisible()

    // And the offline app is still writable, not just readable: this entry is
    // added, stored and read back with no network at any point.
    await addManualEntry(page, 'Almonds', 170)
    await page.reload()
    await openDaily(page)
    await expect(entryRow(page, 'Almonds')).toBeVisible()
  })
})
