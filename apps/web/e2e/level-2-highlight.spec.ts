import { expect, test, type Page } from '@playwright/test';
import { expectPrompt } from './helpers';

const PROMPT = 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?';

function row(page: Page, name: RegExp) {
  return page.getByRole('row', { name });
}

const atmRow = (page: Page) => row(page, /ATM Withdrawal/);
const camsTelRow = (page: Page) => row(page, /CAMS TEL/);
const tray = (page: Page) => page.getByRole('region', { name: 'Evidence tray' });

/** Jumps to Level 2 Task 3 with the debug panel, then closes the panel so it isn't in the way. */
async function openTask(page: Page) {
  await page.goto('/?debug=1');
  const panel = page.getByRole('complementary', { name: 'Debug panel' });
  await panel.getByLabel('Jump to task').selectOption('l2-t3-suspicious-transaction');
  await panel.getByRole('button', { name: 'Jump' }).click();
  await page.goto('/play?debug=0');
  await expectPrompt(page, PROMPT);
  await expect(panel).toHaveCount(0);
}

/**
 * Picks the highlighter up with the mouse and carries its tip (its left edge) to the middle of
 * a row. Leaves the mouse button down so a test can look at the mid-drag state.
 */
async function carryHighlighterTo(page: Page, target: ReturnType<typeof row>) {
  await target.scrollIntoViewIfNeeded();
  const pen = await page.getByTestId('highlighter').boundingBox();
  const box = await target.boundingBox();
  if (!pen || !box) throw new Error('highlighter or row not found');

  const grab = { x: pen.x + pen.width / 2, y: pen.y + pen.height / 2 };
  const tip = { x: pen.x + 6, y: grab.y };
  const dx = box.x + box.width / 2 - tip.x;
  const dy = box.y + box.height / 2 - tip.y;

  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + dx / 2, grab.y + dy / 2, { steps: 8 });
  await page.mouse.move(grab.x + dx, grab.y + dy, { steps: 8 });
}

async function dropHighlighterOn(page: Page, target: ReturnType<typeof row>) {
  await carryHighlighterTo(page, target);
  await page.mouse.up();
}

test('dragging the highlighter: a wrong row, then the suspicious one', async ({ page }) => {
  await openTask(page);
  await expect(tray(page)).toContainText('No clues filed yet.');

  // Mid-drag, the row under the tip is the one that would be marked.
  await carryHighlighterTo(page, atmRow(page));
  await expect(atmRow(page)).toHaveAttribute('data-target', 'true');
  await expect(camsTelRow(page)).toHaveAttribute('data-target', 'false');
  await page.mouse.up();

  // Wrong row: a sticky note says why, and the ink wears off.
  const note = page.getByRole('status');
  await expect(note).toHaveText('A normal ATM withdrawal. Keep investigating.');
  const fadingInk = page.locator('[data-ink="fading"] path');
  await expect(fadingInk).toHaveCount(1);
  await expect(fadingInk).toHaveCSS('opacity', '0', { timeout: 5000 });
  await expect(page.getByText('CLUE', { exact: true })).toHaveCount(0);
  await expect(tray(page)).toContainText('No clues filed yet.');
  await expect(page.getByRole('button', { name: 'FINISH LEVEL' })).toHaveCount(0);

  // The highlighter went back to its place, ready to be used again.
  await dropHighlighterOn(page, camsTelRow(page));

  // Correct row: pinned as a clue, inked for good, and filed in the evidence tray.
  await expect(camsTelRow(page).getByText('CLUE', { exact: true })).toBeVisible();
  await expect(page.locator('[data-ink="set"]')).toHaveCount(1);
  await expect(page.locator('[data-ink="fading"]')).toHaveCount(0);
  await expect(tray(page)).toContainText('Mobile Recharge — CAMS TEL');
  await expect(tray(page)).toContainText('₹5,999');
  await expect(tray(page)).not.toContainText('No clues filed yet.');

  // The explanation says what SPEC §5 asks for: unrecognised, investigate, not proven fraud.
  const explanation = page.getByRole('status');
  await expect(explanation).toContainText('Ananya doesn’t recognise this');
  await expect(explanation).toContainText('worth investigating further');
  await expect(explanation).toContainText('not proof of fraud');
  await expect(page.getByText('A normal ATM withdrawal.')).toHaveCount(0);

  await page.getByRole('button', { name: 'FINISH LEVEL' }).click();
  await expectPrompt(page, 'LEVEL 2 COMPLETE');
});

test('dropping the highlighter away from the statement marks nothing', async ({ page }) => {
  await openTask(page);
  const pen = await page.getByTestId('highlighter').boundingBox();
  if (!pen) throw new Error('highlighter not found');

  await page.mouse.move(pen.x + pen.width / 2, pen.y + pen.height / 2);
  await page.mouse.down();
  await page.mouse.move(pen.x + pen.width / 2, pen.y - 60, { steps: 6 });
  await page.mouse.up();

  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.locator('[data-ink]')).toHaveCount(0);
});

test('keyboard: arrow keys move between rows and Enter marks', async ({ page }) => {
  await openTask(page);
  const rows = {
    pocketMoney: row(page, /Pocket Money/),
    atm: atmRow(page),
    chequeIssued: row(page, /Cheque Issued/),
    chequeReturned: row(page, /Cheque Returned/),
    camsTel: camsTelRow(page),
    grocery: row(page, /Grocery/),
  };

  // The statement is one tab stop: only the first transaction is in the tab order, and the
  // opening balance — which can't be marked — is not focusable at all.
  await expect(rows.pocketMoney).toHaveAttribute('tabindex', '0');
  await expect(rows.atm).toHaveAttribute('tabindex', '-1');
  await expect(row(page, /Opening balance/)).not.toHaveAttribute('tabindex');
  await rows.pocketMoney.focus();
  await expect(rows.pocketMoney).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(rows.atm).toBeFocused();
  await page.keyboard.press('End');
  await expect(rows.grocery).toBeFocused();
  await page.keyboard.press('ArrowDown'); // already at the end
  await expect(rows.grocery).toBeFocused();
  await page.keyboard.press('Home');
  await expect(rows.pocketMoney).toBeFocused();

  // Enter on a wrong row.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(rows.chequeIssued).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('This is the cheque Ananya issued');
  // The row keeps focus, so the player can carry straight on.
  await expect(rows.chequeIssued).toBeFocused();

  // Space works too, and the note moves to the newly marked row.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toContainText('This is the cheque being returned');
  await expect(page.getByText('This is the cheque Ananya issued')).toHaveCount(0);

  await page.keyboard.press('ArrowDown');
  await expect(rows.camsTel).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(rows.camsTel.getByText('CLUE', { exact: true })).toBeVisible();
  await expect(tray(page)).toContainText('₹5,999');
  await expect(page.getByRole('status')).toContainText('not proof of fraud');
});

test('a solved task reopens with the clue filed and nothing left to mark', async ({ page }) => {
  await openTask(page);
  await camsTelRow(page).focus();
  await page.keyboard.press('Enter');
  await expect(tray(page)).toContainText('₹5,999');

  await page.reload();

  await expectPrompt(page, PROMPT);
  await expect(page.getByText('You have already solved this task.')).toBeVisible();
  await expect(camsTelRow(page).getByText('CLUE', { exact: true })).toBeVisible();
  await expect(tray(page)).toContainText('Mobile Recharge — CAMS TEL');

  // Review never changes progress: marking another row does nothing.
  await dropHighlighterOn(page, atmRow(page));
  await expect(page.locator('[data-ink="fading"]')).toHaveCount(0);
  await expect(page.locator('[data-ink="set"]')).toHaveCount(1);
});
