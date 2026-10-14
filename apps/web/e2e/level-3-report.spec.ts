import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectPrompt, jumpToTask, nextTask, nextTaskButton, picker, scan } from './helpers';

const STATEMENT = "Ananya's Bank Statement";
const MESSAGE = 'Suspicious Unblock-Card Message';
const CHEQUE = "Ananya's Cheque";

const slot = (page: Page, artefactId: 'bank-statement' | 'phishing-message') =>
  page.locator(`[data-slot="${artefactId}"]`);
const report = (page: Page) => page.getByTestId('incident-report');
const evidence = (page: Page, artefactId: 'bank-statement' | 'phishing-message') =>
  report(page).locator(`[data-evidence="${artefactId}"]`);
const submit = (page: Page) => page.getByRole('button', { name: 'SUBMIT INCIDENT REPORT' });
const blocked = (page: Page) => page.getByTestId('report-blocked');
const goToEvidence = (page: Page) => page.getByRole('button', { name: 'GO TO SCAN EVIDENCE' });
const tracker = (page: Page) => page.getByRole('navigation', { name: 'Mission progress' });
const reportStep = (page: Page) =>
  tracker(page).getByRole('button', { name: /^Secure & Report, task 5 of 5/ });
/** The task's explanation once solved, or its feedback after a scan. */
const explanation = (page: Page) => page.getByRole('status');
const certificate = (page: Page) => page.getByTestId('certificate');

async function chooseCardList(page: Page) {
  await page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' }).click();
  await expect(picker(page)).toBeVisible();
}

async function openEvidence(page: Page) {
  await jumpToTask(page, 'l3-t4-scan-evidence');
  await expectPrompt(page, 'SCAN EVIDENCE');
  await chooseCardList(page);
}

/** Presses a control the keyboard way — which works on one that is only `aria-disabled`. */
async function pressWithKeyboard(page: Page, control: ReturnType<typeof submit>) {
  await control.focus();
  await page.keyboard.press('Enter');
}

test('evidence: a slot for each artefact, filled by scanning it; the cheque is turned away', async ({
  page,
}) => {
  await openEvidence(page);

  // Two dashed slots, each named for the artefact it is waiting for.
  await expect(
    page.getByRole('list', { name: 'Evidence slots' }).getByRole('listitem'),
  ).toHaveCount(2);
  for (const [id, label] of [
    ['bank-statement', STATEMENT],
    ['phishing-message', MESSAGE],
  ] as const) {
    await expect(slot(page, id)).toContainText(label);
    await expect(slot(page, id)).toContainText('Waiting for a scan');
    await expect(slot(page, id)).toHaveAttribute('data-state', 'empty');
    await expect(slot(page, id)).toHaveCSS('border-top-style', 'dashed');
  }
  await expect(page.getByText('0 of 2 attached')).toBeVisible();
  // The report is out of reach until the evidence is in.
  await expect(reportStep(page)).toBeDisabled();
  await expect(nextTaskButton(page)).toHaveCount(0);

  // The cheque: not needed, and why. Nothing is attached.
  await scan(page, CHEQUE);
  await expect(explanation(page)).toHaveText(
    'Not needed. The cheque’s returned payment has already been explained — it isn’t evidence for this report.',
  );
  await expect(page.getByText('0 of 2 attached')).toBeVisible();
  await expect(page.locator('[data-paper="page"]')).toHaveCount(0);

  // The statement: a page lands in its own slot and is clipped there.
  await scan(page, STATEMENT);
  await expect(slot(page, 'bank-statement')).toHaveAttribute('data-state', 'attached');
  await expect(slot(page, 'bank-statement').locator('[data-paper="page"]')).toBeVisible();
  await expect(slot(page, 'bank-statement')).toContainText('ATTACHED');
  await expect(slot(page, 'bank-statement')).toContainText(
    'Bank statement — unrecognised CAMS TEL transaction',
  );
  await expect(slot(page, 'bank-statement')).toHaveCSS('border-top-style', 'solid');
  await expect(page.getByText('1 of 2 attached')).toBeVisible();
  // One piece is not enough: the other slot still waits, and there is no way on.
  await expect(slot(page, 'phishing-message')).toHaveAttribute('data-state', 'empty');
  await expect(reportStep(page)).toBeDisabled();
  await expect(nextTaskButton(page)).toHaveCount(0);

  // Scanning it again changes nothing.
  await scan(page, STATEMENT);
  await expect(explanation(page)).toHaveText(`${STATEMENT} is already attached.`);
  await expect(page.getByText('1 of 2 attached')).toBeVisible();

  // What is attached stays attached across a reload.
  await page.reload();
  await expect(slot(page, 'bank-statement')).toHaveAttribute('data-state', 'attached');
  await expect(slot(page, 'phishing-message')).toHaveAttribute('data-state', 'empty');

  // The message card completes the set.
  await scan(page, MESSAGE);
  await expect(slot(page, 'phishing-message')).toHaveAttribute('data-state', 'attached');
  await expect(slot(page, 'phishing-message')).toContainText(
    'Suspicious message — link claiming to unblock debit card',
  );
  await expect(page.getByText('2 of 2 attached')).toBeVisible();
  await expect(explanation(page)).toHaveText(
    'Both pieces of evidence are attached to the incident report.',
  );
  await expect(picker(page)).toHaveCount(0);

  await nextTask(page);
  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
});

test('submitting before the evidence is attached is blocked; then the mission is completed', async ({
  page,
}) => {
  await openEvidence(page);

  // Play never leads to a report without evidence: the report stays locked until both pieces
  // are attached. This is a save that got there anyway — an old one, or one edited by hand.
  await page.evaluate(`(() => {
    const save = JSON.parse(localStorage.getItem('ssa-game'));
    const context = save.snapshot.context;
    context.tasks['l3-t5-review-submit'].status = 'available';
    context.viewedTaskId = 'l3-t5-review-submit';
    localStorage.setItem('ssa-game', JSON.stringify(save));
  })()`);
  await page.reload();

  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await expect(evidence(page, 'bank-statement')).toHaveAttribute('data-state', 'missing');
  await expect(evidence(page, 'phishing-message')).toHaveAttribute('data-state', 'missing');
  await expect(report(page).getByText('Missing', { exact: true })).toHaveCount(2);

  // SUBMIT is there, but disabled — and the screen says why.
  await expect(submit(page)).toBeDisabled();
  await expect(blocked(page)).toHaveText(
    'This report can’t be submitted yet — evidence is missing. Attach both pieces of evidence first.',
  );

  // Pressing it anyway earns a shake, not a submission.
  await pressWithKeyboard(page, submit(page));
  await expect(submit(page)).toHaveCSS('animation-name', 'shake');
  await pressWithKeyboard(page, submit(page));
  await expect(submit(page)).toHaveCSS('animation-name', 'shake-again');
  await submit(page).click({ force: true });
  await expect(submit(page)).toHaveCSS('animation-name', 'shake');

  await expect(blocked(page)).toBeVisible();
  await expect(report(page)).not.toContainText('SUBMITTED');
  await expect(page.getByRole('link', { name: 'VIEW CERTIFICATE' })).toHaveCount(0);
  await page.goto('/certificate');
  await expect(page).toHaveURL(/\/board$/);
  await page.goto('/play');

  // One piece of evidence is still not both.
  await goToEvidence(page).click();
  await expectPrompt(page, 'SCAN EVIDENCE');
  await scan(page, STATEMENT);
  await reportStep(page).click();
  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await expect(evidence(page, 'bank-statement')).toHaveAttribute('data-state', 'attached');
  await expect(evidence(page, 'phishing-message')).toHaveAttribute('data-state', 'missing');
  await expect(submit(page)).toBeDisabled();
  await pressWithKeyboard(page, submit(page));
  await expect(submit(page)).toHaveCSS('animation-name', /^shake/);
  await expect(page.getByRole('link', { name: 'VIEW CERTIFICATE' })).toHaveCount(0);

  // With both attached, the report opens up.
  await goToEvidence(page).click();
  await scan(page, MESSAGE);
  await nextTask(page);
  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await expect(report(page).getByText('Attached', { exact: true })).toHaveCount(2);
  await expect(blocked(page)).toHaveCount(0);
  await expect(goToEvidence(page)).toHaveCount(0);
  await expect(submit(page)).toBeEnabled();
  await expect(submit(page)).toHaveCSS('animation-name', 'none');

  await submit(page).click();
  await expect(explanation(page)).toContainText('Report submitted for investigation.');
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();
  await expectPrompt(page, 'MISSION COMPLETE');
});

test('the report shows exactly the spec’s fields, and is submitted for investigation — not proven', async ({
  page,
}) => {
  await jumpToTask(page, 'l3-t5-review-submit');
  await expectPrompt(page, 'REVIEW INCIDENT REPORT');
  await expect(
    page.getByText('Check that both pieces of evidence are attached before submitting.'),
  ).toBeVisible();

  // Customer, transaction, concern — and nothing else.
  await expect(report(page).getByRole('term')).toHaveText([
    'Customer:',
    'Transaction:',
    'Concern:',
  ]);
  await expect(report(page).getByRole('definition')).toHaveText([
    'Ananya Sharma',
    '₹5,999',
    'Suspected fraud',
  ]);
  await expect(report(page).getByRole('heading', { name: 'Evidence attached' })).toBeVisible();
  await expect(report(page).getByRole('listitem')).toHaveText([
    /Bank statement — unrecognised CAMS TEL transaction\s*Attached/,
    /Suspicious message — link claiming to unblock debit card\s*Attached/,
  ]);
  await expect(report(page)).not.toContainText('SUBMITTED');
  await expect(submit(page)).toBeEnabled();

  await submit(page).click();

  await expect(report(page)).toContainText('SUBMITTED');
  await expect(report(page)).toContainText('Submitted for investigation');
  await expect(explanation(page)).toHaveText(
    'Report submitted for investigation. The bank will now look into the suspected fraud — nothing has been proven yet. Ananya has been notified. Well done, Officer.',
  );
  // Still a suspicion on the form, and it can't be sent twice.
  await expect(report(page).getByRole('definition').nth(2)).toHaveText('Suspected fraud');
  await expect(submit(page)).toBeDisabled();
  await expect(page.getByText('CORRECT', { exact: true })).toBeVisible();

  // Submitted is submitted: it is still so after a reload.
  await page.reload();
  await expect(report(page)).toContainText('SUBMITTED');
  await expect(page.getByRole('link', { name: 'VIEW CERTIFICATE' })).toBeVisible();
});

test('certificate: confetti, the stamped badge, print, a PNG to keep, and the ways on', async ({
  page,
}) => {
  // Count calls to print instead of opening the browser's dialog.
  await page.addInitScript('window.__prints = 0; window.print = () => { window.__prints += 1; };');
  await jumpToTask(page, 'l3-t5-review-submit');
  await submit(page).click();
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();

  await expect(page).toHaveURL(/\/certificate$/);
  await expectPrompt(page, 'MISSION COMPLETE');
  await expect(
    certificate(page).getByRole('heading', { name: 'GOOD JOB, OFFICER!' }),
  ).toBeVisible();
  await expect(certificate(page)).toContainText('Ananya has been notified about the report.');
  await expect(certificate(page)).toContainText(
    'You also learned how a savings account works, how to track money coming in and going out, and how to keep your money safe.',
  );
  await expect(certificate(page)).toContainText('This certifies that you are now a');
  await expect(certificate(page).getByText('Junior Bank Officer', { exact: true })).toBeVisible();

  // Confetti falls, once.
  const confetti = page.getByTestId('confetti');
  await expect(confetti).toBeVisible();
  await expect(confetti.locator('span').first()).toHaveCSS('animation-name', 'confetti-fall');
  await expect(confetti.locator('span').first()).toHaveCSS('animation-iteration-count', '1');

  // PRINT hands over to the browser's print dialog.
  await page.getByRole('button', { name: 'PRINT CERTIFICATE' }).click();
  expect(await page.evaluate('window.__prints')).toBe(1);

  // DOWNLOAD gives a real PNG, made on the page: A4 landscape, and nothing fetched to make it.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'DOWNLOAD PNG' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toBe('junior-bank-officer-certificate.png');
  const png = await readFile(await download.path());
  expect(png.subarray(0, 8).toString('latin1')).toBe('\x89PNG\r\n\x1a\n');
  expect(png.subarray(12, 16).toString('latin1')).toBe('IHDR');
  expect(png.readUInt32BE(16)).toBe(1754);
  expect(png.readUInt32BE(20)).toBe(1240);
  // A blank page would compress to almost nothing; this has a certificate on it.
  expect(png.length).toBeGreaterThan(20_000);
  // (The game's own sound files load when first played, which can land in this window.)
  expect(requests.filter((url) => !url.startsWith('blob:') && !url.includes('/audio/'))).toEqual(
    [],
  );

  // On paper: the certificate, and none of the game around it.
  await page.emulateMedia({ media: 'print' });
  await expect(certificate(page)).toBeVisible();
  await expect(certificate(page).getByText('Junior Bank Officer', { exact: true })).toBeVisible();
  await expect(confetti).toBeHidden();
  await expect(tracker(page)).toBeHidden();
  await expect(page.getByRole('button', { name: 'PRINT CERTIFICATE' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'DOWNLOAD PNG' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'BACK TO CASE BOARD' })).toBeHidden();
  await page.emulateMedia({ media: 'screen' });

  // The ways on: the Case Board, with every level complete…
  await page.getByRole('link', { name: 'BACK TO CASE BOARD' }).click();
  await expectPrompt(page, 'CASE BOARD');
  await expect(page.getByRole('button', { name: /^REPLAY:/ })).toHaveCount(3);

  // …or the whole mission again, from the start.
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();
  await page.getByRole('button', { name: 'REPLAY MISSION' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'START TRAINING' })).toBeVisible();
  await page.goto('/certificate');
  await expect(page).toHaveURL(/\/$/);
});

test('with reduced motion: no confetti, and a blocked report doesn’t shake', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openEvidence(page);
  await page.evaluate(`(() => {
    const save = JSON.parse(localStorage.getItem('ssa-game'));
    save.snapshot.context.tasks['l3-t5-review-submit'].status = 'available';
    save.snapshot.context.viewedTaskId = 'l3-t5-review-submit';
    localStorage.setItem('ssa-game', JSON.stringify(save));
  })()`);
  await page.reload();

  await pressWithKeyboard(page, submit(page));
  await expect(blocked(page)).toBeVisible();
  await expect(submit(page)).toHaveCSS('animation-name', 'none');

  await goToEvidence(page).click();
  await scan(page, STATEMENT);
  await scan(page, MESSAGE);
  await nextTask(page);
  await submit(page).click();
  await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();

  await expectPrompt(page, 'MISSION COMPLETE');
  await expect(page.getByTestId('confetti')).toBeHidden();
  await expect(certificate(page).getByText('Junior Bank Officer', { exact: true })).toBeVisible();
});
