# API — Save the Savings Account

Optional progress sync for the game. A Hono app on Cloudflare Workers, storing data in D1
(Cloudflare's SQLite). Locally it runs on Node with a SQLite file. The game works without it.

## What it stores

No personal data. A player is a random UUID made on the device; there is no name, email, IP
address or user agent anywhere, and every request body is a strict schema (unknown fields are
refused; event fields only accept ids).

| Table      | Columns                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `players`  | `id`, `created_at`                                                       |
| `progress` | `player_id`, `snapshot` (the game's save, JSON), `version`, `updated_at` |
| `events`   | `id`, `player_id`, `task_id`, `kind`, `artefact_id`, `correct`, `ts`     |

## Routes

| Route               | Does                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST /players`     | Registers a player (a device may bring its own UUID). Idempotent.                                    |
| `GET /progress/:id` | The player's save, or 404.                                                                           |
| `PUT /progress/:id` | Saves — last write wins by `updatedAt`. An older save is not applied, and the newer one is returned. |
| `POST /events`      | Up to 50 events. Each has a UUID, so a resent batch is stored once.                                  |
| `GET /health`       | 200 when the database answers.                                                                       |

Request and response shapes are in [`packages/api-contract`](../../packages/api-contract/src/index.ts).
CORS allows only the origins in `WEB_ORIGIN`.

## Develop

```bash
pnpm --filter api dev    # http://localhost:8787, SQLite in apps/api/local.db (migrated on start)
pnpm --filter api test   # routes, plus the web app's sync engine against the real routes
```

To run the Worker itself locally, on a local D1:

```bash
cp .dev.vars.example .dev.vars
pnpm --filter api run db:migrate:local
pnpm --filter api run dev:worker
```

## Change the schema

Edit [`src/db/schema.ts`](src/db/schema.ts), then generate a migration and commit it:

```bash
pnpm --filter api run db:generate
```

The same SQL in [`drizzle/`](drizzle) is applied by the local server on start and by wrangler
to D1.

## Deploy to Cloudflare Workers + D1

You need a Cloudflare account. Run these from `apps/api`.

1. Sign in once:

   ```bash
   pnpm exec wrangler login
   ```

2. Create the database once, and copy the `database_id` it prints into
   [`wrangler.jsonc`](wrangler.jsonc) (replacing `REPLACE_WITH_D1_DATABASE_ID`):

   ```bash
   pnpm exec wrangler d1 create financial-literacy-db
   ```

3. Set `WEB_ORIGIN` in `wrangler.jsonc` to the game's address (e.g.
   `https://save-the-savings-account.pages.dev`). Several origins can be separated by commas.
   Browsers on any other site can't call the API.

4. Create the tables:

   ```bash
   pnpm run db:migrate:prod
   ```

5. Deploy:

   ```bash
   pnpm run deploy
   ```

   Wrangler prints the Worker's URL. Give it to the game as `VITE_API_URL` (see
   [`../web/README.md`](../web/README.md)), and check it with
   `curl https://<worker-url>/health`.

Run `db:migrate:prod` again before deploying whenever a new migration has been added.

## Security notes

- The player UUID is the only credential: whoever has it can read and overwrite that save.
  There is no login, by design — the game asks for nothing that identifies a child.
- "Last write wins" uses the device's clock, so a save stamped more than five minutes ahead of
  the server is treated as made "now".
