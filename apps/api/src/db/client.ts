import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/** Local SQLite (libSQL) client, used for development and tests. */
export function createLocalDb(url = 'file:./local.db') {
  return drizzle(createClient({ url }), { schema });
}
