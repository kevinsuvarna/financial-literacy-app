import { expect, test, type Page } from '@playwright/test';
import { answerCall, expectPrompt, jumpToTask, nextTask, nextTaskButton } from './helpers';

const PROMPT = 'SHOULD ANANYA CLICK THE LINK?';
const NEXT_PROMPT = 'SOMETHING LINKS THESE CLUES. CAN YOU CONNECT THEM?';

const notification = (page: Page) =>
  page.getByRole('region', { name: 'Message on Ananya’s phone' });
const noButton = (page: Page) => page.getByRole('button', { name: 'NO — DON’T CLICK THE LINK' });
const yesButton = (page: Page) => page.getByRole('button', { name: 'YES — CLICK THE LINK' });
const fakePage = (page: Page) => page.getByTestId('fake-bank-page');
const field = (page: Page, label: string) =>
  fakePage(page).getByRole('button', { name: new RegExp(`^${label}:`) });
const submit = (page: Page) => fakePage(page).getByRole('button', { name: 'UNBLOCK MY CARD' });
/** The task's explanation — as opposed to the review banner or the simulation's live region. */
const explanation = (page: Page) => page.locator('p[role="status"]');

async function openTask(page: Page) {
  await jumpToTask(page, 'l3-t1-spot-the-phish');
  await expectPrompt(page, PROMPT);
}

/** Answers Ananya's call and skips her lines, leaving the message and the choice on screen. */
async function takeTheCall(page: Page) {
  await answerCall(page);
  await page.getByRole('button', { name: 'SKIP' }).click();
  await expect(notification(page)).toBeVisible();
}

test('Ananya calls again, and the message arrives before the choice is offered', async ({
  page,
}) => {
  await openTask(page);

  // The phone rings first: no message and no choice yet.
  await expect(page.getByText('Incoming call')).toBeVisible();
  await expect(notification(page)).toHaveCount(0);
  await expect(noButton(page)).toHaveCount(0);

  // On the line, she explains — and still nothing to choose until she has finished.
  await answerCall(page);
  await expect(page.locator('p', { hasText: 'my debit card has just been blocked' })).toBeVisible();
  await expect(noButton(page)).toHaveCount(0);

  // Left alone, the call runs its course and the notification lands.
  await expect(notification(page)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('p', { hasText: 'Should I tap it?' })).toBeVisible();
  await expect(notification(page)).toContainText('CAMS TEL');
  await expect(notification(page)).toContainText('Your debit card has been BLOCKED');
  await expect(notification(page)).toContainText('cams-tel-unblock.example/verify');
  // The "link" is text. There is nothing in the message to click or follow.
  await expect(notification(page).getByRole('link')).toHaveCount(0);

  await expect(noButton(page)).toBeEnabled();
  await expect(yesButton(page)).toBeEnabled();
});

test('NO: praise and advice to use official channels, then on with the case', async ({ page }) => {
  await openTask(page);
  await takeTheCall(page);

  await noButton(page).click();

  await expect(page.getByText('CORRECT', { exact: true })).toBeVisible();
  await expect(explanation(page)).toContainText('Good instinct — checking before acting');
  await expect(explanation(page)).toContainText('phishing');
  await expect(explanation(page)).toContainText('the bank’s official channels');
  await expect(page.getByText('You chose: NO — DON’T CLICK THE LINK')).toBeVisible();
  // No fake page for the player who didn't click.
  await expect(fakePage(page)).toHaveCount(0);
  await expect(yesButton(page)).toBeDisabled();

  await nextTask(page);
  await expectPrompt(page, NEXT_PROMPT);
});

test('YES: a fake page that cannot be typed into, a loss only after submit, then a gentle debrief', async ({
  page,
}) => {
  await openTask(page);
  await takeTheCall(page);

  // From here on, the page must not talk to anything at all.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await yesButton(page).click();

  // The fake page opens. No verdict and no way forward while it plays out.
  await expect(fakePage(page)).toBeVisible();
  await expect(fakePage(page)).toContainText('SIMULATION — this is not a real page');
  await expect(fakePage(page)).toContainText('Not secure');
  await expect(fakePage(page)).toContainText('cams-tel-unblock.example/verify');
  await expect(explanation(page)).toHaveCount(0);
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(page.getByText('CORRECT', { exact: true })).toHaveCount(0);

  // There is nothing on the page that can take text: no inputs, no form, nothing editable.
  await expect(page.locator('input, textarea, select, form, [contenteditable]')).toHaveCount(0);

  // Nothing has been "lost" just by clicking the link.
  await expect(page.getByTestId('simulated-balance')).toHaveCount(0);
  await expect(submit(page)).toBeDisabled();

  // Typing at a field does nothing. Tapping it has the game fill in an obvious fake.
  await field(page, 'Card number').focus();
  await page.keyboard.type('4111 1111 1111 1111');
  await expect(field(page, 'Card number')).toHaveAccessibleName('Card number: Tap to fill in');

  await field(page, 'Card number').click();
  await expect(field(page, 'Card number')).toHaveAccessibleName('Card number: XXXX-XXXX-XXXX-0000');
  await page.keyboard.type('1234');
  await expect(field(page, 'Card number')).toHaveAccessibleName('Card number: XXXX-XXXX-XXXX-0000');
  await expect(submit(page)).toBeDisabled();

  // The keyboard works the same way: Enter fills the field in.
  await field(page, 'Card PIN').focus();
  await page.keyboard.press('Enter');
  await expect(field(page, 'Card PIN')).toHaveAccessibleName('Card PIN: XXXX');
  await field(page, 'One-time password \\(OTP\\)').click();
  await expect(field(page, 'One-time password \\(OTP\\)')).toHaveAccessibleName(
    'One-time password (OTP): 000000',
  );

  // Still no loss: the details are "entered", but nothing has been submitted.
  await expect(page.getByTestId('simulated-balance')).toHaveCount(0);
  await expect(explanation(page)).toHaveCount(0);

  // Only submitting drains the (simulated) savings.
  await submit(page).click();
  await expect(page.getByTestId('simulated-balance')).toBeVisible();
  await expect(page.getByTestId('simulated-balance')).toHaveText('₹0', { timeout: 10_000 });
  await expect(page.getByTestId('simulated-loss')).toHaveText('− ₹7,501');
  await expect(page.getByRole('status').filter({ hasText: /^Simulation:/ })).toHaveText(
    'Simulation: ₹7,501 was taken from Ananya’s savings after the details were entered.',
  );

  // Then the debrief: what happened, why, what to do instead — and that it wasn't real.
  await expect(explanation(page)).toContainText('That page was a fake');
  await expect(explanation(page)).toContainText('Tapping the link did not take any money');
  await expect(explanation(page)).toContainText('only after card details were typed into the page');
  await expect(explanation(page)).toContainText('the bank’s own app, website or phone number');
  await expect(explanation(page)).toContainText('Nothing real was lost here');
  // Gentle: it isn't stamped CORRECT, and it isn't treated as a failure to retry either.
  await expect(page.getByText('CORRECT', { exact: true })).toHaveCount(0);
  await expect(explanation(page)).not.toContainText('Good instinct');
  await expect(noButton(page)).toBeDisabled();

  // Not one request was made from the moment the link was "clicked".
  expect(requests).toEqual([]);

  await nextTask(page);
  await expectPrompt(page, NEXT_PROMPT);
});

test('YES is remembered: reopening shows the debrief without replaying the fake page', async ({
  page,
}) => {
  await openTask(page);
  await takeTheCall(page);
  await yesButton(page).click();
  await expect(fakePage(page)).toBeVisible();

  // Even abandoned half-way, the choice was already made — there is no undoing it by reloading.
  await page.reload();

  await expectPrompt(page, PROMPT);
  await expect(page.getByText('You chose: YES — CLICK THE LINK')).toBeVisible();
  await expect(explanation(page)).toContainText('That page was a fake');
  await expect(fakePage(page)).toHaveCount(0);
  await expect(page.getByText('Incoming call')).toHaveCount(0);
  await expect(noButton(page)).toBeDisabled();
  await expect(nextTaskButton(page)).toBeVisible();
});
