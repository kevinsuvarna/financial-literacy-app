import { expect, test } from '@playwright/test';
import { expectPrompt, nextTaskButton, scan, startGame } from './helpers';

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
  await expect(page.getByText('1 of 2 verified')).toBeVisible();
  await expect(panel.getByTestId('debug-scanner')).toContainText('bank-statement via debug');

  await panel.getByRole('button', { name: 'Reset game' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(panel.getByTestId('debug-machine')).toContainText('notStarted');
});
