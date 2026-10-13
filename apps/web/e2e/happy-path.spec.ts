import { expect, test } from '@playwright/test';
import { expectPrompt, nextTask, nextTaskButton, scan, startGame } from './helpers';

test('plays the whole mission from the start screen to the certificate', async ({ page }) => {
  await startGame(page);
  await expect(page.getByRole('complementary', { name: 'Debug panel' })).toHaveCount(0);

  // Level 1 — Understand the Account
  await expectPrompt(page, 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?');
  await expect(nextTaskButton(page)).toHaveCount(0);
  await scan(page, 'Savings Account');
  await expect(page.getByRole('status')).toContainText('A savings account lets Ananya');
  await nextTask(page);

  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');
  await scan(page, 'Aadhaar Card');
  await expect(page.getByText('1 of 2 verified')).toBeVisible();
  await expect(nextTaskButton(page)).toHaveCount(0);
  await scan(page, 'PAN Card');
  await nextTask(page);

  await expectPrompt(page, 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?');
  await scan(page, 'Withdrawal Slip');
  await page.getByRole('button', { name: 'FINISH LEVEL' }).click();
  await expectPrompt(page, 'LEVEL 1 COMPLETE');
  await page.getByRole('button', { name: 'START LEVEL 2: Follow the Money' }).click();

  // Level 2 — Follow the Money
  await expectPrompt(page, 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?');
  await expect(page.getByRole('table')).toContainText('Mobile Recharge — CAMS TEL');
  await scan(page, '₹7,501');
  await nextTask(page);

  await expectPrompt(page, 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?');
  await page.getByRole('button', { name: /^Amount in Figures:/ }).click();
  await expect(page.getByRole('status')).toContainText('don’t match');
  await nextTask(page);

  await expectPrompt(page, 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?');
  await page.getByRole('row', { name: /CAMS TEL/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Evidence tray' })).toContainText('₹5,999');
  await page.getByRole('button', { name: 'FINISH LEVEL' }).click();
  await expectPrompt(page, 'LEVEL 2 COMPLETE');
  await page.getByRole('button', { name: 'START LEVEL 3: Secure & Report' }).click();

  // Level 3 — Secure & Report
  await expectPrompt(page, 'SHOULD ANANYA CLICK THE LINK?');
  await page.getByRole('button', { name: /^NO —/ }).click();
  await nextTask(page);

  await expectPrompt(page, /CAMS TEL keeps coming up/);
  await nextTask(page);

  await expectPrompt(page, 'THREE CLUES HOLD THE PASSKEY');
  await page.getByRole('textbox', { name: 'Three-digit passkey' }).fill('109');
  await page.getByRole('button', { name: 'UNLOCK' }).click();
  await nextTask(page);

  await expectPrompt(page, 'SCAN EVIDENCE');
  await scan(page, "Ananya's Bank Statement");
  await scan(page, 'Suspicious Unblock-Card Message');
  await nextTask(page);

  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  const report = page.getByRole('region', { name: 'Investigation screen' });
  await expect(report).toContainText('Ananya Sharma');
  await expect(report).toContainText('₹5,999');
  await expect(report).toContainText('Suspected fraud');
  await expect(report.getByText('Attached', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'SUBMIT INCIDENT REPORT' }).click();
  await expect(page.getByRole('status')).toContainText('submitted for investigation');

  // Certificate
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();
  await expect(page).toHaveURL(/\/certificate$/);
  await expectPrompt(page, 'MISSION COMPLETE');
  await expect(page.getByText('GOOD JOB, OFFICER!')).toBeVisible();
  await expect(page.getByText('Junior Bank Officer', { exact: true })).toBeVisible();

  // Case Board shows every level completed, and progress survives a reload.
  await page.getByRole('link', { name: 'BACK TO CASE BOARD' }).click();
  await expect(page.getByRole('button', { name: /^REPLAY:/ })).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole('button', { name: /^REPLAY:/ })).toHaveCount(3);

  // Replaying the mission starts over.
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();
  await page.getByRole('button', { name: 'REPLAY MISSION' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'START TRAINING' })).toBeVisible();
});
