import { expect, test, type Page } from '@playwright/test';
import { expectPrompt, picker, scan } from './helpers';

// Full offline play: after one visit online, the installed service worker serves everything
// the game needs — a classroom can lose its connection and play on.

test.use({ serviceWorkers: 'allow' });

/** Waits until the service worker has precached everything and controls the page. */
async function installOffline(page: Page) {
  await page.goto('/');
  await page.evaluate('navigator.serviceWorker.ready.then(() => true)');
  await expect.poll(() => page.evaluate('Boolean(navigator.serviceWorker.controller)')).toBe(true);
}

test('after one visit, the whole game works with no connection', async ({ page, context }) => {
  test.setTimeout(90_000);
  await installOffline(page);

  // What the service worker holds: the sounds, the QR codes, the decoder and the icons.
  const cached = (await page.evaluate(`(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) urls.push(new URL(request.url).pathname);
    }
    return urls;
  })()`)) as string[];
  expect(cached.filter((url) => url.startsWith('/audio/') && url.endsWith('.wav'))).toHaveLength(
    18,
  );
  expect(cached.filter((url) => url.startsWith('/qr/') && url.endsWith('.svg'))).toHaveLength(16);
  expect(cached.some((url) => url.endsWith('.wasm'))).toBe(true);
  expect(cached).toContain('/icons/icon-512.png');
  expect(cached).toContain('/manifest.webmanifest');

  // No connection from here on.
  await context.setOffline(true);
  const failed: string[] = [];
  page.on('requestfailed', (request) => failed.push(request.url()));
  const fromNetwork: string[] = [];
  page.on('response', (response) => {
    if (!response.fromServiceWorker() && !response.url().startsWith('data:')) {
      fromNetwork.push(response.url());
    }
  });

  await page.reload();
  await expectPrompt(page, 'SAVE THE SAVINGS ACCOUNT');

  // The intro — which loads every sound — and the first task, scanned from the card list.
  await page.getByRole('button', { name: 'START TRAINING' }).click();
  await page.getByRole('button', { name: 'Answer the call' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'SKIP' }).click();
  await page.getByRole('button', { name: 'SEE YOUR ASSIGNMENT' }).click();
  await page.getByRole('button', { name: 'OPEN CASE FILE' }).click();
  await page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' }).click();
  await expect(picker(page)).toBeVisible();
  await scan(page, 'Savings Account');
  await expect(page.getByRole('status')).toContainText('A savings account lets Ananya');

  // Any page opened directly works too — the print sheets, with all their codes.
  await page.goto('/print');
  await expectPrompt(page, 'ARTEFACT CARDS');
  const codes = page.locator('[data-artefact] img');
  await expect(codes).toHaveCount(16);
  for (const code of await codes.all()) await expect(code).not.toHaveJSProperty('naturalWidth', 0);

  await page.goto('/board');
  await expectPrompt(page, 'CASE BOARD');

  expect(failed).toEqual([]);
  expect(fromNetwork).toEqual([]);
});
