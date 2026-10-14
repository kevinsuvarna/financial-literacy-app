import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTask, nextTaskButton } from './helpers';

const PROMPT = 'SOMETHING LINKS THESE CLUES. CAN YOU CONNECT THEM?';

const board = (page: Page) => page.getByRole('group', { name: 'Case corkboard' });
const messagePin = (page: Page) =>
  page.getByRole('button', { name: 'Tie the string to the sender of the message' });
const chequePin = (page: Page) =>
  page.getByRole('button', { name: 'Tie the string to the name on the returned cheque' });
const stringEnd = (page: Page) => page.getByTestId('string-end');
const connectedString = (page: Page) => page.getByTestId('red-string');
const reveal = (page: Page) => page.getByTestId('reveal');

async function openTask(page: Page) {
  await jumpToTask(page, 'l3-t2-uncover-the-scam');
  await expectPrompt(page, PROMPT);
  // The loose end of the string appears once the board has been measured.
  await expect(stringEnd(page)).toBeVisible();
}

async function centreOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Picks up the loose end of the string and carries it to `target`, without letting go. */
async function carryStringTo(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const from = await centreOf(stringEnd(page));
  const to = await centreOf(target);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 8 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
}

test('the board pins up the statement clue, the cheque and the message', async ({ page }) => {
  await openTask(page);

  await expect(board(page)).toContainText('Mobile Recharge — CAMS TEL');
  await expect(board(page)).toContainText('₹5,999');
  await expect(board(page)).toContainText('From: CAMS TEL');
  await expect(board(page)).toContainText('Greenfield Public School');
  // Opening the board is not solving it.
  await expect(reveal(page)).toHaveCount(0);
  await expect(nextTaskButton(page)).toHaveCount(0);
});

test('dragging the string: dropped nowhere, on the wrong pin, then on the message', async ({
  page,
}) => {
  await openTask(page);

  // Let go over empty cork: the string springs back and nothing happens.
  const start = await centreOf(stringEnd(page));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y - 60, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(reveal(page)).toHaveCount(0);

  // The cheque: a different name. Explained, and the string comes back for another go.
  await carryStringTo(page, chequePin(page));
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('made out to a different name');
  await expect(reveal(page)).toHaveCount(0);
  await expect(stringEnd(page)).toBeVisible();

  // The message's sender: the same name. The string holds and the reveal lands.
  await carryStringTo(page, messagePin(page));
  await page.mouse.up();

  await expect(connectedString(page)).toBeVisible();
  await expect(stringEnd(page)).toHaveCount(0);
  await expect(reveal(page)).toContainText('ONE NAME BEHIND BOTH');
  await expect(reveal(page)).toContainText('CONNECTED');
  await expect(page.getByRole('status')).toContainText('It’s the same name.');
  await expect(page.getByRole('status')).toContainText('one suspected scam operation');
  await expect(page.getByRole('status')).toContainText('not proof yet');
  await expect(page.getByText('made out to a different name')).toHaveCount(0);
  await expect(messagePin(page)).toBeDisabled();

  await nextTask(page);
  await expectPrompt(page, 'THREE CLUES HOLD THE PASSKEY');
});

test('keyboard: Tab to a pin and press Enter to tie the string', async ({ page }) => {
  await openTask(page);

  await chequePin(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('made out to a different name');

  await messagePin(page).focus();
  await page.keyboard.press('Enter');
  await expect(connectedString(page)).toBeVisible();
  await expect(reveal(page)).toContainText('ONE NAME BEHIND BOTH');
});

test('a connected board reopens connected', async ({ page }) => {
  await openTask(page);
  await messagePin(page).click();
  await expect(reveal(page)).toBeVisible();

  await page.reload();

  await expectPrompt(page, PROMPT);
  await expect(page.getByText('You have already solved this task.')).toBeVisible();
  await expect(connectedString(page)).toBeVisible();
  await expect(reveal(page)).toContainText('ONE NAME BEHIND BOTH');
  await expect(stringEnd(page)).toHaveCount(0);
});
