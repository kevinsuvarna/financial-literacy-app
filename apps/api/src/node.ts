import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createLocalDb } from './db/client';

const port = Number(process.env.PORT ?? 8787);
const app = createApp(createLocalDb());

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
