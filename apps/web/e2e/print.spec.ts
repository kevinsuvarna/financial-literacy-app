import { expect, test, type Locator, type Page } from '@playwright/test';
import { countPdfPages, isPdf, pdfPageSizesMm } from '../../../scripts/lib/pdf';
import { expectPrompt } from './helpers';

/** CSS pixels per millimetre: a CSS inch is 96 px and 25.4 mm. */
const PX_PER_MM = 96 / 25.4;
const mm = (millimetres: number) => millimetres * PX_PER_MM;

const sheets = (page: Page) => page.locator('[data-sheet]');
const cards = (page: Page) => page.locator('[data-artefact]');
const card = (page: Page, artefactId: string) => page.locator(`[data-artefact="${artefactId}"]`);

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('element is not laid out');
  return bounds;
}

/** What is printed on each card, in registry order. Written out: this is what gets cut up. */
const CARDS = [
  ['account-savings', 'Account type', 'Savings Account'],
  ['account-current', 'Account type', 'Current Account'],
  ['account-fixed-deposit', 'Account type', 'Fixed Deposit Account'],
  ['account-recurring-deposit', 'Account type', 'Recurring Deposit Account'],
  ['id-expired-passport', 'Identity document', 'Expired Passport'],
  ['id-library-card', 'Identity document', 'Library Card'],
  ['id-pan-card', 'Identity document', 'PAN Card'],
  ['id-aadhaar-card', 'Identity document', 'Aadhaar Card'],
  ['slip-deposit', 'Bank slip', 'Deposit Slip'],
  ['slip-withdrawal', 'Bank slip', 'Withdrawal Slip'],
  ['balance-answer-7501', 'Closing balance', '₹7,501'],
  ['balance-answer-13500', 'Closing balance', '₹13,500'],
  ['balance-answer-4001', 'Closing balance', '₹4,001'],
  ['cheque', 'Case document', "Ananya's Cheque"],
  ['bank-statement', 'Case document', "Ananya's Bank Statement"],
  ['phishing-message', 'Evidence', 'Suspicious Unblock-Card Message'],
] as const;

test('the print sheets need no game in progress, and are linked from the start screen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Print the artefact cards' }).click();

  await expect(page).toHaveURL(/\/print$/);
  await expectPrompt(page, 'ARTEFACT CARDS');
  await expect(page.getByText(/at 100% scale/)).toBeVisible();
  // It stands outside the game: no tracker, and the game has not been started by coming here.
  await expect(page.getByRole('navigation', { name: 'Mission progress' })).toHaveCount(0);

  await page.getByRole('link', { name: 'BACK TO THE GAME' }).click();
  await expect(page.getByRole('button', { name: 'START TRAINING' })).toBeVisible();
});

test('every artefact is a card, with its name, what it is, and its own QR code', async ({
  page,
  request,
}) => {
  await page.goto('/print');

  await expect(cards(page)).toHaveCount(CARDS.length);
  expect(
    await cards(page).evaluateAll((all) => all.map((one) => one.getAttribute('data-artefact'))),
  ).toEqual(CARDS.map(([id]) => id));

  for (const [id, kind, label] of CARDS) {
    await expect(card(page, id).getByRole('heading', { name: label, exact: true })).toBeVisible();
    await expect(card(page, id)).toContainText(kind);
    await expect(card(page, id)).toContainText(id);

    const qr = card(page, id).getByRole('img', { name: `QR code for ${label}` });
    await expect(qr).toHaveAttribute('src', `/qr/${id}.svg`);
    // Loaded, not a broken-image icon.
    await expect(qr).toHaveJSProperty('complete', true);
    await expect(qr).not.toHaveJSProperty('naturalWidth', 0);

    // And the file it shows is that artefact's code: an SVG, in module units.
    const svg = await (await request.get(`/qr/${id}.svg`)).text();
    expect(svg, id).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
  }
});

test('each QR code is at least 3 cm across, not counting its quiet zone', async ({
  page,
  request,
}) => {
  await page.goto('/print');

  for (const [id, , label] of CARDS) {
    const image = await box(card(page, id).getByRole('img', { name: `QR code for ${label}` }));
    expect(image.width, id).toBeCloseTo(mm(40), 0);
    expect(image.height, id).toBeCloseTo(image.width, 1);

    // The image includes four blank modules on every side; the code is what is left.
    const svg = await (await request.get(`/qr/${id}.svg`)).text();
    const imageModules = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
    const codeWidth = (image.width * (imageModules - 8)) / imageModules;
    expect(codeWidth, `${id}: ${(codeWidth / PX_PER_MM).toFixed(1)} mm`).toBeGreaterThanOrEqual(
      mm(30),
    );
  }
});

test('the cards are laid out on A4 sheets, each inside its margin, none overlapping', async ({
  page,
}) => {
  await page.goto('/print');

  await expect(sheets(page)).toHaveCount(2);
  await expect(sheets(page).nth(0).locator('[data-artefact]')).toHaveCount(8);
  await expect(sheets(page).nth(1).locator('[data-artefact]')).toHaveCount(8);
  await expect(sheets(page).nth(0)).toContainText('Sheet 1 of 2');
  await expect(sheets(page).nth(1)).toContainText('Sheet 2 of 2');
  await expect(sheets(page).nth(0)).toContainText('Print at 100% (actual size).');

  for (const sheet of await sheets(page).all()) {
    const paper = await box(sheet);
    expect(paper.width).toBeCloseTo(mm(210), 0);
    expect(paper.height).toBeCloseTo(mm(297), 0);

    const placed = [];
    for (const one of await sheet.locator('[data-artefact]').all()) {
      const bounds = await box(one);
      // A card is 90 × 60 mm…
      expect(bounds.width).toBeCloseTo(mm(90), 0);
      expect(bounds.height).toBeCloseTo(mm(60), 0);
      // …and sits at least 10 mm in from every edge of the paper, where a printer can reach.
      expect(bounds.x - paper.x).toBeGreaterThanOrEqual(mm(10) - 0.5);
      expect(bounds.y - paper.y).toBeGreaterThanOrEqual(mm(10) - 0.5);
      expect(paper.x + paper.width - (bounds.x + bounds.width)).toBeGreaterThanOrEqual(
        mm(10) - 0.5,
      );
      expect(paper.y + paper.height - (bounds.y + bounds.height)).toBeGreaterThanOrEqual(
        mm(10) - 0.5,
      );
      placed.push(bounds);
    }

    // No two cards touch: there is room between them to cut.
    for (const [index, a] of placed.entries()) {
      for (const b of placed.slice(index + 1)) {
        const apartX = a.x + a.width + mm(5) <= b.x || b.x + b.width + mm(5) <= a.x;
        const apartY = a.y + a.height + mm(5) <= b.y || b.y + b.height + mm(5) <= a.y;
        expect(apartX || apartY).toBe(true);
      }
    }
  }
});

test('every card has crop marks: two at each corner, outside the card, pointing at it', async ({
  page,
}) => {
  await page.goto('/print');

  await expect(page.locator('[data-crop-mark]')).toHaveCount(CARDS.length * 8);

  const one = card(page, 'account-savings');
  const edge = await box(one);
  const corners = [
    { x: edge.x, y: edge.y },
    { x: edge.x + edge.width, y: edge.y },
    { x: edge.x, y: edge.y + edge.height },
    { x: edge.x + edge.width, y: edge.y + edge.height },
  ];
  const perCorner = [0, 0, 0, 0];

  for (const mark of await one.locator('[data-crop-mark]').all()) {
    await expect(mark).toBeVisible();
    const line = await box(mark);
    const horizontal = line.width > line.height;
    // A hairline, 3 mm long.
    expect(Math.max(line.width, line.height)).toBeCloseTo(mm(3), 0);
    expect(Math.min(line.width, line.height)).toBeLessThanOrEqual(1.5);

    // Wholly outside the card…
    const outside =
      line.x + line.width <= edge.x + 0.5 ||
      line.x >= edge.x + edge.width - 0.5 ||
      line.y + line.height <= edge.y + 0.5 ||
      line.y >= edge.y + edge.height - 0.5;
    expect(outside).toBe(true);

    // …in line with one of its edges, and starting 1.5 mm clear of a corner.
    const nearest = corners
      .map((corner, index) => ({
        index,
        along: horizontal
          ? Math.min(Math.abs(line.x - corner.x), Math.abs(line.x + line.width - corner.x))
          : Math.min(Math.abs(line.y - corner.y), Math.abs(line.y + line.height - corner.y)),
        across: horizontal ? Math.abs(line.y - corner.y) : Math.abs(line.x - corner.x),
      }))
      .sort((a, b) => a.along + a.across - (b.along + b.across))[0];
    if (!nearest) throw new Error('no corner');
    expect(nearest.across).toBeLessThanOrEqual(1);
    expect(nearest.along).toBeCloseTo(mm(1.5), 0);
    perCorner[nearest.index] = (perCorner[nearest.index] ?? 0) + 1;
  }

  expect(perCorner).toEqual([2, 2, 2, 2]);
});

test('printed: the sheets and nothing else, as two A4 portrait pages', async ({ page }) => {
  await page.addInitScript('window.__prints = 0; window.print = () => { window.__prints += 1; };');
  await page.goto('/print');

  await page.getByRole('button', { name: 'PRINT', exact: true }).click();
  expect(await page.evaluate('window.__prints')).toBe(1);

  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('heading', { level: 1, name: 'ARTEFACT CARDS' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'PRINT', exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'BACK TO THE GAME' })).toBeHidden();
  await expect(sheets(page).nth(0)).toBeVisible();
  await expect(card(page, 'phishing-message')).toBeVisible();
  // The paper is the page: each sheet starts a new one, and the last ends the document.
  await expect(sheets(page).nth(0)).toHaveCSS('break-after', 'page');
  await expect(sheets(page).nth(1)).toHaveCSS('break-after', 'auto');

  // The same export `pnpm print:pdf` makes: one page per sheet, each exactly A4 portrait.
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  expect(isPdf(pdf)).toBe(true);
  expect(countPdfPages(pdf)).toBe(2);
  expect(pdfPageSizesMm(pdf)).toEqual([
    { width: 210, height: 297 },
    { width: 210, height: 297 },
  ]);
});
