import { expect, type Page } from '@playwright/test'

/**
 * The helpers the specs drive the app through — the bottom nav, the cards, the
 * Add Entry dialog — plus the two waits that make a browser test deterministic
 * rather than a race: {@link settle} and {@link serviceWorkerReady}.
 *
 * The rule these follow, and the one anything added here should keep following:
 * drive the app the way a user does. Reaching past the UI (into IndexedDB,
 * localStorage, `window`) is for a test whose subject has no form on screen at
 * all, and each such helper should say why it is one.
 * {@link serviceWorkerReady} is not a precedent for it — it asks the browser
 * about the browser, and nothing asserts on its answer.
 */

/** Opens the app at `/`, which redirects to Daily, and waits for the shell. */
export async function openApp (page: Page) {
  await page.goto('/')
  await expect(dailyCard(page)).toBeVisible()
}

/**
 * Waits until this page is being served *through* the service worker, which is
 * what has to be true before a test may cut the network.
 *
 * `controller` is the whole condition, and it says more than "a worker
 * exists". A worker only reaches the point of controlling a page by activating,
 * and `VitePWA`'s generated `sw.js` only activates once its install step has
 * written the precache — the build's HTML, JS, CSS, icons, fonts — to disk. So
 * a non-null controller means the files the app would otherwise ask the network
 * for are already on the device.
 *
 * It has to be waited for rather than assumed: `registerSW.js` registers on the
 * window's `load` event, and a test going offline straight after the first
 * paint would beat the install and then fail at the reload with
 * `net::ERR_INTERNET_DISCONNECTED` — a race, not a regression.
 *
 * The wait is `clientsClaim`'s doing (`registerType: 'autoUpdate'` sets it): a
 * first-ever worker would otherwise control nothing until the next navigation,
 * and this would hang on a healthy app.
 */
export async function serviceWorkerReady (page: Page) {
  // 30 s: an install of this precache is a fraction of a second locally, so
  // anything near this is a worker that is never going to activate.
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: 30_000 },
  ).catch(error => {
    // `cause` because this catch is unconditional: the diagnosis below fits the
    // timeout it is written for, but `waitForFunction` also rejects when
    // `navigator.serviceWorker` is undefined (an insecure origin) or the page
    // closes mid-wait, and those must not be reported as a precache problem
    // with no way back to what actually happened.
    throw new Error(
      'No service worker took control of the page, so the precache was never '
      + 'written — an asset in `globPatterns` that cannot be fetched fails the '
      + 'install step and the worker never activates.',
      { cause: error },
    )
  })
}

/**
 * Snackbars sit over the bottom of the screen, where the nav and the add-entry
 * FAB are, and swallow the clicks aimed at them. Waits out one that is
 * **already on screen**.
 *
 * Waited out rather than dismissed: `App.vue`'s snackbar is not `closable`, so
 * there is no close button to click, and its only button is the *Undo* that
 * `DailyEntryList` puts there — which a helper must never press on a test's
 * behalf. So the cost is the store's own timeout, 3 s for a plain message and
 * 6 s for one with an action, and the 8 s bound below covers the longer of the
 * two with room for the animation.
 *
 * It is not a guard against a snackbar that has yet to mount:
 * `waitFor({ state: 'detached' })` is satisfied the instant the locator matches
 * nothing, so `saveGoals(); await settle(); await navigate()` returns *before*
 * the snackbar appears and then clicks straight into it. A caller that has just
 * done something which raises a message has to wait for it to become visible
 * first — which is what {@link expectSnackbar} is for.
 *
 * The failures are swallowed on purpose: a snackbar outliving the bound is not
 * itself what any spec is about, and the click or assertion that follows fails
 * with a message about what it was actually trying to do.
 */
export async function settle (page: Page) {
  await page.locator('.v-snackbar--active').first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {})
}

/** Waits for a snackbar carrying `text`, then waits it back out. */
export async function expectSnackbar (page: Page, text: string) {
  await expect(page.locator('.v-snackbar--active').first()).toContainText(text)
  await settle(page)
}

/**
 * The nav destinations a helper below drives, and the route each one lands on.
 *
 * Only the three that are actually reached: a `Recommend`/`History` entry here
 * with no `openX` helper behind it is a claim about what the specs cover that
 * nothing checks, so add the pair together when a spec needs one.
 */
const navPaths = {
  Daily: '/daily',
  Meals: '/meals',
  Settings: '/settings',
} as const

/**
 * Goes to `to` unless the page is already there, so every caller gets the same
 * rule rather than one helper per rule.
 *
 * The click is skipped rather than left to vue-router's duplicate-navigation
 * no-op because it is not free: it can be swallowed by whatever is over the
 * bottom nav, and a spec that only wants "be on this page" should not depend on
 * the nav being reachable at that moment. {@link settle} still runs either way —
 * a caller is about to interact with the page it asked for.
 *
 * `exact` on the nav match on purpose: Playwright matches an accessible name
 * as a case-insensitive *substring* by default, and the nav's own labels
 * already overlap what the pages put on screen.
 */
async function navigate (page: Page, to: keyof typeof navPaths) {
  await settle(page)
  if (new URL(page.url()).pathname === navPaths[to]) return
  await page.getByRole('link', { name: to, exact: true }).click()
}

export async function openDaily (page: Page) {
  await navigate(page, 'Daily')
  await expect(dailyCard(page)).toBeVisible()
}

export async function openMeals (page: Page) {
  await navigate(page, 'Meals')
  await expect(page.getByRole('heading', { name: 'My Foods & Meals', exact: true })).toBeVisible()
}

export async function openSettings (page: Page) {
  await navigate(page, 'Settings')
  await expect(appearanceCard(page)).toBeVisible()
}

/**
 * The progress card, which is what says the Daily page has rendered. Not the
 * heading: that is the formatted date, so asserting on it would make every
 * spec depend on the runner's clock.
 */
export function dailyCard (page: Page) {
  return page.locator('.v-card').filter({ hasText: 'Daily Progress' })
}

/** The Entries card, and the rows the logged entries appear as. */
export function entriesCard (page: Page) {
  return page.locator('.v-card').filter({ hasText: 'Entries' })
}

export function entryRow (page: Page, name: string) {
  return entriesCard(page).locator('.v-list-item').filter({ hasText: name })
}

/** The Appearance card, which is what says the Settings page has rendered. */
export function appearanceCard (page: Page) {
  return page.locator('.v-card').filter({ hasText: 'Appearance' })
}

/** The Daily Goals card on Settings. */
export function goalsCard (page: Page) {
  return page.locator('.v-card').filter({ hasText: 'Daily Goals' })
}

/** The Appearance card's switch. Its own label is what the user reads. */
export function darkModeSwitch (page: Page) {
  return page.getByLabel('Dark mode', { exact: true })
}

/**
 * The element Vuetify hangs the active theme off, as `v-theme--dark` or
 * `v-theme--light` — the one place the choice is observable from outside.
 */
export function appRoot (page: Page) {
  return page.locator('.v-application')
}

/** Turns dark mode on or off from the Appearance card. */
export async function setDarkMode (page: Page, dark: boolean) {
  await openSettings(page)
  await settle(page)
  await darkModeSwitch(page).setChecked(dark)
  await expect(appRoot(page)).toHaveClass(dark ? /v-theme--dark/ : /v-theme--light/)
}

/**
 * Sets the daily calorie goal from the Settings page and saves it.
 *
 * Only calories: the four fields go through one `updateGoals` call, so a second
 * one would exercise the same path, and leaving the rest at their defaults
 * keeps the progress percentages a spec reads afterwards predictable.
 */
export async function setCalorieGoal (page: Page, calories: number) {
  await openSettings(page)
  await goalsCard(page).getByLabel('Calories (kcal)').fill(String(calories))
  await goalsCard(page).getByRole('button', { name: 'Save Goals' }).click()
  await expectSnackbar(page, 'Goals updated')
}

/**
 * Opens the Daily page's Add Entry dialog from the FAB.
 *
 * Through the label rather than `getByRole('button', { name: 'Add entry' })`:
 * `AddEntryDialog`'s `aria-label` is an attribute, and Vuetify's `VFab` puts
 * attributes on its wrapper `div` while the `VBtn` inside it takes only
 * declared props. So the button itself has no accessible name — which is a
 * real accessibility gap, not a quirk of this locator, and worth fixing in the
 * component rather than here.
 */
export async function openAddEntryDialog (page: Page) {
  await openDaily(page)
  // The FAB sits where the snackbar does, so anything up has to be gone first.
  await settle(page)
  await page.getByLabel('Add entry', { exact: true }).getByRole('button').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

/**
 * Logs a manual entry from the Daily page's Add Entry dialog.
 *
 * The dialog opens on *My Foods*, so the tab is switched explicitly rather than
 * relied on — a change to that default would otherwise show up here as a
 * missing "Food name" field rather than as what it is.
 */
export async function addManualEntry (page: Page, name: string, calories: number) {
  const dialog = await openAddEntryDialog(page)
  await dialog.getByRole('tab', { name: 'Manual' }).click()
  await dialog.getByLabel('Food name').fill(name)
  await dialog.getByLabel('Calories', { exact: true }).fill(String(calories))
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()

  await expect(entryRow(page, name)).toBeVisible()
}
