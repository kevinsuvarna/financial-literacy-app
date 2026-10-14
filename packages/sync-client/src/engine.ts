import {
  gameEventSchema,
  MAX_EVENTS_PER_BATCH,
  type GameEvent,
  type Progress,
} from '@app/api-contract';
import { SyncApiError, type SyncApi } from './api';
import { createInitialSyncState, MAX_OUTBOX_EVENTS, type SyncState, type SyncStore } from './store';

/** How long after a change the engine waits before syncing, so a burst goes up as one save. */
export const SYNC_DEBOUNCE_MS = 1_000;
/** The first retry delay; it doubles with each failure in a row, up to the cap. */
export const RETRY_BASE_MS = 2_000;
export const RETRY_CAP_MS = 60_000;
/** A run that keeps finding more to do is cut off here and picked up again shortly. */
const MAX_PASSES_PER_RUN = 5;

export type SyncStatus =
  /** Nothing has needed syncing yet. */
  | 'idle'
  | 'syncing'
  /** Everything local is on the server. */
  | 'synced'
  /** The device is offline; sync resumes when it says it is back. */
  | 'offline'
  /** Held by the app (see `hold`). */
  | 'paused'
  /** The last attempt failed; another is scheduled. */
  | 'retrying';

/** The local save, as the game holds it right now. */
export interface LocalSave {
  snapshot: Record<string, unknown>;
  version: number;
}

export interface SyncEngineDeps {
  api: SyncApi;
  store: SyncStore;
  /** Reads the game's local save. Called at the moment of sending, never cached. */
  readLocal: () => LocalSave;
  /**
   * Replaces the local game with a save from the server. Returns false if this build of the
   * game can't use it (a different schema version, or not a game it recognises) — the local
   * game is then left exactly as it was.
   */
  applyRemote: (remote: Progress) => boolean;
  now: () => number;
  isOnline: () => boolean;
  newId: () => string;
  /** `setTimeout`, returning the function that cancels it. */
  schedule: (callback: () => void, delayMs: number) => () => void;
  /** 0–1, for spreading retries out. */
  random?: () => number;
}

export interface SyncEngine {
  /** Syncs once now, if anything is waiting from an earlier visit. */
  start(): void;
  /** The local save changed. It is already stored on the device; this gets it to the server. */
  notifyLocalChange(): void;
  /** Queues something the player tried, to be sent with the next batch. */
  recordEvent(event: Omit<GameEvent, 'id' | 'ts'>): void;
  /** The device is back online: try now rather than waiting out a retry delay. */
  notifyOnline(): void;
  /**
   * Stops the engine from starting any request until the returned function is called. A
   * request already on its way is not cancelled.
   */
  hold(): () => void;
  /** Runs a sync now and resolves when it has finished (successfully or not). */
  syncNow(): Promise<void>;
  getStatus(): SyncStatus;
  getState(): SyncState;
  subscribe(listener: (status: SyncStatus) => void): () => void;
}

/** Two saves hold the same game, whatever order their keys happen to be in. */
function sameSnapshot(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) =>
      key in b &&
      sameSnapshot((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * Local-first sync. The game never waits for this: it saves to the device immediately and
 * tells the engine afterwards. The engine's job is to get that save — and a queue of events —
 * to the server in the background, whenever that becomes possible, however long it takes.
 *
 * Conflicts are settled the way the server settles them: the save with the newest `updatedAt`
 * wins, whole. If the server holds a newer save than this device, the device adopts it; if
 * this device's is newer, it replaces the server's. Nothing is merged.
 *
 * Nothing in here touches the DOM or the network directly — both arrive through `deps` — so
 * the same engine runs in a browser and in tests.
 */
export function createSyncEngine(deps: SyncEngineDeps): SyncEngine {
  const random = deps.random ?? Math.random;
  const listeners = new Set<(status: SyncStatus) => void>();

  let state = deps.store.load() ?? createInitialSyncState(deps.newId());
  let status: SyncStatus = 'idle';
  /** Whether the server's save has been looked at since this page loaded. */
  let pulled = false;
  let running: Promise<void> | null = null;
  let rerun = false;
  let failures = 0;
  let holds = 0;
  let cancelTimer: (() => void) | null = null;

  function update(patch: Partial<SyncState>) {
    state = { ...state, ...patch };
    deps.store.save(state);
  }

  function setStatus(next: SyncStatus) {
    if (next === status) return;
    status = next;
    for (const listener of listeners) listener(status);
  }

  const isDirty = () => state.localUpdatedAt > 0 && state.localUpdatedAt !== state.pushedUpdatedAt;
  // A device that has never synced has nothing to fetch; one that has may have a newer save
  // waiting on the server from another tab or device.
  const hasWork = () => isDirty() || state.outbox.length > 0 || (state.registered && !pulled);

  function scheduleRun(delayMs: number) {
    cancelTimer?.();
    cancelTimer = deps.schedule(() => {
      cancelTimer = null;
      void run();
    }, delayMs);
  }

  function retryDelay(): number {
    const base = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** (failures - 1));
    return Math.round(base * (1 + random() * 0.25));
  }

  /**
   * Settles this device against a save the server holds. The newest wins; a tie goes to the
   * server, which is the copy every other device will see.
   */
  function reconcile(remote: Progress, sent?: { snapshot: unknown; updatedAt: number }) {
    const inSync = { localUpdatedAt: remote.updatedAt, pushedUpdatedAt: remote.updatedAt };

    if (remote.updatedAt < state.localUpdatedAt) return; // Ours is newer: it will be pushed.

    if (remote.updatedAt === state.localUpdatedAt) {
      // The same moment. If it is also the same game — our own save, come back to us — there
      // is nothing to do; if not, the server's copy stands.
      const local = sent && sent.updatedAt === remote.updatedAt ? sent.snapshot : null;
      if (sameSnapshot(local ?? deps.readLocal().snapshot, remote.snapshot)) {
        update(inSync);
        return;
      }
    }

    if (deps.applyRemote(remote)) {
      update(inSync);
    } else {
      // A save this build can't read. Leave it be, and stop offering ours until it changes —
      // at which point ours will be the newer one.
      update({ pushedUpdatedAt: state.localUpdatedAt });
    }
  }

  async function register() {
    const player = await deps.api.registerPlayer(state.playerId);
    update({ registered: true });
    // A player the server has only just met has nothing saved there to fetch.
    if (player.isNew) pulled = true;
  }

  async function pull() {
    const remote = await deps.api.getProgress(state.playerId);
    pulled = true;
    if (remote) reconcile(remote);
  }

  async function push() {
    const local = deps.readLocal();
    const sent = { snapshot: local.snapshot, updatedAt: state.localUpdatedAt };
    let result;
    try {
      result = await deps.api.putProgress(state.playerId, { ...local, updatedAt: sent.updatedAt });
    } catch (error) {
      if (error instanceof SyncApiError && !error.retryable && error.kind !== 'not_found') {
        // Refused outright: sending the same save again can't help. Wait for the next change.
        if (state.localUpdatedAt === sent.updatedAt) update({ pushedUpdatedAt: sent.updatedAt });
        return;
      }
      throw error;
    }

    const changedMeanwhile = state.localUpdatedAt !== sent.updatedAt;
    if (result.applied) {
      // The server may have pulled a clock that runs ahead back to its own "now".
      update(
        changedMeanwhile
          ? { pushedUpdatedAt: result.progress.updatedAt }
          : {
              localUpdatedAt: result.progress.updatedAt,
              pushedUpdatedAt: result.progress.updatedAt,
            },
      );
      return;
    }

    // Not applied: the server holds a save at least as new as the one it was sent. If ours
    // still looks newer by this device's clock, that clock runs ahead and the server judged
    // the save by its own — so go by the server's reading, or this would be offered forever.
    if (!changedMeanwhile && result.progress.updatedAt < sent.updatedAt) {
      sent.updatedAt = result.progress.updatedAt;
      update({ localUpdatedAt: result.progress.updatedAt });
    }
    reconcile(result.progress, sent);
  }

  async function flushEvents() {
    while (state.outbox.length > 0) {
      const batch = state.outbox.slice(0, MAX_EVENTS_PER_BATCH);
      try {
        await deps.api.postEvents(state.playerId, batch);
      } catch (error) {
        // A batch the server refuses would be refused every time, and block every event
        // behind it. It is dropped; anything else is worth another try.
        if (!(error instanceof SyncApiError) || error.retryable || error.kind === 'not_found') {
          throw error;
        }
      }
      // By id, not position: more events may have been queued while this batch was away.
      const sentIds = new Set(batch.map((event) => event.id));
      update({ outbox: state.outbox.filter((event) => !sentIds.has(event.id)) });
    }
  }

  async function pass() {
    try {
      if (!state.registered) await register();
      if (!pulled) await pull();
      if (isDirty()) await push();
      await flushEvents();
    } catch (error) {
      if (error instanceof SyncApiError && error.kind === 'not_found') {
        // The server has forgotten this player (its database was reset, say). Introduce
        // ourselves again on the next attempt.
        update({ registered: false });
      }
      throw error;
    }
  }

  async function runOnce() {
    if (holds > 0) return setStatus('paused');
    if (!hasWork()) return setStatus(state.registered ? 'synced' : 'idle');
    if (!deps.isOnline()) return setStatus('offline');

    cancelTimer?.();
    cancelTimer = null;
    setStatus('syncing');

    try {
      let passes = 0;
      do {
        rerun = false;
        await pass();
        passes += 1;
      } while ((rerun || hasWork()) && holds === 0 && passes < MAX_PASSES_PER_RUN);
    } catch {
      failures += 1;
      setStatus('retrying');
      scheduleRun(retryDelay());
      return;
    }

    failures = 0;
    if (holds > 0) return setStatus('paused');
    if (hasWork()) {
      setStatus('syncing');
      scheduleRun(SYNC_DEBOUNCE_MS);
    } else {
      setStatus('synced');
    }
  }

  function run(): Promise<void> {
    if (running) {
      // Whatever prompted this will be picked up by the run already under way.
      rerun = true;
      return running;
    }
    running = runOnce().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    start() {
      void run();
    },

    notifyLocalChange() {
      // Strictly later than the last change, even if the device's clock has been set back.
      update({ localUpdatedAt: Math.max(deps.now(), state.localUpdatedAt + 1) });
      scheduleRun(SYNC_DEBOUNCE_MS);
    },

    recordEvent(input) {
      const event = gameEventSchema.safeParse({ ...input, id: deps.newId(), ts: deps.now() });
      // Anything that doesn't fit the contract would only be refused by the server.
      if (!event.success) return;
      update({ outbox: [...state.outbox, event.data].slice(-MAX_OUTBOX_EVENTS) });
      scheduleRun(SYNC_DEBOUNCE_MS);
    },

    notifyOnline() {
      failures = 0;
      scheduleRun(0);
    },

    hold() {
      holds += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holds -= 1;
        if (holds === 0) scheduleRun(0);
      };
    },

    syncNow: () => run(),
    getStatus: () => status,
    getState: () => structuredClone(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
