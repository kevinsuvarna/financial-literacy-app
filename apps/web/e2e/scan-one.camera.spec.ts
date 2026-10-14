import { expect, test } from '@playwright/test';
import { expectPrompt, nextTask, openFirstTask, picker } from './helpers';

// The `camera` project: a scanOne task (Level 1 Task 1, the account type) played through the
// real CameraSource. Nothing here clicks a card — every scan comes from decoded video frames.

// The project's default video: the Savings Account card, the right answer.
test('reads a QR code from the camera, end to end', async ({ page }) => {
  await openFirstTask(page, '/?debug=1');
  const panel = page.getByRole('complementary', { name: 'Debug panel' });
  const scanner = panel.getByTestId('debug-scanner');
  /** Asserts on the debug panel's scanner readout, read as rendered ("Camera idle · user"). */
  const expectScanner = (text: string | RegExp) =>
    expect(scanner).toContainText(text, { useInnerText: true });

  // The camera is not touched before the player agrees to it.
  await expectScanner('Camera pref unasked');
  await expectScanner('Camera idle');

  await page.getByRole('button', { name: 'TURN ON SCANNER' }).click();

  // Camera → hidden video → worker → decoder → parser → ARTEFACT_SCANNED → task solved.
  await expect(page.getByRole('status')).toContainText('A savings account lets Ananya', {
    timeout: 20_000,
  });
  await expectScanner('account-savings via camera');
  await expectScanner(/Decoder\s+(native|zxing-wasm)/);

  // The video element is in the DOM and rendered, but effectively invisible.
  const video = page.locator('video');
  await expect(video).toHaveCount(1);
  await expect(video).toHaveJSProperty('muted', true);
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).not.toHaveCSS('display', 'none');
  await expect(video).toHaveCSS('width', '1px');
  await expect(video).toHaveCSS('height', '1px');
  await expect(video).toHaveCSS('opacity', '0.01');

  // Solved task: the stream is kept, but nothing is decoded until the next table-scene task.
  await expectScanner('Camera standby');

  // The card is still "held up" when the next task opens, and it isn't an answer there. (The
  // pause is longer than the same-card debounce, as if the card had been lowered and raised.)
  await page.waitForTimeout(2500);
  await nextTask(page);
  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');
  await expect(page.getByText('Scanner active')).toBeVisible();
  await expect(page.getByText('Hold a card up to the scanner')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('not one of the choices');
  await expectScanner('camera 2');

  // Held in view for several more seconds, the same card must not be reported again.
  await page.waitForTimeout(4000);
  await expectScanner('camera 2');
  await expectScanner('Scans 2');

  // Leaving the level releases the camera; coming back to a scan task starts it again.
  await page.getByRole('link', { name: 'Case Board' }).click();
  await expectScanner('Mode off');
  await expectScanner('Camera idle');
  await page.getByRole('button', { name: 'RESUME: Understand the Account' }).click();
  await expectScanner('Camera scanning');

  // The player can always give up on the camera and use the list.
  await page.getByRole('button', { name: 'Can’t scan? Choose from a list' }).click();
  await expect(picker(page)).toBeVisible();
  await expectScanner('Camera idle');
});
