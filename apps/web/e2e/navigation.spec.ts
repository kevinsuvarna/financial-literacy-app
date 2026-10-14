import { expect, test } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTaskButton, scan, startGame } from './helpers';

test('sends a player who has not started back to the start screen', async ({ page }) => {
  for (const path of ['/play', '/board', '/certificate', '/nowhere']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'START TRAINING' })).toBeVisible();
  }
});

test('resumes from the Case Board and reviews a solved task without changing progress', async ({
  page,
}) => {
  await startGame(page);
  await scan(page, 'Current Account');
  await expect(page.getByRole('status')).toContainText('current account');
  await expect(nextTaskButton(page)).toHaveCount(0);
  await scan(page, 'Savings Account');

  await page.getByRole('link', { name: 'Case Board' }).click();
  await expectPrompt(page, 'CASE BOARD');
  await expect(page.getByRole('button', { name: 'LOCKED: Follow the Money' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'LOCKED: Secure & Report' })).toBeDisabled();
  await expect(page.getByText('1 of 3 tasks solved')).toBeVisible();

  // Resume lands on the first unsolved task, not the one already solved.
  await page.getByRole('button', { name: 'RESUME: Understand the Account' }).click();
  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');

  // The tracker can't reach a locked task, but can reopen a solved one for review.
  const tracker = page.getByRole('navigation', { name: 'Mission progress' });
  await expect(
    tracker.getByRole('button', { name: /^Follow the Money, task 1 of 3/ }),
  ).toBeDisabled();
  await tracker
    .getByRole('button', { name: 'Understand the Account, task 1 of 3 — Completed' })
    .click();

  await expectPrompt(page, 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?');
  await expect(page.getByText('You have already solved this task.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Simulated scanner' })).toHaveCount(0);
  await expect(
    tracker.getByRole('button', { name: 'Understand the Account, task 2 of 3 — In progress' }),
  ).toBeVisible();
});

test('leaving a level part-way and resuming it from the Case Board — even after closing the tab', async ({
  page,
  context,
}) => {
  // Into Level 2, with its first task solved and a wrong try on the second.
  await jumpToTask(page, 'l2-t2-returned-cheque');
  await expectPrompt(page, 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?');
  for (const detail of ['Date', 'Signature', 'Cheque Number']) {
    await page.getByRole('button', { name: new RegExp(`^${detail}:`) }).click();
  }
  await expect(page.getByText('Hint: take another look at the amount.')).toBeVisible();

  // Leave the level for the Case Board: it shows where things stand.
  await page.getByRole('link', { name: 'Case Board' }).click();
  await expectPrompt(page, 'CASE BOARD');
  await expect(page.getByRole('button', { name: 'REPLAY: Understand the Account' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'RESUME: Follow the Money' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'LOCKED: Secure & Report' })).toBeDisabled();
  await expect(page.getByText('1 of 3 tasks solved')).toBeVisible();

  // Close the tab. Come back later, in a new one.
  await page.close();
  const later = await context.newPage();
  await later.goto('/');
  await expect(later.getByRole('link', { name: 'RESUME CASE' })).toBeVisible();
  await later.goto('/board');
  await later.getByRole('button', { name: 'RESUME: Follow the Money' }).click();

  // Back at the task that was left unsolved, exactly as it was left: three tries in, hinted.
  await expectPrompt(later, 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?');
  await expect(later.getByText('You have already solved this task.')).toHaveCount(0);
  await expect(later.getByText('Hint: take another look at the amount.')).toBeVisible();
  await expect(
    later.getByTestId('cheque-face').locator('[data-zone="amount-figures"]'),
  ).toHaveClass(/animate-glow/);

  // And it carries on from there.
  await later.getByRole('button', { name: /^Amount in Figures:/ }).click();
  await expect(later.getByText('MISMATCH', { exact: true })).toBeVisible();
  await expect(nextTaskButton(later)).toBeVisible();
});

test('debug panel jumps to a task, injects a scan and resets', async ({ page }) => {
  await page.goto('/?debug=1');
  const panel = page.getByRole('complementary', { name: 'Debug panel' });
  await expect(panel.getByTestId('debug-machine')).toContainText('notStarted');

  await panel.getByLabel('Jump to task').selectOption('l3-t4-scan-evidence');
  await panel.getByRole('button', { name: 'Jump' }).click();
  await expectPrompt(page, 'SCAN EVIDENCE');
  await expect(panel.getByTestId('debug-machine')).toContainText('inGame');

  await panel.getByLabel('Inject artefact scan').selectOption('bank-statement');
  await panel.getByRole('button', { name: 'Inject scan' }).click();
  await expect(page.getByText('1 of 2 attached')).toBeVisible();
  await expect(panel.getByTestId('debug-scanner')).toContainText('bank-statement via debug');

  await panel.getByRole('button', { name: 'Reset game' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(panel.getByTestId('debug-machine')).toContainText('notStarted');
});
