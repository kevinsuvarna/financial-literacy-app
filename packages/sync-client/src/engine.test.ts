import { describe, expect, it } from 'vitest';
import type { GameEvent, Progress } from '@app/api-contract';
import { SyncApiError, type SyncApi } from './api';
import { RETRY_BASE_MS, RETRY_CAP_MS, SYNC_DEBOUNCE_MS } from './engine';
import { createInitialSyncState, createMemorySyncStore, MAX_OUTBOX_EVENTS } from './store';
import { createDevice, createFakeTime } from './testing';

const PLAYER = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';

/**
 * A server in memory that keeps saves the way the real one does (newest `updatedAt` wins,
 * ties keep what is held), records every call, and can be told to fail.
 */
function createFakeServer() {
  const players = new Set<string>();
  const saves = new Map<string, Progress>();
  const events: GameEvent[] = [];
  const calls: string[] = [];
  let failure: SyncApiError | null = null;
  let failuresLeft = 0;
  /** If set, a call waits here before answering — to catch the engine mid-request. */
  let gate: Promise<void> | null = null;

  async function begin(name: string) {
    calls.push(name);
    if (gate) await gate;
    if (failure && failuresLeft > 0) {
      failuresLeft -= 1;
      throw failure;
    }
  }

  const api: SyncApi = {
    async registerPlayer(id) {
      await begin('register');
      const isNew = !players.has(id);
      players.add(id);
      return { id, createdAt: 0, isNew };
    },
    async getProgress(id) {
      await begin('get');
      return saves.get(id) ?? null;
    },
    async putProgress(id, progress) {
      await begin('put');
      if (!players.has(id)) throw new SyncApiError('not_found', false, 404);
      const held = saves.get(id);
      if (held && held.updatedAt >= progress.updatedAt) return { applied: false, progress: held };
      saves.set(id, structuredClone(progress));
      return { applied: true, progress };
    },
    async postEvents(id, batch) {
      await begin('events');
      if (!players.has(id)) throw new SyncApiError('not_found', false, 404);
      const known = new Set(events.map((event) => event.id));
      const fresh = batch.filter((event) => !known.has(event.id));
      events.push(...fresh);
      return { accepted: fresh.length };
    },
  };

  return {
    api,
    players,
    saves,
    events,
    calls,
    /** Makes the next `times` calls fail with `error`. */
    fail(error: SyncApiError, times = 1) {
      failure = error;
      failuresLeft = times;
    },
    /** Holds every call until the returned function is called. */
    block() {
      let open = () => {};
      gate = new Promise<void>((resolve) => {
        open = resolve;
      });
      return () => {
        gate = null;
        open();
      };
    },
  };
}

const offline = () => new SyncApiError('network', true);
const serverDown = () => new SyncApiError('server', true, 503);
const refused = () => new SyncApiError('rejected', false, 400);

const scan = (artefactId: string, correct = true) =>
  ({ taskId: 'l1-t1-account-type', kind: 'scan', artefactId, correct }) as const;

describe('a device on its own', () => {
  it('does nothing at all until there is something to sync', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api);

    device.engine.start();
    await device.engine.syncNow();

    expect(server.calls).toEqual([]);
    expect(device.engine.getStatus()).toBe('idle');
    expect(device.time.nextDelay()).toBeNull();
  });

  it('registers, then saves, after a short pause — not on every change', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });

    device.play({ step: 1 });
    device.play({ step: 2 });
    device.play({ step: 3 });
    expect(server.calls).toEqual([]);
    expect(device.time.nextDelay()).toBe(SYNC_DEBOUNCE_MS);

    await device.settle();

    // A player the server has just met has no save to look for: register, then save.
    expect(server.calls).toEqual(['register', 'put']);
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 3 });
    expect(device.engine.getStatus()).toBe('synced');
    expect(device.engine.getState().registered).toBe(true);
  });

  it('keeps its player id, and what it has synced, across visits', async () => {
    const server = createFakeServer();
    const store = createMemorySyncStore();
    const first = createDevice(server.api, { store, playerId: PLAYER });
    first.play({ step: 1 });
    await first.settle();

    // The page is reloaded: a new engine over the same storage.
    server.calls.length = 0;
    const second = createDevice(server.api, { store });
    second.game.set({ step: 1 });
    second.engine.start();
    await second.engine.syncNow();

    expect(second.engine.getState().playerId).toBe(PLAYER);
    // It looks at the server's save once, finds its own, and has nothing to send.
    expect(server.calls).toEqual(['get']);
    expect(second.game.adopted).toEqual([]);
    expect(second.engine.getStatus()).toBe('synced');
  });

  it('gives every change a later time than the last, even if the clock goes backwards', () => {
    const server = createFakeServer();
    const device = createDevice(server.api);

    device.play({ step: 1 });
    const first = device.engine.getState().localUpdatedAt;
    device.time.setNow(device.time.now() - 60_000);
    device.play({ step: 2 });

    expect(device.engine.getState().localUpdatedAt).toBe(first + 1);
  });
});

describe('offline and failing', () => {
  it('waits while offline, and syncs when the device comes back', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.online.value = false;

    device.play({ step: 1 });
    await device.settle();
    expect(server.calls).toEqual([]);
    expect(device.engine.getStatus()).toBe('offline');
    // No timer ticking away while there is no connection to try.
    expect(device.time.nextDelay()).toBeNull();

    device.play({ step: 2 });
    await device.settle();
    expect(server.calls).toEqual([]);

    device.online.value = true;
    device.engine.notifyOnline();
    await device.settle(0);

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 2 });
    expect(device.engine.getStatus()).toBe('synced');
  });

  it('retries a failed sync, waiting twice as long each time, up to a cap', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    server.fail(offline(), 100);

    device.play({ step: 1 });
    await device.settle();
    expect(device.engine.getStatus()).toBe('retrying');

    const delays: number[] = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const delay = device.time.nextDelay();
      if (delay === null) throw new Error('no retry scheduled');
      delays.push(delay);
      await device.settle(delay);
    }

    expect(delays.slice(0, 5)).toEqual([2_000, 4_000, 8_000, 16_000, 32_000]);
    expect(delays[0]).toBe(RETRY_BASE_MS);
    expect(Math.max(...delays)).toBe(RETRY_CAP_MS);
    expect(server.saves.size).toBe(0);
  });

  it('gets there in the end: the save waits on the device until the server takes it', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    server.fail(serverDown(), 3);

    device.play({ step: 1 });
    await device.settle();
    for (let attempt = 0; attempt < 4 && device.engine.getStatus() !== 'synced'; attempt += 1) {
      await device.settle(device.time.nextDelay() ?? 0);
    }

    expect(device.engine.getStatus()).toBe('synced');
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 1 });
    expect(device.time.nextDelay()).toBeNull();
  });

  it('sends the latest save after a failure, not the one that failed', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    server.fail(offline(), 1);

    device.play({ step: 1 });
    await device.settle();
    device.play({ step: 2 });
    await device.settle();

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 2 });
  });

  it('starts the wait over once a sync has succeeded', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    server.fail(offline(), 2);
    device.play({ step: 1 });
    await device.settle();
    await device.settle(device.time.nextDelay() ?? 0);
    await device.settle(device.time.nextDelay() ?? 0);
    expect(device.engine.getStatus()).toBe('synced');

    server.fail(offline(), 1);
    device.play({ step: 2 });
    await device.settle();

    expect(device.time.nextDelay()).toBe(RETRY_BASE_MS);
  });

  it('introduces itself again if the server has forgotten the player', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ step: 1 });
    await device.settle();

    // The server's database is wiped.
    server.players.clear();
    server.saves.clear();
    device.play({ step: 2 });
    await device.settle();
    expect(device.engine.getState().registered).toBe(false);
    await device.settle(device.time.nextDelay() ?? 0);

    expect(server.players.has(PLAYER)).toBe(true);
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 2 });
  });

  it('stops offering a save the server refuses, until the game changes again', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ step: 1 });
    await device.settle();

    server.fail(refused(), 1);
    device.play({ step: 2 });
    await device.settle();
    expect(device.time.nextDelay()).toBeNull();
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 1 });

    device.play({ step: 3 });
    await device.settle();
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 3 });
  });

  it('does not lose a change made while a save was on its way', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ step: 1 });
    await device.settle();

    device.play({ step: 2 });
    const release = server.block();
    device.time.advance(SYNC_DEBOUNCE_MS);
    const inFlight = device.engine.syncNow();
    // The player carries on while the request is out.
    device.play({ step: 3 });
    release();
    await inFlight;
    await device.settle();

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 3 });
    expect(device.engine.getStatus()).toBe('synced');
    expect(device.game.adopted).toEqual([]);
  });
});

describe('conflicts: the newest save wins, whole', () => {
  /** Two devices that share one player — two tabs, or a save carried to another device. */
  function twoDevices() {
    const server = createFakeServer();
    const time = createFakeTime();
    const a = createDevice(server.api, { time, playerId: PLAYER });
    const b = createDevice(server.api, { time, playerId: PLAYER });
    return { server, time, a, b };
  }

  it('adopts the server’s save when it is newer than this device’s', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ from: 'a', step: 1 });
    await a.settle();

    time.advance(60_000);
    b.play({ from: 'b', step: 5 });
    await b.settle();
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'b', step: 5 });

    // A comes back — a reload — and finds B's newer save.
    const reloaded = createDevice(server.api, { time, store: a.store });
    reloaded.game.set({ from: 'a', step: 1 });
    reloaded.engine.start();
    await reloaded.engine.syncNow();

    expect(reloaded.game.snapshot).toEqual({ from: 'b', step: 5 });
    expect(reloaded.game.adopted).toHaveLength(1);
    expect(reloaded.engine.getStatus()).toBe('synced');
    // Adopting a save is not a change of its own: nothing is sent back.
    expect(server.calls.filter((call) => call === 'put')).toHaveLength(2);
  });

  it('replaces the server’s save when this device’s is newer', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ from: 'a', step: 1 });
    await a.settle();
    b.play({ from: 'b', step: 2 });
    await b.settle();

    time.advance(60_000);
    a.play({ from: 'a', step: 9 });
    await a.settle();

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'a', step: 9 });
    expect(a.game.adopted).toEqual([]);
  });

  it('loses an offline change to a save made later elsewhere, and takes that save', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ from: 'a', step: 1 });
    await a.settle();

    // A goes offline and plays on; its change is the older of the two.
    a.online.value = false;
    a.play({ from: 'a', step: 2 });
    time.advance(60_000);
    b.play({ from: 'b', step: 7 });
    await b.settle();

    a.online.value = true;
    a.engine.notifyOnline();
    await a.settle(0);

    // The server was not overwritten by the older change, and A now has what won.
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'b', step: 7 });
    expect(a.game.snapshot).toEqual({ from: 'b', step: 7 });
    expect(a.engine.getStatus()).toBe('synced');
    expect(a.time.nextDelay()).toBeNull();
  });

  it('wins with an offline change that is the later of the two', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ from: 'a', step: 1 });
    await a.settle();

    b.play({ from: 'b', step: 7 });
    await b.settle();
    a.online.value = false;
    time.advance(60_000);
    a.play({ from: 'a', step: 2 });

    a.online.value = true;
    a.engine.notifyOnline();
    await a.settle(0);

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'a', step: 2 });
    expect(a.game.adopted).toEqual([]);
  });

  it('never merges: the losing save is replaced, not blended into the winner', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ solved: ['task-1'], onlyOnA: true });
    await a.settle();
    time.advance(60_000);
    b.play({ solved: ['task-2'] });
    await b.settle();

    const reloaded = createDevice(server.api, { time, store: a.store });
    reloaded.game.set({ solved: ['task-1'], onlyOnA: true });
    await reloaded.engine.syncNow();

    expect(reloaded.game.snapshot).toEqual({ solved: ['task-2'] });
  });

  it('treats its own save coming back as nothing new', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ step: 1 });
    await device.settle();

    // The reply to the first save was lost, as far as the device knows: it sends it again,
    // and the server — which has it already — says "not applied".
    const state = device.engine.getState();
    const store = createMemorySyncStore({ ...state, pushedUpdatedAt: null });
    const retrying = createDevice(server.api, { store, time: device.time });
    retrying.game.set({ step: 1 });
    await retrying.engine.syncNow();

    expect(retrying.game.adopted).toEqual([]);
    expect(retrying.engine.getStatus()).toBe('synced');
    expect(retrying.time.nextDelay()).toBeNull();
  });

  it('goes with the server on an exact tie between two different saves', async () => {
    const { server, a, b } = twoDevices();
    a.play({ from: 'a' });
    b.play({ from: 'b' });
    await a.settle();
    await b.engine.syncNow();

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'a' });
    expect(b.game.snapshot).toEqual({ from: 'a' });
    expect(b.engine.getStatus()).toBe('synced');
  });

  it('leaves the local game alone when the server’s save can’t be read by this build', async () => {
    const { server, time, a, b } = twoDevices();
    a.play({ from: 'a', step: 1 });
    await a.settle();
    time.advance(60_000);
    b.game.version = 2;
    b.play({ from: 'b', madeBy: 'a newer build' });
    await b.settle();

    const reloaded = createDevice(server.api, { time, store: a.store });
    reloaded.game.set({ from: 'a', step: 1 });
    await reloaded.engine.syncNow();

    // Not adopted, not overwritten, and not asked for again and again.
    expect(reloaded.game.snapshot).toEqual({ from: 'a', step: 1 });
    expect(server.saves.get(PLAYER)?.version).toBe(2);
    expect(reloaded.time.nextDelay()).toBeNull();

    // Once this device changes its game, its save is the newest, and wins like any other.
    time.advance(60_000);
    reloaded.play({ from: 'a', step: 2 });
    await reloaded.settle();
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ from: 'a', step: 2 });
  });

  it('gives way when its own clock runs ahead and the server judged its save the older', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ from: 'here' });
    await device.settle();

    // A server that reads this device's far-future time as its own "now" — and already
    // holds something at least that new, from elsewhere.
    const elsewhere = { snapshot: { from: 'elsewhere' }, version: 1, updatedAt: 5_000 };
    server.saves.set(PLAYER, elsewhere);
    const put = server.api.putProgress;
    server.api.putProgress = async () => ({ applied: false, progress: elsewhere });

    device.play({ from: 'here', step: 2 });
    await device.settle();
    server.api.putProgress = put;

    expect(device.game.snapshot).toEqual({ from: 'elsewhere' });
    expect(device.engine.getState().localUpdatedAt).toBe(5_000);
    expect(device.engine.getStatus()).toBe('synced');
    expect(device.time.nextDelay()).toBeNull();
  });
});

describe('events', () => {
  it('sends queued events in one batch, and clears them once the server has them', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });

    device.engine.recordEvent(scan('account-current', false));
    device.engine.recordEvent(scan('account-savings'));
    expect(device.engine.getState().outbox).toHaveLength(2);
    await device.settle();

    expect(server.calls.filter((call) => call === 'events')).toHaveLength(1);
    expect(server.events.map((event) => [event.artefactId, event.correct])).toEqual([
      ['account-current', false],
      ['account-savings', true],
    ]);
    expect(server.events[0]?.ts).toBe(device.time.now() - SYNC_DEBOUNCE_MS);
    expect(device.engine.getState().outbox).toEqual([]);
  });

  it('sends a long queue in batches of fifty', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    for (let n = 0; n < 120; n += 1) device.engine.recordEvent(scan('account-savings'));

    await device.settle();

    expect(server.calls.filter((call) => call === 'events')).toHaveLength(3);
    expect(server.events).toHaveLength(120);
  });

  it('keeps events through a failure and sends each exactly once', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.engine.recordEvent(scan('account-savings'));
    await device.settle();

    server.fail(serverDown(), 1);
    device.engine.recordEvent(scan('id-pan-card'));
    device.engine.recordEvent(scan('id-aadhaar-card'));
    await device.settle();
    expect(device.engine.getState().outbox).toHaveLength(2);

    await device.settle(device.time.nextDelay() ?? 0);

    expect(device.engine.getState().outbox).toEqual([]);
    expect(server.events.map((event) => event.artefactId)).toEqual([
      'account-savings',
      'id-pan-card',
      'id-aadhaar-card',
    ]);
  });

  it('survives a reload with events still waiting', async () => {
    const server = createFakeServer();
    const store = createMemorySyncStore();
    const first = createDevice(server.api, { store, playerId: PLAYER });
    first.online.value = false;
    first.engine.recordEvent(scan('account-savings'));

    const second = createDevice(server.api, { store });
    second.engine.start();
    await second.engine.syncNow();

    expect(server.events).toHaveLength(1);
  });

  it('drops a batch the server refuses, rather than letting it block the queue', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.engine.recordEvent(scan('account-savings'));
    await device.settle();

    server.fail(refused(), 1);
    device.engine.recordEvent(scan('refused-by-server'));
    await device.settle();
    device.engine.recordEvent(scan('id-pan-card'));
    await device.settle();

    expect(device.engine.getState().outbox).toEqual([]);
    expect(server.events.map((event) => event.artefactId)).toEqual([
      'account-savings',
      'id-pan-card',
    ]);
  });

  it('never queues an event that doesn’t fit the contract', () => {
    const server = createFakeServer();
    const device = createDevice(server.api);

    device.engine.recordEvent({ ...scan('account-savings'), taskId: 'Not A Slug' });
    device.engine.recordEvent({ ...scan('account-savings'), artefactId: 'someone@example.com' });
    // @ts-expect-error — a field the contract has no place for.
    device.engine.recordEvent({ ...scan('account-savings'), code: '109' });

    expect(device.engine.getState().outbox).toEqual([]);
  });

  it('keeps only the newest events when the queue is full', () => {
    const server = createFakeServer();
    const device = createDevice(server.api);
    device.online.value = false;

    for (let n = 0; n < MAX_OUTBOX_EVENTS + 10; n += 1) {
      device.engine.recordEvent(scan(`card-${n}`));
    }

    const { outbox } = device.engine.getState();
    expect(outbox).toHaveLength(MAX_OUTBOX_EVENTS);
    expect(outbox[0]?.artefactId).toBe('card-10');
    expect(outbox.at(-1)?.artefactId).toBe(`card-${MAX_OUTBOX_EVENTS + 9}`);
  });
});

describe('hold', () => {
  it('starts no request while held, and catches up when released', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    device.play({ step: 1 });
    await device.settle();
    server.calls.length = 0;

    const release = device.engine.hold();
    device.play({ step: 2 });
    device.engine.recordEvent(scan('account-savings'));
    await device.settle();
    await device.settle(120_000);

    expect(server.calls).toEqual([]);
    expect(device.engine.getStatus()).toBe('paused');

    release();
    await device.settle(0);

    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 2 });
    expect(server.events).toHaveLength(1);
    expect(device.engine.getStatus()).toBe('synced');
  });

  it('stays held until every hold is released, and ignores a second release', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    const first = device.engine.hold();
    const second = device.engine.hold();
    device.play({ step: 1 });

    first();
    first();
    await device.settle();
    expect(server.calls).toEqual([]);

    second();
    await device.settle(0);
    expect(server.saves.get(PLAYER)?.snapshot).toEqual({ step: 1 });
  });
});

describe('status', () => {
  it('tells subscribers as it changes', async () => {
    const server = createFakeServer();
    const device = createDevice(server.api, { playerId: PLAYER });
    const seen: string[] = [];
    const unsubscribe = device.engine.subscribe((status) => seen.push(status));

    device.play({ step: 1 });
    await device.settle();
    unsubscribe();
    device.play({ step: 2 });
    await device.settle();

    expect(seen).toEqual(['syncing', 'synced']);
  });

  it('starts from stored state that says a sync is owed', async () => {
    const server = createFakeServer();
    server.players.add(PLAYER);
    const store = createMemorySyncStore({
      ...createInitialSyncState(PLAYER),
      registered: true,
      localUpdatedAt: 1_000,
    });
    const device = createDevice(server.api, { store });
    device.game.set({ step: 4 });

    device.engine.start();
    await device.engine.syncNow();

    expect(server.saves.get(PLAYER)).toEqual({
      snapshot: { step: 4 },
      version: 1,
      updatedAt: 1_000,
    });
  });
});
