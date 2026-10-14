# Web app — Save the Savings Account

The game itself: a single-page React app, built with Vite, installable as a PWA that plays fully
offline after one visit. It is a static site, so it deploys to Cloudflare Pages.

## Develop

From the repository root:

```bash
pnpm install
pnpm dev            # http://localhost:5173 (and the API on :8787)
```

Or just this app: `pnpm --filter web dev`.

| Setting        | Where                     | What                                                                   |
| -------------- | ------------------------- | ---------------------------------------------------------------------- |
| `VITE_API_URL` | `.env.local` (build time) | The API's URL. Unset: no sync, and the game makes no network requests. |

Copy [`.env.example`](.env.example) to `.env.local` to turn sync on locally.

## Test

```bash
pnpm --filter web test   # Vitest
pnpm --filter web e2e    # Playwright, against a production build on :4173
```

## Deploy to Cloudflare Pages

You need a Cloudflare account. Everything else is in this folder: [`wrangler.jsonc`](wrangler.jsonc)
(the Pages project, serving `dist/`) and [`public/_headers`](public/_headers) (security and
caching headers).

1. Sign in once:

   ```bash
   pnpm exec wrangler login
   ```

2. Create the Pages project once (the name must match `name` in `wrangler.jsonc`):

   ```bash
   pnpm exec wrangler pages project create save-the-savings-account --production-branch main
   ```

3. If the game should sync progress, put the deployed API's URL in `.env.production` (not
   checked in):

   ```bash
   VITE_API_URL=https://financial-literacy-api.<your-subdomain>.workers.dev
   ```

   and add this site's address to `WEB_ORIGIN` in [`../api/wrangler.jsonc`](../api/wrangler.jsonc).
   Leave it out and the game is entirely local.

4. Build and deploy:

   ```bash
   pnpm --filter web run deploy
   ```

   Wrangler prints the site's URL.

### Deploying from Git instead

In the Cloudflare dashboard, connect the repository to a Pages project with:

| Setting                | Value                                     |
| ---------------------- | ----------------------------------------- |
| Build command          | `pnpm install && pnpm --filter web build` |
| Build output directory | `apps/web/dist`                           |
| Environment variable   | `VITE_API_URL` (optional, as above)       |

### What to expect

- Every route (`/play`, `/board`, `/print`, …) is served the app, as Pages does for a site with
  no `404.html`.
- The service worker precaches the app, the QR decoder, every sound, the QR codes and the icons
  on the first visit. New deploys reach players the next time they open the game online.
- The camera needs HTTPS, which Pages provides.
