import { expect, test } from '@playwright/test';
import { expectScanner, openWithCamera, SIGHTING_TIMEOUT } from './camera';
import { cameraLaunchOptions, cardVideo } from './fakeCamera';
import { expectPrompt, nextTaskButton } from './helpers';

// The `camera` project: a scanOne task (Level 1 Task 1, the account type) with the wrong card
// held up to the real CameraSource — the Current Account card.

const TASK_1 = 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?';

test.use({ launchOptions: cameraLaunchOptions(cardVideo('account-current')) });

test('is explained, counted once however long it is held, and leaves the task open', async ({
  page,
}) => {
  await openWithCamera(page, 'l1-t1-account-type', TASK_1);

  const feedback = page.getByRole('status');
  await expect(feedback).toContainText('A current account is for frequent business transactions', {
    timeout: SIGHTING_TIMEOUT,
  });
  await expect(feedback).toHaveClass(/animate-wobble/);
  await expectScanner(page, 'account-current via camera');
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(page.getByText('CORRECT', { exact: true })).toHaveCount(0);

  // The card stays in front of the camera. It is one wrong answer, not one per frame.
  await page.waitForTimeout(5000);
  await expectScanner(page, 'Scans 1');
  await expectScanner(page, 'camera 1');
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expectPrompt(page, TASK_1);
  // Still listening for the right card.
  await expect(page.getByText('Scanner active')).toBeVisible();
});
