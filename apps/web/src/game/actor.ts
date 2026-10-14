import { createActor, type ActorOptions, type InspectionEvent } from 'xstate';
import { gameMachine } from './machine';
import { loadSnapshot, saveSnapshot } from './persistence';
import type { GameContext, GameEvent, GameSave } from './types';

const INSPECT_KEY = 'ssa-inspect';

/**
 * The inspector opens a window to stately.ai — and where popups aren't available it navigates
 * the current tab there instead — so it is opt-in: `?inspect=1` turns it on for the browser tab
 * and `?inspect=0` turns it off.
 */
function inspectorRequested(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('inspect');
    if (param === '1') window.sessionStorage.setItem(INSPECT_KEY, '1');
    if (param === '0') window.sessionStorage.removeItem(INSPECT_KEY);
    return window.sessionStorage.getItem(INSPECT_KEY) === '1';
  } catch {
    return false;
  }
}

// Dev-only, and kept out of Vitest runs (where import.meta.env.DEV is also true). The dynamic
// import keeps the inspector's code out of production bundles entirely, since
// `import.meta.env.DEV` is statically false there.
const inspector =
  import.meta.env.DEV && !import.meta.env.VITEST && inspectorRequested()
    ? (await import('@statelyai/inspect')).createBrowserInspector()
    : undefined;

/** Told about every event the game handles, with its progress before and after. */
export type GameEventListener = (event: GameEvent, before: GameContext, after: GameContext) => void;

const eventListeners = new Set<GameEventListener>();
let lastContext: GameContext | undefined;
let restoring = false;

/**
 * Subscribes to the events the game handles — for things that need to know *what happened*,
 * not just what the state now is. Returns the function that unsubscribes.
 */
export function onGameEvent(listener: GameEventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

function inspect(inspection: InspectionEvent) {
  inspector?.inspect.next?.(inspection);
  // The game has no child actors, so every snapshot here is the game's own.
  if (inspection.type !== '@xstate.snapshot') return;

  const after = (inspection.snapshot as { context?: GameContext }).context;
  if (!after) return;
  const before = lastContext;
  lastContext = after;
  if (!before) return;

  const event = inspection.event as GameEvent;
  for (const listener of eventListeners) listener(event, before, after);
}

const restoredSnapshot = loadSnapshot();

const actorOptions: ActorOptions<typeof gameMachine> = { inspect };
if (restoredSnapshot !== undefined) {
  actorOptions.snapshot = restoredSnapshot as NonNullable<typeof actorOptions.snapshot>;
}

export const gameActor = createActor(gameMachine, actorOptions);

gameActor.subscribe(() => {
  saveSnapshot(gameActor.getPersistedSnapshot());
});

gameActor.start();

/**
 * Replaces the running game with a save made elsewhere — a newer one from the server. It goes
 * through the machine like any other change to progress (CLAUDE.md rule 2), and is saved to
 * the device like any other.
 *
 * While it happens `isRestoring()` is true, so that whoever is listening can tell a game that
 * was swapped in from one the player just played: no result sounds for tasks that were solved
 * somewhere else, and nothing reported or synced back as though it had happened here.
 */
export function restoreGame(save: GameSave): void {
  restoring = true;
  try {
    gameActor.send({ type: 'HYDRATE', save });
  } finally {
    restoring = false;
  }
}

export function isRestoring(): boolean {
  return restoring;
}
