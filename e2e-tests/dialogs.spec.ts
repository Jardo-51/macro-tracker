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
 */

/**
 * Taps the scrim, well clear of the dialog. The top-left corner is outside it
 * at the phone viewport the suite runs in: the dialog is centred and has
 * margins on every side.
 */
async function tapOutside (page: Page) {
  await page.mouse.click(5, 5)
}

async function expectStaysOpen (page: Page, dialog: Locator, field: Locator, value: string) {
  await tapOutside(page)
  await expect(dialog).toBeVisible()
  await expect(field).toHaveValue(value)

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
