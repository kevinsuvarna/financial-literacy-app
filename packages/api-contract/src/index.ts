import { z } from 'zod';

/**
 * The wire contract between apps/web and apps/api: every request body and response, as zod
 * schemas, so that both sides validate against one definition.
 *
 * No personal data crosses this boundary, and the schemas are built to keep it that way:
 * every object is strict (an unknown key is an error, not something quietly stored), and the
 * only strings an event can carry are ids — lower-case slugs — so there is no field that could
 * hold a name, an email address or free text. A player is a random UUID and nothing else.
 */

/** A player: a random v4 UUID made on the device. It identifies a save, not a person. */
export const playerIdSchema = z.uuid({ version: 'v4' });

/** Milliseconds since the Unix epoch. */
export const timestampSchema = z.number().int().nonnegative().max(8_640_000_000_000_000);

/** An id from packages/content — a task, artefact, cheque zone, statement row or option. */
export const contentIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a lower-case slug')
  .max(64);

// --- Players ------------------------------------------------------------------------------

/**
 * `id` lets a device that made its own id offline register it later; sending the same id
 * again is harmless. Without it the server makes one.
 */
export const createPlayerBodySchema = z.strictObject({ id: playerIdSchema.optional() });
export type CreatePlayerBody = z.infer<typeof createPlayerBodySchema>;

export const playerSchema = z.strictObject({
  id: playerIdSchema,
  createdAt: timestampSchema,
});
export type Player = z.infer<typeof playerSchema>;

// --- Progress -----------------------------------------------------------------------------

/** The most a saved game may weigh as JSON. The real thing is a few kilobytes. */
export const MAX_SNAPSHOT_BYTES = 64 * 1024;

/**
 * A saved game. The snapshot is opaque here — it is the game's own state, and only the game
 * knows how to read it — but it must be a JSON object of a sane size. `version` is the schema
 * version of the snapshot (the same number the web app keeps beside its local save), so a
 * client never loads a save it doesn't understand. `updatedAt` is when the save last changed
 * on the device that made it: the newest one wins.
 */
export const progressSchema = z.strictObject({
  snapshot: z
    .record(z.string(), z.unknown())
    .refine((snapshot) => JSON.stringify(snapshot).length <= MAX_SNAPSHOT_BYTES, {
      message: `snapshot must be at most ${MAX_SNAPSHOT_BYTES} bytes of JSON`,
    }),
  version: z.number().int().positive().max(1_000_000),
  updatedAt: timestampSchema,
});
export type Progress = z.infer<typeof progressSchema>;

export const putProgressBodySchema = progressSchema;
export type PutProgressBody = Progress;

/**
 * The answer to a PUT. `applied` is false when the server already held a save at least as new
 * — in which case `progress` is that save, for the client to adopt.
 */
export const putProgressResponseSchema = z.strictObject({
  applied: z.boolean(),
  progress: progressSchema,
});
export type PutProgressResponse = z.infer<typeof putProgressResponseSchema>;

// --- Events -------------------------------------------------------------------------------

export const eventKindSchema = z.enum(['scan', 'tap', 'highlight', 'choice', 'passkey', 'report']);
export type EventKind = z.infer<typeof eventKindSchema>;

/**
 * One thing the player tried, and whether the game accepted it. `artefactId` is the id of
 * what was scanned, tapped, highlighted or chosen; it is null where there is no such id — and
 * a passkey attempt never carries the code that was entered.
 */
export const gameEventSchema = z.strictObject({
  /** Made on the device, so that a batch sent twice is stored once. */
  id: z.uuid({ version: 'v4' }),
  taskId: contentIdSchema,
  kind: eventKindSchema,
  artefactId: contentIdSchema.nullable(),
  correct: z.boolean(),
  ts: timestampSchema,
});
export type GameEvent = z.infer<typeof gameEventSchema>;

export const MAX_EVENTS_PER_BATCH = 50;

export const postEventsBodySchema = z.strictObject({
  playerId: playerIdSchema,
  events: z.array(gameEventSchema).min(1).max(MAX_EVENTS_PER_BATCH),
});
export type PostEventsBody = z.infer<typeof postEventsBodySchema>;

export const postEventsResponseSchema = z.strictObject({
  /** How many of the batch were new. The rest had been stored by an earlier attempt. */
  accepted: z.number().int().nonnegative(),
});
export type PostEventsResponse = z.infer<typeof postEventsResponseSchema>;

// --- Errors -------------------------------------------------------------------------------

export const errorCodeSchema = z.enum([
  'invalid_request',
  'not_found',
  'payload_too_large',
  'internal_error',
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.strictObject({
  error: errorCodeSchema,
  /** Which parts of the request were wrong, for `invalid_request`. Never echoes values. */
  issues: z.array(z.strictObject({ path: z.string(), message: z.string() })).optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
