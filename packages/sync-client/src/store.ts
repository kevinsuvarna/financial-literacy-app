import { z } from 'zod';
import { gameEventSchema, playerIdSchema, timestampSchema } from '@app/api-contract';

/** The most events kept waiting. Past this the oldest are dropped: analytics, not progress. */
export const MAX_OUTBOX_EVENTS = 500;

/**
 * What the sync engine remembers between visits. The saved game itself is not here — the game
 * keeps that, and writes it the moment anything changes; this is only the bookkeeping for
 * getting it to the server afterwards.
 */
export const syncStateSchema = z.object({
  /** This device's player: a random UUID, made here. */
  playerId: playerIdSchema,
  /** Whether the server has been told about `playerId` yet. */
  registered: z.boolean(),
  /** When the local save last changed. Zero until it first does. */
  localUpdatedAt: timestampSchema,
  /** The `updatedAt` the server last agreed with. Equal to `localUpdatedAt` when in sync. */
  pushedUpdatedAt: timestampSchema.nullable(),
  /** Events not yet acknowledged by the server, oldest first. */
  outbox: z.array(gameEventSchema).max(MAX_OUTBOX_EVENTS),
});
export type SyncState = z.infer<typeof syncStateSchema>;

export function createInitialSyncState(playerId: string): SyncState {
  return { playerId, registered: false, localUpdatedAt: 0, pushedUpdatedAt: null, outbox: [] };
}

export interface SyncStore {
  /** The stored state, or null if there is none (or it can't be read). */
  load(): SyncState | null;
  save(state: SyncState): void;
}

export function createMemorySyncStore(initial: SyncState | null = null): SyncStore {
  let stored = initial;
  return {
    load: () => (stored ? structuredClone(stored) : null),
    save(state) {
      stored = structuredClone(state);
    },
  };
}

/**
 * Keeps the state in web storage (localStorage). Storage that is full, disabled or holding
 * something unreadable never throws out of here: sync then simply starts over.
 */
export function createStorageSyncStore(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key = 'ssa-sync',
): SyncStore {
  return {
    load() {
      try {
        const raw = storage.getItem(key);
        if (!raw) return null;
        const parsed = syncStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        storage.setItem(key, JSON.stringify(state));
      } catch {
        // Best-effort: the game goes on, and sync catches up when storage works again.
      }
    },
  };
}
