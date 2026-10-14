import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { eq, sql } from 'drizzle-orm';
import {
  createPlayerBodySchema,
  playerIdSchema,
  postEventsBodySchema,
  putProgressBodySchema,
  type Player,
  type PostEventsResponse,
  type Progress,
  type PutProgressResponse,
} from '@app/api-contract';
import { events, players, progress } from './db/schema';
import type { Db } from './db/types';
import { errorResponse, validate, validateBody } from './http';

/** Nothing the game sends comes near this; it only keeps junk from being read into memory. */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * D1 allows 100 bound parameters per statement, and an event row binds seven. Twelve rows per
 * insert keeps a batch under that with room to spare; libSQL has no such limit but is given
 * the same statements, so local behaviour matches production.
 */
const EVENT_ROWS_PER_INSERT = 12;

/**
 * How far ahead of the server's clock a save's `updatedAt` may claim to be. "Newest wins" is
 * decided by clocks on players' devices; one set to next year would otherwise win every
 * comparison from then on, so anything further ahead than this is treated as "now".
 */
const CLOCK_SKEW_ALLOWANCE_MS = 5 * 60 * 1000;

export interface AppOptions {
  /**
   * The web app's origins — the only ones browsers are told may call this API. Anything else
   * gets no CORS headers at all.
   */
  allowedOrigins: readonly string[];
  /** The server's clock, for tests. */
  now?: () => number;
  /** Makes player ids, for tests. */
  newId?: () => string;
}

/** Splits a comma-separated list of origins, as it arrives from an environment variable. */
export function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

export function createApp(db: Db, options: AppOptions) {
  const now = options.now ?? Date.now;
  const newId = options.newId ?? (() => crypto.randomUUID());
  const allowedOrigins = new Set(options.allowedOrigins);
  const app = new Hono();

  app.use(
    cors({
      origin: (origin) => (allowedOrigins.has(origin) ? origin : null),
      allowMethods: ['GET', 'PUT', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      maxAge: 86_400,
    }),
  );
  app.use(
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => errorResponse(c, 'payload_too_large'),
    }),
  );
  app.notFound((c) => errorResponse(c, 'not_found'));
  app.onError((error, c) => {
    // The message only: a request's contents are never written to the log.
    console.error('Unhandled error:', error instanceof Error ? error.message : 'unknown');
    return errorResponse(c, 'internal_error');
  });

  async function playerExists(id: string): Promise<boolean> {
    const rows = await db.select({ id: players.id }).from(players).where(eq(players.id, id));
    return rows.length > 0;
  }

  app.get('/health', async (c) => {
    await db.run(sql`select 1`);
    return c.json({ ok: true });
  });

  /**
   * Registers a player. A device may bring an id it made while offline; registering the same
   * id again answers with the player as first created, so a retried request is harmless.
   */
  app.post('/players', async (c) => {
    const body = await validateBody(c, createPlayerBodySchema);
    if (!body.ok) return body.response;

    const id = body.data.id ?? newId();
    const created = await db
      .insert(players)
      .values({ id, createdAt: now() })
      .onConflictDoNothing({ target: players.id })
      .returning();

    const fresh = created[0];
    if (fresh) return c.json(fresh satisfies Player, 201);

    const existing = await db.select().from(players).where(eq(players.id, id));
    const player = existing[0];
    if (!player) return errorResponse(c, 'internal_error');
    return c.json(player satisfies Player, 200);
  });

  app.get('/progress/:id', async (c) => {
    const id = validate(c, playerIdSchema, c.req.param('id'));
    if (!id.ok) return id.response;

    const rows = await db.select().from(progress).where(eq(progress.playerId, id.data));
    const saved = rows[0];
    // An unknown player and a player with nothing saved look the same from outside.
    if (!saved) return errorResponse(c, 'not_found');

    const body: Progress = {
      snapshot: saved.snapshot,
      version: saved.version,
      updatedAt: saved.updatedAt,
    };
    return c.json(body);
  });

  /**
   * Saves a game — last write wins, by `updatedAt`. The save is stored only if it is strictly
   * newer than the one held; otherwise nothing changes and the answer carries the held save,
   * for the client to adopt. The comparison happens inside one statement, so two devices
   * saving at once can't both believe they won.
   */
  app.put('/progress/:id', async (c) => {
    const id = validate(c, playerIdSchema, c.req.param('id'));
    if (!id.ok) return id.response;
    const body = await validateBody(c, putProgressBodySchema);
    if (!body.ok) return body.response;
    if (!(await playerExists(id.data))) return errorResponse(c, 'not_found');

    const updatedAt = Math.min(body.data.updatedAt, now() + CLOCK_SKEW_ALLOWANCE_MS);
    const written = await db
      .insert(progress)
      .values({
        playerId: id.data,
        snapshot: body.data.snapshot,
        version: body.data.version,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: progress.playerId,
        set: {
          snapshot: sql`excluded.snapshot`,
          version: sql`excluded.version`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`excluded.updated_at > ${progress.updatedAt}`,
      })
      .returning();

    const applied = written.length > 0;
    const held =
      written[0] ?? (await db.select().from(progress).where(eq(progress.playerId, id.data)))[0];
    if (!held) return errorResponse(c, 'internal_error');

    const response: PutProgressResponse = {
      applied,
      progress: { snapshot: held.snapshot, version: held.version, updatedAt: held.updatedAt },
    };
    return c.json(response);
  });

  /**
   * Stores a batch of events. Each carries an id made on the device, and an id already stored
   * is skipped — so a batch that is sent again after a lost reply is not counted twice.
   */
  app.post('/events', async (c) => {
    const body = await validateBody(c, postEventsBodySchema);
    if (!body.ok) return body.response;
    if (!(await playerExists(body.data.playerId))) return errorResponse(c, 'not_found');

    const rows = body.data.events.map((event) => ({ ...event, playerId: body.data.playerId }));
    let accepted = 0;
    for (const batch of chunk(rows, EVENT_ROWS_PER_INSERT)) {
      const inserted = await db
        .insert(events)
        .values(batch)
        .onConflictDoNothing({ target: events.id })
        .returning({ id: events.id });
      accepted += inserted.length;
    }

    return c.json({ accepted } satisfies PostEventsResponse, 202);
  });

  return app;
}
