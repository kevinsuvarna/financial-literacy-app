import { createApp } from './app';
import { createD1Db } from './db/client.d1';

interface Env {
  DB: D1Database;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return createApp(createD1Db(env.DB)).fetch(request, env, ctx);
  },
};
