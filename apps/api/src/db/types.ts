import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/**
 * What the routes need from a database: Drizzle's async SQLite interface, which both the D1
 * client (the deployed Worker) and the libSQL client (local development and tests) implement.
 * Routes written against this run unchanged on either.
 */
export type Db = BaseSQLiteDatabase<'async', unknown, typeof schema>;
