import { expect, test } from '@playwright/test'
import {
  appRoot,
  darkModeSwitch,
  goalsCard,
  openApp,
  openSettings,
  setCalorieGoal,
  setDarkMode,
} from './support/app'

/**
 * The theme switch in Settings.
 *
 * The choice lives in localStorage rather than in anything the app owns across
 * a reload (`stores/app.ts` reads it back at startup), so what makes this worth
 * a browser test rather than a unit test is the reload.
 *
 * Deliberately *not* covered: the `defaultTheme: 'light'` line in
 * `plugins/vuetify.ts`. Every assertion here runs long after mount, by which
 * point App.vue's `immediate` watcher has set the theme itself — change that
 * line and this file stays green. Proving it would mean asserting on the first
 * paint, which is not worth the flake; anyone touching it should know a green
 * run here says nothing about it.
 *
 * Also not covered, because the app does not do it: following the OS
 * `prefers-color-scheme`. `stores/app.ts` starts from the stored string alone,
 * so a dark OS gets a light app until the switch is touched. `colorScheme` is
 * pinned below so that staying true is what this file asserts, rather than
 * something it happens to run under.
 */
test.describe('the dark mode switch', () => {
  test.use({ colorScheme: 'dark' })

  test('turns dark mode on, and comes back dark after a reload', async ({ page }) => {
    await openApp(page)
    await openSettings(page)
    // Light despite the dark OS above: nothing is stored yet.
    await expect(appRoot(page)).toHaveClass(/v-theme--light/)
    await expect(darkModeSwitch(page)).not.toBeChecked()

    await setDarkMode(page, true)

    await page.reload()
    await openSettings(page)
    await expect(appRoot(page)).toHaveClass(/v-theme--dark/)
    await expect(darkModeSwitch(page)).toBeChecked()

    // And the switch goes back the other way, storing the choice rather than
    // clearing it — a `removeItem` here would leave the app light too, and only
    // the reload tells the two apart.
    await setDarkMode(page, false)
    await page.reload()
    await openSettings(page)
    await expect(appRoot(page)).toHaveClass(/v-theme--light/)
    await expect(darkModeSwitch(page)).not.toBeChecked()
  })
})

/**
 * The daily goals, which are the one piece of user state that lives in
 * IndexedDB rather than localStorage and is edited from a form.
 *
 * The reload is again the point: `loadGoals` seeds the defaults on first run
 * and then reads the row back, and a save that never reached Dexie looks
 * identical to one that did until the store is rebuilt from scratch.
 */
test.describe('the daily goals form', () => {
  test('saves a new goal and reloads it from the database', async ({ page }) => {
    await openApp(page)
    await openSettings(page)
    // The seeded default, which is what a first run must show.
    await expect(goalsCard(page).getByLabel('Calories (kcal)')).toHaveValue('2000')

    await setCalorieGoal(page, 2400)

    await page.reload()
    await openSettings(page)
    await expect(goalsCard(page).getByLabel('Calories (kcal)')).toHaveValue('2400')
    // Untouched fields are not collateral: `updateGoals` writes the whole row,
    // so a form that dropped one would silently reset it to zero.
    await expect(goalsCard(page).getByLabel('Protein (g)')).toHaveValue('150')
  })
})
