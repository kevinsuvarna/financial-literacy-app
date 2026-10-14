import { expect, test } from '@playwright/test';
import { expectScanner, openWithCamera, SIGHTING_TIMEOUT } from './camera';
import { cameraLaunchOptions, CAMERA_SEQUENCES, sequenceVideo } from './fakeCamera';
import { nextTaskButton } from './helpers';

// The `camera` project: the identity documents (a scanAll task) again, through the real
// CameraSource, with a wrong document held up between the two right ones — Aadhaar card,
// library card, PAN card, then round again. Nothing is clicked to scan.

test.use({
  launchOptions: cameraLaunchOptions(sequenceVideo(CAMERA_SEQUENCES.kycWithWrongCard)),
});

test('the wrong one is explained and fills no slot; the right two still complete it', async ({
  page,
}) => {
  await openWithCamera(
    page,
    'l1-t2-verify-identity',
    'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?',
  );

  await expect(page.getByRole('status')).toContainText(
    'A library card isn’t issued by the government',
    { timeout: SIGHTING_TIMEOUT },
  );
  await expect(nextTaskButton(page)).toHaveCount(0);

  await expect(page.getByText('2 of 2 verified')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expect(page.getByRole('status')).toContainText('Identity verified!');
  await expect(page.getByRole('listitem').filter({ hasText: 'Library Card' })).toHaveCount(0);
  await expectScanner(page, 'camera 3');
  await expect(nextTaskButton(page)).toBeVisible();
});
