import { expect, test } from '@playwright/test';
import { expectPrompt, nextTask, openFirstTask, picker, scan } from './helpers';

// This project's browser has no camera, so switching the scanner on can only fail.

test('falls back to the card list when the camera cannot be used', async ({ page }) => {
  await openFirstTask(page);
  await expect(picker(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'TURN ON SCANNER' }).click();

  await expect(page.getByRole('status')).toContainText('Choose your card from the list instead');
  await scan(page, 'Savings Account');
  await expect(page.getByRole('status')).toContainText('A savings account lets Ananya');
});

test('asks the scanner question once, then remembers the answer', async ({ page }) => {
  await openFirstTask(page);
  await page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' }).click();
  await scan(page, 'Savings Account');
  await nextTask(page);

  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');
  await expect(picker(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Switch on the evidence scanner?' })).toHaveCount(
    0,
  );

  await page.reload();
  await expect(picker(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try the scanner' })).toBeVisible();
});

test('tells the player when a scanned card is not one of the choices', async ({ page }) => {
  await page.goto('/?debug=1');
  const panel = page.getByRole('complementary', { name: 'Debug panel' });
  await panel.getByLabel('Jump to task').selectOption('l1-t2-verify-identity');
  await panel.getByRole('button', { name: 'Jump' }).click();
  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');

  await panel.getByLabel('Inject artefact scan').selectOption('slip-deposit');
  await panel.getByRole('button', { name: 'Inject scan' }).click();

  await expect(page.getByRole('status')).toContainText('not one of the choices');
  await expect(page.getByText('0 of 2 verified')).toBeVisible();
});
