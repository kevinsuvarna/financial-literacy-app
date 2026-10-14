import { expect, test, type Page } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTask, nextTaskButton } from './helpers';

const PROMPT = 'THREE CLUES HOLD THE PASSKEY';

const terminal = (page: Page) => page.getByTestId('terminal');
const screen = (page: Page) => page.getByRole('group', { name: 'Evidence terminal' });
const status = (page: Page) => page.getByTestId('terminal-status');
/** What the display holds, as a screen reader is told it. */
const readout = (page: Page) => page.getByTestId('passkey-readout');
const hint = (page: Page) => page.getByTestId('terminal-hint');
const lastCode = (page: Page) => page.getByTestId('last-code');
const lights = (page: Page) => lastCode(page).getByRole('listitem');
const keypad = (page: Page) => page.getByRole('group', { name: 'Keypad' });
const key = (page: Page, digit: string) =>
  keypad(page).getByRole('button', { name: digit, exact: true });
const enterKey = (page: Page) => keypad(page).getByRole('button', { name: 'Enter the passkey' });
const deleteKey = (page: Page) =>
  keypad(page).getByRole('button', { name: 'Delete the last digit' });
const picture = (page: Page) => page.locator('[data-crt="picture"]');
const scanlines = (page: Page) => page.locator('[data-crt="scanlines"]');
const flicker = (page: Page) => page.locator('[data-crt="flicker"]');
const folder = (page: Page) => page.getByTestId('evidence-folder');
const source = (page: Page, document: 'statement' | 'cheque') =>
  page.locator(`[data-reference="${document}"]`);
/** The task's explanation once solved — as opposed to the terminal's own status lines. */
const explanation = (page: Page) => page.locator('p[role="status"]:not([data-testid])');

async function openTask(page: Page) {
  await jumpToTask(page, 'l3-t3-evidence-passkey');
  await expectPrompt(page, PROMPT);
}

/** Types a code on the real keyboard and presses Enter. */
async function typeCode(page: Page, code: string) {
  await page.keyboard.type(code);
  await page.keyboard.press('Enter');
}

test('the terminal boots like an old computer, then asks for the passkey', async ({ page }) => {
  await openTask(page);

  // Warming up: the tube is on, but the terminal isn't asking for anything yet.
  await expect(screen(page)).toBeVisible();
  await expect(status(page)).toHaveCount(0);
  await expect(scanlines(page)).toBeVisible();
  await expect(flicker(page)).toHaveCSS('animation-name', 'crt-flicker');

  // The start-up log prints itself, and ends at the locked folder.
  const log = page.getByTestId('boot-log');
  await expect(log).toContainText('LOTUS VALLEY BANK — EVIDENCE TERMINAL');
  await expect(log).toContainText('MEMORY CHECK ........ OK');
  await expect(log).toContainText('EVIDENCE FOLDER ........ LOCKED', { timeout: 10_000 });

  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(screen(page)).toContainText(PROMPT);
  await expect(readout(page)).toHaveText('Passkey display: blank, blank, blank');
  await expect(page.getByText('Evidence folder: LOCKED')).toBeVisible();
  await expect(folder(page)).toHaveAttribute('data-state', 'locked');

  // The clues' documents are on hand, and nothing is pointed at yet.
  await expect(source(page, 'statement')).toContainText('Mobile Recharge — CAMS TEL');
  await expect(source(page, 'cheque')).toContainText('Greenfield Public School');
  await expect(page.locator('[data-pointed]')).toHaveCount(0);

  // No way on without the passkey — and nowhere on the page to type anything but its digits.
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(page.locator('input, textarea, select, [contenteditable]')).toHaveCount(0);
});

test('the keypad takes digits and nothing else, from its keys or the keyboard', async ({
  page,
}) => {
  await openTask(page);

  // Pressing a key is enough to skip the rest of the warm-up.
  await key(page, '4').click();
  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(readout(page)).toHaveText('Passkey display: 4, blank, blank');
  await expect(enterKey(page)).toBeDisabled();

  // Letters and symbols have no key. Digits from the keyboard land beside the keypad's.
  // (No space in there: the "4" key still has focus, and Space presses a focused button.)
  await page.keyboard.type('abc-.!');
  await expect(readout(page)).toHaveText('Passkey display: 4, blank, blank');
  await page.keyboard.type('x0y');
  await expect(readout(page)).toHaveText('Passkey display: 4, 0, blank');

  // Enter does nothing until the display is full.
  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(hint(page)).toHaveCount(0);

  // A full display ignores further digits rather than overwriting.
  await key(page, '7').click();
  await expect(enterKey(page)).toBeEnabled();
  await page.keyboard.type('99');
  await expect(readout(page)).toHaveText('Passkey display: 4, 0, 7');

  // DEL and Backspace take off one digit; Escape clears the display.
  await deleteKey(page).click();
  await expect(readout(page)).toHaveText('Passkey display: 4, 0, blank');
  await page.keyboard.press('Backspace');
  await expect(readout(page)).toHaveText('Passkey display: 4, blank, blank');
  await page.keyboard.type('12');
  await page.keyboard.press('Escape');
  await expect(readout(page)).toHaveText('Passkey display: blank, blank, blank');

  // None of that was an attempt.
  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(lastCode(page)).toHaveCount(0);
});

test('wrong codes: ACCESS DENIED with a shake and escalating hints, then the right code unlocks the folder', async ({
  page,
}) => {
  await openTask(page);

  // --- Wrong code 1, on the keypad: denied, a shake, and a reminder of the order. ---
  await key(page, '0').click();
  await key(page, '0').click();
  await key(page, '0').click();
  await expect(readout(page)).toHaveText('Passkey display: 0, 0, 0');
  await enterKey(page).click();

  await expect(status(page)).toHaveText('ACCESS DENIED');
  await expect(picture(page)).toHaveCSS('animation-name', 'shake');
  await expect(hint(page)).toHaveAttribute('data-stage', 'order');
  await expect(hint(page)).toContainText('HINT 1 OF 3');
  await expect(hint(page)).toContainText(
    'Check the order: the closing balance first, then the amount on the cheque, then the suspicious transaction.',
  );
  // The display is cleared for another go; the last code is shown, with no lights yet.
  await expect(readout(page)).toHaveText('Passkey display: blank, blank, blank');
  await expect(lights(page)).toHaveText([/^0/, /^0/, /^0/]);
  await expect(lastCode(page).locator('[data-light]')).toHaveCount(0);
  await expect(page.locator('[data-pointed]')).toHaveCount(0);
  await expect(folder(page)).toHaveAttribute('data-state', 'locked');
  await expect(nextTaskButton(page)).toHaveCount(0);

  // --- Wrong code 2, on the keyboard: a light for each digit. ---
  await typeCode(page, '190');

  await expect(status(page)).toHaveText('ACCESS DENIED');
  // A second jolt, not the first one left over.
  await expect(picture(page)).toHaveCSS('animation-name', 'shake-again');
  await expect(hint(page)).toHaveAttribute('data-stage', 'lights');
  await expect(hint(page)).toContainText('HINT 2 OF 3');
  await expect(hint(page)).toContainText('Green: right digit, right place.');
  await expect(lights(page).nth(0)).toHaveAttribute('data-grade', 'match');
  await expect(lights(page).nth(1)).toHaveAttribute('data-grade', 'misplaced');
  await expect(lights(page).nth(2)).toHaveAttribute('data-grade', 'misplaced');
  // Each light says what it means in words, not only in colour.
  await expect(lights(page)).toHaveText([
    /first digit, 1: right digit, right place/,
    /second digit, 9: in the passkey, but in a different place/,
    /third digit, 0: in the passkey, but in a different place/,
  ]);
  await expect(lastCode(page).locator('[data-light]')).toHaveText(['✓', '↔', '↔', '✓', '↔', '✕']);

  // Typing again puts the prompt back; the hint and the lights stay to work from.
  await page.keyboard.type('1');
  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(hint(page)).toContainText('HINT 2 OF 3');
  await page.keyboard.press('Backspace');

  // --- Wrong code 3: the document behind the digit that is still wrong. ---
  await typeCode(page, '129');

  await expect(hint(page)).toHaveAttribute('data-stage', 'source');
  await expect(hint(page)).toContainText('HINT 3 OF 3');
  await expect(hint(page)).toContainText('The second digit is not right yet.');
  await expect(hint(page)).toContainText('Look at the amount on the cheque again.');
  await expect(lights(page).nth(0)).toHaveAttribute('data-grade', 'match');
  await expect(lights(page).nth(1)).toHaveAttribute('data-grade', 'miss');
  await expect(lights(page).nth(2)).toHaveAttribute('data-grade', 'match');
  await expect(source(page, 'cheque')).toHaveAttribute('data-pointed', 'true');
  await expect(source(page, 'cheque')).toContainText('LOOK HERE');
  await expect(source(page, 'statement')).not.toHaveAttribute('data-pointed');

  await screen(page).getByRole('button', { name: 'SHOW ME THE CHEQUE' }).click();
  await expect(source(page, 'cheque')).toBeFocused();
  await expect(source(page, 'cheque')).toBeInViewport();

  // --- Wrong code 4: a different digit, so a different document. Still the last hint. ---
  await typeCode(page, '108');

  await expect(hint(page)).toContainText('HINT 3 OF 3');
  await expect(hint(page)).toContainText('The third digit is not right yet.');
  await expect(hint(page)).toContainText('the Mobile Recharge to CAMS TEL');
  await expect(source(page, 'statement')).toHaveAttribute('data-pointed', 'true');
  await expect(source(page, 'cheque')).not.toHaveAttribute('data-pointed');
  await expect(
    screen(page).getByRole('button', { name: 'SHOW ME THE BANK STATEMENT' }),
  ).toBeVisible();

  // Four wrong codes and every hint later, the terminal has still not shown the passkey.
  await expect(terminal(page)).not.toContainText('109');
  await expect(hint(page).locator('p').last()).not.toContainText(/\d/);
  await expect(nextTaskButton(page)).toHaveCount(0);

  // --- The right code. ---
  await typeCode(page, '109');

  await expect(status(page)).toHaveText('ACCESS GRANTED');
  await expect(readout(page)).toHaveText('Passkey display: 1, 0, 9');
  await expect(page.getByTestId('boot-log')).toContainText('EVIDENCE FOLDER ........ UNLOCKED');
  await expect(folder(page)).toHaveAttribute('data-state', 'unlocked');
  await expect(page.getByText('Evidence folder: UNLOCKED')).toBeVisible();
  // The explanation waits for the folder to finish opening.
  await expect(nextTaskButton(page)).toHaveCount(0);
  await expect(folder(page).locator('[data-state="open"]')).toBeVisible();

  await expect(nextTaskButton(page)).toBeVisible();
  await expect(explanation(page)).toHaveText(
    'Unlocked! You’ve connected the key clues in this case.',
  );
  await expect(page.getByText('CORRECT', { exact: true })).toBeVisible();
  // The hints are done with, and the keypad is dead.
  await expect(hint(page)).toHaveCount(0);
  await expect(lastCode(page)).toHaveCount(0);
  await expect(page.locator('[data-pointed]')).toHaveCount(0);
  await expect(key(page, '5')).toBeDisabled();
  await page.keyboard.type('000');
  await expect(readout(page)).toHaveText('Passkey display: 1, 0, 9');

  await nextTask(page);
  await expectPrompt(page, 'SCAN EVIDENCE');
});

test('the right code first time: ACCESS GRANTED, with no hints along the way', async ({ page }) => {
  await openTask(page);

  // Keypad and keyboard together: click a key, type the rest, press Enter. The "1" key still
  // has focus, but with the display full Enter tries the passkey rather than pressing "1".
  await key(page, '1').click();
  await page.keyboard.type('09');
  await expect(readout(page)).toHaveText('Passkey display: 1, 0, 9');
  await page.keyboard.press('Enter');

  await expect(status(page)).toHaveText('ACCESS GRANTED');
  await expect(picture(page)).toHaveCSS('animation-name', 'none');
  await expect(folder(page)).toHaveAttribute('data-state', 'unlocked');
  await expect(hint(page)).toHaveCount(0);
  await expect(nextTaskButton(page)).toBeVisible();
});

test('a wrong code and its hint are still there after a reload; so is an unlocked folder', async ({
  page,
}) => {
  await openTask(page);
  await typeCode(page, '000');
  await typeCode(page, '901');
  await expect(hint(page)).toContainText('HINT 2 OF 3');

  await page.reload();

  // The terminal boots again and picks up where it was — without shaking at an old mistake.
  await expect(status(page)).toHaveText('ACCESS DENIED', { timeout: 10_000 });
  await expect(picture(page)).toHaveCSS('animation-name', 'none');
  await expect(hint(page)).toContainText('HINT 2 OF 3');
  await expect(lights(page)).toHaveText([/^9/, /^0/, /^1/]);
  await expect(lights(page).nth(1)).toHaveAttribute('data-grade', 'match');

  await typeCode(page, '109');
  await expect(nextTaskButton(page)).toBeVisible();

  await page.reload();

  await expectPrompt(page, PROMPT);
  await expect(page.getByText('You have already solved this task.')).toBeVisible();
  await expect(status(page)).toHaveText('ACCESS GRANTED');
  await expect(folder(page)).toHaveAttribute('data-state', 'unlocked');
  // The code itself was never kept: the display has nothing to show but that there was one.
  await expect(readout(page)).toHaveText('Passkey display: hidden, hidden, hidden');
  await expect(terminal(page)).not.toContainText('109');
  await expect(nextTaskButton(page)).toBeVisible();
});

test('with reduced motion: no scanlines, no flicker, no boot sequence, no shake', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openTask(page);

  // Ready at once.
  await expect(status(page)).toHaveText('ENTER PASSKEY');
  await expect(page.getByTestId('boot-log')).toContainText('EVIDENCE FOLDER ........ LOCKED');
  await expect(scanlines(page)).toBeHidden();
  await expect(flicker(page)).toHaveCSS('animation-name', 'none');

  // Denied is still said, and the hint still given — the picture just doesn't jump.
  await typeCode(page, '000');
  await expect(status(page)).toHaveText('ACCESS DENIED');
  await expect(picture(page)).toHaveCSS('animation-name', 'none');
  await expect(hint(page)).toContainText('HINT 1 OF 3');

  // And the way forward doesn't wait on an animation that isn't playing.
  await typeCode(page, '109');
  await expect(status(page)).toHaveText('ACCESS GRANTED');
  await expect(folder(page)).toHaveAttribute('data-state', 'unlocked');
  await expect(nextTaskButton(page)).toBeVisible();
});
