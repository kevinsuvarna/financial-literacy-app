import { expect, test, type Page } from '@playwright/test';
import { expectScanner, openWithCamera, SIGHTING_TIMEOUT } from './camera';
import { cameraLaunchOptions, CAMERA_SEQUENCES, sequenceVideo } from './fakeCamera';
import { expectPrompt, nextTask, nextTaskButton } from './helpers';

// The `camera` project: a scanAll task (Level 1 Task 2, the two identity documents) played
// through the real CameraSource. The fake camera holds up the PAN card for a few seconds, then
// the Aadhaar card, then round again — the way a player scans one document and then the next.
// Nothing is clicked to scan.
//
// The video starts when the camera does, but a slow start can miss the first card, which then
// comes round again on the loop. So this says which cards were read, not in which order: the
// order itself, both ways round, is pinned down with the card list in level-1.spec.ts.

test.use({ launchOptions: cameraLaunchOptions(sequenceVideo(CAMERA_SEQUENCES.kyc)) });

const slot = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title });
const tracker = (page: Page) => page.getByRole('navigation', { name: 'Mission progress' });

test('one document is not enough to go on; the second completes the task', async ({ page }) => {
  await openWithCamera(
    page,
    'l1-t2-verify-identity',
    'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?',
  );
  await expect(page.getByText('0 of 2 verified')).toBeVisible();

  // The first card read fills the first slot — and the task cannot be left yet.
  await expect(page.getByText('1 of 2 verified')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(
    tracker(page).getByRole('button', { name: /^Understand the Account, task 3 of 3/ }),
  ).toBeDisabled();
  await expect(slot(page, 'Document 1')).toContainText('VERIFIED');

  // The second card fills the other.
  await expect(page.getByText('2 of 2 verified')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expect(page.getByRole('status')).toContainText('Identity verified!');
  const filled = [
    await slot(page, 'Document 1').textContent(),
    await slot(page, 'Document 2').textContent(),
  ].join(' | ');
  expect(filled).toContain('PAN Card');
  expect(filled).toContain('Aadhaar Card');
  await expectScanner(page, 'camera 2');

  // Done: the camera rests, and the way on appears.
  await expectScanner(page, 'Camera standby');
  await nextTask(page);
  await expectPrompt(page, 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?');
});
