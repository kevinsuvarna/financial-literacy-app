import { expect, type Page } from '@playwright/test';

// Strings are written out here on purpose rather than imported from packages/content: these
// tests assert what the player actually sees, including the wording SPEC.md dictates.

export async function expectPrompt(page: Page, prompt: string | RegExp) {
  await expect(page.getByRole('heading', { level: 1, name: prompt })).toBeVisible();
}

export function picker(page: Page) {
  return page.getByRole('group', { name: 'Simulated scanner' });
}

/** Picks a card in the simulated scanner — the stand-in for scanning its QR code. */
export async function scan(page: Page, cardLabel: string) {
  await picker(page).getByRole('button', { name: cardLabel, exact: true }).click();
}

export function nextTaskButton(page: Page) {
  return page.getByRole('button', { name: 'NEXT TASK' });
}

export async function nextTask(page: Page) {
  await nextTaskButton(page).click();
}

/** The start screen's button, which takes the player to the ringing phone. */
export async function startTraining(page: Page, startUrl = '/') {
  await page.goto(startUrl);
  await expectPrompt(page, 'SAVE THE SAVINGS ACCOUNT');
  await page.getByRole('button', { name: 'START TRAINING' }).click();
  await expect(page.getByText('Incoming call')).toBeVisible();
}

/** Answers the ringing phone the keyboard way: focus the answer button and press Enter. */
export async function answerCall(page: Page) {
  await page.getByRole('button', { name: 'Answer the call' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('On the line')).toBeVisible();
}

/**
 * Title screen → call (answered and skipped) → case assigned → first task, with the scanner
 * question open. The intro itself is covered in intro.spec.ts; this is the short way through.
 */
export async function openFirstTask(page: Page, startUrl = '/') {
  await startTraining(page, startUrl);
  await answerCall(page);
  await page.getByRole('button', { name: 'SKIP' }).click();
  await page.getByRole('button', { name: 'SEE YOUR ASSIGNMENT' }).click();
  await expectPrompt(page, 'NEW CASE ASSIGNED');
  await page.getByRole('button', { name: 'OPEN CASE FILE' }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(
    page.getByRole('heading', { name: 'Switch on the evidence scanner?' }),
  ).toBeVisible();
}

/** Starts the game and answers the scanner question with "choose cards from a list". */
export async function startGame(page: Page) {
  await openFirstTask(page);
  await page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' }).click();
  await expect(picker(page)).toBeVisible();
}
