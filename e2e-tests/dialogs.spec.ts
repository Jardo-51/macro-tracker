import { expect, type Locator, type Page, test } from '@playwright/test'
import { openAddEntryDialog, openApp, openMeals } from './support/app'

/**
 * The dialogs a user fills in from scratch — Add Entry, New Food, New Meal —
 * are `persistent`: a stray tap on the scrim or an Escape must not throw the
 * half-typed form away. Only Cancel (or saving) closes them.
 *
 * Each test types something first so the assertion is about the input
 * surviving, which is what the user actually loses, not only about the dialog
 * staying on screen.
 *
 * The Edit variants of the food and meal dialogs are the same two components,
 * so they get `persistent` from the same prop — arguably the more consequential
 * half, since an edit holds data the user did not type this minute. They are
 * not covered separately on purpose: the prop sits on the one `v-dialog` each
 * component renders, and `isEdit` reaches only the title, the submit button's
 * label and which store call runs — nothing on the path that dismisses the
 * dialog. A second pair of tests would re-run these assertions against the
 * same markup.
 */

/**
 * Taps the scrim, well clear of the dialog — its top-left corner, which the
 * centred dialog does not reach.
 *
 * Through the scrim's own locator rather than `page.mouse.click(5, 5)`:
 * a raw coordinate skips every actionability check, so a dialog that grew over
 * that corner would swallow the tap and leave the assertions below passing
 * without testing anything. Playwright checks that the scrim is what actually
 * receives the event at this point and fails with "intercepts pointer events"
 * if it is not, which makes that a loud failure rather than a silent one.
 */
async function tapOutside (page: Page) {
  await page.locator('.v-overlay__scrim').first().click({ position: { x: 5, y: 5 } })
}

async function expectStaysOpen (page: Page, dialog: Locator, field: Locator, value: string) {
  await tapOutside(page)
  await expect(dialog).toBeVisible()
  await expect(field).toHaveValue(value)

  // Focused first so the key goes to the form rather than to whatever the tap
  // above left focused: Escape from outside the overlay would be a no-op, and
  // the assertions below cannot tell that apart from a dialog refusing to
  // close. It is also where the user's cursor actually is.
  await field.focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(field).toHaveValue(value)

  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
}

test.describe('the add dialogs', () => {
  test('Add Entry closes only through Cancel', async ({ page }) => {
    await openApp(page)
    const dialog = await openAddEntryDialog(page)
    await dialog.getByRole('tab', { name: 'Manual' }).click()
    const name = dialog.getByLabel('Food name')
    await name.fill('Oatmeal')

    await expectStaysOpen(page, dialog, name, 'Oatmeal')
  })

  test('New Food closes only through Cancel', async ({ page }) => {
    await openApp(page)
    await openMeals(page)
    await page.getByRole('button', { name: 'Add Food' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('New Food')
    const name = dialog.getByLabel('Food name')
    await name.fill('Banana')

    await expectStaysOpen(page, dialog, name, 'Banana')
  })

  test('New Meal closes only through Cancel', async ({ page }) => {
    await openApp(page)
    await openMeals(page)
    await page.getByRole('tab', { name: 'Meals' }).click()
    await page.getByRole('button', { name: 'Add Meal' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('New Meal')
    const name = dialog.getByLabel('Meal name')
    await name.fill('Breakfast')

    await expectStaysOpen(page, dialog, name, 'Breakfast')
  })
})
