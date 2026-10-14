// Generates everything that is derived from an artefact's QR payload:
//
//   pnpm qr          apps/web/public/qr/<id>.svg      the code printed on each card
//                    apps/web/e2e/fixtures/<id>.y4m   the same code as a fake-camera video
//   pnpm qr:check    changes nothing; fails if the checked-in SVGs don't match the registry
//
// The registry is packages/content/src/artefacts.ts. Run this after adding, removing or
// renaming an artefact; `pnpm test` fails until the SVGs are regenerated.
import { relative } from 'node:path';
import { artefacts } from '@app/content';
import {
  FIXTURES_DIR,
  findStaleQrSvgs,
  generateFakeCameraVideos,
  generateQrSvgs,
  QR_DIR,
  type GeneratedAssets,
} from './lib/artefactAssets';
import { QR_ERROR_CORRECTION, QR_QUIET_ZONE_MODULES } from './lib/artefactQr';

function report(kind: string, directory: string, result: GeneratedAssets) {
  const where = relative(process.cwd(), directory) || '.';
  const changed = result.written.length;
  console.log(
    `${kind}: ${result.total} in ${where}` +
      (changed > 0 ? ` (${changed} written)` : ' (all up to date)'),
  );
  for (const name of result.removed) console.log(`  removed ${name} — no such artefact`);
}

if (process.argv.includes('--check')) {
  const problems = await findStaleQrSvgs(artefacts);
  if (problems.length > 0) {
    console.error('The QR codes in apps/web/public/qr do not match the artefact registry:');
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('Run `pnpm qr` and commit the result.');
    process.exit(1);
  }
  console.log(`QR codes: ${artefacts.length} checked, all up to date`);
} else {
  console.log(
    `QR codes: error correction ${QR_ERROR_CORRECTION}, ${QR_QUIET_ZONE_MODULES}-module quiet zone`,
  );
  report('SVG', QR_DIR, await generateQrSvgs(artefacts));
  report('Fake-camera video', FIXTURES_DIR, await generateFakeCameraVideos(artefacts));
}
