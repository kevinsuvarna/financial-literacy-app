import { expect, type Page } from '@playwright/test'
import { STORAGE_KEY, STORAGE_VERSION, type GameProgress } from '../src/state/gameStore'

export const dialog = (page: Page) => page.getByRole('dialog')
export const toast = (page: Page) => page.getByRole('status')

/** Closes a feedback pop-up or a full feedback card (scene screens), checking its stamp or title. */
export async function closeDialog(page: Page, title?: string) {
  if (title) await expect(dialog(page)).toContainText(title)
  await dialog(page).getByRole('button').click()
  await expect(dialog(page)).toBeHidden()
}

export async function closeToast(page: Page, text: string) {
  await expect(toast(page)).toContainText(text)
  await toast(page).getByRole('button').click()
  await expect(toast(page)).toBeHidden()
}

/** Starts the page with saved progress, as if the player had played this far before. */
export async function seedProgress(page: Page, progress: GameProgress) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify({ state: progress, version: STORAGE_VERSION })] as const,
  )
}

export const AFTER_INTRO: GameProgress = {
  introCompleted: true,
  completedTasks: [],
  accepted: {},
  wrongAttempts: {},
  phishingChoice: null,
}
