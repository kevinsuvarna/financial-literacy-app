# Save the Savings Account

A phygital financial-literacy game for 12–14-year-olds. Players help Ananya protect her savings
account: they scan printed artefacts (account cards, ID documents, a bank statement, a cheque,
a phishing message) with a device camera, investigate them on screen, and file an incident
report. The product brief is [docs/SPEC.md](docs/SPEC.md); contributor rules are in
[CLAUDE.md](CLAUDE.md).

## What's here

| Path                    | What it is                                                              |
| ----------------------- | ----------------------------------------------------------------------- |
| `apps/web`              | The game: React, XState, Tailwind, a PWA that plays fully offline       |
| `apps/api`              | Optional progress sync: Hono on Cloudflare Workers, D1 (SQLite locally) |
| `packages/content`      | Every word, number, answer and artefact in the game, validated with zod |
| `packages/api-contract` | The request/response schemas shared by the web app and the API          |
| `packages/sync-client`  | The local-first sync engine (no DOM, no network of its own)             |
| `scripts`               | QR codes, fake-camera videos, app icons, the printable PDF, Lighthouse  |

## Getting started

Needs Node 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

The game is at http://localhost:5173 and the API at http://localhost:8787. Progress stays on the
device unless `apps/web/.env.local` sets `VITE_API_URL` (see
[apps/web/.env.example](apps/web/.env.example)).

Add `?debug=1` to the URL for the debug panel (jump to any task, inject scans, reset).

## Commands

| Command           | Does                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`        | Web app and API, with reload                                                 |
| `pnpm typecheck`  | TypeScript, everywhere                                                       |
| `pnpm lint`       | ESLint                                                                       |
| `pnpm test`       | Unit and integration tests (Vitest)                                          |
| `pnpm e2e`        | End-to-end tests (Playwright) against a production build                     |
| `pnpm qr`         | Regenerates the QR SVGs and fake-camera videos from the artefact registry    |
| `pnpm print:pdf`  | Exports the printable artefact cards to `dist/artefacts.pdf`                 |
| `pnpm icons`      | Renders `apps/web/public/icon.svg` to the PNG app icons                      |
| `pnpm lighthouse` | Lighthouse performance + accessibility on a production build; fails under 90 |

End-to-end tests run in two Playwright projects: `chromium` (the card list, mouse, keyboard and
touch) and `camera` (a fake webcam playing QR-code videos through the real camera path).

## Running a session

1. Print the cards: `pnpm print:pdf`, or open `/print` in the game and print at 100% scale. Cut
   along the crop marks.
2. Open the game on a tablet or laptop with a camera, once while online. From then on it works
   offline.
3. Players scan the cards when asked. If a camera isn't available, the game offers the same
   cards as a list.

## Deploying

- The game: [apps/web/README.md](apps/web/README.md) — Cloudflare Pages.
- The API (optional): [apps/api/README.md](apps/api/README.md) — Cloudflare Workers + D1.

Deploy the API first if you want sync: the game's build needs its URL.
