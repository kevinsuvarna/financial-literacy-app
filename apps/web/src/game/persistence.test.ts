import { beforeEach, describe, expect, it } from 'vitest';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './persistence';

const STORAGE_KEY = 'ssa-game';

beforeEach(() => {
  window.localStorage.clear();
});

describe('persistence', () => {
  it('returns undefined when nothing has been saved yet', () => {
    expect(loadSnapshot()).toBeUndefined();
  });

  it('round-trips a saved snapshot', () => {
    const snapshot = { value: 'inGame', context: { viewedTaskId: 'l1-t1-account-type' } };
    saveSnapshot(snapshot);

    expect(loadSnapshot()).toEqual(snapshot);
  });

  it('wraps the snapshot in a versioned envelope', () => {
    saveSnapshot({ hello: 'world' });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed).toEqual({ version: 1, snapshot: { hello: 'world' } });
  });

  it('discards a snapshot saved under a different schema version', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, snapshot: { anything: true } }),
    );

    expect(loadSnapshot()).toBeUndefined();
  });

  it('discards corrupted JSON without throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');

    expect(() => loadSnapshot()).not.toThrow();
    expect(loadSnapshot()).toBeUndefined();
  });

  it('discards a value that is not a persisted envelope', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ unrelated: true }));

    expect(loadSnapshot()).toBeUndefined();
  });

  it('clearSnapshot removes the stored key', () => {
    saveSnapshot({ value: 'inGame' });
    clearSnapshot();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadSnapshot()).toBeUndefined();
  });
});
