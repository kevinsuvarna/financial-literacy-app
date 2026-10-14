import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectPrompt } from './helpers';

// The whole mission with the keyboard alone: Tab to reach things, Enter to use them, arrow keys
// where a control asks for them, and typing for the passkey. No clicks, no mouse, no taps.
// Every stop on the way must show where focus is.

const MAX_TABS = 120;

const isFocused = (target: Locator) =>
  target.evaluate((element) => element === element.ownerDocument.activeElement);

/** Presses Tab until `target` has focus — the way a keyboard user gets anywhere. */
async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  for (let presses = 0; presses < MAX_TABS; presses += 1) {
    await page.keyboard.press('Tab');
    if (await isFocused(target)) {
      // A focus ring a keyboard user can see.
      await expect(target).toHaveCSS('outline-style', 'solid');
      await expect(target).toHaveCSS('outline-width', '3px');
      return;
    }
  }
  throw new Error(`Tab never reached ${target.toString()}`);
}

/** Tabs to `target` and presses Enter on it. */
async function activate(page: Page, target: Locator) {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}

const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' });
const card = (page: Page, label: string) =>
  page
    .getByRole('group', { name: 'Simulated scanner' })
    .getByRole('button', { name: label, exact: true });

test('the whole mission can be played with the keyboard alone', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');

  // --- The intro. ---
  await activate(page, button(page, 'START TRAINING'));
  await activate(page, button(page, 'Answer the call'));
  await expect(page.getByText('On the line')).toBeVisible();
  await activate(page, button(page, 'SKIP'));
  await activate(page, button(page, 'SEE YOUR ASSIGNMENT'));
  await activate(page, button(page, 'OPEN CASE FILE'));

  // --- Level 1. ---
  await expectPrompt(page, 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?');
  await activate(page, button(page, 'CHOOSE CARDS FROM A LIST'));
  await activate(page, card(page, 'Current Account'));
  await expect(page.getByRole('status')).toContainText('A current account');
  await activate(page, card(page, 'Savings Account'));
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?');
  await activate(page, card(page, 'PAN Card'));
  await activate(page, card(page, 'Aadhaar Card'));
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?');
  await activate(page, card(page, 'Withdrawal Slip'));
  await activate(page, button(page, 'FINISH LEVEL'));
  await expectPrompt(page, 'LEVEL 1 COMPLETE');
  await activate(page, button(page, 'START LEVEL 2: Follow the Money'));

  // --- Level 2. ---
  await expectPrompt(page, 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?');
  await activate(page, card(page, '₹7,501'));
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?');
  await activate(page, button(page, /^Date:/));
  await expect(page.getByRole('status').filter({ hasText: 'looks correct' })).toBeVisible();
  await activate(page, button(page, /^Amount in Figures:/));
  await expect(page.getByText('MISMATCH', { exact: true })).toBeVisible();
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?');
  // Into the statement with Tab, along it with the arrow keys, and Enter to mark.
  await tabTo(page, page.getByRole('row', { name: /Pocket Money from Dad/ }));
  const suspicious = page.getByRole('row', { name: /CAMS TEL/ });
  for (let presses = 0; presses < 10 && !(await isFocused(suspicious)); presses += 1) {
    await page.keyboard.press('ArrowDown');
  }
  await expect(suspicious).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Evidence tray' })).toContainText('₹5,999');
  await activate(page, button(page, 'FINISH LEVEL'));
  await expectPrompt(page, 'LEVEL 2 COMPLETE');
  await activate(page, button(page, 'START LEVEL 3: Secure & Report'));

  // --- Level 3. ---
  await expectPrompt(page, 'SHOULD ANANYA CLICK THE LINK?');
  await activate(page, button(page, 'Answer the call'));
  await activate(page, button(page, 'SKIP'));
  await activate(page, button(page, 'NO — DON’T CLICK THE LINK'));
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'SOMETHING LINKS THESE CLUES. CAN YOU CONNECT THEM?');
  await activate(page, button(page, 'Tie the string to the sender of the message'));
  await expect(page.getByTestId('reveal')).toBeVisible();
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'THREE CLUES HOLD THE PASSKEY');
  // Focus is on the new task's title: the keypad takes typing from there.
  await page.keyboard.type('109');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('terminal-status')).toHaveText('ACCESS GRANTED');
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'SCAN EVIDENCE');
  await activate(page, card(page, "Ananya's Bank Statement"));
  await activate(page, card(page, 'Suspicious Unblock-Card Message'));
  await activate(page, button(page, 'NEXT TASK'));

  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await activate(page, button(page, 'SUBMIT INCIDENT REPORT'));
  await expect(page.getByRole('status')).toContainText('submitted for investigation');
  await activate(page, page.getByRole('link', { name: 'VIEW CERTIFICATE' }));

  // --- The certificate, and back to the board. ---
  await expectPrompt(page, 'MISSION COMPLETE');
  await activate(page, page.getByRole('link', { name: 'BACK TO CASE BOARD' }));
  await expectPrompt(page, 'CASE BOARD');
  await expect(page.getByRole('button', { name: /^REPLAY:/ })).toHaveCount(3);
});

test('a new screen takes focus to its title, so Tab carries on from there', async ({ page }) => {
  await page.goto('/');
  await activate(page, button(page, 'START TRAINING'));
  // The intro's next step: its heading has focus, not the page's top.
  const focusedHeading = page.locator('h1:focus, h2:focus');
  await expect(focusedHeading).toHaveText('Ananya');
  await expect(page.getByText('Incoming call')).toBeVisible();

  await activate(page, button(page, 'Answer the call'));
  await activate(page, button(page, 'SKIP'));
  await activate(page, button(page, 'SEE YOUR ASSIGNMENT'));
  await expect(page.getByRole('heading', { level: 1, name: 'NEW CASE ASSIGNED' })).toBeFocused();
  await activate(page, button(page, 'OPEN CASE FILE'));

  // A new route: the task's title.
  await expect(
    page.getByRole('heading', { level: 1, name: 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?' }),
  ).toBeFocused();

  await activate(page, page.getByRole('link', { name: 'Case Board' }));
  await expect(page.getByRole('heading', { level: 1, name: 'CASE BOARD' })).toBeFocused();
  await activate(page, button(page, 'RESUME: Understand the Account'));
  await expect(
    page.getByRole('heading', { level: 1, name: 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?' }),
  ).toBeFocused();
});
