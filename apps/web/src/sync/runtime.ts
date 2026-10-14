import {
  createHttpSyncApi,
  createStorageSyncStore,
  createSyncEngine,
  type SyncEngine,
} from '@app/sync-client';
import { gameActor, isRestoring, onGameEvent, restoreGame } from '../game/actor';
import { SCHEMA_VERSION } from '../game/persistence';
import { applyRemoteSave, connectGameToSync, readLocalSave, type SyncedGame } from './gameSync';

/**
 * Local-first sync, switched on by `VITE_API_URL`.
 *
 * The game is complete without it: every change is saved to localStorage the moment it
 * happens, and the game never waits for, or depends on, the network. With an API configured,
 * this sends that save (and a queue of what the player tried) to the server in the background,
 * retrying for as long as it takes, and picks up a newer save if the server has one.
 *
 * What is sent: a random id made on this device, the game's save, and for each attempt the
 * task, what was tried and whether it was right. Nothing that identifies the player — the
 * game never asks for anything that could.
 */
const apiUrl = import.meta.env.VITE_API_URL?.trim();

const game: SyncedGame = {
  getPersistedSnapshot: () => gameActor.getPersistedSnapshot(),
  schemaVersion: SCHEMA_VERSION,
  subscribe: (listener) => gameActor.subscribe(listener),
  onEvent: onGameEvent,
  restore: restoreGame,
  isRestoring,
};

function isOnline(): boolean {
  // Browsers without this, or that get it wrong, are treated as online: a request that then
  // fails is retried like any other.
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function createEngine(url: string): SyncEngine | null {
  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    // No storage, no player id to sync as. The game still works; it just isn't backed up.
    return null;
  }

  return createSyncEngine({
    api: createHttpSyncApi(url),
    store: createStorageSyncStore(storage),
    readLocal: () => readLocalSave(game),
    applyRemote: (remote) => applyRemoteSave(game, remote),
    now: Date.now,
    isOnline,
    newId: () => crypto.randomUUID(),
    schedule(callback, delayMs) {
      const timer = setTimeout(callback, delayMs);
      return () => clearTimeout(timer);
    },
  });
}

// Never in unit tests: components that import this must not start talking to a server.
const engine = apiUrl && !import.meta.env.VITEST ? createEngine(apiUrl) : null;
let started = false;

/** Starts background sync, if an API is configured. Safe to call more than once. */
export function startSync(): void {
  if (!engine || started) return;
  started = true;

  connectGameToSync(game, engine);
  window.addEventListener('online', () => engine.notifyOnline());
  // The last chance before a tab is closed or put away: send what is waiting.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void engine.syncNow();
  });
  engine.start();
}

/**
 * Keeps sync from starting any request until the returned function is called. For a screen
 * that promises the player nothing is being sent while it is open — the simulated phishing
 * page — so that the promise holds for the whole app, not just for that screen.
 */
export function holdSync(): () => void {
  return engine ? engine.hold() : () => {};
}

/** The sync engine, for the debug panel. Null when no API is configured. */
export function getSyncEngine(): SyncEngine | null {
  return engine;
}
