// Runs Lighthouse (performance and accessibility) against a production build of the web app,
// on the screens players actually see — including ones in the middle of a game.
//
//   pnpm lighthouse
//
// Each screen is audited as a laptop (desktop settings) and as a tablet (Lighthouse's mobile
// settings: a mid-range device on a slow 4G connection). Reports go to dist/lighthouse/, and
// the run fails if any score is under 90.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import lighthouse, { desktopConfig } from 'lighthouse';
import { previewProductionBuild, repoRoot } from './lib/previewBuild';

const MIN_SCORE = 90;
const DEBUGGING_PORT = 9333;
const reportsDir = join(repoRoot, 'dist', 'lighthouse');

/**
 * A screen to audit. `prepare` runs in the browser first, on the same profile Lighthouse will
 * use — so a game can be set up in localStorage before the screen is opened.
 */
interface Screen {
  name: string;
  path: string;
  prepare?: (page: Page, origin: string) => Promise<void>;
}

/** Plays (with the debug panel's Jump) to `taskId`, and turns the debug panel off again. */
const gameAt = (taskId: string) => async (page: Page, origin: string) => {
  await page.goto(new URL('/?debug=1', origin).href);
  const panel = page.getByRole('complementary', { name: 'Debug panel' });
  await panel.getByLabel('Jump to task').selectOption(taskId);
  await panel.getByRole('button', { name: 'Jump' }).click();
  await page.goto(new URL('/play?debug=0', origin).href);
  // Answer the scanner question, so the audit sees the task rather than the question.
  await page.evaluate(`localStorage.setItem('ssa-scanner-camera', 'declined')`);
};

const SCREENS: Screen[] = [
  { name: 'start', path: '/' },
  { name: 'scan-task', path: '/play', prepare: gameAt('l1-t2-verify-identity') },
  { name: 'statement', path: '/play', prepare: gameAt('l2-t3-suspicious-transaction') },
  { name: 'cheque', path: '/play', prepare: gameAt('l2-t2-returned-cheque') },
  { name: 'passkey', path: '/play', prepare: gameAt('l3-t3-evidence-passkey') },
  { name: 'case-board', path: '/board', prepare: gameAt('l2-t1-closing-balance') },
  { name: 'print', path: '/print' },
];

const FORM_FACTORS = ['desktop', 'mobile'] as const;

interface Result {
  screen: string;
  formFactor: string;
  performance: number;
  accessibility: number;
  failing: string[];
}

const server = await previewProductionBuild();
const profile = await mkdtemp(join(tmpdir(), 'ssa-lighthouse-'));
// A persistent profile: what `prepare` puts in localStorage is there when Lighthouse looks.
const browser = await chromium.launchPersistentContext(profile, {
  args: [`--remote-debugging-port=${DEBUGGING_PORT}`],
  serviceWorkers: 'block',
});
const results: Result[] = [];

try {
  await mkdir(reportsDir, { recursive: true });
  const page = browser.pages()[0] ?? (await browser.newPage());

  for (const screen of SCREENS) {
    for (const formFactor of FORM_FACTORS) {
      await page.goto(new URL('/', server.origin).href);
      await page.evaluate('localStorage.clear()');
      await screen.prepare?.(page, server.origin);
      await page.goto('about:blank');

      const run = await lighthouse(
        new URL(screen.path, server.origin).href,
        {
          port: DEBUGGING_PORT,
          output: 'html',
          onlyCategories: ['performance', 'accessibility'],
          // Keep the game the screen was prepared with.
          disableStorageReset: true,
          logLevel: 'error',
        },
        formFactor === 'desktop' ? desktopConfig : undefined,
      );
      if (!run) throw new Error(`Lighthouse returned nothing for ${screen.name}`);

      const { categories, audits } = run.lhr;
      const score = (id: string) => Math.round((categories[id]?.score ?? 0) * 100);
      const failing = Object.values(audits)
        .filter((audit) => audit.score !== null && audit.score < 0.9)
        .filter(
          (audit) => audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric',
        )
        .map(
          (audit) =>
            `${audit.id} (${Math.round((audit.score ?? 0) * 100)})${audit.displayValue ? ` ${audit.displayValue}` : ''}`,
        );

      const file = join(reportsDir, `${screen.name}-${formFactor}.html`);
      await writeFile(file, String(run.report));
      results.push({
        screen: screen.name,
        formFactor,
        performance: score('performance'),
        accessibility: score('accessibility'),
        failing,
      });
    }
  }
} finally {
  await browser.close();
  await server.close();
  await rm(profile, { recursive: true, force: true });
}

console.log('\nscreen        form      perf  a11y');
for (const result of results) {
  console.log(
    `${result.screen.padEnd(13)} ${result.formFactor.padEnd(9)} ${String(result.performance).padStart(4)}  ${String(result.accessibility).padStart(4)}`,
  );
  for (const audit of result.failing) console.log(`    · ${audit}`);
}
console.log(`\nReports: ${relative(process.cwd(), reportsDir)}`);

const below = results.filter((r) => r.performance < MIN_SCORE || r.accessibility < MIN_SCORE);
if (below.length > 0) {
  console.error(`\n${below.length} audit(s) scored under ${MIN_SCORE}.`);
  process.exit(1);
}
