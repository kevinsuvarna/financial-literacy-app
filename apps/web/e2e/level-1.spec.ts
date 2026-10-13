import { expect, test, type Page } from '@playwright/test';
import { expectPrompt, nextTask, nextTaskButton, picker, scan, startGame } from './helpers';

const TASK_1 = 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?';
const TASK_2 = 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?';
const TASK_3 = 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?';

function slot(page: Page, title: string) {
  return page.getByRole('listitem').filter({ hasText: title });
}

async function reachTask2(page: Page) {
  await startGame(page);
  await scan(page, 'Savings Account');
  await nextTask(page);
  await expectPrompt(page, TASK_2);
}

async function reachTask3(page: Page) {
  await reachTask2(page);
  await scan(page, 'PAN Card');
  await scan(page, 'Aadhaar Card');
  await nextTask(page);
  await expectPrompt(page, TASK_3);
}

test.describe('Task 1 — identify the account', () => {
  test('every wrong card explains itself, wobbles, and leaves the task open', async ({ page }) => {
    await startGame(page);
    await expectPrompt(page, TASK_1);

    const wrongCards = [
      ['Current Account', 'A current account is for frequent business transactions'],
      ['Fixed Deposit Account', 'A fixed deposit locks money away'],
      ['Recurring Deposit Account', 'A recurring deposit needs regular fixed payments'],
    ] as const;

    for (const [card, explanation] of wrongCards) {
      await scan(page, card);
      const feedback = page.getByRole('status');
      await expect(feedback).toContainText(explanation);
      await expect(feedback).toHaveClass(/animate-wobble/);
      await expect(nextTaskButton(page)).toHaveCount(0);
      await expect(page.getByText('CORRECT', { exact: true })).toHaveCount(0);
      // Retry is simply scanning again: the picker is still there.
      await expect(picker(page)).toBeVisible();
    }
  });

  test('the same wrong card scanned twice is counted twice', async ({ page }) => {
    // ?debug=1 is remembered for the tab, so the panel is still there after the intro.
    await page.goto('/?debug=1');
    await startGame(page);
    const machine = page.getByTestId('debug-machine');

    await scan(page, 'Current Account');
    await expect(machine).toContainText('Attempts1');
    await scan(page, 'Current Account');
    await expect(machine).toContainText('Attempts2');
  });

  test('the right card is stamped CORRECT with an explanation card', async ({ page }) => {
    await startGame(page);
    await scan(page, 'Fixed Deposit Account');
    await scan(page, 'Savings Account');

    await expect(page.getByText('CORRECT', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'A savings account lets Ananya keep her money in the bank',
    );
    await expect(slot(page, 'Your answer')).toContainText('Savings Account');
    await expect(picker(page)).toHaveCount(0);
    await expect(nextTaskButton(page)).toBeVisible();
  });
});

test.describe('Task 2 — verify identity', () => {
  const orders = [
    ['PAN Card', 'Aadhaar Card'],
    ['Aadhaar Card', 'PAN Card'],
  ] as const;

  for (const [first, second] of orders) {
    test(`fills both slots when ${first} is scanned before ${second}`, async ({ page }) => {
      await reachTask2(page);
      await expect(slot(page, 'Document 1')).toContainText('Waiting for a scan');
      await expect(slot(page, 'Document 2')).toContainText('Waiting for a scan');

      // One of two: the first slot fills, the task stays open.
      await scan(page, first);
      await expect(slot(page, 'Document 1')).toContainText(first);
      await expect(slot(page, 'Document 1')).toContainText('VERIFIED');
      await expect(slot(page, 'Document 2')).toContainText('Waiting for a scan');
      await expect(page.getByText('1 of 2 verified')).toBeVisible();
      await expect(nextTaskButton(page)).toHaveCount(0);

      // Scanning it again changes nothing.
      await scan(page, first);
      await expect(page.getByRole('status')).toHaveText(`${first} is already verified.`);
      await expect(page.getByText('1 of 2 verified')).toBeVisible();

      await scan(page, second);
      await expect(slot(page, 'Document 1')).toContainText(first);
      await expect(slot(page, 'Document 2')).toContainText(second);
      await expect(slot(page, 'Document 2')).toContainText('VERIFIED');
      await expect(page.getByText('2 of 2 verified')).toBeVisible();
      await expect(page.getByRole('status')).toContainText('Identity verified!');
      await expect(nextTaskButton(page)).toBeVisible();
    });
  }

  test('wrong documents are explained and never fill a slot', async ({ page }) => {
    await reachTask2(page);

    await scan(page, 'Expired Passport');
    await expect(page.getByRole('status')).toContainText(
      'An expired passport is no longer a valid proof of identity',
    );
    await expect(page.getByRole('status')).toHaveClass(/animate-wobble/);
    await expect(page.getByText('0 of 2 verified')).toBeVisible();

    // A wrong document between the two right ones doesn't disturb the one already verified.
    await scan(page, 'PAN Card');
    await scan(page, 'Library Card');
    await expect(page.getByRole('status')).toContainText(
      'A library card isn’t issued by the government',
    );
    await expect(slot(page, 'Document 1')).toContainText('PAN Card');
    await expect(slot(page, 'Document 2')).toContainText('Waiting for a scan');
    await expect(nextTaskButton(page)).toHaveCount(0);

    await scan(page, 'Aadhaar Card');
    await expect(page.getByRole('status')).toContainText('Identity verified!');
  });
});

test.describe('Task 3 and finishing the level', () => {
  test('the deposit slip is wrong; the withdrawal slip completes Level 1', async ({ page }) => {
    await reachTask3(page);

    await scan(page, 'Deposit Slip');
    await expect(page.getByRole('status')).toContainText(
      'A deposit slip is used to put money into an account',
    );
    await expect(page.getByRole('button', { name: 'FINISH LEVEL' })).toHaveCount(0);

    await scan(page, 'Withdrawal Slip');
    await expect(page.getByRole('status')).toContainText(
      'a withdrawal slip is used to request money out',
    );
    // The last task of a level offers the level-complete beat, not a plain "next task".
    await expect(nextTaskButton(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'FINISH LEVEL' }).click();

    await expectPrompt(page, 'LEVEL 1 COMPLETE');
    await expect(page.getByRole('heading', { level: 1, name: 'LEVEL 1 COMPLETE' })).toBeFocused();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Understand the Account' }),
    ).toBeVisible();
    await expect(
      page.getByText(/verified her identity with her PAN card and Aadhaar card/),
    ).toBeVisible();

    const tracker = page.getByRole('navigation', { name: 'Mission progress' });
    await expect(
      tracker.getByRole('button', { name: 'Follow the Money, task 1 of 3 — Available' }),
    ).toBeEnabled();

    await page.getByRole('button', { name: 'START LEVEL 2: Follow the Money' }).click();
    await expectPrompt(page, 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?');
  });

  test('reloading on the level-complete screen loses nothing', async ({ page }) => {
    await reachTask3(page);
    await scan(page, 'Withdrawal Slip');
    await page.getByRole('button', { name: 'FINISH LEVEL' }).click();
    await expectPrompt(page, 'LEVEL 1 COMPLETE');

    await page.reload();

    // Back on the solved task, now in review — which goes straight on, with no second fanfare.
    await expectPrompt(page, TASK_3);
    await expect(page.getByText('You have already solved this task.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'FINISH LEVEL' })).toHaveCount(0);
    await nextTask(page);
    await expectPrompt(page, 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?');
  });
});
