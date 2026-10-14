import type { Progress } from '@app/api-contract';
import type { LocalSave, SyncEngine } from '@app/sync-client';
import { parseGameSave } from '../game/save';
import { telemetryFor } from '../game/telemetry';
import type { GameContext, GameEvent, GameSave } from '../game/types';

/** The parts of the running game that sync needs — narrow, so a test can stand in for it. */
export interface SyncedGame {
  /** The game's persisted snapshot: what is in localStorage, and what goes to the server. */
  getPersistedSnapshot: () => unknown;
  /** The schema version of that snapshot. */
  schemaVersion: number;
  subscribe: (listener: () => void) => { unsubscribe: () => void };
  onEvent: (
    listener: (event: GameEvent, before: GameContext, after: GameContext) => void,
  ) => () => void;
  restore: (save: GameSave) => void;
  isRestoring: () => boolean;
}

/** Reads the game's save in the shape the engine sends. */
export function readLocalSave(game: SyncedGame): LocalSave {
  return {
    snapshot: game.getPersistedSnapshot() as Record<string, unknown>,
    version: game.schemaVersion,
  };
}

/**
 * Takes a save from the server into the running game — if this build can run it. A save with
 * another schema version, or one that doesn't parse as a game, is refused and the game on the
 * device is left as it is.
 */
export function applyRemoteSave(game: SyncedGame, remote: Progress): boolean {
  if (remote.version !== game.schemaVersion) return false;
  const save = parseGameSave(remote.snapshot);
  if (!save) return false;
  game.restore(save);
  return true;
}

/**
 * Connects the game to a sync engine, and returns the function that disconnects it.
 *
 * - Whenever the game's save changes it has already been written to the device (the game does
 *   that itself, at once); the engine is told so that it can send it on.
 * - Each attempt the player makes is queued as an event.
 * - A save that sync itself swapped in is neither: it is not echoed back to the server, and
 *   the tasks it shows as solved are not reported as attempts made here.
 */
export function connectGameToSync(game: SyncedGame, engine: SyncEngine): () => void {
  let lastSave = JSON.stringify(game.getPersistedSnapshot());

  const subscription = game.subscribe(() => {
    const save = JSON.stringify(game.getPersistedSnapshot());
    if (save === lastSave) return;
    lastSave = save;
    if (!game.isRestoring()) engine.notifyLocalChange();
  });

  const stopEvents = game.onEvent((event, before, after) => {
    if (game.isRestoring()) return;
    const telemetry = telemetryFor(event, before, after);
    if (telemetry) engine.recordEvent(telemetry);
  });

  return () => {
    subscription.unsubscribe();
    stopEvents();
  };
}
