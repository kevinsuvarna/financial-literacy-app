import { serve } from '@hono/node-server';
import { createApp, parseOrigins } from './app';
import { createLocalDb, migrateLocalDb } from './db/client';

// Local development: SQLite in a file beside the code (local.db, git-ignored), brought up to
// date on every start. The deployed API is the Worker in index.ts, on D1.
const port = Number(process.env.PORT ?? 8787);
// The Vite dev server, and `vite preview`.
const allowedOrigins = parseOrigins(
  process.env.WEB_ORIGIN ?? 'http://localhost:5173,http://localhost:4173',
);

const db = createLocalDb(process.env.DATABASE_URL);
await migrateLocalDb(db);

serve({ fetch: createApp(db, { allowedOrigins }).fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
  console.log(`Allowing requests from: ${allowedOrigins.join(', ')}`);
});
