import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderQrSvg } from './artefactQr';
import { renderFakeCameraVideo } from './fakeCameraVideo';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Served by the web app at /qr/<id>.svg, and checked in: the print sheets are built from it. */
export const QR_DIR = join(repoRoot, 'apps', 'web', 'public', 'qr');
/** Fake-camera videos for end-to-end tests. Large and regenerable, so git-ignored. */
export const FIXTURES_DIR = join(repoRoot, 'apps', 'web', 'e2e', 'fixtures');

export const qrSvgPath = (artefactId: string) => join(QR_DIR, `${artefactId}.svg`);
export const fakeCameraVideoPath = (artefactId: string) => join(FIXTURES_DIR, `${artefactId}.y4m`);

/** All this needs to know about an artefact: what it is called and what its code says. */
export interface QrArtefact {
  id: string;
  qrPayload: string;
}

async function readIfPresent(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

/** A checkout on Windows may have turned line endings into CRLF; that is not a change. */
function withUnixLineEndings(file: Buffer): string {
  return file.toString().replace(/\r\n/g, '\n');
}

/** Writes `content` to `path` unless that is what the file already holds. */
async function writeIfChanged(path: string, content: Buffer): Promise<boolean> {
  const current = await readIfPresent(path);
  if (current?.equals(content)) return false;
  await writeFile(path, content);
  return true;
}

/**
 * Removes generated files for artefacts that are no longer in the registry. Only files with
 * this generator's own extension, in this generator's own directory, are ever considered.
 */
async function removeStale(directory: string, extension: string, ids: Set<string>) {
  const removed: string[] = [];
  for (const name of await readdir(directory)) {
    if (!name.endsWith(extension) || ids.has(name.slice(0, -extension.length))) continue;
    await rm(join(directory, name));
    removed.push(name);
  }
  return removed;
}

export interface GeneratedAssets {
  /** Files whose contents changed (or that were new). */
  written: string[];
  /** Files deleted because their artefact is gone. */
  removed: string[];
  total: number;
}

/** Writes the QR code of every artefact as an SVG into public/qr. */
export async function generateQrSvgs(artefacts: readonly QrArtefact[]): Promise<GeneratedAssets> {
  await mkdir(QR_DIR, { recursive: true });
  const written: string[] = [];
  for (const artefact of artefacts) {
    const svg = Buffer.from(await renderQrSvg(artefact.qrPayload));
    if (await writeIfChanged(qrSvgPath(artefact.id), svg)) written.push(`${artefact.id}.svg`);
  }
  const removed = await removeStale(QR_DIR, '.svg', new Set(artefacts.map((a) => a.id)));
  return { written, removed, total: artefacts.length };
}

/** Writes a fake-camera video of every artefact's QR code into e2e/fixtures. */
export async function generateFakeCameraVideos(
  artefacts: readonly QrArtefact[],
): Promise<GeneratedAssets> {
  await mkdir(FIXTURES_DIR, { recursive: true });
  const written: string[] = [];
  for (const artefact of artefacts) {
    const video = renderFakeCameraVideo(artefact.qrPayload);
    if (await writeIfChanged(fakeCameraVideoPath(artefact.id), video)) {
      written.push(`${artefact.id}.y4m`);
    }
  }
  const removed = await removeStale(FIXTURES_DIR, '.y4m', new Set(artefacts.map((a) => a.id)));
  return { written, removed, total: artefacts.length };
}

/**
 * Compares the checked-in SVGs with what the registry says they should be, without changing
 * anything. Returns what is wrong, in words; an empty list means they are up to date.
 */
export async function findStaleQrSvgs(artefacts: readonly QrArtefact[]): Promise<string[]> {
  const problems: string[] = [];
  for (const artefact of artefacts) {
    const onDisk = await readIfPresent(qrSvgPath(artefact.id));
    if (!onDisk) {
      problems.push(`${artefact.id}.svg is missing`);
    } else if (withUnixLineEndings(onDisk) !== (await renderQrSvg(artefact.qrPayload))) {
      problems.push(`${artefact.id}.svg is out of date`);
    }
  }

  const ids = new Set(artefacts.map((artefact) => artefact.id));
  const names = await readdir(QR_DIR).catch(() => [] as string[]);
  for (const name of names) {
    if (name.endsWith('.svg') && !ids.has(name.slice(0, -'.svg'.length))) {
      problems.push(`${name} has no artefact in the registry`);
    }
  }
  return problems;
}
