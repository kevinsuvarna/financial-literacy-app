import { describe, expect, it } from 'vitest';
import {
  contentIdSchema,
  createPlayerBodySchema,
  gameEventSchema,
  MAX_EVENTS_PER_BATCH,
  MAX_SNAPSHOT_BYTES,
  playerIdSchema,
  postEventsBodySchema,
  progressSchema,
  putProgressResponseSchema,
  timestampSchema,
} from './index';

const PLAYER = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';
const event = {
  id: '00000000-0000-4000-8000-000000000001',
  taskId: 'l1-t1-account-type',
  kind: 'scan',
  artefactId: 'account-savings',
  correct: true,
  ts: 1_800_000_000_000,
};

const accepts = (schema: { safeParse: (value: unknown) => { success: boolean } }, value: unknown) =>
  schema.safeParse(value).success;

describe('playerIdSchema', () => {
  it('accepts a v4 UUID — what crypto.randomUUID() makes — and nothing else', () => {
    expect(accepts(playerIdSchema, PLAYER)).toBe(true);
    expect(accepts(playerIdSchema, '9d8c7b6a-5f4e-4d3c-9b2a-1f0e9d8c7b6a')).toBe(true);

    for (const notAnId of [
      '',
      'player-1',
      'ananya',
      'ananya@example.com',
      '3f2b8c1e-4a5d-1e6f-8a9b-0c1d2e3f4a5b', // a v1 UUID: those encode a time and a device
      `${PLAYER} `,
      42,
      null,
    ]) {
      expect(accepts(playerIdSchema, notAnId), String(notAnId)).toBe(false);
    }
  });
});

describe('contentIdSchema', () => {
  it('accepts lower-case slugs', () => {
    for (const id of ['cheque', 'txn-05', 'l3-t1-spot-the-phish', 'balance-answer-7501', 'a']) {
      expect(accepts(contentIdSchema, id), id).toBe(true);
    }
  });

  it('has no room for a name, an address, a number with spaces, or a sentence', () => {
    for (const notAnId of [
      '',
      'Ananya',
      'ananya sharma',
      'ananya@example.com',
      '+91 98765 43210',
      '4111-1111-1111-1111 ',
      'trailing-',
      '-leading',
      'double--dash',
      'under_score',
      'x'.repeat(65),
    ]) {
      expect(accepts(contentIdSchema, notAnId), notAnId).toBe(false);
    }
  });
});

describe('timestampSchema', () => {
  it('accepts whole milliseconds since the epoch', () => {
    expect(accepts(timestampSchema, 0)).toBe(true);
    expect(accepts(timestampSchema, Date.now())).toBe(true);
  });

  it('rejects anything that isn’t one', () => {
    for (const notATime of [-1, 1.5, Number.NaN, Infinity, 9e15, '1800000000000', null]) {
      expect(accepts(timestampSchema, notATime), String(notATime)).toBe(false);
    }
  });
});

describe('createPlayerBodySchema', () => {
  it('takes an id, or nothing', () => {
    expect(accepts(createPlayerBodySchema, {})).toBe(true);
    expect(accepts(createPlayerBodySchema, { id: PLAYER })).toBe(true);
  });

  it('refuses any other field', () => {
    for (const extra of [{ name: 'Ananya' }, { email: 'a@example.com' }, { id: PLAYER, age: 12 }]) {
      expect(accepts(createPlayerBodySchema, extra), JSON.stringify(extra)).toBe(false);
    }
  });
});

describe('progressSchema', () => {
  const progress = { snapshot: { value: 'inGame', context: {} }, version: 1, updatedAt: 1000 };

  it('accepts a save', () => {
    expect(accepts(progressSchema, progress)).toBe(true);
    expect(accepts(putProgressResponseSchema, { applied: false, progress })).toBe(true);
  });

  it('wants the snapshot to be a JSON object', () => {
    for (const snapshot of ['{"value":"inGame"}', 7, null, undefined]) {
      expect(accepts(progressSchema, { ...progress, snapshot }), String(snapshot)).toBe(false);
    }
  });

  it('caps the snapshot’s size', () => {
    const justUnder = { padding: 'x'.repeat(MAX_SNAPSHOT_BYTES - 20) };
    const over = { padding: 'x'.repeat(MAX_SNAPSHOT_BYTES) };

    expect(accepts(progressSchema, { ...progress, snapshot: justUnder })).toBe(true);
    expect(accepts(progressSchema, { ...progress, snapshot: over })).toBe(false);
  });

  it('refuses a missing, mistyped or extra field', () => {
    const { updatedAt: _updatedAt, ...withoutTime } = progress;
    void _updatedAt;

    expect(accepts(progressSchema, withoutTime)).toBe(false);
    expect(accepts(progressSchema, { ...progress, version: 0 })).toBe(false);
    expect(accepts(progressSchema, { ...progress, version: '1' })).toBe(false);
    expect(accepts(progressSchema, { ...progress, owner: 'Ananya' })).toBe(false);
  });
});

describe('gameEventSchema', () => {
  it('accepts an attempt, with or without something that was tried', () => {
    expect(accepts(gameEventSchema, event)).toBe(true);
    expect(accepts(gameEventSchema, { ...event, kind: 'passkey', artefactId: null })).toBe(true);
  });

  it('knows only the kinds of attempt the game has', () => {
    for (const kind of ['scan', 'tap', 'highlight', 'choice', 'passkey', 'report']) {
      expect(accepts(gameEventSchema, { ...event, kind }), kind).toBe(true);
    }
    for (const kind of ['login', 'page_view', 'SCAN', '']) {
      expect(accepts(gameEventSchema, { ...event, kind }), kind).toBe(false);
    }
  });

  it('refuses free text wherever it is put', () => {
    const smuggled = [
      { ...event, taskId: 'Ananya Sharma' },
      { ...event, artefactId: 'ananya@example.com' },
      { ...event, note: 'hello' },
      { ...event, code: '109' },
      { ...event, userAgent: 'SomeBrowser/1.0' },
      { ...event, correct: 'true' },
    ];
    for (const attempt of smuggled) {
      expect(accepts(gameEventSchema, attempt), JSON.stringify(attempt)).toBe(false);
    }
  });
});

describe('postEventsBodySchema', () => {
  const batch = (count: number) => ({
    playerId: PLAYER,
    events: Array.from({ length: count }, (_, n) => ({
      ...event,
      id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    })),
  });

  it('takes between one event and a full batch', () => {
    expect(accepts(postEventsBodySchema, batch(1))).toBe(true);
    expect(accepts(postEventsBodySchema, batch(MAX_EVENTS_PER_BATCH))).toBe(true);
    expect(accepts(postEventsBodySchema, batch(0))).toBe(false);
    expect(accepts(postEventsBodySchema, batch(MAX_EVENTS_PER_BATCH + 1))).toBe(false);
  });

  it('needs to know whose they are, and takes nothing else beside them', () => {
    expect(accepts(postEventsBodySchema, { events: batch(1).events })).toBe(false);
    expect(accepts(postEventsBodySchema, { ...batch(1), device: 'Pixel 9' })).toBe(false);
  });
});
