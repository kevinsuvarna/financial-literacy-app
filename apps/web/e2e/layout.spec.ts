import { expect, test, type Page } from '@playwright/test';
import { jumpToTask } from './helpers';

// Every screen, at the sizes the game is played on — landscape tablets and laptops — checked
// for what a 12–14-year-old player needs: nothing cut off or scrolling sideways, text big
// enough to read, the question in view, and (for players who ask for it) no motion.

const VIEWPORTS = [
  { name: 'tablet landscape', width: 1024, height: 768 },
  { name: 'large tablet landscape', width: 1180, height: 820 },
  { name: 'small laptop', width: 1280, height: 800 },
  { name: 'laptop', width: 1366, height: 768 },
] as const;

const TASKS = [
  'l1-t1-account-type',
  'l1-t2-verify-identity',
  'l1-t3-withdrawal-slip',
  'l2-t1-closing-balance',
  'l2-t2-returned-cheque',
  'l2-t3-suspicious-transaction',
  'l3-t1-spot-the-phish',
  'l3-t2-uncover-the-scam',
  'l3-t3-evidence-passkey',
  'l3-t4-scan-evidence',
  'l3-t5-review-submit',
];

/** The smallest text allowed on screen, in CSS pixels. */
const MIN_TEXT_PX = 14;

interface Audit {
  overflow: number;
  smallText: string[];
  moving: string[];
}

// Runs in the page. Written as a string: the e2e TypeScript project has no DOM types.
const AUDIT = `(() => {
  const smallText = [];
  for (const element of document.querySelectorAll('body *')) {
    // Decoration, screen-reader-only text and the debug panel aren't read on screen.
    if (element.closest('[aria-hidden="true"], .sr-only, aside')) continue;
    const ownText = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(' ')
      .trim();
    if (!ownText) continue;
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || element.getBoundingClientRect().width === 0) continue;
    const size = parseFloat(style.fontSize);
    if (size < ${MIN_TEXT_PX}) smallText.push(size.toFixed(1) + 'px "' + ownText.slice(0, 40) + '"');
  }
  const moving = document
    .getAnimations()
    .filter((animation) => animation.playState === 'running')
    .map((animation) => animation.animationName || animation.id || 'animation');
  return {
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    smallText,
    moving,
  };
})()`;

async function audit(page: Page, screen: string) {
  // Let entrances and short effects finish (they are instant under reduced motion anyway).
  await page.waitForTimeout(400);
  const result = (await page.evaluate(AUDIT)) as Audit;
  expect(
    result.overflow,
    `${screen}: scrolls sideways by ${result.overflow}px`,
  ).toBeLessThanOrEqual(0);
  expect(result.smallText, `${screen}: text under ${MIN_TEXT_PX}px`).toEqual([]);
  expect(result.moving, `${screen}: still moving with reduced motion`).toEqual([]);

  // The question is on screen without scrolling.
  const title = page.getByRole('heading', { level: 1 }).first();
  await expect(title).toBeInViewport();
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} (${viewport.width}×${viewport.height}): every screen fits, reads and keeps still`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto('/');
    await audit(page, 'start');

    for (const taskId of TASKS) {
      await jumpToTask(page, taskId);
      const useList = page.getByRole('button', { name: 'CHOOSE CARDS FROM A LIST' });
      if (await useList.isVisible()) await useList.click();
      await audit(page, taskId);
    }

    await page.goto('/board');
    await audit(page, 'case board');

    await jumpToTask(page, 'l3-t5-review-submit');
    await page.getByRole('button', { name: 'SUBMIT INCIDENT REPORT' }).click();
    await page.getByRole('link', { name: 'VIEW CERTIFICATE' }).click();
    await audit(page, 'certificate');
  });
}
