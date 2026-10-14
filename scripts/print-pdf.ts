// Exports the artefact cut sheets (the web app's /print route) to dist/artefacts.pdf.
//
//   pnpm print:pdf
//
// It regenerates the QR codes from the registry, builds the web app into a temporary folder,
// serves that build on a spare local port, and has a headless browser print /print to PDF —
// so the PDF is exactly what the app prints, made from exactly what the registry holds.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build, preview } from 'vite';
import { artefacts } from '@app/content';
import { generateQrSvgs } from './lib/artefactAssets';
import { countPdfPages, pdfPageSizesMm } from './lib/pdf';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = join(repoRoot, 'apps', 'web');
const output = join(repoRoot, 'dist', 'artefacts.pdf');

function fail(message: string): never {
  throw new Error(`print:pdf — ${message}`);
}

const qr = await generateQrSvgs(artefacts);
console.log(`QR codes: ${qr.total} (${qr.written.length} regenerated)`);

const buildDir = await mkdtemp(join(tmpdir(), 'ssa-print-'));
let server: Awaited<ReturnType<typeof preview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

try {
  console.log('Building the web app…');
  await build({
    root: webRoot,
    logLevel: 'warn',
    build: { outDir: buildDir, emptyOutDir: true },
  });

  // Local only, on whatever port is free: nothing here needs to be reachable from elsewhere.
  server = await preview({
    root: webRoot,
    logLevel: 'warn',
    build: { outDir: buildDir },
    preview: { host: 'localhost', port: 4179, strictPort: false },
  });
  const origin = server.resolvedUrls?.local[0] ?? fail('the preview server gave no address');

  browser = await chromium.launch();
  // No service worker: this is one visit to one page, and nothing should be cached for it.
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(new URL('print', origin).href, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  // Every card, and every code actually loaded — a PDF with a missing QR is worse than none.
  const cards = page.locator('[data-artefact]');
  const cardCount = await cards.count();
  if (cardCount !== artefacts.length) {
    fail(`/print shows ${cardCount} cards, but the registry has ${artefacts.length} artefacts`);
  }
  const broken = await cards
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter(
          (image) =>
            !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0,
        )
        .map((image) => (image as HTMLImageElement).src),
    );
  if (broken.length > 0) fail(`these QR codes did not load: ${broken.join(', ')}`);

  const sheetCount = await page.locator('[data-sheet]').count();
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });

  const pageCount = countPdfPages(pdf);
  if (pageCount !== sheetCount) {
    fail(`the PDF has ${pageCount} pages for ${sheetCount} sheets — the layout has overflowed`);
  }
  const wrongSize = pdfPageSizesMm(pdf).filter(
    ({ width, height }) => width !== 210 || height !== 297,
  );
  if (wrongSize.length > 0) fail(`not every page is A4 portrait: ${JSON.stringify(wrongSize)}`);

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, pdf);
  console.log(
    `Wrote ${relative(process.cwd(), output)}: ${cardCount} cards on ${pageCount} A4 sheets ` +
      `(${Math.round(pdf.length / 1024)} KB). Print it at 100% scale.`,
  );
} finally {
  await browser?.close();
  await new Promise<void>((resolve) => {
    if (server) server.httpServer.close(() => resolve());
    else resolve();
  });
  await rm(buildDir, { recursive: true, force: true });
}
