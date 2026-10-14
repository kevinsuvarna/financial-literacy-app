import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  errorResponseSchema,
  MAX_EVENTS_PER_BATCH,
  MAX_SNAPSHOT_BYTES,
  playerSchema,
  postEventsResponseSchema,
  progressSchema,
  putProgressResponseSchema,
  type GameEvent,
} from '@app/api-contract';
import { createApp, parseOrigins } from './app';
import { events, players, progress } from './db/schema';
import { createTestDb, type TestDb } from './testing/testDb';

const WEB = 'https://game.example';
const NOW = 1_800_000_000_000;

const PLAYER = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';
const OTHER_PLAYER = '9d8c7b6a-5f4e-4d3c-9b2a-1f0e9d8c7b6a';
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

let testDb: TestDb;
let clock: number;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  testDb = await createTestDb();
});

afterAll(async () => {
  await testDb.dispose();
});

beforeEach(async () => {
  await testDb.reset();
  clock = NOW;
  app = createApp(testDb.db, {
    allowedOrigins: [WEB],
    now: () => clock,
    newId: () => PLAYER,
  });
});

function send(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function register(id = PLAYER) {
  const response = await send('POST', '/players', { id });
  expect(response.status).toBeLessThan(300);
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  const body = errorResponseSchema.parse(await response.json());
  expect(body.error).toBe(code);
  return body;
}

const snapshot = (label: string) => ({ value: 'inGame', context: { viewedTaskId: label } });

function gameEvent(n: number, overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: uuid(n),
    taskId: 'l1-t1-account-type',
    kind: 'scan',
    artefactId: 'account-savings',
    correct: true,
    ts: NOW + n,
    ...overrides,
  };
}

describe('GET /health', () => {
  it('answers when the database does', async () => {
    const response = await send('GET', '/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe('POST /players', () => {
  it('makes a player with a new id when none is given', async () => {
    const response = await send('POST', '/players');

    expect(response.status).toBe(201);
    expect(playerSchema.parse(await response.json())).toEqual({ id: PLAYER, createdAt: NOW });
  });

  it('accepts an empty JSON object the same way', async () => {
    const response = await send('POST', '/players', {});
    expect(response.status).toBe(201);
  });

  it('registers an id the device made for itself', async () => {
    const response = await send('POST', '/players', { id: OTHER_PLAYER });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: OTHER_PLAYER, createdAt: NOW });
  });

  it('is idempotent: registering again returns the player as first created', async () => {
    await send('POST', '/players', { id: OTHER_PLAYER });
    clock = NOW + 60_000;
    const again = await send('POST', '/players', { id: OTHER_PLAYER });

    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ id: OTHER_PLAYER, createdAt: NOW });
    expect(await testDb.db.select().from(players)).toHaveLength(1);
  });

  it('stores an id and a time — nothing else', async () => {
    await send('POST', '/players', undefined, {
      'User-Agent': 'SomeBrowser/1.0',
      'X-Forwarded-For': '203.0.113.7',
    });

    const rows = await testDb.db.select().from(players);
    expect(rows).toEqual([{ id: PLAYER, createdAt: NOW }]);
  });

  it('rejects an id that is not a v4 UUID', async () => {
    for (const id of ['abc', '', 42, 'ananya@example.com', uuid(1).replace('-4', '-1')]) {
      await expectError(await send('POST', '/players', { id }), 400, 'invalid_request');
    }
    expect(await testDb.db.select().from(players)).toHaveLength(0);
  });

  it('rejects anything it was not asked for, such as a name or an email address', async () => {
    for (const extra of [{ name: 'Ananya' }, { email: 'a@example.com' }, { id: PLAYER, age: 12 }]) {
      const body = await expectError(await send('POST', '/players', extra), 400, 'invalid_request');
      // The answer says which key was wrong, and does not repeat what was in it.
      expect(JSON.stringify(body)).not.toMatch(/Ananya|example\.com/);
    }
    expect(await testDb.db.select().from(players)).toHaveLength(0);
  });

  it('rejects a body that is not JSON', async () => {
    await expectError(await send('POST', '/players', '{not json'), 400, 'invalid_request');
  });
});

describe('GET /progress/:id', () => {
  it('is not found for a player with nothing saved, and for a player who does not exist', async () => {
    await register();

    await expectError(await send('GET', `/progress/${PLAYER}`), 404, 'not_found');
    await expectError(await send('GET', `/progress/${OTHER_PLAYER}`), 404, 'not_found');
  });

  it('rejects an id that is not a UUID', async () => {
    await expectError(await send('GET', '/progress/not-a-uuid'), 400, 'invalid_request');
  });

  it('returns what was saved', async () => {
    await register();
    await send('PUT', `/progress/${PLAYER}`, {
      snapshot: snapshot('a'),
      version: 1,
      updatedAt: NOW - 500,
    });

    const response = await send('GET', `/progress/${PLAYER}`);
    expect(response.status).toBe(200);
    expect(progressSchema.parse(await response.json())).toEqual({
      snapshot: snapshot('a'),
      version: 1,
      updatedAt: NOW - 500,
    });
  });
});

describe('PUT /progress/:id — last write wins, by updatedAt', () => {
  async function put(label: string, updatedAt: number, id = PLAYER, version = 1) {
    const response = await send('PUT', `/progress/${id}`, {
      snapshot: snapshot(label),
      version,
      updatedAt,
    });
    expect(response.status).toBe(200);
    return putProgressResponseSchema.parse(await response.json());
  }

  beforeEach(async () => {
    await register();
  });

  it('stores the first save', async () => {
    const result = await put('first', NOW - 1000);

    expect(result).toEqual({
      applied: true,
      progress: { snapshot: snapshot('first'), version: 1, updatedAt: NOW - 1000 },
    });
  });

  it('replaces a save with a newer one', async () => {
    await put('older', NOW - 1000);
    const result = await put('newer', NOW - 500, PLAYER, 2);

    expect(result.applied).toBe(true);
    expect(result.progress).toEqual({
      snapshot: snapshot('newer'),
      version: 2,
      updatedAt: NOW - 500,
    });
    expect(await (await send('GET', `/progress/${PLAYER}`)).json()).toEqual(result.progress);
  });

  it('keeps the save it has when an older one arrives, and hands back the one it kept', async () => {
    await put('newer', NOW - 500);
    const result = await put('older', NOW - 1000);

    expect(result).toEqual({
      applied: false,
      progress: { snapshot: snapshot('newer'), version: 1, updatedAt: NOW - 500 },
    });
    expect(await (await send('GET', `/progress/${PLAYER}`)).json()).toEqual(result.progress);
  });

  it('keeps the save it has on a tie, so a repeated request changes nothing', async () => {
    await put('first', NOW - 500);
    const tie = await put('second', NOW - 500);

    expect(tie.applied).toBe(false);
    expect(tie.progress.snapshot).toEqual(snapshot('first'));
  });

  it('decides between two saves by their time, whichever order they arrive in', async () => {
    const early = { label: 'early', at: NOW - 2000 };
    const late = { label: 'late', at: NOW - 1000 };

    for (const order of [
      [early, late],
      [late, early],
    ]) {
      await testDb.db.delete(progress);
      for (const save of order) await put(save.label, save.at);

      const held = progressSchema.parse(await (await send('GET', `/progress/${PLAYER}`)).json());
      expect(held.snapshot).toEqual(snapshot('late'));
    }
  });

  it('treats a time from a clock set far ahead as "now", so it can’t win forever', async () => {
    const wayAhead = await put('bad clock', NOW + 365 * 24 * 60 * 60 * 1000);
    expect(wayAhead.applied).toBe(true);
    expect(wayAhead.progress.updatedAt).toBe(NOW + 5 * 60 * 1000);

    // Ten minutes later, an honest save is newer than that.
    clock = NOW + 10 * 60 * 1000;
    const honest = await put('good clock', clock);
    expect(honest.applied).toBe(true);
    expect(honest.progress.snapshot).toEqual(snapshot('good clock'));
  });

  it('keeps each player’s save separate', async () => {
    await register(OTHER_PLAYER);
    await put('mine', NOW - 100);
    await put('theirs', NOW - 900, OTHER_PLAYER);

    const mine = progressSchema.parse(await (await send('GET', `/progress/${PLAYER}`)).json());
    const theirs = progressSchema.parse(
      await (await send('GET', `/progress/${OTHER_PLAYER}`)).json(),
    );
    expect(mine.snapshot).toEqual(snapshot('mine'));
    expect(theirs.snapshot).toEqual(snapshot('theirs'));
  });

  it('is not found for a player who was never registered', async () => {
    const response = await send('PUT', `/progress/${OTHER_PLAYER}`, {
      snapshot: snapshot('x'),
      version: 1,
      updatedAt: NOW,
    });

    await expectError(response, 404, 'not_found');
    expect(await testDb.db.select().from(progress)).toHaveLength(0);
  });

  it('rejects a body with anything missing, mistyped or extra', async () => {
    const good = { snapshot: snapshot('x'), version: 1, updatedAt: NOW };
    const bad: unknown[] = [
      {},
      { ...good, snapshot: 'a string' },
      { ...good, snapshot: [1, 2, 3] },
      { ...good, snapshot: null },
      { ...good, version: 0 },
      { ...good, version: 1.5 },
      { ...good, updatedAt: -1 },
      { ...good, updatedAt: '2026-01-01' },
      { ...good, playerName: 'Ananya' },
      { snapshot: good.snapshot, version: 1 },
    ];

    for (const body of bad) {
      await expectError(await send('PUT', `/progress/${PLAYER}`, body), 400, 'invalid_request');
    }
    expect(await testDb.db.select().from(progress)).toHaveLength(0);
  });

  it('rejects a snapshot that is too big to be a saved game', async () => {
    const response = await send('PUT', `/progress/${PLAYER}`, {
      snapshot: { padding: 'x'.repeat(MAX_SNAPSHOT_BYTES) },
      version: 1,
      updatedAt: NOW,
    });

    await expectError(response, 400, 'invalid_request');
  });

  it('refuses a body far bigger than anything the game sends, before reading it', async () => {
    const response = await send('PUT', `/progress/${PLAYER}`, 'x'.repeat(300 * 1024));
    await expectError(response, 413, 'payload_too_large');
  });
});

describe('POST /events', () => {
  beforeEach(async () => {
    await register();
  });

  async function post(batch: unknown[], playerId: string = PLAYER) {
    return send('POST', '/events', { playerId, events: batch });
  }

  it('stores a batch', async () => {
    const batch = [
      gameEvent(1, { artefactId: 'account-current', correct: false }),
      gameEvent(2),
      gameEvent(3, { taskId: 'l3-t3-evidence-passkey', kind: 'passkey', artefactId: null }),
    ];
    const response = await post(batch);

    expect(response.status).toBe(202);
    expect(postEventsResponseSchema.parse(await response.json())).toEqual({ accepted: 3 });

    const rows = await testDb.db.select().from(events).orderBy(events.ts);
    expect(rows).toEqual(batch.map((event) => ({ ...event, playerId: PLAYER })));
  });

  it('stores a full batch — more rows than fit in one statement', async () => {
    const batch = Array.from({ length: MAX_EVENTS_PER_BATCH }, (_, n) => gameEvent(n));
    const response = await post(batch);

    expect(await response.json()).toEqual({ accepted: MAX_EVENTS_PER_BATCH });
    expect(await testDb.db.select().from(events)).toHaveLength(MAX_EVENTS_PER_BATCH);
  });

  it('stores an event once, however many times its batch is delivered', async () => {
    const batch = [gameEvent(1), gameEvent(2)];
    await post(batch);
    const retry = await post([...batch, gameEvent(3)]);

    expect(await retry.json()).toEqual({ accepted: 1 });
    expect(await testDb.db.select().from(events)).toHaveLength(3);
  });

  it('is not found for a player who was never registered, and stores nothing', async () => {
    await expectError(await post([gameEvent(1)], OTHER_PLAYER), 404, 'not_found');
    expect(await testDb.db.select().from(events)).toHaveLength(0);
  });

  it('rejects an empty batch and one over the limit', async () => {
    await expectError(await post([]), 400, 'invalid_request');

    const tooMany = Array.from({ length: MAX_EVENTS_PER_BATCH + 1 }, (_, n) => gameEvent(n));
    await expectError(await post(tooMany), 400, 'invalid_request');
    expect(await testDb.db.select().from(events)).toHaveLength(0);
  });

  it('rejects the whole batch if any event in it is wrong', async () => {
    const bad: unknown[] = [
      { ...gameEvent(2), kind: 'login' },
      { ...gameEvent(2), id: 'not-a-uuid' },
      { ...gameEvent(2), correct: 'yes' },
      { ...gameEvent(2), ts: '2026-01-01T00:00:00Z' },
      { ...gameEvent(2), artefactId: undefined },
      { id: uuid(2), taskId: 'l1-t1-account-type' },
    ];

    for (const event of bad) {
      await expectError(await post([gameEvent(1), event]), 400, 'invalid_request');
    }
    expect(await testDb.db.select().from(events)).toHaveLength(0);
  });

  it('has nowhere to put free text: ids must be slugs, and extra fields are refused', async () => {
    const smuggled: unknown[] = [
      { ...gameEvent(1), taskId: 'Ananya Sharma' },
      { ...gameEvent(1), taskId: 'ananya@example.com' },
      { ...gameEvent(1), artefactId: '4111 1111 1111 1111' },
      { ...gameEvent(1), artefactId: 'x'.repeat(65) },
      { ...gameEvent(1), note: 'my name is Ananya' },
      { ...gameEvent(1), code: '109' },
      { ...gameEvent(1), userAgent: 'SomeBrowser/1.0' },
    ];

    for (const event of smuggled) {
      const body = await expectError(await post([event]), 400, 'invalid_request');
      expect(JSON.stringify(body)).not.toMatch(/Ananya|example\.com|4111|SomeBrowser/);
    }
    expect(await testDb.db.select().from(events)).toHaveLength(0);
  });

  it('refuses extra fields beside the batch too', async () => {
    const response = await send('POST', '/events', {
      playerId: PLAYER,
      events: [gameEvent(1)],
      device: 'Pixel 9',
    });
    await expectError(response, 400, 'invalid_request');
  });

  it('removes a player’s events and save with the player', async () => {
    await post([gameEvent(1)]);
    await send('PUT', `/progress/${PLAYER}`, {
      snapshot: snapshot('x'),
      version: 1,
      updatedAt: NOW,
    });

    // Foreign keys are enforced by D1; libSQL needs asking.
    await testDb.db.run('pragma foreign_keys = on');
    await testDb.db.delete(players).where(eq(players.id, PLAYER));

    expect(await testDb.db.select().from(events)).toHaveLength(0);
    expect(await testDb.db.select().from(progress)).toHaveLength(0);
  });
});

describe('CORS', () => {
  it('lets the web app’s origin read the answer', async () => {
    const response = await send('GET', '/health', undefined, { Origin: WEB });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(WEB);
  });

  it('gives any other origin no CORS headers, so a browser discards the answer', async () => {
    for (const origin of ['https://evil.example', 'http://game.example', `${WEB}.evil.example`]) {
      const response = await send('GET', '/health', undefined, { Origin: origin });
      expect(response.headers.get('Access-Control-Allow-Origin'), origin).toBeNull();
    }
  });

  it('answers the preflight for a JSON request from the web app', async () => {
    const response = await app.request(`/progress/${PLAYER}`, {
      method: 'OPTIONS',
      headers: {
        Origin: WEB,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(WEB);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
    expect(response.headers.get('Access-Control-Allow-Headers')).toMatch(/content-type/i);
    // No cookies or credentials are involved, so none are allowed.
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });

  it('does not answer the preflight for another origin', async () => {
    const response = await app.request('/events', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('parseOrigins', () => {
  it('splits a comma-separated list, trimming spaces and trailing slashes', () => {
    expect(parseOrigins(' https://a.example/ , http://localhost:5173,, ')).toEqual([
      'https://a.example',
      'http://localhost:5173',
    ]);
  });

  it('allows nothing when it is unset', () => {
    expect(parseOrigins(undefined)).toEqual([]);
    expect(parseOrigins('')).toEqual([]);
  });
});

describe('everything else', () => {
  it('is not found', async () => {
    await expectError(await send('GET', '/players'), 404, 'not_found');
    await expectError(await send('DELETE', `/progress/${PLAYER}`), 404, 'not_found');
    await expectError(await send('GET', '/events'), 404, 'not_found');
  });
});
