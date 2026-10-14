import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHttpSyncApi, createMemorySyncStore } from '@app/sync-client';
import { createDevice, createFakeTime, type FakeTime } from '@app/sync-client/testing';
import { createApp } from './app';
import { events, players, progress } from './db/schema';
import { createTestDb, type TestDb } from './testing/testDb';

// The web app's sync engine against the real routes and a real (SQLite) database: nothing
// between them is faked except the network itself, which is replaced by calling the app
// directly. If the two sides ever disagree about the contract, this is where it shows.

const PLAYER = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';

let testDb: TestDb;
let time: FakeTime;
let requests: string[];
let api: ReturnType<typeof createHttpSyncApi>;

beforeAll(async () => {
  testDb = await createTestDb();
});

afterAll(async () => {
  await testDb.dispose();
});

beforeEach(async () => {
  await testDb.reset();
  time = createFakeTime();
  requests = [];
  const app = createApp(testDb.db, { allowedOrigins: [], now: time.now });
  api = createHttpSyncApi('http://api.test', async (url, init) => {
    requests.push(`${init?.method} ${new URL(url).pathname}`);
    return app.request(url, init);
  });
});

/** A device playing as PLAYER. Devices made in one test share the clock and the server. */
const device = (options: Parameters<typeof createDevice>[1] = {}) =>
  createDevice(api, { time, playerId: PLAYER, ...options });

async function serverSave() {
  return (await testDb.db.select().from(progress))[0];
}

describe('one device', () => {
  it('registers itself and saves its game', async () => {
    const tablet = device();

    tablet.play({ value: 'inGame', step: 1 });
    await tablet.settle();

    expect(requests).toEqual(['POST /players', `PUT /progress/${PLAYER}`]);
    expect(await testDb.db.select().from(players)).toEqual([
      { id: PLAYER, createdAt: expect.any(Number) },
    ]);
    expect(await serverSave()).toEqual({
      playerId: PLAYER,
      snapshot: { value: 'inGame', step: 1 },
      version: 1,
      updatedAt: tablet.engine.getState().localUpdatedAt,
    });
    expect(tablet.engine.getStatus()).toBe('synced');
  });

  it('sends its events, once each, however the batches fall', async () => {
    const tablet = device();
    for (let n = 0; n < 60; n += 1) {
      tablet.engine.recordEvent({
        taskId: 'l1-t1-account-type',
        kind: 'scan',
        artefactId: n % 2 ? 'account-savings' : 'account-current',
        correct: n % 2 === 1,
      });
    }
    await tablet.settle();
    tablet.engine.recordEvent({
      taskId: 'l3-t3-evidence-passkey',
      kind: 'passkey',
      artefactId: null,
      correct: false,
    });
    await tablet.settle();

    const stored = await testDb.db.select().from(events);
    expect(stored).toHaveLength(61);
    expect(new Set(stored.map((event) => event.id)).size).toBe(61);
    expect(stored.every((event) => event.playerId === PLAYER)).toBe(true);
    expect(stored.filter((event) => event.kind === 'passkey')).toEqual([
      expect.objectContaining({ artefactId: null, correct: false }),
    ]);
    expect(tablet.engine.getState().outbox).toEqual([]);
  });

  it('recovers when the server has lost the player', async () => {
    const tablet = device();
    tablet.play({ step: 1 });
    await tablet.settle();

    await testDb.reset();
    tablet.play({ step: 2 });
    await tablet.settle();
    expect(tablet.engine.getStatus()).toBe('retrying');
    await tablet.settle(tablet.time.nextDelay() ?? 0);

    expect((await serverSave())?.snapshot).toEqual({ step: 2 });
    expect(tablet.engine.getStatus()).toBe('synced');
  });
});

describe('two devices, one player: the newest save wins', () => {
  it('hands the later save to a device that comes back with an older one', async () => {
    const tablet = device();
    const laptop = device();

    tablet.play({ from: 'tablet', step: 1 });
    await tablet.settle();
    time.advance(60_000);
    laptop.play({ from: 'laptop', step: 6 });
    await laptop.settle();

    // The tablet is opened again.
    const reopened = device({ store: tablet.store });
    reopened.game.set({ from: 'tablet', step: 1 });
    reopened.engine.start();
    await reopened.engine.syncNow();

    expect(reopened.game.snapshot).toEqual({ from: 'laptop', step: 6 });
    expect((await serverSave())?.snapshot).toEqual({ from: 'laptop', step: 6 });
  });

  it('does not let an older offline change overwrite a newer save', async () => {
    const tablet = device();
    const laptop = device();
    tablet.play({ from: 'tablet', step: 1 });
    await tablet.settle();

    tablet.online.value = false;
    tablet.play({ from: 'tablet', step: 2 });
    time.advance(60_000);
    laptop.play({ from: 'laptop', step: 9 });
    await laptop.settle();

    tablet.online.value = true;
    tablet.engine.notifyOnline();
    await tablet.settle(0);

    expect((await serverSave())?.snapshot).toEqual({ from: 'laptop', step: 9 });
    expect(tablet.game.snapshot).toEqual({ from: 'laptop', step: 9 });
    expect(tablet.engine.getStatus()).toBe('synced');
  });

  it('lets a later offline change win when it reconnects', async () => {
    const tablet = device();
    const laptop = device();
    tablet.play({ from: 'tablet', step: 1 });
    await tablet.settle();
    laptop.play({ from: 'laptop', step: 9 });
    await laptop.settle();

    tablet.online.value = false;
    time.advance(60_000);
    tablet.play({ from: 'tablet', step: 2 });
    tablet.online.value = true;
    tablet.engine.notifyOnline();
    await tablet.settle(0);

    expect((await serverSave())?.snapshot).toEqual({ from: 'tablet', step: 2 });
    expect(tablet.game.adopted).toEqual([]);
  });

  it('settles on one save when both devices keep playing in turn', async () => {
    const tablet = device();
    const laptop = device();

    for (let round = 1; round <= 4; round += 1) {
      time.advance(5_000);
      tablet.play({ from: 'tablet', round });
      await tablet.settle();
      time.advance(5_000);
      laptop.play({ from: 'laptop', round });
      await laptop.settle();
    }
    // The tablet looks again, as it would on its next visit.
    const tabletAgain = device({ store: tablet.store });
    tabletAgain.game.set(tablet.game.snapshot);
    await tabletAgain.engine.syncNow();

    expect((await serverSave())?.snapshot).toEqual({ from: 'laptop', round: 4 });
    expect(tabletAgain.game.snapshot).toEqual({ from: 'laptop', round: 4 });
    expect(laptop.game.snapshot).toEqual({ from: 'laptop', round: 4 });
  });

  it('settles a device whose clock runs a year ahead, instead of letting it win forever', async () => {
    const YEAR = 365 * 24 * 60 * 60 * 1000;
    const wrongClock = createFakeTime(time.now() + YEAR);
    const tablet = createDevice(api, { time: wrongClock, playerId: PLAYER });
    const laptop = device();

    tablet.play({ from: 'tablet' });
    await tablet.settle();
    // The server kept the save, but not the tablet's idea of when it was made.
    expect((await serverSave())?.updatedAt).toBeLessThan(time.now() + 10 * 60 * 1000);

    time.advance(30 * 60 * 1000);
    laptop.play({ from: 'laptop' });
    await laptop.settle();

    expect((await serverSave())?.snapshot).toEqual({ from: 'laptop' });
    expect(laptop.game.adopted).toEqual([]);
  });

  it('keeps two players’ saves apart', async () => {
    const other = '9d8c7b6a-5f4e-4d3c-9b2a-1f0e9d8c7b6a';
    const mine = device();
    const theirs = device({ playerId: other });

    mine.play({ whose: 'mine' });
    theirs.play({ whose: 'theirs' });
    await mine.settle();
    await theirs.engine.syncNow();

    const saves = await testDb.db.select().from(progress);
    expect(Object.fromEntries(saves.map((save) => [save.playerId, save.snapshot]))).toEqual({
      [PLAYER]: { whose: 'mine' },
      [other]: { whose: 'theirs' },
    });
    expect(mine.game.adopted).toEqual([]);
    expect(theirs.game.adopted).toEqual([]);
  });
});

describe('a device that has never had anything to sync', () => {
  it('makes no requests at all', async () => {
    const tablet = device({ store: createMemorySyncStore() });

    tablet.engine.start();
    await tablet.engine.syncNow();

    expect(requests).toEqual([]);
  });
});
