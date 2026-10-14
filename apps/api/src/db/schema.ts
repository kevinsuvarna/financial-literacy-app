import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Nothing in these tables identifies a person. A player is a random UUID made on the device;
// there is no name, email, IP address or user agent anywhere, and the events table has no
// free-text column to put one in. All times are milliseconds since the Unix epoch.

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
});

/** One saved game per player: the newest save wins (see `putProgress`). */
export const progress = sqliteTable('progress', {
  playerId: text('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  /** The game's own state, opaque to the API. */
  snapshot: text('snapshot', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  /** The schema version of `snapshot`, so a client never loads a save it can't read. */
  version: integer('version').notNull(),
  /** When the save last changed on the device that made it. */
  updatedAt: integer('updated_at').notNull(),
});

/** What players tried, and whether the game accepted it — for seeing where the game is hard. */
export const events = sqliteTable(
  'events',
  {
    /** Made on the device, so that a batch delivered twice is stored once. */
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    taskId: text('task_id').notNull(),
    kind: text('kind', {
      enum: ['scan', 'tap', 'highlight', 'choice', 'passkey', 'report'],
    }).notNull(),
    /** The id of what was scanned, tapped, highlighted or chosen; null where there is none. */
    artefactId: text('artefact_id'),
    correct: integer('correct', { mode: 'boolean' }).notNull(),
    ts: integer('ts').notNull(),
  },
  (table) => [
    index('events_player_idx').on(table.playerId),
    index('events_task_idx').on(table.taskId, table.kind),
  ],
);
