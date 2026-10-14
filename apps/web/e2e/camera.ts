import { expect, type Page } from '@playwright/test';
import { expectPrompt } from './helpers';

/** How long a card may take to be seen: the camera starting, the decoder loading, a frame. */
export const SIGHTING_TIMEOUT = 20_000;

const panel = (page: Page) => page.getByRole('complementary', { name: 'Debug panel' });

/** The debug panel's scanner readout, read as rendered ("Camera scanning · user"). */
export async function expectScanner(page: Page, text: string | RegExp) {
  await expect(panel(page).getByTestId('debug-scanner')).toContainText(text, {
    useInnerText: true,
    timeout: SIGHTING_TIMEOUT,
  });
}

/**
 * Opens `taskId` with everything before it solved (the debug panel's Jump), leaves the panel
 * open so the scanner can be watched, and switches the camera scanner on — the way a player
 * would, by answering the scanner's question. From then on the only input is the camera.
 */
export async function openWithCamera(page: Page, taskId: string, prompt: string) {
  await page.goto('/?debug=1');
  await panel(page).getByLabel('Jump to task').selectOption(taskId);
  await panel(page).getByRole('button', { name: 'Jump' }).click();
  await expectPrompt(page, prompt);

  await page.getByRole('button', { name: 'TURN ON SCANNER' }).click();
  await expect(page.getByText('Scanner active')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expectScanner(page, 'Camera scanning');
  // The card list is not on offer while the camera is working: nothing here is simulated.
  await expect(page.getByRole('group', { name: 'Simulated scanner' })).toHaveCount(0);
}
