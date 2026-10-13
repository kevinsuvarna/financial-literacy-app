import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/** Cloudflare D1-backed client, used in the deployed Worker. */
export function createD1Db(d1: D1Database) {
  return drizzle(d1, { schema });
}
