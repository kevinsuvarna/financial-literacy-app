import { expect, test, type Page } from '@playwright/test';
import { answerCall, expectPrompt, startTraining } from './helpers';

const FIRST_LINE = '“Hello? Is this the bank? Please, I need help!”';

/** Drags the swipe handle `fraction` of the way along its track, then lets go. */
async function swipe(page: Page, fraction: number) {
  const handle = await page.getByTestId('swipe-handle').boundingBox();
  const track = await page.getByTestId('swipe-track').boundingBox();
  if (!handle || !track) throw new Error('swipe control not found');

  const startX = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  const distance = (track.width - handle.width) * fraction;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX + distance, y, { steps: 12 });
  await page.mouse.up();
}

test('the phone rings until the call is answered with a full swipe', async ({ page }) => {
  await startTraining(page);
  await expectPrompt(page, 'Ananya');

  // A half-hearted swipe springs back and the phone keeps ringing.
  const handleX = async () => (await page.getByTestId('swipe-handle').boundingBox())?.x ?? NaN;
  const restingX = await handleX();
  await swipe(page, 0.3);
  await expect(page.getByText('Incoming call')).toBeVisible();
  // Let it finish springing back before the next swipe is measured from it.
  await expect.poll(handleX).toBeCloseTo(restingX, 0);

  await swipe(page, 1);
  await expect(page.getByText('On the line')).toBeVisible();
  await expect(page.getByText('Incoming call')).toHaveCount(0);
});

test('the call types out, breaks up on its own, and leads to the case file', async ({ page }) => {
  await startTraining(page);
  await answerCall(page);

  // Typewriter: the line is not all there at first, and then it is.
  const firstLine = page.locator('p', { hasText: 'Hello? Is this the bank?' });
  const untyped = firstLine.locator('.invisible');
  await expect(untyped).not.toHaveText('');
  await expect(untyped).toHaveText('', { timeout: 10_000 });
  // Screen readers get the whole line from the start, not a letter at a time.
  await expect(firstLine.locator('.sr-only')).toHaveText(FIRST_LINE);

  // Ananya is cut off mid-sentence and the call drops without the player doing anything.
  await expect(page.locator('p', { hasText: 'There is a payment I never made' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('status')).toHaveText('The call has been disconnected.', {
    timeout: 20_000,
  });
  await expect(page.getByText('On the line')).toHaveCount(0);

  const assignment = page.getByRole('button', { name: 'SEE YOUR ASSIGNMENT' });
  await expect(assignment).toBeFocused();
  await assignment.click();

  await expectPrompt(page, 'NEW CASE ASSIGNED');
  await expect(page.getByText(/Her physical case file holds the clues/)).toBeVisible();
  await page.getByRole('button', { name: 'OPEN CASE FILE' }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expectPrompt(page, 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?');
});

test('SKIP jumps straight to the disconnect with the whole conversation shown', async ({
  page,
}) => {
  await startTraining(page);
  await answerCall(page);

  await page.getByRole('button', { name: 'SKIP' }).click();

  await expect(page.getByRole('status')).toHaveText('The call has been disconnected.');
  await expect(page.locator('p .invisible').first()).toHaveText('');
  await expect(page.locator('p .invisible')).toHaveCount(2);
});

test('with reduced motion the dialogue appears at once instead of typing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startTraining(page);
  await answerCall(page);

  const firstLine = page.locator('p', { hasText: 'Hello? Is this the bank?' });
  await expect(firstLine.locator('.invisible')).toHaveText('');
  await expect(page.getByRole('status')).toHaveText('The call has been disconnected.', {
    timeout: 10_000,
  });
});

test('the game has not started until the case file is opened', async ({ page }) => {
  await startTraining(page);
  await answerCall(page);

  // Leaving mid-intro and going to a game route sends the player back to the start.
  await page.goto('/play');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'START TRAINING' })).toBeVisible();
});
