import { expect, test, type Page } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTask, nextTaskButton, picker, scan } from './helpers';

const PROMPT = 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?';

const statement = (page: Page) => page.getByRole('table', { name: 'Bank statement' });
const hint = (page: Page) => page.getByRole('status').filter({ hasText: /^Hint/ });
const feedback = (page: Page) => page.getByRole('status').filter({ hasNotText: /^Hint/ });
const working = (page: Page) => page.getByRole('region', { name: 'How the balance adds up' });

async function openTask(page: Page) {
  await jumpToTask(page, 'l2-t1-closing-balance');
  await expectPrompt(page, PROMPT);
  await page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' }).click();
  await expect(picker(page)).toBeVisible();
}

test('shows the statement to read in a table scene, with the three answer cards', async ({
  page,
}) => {
  await openTask(page);

  // Scanning happens at the case table (CLAUDE.md rule 4).
  await expect(page.getByRole('region', { name: 'Case table' })).toBeVisible();

  // Header, opening balance, and seven transactions — but no closing balance to copy.
  await expect(statement(page).getByRole('row')).toHaveCount(9);
  await expect(statement(page).getByRole('row', { name: /Opening balance/ })).toContainText(
    '₹12,450',
  );
  await expect(statement(page).getByRole('row', { name: /CAMS TEL/ })).toContainText('₹5,999');
  await expect(statement(page)).not.toContainText('7,501');
  await expect(statement(page)).not.toContainText(/closing/i);

  await expect(picker(page).getByRole('button')).toHaveText(['₹7,501', '₹13,500', '₹4,001']);
  await expect(hint(page)).toHaveCount(0);
});

test('each wrong card explains itself and the hints escalate', async ({ page }) => {
  await openTask(page);

  await scan(page, '₹13,500');
  await expect(feedback(page)).toContainText(
    'did you remember to subtract the Mobile Recharge payment to CAMS TEL?',
  );
  await expect(hint(page)).toContainText('Hint 1 of 3');
  await expect(hint(page)).toContainText('Start from the opening balance');

  await scan(page, '₹4,001');
  await expect(feedback(page)).toContainText('the returned cheque put that money back');
  await expect(hint(page)).toContainText('Hint 2 of 3');
  await expect(hint(page)).toContainText('keeping a running total');

  // The last hint sets the sum up with the statement's own totals…
  await scan(page, '₹4,001');
  await expect(hint(page)).toContainText('Hint 3 of 3');
  await expect(hint(page)).toContainText('money in comes to ₹6,500');
  await expect(hint(page)).toContainText('money out comes to ₹11,449');
  await expect(hint(page)).toContainText('start from ₹12,450');

  // …and further mistakes stay on it rather than running out of hints or giving the answer.
  await scan(page, '₹13,500');
  await expect(hint(page)).toContainText('Hint 3 of 3');
  await expect(hint(page)).not.toContainText('7,501');

  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(working(page)).toHaveCount(0);
  await expect(picker(page)).toBeVisible();
});

test('the right card explains that money in raises the balance and money out lowers it', async ({
  page,
}) => {
  await openTask(page);
  await scan(page, '₹13,500');
  await scan(page, '₹7,501');

  await expect(page.getByText('CORRECT', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'That’s right. Money coming in increases the balance, and money going out decreases it.',
  );
  await expect(page.getByRole('listitem').filter({ hasText: 'Your answer' })).toContainText(
    '₹7,501',
  );

  // The working, line by line, from the same figures as the statement.
  const lines = working(page).getByRole('listitem');
  await expect(lines).toHaveCount(4);
  await expect(lines.nth(0)).toHaveText(/Opening balance.*₹12,450/);
  await expect(lines.nth(1)).toHaveText(/\+.*Money in — adds to the balance.*₹6,500/);
  await expect(lines.nth(2)).toHaveText(/−.*Money out — takes away from the balance.*₹11,449/);
  await expect(lines.nth(3)).toHaveText(/=.*Closing balance.*₹7,501/);

  // The hint and the scanner are gone once it is solved.
  await expect(hint(page)).toHaveCount(0);
  await expect(picker(page)).toHaveCount(0);

  await nextTask(page);
  await expectPrompt(page, 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?');
});
