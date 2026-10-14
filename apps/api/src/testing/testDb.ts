import { randomUUID } from 'node:crypto';
import { readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalDb, migrateLocalDb, type LocalDb } from '../db/client';
import { events, players, progress } from '../db/schema';

const FILE_PREFIX = 'financial-literacy-api-test-';
const STALE_AFTER_MS = 10 * 60 * 1000;

export interface TestDb {
  db: LocalDb;
  /** Empties every table, for a clean start between tests. */
  reset: () => Promise<void>;
  /** Closes the database. */
  dispose: () => Promise<void>;
}

/** Best-effort: Windows can keep a database file locked for a while after it is closed. */
async function removeQuietly(file: string): Promise<void> {
  await rm(file, { force: true }).catch(() => {});
}

/**
 * Clears out database files that earlier runs could not delete at the time. Only old ones:
 * another test file running right now has a database of its own in the same place.
 */
async function sweepStaleFiles(): Promise<void> {
  const names = await readdir(tmpdir()).catch(() => []);
  await Promise.all(
    names
      .filter((name) => name.startsWith(FILE_PREFIX))
      .map(async (name) => {
        const file = join(tmpdir(), name);
        const info = await stat(file).catch(() => null);
        if (info && Date.now() - info.mtimeMs > STALE_AFTER_MS) await removeQuietly(file);
      }),
  );
}

/**
 * A SQLite database for a test file, built by running the real migrations — so a test that
 * passes here has exercised the same SQL that production's D1 is given.
 *
 * It is a file in the temp directory rather than `:memory:`: libSQL opens a new connection for
 * a transaction, and an in-memory database isn't shared between connections.
 */
export async function createTestDb(): Promise<TestDb> {
  await sweepStaleFiles();
  const file = join(tmpdir(), `${FILE_PREFIX}${randomUUID()}.db`);
  const db = createLocalDb(`file:${file}`);
  await migrateLocalDb(db);

  return {
    db,
    async reset() {
      await db.delete(events);
      await db.delete(progress);
      await db.delete(players);
    },
    async dispose() {
      db.$client.close();
      await removeQuietly(file);
    },
  };
}
