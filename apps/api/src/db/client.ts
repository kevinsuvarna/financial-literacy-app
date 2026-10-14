import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

/** The SQL migrations drizzle-kit generates — the same files `wrangler d1 migrations` applies. */
const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Local SQLite (libSQL) client, used for development and tests. */
export function createLocalDb(url = 'file:./local.db') {
  return drizzle(createClient({ url }), { schema });
}

export type LocalDb = ReturnType<typeof createLocalDb>;

/** Brings a local database up to the current schema. Safe to run on every start. */
export async function migrateLocalDb(db: LocalDb): Promise<void> {
  await migrate(db, { migrationsFolder });
}
