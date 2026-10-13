import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createLocalDb } from './client';
import { healthchecks } from './schema';

describe('createLocalDb', () => {
  it('creates the schema and round-trips a row', async () => {
    const dbFile = join(tmpdir(), `financial-literacy-api-${randomUUID()}.db`);
    const db = createLocalDb(`file:${dbFile}`);

    await db.run(
      sql`create table healthchecks (id integer primary key autoincrement, checked_at text not null)`,
    );
    await db.insert(healthchecks).values({ checkedAt: new Date().toISOString() });

    const rows = await db.select().from(healthchecks).all();
    expect(rows).toHaveLength(1);
  });
});
