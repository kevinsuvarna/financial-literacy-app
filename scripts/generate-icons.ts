// Renders the app icon (apps/web/public/icon.svg) to the PNG sizes the web app manifest and
// home screens need, into apps/web/public/icons.
//
//   pnpm icons
//
// A headless browser draws the SVG, so the PNGs are exactly what browsers show for the SVG.
// Re-run after changing icon.svg, and commit the result.
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'public');
const iconsDir = join(publicDir, 'icons');

const svg = await readFile(join(publicDir, 'icon.svg'), 'utf8');

/**
 * `maskable` icons get cropped to a circle or squircle by the launcher, which may cut off
 * anything outside the middle 80%: they are drawn full-bleed, on the icon's own background,
 * with the artwork shrunk into that safe zone.
 */
const outputs = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

const browser = await chromium.launch();
try {
  await mkdir(iconsDir, { recursive: true });
  for (const { file, size, maskable } of outputs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const artwork = maskable
      ? `<div style="width:100%;height:100%;background:#0b1440;display:grid;place-items:center">
           <div style="width:72%;height:72%">${svg}</div>
         </div>`
      : svg;
    await page.setContent(
      `<html><body style="margin:0;background:transparent">
         <div style="width:${size}px;height:${size}px">${artwork}</div>
         <style>svg{display:block;width:100%;height:100%}</style>
       </body></html>`,
    );
    await page.screenshot({ path: join(iconsDir, file), omitBackground: !maskable });
    await page.close();
    console.log(`${relative(process.cwd(), join(iconsDir, file))}  ${size}×${size}`);
  }
} finally {
  await browser.close();
}
