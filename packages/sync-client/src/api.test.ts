import { describe, expect, it } from 'vitest';
import { createHttpSyncApi, SyncApiError } from './api';
import {
  createInitialSyncState,
  createMemorySyncStore,
  createStorageSyncStore,
  type SyncState,
} from './store';

const PLAYER = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';
const EVENT_ID = '00000000-0000-4000-8000-000000000001';
const progress = { snapshot: { value: 'inGame' }, version: 1, updatedAt: 1_000 };

interface Call {
  url: string;
  init: RequestInit | undefined;
}

/** A fetch that answers every request the same way and remembers what it was asked. */
function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return respond();
  };
  return { calls, fetchImpl };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function failure(promise: Promise<unknown>): Promise<SyncApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof SyncApiError) return error;
    throw error;
  }
  throw new Error('expected the request to fail');
}

describe('createHttpSyncApi', () => {
  it('registers a player with the id the device made', async () => {
    const { calls, fetchImpl } = fakeFetch(() => json({ id: PLAYER, createdAt: 5 }, 201));
    const api = createHttpSyncApi('https://api.example/', fetchImpl);

    expect(await api.registerPlayer(PLAYER)).toEqual({ id: PLAYER, createdAt: 5, isNew: true });
    expect(calls[0]?.url).toBe('https://api.example/players');
    expect(calls[0]?.init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ id: PLAYER });
  });

  it('can tell a player the server already knew from one it has just met', async () => {
    const { fetchImpl } = fakeFetch(() => json({ id: PLAYER, createdAt: 5 }, 200));
    const api = createHttpSyncApi('https://api.example', fetchImpl);

    expect((await api.registerPlayer(PLAYER)).isNew).toBe(false);
  });

  it('sends no cookies, credentials or referrer with anything', async () => {
    const { calls, fetchImpl } = fakeFetch(() => json({ accepted: 1 }, 202));
    const api = createHttpSyncApi('https://api.example', fetchImpl);

    await api.postEvents(PLAYER, [
      {
        id: EVENT_ID,
        taskId: 'l1-t1-account-type',
        kind: 'scan',
        artefactId: 'account-savings',
        correct: true,
        ts: 1,
      },
    ]);

    const init = calls[0]?.init;
    expect(init?.credentials).toBe('omit');
    expect(init?.referrerPolicy).toBe('no-referrer');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(Object.keys(JSON.parse(String(init?.body)))).toEqual(['playerId', 'events']);
  });

  it('reads a save, and reads "no save" as null rather than a failure', async () => {
    const found = fakeFetch(() => json(progress));
    expect(
      await createHttpSyncApi('https://api.example', found.fetchImpl).getProgress(PLAYER),
    ).toEqual(progress);
    expect(found.calls[0]?.url).toBe(`https://api.example/progress/${PLAYER}`);
    expect(found.calls[0]?.init?.body).toBeUndefined();

    const missing = fakeFetch(() => json({ error: 'not_found' }, 404));
    expect(
      await createHttpSyncApi('https://api.example', missing.fetchImpl).getProgress(PLAYER),
    ).toBeNull();
  });

  it('saves with PUT and returns the server’s verdict', async () => {
    const { calls, fetchImpl } = fakeFetch(() => json({ applied: false, progress }));
    const api = createHttpSyncApi('https://api.example', fetchImpl);

    expect(await api.putProgress(PLAYER, progress)).toEqual({ applied: false, progress });
    expect(calls[0]?.init?.method).toBe('PUT');
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(progress);
  });

  it('calls a request that got no answer a network failure, worth retrying', async () => {
    const api = createHttpSyncApi('https://api.example', async () => {
      throw new TypeError('Failed to fetch');
    });
    const error = await failure(api.registerPlayer(PLAYER));

    expect(error.kind).toBe('network');
    expect(error.retryable).toBe(true);
  });

  it('retries a server that is struggling, and not one that said no', async () => {
    const cases = [
      { status: 500, kind: 'server', retryable: true },
      { status: 503, kind: 'server', retryable: true },
      { status: 429, kind: 'server', retryable: true },
      { status: 400, kind: 'rejected', retryable: false },
      { status: 413, kind: 'rejected', retryable: false },
      { status: 404, kind: 'not_found', retryable: false },
    ] as const;

    for (const { status, kind, retryable } of cases) {
      const { fetchImpl } = fakeFetch(() => json({ error: 'x' }, status));
      const error = await failure(
        createHttpSyncApi('https://api.example', fetchImpl).putProgress(PLAYER, progress),
      );
      expect([error.kind, error.retryable, error.status], String(status)).toEqual([
        kind,
        retryable,
        status,
      ]);
    }
  });

  it('does not believe an answer that isn’t what the contract promises', async () => {
    const wrongShape = fakeFetch(() => json({ applied: 'yes', progress }));
    const notJson = fakeFetch(() => new Response('<html>oops</html>', { status: 200 }));
    const extraField = fakeFetch(() => json({ ...progress, owner: 'Ananya' }));

    for (const { fetchImpl } of [wrongShape, notJson]) {
      const error = await failure(
        createHttpSyncApi('https://api.example', fetchImpl).putProgress(PLAYER, progress),
      );
      expect(error.kind).toBe('bad_response');
      expect(error.retryable).toBe(false);
    }
    const error = await failure(
      createHttpSyncApi('https://api.example', extraField.fetchImpl).getProgress(PLAYER),
    );
    expect(error.kind).toBe('bad_response');
  });
});

describe('sync stores', () => {
  const state: SyncState = {
    ...createInitialSyncState(PLAYER),
    registered: true,
    localUpdatedAt: 10,
    pushedUpdatedAt: 10,
  };

  function fakeStorage(initial: Record<string, string> = {}) {
    const items = new Map(Object.entries(initial));
    return {
      items,
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
    };
  }

  it('round-trips state through web storage', () => {
    const storage = fakeStorage();
    createStorageSyncStore(storage).save(state);

    expect(createStorageSyncStore(storage).load()).toEqual(state);
    expect([...storage.items.keys()]).toEqual(['ssa-sync']);
  });

  it('starts over from storage that is empty, broken or not sync state', () => {
    expect(createStorageSyncStore(fakeStorage()).load()).toBeNull();
    for (const raw of [
      '{not json',
      '[]',
      '{"playerId":"not-a-uuid"}',
      JSON.stringify({ ...state, outbox: [{ note: 'hi' }] }),
    ]) {
      expect(createStorageSyncStore(fakeStorage({ 'ssa-sync': raw })).load(), raw).toBeNull();
    }
  });

  it('never throws when storage does', () => {
    const broken = {
      getItem: () => {
        throw new Error('storage is disabled');
      },
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    const store = createStorageSyncStore(broken);

    expect(store.load()).toBeNull();
    expect(() => store.save(state)).not.toThrow();
  });

  it('keeps a memory store’s state apart from whoever saved or loaded it', () => {
    const store = createMemorySyncStore();
    const saved = { ...state, outbox: [] };
    store.save(saved);
    saved.localUpdatedAt = 999;

    const loaded = store.load();
    expect(loaded?.localUpdatedAt).toBe(10);
    if (loaded) loaded.registered = false;
    expect(store.load()?.registered).toBe(true);
  });
});
