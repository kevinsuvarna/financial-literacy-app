import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTask, nextTaskButton } from './helpers';

const PROMPT = 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?';
const LOOKS_CORRECT = 'This detail looks correct. Keep investigating.';

/** A field of the cheque, by the start of its name (the name gains "— Checked" once ruled out). */
const zone = (page: Page, label: string) =>
  page.getByRole('button', { name: new RegExp(`^${label}:`) });
/** The same field as printed on the cheque (the main one, not the copy inside the loupe). */
const printed = (page: Page, id: string) =>
  page.getByTestId('cheque-face').locator(`[data-zone="${id}"]`);
const note = (page: Page) => page.getByRole('status').filter({ hasText: LOOKS_CORRECT });
const loupe = (page: Page) => page.getByTestId('loupe');
const redString = (page: Page) => page.getByTestId('red-string');
const stamp = (page: Page) => page.getByText('MISMATCH', { exact: true });

async function openTask(page: Page) {
  await jumpToTask(page, 'l2-t2-returned-cheque');
  await expectPrompt(page, PROMPT);
  // The loupe parks itself under the cheque once the cheque has been measured.
  await expect(page.getByTestId('loupe-copy')).toBeAttached();
}

async function centreOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width };
}

/** Drags the loupe so that its centre sits on the centre of `target`. */
async function dragLoupeOver(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const from = await centreOf(loupe(page));
  const to = await centreOf(target);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 8 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

async function distanceBetween(a: Locator, b: Locator) {
  const [first, second] = [await centreOf(a), await centreOf(b)];
  return Math.hypot(first.x - second.x, first.y - second.y);
}

test('wrong details get a sticky note; after three misses the amount glows; the amount solves it', async ({
  page,
}) => {
  await openTask(page);
  await expect(printed(page, 'amount-figures')).not.toHaveClass(/animate-glow/);

  // Miss 1 and 2: a note names the detail and says it looks fine. No glow yet.
  await zone(page, 'Date').click();
  await expect(note(page)).toContainText('Date');
  await expect(zone(page, 'Date')).toHaveAccessibleName('Date: 08 Jan 2025 — Checked');

  await zone(page, 'Signature').click();
  await expect(note(page)).toContainText('Signature');
  await expect(note(page)).toHaveCount(1);
  await expect(printed(page, 'amount-figures')).not.toHaveClass(/animate-glow/);
  await expect(page.getByText('Hint: take another look at the amount.')).toHaveCount(0);

  // Miss 3: both halves of the amount start to glow, and the nudge is also there as text.
  await zone(page, 'Cheque Number').click();
  await expect(printed(page, 'amount-figures')).toHaveClass(/animate-glow/);
  await expect(printed(page, 'amount-words')).toHaveClass(/animate-glow/);
  await expect(printed(page, 'payee-name')).not.toHaveClass(/animate-glow/);
  await expect(page.getByRole('status').filter({ hasText: 'Hint:' })).toHaveText(
    'Hint: take another look at the amount.',
  );
  await expect(redString(page)).toHaveCount(0);
  await expect(nextTaskButton(page)).toHaveCount(0);

  // The amount: red string between figures and words, MISMATCH stamp, explanation, continue.
  await zone(page, 'Amount in Words').click();
  await expect(redString(page)).toBeVisible();
  await expect(stamp(page)).toBeVisible();
  await expect(printed(page, 'amount-figures')).toHaveClass(/border-clue/);
  await expect(printed(page, 'amount-words')).toHaveClass(/border-clue/);
  await expect(page.getByRole('status')).toHaveText(
    'Found it! The amount in numbers and the amount in words don’t match — that mismatch is exactly why a cheque gets returned.',
  );
  await expect(note(page)).toHaveCount(0);
  await expect(printed(page, 'amount-figures')).not.toHaveClass(/animate-glow/);
  await expect(zone(page, 'Date')).toBeDisabled();

  await nextTask(page);
  await expectPrompt(page, 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?');
});

test('the loupe magnifies what is under it, and a tap on it reaches the detail beneath', async ({
  page,
}) => {
  await openTask(page);
  const magnified = (id: string) => page.getByTestId('loupe-copy').locator(`[data-zone="${id}"]`);

  // Over the date: the copy inside the glass shows the date, twice as big, dead centre.
  await dragLoupeOver(page, printed(page, 'date'));
  expect(await distanceBetween(loupe(page), printed(page, 'date'))).toBeLessThan(3);
  expect(await distanceBetween(magnified('date'), loupe(page))).toBeLessThan(3);
  const real = await centreOf(printed(page, 'date'));
  const zoomed = await centreOf(magnified('date'));
  expect(zoomed.width / real.width).toBeCloseTo(2, 1);

  // The loupe now covers the date, but tapping it inspects the date anyway.
  const onDate = await centreOf(loupe(page));
  await page.mouse.click(onDate.x, onDate.y);
  await expect(note(page)).toContainText('Date');

  // Moved over the amount, the same tap finds the mismatch.
  await dragLoupeOver(page, printed(page, 'amount-figures'));
  expect(await distanceBetween(magnified('amount-figures'), loupe(page))).toBeLessThan(3);
  await expect(stamp(page)).toHaveCount(0); // dragging is not tapping
  const onAmount = await centreOf(loupe(page));
  await page.mouse.click(onAmount.x, onAmount.y);
  await expect(stamp(page)).toBeVisible();
  await expect(redString(page)).toBeVisible();
});

test('keyboard: Tab moves between details with the loupe following, Enter inspects', async ({
  page,
}) => {
  await openTask(page);

  // Tab from the first detail to the second, so the focus is a real keyboard focus.
  await zone(page, 'Payee Name').focus();
  await page.keyboard.press('Tab');
  await expect(zone(page, 'Date')).toBeFocused();
  await expect.poll(() => distanceBetween(loupe(page), printed(page, 'date'))).toBeLessThan(3);

  await page.keyboard.press('Enter');
  await expect(note(page)).toContainText('Date');
  await expect(zone(page, 'Date')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(zone(page, 'Amount in Figures')).toBeFocused();
  await expect
    .poll(() => distanceBetween(loupe(page), printed(page, 'amount-figures')))
    .toBeLessThan(3);

  await page.keyboard.press('Enter');
  await expect(stamp(page)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('don’t match');
});

test('with reduced motion the reveal appears without animating', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openTask(page);

  await zone(page, 'Payee Name').focus();
  await page.keyboard.press('Tab');
  // The loupe jumps to the focused detail rather than gliding: it is there within a frame or
  // two (it is drawn on the next animation frame), well before a 250 ms glide could finish.
  await expect
    .poll(() => distanceBetween(loupe(page), printed(page, 'date')), {
      intervals: [16],
      timeout: 150,
    })
    .toBeLessThan(3);

  await zone(page, 'Amount in Figures').click();
  await expect(redString(page).locator('path')).toHaveCSS(
    'animation-duration',
    /^(1e-05s|0\.00001s)$/,
  );
  await expect(redString(page).locator('path')).toHaveCSS('stroke-dashoffset', '0px');
  await expect(stamp(page)).toBeVisible();
});

test('a solved cheque reopens with the mismatch already marked', async ({ page }) => {
  await openTask(page);
  await zone(page, 'Amount in Figures').click();
  await expect(stamp(page)).toBeVisible();

  await page.reload();

  await expectPrompt(page, PROMPT);
  await expect(page.getByText('You have already solved this task.')).toBeVisible();
  await expect(stamp(page)).toBeVisible();
  await expect(redString(page)).toBeVisible();
  await expect(zone(page, 'Signature')).toBeDisabled();
});

test.describe('on a touchscreen', () => {
  // A classroom tablet: touch only, no mouse.
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

  /**
   * Drags with one finger, as real touch events (Playwright's own touchscreen can only tap).
   * The loupe is a pointer-event drag, so this is the path a tablet takes.
   */
  async function touchDrag(page: Page, from: Locator, to: Locator) {
    await to.scrollIntoViewIfNeeded();
    const start = await centreOf(from);
    const end = await centreOf(to);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });

    await touch('touchStart', start.x, start.y);
    for (let step = 1; step <= 12; step += 1) {
      await touch(
        'touchMove',
        start.x + ((end.x - start.x) * step) / 12,
        start.y + ((end.y - start.y) * step) / 12,
      );
    }
    await touch('touchEnd', end.x, end.y);
    await cdp.detach();
  }

  test('tapping details and dragging the loupe with a finger', async ({ page }) => {
    await openTask(page);

    // A tap on a detail that is fine: the sticky note, as with a click.
    await zone(page, 'Payee Name').tap();
    await expect(note(page)).toContainText('Payee Name');
    await expect(stamp(page)).toHaveCount(0);

    // The loupe follows a finger across the cheque — and a drag is not a tap.
    await touchDrag(page, loupe(page), printed(page, 'amount-figures'));
    expect(await distanceBetween(loupe(page), printed(page, 'amount-figures'))).toBeLessThan(4);
    await expect(stamp(page)).toHaveCount(0);

    // Tapping the glass inspects what is under it: the amount, and the mismatch is found.
    await loupe(page).tap();
    await expect(stamp(page)).toBeVisible();
    await expect(redString(page)).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Found it!');
    await expect(nextTaskButton(page)).toBeVisible();
  });
});
