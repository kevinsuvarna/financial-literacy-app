import { createApp, parseOrigins } from './app';
import { createD1Db } from './db/client.d1';

interface Env {
  DB: D1Database;
  /** The web app's origin(s), comma-separated. Set in wrangler.jsonc. */
  WEB_ORIGIN?: string;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const app = createApp(createD1Db(env.DB), { allowedOrigins: parseOrigins(env.WEB_ORIGIN) });
    return app.fetch(request, env, ctx);
  },
};
