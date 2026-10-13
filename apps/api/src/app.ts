import { Hono } from 'hono';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { healthchecks } from './db/schema';

type Db = LibSQLDatabase<typeof schema> | DrizzleD1Database<typeof schema>;

export function createApp(db: Db) {
  const app = new Hono();

  app.get('/health', async (c) => {
    const rows = await db.select().from(healthchecks).all();
    return c.json({ ok: true, count: rows.length });
  });

  return app;
}
