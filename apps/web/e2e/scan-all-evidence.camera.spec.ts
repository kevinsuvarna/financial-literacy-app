import { expect, test, type Page } from '@playwright/test';
import { expectScanner, openWithCamera, SIGHTING_TIMEOUT } from './camera';
import { cameraLaunchOptions, CAMERA_SEQUENCES, sequenceVideo } from './fakeCamera';
import { expectPrompt, nextTask, nextTaskButton } from './helpers';

// The `camera` project: the other scanAll task (Level 3 Task 4, the evidence) played through
// the real CameraSource. The fake camera holds up the bank statement, then the cheque — which
// isn't evidence — then the phishing message, a few seconds each, then round again. Nothing is
// clicked to scan.

const tracker = (page: Page) => page.getByRole('navigation', { name: 'Mission progress' });

test.use({ launchOptions: cameraLaunchOptions(sequenceVideo(CAMERA_SEQUENCES.evidence)) });

const slot = (page: Page, artefactId: string) => page.locator(`[data-slot="${artefactId}"]`);

test('the cheque is turned away; the report stays locked until both pieces are attached', async ({
  page,
}) => {
  await openWithCamera(page, 'l3-t4-scan-evidence', 'SCAN EVIDENCE');
  await expect(page.getByText('0 of 2 attached')).toBeVisible();

  // One piece in: no way on, and the report can't be opened from the tracker either.
  await expect(page.getByText('1 of 2 attached')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(
    tracker(page).getByRole('button', { name: /^Secure & Report, task 5 of 5/ }),
  ).toBeDisabled();

  // The cheque passes in front of the camera: not needed, and it attaches nothing.
  await expect(page.getByRole('status')).toContainText(
    'Not needed. The cheque’s returned payment has already been explained',
    { timeout: SIGHTING_TIMEOUT },
  );

  await expect(page.getByText('2 of 2 attached')).toBeVisible({ timeout: SIGHTING_TIMEOUT });
  await expect(slot(page, 'bank-statement')).toHaveAttribute('data-state', 'attached');
  await expect(slot(page, 'phishing-message')).toHaveAttribute('data-state', 'attached');
  await expect(page.getByRole('status')).toHaveText(
    'Both pieces of evidence are attached to the incident report.',
  );
  await expectScanner(page, 'camera 3');

  await nextTask(page);
  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await expect(
    page.getByTestId('incident-report').getByText('Attached', { exact: true }),
  ).toHaveCount(2);
});
