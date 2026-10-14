import type { Progress } from '@app/api-contract';
import type { SyncApi } from './api';
import { createSyncEngine, type SyncEngine, type SyncEngineDeps } from './engine';
import { createMemorySyncStore, type SyncStore } from './store';

/** A clock and `setTimeout` that only move when a test moves them. */
export function createFakeTime(start = 1_800_000_000_000) {
  let now = start;
  let nextHandle = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();

  return {
    now: () => now,
    setNow(value: number) {
      now = value;
    },
    schedule(callback: () => void, delayMs: number) {
      const handle = (nextHandle += 1);
      timers.set(handle, { at: now + delayMs, callback });
      return () => void timers.delete(handle);
    },
    /** When the next timer is due, in milliseconds from now — or null if none is set. */
    nextDelay(): number | null {
      const times = [...timers.values()].map((timer) => timer.at - now);
      return times.length > 0 ? Math.min(...times) : null;
    },
    /** Moves the clock on, firing every timer that falls due, in order. */
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort(([, a], [, b]) => a.at - b.at)[0];
        if (!due) break;
        const [handle, timer] = due;
        timers.delete(handle);
        now = Math.max(now, timer.at);
        timer.callback();
      }
      now = target;
    },
  };
}
export type FakeTime = ReturnType<typeof createFakeTime>;

/** A stand-in for the game on one device: a save that can be changed, and replaced by sync. */
export function createFakeGame(initial: Record<string, unknown> = { value: 'notStarted' }) {
  let snapshot = initial;
  const adopted: Progress[] = [];

  return {
    version: 1,
    /** When false, `applyRemote` refuses — as a build would for a save it can't read. */
    canRead: (() => true) as (remote: Progress) => boolean,
    get snapshot() {
      return snapshot;
    },
    /** Every save taken from the server, in order. */
    adopted,
    set(next: Record<string, unknown>) {
      snapshot = next;
    },
    readLocal() {
      return { snapshot, version: this.version };
    },
    applyRemote(remote: Progress) {
      if (remote.version !== this.version || !this.canRead(remote)) return false;
      snapshot = remote.snapshot;
      adopted.push(remote);
      return true;
    },
  };
}
export type FakeGame = ReturnType<typeof createFakeGame>;

export interface Device {
  engine: SyncEngine;
  game: FakeGame;
  store: SyncStore;
  time: FakeTime;
  online: { value: boolean };
  /** The player changes the game: it is saved locally, and sync is told. */
  play(snapshot: Record<string, unknown>): void;
  /** Lets the debounce (or a retry) elapse and waits for the sync it starts to finish. */
  settle(ms?: number): Promise<void>;
}

let deviceCount = 0;

/**
 * A device for tests: a fake game, a fake clock, its own storage, and a sync engine wired to
 * whatever `api` it is given — a stub, or the real routes.
 */
export function createDevice(
  api: SyncApi,
  overrides: Partial<SyncEngineDeps> & { time?: FakeTime; playerId?: string } = {},
): Device {
  deviceCount += 1;
  const serial = deviceCount;
  let ids = 0;
  const time = overrides.time ?? createFakeTime();
  const game = createFakeGame();
  const store = overrides.store ?? createMemorySyncStore();
  const online = { value: true };

  const engine = createSyncEngine({
    api,
    store,
    readLocal: () => game.readLocal(),
    applyRemote: (remote) => game.applyRemote(remote),
    now: time.now,
    isOnline: () => online.value,
    schedule: time.schedule,
    random: () => 0,
    // Deterministic v4 UUIDs: the first is the player (unless one is given), the rest events.
    newId: () => {
      ids += 1;
      if (ids === 1 && overrides.playerId) return overrides.playerId;
      const device = String(serial).padStart(4, '0');
      return `${device}0000-0000-4000-8000-${String(ids).padStart(12, '0')}`;
    },
    ...overrides,
  });

  return {
    engine,
    game,
    store,
    time,
    online,
    play(snapshot) {
      game.set(snapshot);
      engine.notifyLocalChange();
    },
    async settle(ms = 1_000) {
      time.advance(ms);
      await engine.syncNow();
    },
  };
}
