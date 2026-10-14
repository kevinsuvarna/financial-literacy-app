import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const webRoot = join(repoRoot, 'apps', 'web');

export interface PreviewBuild {
  /** Where the build is being served, e.g. http://localhost:4179/ */
  origin: string;
  close: () => Promise<void>;
}

/**
 * Builds the web app — exactly as for production — into a temporary folder, and serves it on a
 * free local port. Nothing outside this machine can reach it.
 */
export async function previewProductionBuild(): Promise<PreviewBuild> {
  const outDir = await mkdtemp(join(tmpdir(), 'ssa-build-'));
  await build({ root: webRoot, logLevel: 'warn', build: { outDir, emptyOutDir: true } });
  const server = await preview({
    root: webRoot,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: 'localhost', port: 4179, strictPort: false },
  });
  const origin = server.resolvedUrls?.local[0];
  if (!origin) throw new Error('the preview server gave no address');

  return {
    origin,
    async close() {
      await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
      await rm(outDir, { recursive: true, force: true });
    },
  };
}
